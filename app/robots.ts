import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt generado por Next.js. Permite todos los user-agents —incluidos los
 * crawlers de IA (GPTBot, anthropic-ai, CCBot, Google-Extended, PerplexityBot)—
 * y solo bloquea rutas privadas o transaccionales sin valor de indexación.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/checkout', '/carrito', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
