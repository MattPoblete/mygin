/**
 * lib/types.order.ts — Modelo de pedidos (worktree B).
 *
 * Documentos de la colección `orders` de Firestore. Los clientes NUNCA escriben
 * ni leen estos docs directo (lo prohíbe firestore.rules): todo pasa por las
 * Cloud Functions callables (createOrder / getOrderStatus). Los montos y el
 * estado son la fuente de verdad server-side; el cliente nunca dicta precios.
 */
import type { FirestoreTimestamp } from '@/lib/types';

/** Ciclo de vida de una orden. */
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'fulfilled';

/** Línea de la orden, con precio congelado server-side al crearla. */
export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  /** Precio unitario en CLP, recalculado desde Firestore (no del cliente). */
  unitPrice: number;
}

/** Dirección de despacho. */
export interface ShippingAddress {
  region: string;
  comuna: string;
  calle: string;
  numero?: string;
  depto?: string;
  notas?: string;
}

/** Datos del cliente recogidos en el checkout. */
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  rut?: string;
  address: ShippingAddress;
}

/** Datos del pago Flow asociados a la orden. */
export interface FlowInfo {
  token?: string;
  flowOrder?: number;
  /** Estado crudo de Flow: 1 pendiente, 2 pagado, 3 rechazado, 4 anulado. */
  paymentStatus?: number;
}

export interface Order {
  /** docId */
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  /** Suma de unitPrice*qty (CLP), server-side. */
  subtotal: number;
  /** Descuento aplicado por cupón (CLP). */
  discount: number;
  /** Código de cupón aplicado (MAYÚSCULAS). */
  discountCode?: string;
  /** docId del cupón aplicado. */
  couponId?: string;
  /** Costo de despacho (CLP). */
  shipping: number;
  /** subtotal - discount + shipping (CLP). */
  total: number;
  customer: CustomerInfo;
  flow?: FlowInfo;
  /** Vencimiento de la reserva de stock (now + 20min al crear). */
  reservationExpiresAt: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  paidAt?: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}
