import type { Page } from '@playwright/test';

/** Usuarios sembrados en el emulador (ver scripts/seed-emulator.mjs). */
export const ADMIN = { email: 'admin@test.local', password: 'Test1234!' };
export const USER = { email: 'user@test.local', password: 'Test1234!' };
export const ADMIN_STORAGE = 'e2e/.auth/admin.json';

/** Slugs/datos deterministas del seed. */
export const PRODUCTS = {
  inStock: { slug: 'mygin-botella-individual', name: 'MyGin — Botella Individual', price: 17990 },
  featured: { slug: 'mygin-pack-amigos', name: 'MyGin — Pack Amigos', price: 32990 },
  lowStock: { slug: 'mygin-edicion-limitada', name: 'MyGin — Edición Limitada', price: 24990 },
  soldOut: { slug: 'mygin-agotado', name: 'MyGin — Agotado', price: 19990 },
};
export const SHIPPING_CLP = 3990;
export const COUPON_OK = 'BIENVENIDA10';
export const COUPON_EXPIRED = 'VENCIDO';

/**
 * Salta el AgeGate (+18): siembra sessionStorage antes de cargar la página, así el
 * modal no bloquea. Llamar ANTES de page.goto(). El gate tiene su propio spec aparte.
 */
export async function passAgeGate(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('mygin_age_ok', '1'); } catch { /* ignore */ }
  });
}

/** Siembra el carrito en localStorage (formato CartProvider, key `mygin_cart`). */
export async function seedCart(
  page: Page,
  items: { productId: string; slug: string; name: string; unitPrice: number; qty: number; image?: string }[],
): Promise<void> {
  await page.addInitScript((data) => {
    try { localStorage.setItem('mygin_cart', JSON.stringify(data)); } catch { /* ignore */ }
  }, items.map((i) => ({ image: '', ...i })));
}

/** Carga el carrito con 1 unidad del producto en stock por defecto. */
export async function seedDefaultCart(page: Page): Promise<void> {
  const p = PRODUCTS.inStock;
  await seedCart(page, [{ productId: p.slug, slug: p.slug, name: p.name, unitPrice: p.price, qty: 1 }]);
}
