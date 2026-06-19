import site from '@/content/site';
import type { Product } from '@/lib/types';
import CtaButton from '@/components/ui/CtaButton';
import SectionTitle from '@/components/ui/SectionTitle';
import Badge from '@/components/ui/Badge';
import { formatPrice } from '@/lib/cta';

/**
 * Producto — calca ui_kits/website/ProductDetail.jsx:
 * fondo de botella en duotono, notas de cata Nariz/Boca/Final, badges, precio + CTA.
 * Precio/imagen/descripción salen de Firestore (mygin-botella-individual); el resto es editorial.
 */
export default function Producto({ products }: { products: Map<string, Product> }) {
  const s = site.producto;
  const db = products.get('mygin-botella-individual');
  const p = { ...s, price: db?.price ?? s.price, image: db?.images?.[0] ?? s.image, body: db?.longDesc ?? s.body };
  const price = formatPrice(p.price);

  return (
    <section id="producto" className="relative overflow-hidden px-8 md:px-12 py-16 md:py-28" style={{ background: 'var(--navy-dark)' }}>
      {/* Botella monocroma llenando la sección, desvaneciendo a la derecha */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${p.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          backgroundColor: 'var(--navy-light)',
          backgroundBlendMode: 'luminosity',
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 32%, rgba(0,0,0,0) 66%)',
          maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 32%, rgba(0,0,0,0) 66%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(to right, rgba(15,36,53,0) 30%, rgba(15,36,53,.55) 55%, rgba(15,36,53,.85) 100%)' }}
      />

      <div className="relative z-10 mx-auto grid grid-cols-1 md:grid-cols-2 gap-12" style={{ maxWidth: 'var(--container)' }}>
        <div className="md:col-start-2 max-w-xl reveal">
          <SectionTitle tone="dark" eyebrow={p.label} title="MyGin" />
          <div className="flex flex-wrap gap-2.5 mt-3 mb-5">
            {p.badges.map((b, i) => (
              <Badge key={b} tone={i === 0 ? 'crimson' : i === 1 ? 'outline' : 'navy'}>
                {b}
              </Badge>
            ))}
          </div>
          <p className="max-w-lg" style={{ fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: 16, lineHeight: 1.7, color: 'var(--warm-gray)' }}>
            {p.body}
          </p>

          <div className="my-7 flex flex-col">
            {p.tastingNotes.map((n) => (
              <div
                key={n.k}
                className="grid gap-5 py-4"
                style={{ gridTemplateColumns: '110px 1fr', borderTop: '1px solid rgba(255,255,255,0.10)' }}
              >
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--crimson)' }}>
                  {n.k}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--cream)' }}>{n.v}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span className="font-headline text-white" style={{ fontWeight: 700, fontSize: 32 }}>
              {price}
            </span>
            <CtaButton cta={{ label: 'Agregar al carrito', type: 'primary', action: 'shop' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
