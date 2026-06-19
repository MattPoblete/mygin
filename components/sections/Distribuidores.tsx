import site from '@/content/site';
import Icon from '@/components/ui/Icon';
import SectionTitle from '@/components/ui/SectionTitle';
import CtaButton from '@/components/ui/CtaButton';
import Card from '@/components/ui/Card';

/**
 * Distribuidores — calca ui_kits/website/PointsOfSale.jsx:
 * sección cream, tarjetas blancas con icono stroke carmesí y listas con viñetas carmesí.
 */
export default function Distribuidores() {
  const d = site.distribuidores;

  return (
    <section id="distribuidores" className="px-8 md:px-12 py-16 md:py-24" style={{ background: 'var(--cream)' }}>
      <div className="mx-auto" style={{ maxWidth: 'var(--container)' }}>
        <SectionTitle
          align="center"
          tone="light"
          className="reveal"
          style={{ alignItems: 'center', maxWidth: 640, margin: '0 auto 56px' }}
          eyebrow={d.label}
          title={d.headline.replace('\n', ' ')}
          subtitle={d.sublabel}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {d.ciudades.map((ciudad, i) => (
            <Card
              key={ciudad.ciudad}
              tone="light"
              className={`reveal reveal--delay-${(i % 3) + 1}`}
              style={{ background: 'var(--white)', boxShadow: 'var(--shadow-sm)', padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              <div className="flex items-center gap-3">
                <Icon name={ciudad.icon} fill={0} style={{ color: 'var(--crimson)' }} />
                <h3 className="font-headline" style={{ fontWeight: 700, fontSize: 22, color: 'var(--navy-dark)' }}>
                  {ciudad.ciudad}
                </h3>
              </div>
              <ul className="flex flex-col gap-4 list-none p-0 m-0">
                {ciudad.puntos.map((punto) => (
                  <li key={punto.nombre} className="flex items-start gap-3">
                    <span aria-hidden className="flex-none rounded-full" style={{ width: 6, height: 6, background: 'var(--crimson)', marginTop: 8 }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--navy-dark)' }}>{punto.nombre}</div>
                      {punto.nota && (
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--crimson)', marginTop: 4 }}>
                          {punto.nota}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <CtaButton cta={d.onlineCta} />
        </div>
      </div>
    </section>
  );
}
