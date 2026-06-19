import { test, expect } from '@playwright/test';
import { passAgeGate, ADMIN_STORAGE } from './support/helpers';

test.use({ storageState: ADMIN_STORAGE });

/**
 * Admin · Cupones — lista + crear + eliminar.
 *
 * Códigos creados usan prefijo TESTE2E para no chocar con el seed (BIENVENIDA10,
 * VENCIDO). El form guarda el código en MAYÚSCULAS.
 */

test.describe('Admin · Cupones · lista', () => {
  test('muestra los cupones sembrados en la tabla', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/cupones');

    await expect(page.getByRole('heading', { level: 1, name: 'Cupones' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('row', { name: /BIENVENIDA10/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /VENCIDO/ })).toBeVisible();
  });

  test('+ Nuevo navega al formulario de creación', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/cupones');

    await page.getByRole('link', { name: '+ Nuevo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nuevo cupón' })).toBeVisible();
  });
});

test.describe('Admin · Cupones · crear / eliminar', () => {
  test('crea un cupón porcentual y lo muestra con flash de guardado', async ({ page }) => {
    const code = `TESTE2E${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/cupones/nuevo');

    await page.getByLabel('Código').fill(code);
    await page.getByLabel('Tipo', { exact: true }).selectOption('percent');
    // Para tipo "percent" el campo de valor se etiqueta "Valor (%)".
    await page.getByLabel('Valor (%)').fill('15');
    // "Activo" ya viene marcado por defecto.

    await page.getByRole('button', { name: 'Crear cupón' }).click();

    await expect(page).toHaveURL(/\/admin\/cupones/);
    await expect(page.getByText(/Guardado/)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(code) })).toBeVisible();
  });

  test('crea un cupón con fechas Vigente desde / Vence (sin validación cruzada en el form)', async ({
    page,
  }) => {
    const code = `TESTE2EDATE${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/cupones/nuevo');

    await page.getByLabel('Código').fill(code);
    await page.getByLabel('Tipo', { exact: true }).selectOption('percent');
    await page.getByLabel('Valor (%)').fill('10');
    // NOTA: el CouponForm no valida que Vence > Vigente desde, así que aunque la
    // fecha de vencimiento sea anterior, el cupón se crea igual (no hay error).
    await page.getByLabel('Vigente desde (opcional)').fill('2030-06-01');
    await page.getByLabel('Vence (opcional)').fill('2030-05-01');

    await page.getByRole('button', { name: 'Crear cupón' }).click();

    await expect(page).toHaveURL(/\/admin\/cupones/);
    await expect(page.getByText(/Guardado/)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(code) })).toBeVisible();
  });

  test('elimina el cupón creado (acepta el confirm) y desaparece de la tabla', async ({ page }) => {
    const code = `TESTE2EDEL${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/cupones/nuevo');
    await page.getByLabel('Código').fill(code);
    await page.getByLabel('Tipo', { exact: true }).selectOption('percent');
    await page.getByLabel('Valor (%)').fill('5');
    await page.getByRole('button', { name: 'Crear cupón' }).click();

    const row = page.getByRole('row', { name: new RegExp(code) });
    await expect(row).toBeVisible();

    page.on('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByRole('row', { name: new RegExp(code) })).toHaveCount(0);
  });

  test('crea un cupón de despacho gratis (el campo valor no aplica)', async ({ page }) => {
    const code = `TESTE2ESHIP${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/cupones/nuevo');
    await page.getByLabel('Código').fill(code);
    await page.getByLabel('Tipo', { exact: true }).selectOption('free_shipping');
    await page.getByRole('button', { name: 'Crear cupón' }).click();

    await expect(page).toHaveURL(/\/admin\/cupones/);
    await expect(page.getByText(/Guardado/)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(code) })).toBeVisible();
  });
});
