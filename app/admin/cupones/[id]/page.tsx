'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import CouponForm from '@/components/admin/CouponForm';
import { getCoupon } from '@/lib/coupons';
import type { Coupon } from '@/lib/types.coupon';

export default function EditarCuponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [coupon, setCoupon] = useState<Coupon | null | undefined>(undefined);

  useEffect(() => {
    getCoupon(id)
      .then(setCoupon)
      .catch(() => setCoupon(null));
  }, [id]);

  if (coupon === undefined) {
    return <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>;
  }

  if (coupon === null) {
    return (
      <div>
        <p className="text-error text-sm mb-4">Cupón no encontrado.</p>
        <Link href="/admin/cupones" className="text-primary text-xs uppercase tracking-widest">
          ← Volver a cupones
        </Link>
      </div>
    );
  }

  return <CouponForm coupon={coupon} />;
}
