'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrderStatus, mockConfirmPayment, type OrderStatusResult } from '@/lib/checkout';
import { formatPrice } from '@/lib/cta';

/**
 * app/(shop)/checkout/mock/page.tsx — Pasarela de pago SIMULADA (mock de Flow).
 *
 * Se abre en la misma pestaña desde el checkout. Muestra el total y permite
 * Aceptar o Rechazar el pago. Al decidir, llama a `mockConfirmPayment` (liquida
 * la orden server-side) y redirige a /checkout/retorno, igual que Flow real.
 */
function MockInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId') ?? '';

  const [order, setOrder] = useState<OrderStatusResult | null | undefined>(undefined);
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState<'paid' | 'cancelled' | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Falta el identificador del pedido.');
      setOrder(null);
      return;
    }
    getOrderStatus(orderId)
      .then(setOrder)
      .catch(() => setError('No se pudo cargar el pedido.'));
  }, [orderId]);

  const decide = async (decision: 'accept' | 'reject') => {
    setError('');
    setBusy(decision);
    try {
      const { status } = await mockConfirmPayment(orderId, decision);
      setDone(status === 'paid' ? 'paid' : 'cancelled');
      // Misma pestaña: ir a /checkout/retorno, que confirma el estado y limpia
      // el carrito (mismo camino que Flow real).
      window.location.href = `/checkout/retorno?orderId=${orderId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo procesar el pago.');
      setBusy(null);
    }
  };

  return (
    <main className="min-h-screen bg-surface-container-lowest flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-low p-8">
        <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-5">
          <span className="inline-block h-3 w-3 rounded-full bg-primary" />
          <span className="font-headline text-lg tracking-tighter text-on-surface">
            Pago simulado <span className="text-on-surface-variant text-xs">(demo · no es Flow real)</span>
          </span>
        </div>

        {order === undefined && !error && (
          <p className="mt-8 text-on-surface-variant text-sm animate-pulse">Cargando pedido…</p>
        )}

        {error && <p className="mt-8 text-error text-sm">{error}</p>}

        {done && (
          <div className="mt-8 text-center">
            <p className={`font-headline text-2xl ${done === 'paid' ? 'text-primary' : 'text-on-surface'}`}>
              {done === 'paid' ? '¡Pago aprobado!' : 'Pago rechazado'}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">Redirigiendo…</p>
          </div>
        )}

        {order && !done && (
          <>
            <div className="mt-6 space-y-1">
              <p className="text-xs uppercase tracking-widest text-on-surface-variant">Pedido {order.orderId}</p>
              <p className="font-headline text-4xl text-on-surface">{formatPrice(order.total)}</p>
              <p className="text-xs text-on-surface-variant">
                {order.items.reduce((n, i) => n + i.qty, 0)} producto(s) · despacho incluido
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => decide('accept')}
                disabled={busy !== null}
                className="btn-primary w-full disabled:opacity-50"
              >
                {busy === 'accept' ? 'Procesando…' : 'Aceptar pago'}
              </button>
              <button
                type="button"
                onClick={() => decide('reject')}
                disabled={busy !== null}
                className="btn-outline w-full disabled:opacity-50"
              >
                {busy === 'reject' ? 'Procesando…' : 'Rechazar pago'}
              </button>
            </div>
            <p className="mt-4 text-center text-[0.65rem] uppercase tracking-widest text-on-surface-variant/60">
              Simula la respuesta que daría la pasarela Flow
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function MockPagoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-surface-container-lowest" />}>
      <MockInner />
    </Suspense>
  );
}
