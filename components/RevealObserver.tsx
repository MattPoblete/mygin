'use client';

import { useEffect } from 'react';

/**
 * RevealObserver — porta js/animations.js.
 *
 * Observa todos los elementos `.reveal` del documento y les añade `.is-visible`
 * al entrar en viewport. Montar una vez en el layout. Las secciones (server
 * components) siguen usando className="reveal reveal--delay-N".
 *
 * Idempotente bajo React Strict Mode (doble montaje en dev).
 */
export default function RevealObserver() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');
    if (!elements.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
