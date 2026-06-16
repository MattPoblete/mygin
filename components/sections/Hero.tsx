import site from '@/content/site';
import CtaButton from '@/components/ui/CtaButton';

export default function Hero() {
  const { hero, brand } = site;
  const [line1, line2 = ''] = hero.headline.split('\n');

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
      aria-labelledby="hero-headline"
    >
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0 ml-[700px]">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.bgImage}
          alt=""
          aria-hidden="true"
          loading="eager"
          className="w-full h-full object-cover grayscale opacity-40"
        />
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-8 md:px-12 relative z-20">
        <div className="max-w-4xl">
          <span className="text-secondary font-label uppercase tracking-[0.4em] text-xs mb-6 block">
            {hero.label}
          </span>
          <h1
            id="hero-headline"
            className="font-headline text-6xl md:text-8xl leading-tight mb-8 tracking-tighter reveal"
          >
            {line1}
            <br />
            <span className="italic text-primary">{line2}</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-md mb-12 reveal reveal--delay-1">
            {hero.subheadline}
          </p>
          <div className="flex flex-wrap gap-6 reveal reveal--delay-2">
            {hero.ctas.map((cta) => (
              <CtaButton key={cta.label} cta={cta} />
            ))}
          </div>
        </div>
      </div>

      {/* Coordenadas — desktop */}
      <div className="absolute bottom-12 right-12 z-20 hidden lg:flex flex-col items-end gap-1">
        <span className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant">Destilado en</span>
        <span className="font-headline text-xl">{brand.coordinates}</span>
        <span className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
          Villarrica, Araucanía
        </span>
      </div>
    </section>
  );
}
