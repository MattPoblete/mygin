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

`createOrder` y `flowWebhook` declaran:

```ts
defineSecret('FLOW_API_KEY');
defineSecret('FLOW_SECRET_KEY');
```

`firebase deploy` **exige que esos secretos existan**, aunque en modo mock no se lean en
runtime (`isMockMode()` corta antes de llamar a `.value()`). Si no existen, el deploy falla.
Además la **Secret Manager API** puede estar deshabilitada en el proyecto.

---

## Opción A — Seguir en mock (placeholders)

Mantiene el pago simulado (`/checkout/mock`); no se llama a Flow. Solo desbloquea el deploy.

```bash
# 1. Habilitar Secret Manager API (una vez)
gcloud services enable secretmanager.googleapis.com --project theirgin

# 2. Crear los secretos con valores dummy (interactivo: pega cualquier string)
npx -y firebase-tools@latest functions:secrets:set FLOW_API_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_SECRET_KEY

# 3. Desplegar (PAYMENTS_MODE sin setear ⇒ mock por defecto)
npx -y firebase-tools@latest deploy --only functions
```

Las callables quedan **públicas** (allUsers invoker) automáticamente, necesario para el
checkout anónimo.

---

## Opción B — Pago real de Flow (`live`)

Requiere las llaves reales de Flow (sandbox o producción) y validar el webhook.

```bash
# 1. Habilitar Secret Manager API (si no está)
gcloud services enable secretmanager.googleapis.com --project theirgin

# 2. Setear las llaves REALES (interactivo)
npx -y firebase-tools@latest functions:secrets:set FLOW_API_KEY
npx -y firebase-tools@latest functions:secrets:set FLOW_SECRET_KEY

# 3. Activar modo live en las functions
#    (env de las functions; sin esto sigue en mock)
#    Vía Secret/param o functions config — definir PAYMENTS_MODE=live para las funciones.

# 4. Desplegar
npx -y firebase-tools@latest deploy --only functions
```

Notas modo live:
- `FLOW_API_BASE` controla sandbox vs prod (`functions/src/flow/flowClient.ts`):
  - sandbox (default): `https://sandbox.flow.cl/api`
  - producción: `https://www.flow.cl/api`  → setear env `FLOW_API_BASE`.
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
