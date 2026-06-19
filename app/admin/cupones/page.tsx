'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCoupons, deleteCoupon } from '@/lib/coupons';
import { formatPrice } from '@/lib/cta';
import type { Coupon } from '@/lib/types.coupon';

const TYPE_LABEL: Record<Coupon['type'], string> = {
  percent: '%',
  fixed: 'CLP',
  free_shipping: 'Despacho',
};

function describeValue(c: Coupon): string {
  if (c.type === 'percent') return `${c.value}%`;
  if (c.type === 'fixed') return formatPrice(c.value);
  return 'Despacho gratis';
}

export default function CouponsListPage() {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    listCoupons()
      .then(setCoupons)
      .catch(() => setError('No se pudieron cargar los cupones.'));
  };

  useEffect(load, []);

  const onDelete = async (c: Coupon) => {
    if (!confirm(`¿Eliminar el cupón "${c.code}"?`)) return;
    try {
      await deleteCoupon(c.id);
      setCoupons((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
    } catch {
      setError('No se pudo eliminar el cupón.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl tracking-tighter">Cupones</h1>
        <Link
          href="/admin/cupones/nuevo"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
        >
          + Nuevo
        </Link>
      </div>

      {error && <p className="text-error text-sm mb-6">{error}</p>}

      {coupons === null ? (
        <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>
      ) : coupons.length === 0 ? (
        <p className="text-on-surface-variant text-sm">
          No hay cupones.{' '}
          <Link href="/admin/cupones/nuevo" className="text-primary">Crea el primero</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Código</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Tipo</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Valor</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Canjes</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-outline-variant/10">
                  <td className="px-4 py-3 font-mono text-on-surface">{c.code}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{TYPE_LABEL[c.type]}</td>
                  <td className="px-4 py-3 tabular-nums">{describeValue(c)}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {c.redemptions}
                    {c.maxRedemptions ? <span className="text-on-surface-variant"> / {c.maxRedemptions}</span> : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs uppercase tracking-widest ${c.active ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      {c.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/admin/cupones/${c.id}`} className="text-primary text-xs uppercase tracking-widest mr-4">
                      Editar
                    </Link>
                    <button type="button" onClick={() => onDelete(c)} className="text-error text-xs uppercase tracking-widest">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
