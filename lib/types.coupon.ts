/**
 * lib/types.coupon.ts — Modelo de cupones (worktree B).
 *
 * Documentos de la colección `coupons` de Firestore. Solo el admin lee/escribe
 * por reglas; los clientes nunca los leen directo. La validación informativa la
 * hace la callable validateCoupon; la autoritativa vive dentro de createOrder.
 */
import type { FirestoreTimestamp } from '@/lib/types';

/** Tipo de descuento del cupón. */
export type CouponType = 'percent' | 'fixed' | 'free_shipping';

export interface Coupon {
  /** docId (usamos el code en MAYÚSCULAS como docId). */
  id: string;
  /** Código en MAYÚSCULAS. */
  code: string;
  type: CouponType;
  /** percent: 0-100; fixed: CLP; free_shipping: ignorado. */
  value: number;
  active: boolean;
  /** Subtotal mínimo requerido (CLP). */
  minSubtotal?: number;
  /** Máximo de canjes permitidos. */
  maxRedemptions?: number;
  /** Canjes realizados. */
  redemptions: number;
  startsAt?: FirestoreTimestamp;
  expiresAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
}
