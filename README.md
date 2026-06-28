# MyGin — E-commerce

Gin contemporáneo chileno. Migrado de landing estática (Vanilla JS + Vite) a
e-commerce sobre **Next.js (App Router) + TypeScript + Tailwind v4 + Firebase**.

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 (PostCSS).
- **Backend:** Cloud Firestore + Cloud Functions (pagos Flow, inventario, cupones, moderación).
- **Hosting:** Firebase Hosting + frameworks (`southamerica-west1`); migrable a Cloud Run.
- **Pagos:** Flow/Webpay. Por defecto en modo **mock** (ver `PAYMENTS_MODE`).

## Desarrollo

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # build de producción (SSG/ISR)
pnpm typecheck    # tsc --noEmit
pnpm test:e2e     # Playwright (levanta emuladores; ver scripts/run-e2e.mjs)
```

## Estructura

```
app/                    # App Router (layout, page, rutas marketing/shop/admin/api)
components/
  sections/             # secciones de la landing (Hero, Historia, Producto, Shop, ...)
  nav/                  # Navbar, Footer
  ui/                   # Icon, CtaButton, SplitHeadline, Button, Card, Badge, ...
  RevealObserver.tsx    # animaciones reveal-on-scroll
content/site.ts         # contenido estático de marketing
lib/
  constants.ts          # constantes de dominio del frontend (envío, ISR, timeouts)
  config.ts             # configuración del frontend (región, firebaseConfig, env)
  types.ts              # modelo de dominio CONGELADO (Product, Order, Coupon, ...)
  firebase/client.ts    # Firebase SDK navegador (Firestore + Auth + Analytics)
  firebase/admin.ts     # Admin SDK (solo servidor — privilegiado)
functions/              # Cloud Functions (Flow, inventario, cupones, ...)
  src/shared/constants.ts  # constantes de dominio server-side (FUENTE DE VERDAD)
  src/shared/config.ts     # región y bases de URL/API (env) de las Functions
firestore.rules         # reglas de seguridad (bloques por colección)
firestore.indexes.json  # índices compuestos
scripts/                # seed de catálogo, set-admin-claim, runner de e2e
```

## Constantes y configuración

Los valores fijos y las variables de entorno viven centralizados, no como
literales dispersos. La separación es la misma en frontend y en functions:

| | **Constantes** (valores de dominio fijos) | **Config** (entorno / despliegue) |
|---|---|---|
| **Frontend** | `lib/constants.ts` | `lib/config.ts` |
| **Functions** | `functions/src/shared/constants.ts` | `functions/src/shared/config.ts` |

- **`lib/constants.ts`** — `SHIPPING_FLAT_CLP`, `REVALIDATE_SECONDS` (ISR), `PAY_TIMEOUT_MS`, `ORDER_POLL_DELAYS`, `REVIEW_MAX_BODY`.
- **`lib/config.ts`** — `FUNCTIONS_REGION`, `USE_EMULATORS`, `firebaseConfig` (lee `NEXT_PUBLIC_*`).
- **`functions/src/shared/config.ts`** — `REGION`, `SCHEDULER_REGION`, y los lectores de env `projectId()`, `functionsBase()`, `siteBase()`, `flowApiBase()`. `PAYMENTS_MODE` sigue en `shared/payments.ts` (`isMockMode()`).

**Fuentes de verdad / espejos a sincronizar manualmente:**

- **Precio de envío:** la fuente es `SHIPPING_FLAT_CLP` en *functions* (el cliente nunca dicta precios; el servidor recalcula al crear la orden). El `lib/constants.ts` del frontend es un **espejo solo-display**. Si cambia uno, cambia el otro.
- **Región:** `REGION` (functions) = `FUNCTIONS_REGION` (frontend) = `firebase.json`. Las funciones programadas usan `SCHEDULER_REGION` (`southamerica-east1`, São Paulo) porque Cloud Scheduler aún no existe en Santiago.
- **Máximo de reseña:** `REVIEW_MAX_BODY` debe coincidir con la regla `body ≤ 2000` en `firestore.rules`.

---

## Deployment

Proyecto Firebase: **`theirgin`** (default en `.firebaserc`). Todo en **`southamerica-west1`**.
La CLI de Firebase va como devDep — úsala con `pnpm exec firebase …` o `npx firebase-tools@latest …`.

### 0. Prerrequisitos (una vez)

```bash
pnpm install
pnpm exec firebase login
pnpm exec firebase use theirgin        # selecciona el proyecto activo
```

### 1. Variables de entorno

Copia `.env.example` → `.env.local` y complétalo. **Nunca commitees `.env.local`.**

- **Firebase Web** (`NEXT_PUBLIC_*`): cliente, embebidas en el bundle. Obtenlas con:
  ```bash
  pnpm exec firebase apps:sdkconfig WEB <APP_ID> --project theirgin
  ```
- **Firebase Admin** (SSR privilegiado): `FIREBASE_SERVICE_ACCOUNT` (JSON en una línea)
  o ADC vía `GOOGLE_APPLICATION_CREDENTIALS`. Solo servidor — jamás al cliente.

En producción (Firebase Hosting frameworks), las `NEXT_PUBLIC_*` se toman del build;
las de servidor se inyectan como env de la backend del framework / Secret Manager.

### 2. Secretos de pago (Flow) — solo si usas pago real

Viven en **Secret Manager**, nunca en el código ni en `.env`:

```bash
# Dos pares (sandbox + producción coexisten); los cuatro deben existir para deployar.
pnpm exec firebase functions:secrets:set FLOW_SANDBOX_API_KEY
pnpm exec firebase functions:secrets:set FLOW_SANDBOX_SECRET_KEY
pnpm exec firebase functions:secrets:set FLOW_PRODUCTION_API_KEY
pnpm exec firebase functions:secrets:set FLOW_PRODUCTION_SECRET_KEY
```

**`PAYMENTS_MODE`** controla la pasarela (`functions/src/shared/payments.ts`); una sola
variable decide base URL + par de llaves:
- sin setear / `mock` → checkout abre una ventana simulada (`/checkout/mock`) que
  acepta/rechaza el pago vía la callable `mockConfirmPayment`. No llama a Flow.
- `sandbox` → Flow real contra `sandbox.flow.cl` con el par `FLOW_SANDBOX_*`.
- `production` → Flow real contra `www.flow.cl` con el par `FLOW_PRODUCTION_*`.

### 3. Verificación previa (gate)

```bash
pnpm typecheck
pnpm --prefix functions typecheck
pnpm build
pnpm test:e2e        # opcional pero recomendado antes de desplegar
```

### 4. Desplegar

Se puede desplegar por partes o todo junto. Orden recomendado: reglas/índices →
functions → hosting (así el frontend nuevo ya encuentra backend y permisos al día).

```bash
# Reglas + índices de Firestore
pnpm exec firebase deploy --only firestore

# Cloud Functions (el predeploy corre `npm run build` = tsc en functions/)
pnpm exec firebase deploy --only functions
#   o, equivalente desde la carpeta:  pnpm --prefix functions run deploy

# Hosting (Next.js vía adaptador de frameworks, región southamerica-west1)
pnpm exec firebase deploy --only hosting

# Todo de una:
pnpm exec firebase deploy
```

Functions desplegadas (`functions/src/index.ts`):
`createOrder`, `flowWebhook`, `mockConfirmPayment`, `getOrderStatus`,
`releaseExpiredReservations` (scheduled — libera reservas de stock vencidas),
`validateCoupon`.

### 5. Post-deploy (primera vez)

```bash
# Seed del catálogo (idempotente: usa el slug como docId)
node scripts/seed-firestore.mjs

# Dar rol admin a un usuario (debe existir en Auth; re-loguearse tras correrlo)
node scripts/set-admin-claim.mjs <email>          # revocar: --revoke
```

Ambos scripts necesitan credenciales de admin (ADC o `GOOGLE_APPLICATION_CREDENTIALS`
de `theirgin`). El panel `/admin` exige el custom claim `admin: true`.

### Emuladores (local, sin tocar prod)

```bash
pnpm exec firebase emulators:start     # auth 9099 · firestore 8080 · functions 5001 · hosting 5000
node scripts/seed-emulator.mjs         # datos de prueba en el emulador
```

---

## Imágenes

Los assets van en `public/assets/images/` y se sirven en `/assets/images/*`.
