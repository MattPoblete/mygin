import Link from 'next/link';
import site from '@/content/site';

export default function Footer() {
  const f = site.footer;
  const { brand } = site;

  return (
    <footer className="w-full bg-surface-container-lowest" role="contentinfo">
      {/* MINSAL Warning */}
      <div className="border-t border-outline-variant/20 px-8 md:px-12 py-6">
        <p
          data-footer="minsal"
          className="text-on-surface-variant text-[0.6rem] tracking-[0.15em] uppercase text-center leading-relaxed"
        >
          {f.minsal}
        </p>
      </div>

      {/* Footer principal */}
      <div className="flex flex-col md:flex-row justify-between items-center px-8 md:px-12 py-12 gap-8 border-t border-outline-variant/20">
        <div className="text-lg font-headline text-on-surface">{brand.name}</div>

        <nav aria-label="Links de pie de página">
          <div className="flex flex-wrap justify-center gap-8">
            {f.links.map((link) => {
              const isExternal = link.href.startsWith('http');
              const cls =
                'text-on-surface/60 hover:text-secondary transition-colors font-body text-xs tracking-widest uppercase';
              return isExternal ? (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={cls}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
          <a
            href={brand.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-primary transition-colors text-xs tracking-widest uppercase"
          >
            @{brand.instagram}
          </a>
          <p className="text-on-surface-variant text-[0.6rem] tracking-[0.2em] uppercase">{f.copy}</p>
          <p className="text-on-surface-variant text-[0.6rem] tracking-[0.2em] uppercase">{f.note}</p>
        </div>
      </div>
    </footer>
  );
}
