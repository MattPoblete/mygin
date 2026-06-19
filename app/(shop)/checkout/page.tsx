'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart/CartProvider';
import { formatPrice } from '@/lib/cta';
import { createOrder, validateCoupon, isValidRut, type ValidateCouponResult } from '@/lib/checkout';
import { SHIPPING_FLAT_CLP, PAY_TIMEOUT_MS } from '@/lib/constants';
import type { CustomerInfo } from '@/lib/types.order';

type FieldErrors = Partial<Record<string, string>>;

/** Valida un campo individual; devuelve el mensaje de error o '' si es válido. */
function validateField(name: string, value: string): string {
  const v = value.trim();
  switch (name) {
    case 'name':
      return v ? '' : 'Ingresa tu nombre.';
    case 'email':
      if (!v) return 'Ingresa tu email.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Email no válido.';
    case 'phone':
      return v ? '' : 'Ingresa tu teléfono.';
    case 'rut':
      return !v || isValidRut(v) ? '' : 'RUT no válido. Ej: 12.345.678-9';
    case 'region':
      return v ? '' : 'Selecciona tu región.';
    case 'comuna':
      return v ? '' : 'Ingresa tu comuna.';
    case 'calle':
      return v ? '' : 'Ingresa tu calle.';
    default:
      return '';
  }
}

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
  const { items, subtotal, count, clear } = useCart();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  // Mensaje cuando el popup se cierra sin confirmar / se bloquea.
  const [payNotice, setPayNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Cupón
  const [couponCode, setCouponCode] = useState('');
  const [couponState, setCouponState] = useState<ValidateCouponResult | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // Tras pagar vaciamos el carrito y navegamos a la confirmación; este flag evita que
  // el redirect "carrito vacío → /tienda" gane la carrera y desvíe al cliente.
  const paidRef = useRef(false);

  // Redirige a la tienda si el carrito está vacío (tras hidratar), salvo que acabemos de pagar.
  useEffect(() => {
    if (hydrated && items.length === 0 && !paidRef.current) {
      router.replace('/tienda');
    }
  }, [hydrated, items.length, router]);

  const appliedDiscount = couponState?.valid ? couponState.discount ?? 0 : 0;
  // El cupón free_shipping anula el despacho (lado servidor manda; aquí estimamos).
  const estimatedShipping = couponState?.valid && couponState.type === 'free_shipping' ? 0 : SHIPPING_FLAT_CLP;
  const estimatedTotal = useMemo(
    () => Math.max(0, subtotal - appliedDiscount) + estimatedShipping,
    [subtotal, appliedDiscount, estimatedShipping],
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

  const onBlurValidate = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const msg = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: msg || undefined }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setPayNotice('');
    const form = e.currentTarget;
    const fd = new FormData(form);
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

    // Valida todos los campos; enfoca el primero con error.
    const order = ['name', 'email', 'phone', 'rut', 'region', 'comuna', 'calle'];
    const errs: FieldErrors = {};
    for (const k of order) {
      const msg = validateField(k, str(k));
      if (msg) errs[k] = msg;
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const first = order.find((k) => errs[k]);
      if (first) form.elements.namedItem(first) instanceof HTMLElement &&
        (form.elements.namedItem(first) as HTMLElement).focus();
      return;
    }
    setFieldErrors({});

    setBusy(true);
    let orderId: string;
    let payUrl: string;
    try {
      const res = await createOrder({
        items,
        customer,
        couponCode: couponState?.valid ? couponCode.trim() : undefined,
      });
      orderId = res.orderId;
      // La URL puede ser relativa (mock) o absoluta (Flow).
      payUrl = new URL(res.redirectUrl, window.location.origin).href;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el pago.');
      setBusy(false);
      return;
    }

    const win = window.open(payUrl, 'mygin-pago', 'width=480,height=720');
    if (!win) {
      // Popup bloqueado: no redirigimos en la misma pestaña (perderíamos el form).
      setBusy(false);
      setPayNotice('Tu navegador bloqueó la ventana de pago. Habilita las ventanas emergentes para este sitio y vuelve a intentar.');
      return;
    }
    setWaiting(true);

    let settled = false;
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearInterval(poll);
      clearTimeout(timer);
    };
    // Solo navegamos a confirmación con un status explícito del popup.
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const d = ev.data as { type?: string; orderId?: string; status?: string };
      if (d?.type !== 'mygin-pago' || d.orderId !== orderId) return;
      settled = true;
      cleanup();
      if (d.status === 'paid') {
        paidRef.current = true;
        clear();
        router.push(`/checkout/confirmacion/${orderId}`);
      } else {
        // Rechazado/cancelado: vuelve al form para reintentar.
        setWaiting(false);
        setBusy(false);
        setPayNotice('El pago no se completó. Puedes intentar de nuevo.');
      }
    };
    window.addEventListener('message', onMessage);
    // Si la ventana se cierra sin avisar, volvemos al form (NO navegamos).
    const poll = setInterval(() => {
      if (settled) return;
      if (win.closed) {
        settled = true;
        cleanup();
        setWaiting(false);
        setBusy(false);
        setPayNotice('No recibimos confirmación del pago. ¿Reintentar?');
      }
    }, 800);
    // Salvaguarda: nunca quedarse colgado en "Esperando el pago…".
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      setWaiting(false);
      setBusy(false);
      setPayNotice('No recibimos confirmación del pago. ¿Reintentar?');
    }, PAY_TIMEOUT_MS);
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
                <Field label="Nombre completo" htmlFor="name" required error={fieldErrors.name}>
                  <input
                    id="name" name="name" required autoComplete="name"
                    aria-required="true" aria-invalid={!!fieldErrors.name || undefined}
                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                    onBlur={onBlurValidate} className={inputCls}
                  />
                </Field>
                <Field label="RUT (opcional)" htmlFor="rut" error={fieldErrors.rut}>
                  <input
                    id="rut" name="rut" placeholder="12.345.678-9" inputMode="text"
                    aria-invalid={!!fieldErrors.rut || undefined}
                    aria-describedby={fieldErrors.rut ? 'rut-error' : undefined}
                    onBlur={onBlurValidate} className={inputCls}
                  />
                </Field>
                <Field label="Email" htmlFor="email" required error={fieldErrors.email}>
                  <input
                    id="email" name="email" type="email" required autoComplete="email"
                    aria-required="true" aria-invalid={!!fieldErrors.email || undefined}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    onBlur={onBlurValidate} className={inputCls}
                  />
                </Field>
                <Field label="Teléfono" htmlFor="phone" required error={fieldErrors.phone}>
                  <input
                    id="phone" name="phone" type="tel" required autoComplete="tel"
                    inputMode="tel" placeholder="+56 9 1234 5678"
                    aria-required="true" aria-invalid={!!fieldErrors.phone || undefined}
                    aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                    onBlur={onBlurValidate} className={inputCls}
                  />
                </Field>
              </div>
            </fieldset>

            <fieldset className="space-y-6">
              <legend className="font-headline text-xl text-on-surface mb-2">Despacho</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Región" htmlFor="region" required error={fieldErrors.region}>
                  <select
                    id="region" name="region" required defaultValue="" autoComplete="address-level1"
                    aria-required="true" aria-invalid={!!fieldErrors.region || undefined}
                    aria-describedby={fieldErrors.region ? 'region-error' : undefined}
                    onBlur={onBlurValidate} className={inputCls}
                  >
                    <option value="" disabled>Selecciona…</option>
                    {REGIONES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Comuna" htmlFor="comuna" required error={fieldErrors.comuna}>
                  <input
                    id="comuna" name="comuna" required autoComplete="address-level2"
                    aria-required="true" aria-invalid={!!fieldErrors.comuna || undefined}
                    aria-describedby={fieldErrors.comuna ? 'comuna-error' : undefined}
                    onBlur={onBlurValidate} className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Calle" htmlFor="calle" required error={fieldErrors.calle}>
                <input
                  id="calle" name="calle" required autoComplete="street-address"
                  aria-required="true" aria-invalid={!!fieldErrors.calle || undefined}
                  aria-describedby={fieldErrors.calle ? 'calle-error' : undefined}
                  onBlur={onBlurValidate} className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-6">
                <Field label="Número (opcional)" htmlFor="numero">
                  <input id="numero" name="numero" className={inputCls} />
                </Field>
                <Field label="Depto/Casa (opcional)" htmlFor="depto">
                  <input id="depto" name="depto" className={inputCls} />
                </Field>
              </div>
              <Field label="Notas para el despacho (opcional)" htmlFor="notas">
                <textarea id="notas" name="notas" rows={2} className={inputCls} />
              </Field>
            </fieldset>

            {error && <p className="text-error text-sm" role="alert">{error}</p>}
            {payNotice && (
              <p className="rounded-lg border border-outline-variant/40 bg-surface-container p-3 text-sm text-on-surface" role="alert">
                {payNotice}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || waiting}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {waiting
                ? 'Esperando el pago…'
                : busy
                  ? 'Abriendo el pago…'
                  : payNotice
                    ? 'Reintentar pago'
                    : `Pagar ${formatPrice(estimatedTotal)}`}
            </button>
            <p className="text-xs text-on-surface-variant/70 text-center">
              {waiting
                ? 'Completa el pago en la ventana que se abrió. Esta página se actualizará al terminar.'
                : 'Se abrirá una ventana para completar el pago de forma segura. IVA incluido.'}
            </p>
          </form>

          {/* Resumen */}
          <aside className="h-fit rounded-xl border border-outline-variant/30 bg-surface-container-low p-8">
            <h2 className="font-headline text-xl text-on-surface">Resumen</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-2 text-on-surface-variant">
                  <span>{i.qty}× {i.name}</span>
                  <span className="tabular-nums">{formatPrice(i.unitPrice * i.qty)}</span>
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
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    if (couponState) setCouponState(null); // invalida el estado al editar
                  }}
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
                    ? `Cupón aplicado: -${formatPrice(couponState.discount ?? 0)}`
                    : couponState.reason}
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-outline-variant/20 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>{count} {count === 1 ? 'producto' : 'productos'}</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-secondary">
                  <span>Descuento</span>
                  <span className="tabular-nums">-{formatPrice(appliedDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-on-surface-variant">
                <span>Despacho</span>
                <span className="tabular-nums">
                  {estimatedShipping === 0 ? 'Gratis' : formatPrice(estimatedShipping)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-outline-variant/20 pt-3">
                <span className="text-on-surface">Total</span>
                <span className="font-headline text-2xl text-primary">{formatPrice(estimatedTotal)}</span>
              </div>
              <p className="text-xs text-on-surface-variant/70">
                IVA incluido. Despacho según comuna; el total final se confirma en el pago.
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
  'w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/60';

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
        {required && <span className="text-error" aria-hidden="true"> *</span>}
      </span>
      {children}
      {error && (
        <span id={htmlFor ? `${htmlFor}-error` : undefined} className="mt-1 block text-xs text-error">
          {error}
        </span>
      )}
    </label>
  );
}
