'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart/CartProvider';
import { getOrderStatus, type OrderStatusResult } from '@/lib/checkout';
import { formatPrice } from '@/lib/cta';

/**
 * app/(shop)/checkout/retorno/page.tsx — Página de retorno de Flow (urlReturn).
 *
 * Flow redirige aquí tras el pago con ?orderId. Consulta getOrderStatus (no lee
 * Firestore directo). Si está pagada, limpia el carrito y enlaza a la
 * confirmación. Si sigue procesando, ofrece reintentar. El webhook es la fuente
 * de verdad; esta página solo refleja el estado.
 */
function RetornoInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId') ?? '';
  const { clear } = useCart();

  const [order, setOrder] = useState<OrderStatusResult | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [cleared, setCleared] = useState(false);

  const load = () => {
    if (!orderId) {
      setError('Falta el identificador del pedido.');
      setOrder(null);
      return;
    }
    getOrderStatus(orderId)
      .then((o) => {
        setOrder(o);
        if (o.status === 'paid' && !cleared) {
          clear();
          setCleared(true);
        }
      })
      .catch(() => setError('No se pudo consultar el estado del pedido.'));
  };

  useEffect(load, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="min-h-screen bg-background pt-32 pb-32">
      <div className="container mx-auto px-8 md:px-12 max-w-xl">
        {order === undefined && !error && (
          <p className="text-on-surface-variant text-sm animate-pulse">Consultando tu pago…</p>
        )}

        {error && (
          <div>
            <h1 className="font-headline text-3xl tracking-tighter text-on-surface">Algo salió mal</h1>
            <p className="mt-4 text-error text-sm">{error}</p>
            <Link href="/tienda" className="btn-primary mt-6 inline-block">Volver a la tienda</Link>
          </div>
        )}

        {order && order.status === 'paid' && (
          <div className="text-center">
            <h1 className="font-headline text-4xl tracking-tighter text-primary">¡Pago confirmado!</h1>
            <p className="mt-4 text-on-surface-variant">
              Gracias por tu compra. Tu pedido <span className="text-on-surface">{order.orderId}</span> está pagado.
            </p>
            <p className="mt-2 font-headline text-2xl text-on-surface">Total: ${formatPrice(order.total)}</p>
            <Link href={`/checkout/confirmacion/${order.orderId}`} className="btn-primary mt-8 inline-block">
              Ver confirmación
            </Link>
          </div>
        )}

        {order && (order.status === 'awaiting_payment' || order.status === 'pending') && (
          <div className="text-center">
            <h1 className="font-headline text-3xl tracking-tighter text-on-surface">Procesando tu pago…</h1>
            <p className="mt-4 text-on-surface-variant">
              Estamos confirmando el pago con Flow. Esto puede tardar unos segundos.
            </p>
            <button type="button" onClick={load} className="btn-primary mt-6">
              Actualizar estado
            </button>
          </div>
        )}

        {order && (order.status === 'failed' || order.status === 'cancelled' || order.status === 'expired') && (
          <div className="text-center">
            <h1 className="font-headline text-3xl tracking-tighter text-on-surface">El pago no se completó</h1>
            <p className="mt-4 text-on-surface-variant">
              Tu pedido quedó {order.status === 'expired' ? 'expirado' : order.status === 'cancelled' ? 'cancelado' : 'sin pagar'}.
              Puedes intentar de nuevo.
            </p>
            <Link href="/carrito" className="btn-primary mt-6 inline-block">Volver al carrito</Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RetornoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background pt-32 pb-32" />}>
      <RetornoInner />
    </Suspense>
  );
}
