/**
 * lib/checkout.ts — Puente cliente con el backend de checkout (Next API routes).
 *
 * Llama a /api/checkout/* (Route Handlers con Admin SDK). El cliente NUNCA envía
 * precios: solo { productId, qty }. Totales y validación de cupón autoritativa
 * son server-side. (Antes vivía en Cloud Functions; portado a rutas para correr
 * en el plan gratuito.)
 */
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

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Error de servidor.');
  return data as T;
}

export interface CreateOrderResult {
  orderId: string;
  redirectUrl: string;
}

export async function createOrder(input: {
  items: CartItem[];
  customer: CustomerInfo;
  couponCode?: string;
}): Promise<CreateOrderResult> {
  return postJson<CreateOrderResult>('/api/checkout/create-order', {
    items: cartToItems(input.items),
    customer: input.customer,
    couponCode: input.couponCode || undefined,
  });
}

export interface ValidateCouponResult {
  valid: boolean;
  reason?: string;
  code?: string;
  type?: 'percent' | 'fixed' | 'free_shipping';
  discount?: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<ValidateCouponResult> {
  return postJson<ValidateCouponResult>('/api/checkout/validate-coupon', { code, subtotal });
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

export async function getOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const res = await fetch(`/api/checkout/order-status?orderId=${encodeURIComponent(orderId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'No se pudo consultar el pedido.');
  return data as OrderStatusResult;
}

// --- Pago simulado (mock) ---
export interface MockConfirmResult {
  status: 'paid' | 'cancelled' | 'noop';
}

/** Confirma (acepta/rechaza) un pago simulado. Solo activo en PAYMENTS_MODE=mock. */
export async function mockConfirmPayment(
  orderId: string,
  decision: 'accept' | 'reject',
): Promise<MockConfirmResult> {
  return postJson<MockConfirmResult>('/api/checkout/mock-confirm', { orderId, decision });
}
