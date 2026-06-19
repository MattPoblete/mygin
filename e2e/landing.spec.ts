import { test, expect } from '@playwright/test';
import { passAgeGate } from './support/helpers';

/**
 * Landing (/) — verifica presencia de secciones clave y CTAs. Aserciones
 * ligeras (presencia, no píxeles). Gate +18 saltado vía passAgeGate.
 */
test.describe('Landing (/)', () => {
  test('renderiza el hero con el titular principal', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/El sur de Chile/i);
    await expect(h1).toContainText(/copa/i);
  });

  test('expone las secciones ancladas de la landing', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    for (const id of ['top', 'distribuidores', 'producto', 'botanicos', 'tienda', 'contacto']) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
    }
  });

  test('muestra los CTAs principales del hero', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    // CTA de compra → /tienda; CTA secundaria → ancla #producto.
    const buy = page.getByRole('link', { name: 'Comprar ahora' });
    await expect(buy).toBeVisible();
    await expect(buy).toHaveAttribute('href', '/tienda');

    await expect(page.getByRole('link', { name: 'Conoce el gin' })).toBeVisible();
  });

  test('el CTA "Comprar ahora" del hero navega a la tienda', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    await page.getByRole('link', { name: 'Comprar ahora' }).click();
    await expect(page).toHaveURL(/\/tienda$/);
  });
});
