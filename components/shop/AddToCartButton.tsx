'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart/CartProvider';
import { availableStock } from '@/lib/cart/stock';
import QtyStepper from '@/components/shop/QtyStepper';
import Icon from '@/components/ui/Icon';

/**
 * AddToCartButton — isla cliente del detalle de producto.
 * Selector de cantidad + botón "Agregar al carrito". Respeta el stock disponible.
 * Tras agregar muestra una confirmación persistente con salida ("Ir al carrito").
 */
export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const avail = availableStock(product);
  const soldOut = avail <= 0;

  const handleAdd = () => {
    if (soldOut) return;
    addItem(product, qty);
    setAdded(true);
  };

  // Cambiar la cantidad descarta la confirmación previa (vuelve a permitir agregar).
  const handleQty = (next: number) => {
    setQty(next);
    setAdded(false);
  };

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className="btn-outline w-full cursor-not-allowed opacity-50"
      >
        Agotado
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <QtyStepper value={qty} onChange={handleQty} min={1} max={avail} />
        <button
          type="button"
          onClick={handleAdd}
          className="btn-primary flex flex-1 items-center justify-center gap-2"
        >
          <Icon name={added ? 'check' : 'shopping_bag'} fill={0} className="text-base" />
          {added ? 'Agregado' : 'Agregar al carrito'}
        </button>
      </div>

      {/* Anuncio para lectores de pantalla, independiente del estado visual del botón. */}
      <div role="status" aria-live="polite" className="sr-only">
        {added ? 'Producto agregado al carrito' : ''}
      </div>

      {added && (
        <div className="flex flex-col gap-2 rounded-lg border border-secondary/30 bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-on-surface">
            <Icon name="check_circle" fill={1} className="text-base text-secondary" />
            Agregado al carrito
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/carrito"
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Ir al carrito
            </Link>
            <button
              type="button"
              onClick={() => setAdded(false)}
              className="text-sm text-on-surface-variant hover:text-on-surface"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
