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
        <CartProvider>
          <AgeGate />
          <Navbar />
          {children}
          <Footer />
          <RevealObserver />
        </CartProvider>
      </body>
    </html>
  );
}
