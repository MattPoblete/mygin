/**
 * functions/src/flow/mockConfirmPayment.ts — Confirmación de pago SIMULADA.
 *
 * Reemplaza al webhook de Flow cuando `PAYMENTS_MODE` es mock. La ventana de
 * pago simulada (`/checkout/mock`) llama a esta callable con la decisión del
 * usuario (aceptar/rechazar) y aquí se liquida la orden (commit o liberación de
 * stock) reutilizando la misma lógica atómica que el webhook real.
 *
 * Deshabilitada si PAYMENTS_MODE=live (para que en producción solo el webhook
 * de Flow pueda confirmar pagos).
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { isMockMode } from '../shared/payments.js';
import { settleOrder } from './settle.js';

interface MockConfirmData {
  orderId?: string;
  decision?: string;
}

export const mockConfirmPayment = onCall(
  { region: 'southamerica-west1' },
  async (request) => {
    if (!isMockMode()) {
      throw new HttpsError('failed-precondition', 'El pago simulado está deshabilitado.');
    }
    const { orderId, decision } = (request.data ?? {}) as MockConfirmData;
    if (typeof orderId !== 'string' || !orderId) {
      throw new HttpsError('invalid-argument', 'orderId requerido.');
    }
    if (decision !== 'accept' && decision !== 'reject') {
      throw new HttpsError('invalid-argument', 'decision debe ser "accept" o "reject".');
    }
    const result = await settleOrder(orderId, decision === 'accept');
    return { status: result };
  },
);
