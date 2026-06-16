/**
 * functions/src/index.ts — Punto de entrada de las Cloud Functions de MyGin.
 *
 * Re-exporta las funciones de cada feature. Región objetivo: southamerica-west1.
 * El Admin SDK se inicializa una sola vez en shared/admin.ts.
 *
 * Worktree B (checkout Flow + inventario + cupones):
 *   - createOrder                 (callable)  flow/createOrder.ts
 *   - flowWebhook                 (onRequest) flow/flowWebhook.ts
 *   - getOrderStatus              (callable)  flow/getOrderStatus.ts
 *   - releaseExpiredReservations  (scheduled) inventory/releaseExpired.ts
 *   - validateCoupon              (callable)  coupons/validate.ts
 *
 * Secretos (Secret Manager, vía firebase functions:secrets:set):
 *   FLOW_API_KEY, FLOW_SECRET_KEY — NUNCA hardcodear.
 */
export { createOrder } from './flow/createOrder.js';
export { flowWebhook } from './flow/flowWebhook.js';
export { mockConfirmPayment } from './flow/mockConfirmPayment.js';
export { getOrderStatus } from './flow/getOrderStatus.js';
export { releaseExpiredReservations } from './inventory/releaseExpired.js';
export { validateCoupon } from './coupons/validate.js';
