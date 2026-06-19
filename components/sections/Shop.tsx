import Link from 'next/link';
import site from '@/content/site';
import type { Product } from '@/lib/types';
import type { ShopItem } from '@/content/site';
import SectionTitle from '@/components/ui/SectionTitle';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import CtaButton from '@/components/ui/CtaButton';
import { formatPrice } from '@/lib/cta';

/**
 * Shop — calca ui_kits/website/Shop.jsx: grilla bento de productos sobre cream.
 * Enlaza a las páginas de producto reales (/producto/[slug]); el carrito vive en /tienda.
 * Precio/imagen/descripción/badge vienen de Firestore por slug; el resto es editorial.
 */
const fmt = (n: number) => formatPrice(n);

/** Sobreescribe los campos dinámicos del item con el producto de la DB (fallback a site.ts). */
function merge(it: ShopItem, products: Map<string, Product>): ShopItem {
  const p = products.get(it.href.split('/').pop() ?? '');
  if (!p) return it;
  return { ...it, price: p.price, img: p.images?.[0] ?? it.img, blurb: p.shortDesc ?? it.blurb, badge: p.badge ?? it.badge };
}

export default function Shop({ products }: { products: Map<string, Product> }) {
  const t = site.tienda;
  const base = t.items.find((i) => i.featured) ?? t.items[0];
  const featured = merge(base, products);
  const rest = t.items.filter((i) => i !== base).map((i) => merge(i, products));

  return (
    <section id="tienda" className="px-8 md:px-12 py-16 md:py-24" style={{ background: 'var(--cream)' }}>
      <div className="mx-auto" style={{ maxWidth: 'var(--container)' }}>
        <SectionTitle
          align="center"
          tone="light"
          className="reveal"
          style={{ alignItems: 'center', margin: '0 auto 48px' }}
          eyebrow={t.label}
          title={t.headline}
          subtitle={t.sublabel}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tile destacado */}
          <Card tone="light" interactive className="lg:col-span-2 reveal" style={{ padding: 0, overflow: 'hidden' }}>
            <Link href={featured.href} className="flex flex-col md:flex-row h-full">
              <div className="relative md:basis-[46%] shrink-0 overflow-hidden" style={{ background: 'var(--navy-dark)', minHeight: 240 }}>
                <span className="absolute z-10" style={{ top: 16, left: 16 }}>
                  <Badge tone="crimson">{featured.badge}</Badge>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.img} alt={featured.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2.5" style={{ padding: 'var(--sp-xl)' }}>
                <span className="mg-eyebrow">Edición insignia</span>
                <h3 className="font-headline" style={{ fontWeight: 700, fontSize: 30, lineHeight: 1.05, color: 'var(--navy-dark)' }}>{featured.name}</h3>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--dark-gray)' }}>{featured.spec}</span>
                {featured.blurb && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, color: 'var(--dark-gray)', margin: '4px 0 0', maxWidth: 340 }}>{featured.blurb}</p>
                )}
                <div className="flex items-center gap-5 mt-auto pt-5">
                  <span className="font-headline" style={{ fontWeight: 700, fontSize: 30, color: 'var(--navy-dark)' }}>{fmt(featured.price)}</span>
                  <span className="btn-primary" style={{ pointerEvents: 'none' }}>Ver producto</span>
                </div>
              </div>
            </Link>
          </Card>

          {/* Tiles pequeños */}
          {rest.map((p) => (
            <Card key={p.name} tone="light" interactive className="reveal reveal--delay-1" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Link href={p.href} className="flex flex-col h-full">
                <div className="relative overflow-hidden" style={{ background: 'var(--navy-dark)', height: 220 }}>
                  <span className="absolute z-10" style={{ top: 14, left: 14 }}>
                    <Badge tone="crimson">{p.badge}</Badge>
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1" style={{ padding: 'var(--sp-lg)' }}>
                  <h3 className="font-headline" style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy-dark)' }}>{p.name}</h3>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dark-gray)' }}>{p.spec}</span>
                  <div className="flex items-center justify-between mt-auto pt-3.5">
                    <span className="font-headline" style={{ fontWeight: 700, fontSize: 20, color: 'var(--navy-dark)' }}>{fmt(p.price)}</span>
                    <span className="font-body uppercase" style={{ fontSize: 11, letterSpacing: 1, color: 'var(--crimson)', fontWeight: 600 }}>Ver →</span>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <CtaButton cta={t.cta} />
        </div>
      </div>
    </section>
  );
}
