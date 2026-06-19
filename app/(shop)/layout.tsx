/**
 * app/(shop)/layout.tsx — La sección de tienda no necesita provider propio: el
 * CartProvider vive en el layout raíz para que el Navbar global comparta el mismo
 * estado de carrito que las páginas de tienda.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
