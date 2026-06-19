import site from '@/content/site';
import Icon from '@/components/ui/Icon';
import SectionHeader from '@/components/ui/SectionHeader';

export default function Historia() {
  const h = site.historia;

  return (
    <section className="py-32 bg-surface-container-lowest" id="historia" aria-labelledby="historia-headline">
      <div className="container mx-auto px-8 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          {/* Copy */}
          <div>
            <SectionHeader
              id="historia-headline"
              label={h.label}
              headline={h.headline}
              align="left"
              headlineClass="font-headline text-4xl mb-6 tracking-tighter reveal"
            />
            <p className="text-on-surface-variant text-sm leading-relaxed mb-10 reveal reveal--delay-1">
              {h.body}
            </p>

            <blockquote className="border-l-2 border-primary pl-6 mb-10 reveal reveal--delay-2">
              <p className="font-headline text-lg italic text-on-surface mb-2">{h.quote}</p>
              <cite className="text-xs uppercase tracking-widest text-secondary not-italic">
                {h.quoteAuthor}
              </cite>
            </blockquote>

            <p className="text-xs uppercase tracking-widest text-on-surface-variant reveal reveal--delay-3">
              {h.distillery.location}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-12">
            <div className="grid grid-cols-3 gap-8 p-10 bg-surface-container-low rounded-2xl">
              {h.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-headline text-5xl text-primary tracking-tighter">{stat.value}</div>
                  <div className="text-on-surface-variant text-xs uppercase tracking-widest mt-2">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Descripción destilería */}
            <div className="p-8 bg-surface-container rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-3 mb-4">
                <Icon name="location_on" fill={0} className="text-secondary" />
                <span className="text-xs uppercase tracking-widest text-secondary font-bold">Destilería</span>
              </div>
              <p className="font-headline text-lg text-on-surface mb-2">Río Pedregoso</p>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Afueras de Villarrica · Región de la Araucanía · 39°S 72°O
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
