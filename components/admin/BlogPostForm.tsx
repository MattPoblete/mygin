'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { createPost, updatePost, type BlogPostInput } from '@/lib/blog';
import { useAuth } from '@/lib/firebase/auth-context';
import type { BlogPost, BlogCategory } from '@/lib/types.blog';

const CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: 'articulo', label: 'Artículo' },
  { value: 'receta', label: 'Receta' },
  { value: 'noticia', label: 'Noticia' },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = Boolean(post);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [body, setBody] = useState(post?.bodyMarkdown ?? '');
  const [showPreview, setShowPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  // beforeunload: el body markdown vive solo en estado y es fácil de perder.
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
    router.push('/admin/blog');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? '').trim();

    const title = str('title');
    // El slug deshabilitado en edición no viaja en FormData → conservar el actual.
    const slug = isEdit ? post!.slug : str('slug') || slugify(title);
    if (!title || !slug) {
      setError('Título y slug son obligatorios.');
      return;
    }

    const payload: BlogPostInput = {
      slug,
      title,
      excerpt: str('excerpt'),
      coverImage: str('coverImage'),
      bodyMarkdown: body,
      category: str('category') as BlogCategory,
      tags: str('tags')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status: (str('status') || 'draft') as 'draft' | 'published',
      // authorId/Name: en edición se conserva el autor original; en creación es el admin actual.
      authorId: post?.authorId ?? user?.uid ?? '',
      authorName: post?.authorName ?? user?.displayName ?? user?.email ?? 'Equipo MyGin',
      seo: {
        title: str('seoTitle') || title,
        description: str('seoDescription') || str('excerpt'),
        ogImage: str('seoOgImage') || undefined,
      },
    };

    setBusy(true);
    try {
      if (isEdit && post) await updatePost(post.id, payload);
      else await createPost(payload);
      setDirty(false);
      router.push('/admin/blog?saved=1');
      router.refresh();
    } catch {
      setError('No se pudo guardar. Verifica tus permisos de admin.');
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="font-headline text-3xl tracking-tighter mb-8">
        {isEdit ? 'Editar artículo' : 'Nuevo artículo'}
      </h1>
      <form onSubmit={onSubmit} onChange={() => setDirty(true)} className="space-y-6 max-w-2xl">
        <Field label="Título" required>
          <input name="title" required defaultValue={post?.title ?? ''} className={inputCls} />
        </Field>

        {isEdit ? (
          <Field label="Slug (URL)">
            <LockedValue value={post!.slug} />
          </Field>
        ) : (
          <Field label="Slug (URL)" hint="Se genera del título si lo dejas vacío">
            <input name="slug" defaultValue={post?.slug ?? ''} className={inputCls} />
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Categoría">
            <select name="category" defaultValue={post?.category ?? 'articulo'} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select name="status" defaultValue={post?.status ?? 'draft'} className={inputCls}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </Field>
        </div>

        <Field label="Extracto">
          <textarea name="excerpt" rows={2} defaultValue={post?.excerpt ?? ''} className={inputCls} />
        </Field>

        <Field label="Imagen de portada (URL)" hint="Subida a Storage diferida — usa una URL por ahora">
          <input
            name="coverImage"
            defaultValue={post?.coverImage ?? ''}
            placeholder="https://… o /assets/images/…"
            className={inputCls}
          />
        </Field>

        <Field label="Tags (separados por coma)">
          <input
            name="tags"
            defaultValue={(post?.tags ?? []).join(', ')}
            placeholder="gin, coctelería, villarrica"
            className={inputCls}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="block text-xs uppercase tracking-widest text-on-surface-variant">
              Cuerpo (Markdown)
            </span>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-xs uppercase tracking-widest text-primary"
            >
              {showPreview ? 'Editar' : 'Vista previa'}
            </button>
          </div>
          {showPreview ? (
            <div className="min-h-[12rem] bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface space-y-3 [&_h2]:font-headline [&_h2]:text-2xl [&_h3]:font-headline [&_h3]:text-xl [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6">
              <ReactMarkdown>{body || '_Nada que previsualizar._'}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setDirty(true);
              }}
              rows={14}
              placeholder="## Subtítulo&#10;&#10;Texto en **Markdown**…"
              className={`${inputCls} font-mono text-sm`}
            />
          )}
        </div>

        <fieldset className="border border-outline-variant/20 rounded-xl p-5 space-y-5">
          <legend className="text-xs uppercase tracking-widest text-secondary px-2">SEO</legend>
          <Field label="SEO · Título" hint="Por defecto, el título del artículo">
            <input name="seoTitle" defaultValue={post?.seo?.title ?? ''} className={inputCls} />
          </Field>
          <Field label="SEO · Descripción" hint="Por defecto, el extracto">
            <textarea
              name="seoDescription"
              rows={2}
              defaultValue={post?.seo?.description ?? ''}
              className={inputCls}
            />
          </Field>
          <Field label="SEO · OG Image (URL, opcional)" hint="Por defecto, la portada">
            <input name="seoOgImage" defaultValue={post?.seo?.ogImage ?? ''} className={inputCls} />
          </Field>
        </fieldset>

        {error && <p className="text-error text-sm">{error}</p>}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear artículo'}
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
