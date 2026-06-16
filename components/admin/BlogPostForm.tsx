'use client';

import { useState } from 'react';
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
      router.push('/admin/blog');
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
      <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
        <Field label="Título">
          <input name="title" required defaultValue={post?.title ?? ''} className={inputCls} />
        </Field>

        <Field
          label="Slug (URL)"
          hint={isEdit ? 'No editable tras crear' : 'Se genera del título si lo dejas vacío'}
        >
          <input
            name="slug"
            disabled={isEdit}
            defaultValue={post?.slug ?? ''}
            className={`${inputCls} ${isEdit ? 'opacity-60' : ''}`}
          />
        </Field>

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
              onChange={(e) => setBody(e.target.value)}
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
            onClick={() => router.push('/admin/blog')}
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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
