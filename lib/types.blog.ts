/**
 * lib/types.blog.ts — Modelo de dominio del Blog/CMS de MyGin.
 *
 * Documentos de la colección Firestore `blogPosts`. Sigue el mismo patrón que
 * lib/types.ts: las marcas de tiempo se modelan con un alias laxo de Timestamp.
 * NO editar lib/types.ts — los tipos de blog viven aquí para evitar conflictos
 * de merge entre worktrees.
 */
import type { FirestoreTimestamp } from '@/lib/types';

/** Categoría editorial de un artículo del blog. */
export type BlogCategory = 'articulo' | 'receta' | 'noticia';

/** Estado de publicación. Solo los `published` se exponen al público. */
export type BlogStatus = 'draft' | 'published';

/** Metadatos SEO/OpenGraph de un artículo. */
export interface BlogSeo {
  title: string;
  description: string;
  ogImage?: string;
}

export interface BlogPost {
  /** docId (== slug). */
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** URL de la imagen de portada (subida a Storage diferida — ver lib/blog.ts). */
  coverImage: string;
  /** Cuerpo en Markdown; se renderiza con react-markdown (defaults seguros). */
  bodyMarkdown: string;
  category: BlogCategory;
  tags: string[];
  status: BlogStatus;
  authorId: string;
  authorName: string;
  seo: BlogSeo;
  /** Se setea con serverTimestamp() la primera vez que pasa a `published`. */
  publishedAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}
