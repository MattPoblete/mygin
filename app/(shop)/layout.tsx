import { CartProvider } from '@/lib/cart/CartProvider';

/**
 * app/(shop)/layout.tsx — Envuelve la tienda con el contexto del carrito.
 *
 * El layout raíz ya pone Navbar/Footer; aquí solo agregamos el provider para
 * que toda la sección de tienda comparta un único estado de carrito.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
