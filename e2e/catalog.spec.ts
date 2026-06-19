import { test, expect } from '@playwright/test';
import { passAgeGate, PRODUCTS } from './support/helpers';

/**
 * Catálogo /tienda — la grilla de productos sembrados en el emulador.
 * Cada tarjeta es un <Link> con el nombre del producto; estados de stock
 * (agotado, últimas N) se reflejan en el contenido de la tarjeta.
 */
test.describe('Catálogo /tienda', () => {
  test('muestra los productos sembrados como tarjetas enlazadas', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/tienda');

    await expect(
      page.getByRole('link', { name: new RegExp(PRODUCTS.inStock.name) }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(PRODUCTS.featured.name) }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(PRODUCTS.lowStock.name) }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: new RegExp(PRODUCTS.soldOut.name) }),
    ).toBeVisible();
  });

  test('cada tarjeta enlaza al detalle del producto por slug', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/tienda');

    const card = page.getByRole('link', { name: new RegExp(PRODUCTS.inStock.name) });
    await expect(card).toHaveAttribute('href', `/producto/${PRODUCTS.inStock.slug}`);
  });

  test('muestra el encabezado del catálogo', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/tienda');

    await expect(page.getByRole('heading', { name: 'Nuestra colección' })).toBeVisible();
  });

  test('el producto agotado expone "Agotado" en su tarjeta', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/tienda');

    // El <h3> de la tarjeta agotada incluye un texto visually-hidden "— Agotado".
    await expect(
      page.getByRole('heading', { name: new RegExp(`${PRODUCTS.soldOut.name}.*Agotado`) }),
    ).toBeVisible();
  });

  test('el producto con poco stock muestra "Últimas 3"', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/tienda');

    const card = page.getByRole('link', { name: new RegExp(PRODUCTS.lowStock.name) });
    await expect(card.getByText(/Últimas 3/)).toBeVisible();
  });

  test('navega al detalle al hacer clic en una tarjeta', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/tienda');

    await page.getByRole('link', { name: new RegExp(PRODUCTS.inStock.name) }).click();
    await expect(page).toHaveURL(new RegExp(`/producto/${PRODUCTS.inStock.slug}$`));
    await expect(
      page.getByRole('heading', { level: 1, name: PRODUCTS.inStock.name }),
    ).toBeVisible();
  });
});
