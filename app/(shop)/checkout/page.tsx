'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/CartProvider';
import { formatPrice } from '@/lib/cta';
import { createOrder, validateCoupon, type ValidateCouponResult } from '@/lib/checkout';
import type { CustomerInfo } from '@/lib/types.order';

/**
 * app/(shop)/checkout/page.tsx — Formulario de checkout.
 *
 * Recoge los datos del cliente, permite validar un cupón (informativo) y dispara
 * createOrder. NUNCA envía precios: solo {productId, qty}. El total real lo
 * calcula el servidor; aquí el subtotal es solo orientativo. Al crear la orden,
 * redirige a Flow con la redirectUrl que devuelve la callable.
 */
const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', "Región Metropolitana", "O'Higgins", 'Maule', 'Ñuble',
  'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, count } = useCart();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Cupón
  const [couponCode, setCouponCode] = useState('');
  const [couponState, setCouponState] = useState<ValidateCouponResult | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // Redirige a la tienda si el carrito está vacío (tras hidratar).
  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace('/tienda');
    }
  }, [hydrated, items.length, router]);

  const appliedDiscount = couponState?.valid ? couponState.discount ?? 0 : 0;
  const estimatedTotal = useMemo(
    () => Math.max(0, subtotal - appliedDiscount),
    [subtotal, appliedDiscount],
  );

  const onValidateCoupon = async () => {
    setCouponState(null);
    const code = couponCode.trim();
    if (!code) return;
    setCouponBusy(true);
    try {
      const res = await validateCoupon(code, subtotal);
      setCouponState(res);
    } catch {
      setCouponState({ valid: false, reason: 'No se pudo validar el cupón.' });
    } finally {
      setCouponBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? '').trim();

    const customer: CustomerInfo = {
      name: str('name'),
      email: str('email'),
      phone: str('phone'),
      rut: str('rut') || undefined,
      address: {
        region: str('region'),
        comuna: str('comuna'),
        calle: str('calle'),
        numero: str('numero') || undefined,
        depto: str('depto') || undefined,
        notas: str('notas') || undefined,
      },
    };

    if (!customer.name || !customer.email || !customer.phone) {
      setError('Nombre, email y teléfono son obligatorios.');
      return;
    }
    if (!customer.address.region || !customer.address.comuna || !customer.address.calle) {
      setError('Región, comuna y calle son obligatorias.');
      return;
    }

    setBusy(true);
    try {
      const { redirectUrl } = await createOrder({
        items,
        customer,
        couponCode: couponState?.valid ? couponCode.trim() : undefined,
      });
      window.location.href = redirectUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar el pago.';
      setError(msg);
      setBusy(false);
    }
  };

  if (!hydrated) {
    return <main className="min-h-screen bg-background pt-32 pb-32" />;
  }
  if (items.length === 0) {
    return <main className="min-h-screen bg-background pt-32 pb-32" />;
  }

  return (
    <main className="min-h-screen bg-background pt-32 pb-32">
      <div className="container mx-auto px-8 md:px-12">
        <h1 className="font-headline text-4xl tracking-tighter text-on-surface">Finalizar compra</h1>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
          {/* Formulario */}
          <form onSubmit={onSubmit} className="space-y-6">
            <fieldset className="space-y-6">
              <legend className="font-headline text-xl text-on-surface mb-2">Tus datos</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Nombre completo">
                  <input name="name" required className={inputCls} />
                </Field>
                <Field label="RUT (opcional)">
                  <input name="rut" className={inputCls} />
                </Field>
                <Field label="Email">
                  <input name="email" type="email" required className={inputCls} />
                </Field>
                <Field label="Teléfono">
                  <input name="phone" type="tel" required className={inputCls} />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-6">
              <legend className="font-headline text-xl text-on-surface mb-2">Despacho</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Región">
                  <select name="region" required defaultValue="" className={inputCls}>
                    <option value="" disabled>Selecciona…</option>
                    {REGIONES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Comuna">
                  <input name="comuna" required className={inputCls} />
                </Field>
              </div>
              <Field label="Calle">
                <input name="calle" required className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-6">
                <Field label="Número (opcional)">
                  <input name="numero" className={inputCls} />
                </Field>
                <Field label="Depto/Casa (opcional)">
                  <input name="depto" className={inputCls} />
                </Field>
              </div>
              <Field label="Notas para el despacho (opcional)">
                <textarea name="notas" rows={2} className={inputCls} />
              </Field>
            </fieldset>

            {error && <p className="text-error text-sm">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Redirigiendo a Flow…' : 'Pagar'}
            </button>
            <p className="text-xs text-on-surface-variant/70 text-center">
              Serás redirigido a Flow para completar el pago de forma segura.
            </p>
          </form>

          {/* Resumen */}
          <aside className="h-fit rounded-xl border border-outline-variant/30 bg-surface-container-low p-8">
            <h2 className="font-headline text-xl text-on-surface">Resumen</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-2 text-on-surface-variant">
                  <span>{i.qty}× {i.name}</span>
                  <span className="tabular-nums">${formatPrice(i.unitPrice * i.qty)}</span>
                </li>
              ))}
            </ul>

            {/* Cupón */}
            <div className="mt-6 border-t border-outline-variant/20 pt-4">
              <label className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                Cupón de descuento
              </label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="CÓDIGO"
                  className={`${inputCls} uppercase`}
                />
                <button
                  type="button"
                  onClick={onValidateCoupon}
                  disabled={couponBusy || !couponCode.trim()}
                  className="shrink-0 border border-outline-variant/40 text-secondary px-4 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high transition-all disabled:opacity-50"
                >
                  {couponBusy ? '…' : 'Aplicar'}
                </button>
              </div>
              {couponState && (
                <p className={`mt-2 text-xs ${couponState.valid ? 'text-secondary' : 'text-error'}`}>
                  {couponState.valid
                    ? `Cupón aplicado: -$${formatPrice(couponState.discount ?? 0)}`
                    : couponState.reason}
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-outline-variant/20 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>{count} {count === 1 ? 'producto' : 'productos'}</span>
                <span className="tabular-nums">${formatPrice(subtotal)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Descuento</span>
                  <span className="tabular-nums">-${formatPrice(appliedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-outline-variant/20 pt-3">
                <span className="text-on-surface">Total estimado</span>
                <span className="font-headline text-2xl text-primary">${formatPrice(estimatedTotal)}</span>
              </div>
              <p className="text-xs text-on-surface-variant/70">
                El despacho y el total final se confirman en el pago.
              </p>
            </div>

            <Link
              href="/carrito"
              className="mt-6 block text-center text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              ← Volver al carrito
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">{label}</span>
      {children}
    </label>
  );
}
