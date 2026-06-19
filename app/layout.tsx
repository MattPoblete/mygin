import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/nav/Navbar';
import Footer from '@/components/nav/Footer';
import RevealObserver from '@/components/RevealObserver';
import AgeGate from '@/components/AgeGate';
import { CartProvider } from '@/lib/cart/CartProvider';

export const metadata: Metadata = {
  title: 'MyGin — El gin que se vive.',
  description:
    'MyGin — Gin contemporáneo chileno. 11 botánicos destilados a las orillas del Río Pedregoso, Villarrica, Araucanía.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&family=Cormorant+Garamond:wght@300;400;500&family=Montserrat:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background text-on-surface selection:bg-primary/30 selection:text-primary">
        {/* Skip link — primer elemento enfocable; oculto salvo al recibir foco (Tab). */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:uppercase focus:tracking-wider focus:text-on-primary"
        >
          Saltar al contenido
        </a>
        <CartProvider>
          <AgeGate />
          <Navbar />
          <div id="contenido">{children}</div>
          <Footer />
          <RevealObserver />
        </CartProvider>
      </body>
    </html>
  );
}
