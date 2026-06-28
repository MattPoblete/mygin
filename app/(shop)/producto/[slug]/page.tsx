import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { Product } from '@/lib/types';
import type { Comment } from '@/lib/types.comment';
import { serializeProduct } from '@/lib/products';
import { formatPrice } from '@/lib/cta';
import { availableStock, isLowStock } from '@/lib/cart/stock';
import AddToCartButton from '@/components/shop/AddToCartButton';
import ReviewForm from '@/components/shop/ReviewForm';
import Stars from '@/components/shop/Stars';
import { getApprovedReviews } from '@/lib/comments';
import Icon from '@/components/ui/Icon';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_URL, ORGANIZATION, absoluteUrl } from '@/lib/seo';

/**
 * app/(shop)/producto/[slug]/page.tsx — Detalle de producto.
 *
 * Server Component. Lee el documento por slug (= docId) con el client SDK en
 * cada request (SSR en vivo): los cambios del admin se ven al instante.
 * `generateMetadata` aporta el SEO por producto. La isla cliente
 * <AddToCartButton> añade al carrito.
 */
export const dynamic = 'force-dynamic';

async function getProductBySlug(slug: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', slug));
  if (!snap.exists()) return null;
  const data = serializeProduct(snap);
  return data.active ? data : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Producto no encontrado — MyGin' };

  return {
    title: `${product.name} — MyGin`,
    description: product.shortDesc || product.longDesc?.slice(0, 160),
    alternates: { canonical: `/producto/${slug}` },
    openGraph: {
      title: `${product.name} — MyGin`,
      description: product.shortDesc || product.longDesc?.slice(0, 160),
      images: product.images?.length ? [{ url: product.images[0] }] : undefined,
    },
  };
}

/**
 * Schema.org Product con offer (precio + disponibilidad en vivo) para rich results y LLMs.
 * Si hay reseñas aprobadas, agrega aggregateRating + review (estrellas en Google).
 * Solo se emite con reseñas REALES y visibles en la página — nunca testimonios falsos.
 */
function productJsonLd(
  product: Product,
  avail: number,
  reviews: Comment[],
  average: number,
  ratingCount: number,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc || product.longDesc || undefined,
    image: product.images?.map((i) => absoluteUrl(i)),
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: ORGANIZATION.name },
    // Atributos (origen, botánicos, graduación…) si el admin los cargó.
    additionalProperty: product.attributes
      ? Object.entries(product.attributes).map(([name, value]) => ({
          '@type': 'PropertyValue',
          name,
          value,
        }))
      : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'CLP',
      availability: avail > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/producto/${product.slug}`,
    },
    ...(ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(average.toFixed(1)),
        reviewCount: ratingCount,
        bestRating: 5,
      },
      review: reviews.slice(0, 10).map((r) => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.authorName },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.body,
        ...(typeof r.createdAt === 'number' && {
          datePublished: new Date(r.createdAt).toISOString().slice(0, 10),
        }),
      })),
    }),
  };
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const avail = availableStock(product);
  const low = isLowStock(product);
  const soldOut = avail <= 0;
  const image = product.images?.[0] ?? '';

  const reviews = await getApprovedReviews(product.id);
  const ratingCount = product.ratingCount ?? 0;
  const average = ratingCount > 0 ? (product.ratingSum ?? 0) / ratingCount : 0;
  const reviewDate = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' });

  return (
    <main className="bg-background min-h-screen pt-32 pb-32">
      <JsonLd data={productJsonLd(product, avail, reviews, average, ratingCount)} />
      <div className="container mx-auto px-8 md:px-12">
        <nav className="mb-8 text-xs uppercase tracking-widest text-on-surface-variant">
          <Link href="/tienda" className="hover:text-primary transition-colors">
            ← Volver a la tienda
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Galería */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-container-lowest">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-secondary/40 text-xs uppercase tracking-widest">
                  Sin imagen
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1, 5).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img}
                    src={img}
                    alt={`${product.name} — vista ${i + 2}`}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover bg-surface-container-lowest"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.badge && (
              <span className="mb-4 w-fit rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-primary">
                {product.badge}
              </span>
            )}
            <h1 className="font-headline text-4xl tracking-tight text-on-surface">{product.name}</h1>

            <div className="mt-4 flex items-end gap-3">
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-base text-on-surface-variant/70 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              <span className="font-headline text-3xl text-primary">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Stock */}
            <div className="mt-3 flex items-center gap-2 text-sm">
              {soldOut ? (
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <Icon name="block" fill={0} className="text-base" /> Agotado
                </span>
              ) : low ? (
                <span className="flex items-center gap-1 font-semibold text-primary-fixed">
                  <Icon name="local_fire_department" fill={0} className="text-base" /> Últimas {avail}{' '}
                  unidades
                </span>
              ) : (
                <span className="flex items-center gap-1 text-secondary">
                  <Icon name="check_circle" fill={0} className="text-base" /> En stock
                </span>
              )}
            </div>

            {product.shortDesc && (
              <p className="mt-6 text-base leading-relaxed text-on-surface">{product.shortDesc}</p>
            )}
            {product.longDesc && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                {product.longDesc}
              </p>
            )}

            <div className="mt-10">
              <AddToCartButton product={product} />
            </div>

            {/* Confianza — despacho, pagos, +18 */}
            <ul className="mt-6 flex flex-col gap-2 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <Icon name="local_shipping" fill={0} className="text-base text-secondary" />
                Despacho a todo Chile
              </li>
              <li className="flex items-center gap-2">
                <Icon name="credit_card" fill={0} className="text-base text-secondary" />
                Pago seguro con tarjeta de débito o crédito
              </li>
              <li className="flex items-center gap-2">
                <Icon name="verified_user" fill={0} className="text-base text-secondary" />
                Venta exclusiva para mayores de 18 años
              </li>
            </ul>

            {product.sku && (
              <p className="mt-6 text-xs uppercase tracking-widest text-on-surface-variant/60">
                SKU: {product.sku}
              </p>
            )}

            {ratingCount > 0 && (
              <div className="mt-6 flex items-center gap-2 text-sm">
                <Stars value={average} label={`${average.toFixed(1)} de 5`} />
                <span className="text-on-surface-variant">
                  {average.toFixed(1)} · {ratingCount} {ratingCount === 1 ? 'reseña' : 'reseñas'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reseñas */}
        <section className="mt-20 border-t border-outline-variant/20 pt-12" aria-labelledby="resenas">
          <h2 id="resenas" className="font-headline text-2xl tracking-tight text-on-surface">
            Reseñas
          </h2>

          {reviews.length > 0 ? (
            <ul className="mt-8 flex flex-col gap-8">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-outline-variant/10 pb-8 last:border-0">
                  <div className="flex items-center gap-3">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold text-on-surface">{r.authorName}</span>
                    {typeof r.createdAt === 'number' && (
                      <span className="text-xs text-on-surface-variant">
                        {reviewDate.format(r.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                    {r.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-on-surface-variant">
              Aún no hay reseñas. Sé el primero en opinar.
            </p>
          )}

          <div className="mt-12 max-w-xl">
            <h3 className="font-headline text-lg tracking-tight text-on-surface mb-6">
              Escribe una reseña
            </h3>
            <ReviewForm productId={product.id} productSlug={product.slug} />
          </div>
        </section>
      </div>
    </main>
  );
}
