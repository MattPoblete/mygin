/**
 * lib/types.comment.ts — Reseñas de producto moderadas (colección `comments`).
 *
 * Feature "Reseñas con moderación" (Oleada 2). Vive aquí —no en lib/types.ts— por la
 * convención de un type-file por feature. Describe documentos de `comments`: `create`
 * público forzado a `status:'pending'` y `counted:false` (ver firestore.rules); el admin
 * modera y, al aprobar, una transacción client-side agrega el rating al producto.
 *
 * El esquema admite comentarios de blog en el futuro (target/postId); hoy solo se cablea
 * la reseña de producto.
 */

import type { FirestoreTimestamp } from '@/lib/types';

/** Estado de moderación. Lo mueve el admin. */
export type CommentStatus = 'pending' | 'approved' | 'rejected';

/** Documento de `comments`. */
export interface Comment {
  /** docId de Firestore. */
  id: string;
  /** docId (= slug) del producto reseñado. */
  productId: string;
  productSlug: string;
  /** 1..5 estrellas. */
  rating: number;
  authorName: string;
  /** Privado: nunca se renderiza en superficie pública. */
  authorEmail: string;
  body: string;
  status: CommentStatus;
  /** Guarda de idempotencia: true si su rating ya fue sumado al producto. */
  counted: boolean;
  /** Millis (serializado desde Timestamp) en cliente; Timestamp al escribir. */
  createdAt: FirestoreTimestamp | number | null;
  approvedAt?: FirestoreTimestamp | number | null;
}
