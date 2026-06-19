import { test, expect } from '@playwright/test';
import { passAgeGate, ADMIN_STORAGE } from './support/helpers';

test.use({ storageState: ADMIN_STORAGE });

/**
 * Admin · Pedidos — listado de solo lectura.
 *
 * Seed: un pedido pagado `seed-order-paid` (total 21980, estado "Pagado",
 * cliente "Cliente Prueba"). No hay acciones por fila — el estado lo manejan
 * las Cloud Functions.
 */

test.describe('Admin · Pedidos', () => {
  test('muestra el heading y la nota de los 100 más recientes', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/pedidos');

    await expect(page.getByRole('heading', { level: 1, name: 'Pedidos' })).toBeVisible();
    await expect(page.getByText('Mostrando los 100 pedidos más recientes.')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('muestra el pedido pagado sembrado con su total y chip "Pagado"', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/pedidos');

    const row = page.getByRole('row', { name: /seed-order-paid/ });
    await expect(row).toBeVisible();
    // Total formateado: $21.980
    await expect(row.getByText(/21\.980/)).toBeVisible();
    await expect(row.getByText('Pagado')).toBeVisible();
    await expect(row.getByText('Cliente Prueba')).toBeVisible();
  });

  test('es de solo lectura: la fila no tiene acciones Editar/Eliminar', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/pedidos');

    const row = page.getByRole('row', { name: /seed-order-paid/ });
    await expect(row).toBeVisible();
    await expect(row.getByRole('link', { name: 'Editar' })).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'Eliminar' })).toHaveCount(0);
  });
});
