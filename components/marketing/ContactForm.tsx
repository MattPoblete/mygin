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
type FieldName = 'name' | 'email' | 'message';
type FieldErrors = Partial<Record<FieldName, string>>;

const TYPES: { value: ContactType; label: string }[] = [
  { value: 'comercial', label: 'Comercial (distribución / pedidos al por mayor)' },
  { value: 'general', label: 'General' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name: FieldName, value: string): string {
  const v = value.trim();
  if (name === 'name') return v ? '' : 'Ingresa tu nombre.';
  if (name === 'email') {
    if (!v) return 'Ingresa tu correo.';
    return EMAIL_RE.test(v) ? '' : 'Ingresa un correo válido.';
  }
  if (name === 'message') return v ? '' : 'Cuéntanos en qué te podemos ayudar.';
  return '';
}

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name as FieldName;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, e.target.value) }));
  };

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

    const fieldErrors: FieldErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      message: validateField('message', message),
    };
    const firstInvalid = (Object.keys(fieldErrors) as FieldName[]).find((k) => fieldErrors[k]);
    if (firstInvalid) {
      setErrors(fieldErrors);
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
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
      setErrors({});
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
    <form onSubmit={onSubmit} className="space-y-6" aria-busy={busy} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Nombre" required error={errors.name} fieldId="cf-name">
          <input
            id="cf-name"
            name="name"
            required
            autoComplete="name"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'cf-name-error' : undefined}
            onBlur={onBlur}
            className={inputCls(!!errors.name)}
          />
        </Field>
        <Field label="Correo" required error={errors.email} fieldId="cf-email">
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'cf-email-error' : undefined}
            onBlur={onBlur}
            className={inputCls(!!errors.email)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Teléfono" hint="opcional" fieldId="cf-phone">
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" className={inputCls(false)} />
        </Field>
        <Field label="Empresa" hint="opcional" fieldId="cf-company">
          <input id="cf-company" name="company" autoComplete="organization" className={inputCls(false)} />
        </Field>
      </div>

      <Field label="Tipo de consulta" fieldId="cf-type">
        <select id="cf-type" name="type" defaultValue="comercial" className={inputCls(false)}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Mensaje" required error={errors.message} fieldId="cf-message">
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          required
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'cf-message-error' : undefined}
          onBlur={onBlur}
          className={inputCls(!!errors.message)}
        />
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

const inputCls = (invalid: boolean) =>
  [
    'w-full bg-surface-container-low border rounded-lg px-4 py-2.5 text-on-surface focus:border-primary',
    invalid ? 'border-error' : 'border-outline-variant/30',
  ].join(' ');

function Field({
  label,
  hint,
  required,
  error,
  fieldId,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  fieldId: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
        {required && <span className="text-error" aria-hidden="true"> *</span>}
        {hint && <span className="normal-case tracking-normal text-on-surface-variant/60"> · {hint}</span>}
      </span>
      {children}
      {error && (
        <span id={`${fieldId}-error`} role="alert" className="block text-error text-xs mt-1.5 normal-case tracking-normal">
          {error}
        </span>
      )}
    </label>
  );
}
