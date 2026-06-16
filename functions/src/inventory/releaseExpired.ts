/**
 * functions/src/inventory/releaseExpired.ts — Libera reservas vencidas.
 *
 * Scheduled (cada 10 min): busca órdenes `awaiting_payment` cuya
 * reservationExpiresAt ya pasó, libera el stockReserved que tomaron y las marca
 * `expired`. Cada orden se procesa en su propia transacción para revalidar el
 * estado (evita liberar dos veces si el webhook llegó en paralelo).
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../shared/admin.js';

export const releaseExpiredReservations = onSchedule(
  { region: 'southamerica-west1', schedule: 'every 10 minutes' },
  async () => {
    const now = Timestamp.now();
    const snap = await db
      .collection('orders')
      .where('status', '==', 'awaiting_payment')
      .where('reservationExpiresAt', '<', now)
      .limit(100)
      .get();

    let released = 0;
    for (const docSnap of snap.docs) {
      const orderRef = docSnap.ref;
      await db.runTransaction(async (tx) => {
        const fresh = await tx.get(orderRef);
        if (!fresh.exists) return;
        const order = fresh.data() as {
          status: string;
          items: { productId: string; qty: number }[];
        };
        // Revalidar dentro de la transacción (pudo pagarse mientras tanto).
        if (order.status !== 'awaiting_payment') return;

        for (const it of order.items) {
          tx.update(db.collection('products').doc(it.productId), {
            stockReserved: FieldValue.increment(-it.qty),
          });
        }
        tx.update(orderRef, {
          status: 'expired',
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      released++;
    }

    console.log(`releaseExpiredReservations: ${released} órdenes liberadas.`);
  },
);
