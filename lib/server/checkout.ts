/**
 * lib/server/checkout.ts — Lógica de checkout server-side (Admin SDK).
 *
 * Portada desde las Cloud Functions de B a Route Handlers de Next para correr en
 * el plan gratuito (sin Cloud Functions). Se ejecuta SOLO en el servidor (las
 * rutas /api/checkout/*). Usa el Admin SDK (bypassa las reglas de Firestore), así
 * que el cliente NUNCA escribe orders/coupons directo ni dicta precios.
 *
 * Pago: por defecto MOCK (PAYMENTS_MODE != 'live'): createOrder devuelve una URL
 * a /checkout/mock; mockConfirm liquida la orden. El total y la validación de
 * cupón se calculan aquí, server-side.
 */
import 'server-only';
import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type { CustomerInfo } from '@/lib/types.order';

export const SHIPPING_FLAT_CLP = 3990;
export const RESERVATION_MINUTES = 20;

export function isMockMode(): boolean {
  return (process.env.PAYMENTS_MODE ?? 'mock') !== 'live';
}

/** Error de checkout con status HTTP asociado (400 validación, 409 stock/cupón). */
export class CheckoutError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/* ─── Cupones ───────────────────────────────────────────────────── */

type CouponType = 'percent' | 'fixed' | 'free_shipping';
interface CouponDoc {
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  minSubtotal?: number;
  maxRedemptions?: number;
  redemptions?: number;
  startsAt?: Timestamp;
  expiresAt?: Timestamp;
}
export interface EvaluatedCoupon {
  couponId: string;
  code: string;
  type: CouponType;
  discount: number;
}

function evaluateCoupon(
  snap: DocumentSnapshot,
  subtotal: number,
  shipping: number,
): EvaluatedCoupon | { error: string } {
  const c = snap.data() as CouponDoc | undefined;
  if (!c) return { error: 'Cupón no encontrado.' };
  if (!c.active) return { error: 'Cupón inactivo.' };
  const nowMs = Date.now();
  if (c.startsAt && c.startsAt.toMillis() > nowMs) return { error: 'El cupón aún no está vigente.' };
  if (c.expiresAt && c.expiresAt.toMillis() < nowMs) return { error: 'El cupón está vencido.' };
  if (typeof c.minSubtotal === 'number' && subtotal < c.minSubtotal) {
    return { error: `Requiere un subtotal mínimo de $${c.minSubtotal}.` };
  }
  const redemptions = c.redemptions ?? 0;
  if (typeof c.maxRedemptions === 'number' && redemptions >= c.maxRedemptions) {
    return { error: 'El cupón alcanzó su límite de canjes.' };
  }
  let discount = 0;
  if (c.type === 'percent') discount = Math.round((subtotal * c.value) / 100);
  else if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
  else if (c.type === 'free_shipping') discount = shipping;
  discount = Math.max(0, Math.round(discount));
  return { couponId: snap.id, code: c.code, type: c.type, discount };
}

/** Validación informativa (pre-pago). Lee por docId y, si no, por query. */
export async function validateCouponServer(rawCode: string, rawSubtotal: number) {
  const code = String(rawCode ?? '').trim().toUpperCase();
  if (!code) throw new CheckoutError('Código requerido.');
  const subtotal = Math.max(0, Math.round(Number(rawSubtotal)) || 0);

  let snap: DocumentSnapshot | null = null;
  const byId = await adminDb.collection('coupons').doc(code).get();
  if (byId.exists) snap = byId;
  else {
    const q = await adminDb.collection('coupons').where('code', '==', code).limit(1).get();
    if (!q.empty) snap = q.docs[0];
  }
  if (!snap) return { valid: false as const, reason: 'Cupón no encontrado.' };

  const res = evaluateCoupon(snap, subtotal, SHIPPING_FLAT_CLP);
  if ('error' in res) return { valid: false as const, reason: res.error };
  return { valid: true as const, code: res.code, type: res.type, discount: res.discount };
}

/* ─── Crear orden (transacción atómica) ─────────────────────────── */

interface InItem {
  productId: string;
  qty: number;
}

function sanitizeCustomer(c: CustomerInfo | undefined): CustomerInfo {
  if (!c || typeof c !== 'object') throw new CheckoutError('Faltan los datos del cliente.');
  const a = c.address ?? ({} as CustomerInfo['address']);
  const req = (v: unknown, field: string): string => {
    if (typeof v !== 'string' || !v.trim()) throw new CheckoutError(`Campo requerido: ${field}.`);
    return v.trim();
  };
  const opt = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;
  return {
    name: req(c.name, 'nombre'),
    email: req(c.email, 'email'),
    phone: req(c.phone, 'teléfono'),
    rut: opt(c.rut),
    address: {
      region: req(a.region, 'región'),
      comuna: req(a.comuna, 'comuna'),
      calle: req(a.calle, 'calle'),
      numero: opt(a.numero),
      depto: opt(a.depto),
      notas: opt(a.notas),
    },
  };
}

export async function createOrderServer(input: {
  items: InItem[];
  customer: CustomerInfo;
  couponCode?: string;
}): Promise<{ orderId: string; redirectUrl: string }> {
  if (!input || !Array.isArray(input.items) || input.items.length === 0) {
    throw new CheckoutError('El carrito está vacío.');
  }
  const wanted = new Map<string, number>();
  for (const it of input.items) {
    if (!it || typeof it.productId !== 'string' || !it.productId) {
      throw new CheckoutError('Ítem inválido en el carrito.');
    }
    const qty = Math.floor(Number(it.qty));
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new CheckoutError(`Cantidad inválida para ${it.productId}.`);
    }
    wanted.set(it.productId, (wanted.get(it.productId) ?? 0) + qty);
  }
  const customer = sanitizeCustomer(input.customer);
  const couponCode = typeof input.couponCode === 'string' ? input.couponCode.trim().toUpperCase() : '';

  const reservationExpiresAt = Timestamp.fromMillis(Date.now() + RESERVATION_MINUTES * 60 * 1000);
  const orderRef = adminDb.collection('orders').doc();

  await adminDb.runTransaction(async (tx) => {
    const ids = [...wanted.keys()];
    const productRefs = ids.map((id) => adminDb.collection('products').doc(id));
    const snaps = await tx.getAll(...productRefs);

    // Cupón: lectura por docId dentro de la transacción.
    let couponSnap: DocumentSnapshot | null = null;
    if (couponCode) {
      const cs = await tx.get(adminDb.collection('coupons').doc(couponCode));
      couponSnap = cs.exists ? cs : null;
    }

    const orderItems: { productId: string; name: string; qty: number; unitPrice: number }[] = [];
    let subtotal = 0;
    for (let i = 0; i < ids.length; i++) {
      const snap = snaps[i];
      const qty = wanted.get(ids[i])!;
      if (!snap.exists) throw new CheckoutError(`Producto no disponible: ${ids[i]}.`, 409);
      const p = snap.data() as { name: string; price: number; stock: number; stockReserved: number; active: boolean };
      if (!p.active) throw new CheckoutError(`Producto no disponible: ${p.name}.`, 409);
      const available = (p.stock ?? 0) - (p.stockReserved ?? 0);
      if (available < qty) {
        throw new CheckoutError(
          `Sin stock suficiente para "${p.name}" (disponible ${available}, pedido ${qty}).`,
          409,
        );
      }
      const unitPrice = Math.round(Number(p.price)) || 0;
      subtotal += unitPrice * qty;
      orderItems.push({ productId: ids[i], name: p.name, qty, unitPrice });
    }

    const shipping = SHIPPING_FLAT_CLP;
    let discount = 0;
    let evaluated: EvaluatedCoupon | null = null;
    if (couponCode) {
      if (!couponSnap) throw new CheckoutError('El cupón no existe.', 409);
      const res = evaluateCoupon(couponSnap, subtotal, shipping);
      if ('error' in res) throw new CheckoutError(res.error, 409);
      evaluated = res;
      discount = res.discount;
    }
    const total = Math.max(0, subtotal - discount + shipping);

    // Reservar stock.
    for (let i = 0; i < ids.length; i++) {
      tx.update(productRefs[i], { stockReserved: FieldValue.increment(wanted.get(ids[i])!) });
    }
    if (evaluated && couponSnap) {
      tx.update(couponSnap.ref, { redemptions: FieldValue.increment(1) });
    }

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
      flow: { token: `MOCK-${orderRef.id}` },
      reservationExpiresAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  // Pago simulado: URL a la ventana de pago mock. (Flow real iría aquí en modo live.)
  return { orderId: orderRef.id, redirectUrl: `/checkout/mock?orderId=${orderRef.id}` };
}

/* ─── Liquidar orden (mock confirm / webhook) ───────────────────── */

export type SettleResult = 'paid' | 'cancelled' | 'noop';

export async function settleOrder(orderId: string, paid: boolean): Promise<SettleResult> {
  const orderRef = adminDb.collection('orders').doc(orderId);
  return adminDb.runTransaction(async (tx): Promise<SettleResult> => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) return 'noop';
    const order = snap.data() as { status: string; items: { productId: string; qty: number }[] };
    if (order.status === 'paid' || order.status === 'fulfilled') return 'noop';

    if (paid) {
      if (order.status === 'awaiting_payment') {
        for (const it of order.items) {
          tx.update(adminDb.collection('products').doc(it.productId), {
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
        tx.update(adminDb.collection('products').doc(it.productId), {
          stockReserved: FieldValue.increment(-it.qty),
        });
      }
    }
    tx.update(orderRef, { status: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    return 'cancelled';
  });
}

/* ─── Estado de orden (subconjunto seguro) ──────────────────────── */

export async function getOrderStatusServer(orderId: string) {
  if (typeof orderId !== 'string' || !orderId) throw new CheckoutError('orderId requerido.');
  const snap = await adminDb.collection('orders').doc(orderId).get();
  if (!snap.exists) throw new CheckoutError('Orden no encontrada.', 404);
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
}
