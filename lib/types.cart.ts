/**
 * lib/types.cart.ts — Modelo del carrito (cliente, localStorage).
 *
 * El carrito vive solo en el navegador (localStorage, key `mygin_cart`). El
 * `unitPrice` es un snapshot para mostrar; el total REAL se recalcula del lado
 * del servidor en el checkout (worktree B) leyendo el precio vigente del producto.
 * Nunca confíes en estos montos para cobrar.
 */
export interface CartItem {
  /** docId del producto en Firestore. */
  productId: string;
  slug: string;
  name: string;
  /** Primera imagen del producto (puede ser '' si no hay). */
  image: string;
  /** Precio unitario en CLP al momento de agregar (solo display). */
  unitPrice: number;
  qty: number;
}
