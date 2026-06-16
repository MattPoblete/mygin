/**
 * functions/src/index.ts — Punto de entrada de las Cloud Functions de MyGin.
 *
 * Aquí se re-exportan las funciones de cada feature (Oleada 1, worktree B y otras):
 *   - flow/        createOrder (callable), flowWebhook (onRequest), getOrderStatus
 *   - inventory/   releaseExpiredReservations (scheduled)
 *   - coupons/     validateCoupon (callable)
 *   - comments/    onCommentApproved (trigger)
 *   - contact/     submitContact (callable), onContactCreated (trigger)
 *
 * Secretos (Flow apiKey/secretKey, mail API key) se inyectan vía Secret Manager
 * (firebase functions:secrets:set) — NUNCA hardcodear.
 *
 * Placeholder de Oleada 0: sin funciones aún. Las features se agregan en Oleada 1.
 */

// Ejemplo de inicialización compartida del Admin SDK (descomentar al agregar funciones):
// import { initializeApp, getApps } from 'firebase-admin/app';
// if (!getApps().length) initializeApp();

// ponytail: esqueleto de Oleada 1, sin código vivo en Oleada 0. Las funciones se
// agregan en su feature; hasta entonces este archivo solo existe para el deploy.
export {};
