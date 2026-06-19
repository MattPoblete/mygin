'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import site from '@/content/site';
import { useCart } from '@/lib/cart/CartProvider';

/**
 * Navbar — calca ui_kits/website/Nav.jsx: sticky 64px, navy translúcido + blur,
 * wordmark MY/GIN, subrayado carmesí en link activo, icono carrito. Conserva
 * el scroll-spy (IntersectionObserver) y el menú mobile.
 *
 * El menú mobile usa <dialog>.showModal() para obtener gratis focus-trap, Escape,
 * inert del resto del documento, bloqueo de scroll (top-layer) y restauración de foco.
 */
export default function Navbar() {
  const [activeId, setActiveId] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { count } = useCart();

  // Fuera de la landing, las anclas (#top…) deben volver a "/#top"; en "/" se quedan
  // como ancla pura para el scroll nativo in-page + scroll-spy.
  const resolveHref = (href: string) =>
    href.startsWith('#') && pathname !== '/' ? `/${href}` : href;

  // Scroll-spy: activa la sección más cercana al top de la ventana y limpia cuando
  // ninguna está en la banda superior → el subrayado no queda "pegado".
  useEffect(() => {
    if (pathname !== '/') {
      setActiveId('');
      return;
    }
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    if (!sections.length) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        if (!visible.size) {
          setActiveId('');
          return;
        }
        // La sección cuyo top está más cerca de la banda superior gana.
        const nearest = [...visible.entries()].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]));
        setActiveId(nearest[0][0]);
      },
      // Banda de detección bajo el navbar sticky; ignora el resto del viewport.
      { rootMargin: '-72px 0px -65% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  // Abrir/cerrar el <dialog> de forma controlada por estado.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) dialog.showModal();
    else if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  const linkClass = (href: string) => {
    const isActive =
      href === `#${activeId}` || (href === site.nav.cta.href && pathname === site.nav.cta.href);
    return [
      'font-body text-sm tracking-wide transition-colors pb-1 border-b-2',
      isActive ? 'text-white border-[var(--crimson)]' : 'text-white/90 border-transparent hover:text-white',
    ].join(' ');
  };

  const closeMenu = () => setMobileOpen(false);

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
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-7" style={{ height: 'var(--nav-height)' }}>
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
            className="flex items-center p-3 -mr-3 text-white"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
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

      {/* Menú mobile — <dialog> nativo: focus-trap + Escape + inert del resto + scroll-lock. */}
      <dialog
        ref={dialogRef}
        id="mobile-menu"
        aria-label="Menú"
        onClose={closeMenu}
        onCancel={closeMenu}
        // Clic en el backdrop (fuera del <nav>) cierra el menú.
        onClick={(e) => {
          if (e.target === dialogRef.current) closeMenu();
        }}
        style={{
          margin: 0,
          padding: 0,
          maxWidth: '100vw',
          maxHeight: '100dvh',
          width: '100vw',
          height: '100dvh',
          border: 'none',
          background: 'var(--navy-deep)',
          // Inline display gana al UA display:none; controlamos visibilidad por estado.
          display: mobileOpen ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <nav aria-label="Menú móvil" className="flex flex-col items-center gap-8">
          <ul className="flex flex-col items-center gap-8 list-none p-0 m-0">
            {site.nav.links.map((link) => {
              const href = resolveHref(link.href);
              const className =
                'font-headline text-2xl text-white hover:opacity-80 uppercase tracking-wide transition-opacity';
              return (
                <li key={link.href}>
                  {href.startsWith('#') ? (
                    <a href={href} className={className} onClick={closeMenu}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={href} className={className} onClick={closeMenu}>
                      {link.label}
                    </Link>
                  )}
                </li>
              );
            })}
            <li>
              <Link href={site.nav.cta.href} className="btn-primary" style={{ marginTop: 8 }} onClick={closeMenu}>
                {site.nav.cta.label}
              </Link>
            </li>
          </ul>
        </nav>
      </dialog>
    </>
  );
}
