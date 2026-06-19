/**
 * lib/checkout.ts — Puente cliente con el backend de checkout (Cloud Functions).
 *
 * Invoca las callables de `functions/` (Admin SDK) vía httpsCallable. El cliente
 * NUNCA envía precios: solo { productId, qty }. Totales y validación de cupón
 * autoritativa son server-side. Los errores de las callables llegan como
 * `FunctionsError` con `.message` = el mensaje del HttpsError; las páginas leen
 * `err.message` directo, así que no se re-envuelven.
 */
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/client';
import type { CartItem } from '@/lib/types.cart';
import type { CustomerInfo } from '@/lib/types.order';

/** Mapea el carrito a la entrada de createOrder (sin precios). */
export function cartToItems(items: CartItem[]): { productId: string; qty: number }[] {
  return items.map((i) => ({ productId: i.productId, qty: i.qty }));
}

/**
 * Valida un RUT chileno (módulo 11). Acepta con o sin puntos/guion.
 * Devuelve true para RUT bien formado y con dígito verificador correcto.
 */
export function isValidRut(rut: string): boolean {
  const clean = rut.replace(/[.\-\s]/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  const expected = res === 11 ? '0' : res === 10 ? 'K' : String(res);
  return dv === expected;
}
// Autochequeo (RUT de ejemplo oficial 12.345.678-5).
if (process.env.NODE_ENV !== 'production') {
  console.assert(isValidRut('12.345.678-5') && !isValidRut('12.345.678-9'), 'isValidRut self-check failed');
}

export interface CreateOrderResult {
  orderId: string;
  redirectUrl: string;
}

const createOrderFn = httpsCallable<
  { items: { productId: string; qty: number }[]; customer: CustomerInfo; couponCode?: string },
  CreateOrderResult
>(functions, 'createOrder');

export async function createOrder(input: {
  items: CartItem[];
  customer: CustomerInfo;
  couponCode?: string;
}): Promise<CreateOrderResult> {
  const res = await createOrderFn({
    items: cartToItems(input.items),
    customer: input.customer,
    couponCode: input.couponCode || undefined,
  });
  return res.data;
}

export interface ValidateCouponResult {
  valid: boolean;
  reason?: string;
  code?: string;
  type?: 'percent' | 'fixed' | 'free_shipping';
  discount?: number;
}

const validateCouponFn = httpsCallable<{ code: string; subtotal: number }, ValidateCouponResult>(
  functions,
  'validateCoupon',
);

export async function validateCoupon(code: string, subtotal: number): Promise<ValidateCouponResult> {
  const res = await validateCouponFn({ code, subtotal });
  return res.data;
}

export interface OrderStatusResult {
  orderId: string;
  status: 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'fulfilled';
  subtotal: number;
  discount: number;
  discountCode: string | null;
  shipping: number;
  total: number;
  items: { productId: string; name: string; qty: number; unitPrice: number }[];
  createdAt: number | null;
}

const getOrderStatusFn = httpsCallable<{ orderId: string }, OrderStatusResult>(
  functions,
  'getOrderStatus',
);

export async function getOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const res = await getOrderStatusFn({ orderId });
  return res.data;
}

// --- Pago simulado (mock) ---
export interface MockConfirmResult {
  status: 'paid' | 'cancelled' | 'noop';
}

const mockConfirmFn = httpsCallable<{ orderId: string; decision: 'accept' | 'reject' }, MockConfirmResult>(
  functions,
  'mockConfirmPayment',
);

/** Confirma (acepta/rechaza) un pago simulado. Solo activo en PAYMENTS_MODE=mock. */
export async function mockConfirmPayment(
  orderId: string,
  decision: 'accept' | 'reject',
): Promise<MockConfirmResult> {
  const res = await mockConfirmFn({ orderId, decision });
  return res.data;
}
