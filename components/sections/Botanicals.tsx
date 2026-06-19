import site from '@/content/site';
import SectionTitle from '@/components/ui/SectionTitle';
import Badge from '@/components/ui/Badge';

/**
 * Botanicals — calca ui_kits/website/Botanicals.jsx: bento grid de los 11 botánicos
 * con foto en duotono navy (background-blend luminosity) + wash de legibilidad.
 * El huesillo (featured) es el tile destacado. Datos: site.producto.botanicals.
 */
const WIDE = new Set(['naranjas', 'raiz_de_ang']); // tiles anchos del bento

function tileBg(img: string, strong: boolean) {
  return (
    <>
      <div
        aria-hidden
        className="absolute z-0"
        style={{
          inset: -16,
          backgroundImage: `url(/assets/images/ingredientes/${img}.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'var(--navy-light)',
          backgroundBlendMode: 'luminosity',
          filter: 'blur(7px)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background: strong
            ? 'linear-gradient(180deg, rgba(8,24,38,.30) 0%, rgba(8,24,38,.62) 45%, rgba(8,24,38,.92) 100%)'
            : 'linear-gradient(180deg, rgba(8,24,38,.45) 0%, rgba(8,24,38,.72) 55%, rgba(8,24,38,.93) 100%)',
        }}
      />
    </>
  );
}

export default function Botanicals() {
  const items = site.producto.botanicals;

  return (
    <section id="botanicos" className="px-8 md:px-12 py-16 md:py-24" style={{ background: 'var(--navy-deep)' }}>
      <div className="mx-auto" style={{ maxWidth: 'var(--container)' }}>
        <SectionTitle
          align="center"
          tone="dark"
          className="reveal"
          style={{ alignItems: 'center', margin: '0 auto 56px' }}
          eyebrow="Los 11 botánicos"
          title="Lo que hay adentro de la botella"
          subtitle="Once botánicos destilados a orillas del Río Pedregoso, con el huesillo —el sabor más chileno del mundo— en el corazón de la receta."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(160px,auto)]">
          {items.map((b, i) => {
            const featured = !!b.featured;
            const wide = WIDE.has(b.img);
            const span = featured
              ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2'
              : wide
                ? 'sm:col-span-2 lg:col-span-2'
                : '';
            return (
              <article
                key={b.name}
                className={`relative overflow-hidden flex flex-col justify-end reveal ${span}`}
                style={{
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255,255,255,.10)',
                  minHeight: featured ? 320 : 180,
                  padding: featured ? 'var(--sp-2xl)' : 'var(--sp-xl)',
                }}
              >
                {tileBg(b.img, featured)}
                {featured && (
                  <span className="absolute z-10" style={{ top: 'var(--sp-xl)', left: 'var(--sp-2xl)' }}>
                    <Badge tone="crimson">El corazón de la receta</Badge>
                  </span>
                )}
                <span className="relative z-10 font-headline" style={{ fontWeight: 800, fontSize: featured ? 16 : 14, letterSpacing: 1, color: 'var(--crimson)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className="relative z-10 font-headline text-white"
                  style={{ fontWeight: 700, fontSize: featured ? 34 : wide ? 24 : 20, lineHeight: 1.05, margin: '8px 0 10px' }}
                >
                  {b.name}
                </h3>
                <p
                  className="relative z-10"
                  style={{ fontFamily: 'var(--font-body)', fontSize: featured ? 16 : 14, lineHeight: 1.6, color: 'var(--cream)', margin: 0, maxWidth: featured ? 420 : wide ? 480 : undefined }}
                >
                  {b.desc}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
