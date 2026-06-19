'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import site from '@/content/site';
import { useCart } from '@/lib/cart/CartProvider';

/**
 * Navbar — calca ui_kits/website/Nav.jsx: sticky 64px, navy translúcido + blur,
 * wordmark MY/GIN, subrayado carmesí en link activo, icono carrito. Conserva
 * el scroll-spy (IntersectionObserver) y el menú mobile.
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const pathname = usePathname();
  const { count } = useCart();

  // Fuera de la landing, las anclas (#top…) deben volver a "/#top"; en "/" se quedan
  // como ancla pura para el scroll nativo in-page + scroll-spy.
  const resolveHref = (href: string) =>
    href.startsWith('#') && pathname !== '/' ? `/${href}` : href;

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('section[id]');
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { threshold: 0.4 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const linkClass = (href: string) => {
    const isActive = href === `#${activeId}`;
    return [
      'font-body text-sm tracking-wide transition-colors pb-1 border-b-2',
      isActive ? 'text-white border-[var(--crimson)]' : 'text-white/90 border-transparent hover:text-white',
    ].join(' ');
  };

  const CartIcon = (
    <Link
      href="/carrito"
      aria-label={count > 0 ? `Carrito, ${count} ${count === 1 ? 'producto' : 'productos'}` : 'Carrito'}
      className="relative flex items-center text-white"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute flex items-center justify-center font-body font-semibold text-white"
          style={{
            top: -6,
            right: -8,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            fontSize: 11,
            lineHeight: 1,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--crimson)',
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );

  return (
    <>
      <header
        role="navigation"
        aria-label="Navegación principal"
        className="fixed top-0 w-full z-50 flex items-center justify-between px-8 md:px-12"
        style={{
          minHeight: 'var(--nav-height)',
          background: 'rgba(8,24,38,0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Link href="/" aria-label="MyGin — Inicio" className="font-headline" style={{ fontWeight: 800, fontSize: 26, letterSpacing: 1.5 }}>
          <span className="text-white">MY</span>
          <span style={{ color: 'var(--crimson)' }}>GIN</span>
        </Link>

        {/* Links desktop */}
        <nav className="hidden md:flex items-center gap-7" style={{ height: 'var(--nav-height)' }}>
          {site.nav.links.map((link) => {
            const href = resolveHref(link.href);
            return href.startsWith('#') ? (
              <a key={link.href} href={href} className={linkClass(link.href)}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            );
          })}
          <Link href={site.nav.cta.href} className={linkClass(site.nav.cta.href)}>
            {site.nav.cta.label}
          </Link>
          {CartIcon}
        </nav>

        {/* Mobile: carrito + toggle */}
        <div className="md:hidden flex items-center gap-5" style={{ height: 'var(--nav-height)' }}>
          {CartIcon}
          <button
            type="button"
            className="flex items-center p-1 text-white"
            aria-label="Menú"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <>
                  <path d="M3 12h18" />
                  <path d="M3 6h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Menú mobile */}
      <div
        id="mobile-menu"
        role="menu"
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName === 'A') setMobileOpen(false);
        }}
        className={`fixed top-0 left-0 w-full h-screen z-40 flex flex-col justify-center items-center gap-8 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ background: 'var(--navy-deep)' }}
      >
        {site.nav.links.map((link) => {
          const href = resolveHref(link.href);
          const className =
            'font-headline text-2xl text-white hover:opacity-80 uppercase tracking-wide transition-opacity';
          return href.startsWith('#') ? (
            <a key={link.href} href={href} role="menuitem" className={className}>
              {link.label}
            </a>
          ) : (
            <Link key={link.href} href={href} role="menuitem" className={className} onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          );
        })}
        <Link href={site.nav.cta.href} className="btn-primary" style={{ marginTop: 8 }}>
          {site.nav.cta.label}
        </Link>
      </div>
    </>
  );
}
