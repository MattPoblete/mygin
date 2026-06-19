import site from '@/content/site';
import CtaButton from '@/components/ui/CtaButton';
import Badge from '@/components/ui/Badge';

/**
 * Hero — calca ui_kits/website/Hero.jsx del MyGin Design System:
 * gradiente radial navy, botella en duotono (luminosity) desvaneciendo a la izquierda,
 * eyebrow heráldica, titular Playfair MAYÚS con palabra en carmesí, tagline Cormorant y chips de specs.
 */
export default function Hero() {
  const { hero } = site;
  const [line1, line2 = ''] = hero.headline.split('\n');
  const accentIdx = hero.accent ? line2.lastIndexOf(hero.accent) : -1;
  const line2Pre = accentIdx >= 0 ? line2.slice(0, accentIdx) : line2;
  // Texto tras la palabra acentuada (p. ej. la puntuación final) — sin colorear.
  const line2Post = accentIdx >= 0 ? line2.slice(accentIdx + hero.accent.length) : '';

  return (
    <section
      id="top"
      aria-labelledby="hero-headline"
      className="relative flex items-center overflow-hidden px-8 md:px-12 pt-28 pb-20 md:min-h-screen"
      style={{ background: 'radial-gradient(120% 120% at 80% 10%, #14304a 0%, var(--navy-dark) 55%, var(--navy-deep) 100%)' }}
    >
      {/* Botella en duotono navy, foco a la derecha, desvaneciendo a la izquierda */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${hero.bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundColor: 'var(--navy-light)',
          backgroundBlendMode: 'luminosity',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 64%)',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 64%)',
        }}
      />
      {/* Wash de legibilidad tras el texto */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(to right, rgba(15,36,53,.82) 0%, rgba(15,36,53,.45) 42%, rgba(15,36,53,0) 70%)' }}
      />

      <div className="relative z-10 max-w-xl">
        <span className="mg-crest-eyebrow">{hero.crest}</span>
        <h1
          id="hero-headline"
          className="reveal font-headline uppercase text-white mt-5"
          style={{ fontWeight: 800, fontSize: 'clamp(40px, 11vw, 76px)', lineHeight: 1.04, letterSpacing: '1.5px' }}
        >
          {line1}
          <br />
          {line2Pre}
          {accentIdx >= 0 && <span style={{ color: 'var(--crimson)' }}>{hero.accent}</span>}
          {line2Post}
        </h1>
        <p className="mg-tagline mt-5" style={{ fontSize: 'clamp(20px, 3vw, 24px)', color: 'var(--cream)' }}>
          {hero.tagline}
        </p>
        <p className="mt-5 max-w-md" style={{ fontFamily: 'var(--font-body)', fontWeight: 300, lineHeight: 1.65, color: 'var(--warm-gray)' }}>
          {hero.subheadline}
        </p>
        <div className="flex flex-wrap gap-4 mt-9">
          {hero.ctas.map((cta) => (
            <CtaButton key={cta.label} cta={cta} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2.5 mt-7">
          {hero.badges.map((b, i) => (
            <Badge key={b} tone={i === 0 ? 'outline' : i === 1 ? 'navy' : 'cream'}>
              {b}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
