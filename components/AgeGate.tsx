'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

/**
 * AgeGate — verificación legal +18 (modal de entrada). Portado de ui_kits/website/AgeGate.jsx.
 * Persiste en sessionStorage; no se re-pregunta tras "Sí" en la misma sesión.
 */
export default function AgeGate() {
  const [ready, setReady] = useState(false);
  const [passed, setPassed] = useState(true); // asume ok hasta montar → evita flash en SSR

  useEffect(() => {
    setPassed(sessionStorage.getItem('mygin_age_ok') === '1');
    setReady(true);
  }, []);

  if (!ready || passed) return null;

  const enter = () => {
    sessionStorage.setItem('mygin_age_ok', '1');
    setPassed(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--surface-overlay)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
          background: 'var(--navy-dark)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'var(--shadow-xl)',
          padding: '48px 40px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/images/assets/ETIQUETA_FRONT.webp"
          alt="MyGin"
          style={{ height: 120, marginBottom: 20, objectFit: 'contain' }}
        />
        <div className="mg-crest-eyebrow" style={{ justifyContent: 'center', marginBottom: 18, fontSize: '0.9rem' }}>
          Villarrica · IX Región
        </div>
        <h2
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
          <Button
            variant="tertiary"
            size="lg"
            onClick={() => {
              window.location.href = 'https://www.google.com';
            }}
          >
            No
          </Button>
        </div>
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
      </div>
    </div>
  );
}
