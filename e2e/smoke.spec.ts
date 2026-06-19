import { test, expect } from '@playwright/test';
import { passAgeGate, PRODUCTS } from './support/helpers';

/** Smoke: valida que emulador + seed + dev + Playwright funcionan de punta a punta. */
test('la tienda muestra los productos sembrados en el emulador', async ({ page }) => {
  await passAgeGate(page);
  await page.goto('/tienda');
  await expect(page.getByRole('link', { name: new RegExp(PRODUCTS.inStock.name) })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(PRODUCTS.featured.name) })).toBeVisible();
});
