'use client';

import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { useAuth } from '@/lib/firebase/auth-context';

// Firebase moderno colapsa user-not-found/wrong-password en invalid-credential.
const ERRORS: Record<string, string> = {
  'auth/invalid-email': 'Email inválido.',
  'auth/invalid-credential': 'Credenciales incorrectas.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
  'auth/unauthorized-domain': 'Dominio no autorizado para Google Sign-in.',
  'auth/account-exists-with-different-credential': 'Ya existe una cuenta con ese email y otro método.',
};

// Errores de cancelación del popup que NO deben mostrarse como fallo.
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

export default function LoginScreen({ notAdmin = false }: { notAdmin?: boolean }) {
  const { signIn, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      setError(ERRORS[code] ?? 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code = err instanceof FirebaseError ? err.code : '';
      if (!SILENT.has(code)) setError(ERRORS[code] ?? 'No se pudo iniciar sesión con Google.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-headline text-3xl text-on-surface mb-2 tracking-tighter">MyGin Admin</h1>
        <p className="text-on-surface-variant text-sm mb-8">Panel de administración</p>

        {notAdmin ? (
          <div className="space-y-6">
            <p className="text-sm text-error">
              Tu cuenta no tiene permisos de administrador. Contacta a un super-admin para que
              te asigne el rol.
            </p>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full border border-outline-variant/40 text-secondary py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-surface-container-high transition-all"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onGoogle}
              disabled={busy}
              className="w-full flex items-center justify-center gap-3 bg-secondary text-on-secondary py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <GoogleIcon />
              Continuar con Google
            </button>

            <div className="flex items-center gap-4 my-6">
              <span className="h-px flex-1 bg-outline-variant/30" />
              <span className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant">o con email</span>
              <span className="h-px flex-1 bg-outline-variant/30" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface focus:border-primary outline-none"
              />
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold uppercase text-xs tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? 'Ingresando…' : 'Ingresar'}
            </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
