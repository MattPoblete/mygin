'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listProducts, deleteProduct } from '@/lib/products';
import { formatPrice } from '@/lib/cta';
import type { Product } from '@/lib/types';

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    listProducts()
      .then(setProducts)
      .catch(() => setError('No se pudieron cargar los productos.'));
  };

  useEffect(load, []);

  const onDelete = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
    } catch {
      setError('No se pudo eliminar el producto.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl tracking-tighter">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
        >
          + Nuevo
        </Link>
      </div>

      {error && <p className="text-error text-sm mb-6">{error}</p>}

      {products === null ? (
        <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>
      ) : products.length === 0 ? (
        <p className="text-on-surface-variant text-sm">
          No hay productos.{' '}
          <Link href="/admin/productos/nuevo" className="text-primary">
            Crea el primero
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Producto</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Precio</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Stock</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const disponible = p.stock - p.stockReserved;
                const low = disponible <= p.lowStockThreshold;
                return (
                  <tr key={p.id} className="border-t border-outline-variant/10">
                    <td className="px-4 py-3">
                      <div className="text-on-surface">{p.name}</div>
                      <div className="text-on-surface-variant text-xs">{p.sku || p.slug}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">${formatPrice(p.price)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className={low ? 'text-error' : 'text-on-surface'}>{disponible}</span>
                      {p.stockReserved > 0 && (
                        <span className="text-on-surface-variant text-xs"> ({p.stockReserved} res.)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs uppercase tracking-widest ${
                          p.active ? 'text-secondary' : 'text-on-surface-variant'
                        }`}
                      >
                        {p.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/admin/productos/${p.id}`} className="text-primary text-xs uppercase tracking-widest mr-4">
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(p)}
                        className="text-error text-xs uppercase tracking-widest"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
