'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import site from '@/content/site';

/**
 * Navbar — porta el markup del <nav> de index.html + renderNav() + nav.js
 * (scroll state, toggle mobile, active link según sección visible).
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Scroll state
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  // Active link según sección visible
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
      'transition-colors duration-300 font-headline tracking-tighter uppercase text-sm',
      isActive ? 'text-primary border-b border-primary' : 'text-on-surface hover:text-secondary',
    ].join(' ');
  };

  return (
    <>
      <nav
        id="navbar"
        role="navigation"
        aria-label="Navegación principal"
        className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 md:px-12 py-5 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'nav--scrolled' : ''
        }`}
      >
        <Link href="/" aria-label="MyGin — Inicio" className="text-2xl font-headline font-bold text-on-surface">
          {site.brand.name}
        </Link>

        {/* Links desktop */}
        <div className="hidden md:flex gap-10">
          {site.nav.links.map((link) => (
            <a key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/contacto"
            className="border border-outline-variant/40 text-secondary px-5 py-2 font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high transition-all rounded"
          >
            Contacto
          </Link>
          <Link
            href={site.nav.cta.href}
            className="bg-primary text-on-primary px-6 py-2 font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity rounded"
          >
            {site.nav.cta.label}
          </Link>
        </div>

        {/* Toggle mobile */}
        <button
          type="button"
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="block w-6 h-px bg-on-surface transition-all" />
          <span className="block w-6 h-px bg-on-surface transition-all" />
          <span className="block w-6 h-px bg-on-surface transition-all" />
        </button>
      </nav>

      {/* Menú mobile */}
      <div
        id="mobile-menu"
        role="menu"
        onClick={(e) => {
          if ((e.target as HTMLElement).tagName === 'A') setMobileOpen(false);
        }}
        className={`fixed top-0 left-0 w-full h-screen bg-surface-container-lowest z-40 flex flex-col justify-center items-center gap-8 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {site.nav.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            role="menuitem"
            className="font-headline text-2xl text-on-surface hover:text-secondary tracking-tighter uppercase transition-colors"
          >
            {link.label}
          </a>
        ))}
        <Link
          href="/contacto"
          className="border border-outline-variant/40 text-secondary px-8 py-3 font-bold uppercase text-xs tracking-widest rounded"
        >
          Contacto
        </Link>
        <Link
          href={site.nav.cta.href}
          className="bg-primary text-on-primary px-8 py-3 font-bold uppercase text-xs tracking-widest rounded"
        >
          {site.nav.cta.label}
        </Link>
      </div>
    </>
  );
}
