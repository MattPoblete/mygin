# Endurecimiento de seguridad — Diseño (Oleada 2, parte 2)

Fecha: 2026-06-19. Estado: aprobado, pendiente de plan de implementación.

## Objetivo

Cerrar el ítem "Seguridad — endurecimiento final" de la Oleada 2, acotado a lo que es
100% código + emulador (sin setup operativo del usuario): índices compuestos faltantes,
endurecer los `create` públicos de Firestore, y un test que verifique que el checkout no
sobre-vende bajo concurrencia.

**App Check queda diferido** (necesita claves reCAPTCHA + enforcement en consola, y no
cubre el checkout porque las API routes usan el Admin SDK, que bypassa App Check).

## Contexto verificado (no reinventar)

- El checkout **ya es transaccional y correcto**: `createOrderServer`
  (`lib/server/checkout.ts:161-228`) valida `available = stock - stockReserved` DENTRO de
  `adminDb.runTransaction` (líneas 181-187) y reserva con `FieldValue.increment` (207).
  El test de overselling lo **verifica**, no lo arregla.
- `app/api/checkout/create-order/route.ts` recibe `{ items, customer, couponCode }`,
  responde 200 `{ orderId, redirectUrl }` o, vía `CheckoutError`, 409 con `{ error }`.
- Body de create-order: `items: [{ productId, qty }]`,
  `customer: { name, email, phone, address: { region, comuna, calle } }`.
- Reglas: deny-by-default; bloques de orders/coupons/products/blogPosts ya estrictos.
  Los `create` públicos (`comments`, `contactSubmissions`) validan campos requeridos pero
  **no restringen campos extra**.

## Cambios

### 1. Índices compuestos faltantes — `firestore.indexes.json`
Dos queries `where(igualdad) + orderBy(otro campo)` requieren índice compuesto; hoy no
están declaradas (el emulador las ignora, producción falla):
- `teamMembers`: `active ASC, order ASC` — `app/(marketing)/equipo/page.tsx:57`.
- `blogPosts`: `status ASC, publishedAt DESC` — `lib/blog.ts:48-49` (posts publicados).

### 2. Endurecer `create` públicos — `firestore.rules`
Agregar allowlist de claves (`request.resource.data.keys().hasOnly([...])`) + topes de
tamaño, sin alterar el happy-path (los forms escriben exactamente esas claves):

- **`comments.create`** — `hasOnly(['productId','productSlug','rating','authorName',
  'authorEmail','body','status','counted','createdAt'])`; además `authorName.size() <= 120`
  y `authorEmail.size() <= 200`. (Ya valida: `status=='pending'`, `counted==false`,
  `productId` string, `rating` int 1..5, `body` 1..2000, author* string no vacío.)
- **`contactSubmissions.create`** — `hasOnly(['name','email','phone','company','message',
  'type','status','createdAt','userAgent'])`; además `name.size() <= 120` y
  `message.size() <= 5000`. `hasOnly` admite subconjuntos, así que los opcionales
  ausentes (phone/company) no rompen. (Ya valida: `email` string, `message` no vacío,
  `status=='new'`.)

### 3. Test de overselling — `e2e/overselling.spec.ts` (nuevo)
Usa el fixture `request` de Playwright (sin página) contra el `next dev` + emulador que ya
levanta `scripts/run-e2e.mjs`. Dispara `Promise.all` de **N create-order en paralelo**
(qty 1) sobre un producto de stock conocido. Asserts:
- nº de respuestas 200 **=== stock exacto** del producto.
- nº de respuestas 409 **=== N − stock**.
- **cero respuestas 500**: la transacción resuelve la contención sin romperse.

Con N modesto (p. ej. 8 contra stock 5) la contención es manejable; el Admin SDK reintenta
transacciones automáticamente.

### 4. Producto dedicado para el test — `scripts/seed-emulator.mjs`
Sembrar `mygin-concurrencia` (`active: true`, `stock: 5`, `stockReserved: 0`) para aislar
el test: reservar su stock no debe interferir con specs que leen stock de otros productos
(`product.spec` usa `mygin-edicion-limitada`). **Verificar primero** que `smoke.spec` y
`catalog.spec` asserten *presencia* y no *conteo exacto* de productos; si alguno cuenta
exacto, ajustar esa aserción.

## Verificación

- `pnpm build` limpio.
- `pnpm test:e2e` verde: los 104 existentes + `overselling.spec.ts`. El happy-path verde de
  `contact.spec` y `resenas.spec` confirma que el `hasOnly` no rompió escrituras legítimas.
- Manual opcional: `firebase deploy --only firestore:indexes,firestore:rules` en el proyecto
  real (operativo del usuario; ver Cierre).

## Fuera de alcance (YAGNI)

- **App Check / reCAPTCHA** en writes públicos — operativo (consola), no cubre el checkout.
- Test que *rechace* escrituras con campos extra — necesitaría `@firebase/rules-unit-testing`
  (dependencia nueva); el happy-path verde cubre la no-regresión.
- Optimización del índice de `expire-orders` (filtra en código hoy; sin riesgo de seguridad).

## Cierre

- Actualizar `tasks.md`: marcar "Seguridad — endurecimiento final" como ✅ en su parte de
  código, dejando App Check explícitamente diferido.
- **Operativo (usuario):** `firebase deploy --only firestore:indexes,firestore:rules` para
  publicar los índices nuevos y las reglas endurecidas en el proyecto `theirgin`.
