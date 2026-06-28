/**
 * functions/src/flow/getOrderStatus.ts — Callable que devuelve el estado de una orden.
 *
 * Los clientes no leen `orders` directo (lo prohíbe firestore.rules). Esta
 * callable expone un subconjunto seguro del estado para que el checkout muestre
 * "procesando / pagado / falló" sin acceder a Firestore.
 *
 * Input: { orderId: string }
 * Output: { status, total, subtotal, discount, shipping, items, createdAt }
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../shared/admin.js';
import { REGION } from '../shared/config.js';
import { getStatus } from './flowClient.js';
import { FLOW_SECRETS, flowCreds } from './secrets.js';
import { settleOrder } from './settle.js';
import { isMockMode } from '../shared/payments.js';

interface GetOrderStatusData {
  orderId: string;
}

export const getOrderStatus = onCall(
  { region: REGION, secrets: FLOW_SECRETS },
  async (request) => {
    const { orderId } = (request.data ?? {}) as GetOrderStatusData;
    if (typeof orderId !== 'string' || !orderId) {
      throw new HttpsError('invalid-argument', 'orderId requerido.');
    }
    let snap = await db.collection('orders').doc(orderId).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Orden no encontrada.');
    }
    let o = snap.data() as {
      status: string;
      subtotal: number;
      discount: number;
      discountCode?: string | null;
      shipping: number;
      total: number;
      items: { productId: string; name: string; qty: number; unitPrice: number }[];
      createdAt?: { toMillis(): number };
      flow?: { token?: string };
    };

    // Reconciliación con Flow: el webhook (urlConfirmation) es el camino primario,
    // pero no siempre llega (no alcanza localhost; en prod puede atrasarse/fallar).
    // Si la orden sigue pendiente y hay token real de Flow, consultamos getStatus
    // —fuente de verdad— y liquidamos vía settleOrder (idempotente). El mock se
    // salta: liquida vía mockConfirmPayment.
    const token = o.flow?.token;
    if (o.status === 'awaiting_payment' && token && !isMockMode() && !token.startsWith('MOCK-')) {
      try {
        const flow = await getStatus(token, flowCreds());
        if (flow.status === 2) await settleOrder(orderId, true);
        else if (flow.status === 3 || flow.status === 4) await settleOrder(orderId, false);
        // status 1 (pendiente): nada que hacer.
        if (flow.status !== 1) {
          snap = await db.collection('orders').doc(orderId).get();
          o = snap.data() as typeof o;
          console.log(`getOrderStatus[${orderId}]: reconciliado vía Flow (status ${flow.status}) → ${o.status}`);
        }
      } catch (err) {
        // No romper la callable: caer al estado guardado en Firestore.
        console.error(`getOrderStatus: reconciliación con Flow falló para ${orderId}:`, (err as Error).message);
      }
    }

    return {
      orderId: snap.id,
      status: o.status,
      subtotal: o.subtotal,
      discount: o.discount,
      discountCode: o.discountCode ?? null,
      shipping: o.shipping,
      total: o.total,
      items: o.items,
      createdAt: o.createdAt ? o.createdAt.toMillis() : null,
    };
  },
);
