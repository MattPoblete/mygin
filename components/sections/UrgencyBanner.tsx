import Link from 'next/link';
import site from '@/content/site';
import Icon from '@/components/ui/Icon';
import { resolveCta } from '@/lib/cta';

export default function UrgencyBanner() {
  const b = site.urgencyBanner;
  const href = resolveCta(b.cta);

  return (
    <section className="bg-primary py-16" aria-labelledby="urgencia-headline">
      <div className="container mx-auto px-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <Icon name="bolt" fill={1} className="text-on-primary text-5xl" />
          <div>
            <h2 id="urgencia-headline" className="font-headline text-3xl text-on-primary leading-none mb-2 tracking-tighter">
              {b.headline}
            </h2>
            <p className="text-on-primary/70 uppercase tracking-widest text-xs font-bold">{b.sublabel}</p>
          </div>
        </div>
        <Link
          href={href}
          className="bg-on-primary text-white px-12 py-5 rounded-lg font-bold uppercase text-xs tracking-[0.3em] hover:scale-105 transition-transform"
        >
          {b.cta.label}
        </Link>
      </div>
    </section>
  );
}
