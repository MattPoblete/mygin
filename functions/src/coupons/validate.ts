/**
 * functions/src/coupons/validate.ts — Callable informativa de validación de cupón.
 *
 * Para el feedback del checkout ANTES de pagar. La validación autoritativa (con
 * incremento de redemptions) vive dentro de createOrder; aquí solo se informa si
 * el cupón aplicaría y cuánto descontaría. No escribe nada.
 *
 * Input: { code: string, subtotal: number }
 * Output: { valid: boolean, reason?, code?, type?, discount? }
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../shared/admin.js';
import { SHIPPING_FLAT_CLP } from '../shared/constants.js';
import { findCouponLoose, evaluateCouponSnap, isCouponError } from './logic.js';

interface ValidateCouponData {
  code: string;
  subtotal: number;
}

export const validateCoupon = onCall(
  { region: 'southamerica-west1' },
  async (request) => {
    const { code, subtotal } = (request.data ?? {}) as ValidateCouponData;
    if (typeof code !== 'string' || !code.trim()) {
      throw new HttpsError('invalid-argument', 'Código requerido.');
    }
    const sub = Math.max(0, Math.round(Number(subtotal)) || 0);

    const snap = await findCouponLoose(db, code);
    if (!snap) {
      return { valid: false, reason: 'Cupón no encontrado.' };
    }
    const result = evaluateCouponSnap(snap, sub, SHIPPING_FLAT_CLP);
    if (isCouponError(result)) {
      return { valid: false, reason: result.reason };
    }
    return {
      valid: true,
      code: result.code,
      type: result.type,
      discount: result.discount,
    };
  },
);
