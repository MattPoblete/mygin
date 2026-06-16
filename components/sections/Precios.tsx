import Link from 'next/link';
import site from '@/content/site';
import Icon from '@/components/ui/Icon';
import SectionHeader from '@/components/ui/SectionHeader';
import { resolveCta, formatPrice } from '@/lib/cta';
import type { PriceTier } from '@/content/site';

function HighlightCard({ tier, index }: { tier: PriceTier; index: number }) {
  return (
    <div
      className={`bg-primary text-on-primary p-12 rounded-xl flex flex-col justify-between relative overflow-hidden reveal reveal--delay-${index + 1}`}
    >
      {tier.badge && (
        <div className="absolute -top-4 -right-12 bg-white/20 text-white text-[0.6rem] font-bold px-12 py-2 rotate-45 uppercase tracking-widest">
          {tier.badge}
        </div>
      )}
      <div>
        <div className="flex justify-between items-start mb-8">
          <h3 className="font-headline text-2xl uppercase tracking-tighter">{tier.label}</h3>
          <span className="bg-primary-container text-primary px-3 py-1 text-[0.6rem] tracking-[0.2em] uppercase rounded-full">
            {tier.sublabel}
          </span>
        </div>
        <div className="mb-8">
          <span className="text-4xl font-headline">${formatPrice(tier.price)}</span>
          <span className="text-on-primary-container text-sm ml-2">{tier.unit}</span>
        </div>
        <ul className="space-y-4 mb-12">
          {tier.features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-on-primary/80">
              <Icon name="check" fill={0} /> {f}
            </li>
          ))}
        </ul>
      </div>
      <Link href={resolveCta(tier.cta)} className="btn-outline text-center">
        {tier.cta.label}
      </Link>
    </div>
  );
}

function StandardCard({ tier, index }: { tier: PriceTier; index: number }) {
  return (
    <div
      className={`bg-surface p-12 rounded-xl flex flex-col justify-between group hover:bg-surface-container-low transition-all duration-500 reveal reveal--delay-${index + 1}`}
    >
      <div>
        <div className="flex justify-between items-start mb-8">
          <h3 className="font-headline text-2xl uppercase tracking-tighter">{tier.label}</h3>
          <span className="bg-surface-container-highest px-3 py-1 text-[0.6rem] tracking-[0.2em] uppercase rounded-full">
            {tier.sublabel}
          </span>
        </div>
        <div className="mb-8">
          <span className="text-4xl font-headline">${formatPrice(tier.price)}</span>
          <span className="text-on-surface-variant text-sm ml-2">{tier.unit}</span>
        </div>
        <ul className="space-y-4 mb-12">
          {tier.features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-sm text-on-surface-variant">
              <Icon name="check" fill={0} className="text-xs text-secondary" /> {f}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href={resolveCta(tier.cta)}
        className="w-full text-center border border-primary text-primary py-4 rounded-lg font-bold uppercase text-xs tracking-widest group-hover:bg-primary group-hover:text-on-primary transition-all duration-300"
      >
        {tier.cta.label}
      </Link>
    </div>
  );
}

export default function Precios() {
  const p = site.precios;

  return (
    <section className="py-32 bg-surface-container-lowest" id="precios" aria-labelledby="precios-headline">
      <div className="container mx-auto px-8 md:px-12 max-w-5xl">
        <div className="text-center mb-20">
          <SectionHeader
            id="precios-headline"
            label={p.label}
            headline={p.headline}
            headlineClass="font-headline text-4xl tracking-tighter reveal"
            secondLineClass="text-secondary italic"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {p.tiers.map((tier, i) =>
            tier.highlight ? (
              <HighlightCard key={tier.label} tier={tier} index={i} />
            ) : (
              <StandardCard key={tier.label} tier={tier} index={i} />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
