import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { listProducts } from '@/lib/products';
import { listPublishedPosts } from '@/lib/blog';

// Next exige que `revalidate` sea un literal estáticamente analizable (no un import).
export const revalidate = 300;

/**
 * sitemap.xml generado por Next.js. Rutas estáticas públicas + productos activos
 * y artículos publicados leídos de Firestore. Si la DB falla o está vacía, cae a
 * solo-estáticas (mismo patrón tolerante que generateStaticParams).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/tienda`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/equipo`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const [products, posts] = await Promise.all([
    listProducts().catch(() => []),
    listPublishedPosts().catch(() => []),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p) => p.active)
    .map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt?.toDate?.(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...postRoutes];
}
