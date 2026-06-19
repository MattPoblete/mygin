'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct, type ProductInput } from '@/lib/products';
import type { Product, ProductType } from '@/lib/types';

const TYPES: { value: ProductType; label: string }[] = [
  { value: 'gin', label: 'Gin' },
  { value: 'botanical', label: 'Botánico' },
  { value: 'merch', label: 'Merchandising' },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(product);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
    router.push('/admin/productos');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? '').trim();

    const name = str('name');
    // El slug deshabilitado en edición no viaja en FormData → conservar el actual.
    const slug = isEdit ? product!.slug : str('slug') || slugify(name);
    if (!name || !slug) {
      setError('Nombre y slug son obligatorios.');
      return;
    }

    const compare = str('compareAtPrice');
    const payload: ProductInput = {
      slug,
      name,
      type: str('type') as ProductType,
      shortDesc: str('shortDesc'),
      longDesc: str('longDesc'),
      images: str('images').split('\n').map((s) => s.trim()).filter(Boolean),
      price: Number(fd.get('price')),
      compareAtPrice: compare ? Number(compare) : null,
      stock: Number(fd.get('stock')),
      lowStockThreshold: Number(fd.get('lowStockThreshold')),
      sku: str('sku'),
      active: fd.get('active') === 'on',
      featured: fd.get('featured') === 'on',
      badge: str('badge') || null,
    };

    setBusy(true);
    try {
      if (isEdit && product) await updateProduct(product.id, payload);
      else await createProduct(payload);
      setDirty(false);
      router.push('/admin/productos?saved=1');
      router.refresh();
    } catch {
      setError('No se pudo guardar. Verifica tus permisos de admin.');
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="font-headline text-3xl tracking-tighter mb-8">
        {isEdit ? 'Editar producto' : 'Nuevo producto'}
      </h1>
      <form onSubmit={onSubmit} onChange={() => setDirty(true)} className="space-y-6 max-w-2xl">
        <Field label="Nombre" required>
          <input name="name" required defaultValue={product?.name ?? ''} className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {isEdit ? (
            <Field label="Slug (URL)">
              <LockedValue value={product!.slug} />
            </Field>
          ) : (
            <Field label="Slug (URL)" hint="Se genera del nombre si lo dejas vacío">
              <input name="slug" defaultValue={product?.slug ?? ''} className={inputCls} />
            </Field>
          )}
          <Field label="SKU">
            <input name="sku" defaultValue={product?.sku ?? ''} className={inputCls} />
          </Field>
        </div>

        <Field label="Tipo" required>
          <select name="type" required defaultValue={product?.type ?? 'gin'} className={inputCls}>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Descripción corta">
          <input name="shortDesc" defaultValue={product?.shortDesc ?? ''} className={inputCls} />
        </Field>

        <Field label="Descripción larga">
          <textarea name="longDesc" rows={4} defaultValue={product?.longDesc ?? ''} className={inputCls} />
        </Field>

        <Field label="Imágenes (una URL por línea)">
          <textarea
            name="images"
            rows={3}
            defaultValue={(product?.images ?? []).join('\n')}
            placeholder="/assets/images/botella_naturaleza.jpeg"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Field label="Precio (CLP)" required>
            <input name="price" type="number" min={0} required defaultValue={product?.price ?? 0} className={inputCls} />
          </Field>
          <Field label="Precio antes">
            <input
              name="compareAtPrice"
              type="number"
              min={0}
              defaultValue={product?.compareAtPrice ?? ''}
              className={inputCls}
            />
          </Field>
          <Field label="Stock" required>
            <input name="stock" type="number" min={0} required defaultValue={product?.stock ?? 0} className={inputCls} />
          </Field>
          <Field label="Umbral stock bajo">
            <input
              name="lowStockThreshold"
              type="number"
              min={0}
              defaultValue={product?.lowStockThreshold ?? 6}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Badge (opcional)">
          <input name="badge" defaultValue={product?.badge ?? ''} placeholder="Lo más pedido" className={inputCls} />
        </Field>

        <div className="flex gap-8">
          <Checkbox name="active" label="Activo" defaultChecked={product?.active ?? true} />
          <Checkbox name="featured" label="Destacado" defaultChecked={product?.featured ?? false} />
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
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
      <span className="text-on-surface font-mono text-sm break-all">{value}</span>
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
