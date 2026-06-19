import type { Cta } from '@/content/site';

/** Destino de una CTA: 'shop' apunta a la tienda interna, el resto a su href. */
export function resolveCta(cta: Cta): string {
  if (cta.action === 'shop') return '/tienda';
  return cta.href || '#';
}

/** Precio en CLP con símbolo, separador de miles y sin decimales: formatPrice(17990) === '$17.990'. */
export function formatPrice(n: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}
