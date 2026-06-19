'use client';

/**
 * ReviewForm — formulario público de reseña de producto.
 *
 * Escribe directo en la colección `comments` con el client SDK, igual que ContactForm.
 * La regla de Firestore permite `create` público SOLO si: `status=='pending'`,
 * `counted==false`, `rating` 1..5, `body` no vacío y ≤2000, y `productId` string — por
 * eso esos campos van siempre. La reseña queda en moderación hasta que el admin la aprueba.
 */

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type Status = 'idle' | 'sending' | 'success' | 'error';
type FieldName = 'name' | 'email' | 'body';
type FieldErrors = Partial<Record<FieldName, string>> & { rating?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY = 2000;

function validateField(name: FieldName, value: string): string {
  const v = value.trim();
  if (name === 'name') return v ? '' : 'Ingresa tu nombre.';
  if (name === 'email') {
    if (!v) return 'Ingresa tu correo.';
    return EMAIL_RE.test(v) ? '' : 'Ingresa un correo válido.';
  }
  if (name === 'body') {
    if (!v) return 'Escribe tu reseña.';
    return v.length <= MAX_BODY ? '' : `Máximo ${MAX_BODY} caracteres.`;
  }
  return '';
}

export default function ReviewForm({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [rating, setRating] = useState(0);
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
    const body = str('body');

    const fieldErrors: FieldErrors = {
      rating: rating >= 1 && rating <= 5 ? '' : 'Elige una calificación.',
      name: validateField('name', name),
      email: validateField('email', email),
      body: validateField('body', body),
    };
    const firstInvalid = (['rating', 'name', 'email', 'body'] as const).find((k) => fieldErrors[k]);
    if (firstInvalid) {
      setErrors(fieldErrors);
      if (firstInvalid !== 'rating') {
        form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      }
      return;
    }

    setStatus('sending');
    try {
      await addDoc(collection(db, 'comments'), {
        productId,
        productSlug,
        rating,
        authorName: name,
        authorEmail: email,
        body,
        status: 'pending',
        counted: false,
        createdAt: serverTimestamp(),
      });
      form.reset();
      setRating(0);
      setErrors({});
      setStatus('success');
    } catch {
      setStatus('error');
      setError('No pudimos enviar tu reseña. Inténtalo de nuevo en unos minutos.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-surface-container-low rounded-2xl p-8 text-center">
        <p className="font-headline text-xl tracking-tighter text-on-surface mb-3">
          ¡Gracias por tu reseña!
        </p>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          La revisaremos antes de publicarla. Aparecerá aquí una vez aprobada.
        </p>
        <button type="button" onClick={() => setStatus('idle')} className="btn-outline mt-6">
          Escribir otra reseña
        </button>
      </div>
    );
  }

  const busy = status === 'sending';

  return (
    <form onSubmit={onSubmit} className="space-y-6" aria-busy={busy} noValidate>
      {/* Calificación */}
      <fieldset>
        <legend className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
          Calificación
          <span className="text-error" aria-hidden="true"> *</span>
        </legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => {
                  setRating(n);
                  setErrors((prev) => ({ ...prev, rating: '' }));
                }}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`text-3xl leading-none ${n <= rating ? 'text-primary' : 'text-outline-variant/40'}`}
              >
                ★
              </span>
              <span className="sr-only">{n} estrellas</span>
            </label>
          ))}
        </div>
        {errors.rating && (
          <span role="alert" className="block text-error text-xs mt-1.5">
            {errors.rating}
          </span>
        )}
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Nombre" required error={errors.name} fieldId="rf-name">
          <input
            id="rf-name"
            name="name"
            required
            autoComplete="name"
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'rf-name-error' : undefined}
            onBlur={onBlur}
            className={inputCls(!!errors.name)}
          />
        </Field>
        <Field label="Correo" hint="no se publica" required error={errors.email} fieldId="rf-email">
          <input
            id="rf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'rf-email-error' : undefined}
            onBlur={onBlur}
            className={inputCls(!!errors.email)}
          />
        </Field>
      </div>

      <Field label="Tu reseña" required error={errors.body} fieldId="rf-body">
        <textarea
          id="rf-body"
          name="body"
          rows={4}
          required
          maxLength={MAX_BODY}
          aria-required="true"
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? 'rf-body-error' : undefined}
          onBlur={onBlur}
          className={inputCls(!!errors.body)}
        />
      </Field>

      {error && (
        <p className="text-error text-sm" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
        {busy ? 'Enviando…' : 'Enviar reseña'}
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
