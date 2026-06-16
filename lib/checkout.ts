/**
 * lib/checkout.ts — Puente cliente con las Cloud Functions de checkout.
 *
 * Llama a las callables de la región southamerica-west1. El cliente NUNCA envía
 * precios: solo { productId, qty }. Los totales y la validación de cupón
 * autoritativa son server-side (createOrder).
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/client';
import type { CartItem } from '@/lib/types.cart';
import type { CustomerInfo } from '@/lib/types.order';

const functions = getFunctions(app, 'southamerica-west1');

/** Mapea el carrito a la entrada de createOrder (sin precios). */
export function cartToItems(items: CartItem[]): { productId: string; qty: number }[] {
  return items.map((i) => ({ productId: i.productId, qty: i.qty }));
}

export interface CreateOrderResult {
  orderId: string;
  redirectUrl: string;
}

const _createOrder = httpsCallable<
  { items: { productId: string; qty: number }[]; customer: CustomerInfo; couponCode?: string },
  CreateOrderResult
>(functions, 'createOrder');

export async function createOrder(input: {
  items: CartItem[];
  customer: CustomerInfo;
  couponCode?: string;
}): Promise<CreateOrderResult> {
  const res = await _createOrder({
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

const _validateCoupon = httpsCallable<{ code: string; subtotal: number }, ValidateCouponResult>(
  functions,
  'validateCoupon',
);

export async function validateCoupon(code: string, subtotal: number): Promise<ValidateCouponResult> {
  const res = await _validateCoupon({ code, subtotal });
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

const _getOrderStatus = httpsCallable<{ orderId: string }, OrderStatusResult>(
  functions,
  'getOrderStatus',
);

export async function getOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const res = await _getOrderStatus({ orderId });
  return res.data;
}
