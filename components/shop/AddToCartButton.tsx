'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart/CartProvider';
import { availableStock } from '@/lib/cart/stock';
import QtyStepper from '@/components/shop/QtyStepper';
import Icon from '@/components/ui/Icon';

/**
 * AddToCartButton — isla cliente del detalle de producto.
 * Selector de cantidad + botón "Agregar al carrito". Respeta el stock disponible.
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
    setQty(1);
    window.setTimeout(() => setAdded(false), 2000);
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <QtyStepper value={qty} onChange={setQty} min={1} max={avail} />
      <button
        type="button"
        onClick={handleAdd}
        className="btn-primary flex flex-1 items-center justify-center gap-2"
        aria-live="polite"
      >
        <Icon name={added ? 'check' : 'shopping_bag'} fill={0} className="text-base" />
        {added ? 'Agregado' : 'Agregar al carrito'}
      </button>
    </div>
  );
}
