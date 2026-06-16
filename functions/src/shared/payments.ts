/**
 * functions/src/shared/payments.ts — Modo de pago.
 *
 * Por defecto el pago está MOCKEADO (no se llama a Flow): el checkout abre una
 * ventana de pago simulada que permite aceptar/rechazar. Para usar Flow real,
 * setea la env `PAYMENTS_MODE=live` en las Functions y configura los secretos.
 */
export function isMockMode(): boolean {
  return (process.env.PAYMENTS_MODE ?? 'mock') !== 'live';
}
