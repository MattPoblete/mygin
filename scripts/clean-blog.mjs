/**
 * scripts/clean-blog.mjs — Prepara los 3 markdown de docs/blogs/ para subir a Firestore.
 *
 * No escribe en Firestore (no hay credenciales admin locales): la subida la hace
 * el MCP de Firebase con la sesión del CLI. Este script solo NORMALIZA y deja el
 * payload listo (JSON ya escapado) en /tmp/blog-clean/posts.json para evitar
 * transcribir el cuerpo a mano.
 *
 * Transforma cada .md: quita el frontmatter y el `# H1` (la página ya renderiza
 * post.title como <h1>), y remapea los enlaces a rutas inexistentes a rutas reales.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const FILES = [
  { file: 'docs/blogs/Información-sobre-mygin.markdown',   cover: '/assets/images/assets/botella_naturaleza.webp', category: 'noticia' },
  { file: 'docs/blogs/Información-sobre-mygin-2.markdown', cover: '/assets/images/assets/promo_copa.webp',        category: 'noticia' },
  { file: 'docs/blogs/Información-sobre-mygin-3.markdown', cover: '/assets/images/comunidad.webp',                category: 'articulo' },
];

// Rutas que los borradores inventaron → rutas que sí existen en el sitio.
const LINK_REMAP = {
  '/donde-comprar': '/#distribuidores',
  '/newsletter': '/contacto',
  '/para-tu-bar': '/contacto',
};

/** Frontmatter YAML mínimo: solo los campos escalares y arrays simples que usamos. */
function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('sin frontmatter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      meta[kv[1]] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    } else {
      meta[kv[1]] = v.replace(/^"|"$/g, '');
    }
  }
  return { meta, body: m[2] };
}

const posts = FILES.map(({ file, cover, category }) => {
  const { meta, body } = parseFrontmatter(readFileSync(file, 'utf8'));
  let clean = body.replace(/^\s*#\s+.*\n+/, ''); // quita el H1 duplicado
  for (const [from, to] of Object.entries(LINK_REMAP)) {
    clean = clean.split(`(${from})`).join(`(${to})`);
  }
  clean = clean.trim();
  return {
    slug: meta.slug,
    title: meta.title,
    excerpt: meta.description,
    coverImage: cover,
    bodyMarkdown: clean,
    category,
    tags: meta.keywords || [],
    seoTitle: meta.title,
    seoDescription: meta.description,
  };
});

mkdirSync('/tmp/blog-clean', { recursive: true });
writeFileSync('/tmp/blog-clean/posts.json', JSON.stringify(posts, null, 2));
for (const p of posts) {
  console.log(`· ${p.slug} — ${p.category} — body ${p.bodyMarkdown.length} chars, ${p.tags.length} tags`);
}
console.log('✓ /tmp/blog-clean/posts.json');
