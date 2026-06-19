'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/nav/Footer';
import AgeGate from '@/components/AgeGate';

/**
 * Envuelve el contenido con el chrome público (navbar tienda/landing, footer,
 * age gate). En /admin/* no se renderiza: el panel usa su propio AdminShell y no
 * debe ofrecer enlaces que saquen al admin de su contexto.
 */
export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const isAdmin = usePathname().startsWith('/admin');
  return (
    <>
      {!isAdmin && <AgeGate />}
      {!isAdmin && <Navbar />}
      <div id="contenido">{children}</div>
      {!isAdmin && <Footer />}
    </>
  );
}
