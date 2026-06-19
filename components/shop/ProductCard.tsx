import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/cta';
import { availableStock, isLowStock } from '@/lib/cart/stock';

/**
 * ProductCard — tarjeta de producto en la grilla de /tienda.
 * Server Component (no interactividad propia); enlaza al detalle del producto.
 */
export default function ProductCard({ product }: { product: Product }) {
  const avail = availableStock(product);
  const soldOut = avail <= 0;
  const low = isLowStock(product);
  const image = product.images?.[0] ?? '';

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/20 transition-all hover:border-primary/40"
    >
      <div className="relative aspect-square bg-surface-container-lowest overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-secondary/40 text-xs uppercase tracking-widest">
            Sin imagen
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-secondary text-xs font-bold uppercase tracking-[0.3em]">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-headline text-xl tracking-tight text-on-surface">
          {product.name}
          {soldOut && <span className="sr-only"> — Agotado</span>}
        </h3>
        {product.shortDesc && (
          <p className="mt-2 text-sm text-on-surface-variant line-clamp-2">{product.shortDesc}</p>
        )}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-on-surface-variant/70 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            <span
              className={`font-headline text-lg text-primary${soldOut ? ' opacity-50' : ''}`}
            >
              {formatPrice(product.price)}
            </span>
          </div>
          {low && !soldOut && (
            <span className="text-[11px] text-primary-fixed font-semibold uppercase tracking-wider">
              Últimas {avail}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
