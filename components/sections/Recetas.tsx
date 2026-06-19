import site from '@/content/site';
import Icon from '@/components/ui/Icon';
import SectionHeader from '@/components/ui/SectionHeader';

export default function Recetas() {
  const r = site.recetas;

  return (
    <section className="py-32 bg-surface" id="recetas" aria-labelledby="recetas-headline">
      <div className="container mx-auto px-8 md:px-12">
        <div className="text-center mb-16">
          <SectionHeader id="recetas-headline" label={r.label} headline={r.headline} sublabel={r.sublabel} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {r.items.map((coctel, i) => (
            <div
              key={coctel.name}
              className={`bg-surface-container-low rounded-2xl overflow-hidden flex flex-col reveal reveal--delay-${i + 1}`}
            >
              {/* Header */}
              <div className="p-8 pb-4">
                <span className="font-headline text-primary block mb-3" style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-headline text-2xl tracking-tighter text-on-surface mb-3">{coctel.name}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{coctel.desc}</p>
              </div>

              {/* Ingredientes (details/summary) */}
              <details className="border-t border-outline-variant/20 group">
                <summary className="flex items-center justify-between px-8 py-5 cursor-pointer list-none text-xs uppercase tracking-widest font-bold text-secondary hover:text-primary transition-colors">
                  <span>Ver ingredientes</span>
                  <Icon
                    name="expand_more"
                    fill={0}
                    className="expand-icon transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>

                <div className="px-8 pb-6 space-y-2">
                  {coctel.ingredients.map((ing, j) => (
                    <div
                      key={j}
                      className="flex justify-between text-sm py-1 border-b border-outline-variant/10"
                    >
                      <span className="text-secondary font-bold font-body tabular-nums">{ing.qty}</span>
                      <span className="text-on-surface-variant">{ing.item}</span>
                    </div>
                  ))}
                </div>

                <p className="px-8 pb-6 text-xs text-on-surface-variant/70 italic leading-relaxed">
                  {coctel.method}
                </p>
              </details>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
