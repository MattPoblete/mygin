import site from '@/content/site';
import SectionHeader from '@/components/ui/SectionHeader';

const SPAN_CLASSES = [
  'md:col-span-2 md:row-span-2',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-2',
  'md:col-span-1 md:row-span-1',
];

export default function Experiencia() {
  const e = site.experiencia;

  return (
    <section
      className="py-32 bg-surface-container-lowest"
      id="experiencia"
      aria-labelledby="experiencia-headline"
    >
      <div className="container mx-auto px-8 md:px-12 text-center mb-20">
        <SectionHeader id="experiencia-headline" label={e.label} headline={e.headline} />
      </div>
      <div className="container mx-auto px-8 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[800px]">
          {e.moments.map((m, i) => (
            <div
              key={m.image}
              className={`${SPAN_CLASSES[i]} relative overflow-hidden rounded-xl reveal reveal--delay-${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.image}
                alt={m.caption}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
