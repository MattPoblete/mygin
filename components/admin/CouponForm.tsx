'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCoupon, updateCoupon, type CouponInput } from '@/lib/coupons';
import type { Coupon, CouponType } from '@/lib/types.coupon';

const TYPES: { value: CouponType; label: string }[] = [
  { value: 'percent', label: 'Porcentaje (%)' },
  { value: 'fixed', label: 'Monto fijo (CLP)' },
  { value: 'free_shipping', label: 'Despacho gratis' },
];

/** Convierte un FirestoreTimestamp a yyyy-mm-dd para el input date. */
function tsToDateInput(ts?: { toDate(): Date }): string {
  if (!ts) return '';
  const d = ts.toDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const isEdit = Boolean(coupon);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState<CouponType>(coupon?.type ?? 'percent');
  const [dirty, setDirty] = useState(false);

  // beforeunload: avisa al salir/cerrar pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const leave = () => {
    if (dirty && !confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
    setDirty(false);
    router.push('/admin/cupones');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? '').trim();

    // El code deshabilitado en edición no viaja en FormData → conservar el actual.
    const code = isEdit ? coupon!.code : str('code').toUpperCase();
    if (!code) {
      setError('El código es obligatorio.');
      return;
    }

    const min = str('minSubtotal');
    const max = str('maxRedemptions');
    const payload: CouponInput = {
      code,
      type,
      value: type === 'free_shipping' ? 0 : Number(fd.get('value')),
      active: fd.get('active') === 'on',
      minSubtotal: min ? Number(min) : null,
      maxRedemptions: max ? Number(max) : null,
      startsAt: str('startsAt') || null,
      expiresAt: str('expiresAt') || null,
    };

    setBusy(true);
    try {
      if (isEdit && coupon) await updateCoupon(coupon.id, payload);
      else await createCoupon(payload);
      setDirty(false);
      router.push('/admin/cupones?saved=1');
      router.refresh();
    } catch {
      setError('No se pudo guardar. Verifica tus permisos de admin.');
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="font-headline text-3xl tracking-tighter mb-8">
        {isEdit ? 'Editar cupón' : 'Nuevo cupón'}
      </h1>
      <form onSubmit={onSubmit} onChange={() => setDirty(true)} className="space-y-6 max-w-2xl">
        {isEdit ? (
          <Field label="Código">
            <LockedValue value={coupon!.code} />
          </Field>
        ) : (
          <Field label="Código" hint="Se guarda en MAYÚSCULAS" required>
            <input
              name="code"
              required
              defaultValue={coupon?.code ?? ''}
              placeholder="BIENVENIDA10"
              className={`${inputCls} uppercase`}
            />
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Tipo" required>
            <select
              name="type"
              required
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
              className={inputCls}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field
            label={type === 'percent' ? 'Valor (%)' : type === 'fixed' ? 'Valor (CLP)' : 'Valor (no aplica)'}
            required={type !== 'free_shipping'}
          >
            <input
              name="value"
              type="number"
              min={0}
              max={type === 'percent' ? 100 : undefined}
              required={type !== 'free_shipping'}
              disabled={type === 'free_shipping'}
              defaultValue={coupon?.value ?? 0}
              className={`${inputCls} ${type === 'free_shipping' ? 'opacity-60' : ''}`}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Subtotal mínimo (CLP, opcional)">
            <input name="minSubtotal" type="number" min={0} defaultValue={coupon?.minSubtotal ?? ''} className={inputCls} />
          </Field>
          <Field label="Máximo de canjes (opcional)">
            <input name="maxRedemptions" type="number" min={1} defaultValue={coupon?.maxRedemptions ?? ''} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Vigente desde (opcional)">
            <input name="startsAt" type="date" defaultValue={tsToDateInput(coupon?.startsAt)} className={inputCls} />
          </Field>
          <Field label="Vence (opcional)">
            <input name="expiresAt" type="date" defaultValue={tsToDateInput(coupon?.expiresAt)} className={inputCls} />
          </Field>
        </div>

        <Checkbox name="active" label="Activo" defaultChecked={coupon?.active ?? true} />

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cupón'}
          </button>
          <button
            type="button"
            onClick={leave}
            className="border border-outline-variant/40 text-secondary px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high transition-all"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary';

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
        {required && <span className="text-error" aria-hidden="true"> *</span>}
        {hint && <span className="normal-case tracking-normal text-on-surface-variant/60"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** Campo de identidad no editable: texto estático + candado + nota. */
function LockedValue({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-2.5">
      <LockIcon />
      <span className="text-on-surface font-mono text-sm uppercase break-all">{value}</span>
      <span className="ml-auto text-on-surface-variant/70 text-[0.65rem] uppercase tracking-widest whitespace-nowrap">
        No editable
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-on-surface-variant shrink-0">
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-primary w-4 h-4" />
      <span className="text-sm text-on-surface">{label}</span>
    </label>
  );
}
