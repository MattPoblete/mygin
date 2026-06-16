'use client';

/**
 * ContactForm — formulario público de contacto comercial / general.
 *
 * Escribe directo en la colección `contactSubmissions` con el client SDK. La
 * regla de Firestore permite `create` público SOLO si: `email` es string,
 * `message` no está vacío y `status=='new'` — por eso esos campos van siempre.
 *
 * El envío de correo de aviso al equipo está DIFERIDO: lo hará una Cloud Function
 * que dispara onCreate de `contactSubmissions` (no se implementa en este worktree).
 */

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { ContactType } from '@/lib/types.contact';

type Status = 'idle' | 'sending' | 'success' | 'error';

const TYPES: { value: ContactType; label: string }[] = [
  { value: 'comercial', label: 'Comercial (distribución / pedidos al por mayor)' },
  { value: 'general', label: 'General' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const str = (k: string) => String(fd.get(k) ?? '').trim();

    const name = str('name');
    const email = str('email');
    const message = str('message');
    const phone = str('phone');
    const company = str('company');
    const type = (str('type') || 'comercial') as ContactType;

    if (!name) {
      setError('Ingresa tu nombre.');
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError('Ingresa un correo válido.');
      return;
    }
    if (!message) {
      setError('Cuéntanos en qué te podemos ayudar.');
      return;
    }

    setStatus('sending');
    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        name,
        email,
        // Campos opcionales: solo se incluyen si tienen contenido.
        ...(phone ? { phone } : {}),
        ...(company ? { company } : {}),
        message,
        type,
        status: 'new',
        createdAt: serverTimestamp(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      });
      form.reset();
      setStatus('success');
    } catch {
      setStatus('error');
      setError('No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-surface-container-low rounded-2xl p-10 text-center">
        <p className="font-headline text-2xl tracking-tighter text-on-surface mb-3">
          ¡Mensaje enviado!
        </p>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          Gracias por escribirnos. El equipo de MyGin te responderá a la brevedad.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="btn-outline mt-8"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  const busy = status === 'sending';

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Nombre">
          <input name="name" required autoComplete="name" className={inputCls} />
        </Field>
        <Field label="Correo">
          <input name="email" type="email" required autoComplete="email" className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Teléfono" hint="opcional">
          <input name="phone" type="tel" autoComplete="tel" className={inputCls} />
        </Field>
        <Field label="Empresa" hint="opcional">
          <input name="company" autoComplete="organization" className={inputCls} />
        </Field>
      </div>

      <Field label="Tipo de consulta">
        <select name="type" defaultValue="comercial" className={inputCls}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Mensaje">
        <textarea name="message" rows={5} required className={inputCls} />
      </Field>

      {error && (
        <p className="text-error text-sm" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
        {busy ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  );
}

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-2.5 text-on-surface focus:border-primary outline-none';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
        {hint && <span className="normal-case tracking-normal text-on-surface-variant/60"> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}
