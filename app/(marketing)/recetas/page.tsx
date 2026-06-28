/**
 * /recetas — Cócteles con MyGin (Server Component, SSG estático).
 *
 * Renderiza las recetas de content/site.ts (antes contenido muerto, sin URL propia)
 * y emite Recipe JSON-LD por cada cóctel: rich results de receta + citabilidad por
 * LLMs, y una página indexable que apunta a "cócteles con gin" / "recetas con gin chileno".
 */
import type { Metadata } from 'next';
import SectionHeader from '@/components/ui/SectionHeader';
import JsonLd from '@/components/seo/JsonLd';
import { ORGANIZATION, absoluteUrl } from '@/lib/seo';
import site from '@/content/site';

export const metadata: Metadata = {
  title: 'Cócteles con Gin — Recetas con MyGin | Gin Artesanal Chileno',
  description:
    'Tres cócteles creados con MyGin, gin artesanal chileno: Maqui Collins, Pepino Sour y Pomelo Sour. Ingredientes y preparación paso a paso.',
  alternates: { canonical: '/recetas' },
  openGraph: {
    title: 'Cócteles con Gin — Recetas con MyGin',
    description: 'Maqui Collins, Pepino Sour y Pomelo Sour: tres formas de tomar bien tu gin chileno.',
    url: '/recetas',
    type: 'website',
  },
};

const { recetas } = site;

/** Recipe schema.org. `method` viene como pasos unidos por " · " → HowToStep[]. */
function recipeJsonLd(recipe: (typeof recetas.items)[number]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.desc,
    image: absoluteUrl('/og/mygin-og.webp'),
    author: { '@id': ORGANIZATION['@id'] },
    recipeCategory: 'Cóctel',
    recipeYield: '1 trago',
    recipeIngredient: recipe.ingredients.map((i) => `${i.qty} ${i.item}`),
    recipeInstructions: recipe.method.split('·').map((step) => ({
      '@type': 'HowToStep',
      text: step.trim(),
    })),
  };
}

export default function RecetasPage() {
  return (
    <main className="pt-32 pb-32 bg-background" id="recetas">
      {recetas.items.map((r) => (
        <JsonLd key={r.name} data={recipeJsonLd(r)} />
      ))}

      <div className="container mx-auto px-8 md:px-12">
        <div className="text-center mb-20">
          <SectionHeader
            label={recetas.label}
            headline={recetas.headline}
            sublabel={recetas.sublabel}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {recetas.items.map((r, i) => (
            <article
              key={r.name}
              className={`bg-surface-container-low rounded-2xl p-8 reveal reveal--delay-${i + 1}`}
            >
              <h2 className="font-headline text-2xl tracking-tighter text-on-surface">{r.name}</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mt-4">{r.desc}</p>

              <h3 className="text-xs uppercase tracking-[0.3em] text-secondary font-bold mt-8 mb-4">
                Ingredientes
              </h3>
              <ul className="flex flex-col gap-2 text-sm text-on-surface">
                {r.ingredients.map((ing) => (
                  <li key={ing.item} className="flex justify-between gap-4 border-b border-outline-variant/10 pb-2">
                    <span>{ing.item}</span>
                    <span className="text-on-surface-variant whitespace-nowrap">{ing.qty}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-xs uppercase tracking-[0.3em] text-secondary font-bold mt-8 mb-4">
                Preparación
              </h3>
              <ol className="flex flex-col gap-3 text-sm text-on-surface-variant list-decimal pl-4">
                {r.method.split('·').map((step) => (
                  <li key={step.trim()}>{step.trim()}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
