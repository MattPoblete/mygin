/**
 * functions/src/flow/settle.ts — Liquidación de una orden (pagada / no pagada).
 *
 * Lógica compartida por el webhook real de Flow y por el pago simulado
 * (mockConfirmPayment). Idempotente y atómica:
 *  - paid=true  → si seguía `awaiting_payment`, commit de stock (stock -= qty;
 *                 stockReserved -= qty) y marca `paid`.
 *  - paid=false → si seguía `awaiting_payment`, libera la reserva y marca
 *                 `cancelled`.
 * Estados finales (`paid`/`fulfilled`) no se reprocesan.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../shared/admin.js';

export type SettleResult = 'paid' | 'cancelled' | 'noop';

export async function settleOrder(orderId: string, paid: boolean): Promise<SettleResult> {
  const orderRef = db.collection('orders').doc(orderId);
  return db.runTransaction(async (tx): Promise<SettleResult> => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) return 'noop';
    const order = snap.data() as {
      status: string;
      items: { productId: string; qty: number }[];
    };

    // Idempotencia: estados finales no se reprocesan.
    if (order.status === 'paid' || order.status === 'fulfilled') return 'noop';

    if (paid) {
      if (order.status === 'awaiting_payment') {
        for (const it of order.items) {
          tx.update(db.collection('products').doc(it.productId), {
            stock: FieldValue.increment(-it.qty),
            stockReserved: FieldValue.increment(-it.qty),
          });
        }
      }
      tx.update(orderRef, {
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return 'paid';
    }

    if (order.status === 'awaiting_payment') {
      for (const it of order.items) {
        tx.update(db.collection('products').doc(it.productId), {
          stockReserved: FieldValue.increment(-it.qty),
        });
      }
    }
    tx.update(orderRef, {
      status: 'cancelled',
      updatedAt: FieldValue.serverTimestamp(),
    });
    return 'cancelled';
  });
}
