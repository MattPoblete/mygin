import { test, expect } from '@playwright/test';
import { passAgeGate } from './support/helpers';

/**
 * Navbar — wordmark, links desktop, resolución de anclas (in-page vs /#x),
 * carrito y menú mobile. El gate +18 se salta vía passAgeGate (init script).
 */
test.describe('Navbar — desktop', () => {
  test('muestra el wordmark MY/GIN y los links de navegación', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'MyGin — Inicio' })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    for (const label of ['Inicio', 'Dónde comprar', 'El Gin', 'Botánicos', 'Tienda']) {
      await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    // "Recetas" fue removido del nav.
    await expect(nav.getByRole('link', { name: 'Recetas', exact: true })).toHaveCount(0);
  });

  test('el carrito está presente y sin badge cuando está vacío', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Carrito', exact: true })).toBeVisible();
  });

  test('en "/" un ancla del nav hace scroll in-page (URL con #)', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await nav.getByRole('link', { name: 'El Gin', exact: true }).click();

    await expect(page).toHaveURL(/#producto$/);
    await expect(page.locator('section#producto')).toBeVisible();
  });

  test('fuera de "/" el ancla del nav resuelve a /#x (navega a home)', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/tienda');

    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    const elGin = nav.getByRole('link', { name: 'El Gin', exact: true });
    await expect(elGin).toHaveAttribute('href', '/#producto');

    await elGin.click();
    await expect(page).toHaveURL(/\/#producto$/);
    await expect(page.locator('section#producto')).toBeVisible();
  });
});

test.describe('Navbar — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('abre el menú mobile, muestra los links y Escape lo cierra', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    const dialog = page.locator('dialog#mobile-menu');
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(dialog).toBeVisible();

    const menu = page.getByRole('navigation', { name: 'Menú móvil' });
    await expect(menu.getByRole('link', { name: 'Inicio', exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Tienda', exact: true })).toBeVisible();
    // El toggle ahora ofrece cerrar.
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('tocar un link del menú navega y cierra el menú', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Abrir menú' }).click();
    const menu = page.getByRole('navigation', { name: 'Menú móvil' });
    await menu.getByRole('link', { name: 'Tienda', exact: true }).click();

    await expect(page).toHaveURL(/\/tienda$/);
    await expect(page.locator('dialog#mobile-menu')).toBeHidden();
  });
});
