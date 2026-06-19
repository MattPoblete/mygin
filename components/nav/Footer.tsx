import Link from 'next/link';
import site from '@/content/site';

/**
 * Footer — calca el Footer de ui_kits/website/Contact.jsx: fondo navy-deep,
 * wordmark MY/GIN, tagline Cormorant, columnas Explorar/Legal con links carmesí.
 * Conserva el aviso MINSAL existente.
 */
export default function Footer() {
  const { brand, footer } = site;

  const linkStyle = { fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--crimson)', textDecoration: 'none' as const };
  const Col = ({ title, items }: { title: string; items: ReadonlyArray<{ label: string; href: string }> }) => (
    <div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--warm-gray)', marginBottom: 14 }}>
        {title}
      </div>
      <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
        {items.map(({ label, href }) => (
          <li key={label}>
            {href.startsWith('/') ? (
              <Link href={href} style={linkStyle}>{label}</Link>
            ) : (
              <a href={href} style={linkStyle}>{label}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer role="contentinfo" style={{ background: 'var(--navy-deep)', color: 'var(--white)' }}>
      <div className="px-8 md:px-12 pt-16 pb-8 mx-auto" style={{ maxWidth: 'var(--container)' }}>
        <div className="flex flex-wrap justify-between items-start gap-8 pb-10">
          <div style={{ maxWidth: 300 }}>
            <div className="font-headline" style={{ fontWeight: 800, fontSize: 26, letterSpacing: 1.5 }}>
              <span className="text-white">MY</span>
              <span style={{ color: 'var(--crimson)' }}>GIN</span>
            </div>
            <p className="mg-tagline" style={{ fontSize: 17, color: 'var(--warm-gray)', margin: '12px 0 0' }}>{brand.tagline}</p>
            <a href={brand.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, display: 'inline-block', marginTop: 14 }}>
              @{brand.instagram}
            </a>
          </div>
          <div className="flex flex-wrap gap-14">
            {footer.columns.map((col) => (
              <Col key={col.title} title={col.title} items={col.links} />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dark-gray)' }}>{footer.copy}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--dark-gray)' }}>43°GL · Disfruta con moderación · +18</span>
        </div>

        {/* Aviso MINSAL (obligatorio) */}
        <p data-footer="minsal" className="text-center mt-6" style={{ color: 'var(--dark-gray)', lineHeight: 1.6 }}>
          {footer.minsal}
        </p>
      </div>
    </footer>
  );
}
