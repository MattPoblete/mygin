/**
 * lib/types.contact.ts — Modelo de contacto comercial (colección `contactSubmissions`).
 *
 * Tipo de la feature "Contacto Comercial" (Oleada 1). Vive aquí —no en lib/types.ts—
 * para evitar conflictos de merge entre worktrees. Describe documentos de la
 * colección `contactSubmissions`: `create` público validado (requiere `email`
 * string, `message` no vacío y `status=='new'`); lectura/edición solo admin.
 */

import type { FirestoreTimestamp } from '@/lib/types';

/** Tipo de consulta entrante. */
export type ContactType = 'comercial' | 'general';

/** Estado de gestión de la consulta (lo mueve el admin). */
export type ContactStatus = 'new' | 'read' | 'archived';

/** Documento de `contactSubmissions`. */
export interface ContactSubmission {
  /** docId de Firestore. */
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  type: ContactType;
  status: ContactStatus;
  createdAt: FirestoreTimestamp;
  /** User-Agent del navegador al enviar (anti-spam / soporte). */
  userAgent?: string;
}
