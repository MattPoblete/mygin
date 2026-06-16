'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listProducts } from '@/lib/products';
import type { Product } from '@/lib/types';

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setError('No se pudieron cargar los productos.'));
  }, []);

  const total = products?.length ?? 0;
  const activos = products?.filter((p) => p.active).length ?? 0;
  const lowStock = products?.filter((p) => p.stock - p.stockReserved <= p.lowStockThreshold).length ?? 0;

  return (
    <div>
      <h1 className="font-headline text-3xl tracking-tighter mb-8">Dashboard</h1>

      {error && <p className="text-error text-sm mb-6">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Productos" value={total} />
        <Stat label="Activos" value={activos} />
        <Stat label="Stock bajo" value={lowStock} highlight={lowStock > 0} />
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/productos"
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
        >
          Gestionar productos
        </Link>
        <Link
          href="/admin/productos/nuevo"
          className="border border-outline-variant/40 text-secondary px-6 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high transition-all"
        >
          Nuevo producto
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6">
      <div className={`font-headline text-4xl tracking-tighter ${highlight ? 'text-error' : 'text-primary'}`}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-widest text-on-surface-variant mt-2">{label}</div>
    </div>
  );
}
