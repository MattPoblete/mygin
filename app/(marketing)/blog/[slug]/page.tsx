import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug, listPublishedPosts } from '@/lib/blog';
import type { BlogCategory, BlogPost } from '@/lib/types.blog';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_URL, ORGANIZATION, absoluteUrl } from '@/lib/seo';

// Next exige que `revalidate` sea un literal estáticamente analizable (no un import).
export const revalidate = 300;

const CATEGORY_LABEL: Record<BlogCategory, string> = {
  articulo: 'Artículo',
  receta: 'Receta',
  noticia: 'Noticia',
};

// Con DB vacía devuelve [] — el build no falla y las rutas se generan on-demand.
export async function generateStaticParams() {
  const posts = await listPublishedPosts().catch(() => []);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return { title: 'Artículo no encontrado — MyGin' };

  const title = post.seo.title || post.title;
  const description = post.seo.description || post.excerpt;
  const ogImage = post.seo.ogImage || post.coverImage;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

/** Schema.org BlogPosting para rich results y citabilidad en LLMs. */
function blogPostingJsonLd(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo.description || post.excerpt,
    image: post.coverImage ? absoluteUrl(post.coverImage) : undefined,
    datePublished: post.publishedAt?.toDate?.().toISOString(),
    dateModified: post.updatedAt?.toDate?.().toISOString(),
    author: post.authorName
      ? { '@type': 'Person', name: post.authorName }
      : undefined,
    publisher: { '@id': ORGANIZATION['@id'] },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) notFound();

  return (
    <main className="bg-background text-on-surface min-h-screen px-6 pt-32 pb-24">
      <JsonLd data={blogPostingJsonLd(post)} />
      <article className="max-w-2xl mx-auto">
        <Link
          href="/blog"
          className="text-secondary text-xs uppercase tracking-widest hover:text-primary transition-colors"
        >
          ← Volver al blog
        </Link>

        <header className="mt-8 mb-10">
          <span className="text-secondary font-label uppercase tracking-[0.3em] text-xs">
            {CATEGORY_LABEL[post.category]}
          </span>
          <h1 className="font-headline text-4xl md:text-5xl tracking-tighter mt-3">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant text-sm mt-4">
            {post.authorName && <span>Por {post.authorName}</span>}
            {post.authorName && post.publishedAt && <span aria-hidden="true">·</span>}
            {post.publishedAt && (
              <time dateTime={post.publishedAt.toDate().toISOString()}>
                {new Intl.DateTimeFormat('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(post.publishedAt.toDate())}
              </time>
            )}
          </div>
        </header>

        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-10 bg-surface-container-high">
            {/* alt="" — portada decorativa que duplica el <h1> adyacente. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImage} alt="" className="w-full object-cover" />
          </div>
        )}

        {/* react-markdown con defaults seguros: NO usa dangerouslySetInnerHTML ni
            permite HTML embebido (sin rehype-raw). */}
        <div className="prose-blog font-body text-on-surface leading-relaxed space-y-5 [&_h2]:font-headline [&_h2]:text-3xl [&_h2]:tracking-tighter [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:font-headline [&_h3]:text-2xl [&_h3]:tracking-tighter [&_h3]:mt-8 [&_h3]:mb-2 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:text-on-surface-variant [&_blockquote]:italic [&_strong]:text-on-surface [&_strong]:font-semibold [&_code]:bg-surface-container-high [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded">
          <ReactMarkdown>{post.bodyMarkdown}</ReactMarkdown>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-outline-variant/20">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </main>
  );
}
