import type { Cta } from '@/content/site';

/** Destino de una CTA: 'shop' apunta a la tienda interna, el resto a su href. */
export function resolveCta(cta: Cta): string {
  if (cta.action === 'shop') return '/tienda';
  return cta.href || '#';
}

/** Precio en CLP con separador de miles, sin decimales. */
export function formatPrice(n: number): string {
  return n.toLocaleString('es-CL');
}
