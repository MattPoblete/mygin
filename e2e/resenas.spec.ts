import { test, expect } from '@playwright/test';
import { passAgeGate, ADMIN_STORAGE, PRODUCTS } from './support/helpers';

/**
 * Reseñas con moderación (Oleada 2).
 *
 * Form público en el PDP escribe en `comments` con status 'pending' (create público por
 * reglas). El admin modera en /admin/comentarios; al aprobar, una transacción client-side
 * suma el rating al producto. El seed deja botella-individual con 1 reseña aprobada
 * (rating 5 → promedio 5.0) y 1 pendiente.
 */

const PDP = `/producto/${PRODUCTS.inStock.slug}`;

test.describe('Reseñas · envío público', () => {
  test('enviar sin calificación muestra el error de calificación', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(PDP);

    await page.getByRole('button', { name: 'Enviar reseña' }).click();

    await expect(page.getByText('Elige una calificación.')).toBeVisible();
    await expect(page.getByText('¡Gracias por tu reseña!')).toHaveCount(0);
  });

  test('una reseña válida queda en moderación: éxito, pero no visible en el PDP', async ({ page }) => {
    const body = `Reseña pendiente E2E ${Date.now()}`;

    await passAgeGate(page);
    await page.goto(PDP);

    await page.getByRole('radio', { name: '4 estrellas' }).check({ force: true });
    await page.getByLabel('Nombre').fill('Valentina E2E');
    await page.getByLabel('Correo').fill('valentina@example.com');
    await page.getByLabel('Tu reseña').fill(body);
    await page.getByRole('button', { name: 'Enviar reseña' }).click();

    await expect(page.getByText('¡Gracias por tu reseña!')).toBeVisible();

    // Sigue 'pending' → no aparece en la lista pública.
    await page.goto(PDP);
    await expect(page.getByText(body)).toHaveCount(0);
  });
});

test.describe('Reseñas · moderación', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('aprobar publica la reseña y actualiza el promedio (suma una sola vez)', async ({ page }) => {
    const body = `Reseña aprobable E2E ${Date.now()}`;

    // Enviar una reseña de 1 estrella sobre un producto sembrado en 5.0 (1 reseña).
    await passAgeGate(page);
    await page.goto(PDP);
    await page.getByRole('radio', { name: '1 estrellas' }).check({ force: true });
    await page.getByLabel('Nombre').fill('Moderable E2E');
    await page.getByLabel('Correo').fill('moderable@example.com');
    await page.getByLabel('Tu reseña').fill(body);
    await page.getByRole('button', { name: 'Enviar reseña' }).click();
    await expect(page.getByText('¡Gracias por tu reseña!')).toBeVisible();

    // Aprobarla en el admin.
    await page.goto('/admin/comentarios');
    const row = page.getByRole('row', { name: new RegExp(body) });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Aprobar' }).click();
    // La fila pasa a 'Aprobada' (ya no ofrece Aprobar).
    await expect(row.getByRole('button', { name: 'Aprobar' })).toHaveCount(0);

    // En el PDP: la reseña es visible y el promedio bajó a 3.0 = (5 + 1) / 2.
    // Si el rating se contara dos veces sería 2.3; si no se contara, seguiría 5.0.
    await page.goto(PDP);
    await expect(page.getByText(body)).toBeVisible();
    await expect(page.getByText(/3\.0 · 2 reseñas/)).toBeVisible();
  });
});
