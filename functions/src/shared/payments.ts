/**
 * functions/src/shared/payments.ts — Modo de pago.
 *
 * UNA sola env `PAYMENTS_MODE` decide todo el comportamiento de pago:
 *   - `mock`        (default): no se llama a Flow; el checkout abre la ventana de
 *                   pago simulada (`/checkout/mock`).
 *   - `sandbox`:    Flow real contra `sandbox.flow.cl` con las llaves de sandbox.
 *   - `production`: Flow real contra `www.flow.cl` con las llaves de producción.
 *
 * De este modo la base URL y el par de credenciales SIEMPRE quedan acoplados al
 * mismo modo: imposible mezclar una key de sandbox con la URL de producción.
 */
export type PaymentsMode = 'mock' | 'sandbox' | 'production';

/** Modo de pago activo. Cualquier valor desconocido (incl. vacío) ⇒ `mock`. */
export function paymentsMode(): PaymentsMode {
  const m = process.env.PAYMENTS_MODE;
  return m === 'sandbox' || m === 'production' ? m : 'mock';
}

export function isMockMode(): boolean {
  return paymentsMode() === 'mock';
}
