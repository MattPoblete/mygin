'use client';

import { useEffect, useState } from 'react';
import { listComments, approveComment, rejectComment, deleteComment } from '@/lib/comments';
import SavedFlash from '@/components/admin/SavedFlash';
import type { Comment, CommentStatus } from '@/lib/types.comment';

const STATUS_LABEL: Record<CommentStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const STATUS_CLS: Record<CommentStatus, string> = {
  pending: 'text-primary-fixed',
  approved: 'text-secondary',
  rejected: 'text-on-surface-variant',
};

// Pendientes primero; dentro de cada grupo, las más recientes arriba (ya vienen ordenadas).
const ORDER: Record<CommentStatus, number> = { pending: 0, approved: 1, rejected: 2 };

export default function CommentsListPage() {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = () => {
    listComments()
      .then((cs) => setComments([...cs].sort((a, b) => ORDER[a.status] - ORDER[b.status])))
      .catch(() => setError('No se pudieron cargar las reseñas.'));
  };

  useEffect(load, []);

  const act = async (id: string, fn: (id: string) => Promise<void>, msg: string) => {
    setBusyId(id);
    setError('');
    try {
      await fn(id);
      load();
    } catch {
      setError(msg);
    } finally {
      setBusyId('');
    }
  };

  const onDelete = async (c: Comment) => {
    if (!confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return;
    setComments((prev) => prev?.filter((x) => x.id !== c.id) ?? null);
    try {
      await deleteComment(c.id);
    } catch {
      setError('No se pudo eliminar la reseña.');
      load();
    }
  };

  return (
    <div>
      <SavedFlash />
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl tracking-tighter">Reseñas</h1>
      </div>

      {error && <p className="text-error text-sm mb-6">{error}</p>}

      {comments === null ? (
        <p className="text-on-surface-variant text-sm animate-pulse">Cargando…</p>
      ) : comments.length === 0 ? (
        <p className="text-on-surface-variant text-sm">No hay reseñas todavía.</p>
      ) : (
        <div className="overflow-x-auto border border-outline-variant/20 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-on-surface-variant">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Producto</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Reseña</th>
                <th className="px-4 py-3 font-medium uppercase text-xs tracking-widest">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id} className="border-t border-outline-variant/10 align-top">
                  <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{c.productSlug}</td>
                  <td className="px-4 py-3">
                    <div className="text-primary">{'★'.repeat(c.rating)}<span className="text-outline-variant/40">{'★'.repeat(5 - c.rating)}</span></div>
                    <div className="text-on-surface">{c.authorName}</div>
                    <div className="text-on-surface-variant text-xs max-w-md">{c.body}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs uppercase tracking-widest ${STATUS_CLS[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {c.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => act(c.id, approveComment, 'No se pudo aprobar la reseña.')}
                        className="text-secondary text-xs uppercase tracking-widest mr-4 disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                    )}
                    {c.status !== 'rejected' && (
                      <button
                        type="button"
                        disabled={busyId === c.id}
                        onClick={() => act(c.id, rejectComment, 'No se pudo rechazar la reseña.')}
                        className="text-on-surface-variant text-xs uppercase tracking-widest mr-4 disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    )}
                    {c.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        className="text-error text-xs uppercase tracking-widest"
                      >
                        Eliminar
                      </button>
                    )}
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
