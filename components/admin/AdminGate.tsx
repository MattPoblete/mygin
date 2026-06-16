'use client';

import { useAuth } from '@/lib/firebase/auth-context';
import LoginScreen from './LoginScreen';
import AdminShell from './AdminShell';

/**
 * AdminGate — controla el acceso a todo /admin/*.
 *  - cargando        → spinner
 *  - sin sesión      → pantalla de login
 *  - sesión sin admin→ aviso "sin permisos"
 *  - admin           → shell + contenido
 *
 * La defensa real son las reglas de Firestore; esto es solo UX.
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-on-surface-variant text-sm uppercase tracking-widest animate-pulse">
          Cargando…
        </p>
      </div>
    );
  }

  if (!user) return <LoginScreen />;
  if (!isAdmin) return <LoginScreen notAdmin />;

  return <AdminShell>{children}</AdminShell>;
}
