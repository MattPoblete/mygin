/**
 * lib/products.ts — Acceso a la colección `products` de Firestore (client SDK).
 *
 * Lecturas públicas (catálogo) y escrituras de admin (CRUD). Las escrituras solo
 * funcionan si el usuario tiene el custom claim `admin` (lo exige firestore.rules).
 * El descuento atómico de stock en compra ocurre en Cloud Functions, no aquí.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Product, ProductType } from '@/lib/types';

const COLLECTION = 'products';

/**
 * Convierte un doc de Firestore a Product plano: los Timestamps createdAt/updatedAt
 * pasan a millis (number) para poder cruzar el borde server→client component.
 */
export function serializeProduct(snap: { id: string; data(): DocumentData | undefined }): Product {
  const { createdAt, updatedAt, ...rest } = (snap.data() ?? {}) as Record<string, unknown>;
  const ms = (t: unknown) =>
    t && typeof (t as { toMillis?: () => number }).toMillis === 'function'
      ? (t as { toMillis(): number }).toMillis()
      : null;
  return { id: snap.id, ...rest, createdAt: ms(createdAt), updatedAt: ms(updatedAt) } as Product;
}

/** Campos editables desde el formulario de admin. */
export interface ProductInput {
  slug: string;
  name: string;
  type: ProductType;
  shortDesc: string;
  longDesc: string;
  images: string[];
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  lowStockThreshold: number;
  sku: string;
  active: boolean;
  featured: boolean;
  badge?: string | null;
}

export async function listProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map(serializeProduct);
}

/** Productos activos del catálogo público (tienda + landing), destacados primero. */
export async function getActiveProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), where('active', '==', true)));
  return snap.docs
    .map(serializeProduct)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
}

export async function getProduct(id: string): Promise<Product | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  return snap.exists() ? serializeProduct(snap) : null;
}

/** Crea un producto usando el slug como docId (idempotente con el seed). */
export async function createProduct(input: ProductInput): Promise<string> {
  const id = input.slug;
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, {
    ...normalize(input),
    currency: 'CLP',
    stockReserved: 0,
    ratingSum: 0,
    ratingCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { ...normalize(input), updatedAt: serverTimestamp() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Limpia tipos numéricos y nulos antes de escribir. */
function normalize(input: ProductInput) {
  return {
    slug: input.slug.trim(),
    name: input.name.trim(),
    type: input.type,
    shortDesc: input.shortDesc.trim(),
    longDesc: input.longDesc.trim(),
    images: input.images.filter((s) => s.trim().length > 0),
    price: Math.round(Number(input.price)) || 0,
    compareAtPrice: input.compareAtPrice ? Math.round(Number(input.compareAtPrice)) : null,
    stock: Math.max(0, Math.round(Number(input.stock)) || 0),
    lowStockThreshold: Math.max(0, Math.round(Number(input.lowStockThreshold)) || 0),
    sku: input.sku.trim(),
    active: Boolean(input.active),
    featured: Boolean(input.featured),
    badge: input.badge?.trim() ? input.badge.trim() : null,
  };
}
