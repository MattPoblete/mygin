/**
 * lib/seo.ts — Constantes y helpers de SEO/JSON-LD compartidos.
 *
 * SITE_URL es la única fuente del dominio canónico (la usan robots, sitemap,
 * metadataBase y los JSON-LD). ORGANIZATION se referencia por @id desde los
 * schemas Product/BlogPosting para no duplicar los datos de marca.
 */
import site from '@/content/site';

export const SITE_URL = 'https://mygin.cl';

/** Convierte una ruta relativa o ya-absoluta en URL absoluta del sitio. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: site.brand.name,
  url: SITE_URL,
  logo: absoluteUrl('/og/mygin-og.webp'),
  description:
    'Gin contemporáneo chileno. 11 botánicos destilados a las orillas del Río Pedregoso, Villarrica, Región de la Araucanía.',
  sameAs: [site.brand.instagramUrl],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Villarrica',
    addressRegion: 'Araucanía',
    addressCountry: 'CL',
  },
} as const;
