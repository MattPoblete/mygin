/**
 * lib/types.ts — Modelo de dominio de MyGin.
 *
 * Solo los tipos que Oleada 0 usa de verdad (catálogo de productos). Los modelos
 * de pedidos, cupones, blog, comentarios, contacto y equipo se agregan en su
 * feature de Oleada 1 — créalos en lib/types.<feature>.ts para evitar conflictos
 * de merge entre worktrees.
 *
 * Estos tipos describen documentos de Firestore. Las marcas de tiempo se modelan
 * como `Timestamp` (firebase/firestore) en cliente; en Cloud Functions se usan
 * los Timestamp del Admin SDK. Para portabilidad usamos un alias laxo.
 */

/** Timestamp de Firestore (client o admin). */
export type FirestoreTimestamp = { toMillis(): number; toDate(): Date };

export type Currency = 'CLP';

export type ProductType = 'gin' | 'botanical' | 'merch';

export interface Product {
  /** docId */
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  shortDesc: string;
  longDesc: string;
  images: string[];
  /** Precio en CLP (entero, sin decimales). */
  price: number;
  compareAtPrice?: number;
  currency: Currency;
  /** Stock físico total. NUNCA se escribe desde cliente (solo Cloud Functions). */
  stock: number;
  /** Unidades reservadas por órdenes awaiting_payment. Disponible = stock - stockReserved. */
  stockReserved: number;
  lowStockThreshold: number;
  sku: string;
  active: boolean;
  featured: boolean;
  badge?: string | null;
  weightGr?: number;
  attributes?: Record<string, string>;
  /** Rating agregado (actualizado por Function al aprobar reseñas). */
  ratingSum?: number;
  ratingCount?: number;
  /** Millis (serializados desde el Timestamp de Firestore para cruzar a client). */
  createdAt: number | null;
  updatedAt: number | null;
}
