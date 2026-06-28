# Despliegue de Cloud Functions (checkout)

El checkout de MyGin corre sobre **Cloud Functions** (`functions/`, callables con Admin SDK):
`createOrder`, `validateCoupon`, `getOrderStatus`, `mockConfirmPayment`, `flowWebhook`,
`releaseExpiredReservations`. El front las invoca vía `httpsCallable` (`lib/checkout.ts`).

> Requiere plan **Blaze** (ya activo en el proyecto `theirgin`).

> ⚠️ **Regiones.** Las callables + `flowWebhook` corren en `southamerica-west1` (Santiago,
> baja latencia para Chile). El scheduled `releaseExpiredReservations` corre en
> `southamerica-east1` (São Paulo) porque **Cloud Scheduler aún no existe en
> southamerica-west1** — deployarlo ahí falla con `400 invalid location`. Si alguna vez
> queda un huérfano scheduled en west1, el CLI no lo puede borrar (choca con el job de
> scheduler inexistente); se borra vía Functions v2 REST API
> (`DELETE .../locations/southamerica-west1/functions/<name>`).

---

## Blocker: los secretos de Flow

`createOrder` y `flowWebhook` declaran cuatro secretos (`functions/src/flow/secrets.ts`):

```ts
defineSecret('FLOW_SANDBOX_API_KEY');
defineSecret('FLOW_SANDBOX_SECRET_KEY');
defineSecret('FLOW_PRODUCTION_API_KEY');
defineSecret('FLOW_PRODUCTION_SECRET_KEY');
```

`firebase deploy` **exige que los cuatro existan**, aunque en modo mock no se lean en
runtime (`isMockMode()` corta antes de llamar a `flowCreds()`). Si falta alguno, el deploy
falla. Además la **Secret Manager API** puede estar deshabilitada en el proyecto.

> **`PAYMENTS_MODE`** (env de las Functions) decide TODO: `mock` (default) no llama a Flow;
> `sandbox` usa el par sandbox contra `sandbox.flow.cl`; `production` usa el par prod contra
> `www.flow.cl`. La base URL y las llaves siempre quedan acopladas al mismo modo.

---

## Opción A — Seguir en mock (placeholders)

Mantiene el pago simulado (`/checkout/mock`); no se llama a Flow. Solo desbloquea el deploy.

```bash
# 1. Habilitar Secret Manager API (una vez)
gcloud services enable secretmanager.googleapis.com --project theirgin

# 2. Crear los 4 secretos con valores dummy (interactivo: pega cualquier string)
npx -y firebase-tools@latest functions:secrets:set FLOW_SANDBOX_API_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_SANDBOX_SECRET_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_PRODUCTION_API_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_PRODUCTION_SECRET_KEY

# 3. Desplegar (PAYMENTS_MODE sin setear ⇒ mock por defecto)
npx -y firebase-tools@latest deploy --only functions
```

Las callables quedan **públicas** (allUsers invoker) automáticamente, necesario para el
checkout anónimo.

---

## Opción B — Pago real de Flow (`sandbox` / `production`)

Requiere las llaves reales de Flow y validar el webhook.

```bash
# 1. Habilitar Secret Manager API (si no está)
gcloud services enable secretmanager.googleapis.com --project theirgin

# 2. Setear los pares REALES (interactivo). El par no usado puede ir dummy,
#    pero los cuatro deben existir para que el deploy no falle.
npx -y firebase-tools@latest functions:secrets:set FLOW_SANDBOX_API_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_SANDBOX_SECRET_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_PRODUCTION_API_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_PRODUCTION_SECRET_KEY

# 3. Activar el modo en las functions (sin esto sigue en mock):
#    PAYMENTS_MODE=sandbox  (pruebas)  |  PAYMENTS_MODE=production  (real)

# 4. Desplegar
npx -y firebase-tools@latest deploy --only functions
```

Notas modo real:
- `PAYMENTS_MODE` controla sandbox vs prod (base URL en `functions/src/shared/config.ts`,
  par de llaves en `functions/src/flow/secrets.ts`):
  - `sandbox`: `https://sandbox.flow.cl/api` + par `FLOW_SANDBOX_*`.
  - `production`: `https://www.flow.cl/api` + par `FLOW_PRODUCTION_*`.
- `flowWebhook` es la `urlConfirmation` pública que Flow llama tras el pago:
  `https://southamerica-west1-theirgin.cloudfunctions.net/flowWebhook`.
  Nunca confía en el POST: consulta `getStatus(token)` como fuente de verdad.
- `urlReturn` apunta a `${SITE_BASE_URL}/checkout/retorno?orderId=…`.

---

## Verificación local (emulador)

No despliega nada; corre la suite e2e contra los emuladores (incluido Functions):

```bash
pnpm test:e2e
```

`scripts/run-e2e.mjs` compila `functions/` y levanta `auth,firestore,functions`
(`firebase.test.json`). En mock no se requieren secretos reales.

---

## Autocancelación de órdenes

La reserva de stock se libera con el scheduled **`releaseExpiredReservations`** (cada 10 min,
por `reservationExpiresAt`; índice compuesto `status + reservationExpiresAt` ya en
`firestore.indexes.json`). Reemplaza al antiguo cron externo `/api/checkout/expire-orders`
(eliminado). En el emulador no corre (no hay emulador de Pub/Sub); solo en producción.
