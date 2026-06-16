# MyGin — Tareas

Documento vivo del avance. Plan completo:
`~/.claude/plans/necesito-que-analices-requirements-md-sleepy-sparrow.md`.

Convención de estado: ✅ hecho · 🔄 en progreso · ⬜ pendiente.
El desarrollo se organiza en **oleadas** (worktrees paralelos); ver "Estrategia de
paralelización" en el plan.

---

## ✅ Oleada 0 — Fundación (completa)

Establece los contratos compartidos de los que dependen todas las features.

- ✅ **Migración a Next.js** — App Router + TS + Tailwind v4. Landing portada fielmente
  (`app/`, `components/sections/`, `components/nav/`, `content/site.ts`).
- ✅ **Firebase wiring** — `lib/firebase/client.ts` (Firestore+Auth+Analytics),
  `lib/firebase/admin.ts` (Admin SDK server-only).
- ✅ **Auth + custom claims** — `lib/firebase/auth-context.tsx`, `AdminGate`,
  `scripts/set-admin-claim.mjs`.
- ✅ **Admin shell + CRUD productos** — `app/admin/*`, `lib/products.ts`, `ProductForm`.
- ✅ **Modelo de datos base** — `lib/types.ts` (Product), `firestore.rules` (bloques por
  colección), `firebase.json`, `scripts/seed-firestore.mjs`.

> Pendiente operativo (requiere credenciales del usuario): crear admin en Auth +
> `set-admin-claim`, `firebase deploy --only firestore:rules`, sembrar catálogo.

---

## ✅ Backend Firebase — proyecto `434752294989` (theirgin) + Google Sign-in

**Feature:** Migrar el backend al proyecto Firebase del usuario y habilitar Google Sign-in.
**Objetivo:** Usar el proyecto `theirgin` (434752294989) con Auth (Google + email/password) y Firestore.
- ✅ Código Google Sign-in (`auth-context.signInWithGoogle`, botón en `LoginScreen`).
- ✅ Bloque `auth` en `firebase.json` (googleSignIn + emailPassword).
- ✅ App web registrada (`1:434752294989:web:ae5460b3957beb215bcc04`).
- ✅ Config en `.env.local` (`NEXT_PUBLIC_FIREBASE_*`); `lib/firebase/client.ts` lee de env.
- ✅ `projectId: theirgin` en `admin.ts`, `scripts/_admin.mjs`, `.firebaserc`.
- ✅ Firestore `(default)` creada — **Native / Standard / southamerica-west1**.
- ✅ Reglas e índices desplegados (`deploy --only firestore`).
- ✅ Auth providers habilitados (`deploy --only auth`): email/password + Google.
- ⬜ **Operativo (usuario):** crear admin en Auth + `node scripts/set-admin-claim.mjs <email>`
  (requiere ADC/service account — gcloud no instalado).
- ⬜ **Operativo:** sembrar catálogo (`node scripts/seed-firestore.mjs`) o crear productos en /admin.

---

## 🔄 Oleada 1 — Fan-out paralelo (4 worktrees) — A/C/D ✅, B ⬜

Integradas A, C y D en `master` (build verde, 14 rutas). Falta B (Flow).

### Worktree A — Catálogo + Carrito  ✅  *(diferido: drawer en navbar; reseñas Oleada 2; botón checkout deshabilitado hasta B)*
**Feature:** Tienda pública y carrito persistente (Req. 1).
**Objetivo:** Que un cliente navegue el catálogo desde Firestore, vea el detalle de
producto con stock, y arme un carrito persistente con subtotales.
- ⬜ `app/(shop)/tienda/page.tsx` — grid de productos activos (ISR `revalidate: 300`).
- ⬜ `app/(shop)/producto/[slug]/page.tsx` — detalle + SEO (`generateMetadata`) + stock.
- ⬜ `lib/cart/CartProvider.tsx` — carrito en localStorage (Context + useReducer, guard SSR).
- ⬜ `components/shop/` — ProductCard, CartDrawer, QtyStepper.
- ⬜ `app/(shop)/carrito/page.tsx` — editar cantidades, subtotal (solo display).
- **Contrato:** `CartItem` (definir en `lib/types.cart.ts`).

### Worktree B — Inventario + Flow + Cupones  ⬜
**Feature:** Checkout con pago Flow, inventario atómico y cupones (Req. 2, 3, 4).
**Objetivo:** Crear orden con reserva atómica de stock, pagar vía Flow sin exponer
llaves, confirmar por webhook y aplicar cupones server-side. Sin overselling.
- ⬜ `functions/src/flow/createOrder.ts` (callable) — reserva stock + cupón + `/payment/create`.
- ⬜ `functions/src/flow/flowWebhook.ts` (onRequest) — valida firma HMAC + `getStatus` + commit stock.
- ⬜ `functions/src/flow/flowClient.ts` — firma HMAC-SHA256, sandbox→prod.
- ⬜ `functions/src/inventory/{reserve,release,commit}.ts` — transacciones Firestore.
- ⬜ `functions/src/inventory/releaseExpiredReservations.ts` (scheduled).
- ⬜ `functions/src/coupons/validate.ts` (callable) — validación informativa.
- ⬜ `app/(shop)/checkout/*` — formulario, retorno, confirmación.
- **Contrato:** firma de `createOrder(cart, customer, code)`. Secretos en Secret Manager.
- **Tipos:** `lib/types.order.ts`, `lib/types.coupon.ts`.

### Worktree C — Equipo + Contacto  ✅  *(diferido: email de aviso vía Cloud Function onCreate)*
**Feature:** Secciones corporativas SEO (Req. 7).
**Objetivo:** Página "Nuestro Equipo" y formulario dinámico de contacto comercial que
persiste en Firestore y notifica al equipo.
- ⬜ `app/(marketing)/equipo/page.tsx` — lee `teamMembers`, SSG/ISR + SEO.
- ⬜ `app/(marketing)/contacto/page.tsx` — formulario → callable `submitContact`.
- ⬜ `functions/src/contact/{submitContact,onContactCreated}.ts` — guarda + email.
- **Tipos:** `lib/types.contact.ts`, `lib/types.team.ts`.

### Worktree D — Blog / CMS  ✅  *(diferido: subida de portada a Firebase Storage; por ahora coverImage por URL)*
**Feature:** Blog auto-administrable con SEO (Req. 5).
**Objetivo:** Publicar artículos/recetas/noticias desde el admin y renderizarlos
indexables por SEO.
- ⬜ `app/admin/blog/*` — CRUD de `blogPosts` (Markdown + preview, draft/published).
- ⬜ `app/(marketing)/blog/page.tsx` + `[slug]/page.tsx` — ISR + `generateMetadata`.
- ⬜ Imágenes a Firebase Storage.
- ⬜ Añadir "Blog" al `AdminShell` nav.
- **Tipos:** `lib/types.blog.ts`.

---

## ⬜ Oleada 2 — Dependientes + consolidación

### Comentarios / Reseñas con moderación  ⬜  *(necesita A + D)*
**Feature:** Reseñas de producto y comentarios de blog moderados (Req. 6).
**Objetivo:** Cliente envía → queda `pending` → admin aprueba → se publica; rating
agregado en productos.
- ⬜ Formulario público en producto/post (crea `comments` con `status: 'pending'`).
- ⬜ `app/admin/comentarios/page.tsx` — cola de moderación.
- ⬜ `functions/src/comments/onCommentApproved.ts` — actualiza `ratingSum`/`ratingCount`.
- **Tipos:** `lib/types.comment.ts`.

### Seguridad (endurecimiento final)  ⬜  *(owner único, va al final)*
**Feature:** Reglas estrictas, App Check, secretos (Req. no funcionales).
**Objetivo:** Consolidar `firestore.rules`, activar App Check/reCAPTCHA, secretos de
Flow en Secret Manager, pruebas de overselling concurrente, switch Flow sandbox→prod.
- ⬜ Consolidar y endurecer todos los bloques de `firestore.rules`.
- ⬜ Índices reales en `firestore.indexes.json` (hoy vacío).
- ⬜ App Check en writes públicos (comments/contact) y callables.
- ⬜ Pruebas de overselling concurrente con el emulador.

---

## Notas técnicas
- **Tipos por feature:** `lib/types.ts` solo tiene `Product`; cada feature crea
  `lib/types.<feature>.ts` para evitar conflictos de merge entre worktrees.
- **Helpers compartidos:** `lib/cta.ts` (`resolveCta`, `formatPrice`),
  `components/ui/SectionHeader.tsx`, clases `btn-primary`/`btn-outline`.
- **Hosting:** Firebase Hosting + frameworks (`southamerica-west1`); migrable a Cloud Run.
- **Imágenes:** colocar en `public/assets/images/` (ver `README.md`).
