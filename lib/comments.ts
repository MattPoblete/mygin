/**
 * lib/comments.ts — Acceso a la colección `comments` (reseñas de producto, client SDK).
 *
 * Lecturas públicas (reseñas aprobadas en el PDP) y moderación de admin. La agregación
 * del rating al producto ocurre AQUÍ, al aprobar/rechazar, dentro de una transacción
 * Firestore — no en una Cloud Function (las Functions no están desplegadas; el proyecto
 * corre en plan Spark). El flag `counted` evita doble-contar (ver firestore.rules).
 *
 * Las escrituras de moderación solo funcionan con el custom claim `admin` (firestore.rules:
 * update/delete `comments` y write `products` son admin-only).
 */
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  increment,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Comment } from '@/lib/types.comment';

const COLLECTION = 'comments';

/** Doc de Firestore → Comment plano (Timestamps createdAt/approvedAt a millis). */
export function serializeComment(snap: { id: string; data(): DocumentData | undefined }): Comment {
  const { createdAt, approvedAt, ...rest } = (snap.data() ?? {}) as Record<string, unknown>;
  const ms = (t: unknown) =>
    t && typeof (t as { toMillis?: () => number }).toMillis === 'function'
      ? (t as { toMillis(): number }).toMillis()
      : null;
  return { id: snap.id, ...rest, createdAt: ms(createdAt), approvedAt: ms(approvedAt) } as Comment;
}

/** Todas las reseñas, recientes primero. Para la cola de moderación del admin. */
export async function listComments(): Promise<Comment[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map(serializeComment);
}

/**
 * Reseñas aprobadas de un producto, recientes primero. Para el PDP.
 * Dos filtros de igualdad SIN orderBy → no requiere índice compuesto (Firestore
 * los sirve con índices de campo único); se ordena en memoria.
 */
export async function getApprovedReviews(productId: string): Promise<Comment[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTION),
      where('productId', '==', productId),
      where('status', '==', 'approved'),
    ),
  );
  return snap.docs
    .map(serializeComment)
    .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));
}

/**
 * Aprueba una reseña y suma su rating al producto (atómico e idempotente).
 * Solo incrementa si la reseña aún no fue contada y el producto existe.
 */
export async function approveComment(id: string): Promise<void> {
  const commentRef = doc(db, COLLECTION, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(commentRef);
    if (!snap.exists()) return;
    const c = snap.data() as { rating: number; productId: string; counted?: boolean };

    if (!c.counted) {
      const productRef = doc(db, 'products', c.productId);
      const prod = await tx.get(productRef);
      if (prod.exists()) {
        tx.update(productRef, {
          ratingSum: increment(c.rating),
          ratingCount: increment(1),
        });
      }
    }
    tx.update(commentRef, { status: 'approved', counted: true, approvedAt: serverTimestamp() });
  });
}

/**
 * Rechaza una reseña; si su rating ya estaba contado, lo descuenta del producto.
 */
export async function rejectComment(id: string): Promise<void> {
  const commentRef = doc(db, COLLECTION, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(commentRef);
    if (!snap.exists()) return;
    const c = snap.data() as { rating: number; productId: string; counted?: boolean };

    if (c.counted) {
      const productRef = doc(db, 'products', c.productId);
      const prod = await tx.get(productRef);
      if (prod.exists()) {
        tx.update(productRef, {
          ratingSum: increment(-c.rating),
          ratingCount: increment(-1),
        });
      }
    }
    tx.update(commentRef, { status: 'rejected', counted: false });
  });
}

/**
 * Borra una reseña. La UI solo lo ofrece para reseñas NO aprobadas (counted:false),
 * así no hace falta descontar el rating aquí.
 */
export async function deleteComment(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
