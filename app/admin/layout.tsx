'use client';

import { AuthProvider } from '@/lib/firebase/auth-context';
import AdminGate from '@/components/admin/AdminGate';

/**
 * Layout del panel admin. Provee el contexto de Auth y exige rol admin para
 * cualquier ruta /admin/*. No necesita SEO (no se indexa).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminGate>{children}</AdminGate>
    </AuthProvider>
  );
}
