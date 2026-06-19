'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart/CartProvider';
import { getOrderStatus, type OrderStatusResult } from '@/lib/checkout';
import { formatPrice } from '@/lib/cta';
import { ORDER_POLL_DELAYS } from '@/lib/constants';

/**
 * app/(shop)/checkout/retorno/page.tsx — Página de retorno de Flow (urlReturn).
 *
 * Flow redirige aquí tras el pago con ?orderId. Consulta getOrderStatus (no lee
 * Firestore directo). Si está pagada, limpia el carrito y enlaza a la
 * confirmación. Si sigue procesando, ofrece reintentar. El webhook es la fuente
 * de verdad; esta página solo refleja el estado.
 */
// Estados terminales: ya no tiene sentido seguir consultando.
const TERMINAL = new Set(['paid', 'fulfilled', 'failed', 'cancelled', 'expired']);

function RetornoInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId') ?? '';
  const { clear } = useCart();

  const [order, setOrder] = useState<OrderStatusResult | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [cleared, setCleared] = useState(false);
  const [autoPolling, setAutoPolling] = useState(true);

  const load = () => {
    if (!orderId) {
      setError('Falta el identificador del pedido.');
      setOrder(null);
      return Promise.resolve<OrderStatusResult | null>(null);
    }
    return getOrderStatus(orderId)
      .then((o) => {
        setOrder(o);
        if (o.status === 'paid' && !cleared) {
          clear();
          setCleared(true);
        }
        return o;
      })
      .catch(() => {
        setError('No se pudo consultar el estado del pedido.');
        return null;
      });
  };

  // Auto-poll con backoff mientras la orden no esté en un estado terminal.
  useEffect(() => {
    if (!orderId) {
      setError('Falta el identificador del pedido.');
      setOrder(null);
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let attempt = 0;

    const tick = async () => {
      const o = await load();
      if (cancelled) return;
      if (o && TERMINAL.has(o.status)) {
        setAutoPolling(false);
        return;
      }
      if (attempt < ORDER_POLL_DELAYS.length) {
        timers.push(setTimeout(tick, ORDER_POLL_DELAYS[attempt++]));
      } else {
        setAutoPolling(false);
      }
    };
    tick();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

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
            <p className="mt-2 font-headline text-2xl text-on-surface">Total: {formatPrice(order.total)}</p>
            <Link href={`/checkout/confirmacion/${order.orderId}`} className="btn-primary mt-8 inline-block">
              Ver confirmación
            </Link>
          </div>
        )}

        {order && (order.status === 'awaiting_payment' || order.status === 'pending') && (
          <div className="text-center">
            <h1 className="font-headline text-3xl tracking-tighter text-on-surface">Confirmando tu pago…</h1>
            <p className="mt-4 text-on-surface-variant">
              {autoPolling
                ? 'Estamos verificando el pago con la pasarela. Esto puede tardar unos segundos; no cierres esta página.'
                : 'Aún no recibimos la confirmación. Si ya pagaste, actualiza el estado en unos instantes.'}
            </p>
            {!autoPolling && (
              <button type="button" onClick={load} className="btn-primary mt-6">
                Actualizar estado
              </button>
            )}
          </div>
        )}

        {order && (order.status === 'failed' || order.status === 'cancelled' || order.status === 'expired') && (
          <div className="text-center">
            <h1 className="font-headline text-3xl tracking-tighter text-on-surface">El pago no se completó</h1>
            <p className="mt-4 text-on-surface-variant">
              {order.status === 'expired'
                ? 'El tiempo para pagar este pedido expiró.'
                : order.status === 'cancelled'
                  ? 'Cancelaste el pago de este pedido.'
                  : 'No pudimos procesar el pago de este pedido.'}{' '}
              No se realizó ningún cargo. Puedes intentar de nuevo.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/checkout" className="btn-primary inline-block">Reintentar pago</Link>
              <Link href="/carrito" className="btn-outline inline-block">Volver al carrito</Link>
            </div>
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
