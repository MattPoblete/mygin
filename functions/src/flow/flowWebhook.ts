/**
 * functions/src/flow/flowWebhook.ts — Webhook público de confirmación de Flow.
 *
 * Flow hace POST form-encoded con `token` a esta URL (urlConfirmation). NUNCA se
 * confía en el POST: se consulta getStatus(token) como fuente de verdad.
 *
 * Idempotente: si la orden ya está `paid`, responde 200 sin reprocesar. Si el
 * pago está confirmado (status 2): transacción que descuenta stock (commit) y
 * marca la orden `paid`. Si rechazado/anulado (3/4): libera la reserva y marca
 * `failed`/`cancelled`. SIEMPRE responde 200 (Flow reintenta ante no-200).
 */
import { onRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../shared/admin.js';
import { getStatus } from './flowClient.js';
import { FLOW_API_KEY, FLOW_SECRET_KEY } from './createOrder.js';

export const flowWebhook = onRequest(
  { region: 'southamerica-west1', secrets: [FLOW_API_KEY, FLOW_SECRET_KEY] },
  async (req, res) => {
    try {
      const token = (req.body?.token ?? req.query?.token) as string | undefined;
      if (!token) {
        res.status(200).send('missing token');
        return;
      }

      const creds = { apiKey: FLOW_API_KEY.value(), secretKey: FLOW_SECRET_KEY.value() };
      const status = await getStatus(token, creds);

      const orderId = status.commerceOrder;
      if (!orderId) {
        res.status(200).send('no order');
        return;
      }
      const orderRef = db.collection('orders').doc(orderId);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(orderRef);
        if (!snap.exists) return;
        const order = snap.data() as {
          status: string;
          items: { productId: string; qty: number }[];
        };

        // Idempotencia: estados finales no se reprocesan.
        if (order.status === 'paid' || order.status === 'fulfilled') return;

        if (status.status === 2) {
          // Pagado: commit de stock (stock -= qty; stockReserved -= qty).
          // Solo si la orden seguía reservando (awaiting_payment).
          if (order.status === 'awaiting_payment') {
            for (const it of order.items) {
              const pRef = db.collection('products').doc(it.productId);
              tx.update(pRef, {
                stock: FieldValue.increment(-it.qty),
                stockReserved: FieldValue.increment(-it.qty),
              });
            }
          }
          tx.update(orderRef, {
            status: 'paid',
            'flow.paymentStatus': status.status,
            paidAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else if (status.status === 3 || status.status === 4) {
          // Rechazado/anulado: liberar reserva si aún estaba reservando.
          if (order.status === 'awaiting_payment') {
            for (const it of order.items) {
              const pRef = db.collection('products').doc(it.productId);
              tx.update(pRef, { stockReserved: FieldValue.increment(-it.qty) });
            }
          }
          tx.update(orderRef, {
            status: status.status === 4 ? 'cancelled' : 'failed',
            'flow.paymentStatus': status.status,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          // status 1 (pendiente): solo registrar, no tocar stock.
          tx.update(orderRef, {
            'flow.paymentStatus': status.status,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });

      res.status(200).send('ok');
    } catch (err) {
      // No revelar detalles; responder 200 igualmente evitaría reintentos útiles,
      // pero si falló getStatus conviene que Flow reintente → 200 solo en éxito.
      console.error('flowWebhook error', err);
      res.status(200).send('error-logged');
    }
  },
);
