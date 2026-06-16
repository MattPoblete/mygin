import site from '@/content/site';
import Icon from '@/components/ui/Icon';
import SectionHeader from '@/components/ui/SectionHeader';

export default function Producto() {
  const p = site.producto;

  return (
    <section className="py-32 bg-surface" id="producto" aria-labelledby="producto-headline">
      <div className="container mx-auto px-8 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Imagen con glow hover */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-surface-container-low rounded-xl blur-2xl group-hover:bg-surface-container-high transition-all duration-700" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image}
              alt={`${site.brand.name} — Botella`}
              loading="lazy"
              className="relative z-10 w-full max-w-md mx-auto transform group-hover:scale-105 transition-transform duration-700 reveal"
            />
          </div>

          {/* Copy + beneficios */}
          <div>
            <SectionHeader
              id="producto-headline"
              label={p.label}
              headline={p.headline}
              headlineClass="font-headline text-4xl mb-6 tracking-tighter reveal"
            />
            <p className="text-on-surface-variant text-sm leading-relaxed mb-8 reveal reveal--delay-1">
              {p.body}
            </p>

            {/* Perfil sensorial */}
            <div className="flex flex-col gap-3 p-6 bg-surface-container-low rounded-xl mb-12 reveal reveal--delay-2">
              {p.sensorProfile.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <Icon name={s.icon} fill={0} className="text-secondary text-base" />
                  <div>
                    <span className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant block">
                      {s.label}
                    </span>
                    <span className="text-sm text-on-surface">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Beneficios */}
            <ul className="space-y-10">
              {p.benefits.map((b, i) => (
                <li key={b.title} className={`flex gap-6 group reveal reveal--delay-${i + 1}`}>
                  <div className="w-12 h-12 flex-shrink-0 bg-surface-container-highest flex items-center justify-center rounded-lg group-hover:text-primary transition-colors">
                    <Icon name={b.icon} fill={1} />
                  </div>
                  <div>
                    <h3 className="font-headline text-xl mb-2 text-on-surface">{b.title}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-sm">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Botánicos */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <span className="text-secondary font-label uppercase tracking-[0.4em] text-xs mb-4 block">
              Los 11 Botánicos
            </span>
            <h3 className="font-headline text-3xl tracking-tighter">
              Lo que hay adentro
              <span className="italic text-primary"> de la botella.</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {p.botanicals.map((b, i) => (
              <div
                key={b.name}
                className={`bg-surface-container-low p-4 rounded-xl flex flex-col gap-2 hover:bg-surface-container-high transition-colors reveal reveal--delay-${(i % 4) + 1}`}
              >
                <div className="flex items-center gap-2">
                  <Icon name={b.icon} fill={0} className="text-secondary text-sm" />
                  <span className="font-headline text-sm text-on-surface">{b.name}</span>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
