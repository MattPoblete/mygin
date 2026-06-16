'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrderStatus, type OrderStatusResult } from '@/lib/checkout';
import { formatPrice } from '@/lib/cta';

/**
 * app/(shop)/checkout/confirmacion/[orderId]/page.tsx — Confirmación final.
 *
 * Consulta getOrderStatus por id (callable; sin lectura directa de Firestore) y
 * muestra el detalle de la orden y su estado.
 */
export default function ConfirmacionPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderStatusResult | null | undefined>(undefined);

  useEffect(() => {
    getOrderStatus(orderId)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [orderId]);

  return (
    <main className="min-h-screen bg-background pt-32 pb-32">
      <div className="container mx-auto px-8 md:px-12 max-w-xl">
        {order === undefined && (
          <p className="text-on-surface-variant text-sm animate-pulse">Cargando pedido…</p>
        )}

        {order === null && (
          <div>
            <h1 className="font-headline text-3xl tracking-tighter text-on-surface">Pedido no encontrado</h1>
            <Link href="/tienda" className="btn-primary mt-6 inline-block">Volver a la tienda</Link>
          </div>
        )}

        {order && (
          <div>
            <h1 className="font-headline text-4xl tracking-tighter text-on-surface">
              Pedido {order.orderId}
            </h1>
            <p className="mt-2 text-sm uppercase tracking-widest text-secondary">
              Estado: {STATUS_LABEL[order.status] ?? order.status}
            </p>

            <ul className="mt-8 divide-y divide-outline-variant/20 border-y border-outline-variant/20">
              {order.items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-2 py-3 text-sm">
                  <span className="text-on-surface">{i.qty}× {i.name}</span>
                  <span className="tabular-nums text-on-surface-variant">${formatPrice(i.unitPrice * i.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="tabular-nums">${formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Descuento{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                  <span className="tabular-nums">-${formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Despacho</span>
                <span className="tabular-nums">${formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-outline-variant/20 pt-3">
                <span className="text-on-surface">Total</span>
                <span className="font-headline text-2xl text-primary">${formatPrice(order.total)}</span>
              </div>
            </div>

            <Link href="/tienda" className="btn-primary mt-8 inline-block">Seguir comprando</Link>
          </div>
        )}
      </div>
    </main>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  awaiting_payment: 'Esperando pago',
  paid: 'Pagado',
  failed: 'Pago fallido',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  fulfilled: 'Despachado',
};
