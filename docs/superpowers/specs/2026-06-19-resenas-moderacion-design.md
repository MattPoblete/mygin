# Reseñas con moderación — Diseño (Oleada 2, parte 1)

Fecha: 2026-06-19. Estado: aprobado, pendiente de plan de implementación.

## Objetivo

Que un cliente anónimo (nombre + email, sin login) deje una reseña con estrellas en
la página de producto. La reseña queda `pending`, el admin la modera, y al aprobarla
se publica en el PDP y actualiza el rating agregado del producto.

Cubre el ítem "Comentarios / Reseñas con moderación" de la Oleada 2 en `tasks.md`,
limitado a **reseñas de producto** (los comentarios de blog quedan diferidos por YAGNI;
el esquema los admite sin retrabajo).

## Contexto existente (no reinventar)

- `Product` ya tiene `ratingSum?` / `ratingCount?` (`lib/types.ts:46-47`).
- `firestore.rules:50-62` ya define la colección `comments`: create público forzado a
  `status:'pending'`, read público solo de `approved`, update/delete solo admin.
- `producto/[slug]/page.tsx:217-219` tiene un placeholder donde irán las reseñas.
- `ContactForm` (`components/marketing/ContactForm.tsx`) escribe directo a Firestore con
  `addDoc`, validación client-side, sin callable. Las reseñas siguen ese patrón.
- Las Cloud Functions **no están desplegadas** (el proyecto corre en plan gratuito Spark,
  backend en Next API routes). Por eso la agregación de rating NO usa un trigger.
- Patrón admin CRUD: `app/admin/blog/` (lista + form), guard vía `AdminGate`, nav
  hardcodeado en `AdminShell.tsx`.

## Decisión central: agregación al aprobar (enfoque B)

El rating agregado se mantiene **al moderar**, no en una Cloud Function (descartada por
Spark) ni calculándolo al leer. Cuando el admin aprueba, una transacción del SDK cliente
(el admin está autenticado; las rules ya permiten admin→`products`) incrementa los campos
`ratingSum`/`ratingCount` ya existentes en el producto.

La idempotencia se garantiza con un flag `counted` en el comentario: solo se incrementa si
`!counted`, solo se decrementa si `counted`. Así aprobar/des-aprobar repetido no
doble-cuenta.

## Modelo de datos

Colección plana `comments` (ya en las rules). Documento:

```
productId: string          // docId del producto
productSlug: string        // para enlazar/mostrar sin otra lectura
rating: number             // 1..5
authorName: string
authorEmail: string        // privado, nunca se renderiza público
body: string               // 1..2000 chars
status: 'pending' | 'approved' | 'rejected'
counted: boolean           // guarda de idempotencia de la agregación
createdAt: serverTimestamp
approvedAt?: serverTimestamp
```

Preparado para blog después con `target: 'product' | 'blog'` + `postId`; no se implementa
ahora.

`lib/types.comment.ts` exporta el tipo `Comment` (incluye `rating`).

## Componentes

### Form público — `components/shop/ReviewForm.tsx` (client)
Calcado de `ContactForm`: selector de estrellas 1–5, nombre, email, texto. `addDoc` a
`comments` con `status:'pending'`, `counted:false`, `createdAt: serverTimestamp()`.
Validación client-side: rating 1–5 requerido, nombre/email/body no vacíos, email por regex,
body ≤ 2000. Estados idle → sending → success/error; success ofrece "Escribir otra reseña"
y avisa que pasa por moderación.

### Reglas — `firestore.rules`
Ajustar la validación de `create` en `comments` para exigir `rating` entero 1–5, `body`
string no vacío y ≤ 2000, `status == 'pending'`, `counted == false`. Read público sigue
limitado a `status == 'approved'`. Update/delete solo admin (sin cambios).

### Agregación — `lib/comments.ts`
- `listComments(status?)` — para el admin.
- `approveComment(id)` — transacción: lee comment + product; si `!counted` →
  `product.ratingSum += rating`, `product.ratingCount += 1`, comment `{status:'approved',
  counted:true, approvedAt}`.
- `rejectComment(id)` — transacción: si `counted` → `product.ratingSum -= rating`,
  `product.ratingCount -= 1`, comment `{status:'rejected', counted:false}`.
- `deleteComment(id)` — solo borra el doc. La UI solo lo ofrece para comentarios NO
  aprobados (`counted == false`), evitando un segundo camino que tenga que decrementar.
  Para quitar uno aprobado: rechazar (decrementa) y luego borrar.

### Admin — `app/admin/comentarios/page.tsx`
Lista con los `pending` arriba, luego aprobados/rechazados. Por fila: producto, estrellas,
autor, extracto, fecha. Acciones: Aprobar / Rechazar; Borrar solo si no aprobado.
`SavedFlash` para feedback. Agregar "Comentarios" al nav hardcodeado de `AdminShell.tsx`.

### PDP — `producto/[slug]/page.tsx`
En el placeholder (líneas 217-219):
- Estrellas promedio = `ratingSum / ratingCount` (si `ratingCount > 0`) + el conteo.
- Lista de reseñas aprobadas: query `comments where productId == X && status ==
  'approved' orderBy createdAt desc`. Renderiza nombre, estrellas, fecha, body. **Nunca**
  el email.
- El `ReviewForm` debajo.

Es server component con `revalidate: 300`; la lista entra en ese cache.

### Índice — `firestore.indexes.json`
Índice compuesto para `comments`: `productId ASC, status ASC, createdAt DESC`.

## Testing

Un e2e (Playwright + emulador) en `e2e/`:
1. Enviar una reseña desde el PDP → confirma mensaje de moderación.
2. La reseña NO aparece en el PDP (sigue `pending`).
3. Aprobar en `/admin/comentarios` → aparece en el PDP con sus estrellas, y el promedio
   refleja el nuevo voto.
4. Re-aprobar la misma reseña no incrementa `ratingCount` dos veces (guarda `counted`).

## Fuera de alcance (YAGNI)

- Cloud Function de agregación (incompatible con Spark; se usa transacción client-side).
- Comentarios de blog (esquema lo admite; no se cablea el form ni el render).
- Edición del rating de una reseña ya aprobada (rechazar + recrear si hace falta).
- App Check / reCAPTCHA en el form público — va en la parte de endurecimiento de
  seguridad de la Oleada 2, en un spec aparte.
