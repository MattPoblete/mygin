'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { getProduct } from '@/lib/products';
import type { Product } from '@/lib/types';

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [id]);

  if (product === undefined) {
    return <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>;
  }

  if (product === null) {
    return (
      <div>
        <p className="text-error text-sm mb-4">Producto no encontrado.</p>
        <Link href="/admin/productos" className="text-primary text-xs uppercase tracking-widest">
          ← Volver a productos
        </Link>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
