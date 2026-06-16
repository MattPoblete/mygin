/**
 * functions/src/coupons/logic.ts — Lógica de cupones (server-side).
 *
 * Reutilizada por validateCoupon (informativo) y createOrder (autoritativo).
 * `evaluateCoupon` solo lee/valida y calcula el descuento; el incremento atómico
 * de `redemptions` ocurre dentro de la transacción de createOrder.
 */
import type { DocumentSnapshot, Firestore, Timestamp } from 'firebase-admin/firestore';

export type CouponType = 'percent' | 'fixed' | 'free_shipping';

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
  /** Descuento en CLP ya calculado. */
  discount: number;
}

export interface CouponError {
  ok: false;
  reason: string;
}

/**
 * Localiza el doc del cupón por code (MAYÚSCULAS) usando el code como docId
 * (la convención de createCoupon). Lectura por docId → segura dentro de una
 * transacción. Devuelve null si no existe.
 */
export async function findCouponByCode(
  db: Firestore,
  rawCode: string,
  get: (ref: FirebaseFirestore.DocumentReference) => Promise<DocumentSnapshot>,
): Promise<DocumentSnapshot | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const snap = await get(db.collection('coupons').doc(code));
  return snap.exists ? snap : null;
}

/**
 * Variante NO transaccional: busca por docId y, si no existe, por query sobre el
 * campo `code`. Solo para validateCoupon (informativo), nunca dentro de una
 * transacción (Firestore prohíbe queries transaccionales mezcladas).
 */
export async function findCouponLoose(
  db: Firestore,
  rawCode: string,
): Promise<DocumentSnapshot | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;
  const byId = await db.collection('coupons').doc(code).get();
  if (byId.exists) return byId;
  const q = await db.collection('coupons').where('code', '==', code).limit(1).get();
  return q.empty ? null : q.docs[0];
}

/**
 * Valida un cupón ya cargado contra el subtotal y calcula el descuento. No toca
 * Firestore. `shipping` se usa para free_shipping.
 */
export function evaluateCouponSnap(
  snap: DocumentSnapshot,
  subtotal: number,
  shipping: number,
): EvaluatedCoupon | CouponError {
  const c = snap.data() as CouponDoc | undefined;
  if (!c) return { ok: false, reason: 'Cupón no encontrado.' };
  if (!c.active) return { ok: false, reason: 'Cupón inactivo.' };

  const nowMs = Date.now();
  if (c.startsAt && c.startsAt.toMillis() > nowMs) {
    return { ok: false, reason: 'El cupón aún no está vigente.' };
  }
  if (c.expiresAt && c.expiresAt.toMillis() < nowMs) {
    return { ok: false, reason: 'El cupón está vencido.' };
  }
  if (typeof c.minSubtotal === 'number' && subtotal < c.minSubtotal) {
    return { ok: false, reason: `Requiere un subtotal mínimo de $${c.minSubtotal}.` };
  }
  const redemptions = c.redemptions ?? 0;
  if (typeof c.maxRedemptions === 'number' && redemptions >= c.maxRedemptions) {
    return { ok: false, reason: 'El cupón alcanzó su límite de canjes.' };
  }

  let discount = 0;
  if (c.type === 'percent') discount = Math.round((subtotal * c.value) / 100);
  else if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
  else if (c.type === 'free_shipping') discount = shipping;
  discount = Math.max(0, Math.round(discount));

  return { couponId: snap.id, code: c.code, type: c.type, discount };
}

export function isCouponError(x: EvaluatedCoupon | CouponError): x is CouponError {
  return (x as CouponError).ok === false;
}
