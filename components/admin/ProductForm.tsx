'use client';

import { useState } from 'react';
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
      router.push('/admin/productos');
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
      <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
        <Field label="Nombre">
          <input name="name" required defaultValue={product?.name ?? ''} className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Slug (URL)" hint={isEdit ? 'No editable tras crear' : 'Se genera del nombre si lo dejas vacío'}>
            <input
              name="slug"
              disabled={isEdit}
              defaultValue={product?.slug ?? ''}
              className={`${inputCls} ${isEdit ? 'opacity-60' : ''}`}
            />
          </Field>
          <Field label="SKU">
            <input name="sku" defaultValue={product?.sku ?? ''} className={inputCls} />
          </Field>
        </div>

        <Field label="Tipo">
          <select name="type" defaultValue={product?.type ?? 'gin'} className={inputCls}>
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
          <Field label="Precio (CLP)">
            <input name="price" type="number" min={0} defaultValue={product?.price ?? 0} className={inputCls} />
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
          <Field label="Stock">
            <input name="stock" type="number" min={0} defaultValue={product?.stock ?? 0} className={inputCls} />
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
            onClick={() => router.push('/admin/productos')}
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
  'w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary outline-none';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
        {hint && <span className="normal-case tracking-normal text-on-surface-variant/60"> · {hint}</span>}
      </span>
      {children}
    </label>
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
