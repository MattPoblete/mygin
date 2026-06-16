import Link from 'next/link';
import type { Cta } from '@/content/site';
import { resolveCta } from '@/lib/cta';

/**
 * CtaButton — porta createBtn()/resolveCta() de js/render.js.
 * La pasarela Shopify fue eliminada: las CTAs de compra (action 'shop')
 * apuntan a la tienda interna /tienda.
 */
export default function CtaButton({ cta, className = '' }: { cta: Cta; className?: string }) {
  const href = resolveCta(cta);
  const isPrimary = (cta.type ?? 'primary') === 'primary';
  const isExternal = href.startsWith('http');
  const classes = `${isPrimary ? 'btn-primary' : 'btn-outline'} ${className}`.trim();

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {cta.label}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {cta.label}
    </Link>
  );
}
