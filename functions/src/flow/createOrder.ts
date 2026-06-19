/**
 * functions/src/flow/createOrder.ts — Callable que crea la orden y arranca el pago.
 *
 * Contrato de entrada: { items: {productId, qty}[], customer: CustomerInfo, couponCode?: string }
 * Contrato de salida:   { orderId: string, redirectUrl: string }
 *
 * En UNA sola transacción Firestore: lee los products, valida stock disponible,
 * RECALCULA precios desde Firestore (ignora cualquier monto del cliente), valida
 * y aplica cupón, incrementa stockReserved y crea el doc `orders` en estado
 * `awaiting_payment` con reservationExpiresAt = now + 20min. Luego llama a Flow
 * para crear el pago y guarda el token; devuelve la redirectUrl.
 *
 * El cliente NUNCA dicta precios ni totales: todo es server-side.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../shared/admin.js';
import { SHIPPING_FLAT_CLP, RESERVATION_MINUTES } from '../shared/constants.js';
import { REGION, functionsBase, siteBase } from '../shared/config.js';
import { isMockMode } from '../shared/payments.js';
import { createPayment } from './flowClient.js';
import {
  findCouponByCode,
  evaluateCouponSnap,
  isCouponError,
  type EvaluatedCoupon,
} from '../coupons/logic.js';

export const FLOW_API_KEY = defineSecret('FLOW_API_KEY');
export const FLOW_SECRET_KEY = defineSecret('FLOW_SECRET_KEY');

interface InItem {
  productId: string;
  qty: number;
}

interface InAddress {
  region: string;
  comuna: string;
  calle: string;
  numero?: string;
  depto?: string;
  notas?: string;
}

interface InCustomer {
  name: string;
  email: string;
  phone: string;
  rut?: string;
  address: InAddress;
}

interface CreateOrderData {
  items: InItem[];
  customer: InCustomer;
  couponCode?: string;
}

function sanitizeCustomer(c: InCustomer | undefined): InCustomer {
  if (!c || typeof c !== 'object') {
    throw new HttpsError('invalid-argument', 'Faltan los datos del cliente.');
  }
  const a = c.address ?? ({} as InAddress);
  const reqStr = (v: unknown, field: string): string => {
    if (typeof v !== 'string' || !v.trim()) {
      throw new HttpsError('invalid-argument', `Campo requerido: ${field}.`);
    }
    return v.trim();
  };
  const optStr = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;

  return {
    name: reqStr(c.name, 'nombre'),
    email: reqStr(c.email, 'email'),
    phone: reqStr(c.phone, 'teléfono'),
    rut: optStr(c.rut),
    address: {
      region: reqStr(a.region, 'región'),
      comuna: reqStr(a.comuna, 'comuna'),
      calle: reqStr(a.calle, 'calle'),
      numero: optStr(a.numero),
      depto: optStr(a.depto),
      notas: optStr(a.notas),
    },
  };
}

export const createOrder = onCall(
  { region: REGION, secrets: [FLOW_API_KEY, FLOW_SECRET_KEY] },
  async (request) => {
    const data = request.data as CreateOrderData;

    // --- Validación de entrada ---
    if (!data || !Array.isArray(data.items) || data.items.length === 0) {
      throw new HttpsError('invalid-argument', 'El carrito está vacío.');
    }
    // Normaliza items: agrupa por productId, valida qty entera positiva.
    const wanted = new Map<string, number>();
    for (const it of data.items) {
      if (!it || typeof it.productId !== 'string' || !it.productId) {
        throw new HttpsError('invalid-argument', 'Ítem inválido en el carrito.');
      }
      const qty = Math.floor(Number(it.qty));
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new HttpsError('invalid-argument', `Cantidad inválida para ${it.productId}.`);
      }
      wanted.set(it.productId, (wanted.get(it.productId) ?? 0) + qty);
    }
    const customer = sanitizeCustomer(data.customer);
    const couponCode = typeof data.couponCode === 'string' ? data.couponCode.trim() : '';

    const reservationExpiresAt = Timestamp.fromMillis(
      Date.now() + RESERVATION_MINUTES * 60 * 1000,
    );
    const orderRef = db.collection('orders').doc();

    // --- Transacción: precios + stock + cupón + creación de la orden ---
    const txResult = await db.runTransaction(async (tx) => {
      const ids = [...wanted.keys()];
      const productRefs = ids.map((id) => db.collection('products').doc(id));
      const snaps = await tx.getAll(...productRefs);

      // Cupón: leer su snapshot dentro de la transacción (si hay code).
      // Lectura por docId (code en MAYÚSCULAS) → segura transaccionalmente.
      let couponSnap = null as Awaited<ReturnType<typeof findCouponByCode>>;
      if (couponCode) {
        couponSnap = await findCouponByCode(db, couponCode, (ref) => tx.get(ref));
      }

      const orderItems: { productId: string; name: string; qty: number; unitPrice: number }[] = [];
      let subtotal = 0;

      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const snap = snaps[i];
        const qty = wanted.get(id)!;
        if (!snap.exists) {
          throw new HttpsError('failed-precondition', `Producto no disponible: ${id}.`);
        }
        const p = snap.data() as {
          name: string;
          price: number;
          stock: number;
          stockReserved: number;
          active: boolean;
        };
        if (!p.active) {
          throw new HttpsError('failed-precondition', `Producto no disponible: ${p.name}.`);
        }
        const available = (p.stock ?? 0) - (p.stockReserved ?? 0);
        if (available < qty) {
          throw new HttpsError(
            'failed-precondition',
            `Sin stock suficiente para "${p.name}" (disponible ${available}, pedido ${qty}).`,
          );
        }
        const unitPrice = Math.round(Number(p.price)) || 0;
        subtotal += unitPrice * qty;
        orderItems.push({ productId: id, name: p.name, qty, unitPrice });
      }

      // --- Cupón ---
      const shipping = SHIPPING_FLAT_CLP;
      let discount = 0;
      let evaluated: EvaluatedCoupon | null = null;
      if (couponCode) {
        if (!couponSnap) {
          throw new HttpsError('failed-precondition', 'El cupón no existe.');
        }
        const evalResult = evaluateCouponSnap(couponSnap, subtotal, shipping);
        if (isCouponError(evalResult)) {
          throw new HttpsError('failed-precondition', evalResult.reason);
        }
        evaluated = evalResult;
        discount = evalResult.discount;
      }

      const total = Math.max(0, subtotal - discount + shipping);

      // --- Escrituras: reservar stock ---
      for (let i = 0; i < ids.length; i++) {
        const qty = wanted.get(ids[i])!;
        tx.update(productRefs[i], { stockReserved: FieldValue.increment(qty) });
      }
      // Incrementar redemptions del cupón atómicamente.
      if (evaluated && couponSnap) {
        tx.update(couponSnap.ref, { redemptions: FieldValue.increment(1) });
      }

      // --- Crear la orden ---
      tx.set(orderRef, {
        status: 'awaiting_payment',
        items: orderItems,
        subtotal,
        discount,
        discountCode: evaluated?.code ?? null,
        couponId: evaluated?.couponId ?? null,
        shipping,
        total,
        customer,
        flow: {},
        reservationExpiresAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { subtotal, discount, total, items: orderItems };
    });

    // --- Pago SIMULADO (mock): no se llama a Flow ---
    // Devuelve una URL relativa a la ventana de pago simulada; el cliente la abre
    // en una ventana nueva y la confirma vía mockConfirmPayment.
    if (isMockMode()) {
      await orderRef.update({
        'flow.token': `MOCK-${orderRef.id}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { orderId: orderRef.id, redirectUrl: `/checkout/mock?orderId=${orderRef.id}` };
    }

    // --- Crear el pago en Flow (fuera de la transacción) ---
    const creds = { apiKey: FLOW_API_KEY.value(), secretKey: FLOW_SECRET_KEY.value() };
    // urlConfirmation (webhook) y urlReturn. Las bases de Functions y del sitio
    // son configurables por env; defaults derivados del projectId (ver config.ts).
    const fnBase = functionsBase();
    const siteBaseUrl = siteBase();

    try {
      const payment = await createPayment(
        {
          commerceOrder: orderRef.id,
          subject: `MyGin pedido ${orderRef.id}`,
          amount: txResult.total,
          email: customer.email,
          urlConfirmation: `${fnBase}/flowWebhook`,
          urlReturn: `${siteBaseUrl}/checkout/retorno?orderId=${orderRef.id}`,
        },
        creds,
      );

      await orderRef.update({
        'flow.token': payment.token,
        'flow.flowOrder': payment.flowOrder,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { orderId: orderRef.id, redirectUrl: payment.redirectUrl };
    } catch (err) {
      // Flow falló: liberar reservas y marcar la orden fallida para no colgar stock.
      await db.runTransaction(async (tx) => {
        const ids = [...wanted.keys()];
        const refs = ids.map((id) => db.collection('products').doc(id));
        for (let i = 0; i < ids.length; i++) {
          tx.update(refs[i], { stockReserved: FieldValue.increment(-wanted.get(ids[i])!) });
        }
        tx.update(orderRef, { status: 'failed', updatedAt: FieldValue.serverTimestamp() });
      });
      throw new HttpsError('internal', 'No se pudo iniciar el pago. Intenta de nuevo.', {
        cause: (err as Error).message,
      });
    }
  },
);
