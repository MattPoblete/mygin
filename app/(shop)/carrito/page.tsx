'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart/CartProvider';
import { formatPrice } from '@/lib/cta';
import QtyStepper from '@/components/shop/QtyStepper';
import Icon from '@/components/ui/Icon';

// Tarifa plana de despacho (espejo de SHIPPING_FLAT_CLP en lib/server/checkout.ts).
const SHIPPING_FLAT_CLP = 3990;

/**
 * app/(shop)/carrito/page.tsx — Carrito de compra.
 *
 * Página cliente: lista los ítems, permite editar cantidades y eliminar, muestra
 * el subtotal (solo display) y enlaza al checkout. El checkout (worktree B) aún
 * no existe; el botón queda como "próximamente".
 */
export default function CarritoPage() {
  const { items, setQty, removeItem, subtotal, count, clear } = useCart();
  // Guard de hidratación: evita parpadeo entre el render SSR (vacío) y el cliente.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []); // corre una vez en cliente

  if (!hydrated) {
    return <main className="min-h-screen bg-background pt-32 pb-32" />;
  }

  return (
    <main className="min-h-screen bg-background pt-32 pb-32">
      <div className="container mx-auto px-8 md:px-12">
        <h1 className="font-headline text-4xl tracking-tighter text-on-surface">Tu carrito</h1>

        {items.length === 0 ? (
          <div className="mt-12 mx-auto max-w-md rounded-xl border border-outline-variant/30 bg-surface-container-low p-12 text-center">
            <Icon name="shopping_bag" fill={0} className="text-4xl text-secondary/50" />
            <p className="mt-4 font-headline text-2xl text-on-surface">Tu carrito está vacío</p>
            <Link href="/tienda" className="btn-primary mt-6 inline-block">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
            {/* Líneas */}
            <ul className="flex flex-col divide-y divide-outline-variant/20">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-6">
                  <Link
                    href={`/producto/${item.slug}`}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-secondary/40">
                        Sin imagen
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/producto/${item.slug}`}
                        className="font-headline text-lg text-on-surface hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Eliminar ${item.name}`}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <Icon name="delete" fill={0} className="text-lg" />
                      </button>
                    </div>
                    <span className="text-sm text-on-surface-variant">
                      ${formatPrice(item.unitPrice)} c/u
                    </span>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <QtyStepper
                        value={item.qty}
                        onChange={(q) => setQty(item.productId, q)}
                        min={1}
                      />
                      <span className="font-headline text-base text-primary">
                        ${formatPrice(item.unitPrice * item.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Resumen */}
            <aside className="h-fit rounded-xl border border-outline-variant/30 bg-surface-container-low p-8">
              <h2 className="font-headline text-xl text-on-surface">Resumen</h2>
              <div className="mt-6 flex items-center justify-between text-sm text-on-surface-variant">
                <span>{count} {count === 1 ? 'producto' : 'productos'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-outline-variant/20 pt-4 text-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span className="tabular-nums">${formatPrice(subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-on-surface-variant">
                <span>Despacho</span>
                <span className="tabular-nums">${formatPrice(SHIPPING_FLAT_CLP)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-outline-variant/20 pt-4">
                <span className="text-on-surface">Total</span>
                <span className="font-headline text-2xl text-primary">${formatPrice(subtotal + SHIPPING_FLAT_CLP)}</span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant/70">
                IVA incluido. El total final se confirma en el pago.
              </p>

              {/* Checkout — worktree B. */}
              <Link href="/checkout" className="btn-primary mt-6 block w-full text-center">
                Ir a pagar
              </Link>

              <button
                type="button"
                onClick={clear}
                className="mt-3 w-full text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
              >
                Vaciar carrito
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
