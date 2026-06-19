import { test, expect } from '@playwright/test';
import {
  passAgeGate,
  PRODUCTS,
  seedCart,
  seedDefaultCart,
  SHIPPING_CLP,
} from './support/helpers';

/** Precio CLP como lo renderiza la app: formatPrice(17990) === '$17.990'. */
const formatPrice = (n: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Carrito /carrito. Se pre-puebla el carrito vía localStorage (seedCart) y se
 * visita /carrito. Cubre estado vacío, edición de cantidad (totales + badge),
 * eliminar líneas y "Vaciar carrito".
 */
test.describe('Carrito vacío', () => {
  test('muestra el estado vacío con enlace a la tienda', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/carrito');

    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir a la tienda' })).toHaveAttribute(
      'href',
      '/tienda',
    );
  });

  test('sin ítems no hay badge de carrito en el navbar', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/carrito');

    // Sin productos el aria-label es solo "Carrito" (sin recuento).
    await expect(page.getByRole('link', { name: 'Carrito', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Carrito, \d+ producto/ })).toHaveCount(0);
  });
});

test.describe('Carrito con ítems', () => {
  test('lista la línea con nombre, precio unitario y resumen', async ({ page }) => {
    await passAgeGate(page);
    await seedDefaultCart(page);
    await page.goto('/carrito');

    const p = PRODUCTS.inStock;
    await expect(page.getByRole('link', { name: p.name })).toBeVisible();
    await expect(page.getByText(`${formatPrice(p.price)} c/u`)).toBeVisible();

    const summary = page.getByRole('complementary');
    await expect(summary.getByRole('heading', { name: 'Resumen' })).toBeVisible();
    await expect(summary.getByText('Despacho')).toBeVisible();
    await expect(summary.getByText(formatPrice(SHIPPING_CLP))).toBeVisible();
  });

  test('subtotal y total reflejan precio + despacho', async ({ page }) => {
    await passAgeGate(page);
    await seedDefaultCart(page);
    await page.goto('/carrito');

    const p = PRODUCTS.inStock;
    const summary = page.getByRole('complementary');
    // Subtotal junto a su etiqueta.
    await expect(
      summary.locator('div', { hasText: /^Subtotal/ }).getByText(formatPrice(p.price)),
    ).toBeVisible();
    await expect(
      summary.locator('div', { hasText: /^Total/ }).getByText(formatPrice(p.price + SHIPPING_CLP)),
    ).toBeVisible();
  });

  test('el enlace "Ir a pagar" apunta al checkout', async ({ page }) => {
    await passAgeGate(page);
    await seedDefaultCart(page);
    await page.goto('/carrito');

    await expect(page.getByRole('link', { name: 'Ir a pagar' })).toHaveAttribute(
      'href',
      '/checkout',
    );
  });

  test('aumentar la cantidad actualiza línea, total y badge', async ({ page }) => {
    await passAgeGate(page);
    await seedDefaultCart(page);
    await page.goto('/carrito');

    const p = PRODUCTS.inStock;
    await page.getByRole('button', { name: 'Aumentar cantidad' }).click();

    // Línea total = 2 × precio.
    await expect(page.getByText(formatPrice(p.price * 2)).first()).toBeVisible();
    // Total = 2 × precio + despacho.
    const summary = page.getByRole('complementary');
    await expect(
      summary
        .locator('div', { hasText: /^Total/ })
        .getByText(formatPrice(p.price * 2 + SHIPPING_CLP)),
    ).toBeVisible();
    // Badge actualizado.
    await expect(page.getByRole('link', { name: 'Carrito, 2 productos' })).toBeVisible();
  });

  test('disminuir la cantidad vuelve a 1 unidad', async ({ page }) => {
    await passAgeGate(page);
    await seedCart(page, [
      {
        productId: PRODUCTS.inStock.slug,
        slug: PRODUCTS.inStock.slug,
        name: PRODUCTS.inStock.name,
        unitPrice: PRODUCTS.inStock.price,
        qty: 2,
      },
    ]);
    await page.goto('/carrito');

    await expect(page.getByRole('link', { name: 'Carrito, 2 productos' })).toBeVisible();
    await page.getByRole('button', { name: 'Disminuir cantidad' }).click();
    await expect(page.getByRole('link', { name: 'Carrito, 1 producto' })).toBeVisible();
  });

  test('eliminar una de dos líneas deja la otra', async ({ page }) => {
    await passAgeGate(page);
    await seedCart(page, [
      {
        productId: PRODUCTS.inStock.slug,
        slug: PRODUCTS.inStock.slug,
        name: PRODUCTS.inStock.name,
        unitPrice: PRODUCTS.inStock.price,
        qty: 1,
      },
      {
        productId: PRODUCTS.featured.slug,
        slug: PRODUCTS.featured.slug,
        name: PRODUCTS.featured.name,
        unitPrice: PRODUCTS.featured.price,
        qty: 1,
      },
    ]);
    await page.goto('/carrito');

    await page.getByRole('button', { name: `Eliminar ${PRODUCTS.inStock.name}` }).click();

    await expect(page.getByRole('link', { name: PRODUCTS.inStock.name })).toHaveCount(0);
    await expect(page.getByRole('link', { name: PRODUCTS.featured.name })).toBeVisible();
  });

  test('eliminar la última línea muestra el estado vacío', async ({ page }) => {
    await passAgeGate(page);
    await seedDefaultCart(page);
    await page.goto('/carrito');

    await page.getByRole('button', { name: `Eliminar ${PRODUCTS.inStock.name}` }).click();
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
  });

  test('"Vaciar carrito" limpia todo y quita el badge', async ({ page }) => {
    await passAgeGate(page);
    await seedCart(page, [
      {
        productId: PRODUCTS.inStock.slug,
        slug: PRODUCTS.inStock.slug,
        name: PRODUCTS.inStock.name,
        unitPrice: PRODUCTS.inStock.price,
        qty: 1,
      },
      {
        productId: PRODUCTS.featured.slug,
        slug: PRODUCTS.featured.slug,
        name: PRODUCTS.featured.name,
        unitPrice: PRODUCTS.featured.price,
        qty: 1,
      },
    ]);
    await page.goto('/carrito');

    await page.getByRole('button', { name: 'Vaciar carrito' }).click();

    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Carrito, \d+ producto/ })).toHaveCount(0);
  });
});
