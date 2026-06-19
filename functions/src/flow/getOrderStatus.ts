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

interface GetOrderStatusData {
  orderId: string;
}

export const getOrderStatus = onCall(
  { region: REGION },
  async (request) => {
    const { orderId } = (request.data ?? {}) as GetOrderStatusData;
    if (typeof orderId !== 'string' || !orderId) {
      throw new HttpsError('invalid-argument', 'orderId requerido.');
    }
    const snap = await db.collection('orders').doc(orderId).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Orden no encontrada.');
    }
    const o = snap.data() as {
      status: string;
      subtotal: number;
      discount: number;
      discountCode?: string | null;
      shipping: number;
      total: number;
      items: { productId: string; name: string; qty: number; unitPrice: number }[];
      createdAt?: { toMillis(): number };
    };

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
