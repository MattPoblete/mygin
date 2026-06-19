'use client';

import { useEffect, useState } from 'react';

/**
 * SavedFlash — banner de confirmación tras guardar en un form admin.
 *
 * Los forms hacen router.push('…?saved=1') al guardar con éxito. Este banner
 * lee el flag desde la URL en el cliente, lo muestra y limpia el query param
 * (history.replaceState) para que no reaparezca al recargar/volver. Nativo,
 * sin librerías de toast ni Suspense de useSearchParams.
 */
export default function SavedFlash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('saved') !== '1') return;
    setShow(true);
    params.delete('saved');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-center gap-3 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-on-surface"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-secondary shrink-0">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="flex-1">Guardado.</span>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Cerrar aviso"
        className="text-on-surface-variant hover:text-on-surface text-xs uppercase tracking-widest"
      >
        Cerrar
      </button>
    </div>
  );
}
