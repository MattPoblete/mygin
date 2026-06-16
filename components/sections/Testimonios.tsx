import site from '@/content/site';
import Icon from '@/components/ui/Icon';

export default function Testimonios() {
  const t = site.testimonios;

  return (
    <section
      className="py-32 bg-surface-container-lowest overflow-hidden"
      id="testimonios"
      aria-labelledby="testimonios-headline"
    >
      <div className="container mx-auto px-8 md:px-12">
        <h2
          id="testimonios-headline"
          className="font-headline text-3xl mb-16 text-center tracking-tighter reveal"
        >
          {t.headline}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.items.map((item, i) => (
            <div
              key={item.name}
              className={`bg-surface-container-low p-10 rounded-lg border-b border-secondary/10 reveal reveal--delay-${i + 1}`}
            >
              <div className="flex text-secondary mb-6">
                {Array.from({ length: 5 }, (_, s) => (
                  <Icon key={s} name="star" fill={s < item.stars ? 1 : 0} />
                ))}
              </div>
              <p className="font-body italic text-lg mb-8 leading-relaxed">{item.text}</p>
              <span className="block text-xs uppercase tracking-widest text-primary font-bold">
                {item.name} — {item.location}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
