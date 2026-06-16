'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listAllPosts, deletePost } from '@/lib/blog';
import type { BlogPost, BlogCategory } from '@/lib/types.blog';

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  articulo: 'Artículo',
  receta: 'Receta',
  noticia: 'Noticia',
};

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    listAllPosts()
      .then(setPosts)
      .catch(() => setError('No se pudieron cargar los artículos.'));
  };

  useEffect(load, []);

  const onDelete = async (p: BlogPost) => {
    if (!confirm(`¿Eliminar "${p.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePost(p.id);
      setPosts((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
    } catch {
      setError('No se pudo eliminar el artículo.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl tracking-tighter">Blog</h1>
        <Link
          href="/admin/blog/nuevo"
          className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity"
        >
          + Nuevo
        </Link>
      </div>

      {error && <p className="text-error text-sm mb-6">{error}</p>}

      {posts === null ? (
        <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>
      ) : posts.length === 0 ? (
        <p className="text-on-surface-variant text-sm">
          No hay artículos.{' '}
          <Link href="/admin/blog/nuevo" className="text-primary">
            Crea el primero
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Artículo</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Categoría</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-outline-variant/10">
                  <td className="px-4 py-3">
                    <div className="text-on-surface">{p.title}</div>
                    <div className="text-on-surface-variant text-xs">{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{CATEGORY_LABEL[p.category]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs uppercase tracking-widest ${
                        p.status === 'published' ? 'text-secondary' : 'text-on-surface-variant'
                      }`}
                    >
                      {p.status === 'published' ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="text-primary text-xs uppercase tracking-widest mr-4"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      className="text-error text-xs uppercase tracking-widest"
                    >
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
