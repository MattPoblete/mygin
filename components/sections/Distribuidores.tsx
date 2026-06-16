import site from '@/content/site';
import Icon from '@/components/ui/Icon';
import SectionHeader from '@/components/ui/SectionHeader';
import CtaButton from '@/components/ui/CtaButton';

export default function Distribuidores() {
  const d = site.distribuidores;

  return (
    <section className="py-32 bg-surface" id="distribuidores" aria-labelledby="distribuidores-headline">
      <div className="container mx-auto px-8 md:px-12">
        <div className="text-center mb-16">
          <SectionHeader id="distribuidores-headline" label={d.label} headline={d.headline} sublabel={d.sublabel} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {d.ciudades.map((ciudad, i) => (
            <div
              key={ciudad.ciudad}
              className={`bg-surface-container-low p-8 rounded-2xl reveal reveal--delay-${i + 1}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <Icon name={ciudad.icon} fill={0} className="text-secondary" />
                <h3 className="font-headline text-xl tracking-tighter text-on-surface">{ciudad.ciudad}</h3>
              </div>
              <ul className="space-y-3">
                {ciudad.puntos.map((punto) => (
                  <li key={punto.nombre} className="flex items-start gap-2">
                    <span className="text-secondary mt-1 text-xs">●</span>
                    <div>
                      <span className="text-sm text-on-surface">{punto.nombre}</span>
                      {punto.nota && (
                        <span className="block text-xs text-secondary font-bold uppercase tracking-wider mt-0.5">
                          {punto.nota}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <CtaButton cta={d.onlineCta} />
        </div>
      </div>
    </section>
  );
}
