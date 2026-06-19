/**
 * lib/blog.ts — Acceso a la colección `blogPosts` de Firestore (client SDK).
 *
 * Espejo de lib/products.ts. Lecturas públicas restringidas a status=='published'
 * (lo exigen las firestore.rules); el CRUD de admin solo funciona con el custom
 * claim `admin`. El slug se usa como docId (idempotente con el seed).
 *
 * Subida de imágenes a Storage: DIFERIDA. coverImage/ogImage se ingresan por URL.
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
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { BlogPost, BlogCategory, BlogStatus, BlogSeo } from '@/lib/types.blog';

const COLLECTION = 'blogPosts';

/** Campos editables desde el formulario de admin. */
export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  bodyMarkdown: string;
  category: BlogCategory;
  tags: string[];
  status: BlogStatus;
  authorId: string;
  authorName: string;
  seo: BlogSeo;
}

/**
 * Artículos publicados, ordenados por fecha de publicación desc. Uso público.
 * Un solo `where` de igualdad SIN orderBy → índice de campo único automático (no
 * compuesto); se ordena en memoria. Así no depende de un índice desplegado ni
 * descarta posts que carezcan de `publishedAt`.
 */
export async function listPublishedPosts(): Promise<BlogPost[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTION), where('status', '==', 'published')),
  );
  const ms = (t: BlogPost['publishedAt']) => (t && 'toMillis' in t ? t.toMillis() : 0);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as BlogPost)
    .sort((a, b) => ms(b.publishedAt) - ms(a.publishedAt));
}

/** Un artículo publicado por slug (docId). Devuelve null si no existe o es draft. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const snap = await getDoc(doc(db, COLLECTION, slug));
  if (!snap.exists()) return null;
  const post = { id: snap.id, ...snap.data() } as BlogPost;
  return post.status === 'published' ? post : null;
}

/** Todos los artículos (draft + published). Uso de admin. */
export async function listAllPosts(): Promise<BlogPost[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('updatedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BlogPost);
}

/** Un artículo por id (docId), sin filtrar por estado. Uso de admin. */
export async function getPost(id: string): Promise<BlogPost | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as BlogPost) : null;
}

/** Crea un artículo usando el slug como docId. */
export async function createPost(input: BlogPostInput): Promise<string> {
  const id = input.slug;
  const ref = doc(db, COLLECTION, id);
  await setDoc(ref, {
    ...normalize(input),
    // publishedAt solo si nace publicado.
    ...(input.status === 'published' ? { publishedAt: serverTimestamp() } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

/**
 * Actualiza un artículo. Setea publishedAt con serverTimestamp() la primera vez
 * que pasa a `published` (si aún no tenía).
 */
export async function updatePost(id: string, input: BlogPostInput): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const current = await getDoc(ref);
  const alreadyPublished = Boolean(current.exists() && current.data()?.publishedAt);

  await updateDoc(ref, {
    ...normalize(input),
    ...(input.status === 'published' && !alreadyPublished
      ? { publishedAt: serverTimestamp() }
      : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Limpia y normaliza campos antes de escribir. */
function normalize(input: BlogPostInput) {
  return {
    slug: input.slug.trim(),
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    coverImage: input.coverImage.trim(),
    bodyMarkdown: input.bodyMarkdown,
    category: input.category,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    status: input.status,
    authorId: input.authorId,
    authorName: input.authorName.trim(),
    seo: {
      title: input.seo.title.trim(),
      description: input.seo.description.trim(),
      ...(input.seo.ogImage?.trim() ? { ogImage: input.seo.ogImage.trim() } : {}),
    },
  };
}
