/**
 * lib/coupons.ts — Acceso a la colección `coupons` de Firestore (client SDK).
 *
 * Solo el admin lee/escribe (lo exige firestore.rules: read/write solo admin).
 * El docId es el code en MAYÚSCULAS (igual que productos usa el slug). La
 * validación de cupones para clientes pasa por callables, nunca por este módulo.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Coupon, CouponType } from '@/lib/types.coupon';

const COLLECTION = 'coupons';

/** Campos editables desde el formulario de admin. */
export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  minSubtotal?: number | null;
  maxRedemptions?: number | null;
  /** ISO date string (yyyy-mm-dd) o vacío. */
  startsAt?: string | null;
  expiresAt?: string | null;
}

export async function listCoupons(): Promise<Coupon[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coupon);
}

export async function getCoupon(id: string): Promise<Coupon | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Coupon) : null;
}

/** Crea un cupón usando el code (MAYÚSCULAS) como docId. */
export async function createCoupon(input: CouponInput): Promise<string> {
  const id = input.code.trim().toUpperCase();
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, {
    ...normalize(input),
    redemptions: 0,
    createdAt: serverTimestamp(),
  });
  return id;
}

/** Actualiza un cupón. No reescribe `redemptions` (lo manejan las Functions). */
export async function updateCoupon(id: string, input: CouponInput): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, normalize(input));
}

export async function deleteCoupon(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Limpia tipos antes de escribir. Fechas → Timestamp; vacíos → null/omitidos. */
function normalize(input: CouponInput) {
  const code = input.code.trim().toUpperCase();
  const toTs = (s?: string | null) => (s ? Timestamp.fromDate(new Date(`${s}T00:00:00`)) : null);
  return {
    code,
    type: input.type,
    value: Math.max(0, Math.round(Number(input.value)) || 0),
    active: Boolean(input.active),
    minSubtotal:
      input.minSubtotal != null && input.minSubtotal !== ('' as unknown)
        ? Math.max(0, Math.round(Number(input.minSubtotal)))
        : null,
    maxRedemptions:
      input.maxRedemptions != null && input.maxRedemptions !== ('' as unknown)
        ? Math.max(1, Math.round(Number(input.maxRedemptions)))
        : null,
    startsAt: toTs(input.startsAt),
    expiresAt: toTs(input.expiresAt),
  };
}
