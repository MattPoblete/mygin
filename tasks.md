# MyGin — Tareas

Documento vivo del avance. Plan completo:
`~/.claude/plans/necesito-que-analices-requirements-md-sleepy-sparrow.md`.

Convención de estado: ✅ hecho · 🔄 en progreso · ⬜ pendiente.
El desarrollo se organiza en **oleadas** (worktrees paralelos); ver "Estrategia de
paralelización" en el plan.

---

## ✅ Tests E2E (Playwright + emulador Firebase) — todos los flujos

Cobertura E2E del ecommerce contra el **emulador Firebase** (datos sembrados, pago mock),
escrita en **5 worktrees paralelos** y puesta en verde de forma central. **100 tests passing.**

- ✅ **Fundación** — `@playwright/test` + `firebase-tools` (devDeps); `client.ts`/`admin.ts`
  conectan al emulador gateados por env; `firebase.test.json` (solo firestore+auth);
  `scripts/seed-emulator.mjs` (productos in-stock/featured/low-stock/agotado, cupones, pedido,
  post, usuarios admin/no-admin) + `scripts/run-e2e.mjs` (usa JRE local `.jdk/` si existe).
- ✅ **Suite** (`e2e/*.spec.ts`): age-gate, navbar, landing, catálogo, PDP, carrito, checkout,
  pago (popup mock aceptar/rechazar/cerrar), confirmación, contacto, admin (auth + CRUD
  productos/cupones/blog + pedidos). Auth admin vía `storageState` (con `indexedDB:true`).
- ✅ **Bug encontrado y corregido** — al pagar, `clear()` disparaba el redirect "carrito vacío
  → /tienda" ganándole al push a la confirmación; ahora un `paidRef` evita la carrera y el
  cliente llega a `/checkout/confirmacion/{id}`.
- **Correr:** `pnpm test:e2e` (requiere Java 21+; hay un JRE local en `.jdk/`).
- ⬜ Operativo: instalar Java 21+ system-wide o conservar `.jdk/` local; opcional integrar en CI.

---

## ✅ Auditoría UX + remediación (filtro ponytail, worktrees paralelos)

Auditoría completa (`UX-AUDIT.md`, 8 superficies con skill `ux-designer`) → triaje ponytail
(Tier 1+2; Tier 3 admin/PDP diferido por YAGNI) → implementado en **5 worktrees paralelos**,
mergeados a master. Cero dependencias nuevas (full nativo). Build limpio.

- ✅ **Checkout (bug de plata)** — popup navega solo con status explícito; cierre→reintento;
  timeout de `waiting`; confirmación ramea por estado + "qué sigue"; despacho/total/IVA antes de
  pagar; form con autoComplete/required/on-blur/RUT(módulo-11)/cupón-reset.
- ✅ **A11y transversal** — `:focus-visible` global, `prefers-reduced-motion` global, contraste AA
  (subtítulos `--text-muted`, eyebrows `--crimson-on-dark`), skip link; quitado `outline-none`.
- ✅ **Tienda/PDP** — `formatPrice`→`Intl` currency, add-to-cart con "Ir al carrito" + `role=status`,
  QtyStepper 44px, sold-out SR + bloque de confianza.
- ✅ **Nav/contenido** — Navbar (banner, toggle 44px, scroll-spy, menú móvil `<dialog>`), AgeGate
  `<dialog>` accesible (sin expulsar a google), footer desde `site.ts`, `#recetas` fuera, WhatsApp
  (placeholder), ContactForm validado, fecha de blog `Intl`.
- ✅ **Admin lean** — flash de guardado (`SavedFlash`), guard de cambios sin guardar, required +
  campos identidad `readonly`, login con reset de contraseña + "Sin permisos", chips de estado en
  pedidos + nota "100 más recientes". `window.confirm()` se mantiene (skip soft-delete).
- ⬜ **Operativo (usuario):** confirmar número real de WhatsApp en `content/site.ts` (hoy placeholder).

---

## ✅ Re-skin con MyGin Design System (claude.ai/design)

- ✅ **Integración del design system** (`bd248bfd…`). Tokens portados a `globals.css`
  (escalas `--sp/--radius/--shadow/--transition`, aliases navy/crimson/cream, utilidades
  `.mg-eyebrow`/`.mg-rule`/`.mg-crest-eyebrow`; `.btn-*` con hover-oscurece + press-inset).
- ✅ **Primitivas** `components/ui/{Button,Card,Badge,SectionTitle}.tsx` (inline-style + CSS vars).
- ✅ **AgeGate** (`components/AgeGate.tsx`, +18, `sessionStorage`) montada en `layout.tsx`.
- ✅ **Secciones** calcadas del UI kit: Hero (duotono + eyebrow heráldica + chips),
  Producto (notas Nariz/Boca/Final), **Botanicals** (bento grid de fotos, nueva), Distribuidores
  (cream + cards), **Shop/Tienda** (bento → /producto/[slug]), **Contacto** (reusa `ContactForm` real),
  Navbar (MY/GIN + carrito) y Footer (navy-deep, global en `layout.tsx`). Resto con motivos vía `SectionHeader`.
- ✅ **Copy nuevo** en `content/site.ts` (hero "El sur de Chile, en una copa.", chips 43°GL/750ML)
  y **sin emoji** (recetas → numeración). Build limpio (22/22) y home 200 verificado.
- ⬜ Revisión visual fina (responsive bento, máscaras duotono) en navegador.
- ✅ **Fix navegación SPA** — `RevealObserver` re-observa por `usePathname` (al volver a
  Inicio el contenido ya no quedaba en blanco); Navbar resuelve anclas a `/#hash` fuera
  de `/` (vuelve a la landing en vez de `/tienda#top`).
- ✅ **Fix carrito** — `serializeProduct` convierte Timestamps de `Product` a millis;
  elimina el error "Only plain objects can be passed to Client Components" en el detalle.
- ✅ **Auto-cancelar órdenes** — `POST /api/checkout/expire-orders` (protegida con
  `CRON_SECRET`) cancela `awaiting_payment` >24h y libera stock (reusa `settleOrder`).
  Operativo: setear `CRON_SECRET` + agendar cron externo (~1h) con header `x-cron-secret`.

---

## ✅ Pago mockeado + imágenes (sesión anterior)

- ✅ **Pago Flow mockeado** — el checkout abre `/checkout/mock` en ventana nueva
  (aceptar/rechazar) y captura el resultado por `postMessage`. Backend portado de
  Cloud Functions a **Next API routes** (`app/api/checkout/*` + `lib/server/checkout.ts`,
  Admin SDK) para correr en el **plan gratuito Spark**. Verificado e2e: crear →
  awaiting → aceptar → `paid`, totales recalculados server-side. `PAYMENTS_MODE=mock`.
  - `functions/` queda como alternativa para Blaze / Flow real (no desplegado).
- ✅ **Imágenes a WebP** — 22 imágenes (~210 MB) → WebP (máx 1600px, q82) ≈ 5.6 MB;
  cableadas en `content/site.ts` (hero/producto/experiencia) y productos sembrados.
  Disponibles `ingredientes/*.webp` para la grilla de botánicos (hoy usa íconos).

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

## ✅ Oleada 1 — Fan-out paralelo (4 worktrees) — A/C/D/B ✅

Las 4 features integradas en `master`. Build Next verde (21 rutas) + `functions/` tsc limpio.
Pendiente operativo de B: setear secretos de Flow + `firebase deploy --only functions,firestore:indexes`.

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

### Worktree B — Inventario + Flow + Cupones  ✅  *(pendiente: secretos Flow + deploy functions/indexes; sandbox de Flow para probar pago)*
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
