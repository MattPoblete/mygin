'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { formatPrice } from '@/lib/cta';
import type { Order, OrderStatus } from '@/lib/types.order';

/**
 * app/admin/pedidos/page.tsx — Listado de pedidos (solo lectura).
 *
 * El admin SÍ puede leer `orders` por firestore.rules (isAdmin). Los clientes no.
 * Esta vista no escribe nada; el estado lo manejan las Cloud Functions.
 */
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  awaiting_payment: 'Esperando pago',
  paid: 'Pagado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  fulfilled: 'Despachado',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'text-on-surface-variant',
  awaiting_payment: 'text-tertiary',
  paid: 'text-secondary',
  failed: 'text-error',
  cancelled: 'text-error',
  expired: 'text-on-surface-variant',
  fulfilled: 'text-primary',
};

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(100)))
      .then((snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)))
      .catch(() => setError('No se pudieron cargar los pedidos. ¿Tienes permisos de admin?'));
  }, []);

  return (
    <div>
      <h1 className="font-headline text-3xl tracking-tighter mb-8">Pedidos</h1>

      {error && <p className="text-error text-sm mb-6">{error}</p>}

      {orders === null ? (
        <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>
      ) : orders.length === 0 ? (
        <p className="text-on-surface-variant text-sm">Aún no hay pedidos.</p>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Pedido</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Cliente</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Total</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Estado</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-outline-variant/10 align-top">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-on-surface">{o.id}</div>
                    <div className="text-on-surface-variant text-xs">
                      {o.items?.reduce((n, i) => n + i.qty, 0) ?? 0} uds.
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-on-surface">{o.customer?.name ?? '—'}</div>
                    <div className="text-on-surface-variant text-xs">{o.customer?.email}</div>
                    {o.customer?.address && (
                      <div className="text-on-surface-variant text-xs">
                        {o.customer.address.comuna}, {o.customer.address.region}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    ${formatPrice(o.total)}
                    {o.discount > 0 && (
                      <div className="text-secondary text-xs">-${formatPrice(o.discount)}{o.discountCode ? ` (${o.discountCode})` : ''}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs uppercase tracking-widest ${STATUS_COLOR[o.status] ?? 'text-on-surface-variant'}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs whitespace-nowrap">
                    {o.createdAt ? o.createdAt.toDate().toLocaleString('es-CL') : '—'}
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
