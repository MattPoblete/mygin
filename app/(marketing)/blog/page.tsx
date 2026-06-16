import type { Metadata } from 'next';
import Link from 'next/link';
import { listPublishedPosts } from '@/lib/blog';
import type { BlogCategory } from '@/lib/types.blog';

// Revalidación incremental: el contenido del blog cambia poco; 5 min es suficiente.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Blog — MyGin',
  description: 'Artículos, recetas y noticias del mundo MyGin: gin contemporáneo chileno.',
};

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  articulo: 'Artículo',
  receta: 'Receta',
  noticia: 'Noticia',
};

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts().catch(() => []);

  return (
    <main className="bg-background text-on-surface min-h-screen px-6 pt-32 pb-24">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 text-center">
          <span className="text-secondary font-label uppercase tracking-[0.4em] text-xs mb-4 block">
            Diario
          </span>
          <h1 className="font-headline text-5xl md:text-6xl tracking-tighter">Blog</h1>
          <p className="text-on-surface-variant text-sm mt-4 max-w-lg mx-auto">
            Historias, recetas y noticias destiladas a las orillas del Río Pedregoso.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-on-surface-variant text-center text-sm">
            Aún no hay artículos publicados. Vuelve pronto.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 hover:border-primary/40 transition-colors"
              >
                <div className="aspect-[4/3] bg-surface-container-high overflow-hidden">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : null}
                </div>
                <div className="p-6">
                  <span className="text-secondary font-label uppercase tracking-[0.3em] text-[0.65rem]">
                    {CATEGORY_LABEL[post.category]}
                  </span>
                  <h2 className="font-headline text-2xl tracking-tighter mt-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-3 line-clamp-3">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
