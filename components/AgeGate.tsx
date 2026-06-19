'use client';

import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';

/**
 * AgeGate — verificación legal +18 (modal de entrada). Portado de ui_kits/website/AgeGate.jsx.
 * Persiste en sessionStorage; no se re-pregunta tras "Sí" en la misma sesión.
 *
 * Usa el <dialog> nativo con showModal(): obtiene gratis focus-trap, bloqueo de
 * scroll del resto (top-layer + inert) y semántica de diálogo modal. Se desactiva
 * el Escape (onCancel) para que la barrera legal no se pueda cerrar sin responder.
 */
export default function AgeGate() {
  const [ready, setReady] = useState(false);
  const [passed, setPassed] = useState(true); // asume ok hasta montar → evita flash en SSR
  const [denied, setDenied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setPassed(sessionStorage.getItem('mygin_age_ok') === '1');
    setReady(true);
  }, []);

  // Abrir como modal cuando corresponde mostrarlo.
  const shouldShow = ready && !passed;
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (shouldShow && !dialog.open) dialog.showModal();
    else if (!shouldShow && dialog.open) dialog.close();
  }, [shouldShow]);

  if (!ready || passed) return null;

  const enter = () => {
    sessionStorage.setItem('mygin_age_ok', '1');
    setPassed(true);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="age-gate-title"
      // El usuario debe responder; Escape no cierra la barrera legal.
      onCancel={(e) => e.preventDefault()}
      style={{
        margin: 'auto',
        maxWidth: 460,
        width: 'calc(100% - 48px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--navy-dark)',
        boxShadow: 'var(--shadow-xl)',
        padding: '48px 40px',
        textAlign: 'center',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/images/assets/ETIQUETA_FRONT.webp"
        alt="MyGin"
        style={{ height: 120, marginBottom: 20, objectFit: 'contain' }}
      />

      {denied ? (
        <>
          <h2
            id="age-gate-title"
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: 1,
              color: 'var(--white)',
              margin: '0 0 12px',
              textTransform: 'uppercase',
            }}
          >
            Lo sentimos
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--warm-gray)',
              margin: '0 0 28px',
            }}
          >
            Debes ser mayor de 18 años para entrar a MyGin. Bebe con moderación.
          </p>
          <Button variant="tertiary" size="lg" onClick={() => setDenied(false)}>
            Volver
          </Button>
        </>
      ) : (
        <>
          <div className="mg-crest-eyebrow" style={{ justifyContent: 'center', marginBottom: 18, fontSize: '0.9rem' }}>
            Villarrica · IX Región
          </div>
          <h2
            id="age-gate-title"
            style={{
              fontFamily: 'var(--font-headline)',
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: 1,
              color: 'var(--white)',
              margin: '0 0 12px',
              textTransform: 'uppercase',
            }}
          >
            ¿Eres mayor de edad?
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 300,
              fontSize: 15,
              lineHeight: 1.6,
              color: 'var(--warm-gray)',
              margin: '0 0 28px',
            }}
          >
            Debes tener 18 años o más para entrar. Bebe con moderación.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="primary" size="lg" onClick={enter}>
              Sí, soy mayor
            </Button>
            <Button variant="tertiary" size="lg" onClick={() => setDenied(true)}>
              No
            </Button>
          </div>
        </>
      )}

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          color: 'var(--dark-gray)',
          margin: '24px 0 0',
          letterSpacing: 0.3,
        }}
      >
        MyGin Co. · Disfruta responsablemente
      </p>
    </dialog>
  );
}
