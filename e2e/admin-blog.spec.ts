import { test, expect } from '@playwright/test';
import { passAgeGate, ADMIN_STORAGE } from './support/helpers';

test.use({ storageState: ADMIN_STORAGE });

/**
 * Admin · Blog — lista + crear + eliminar.
 *
 * Slugs creados usan prefijo `test-e2e-` para no chocar con el post sembrado
 * `gin-tonic-perfecto` ("El gin tonic perfecto").
 */

test.describe('Admin · Blog · lista', () => {
  test('muestra el post sembrado en la tabla', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/blog');

    await expect(page.getByRole('heading', { level: 1, name: 'Blog' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    // La fila incluye el título y el slug `gin-tonic-perfecto`.
    await expect(page.getByRole('row', { name: /gin-tonic-perfecto/ })).toBeVisible();
  });

  test('cada fila ofrece Editar y Eliminar', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/blog');

    const row = page.getByRole('row', { name: /gin-tonic-perfecto/ });
    await expect(row.getByRole('link', { name: 'Editar' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Eliminar' })).toBeVisible();
  });

  test('+ Nuevo navega al formulario de creación', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/blog');

    await page.getByRole('link', { name: '+ Nuevo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nuevo artículo' })).toBeVisible();
  });
});

test.describe('Admin · Blog · crear / eliminar', () => {
  test('crea un artículo y lo muestra en la lista con flash de guardado', async ({ page }) => {
    const slug = `test-e2e-post-${Date.now()}`;
    const title = `Post E2E ${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/blog/nuevo');

    await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
    await page.getByLabel('Slug (URL)').fill(slug);
    await page.getByRole('combobox', { name: 'Categoría' }).selectOption('articulo');
    await page.getByRole('combobox', { name: 'Estado' }).selectOption('published');
    // El cuerpo Markdown es un <textarea> sin <label> asociado → se ubica por placeholder.
    await page.getByPlaceholder(/Subtítulo/).fill('## Hola\n\nCuerpo de prueba.');

    await page.getByRole('button', { name: 'Crear artículo' }).click();

    await expect(page).toHaveURL(/\/admin\/blog/);
    await expect(page.getByText(/Guardado/)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(slug) })).toBeVisible();
  });

  test('crea un borrador (Estado = Borrador) y aparece en la lista', async ({ page }) => {
    const slug = `test-e2e-draft-${Date.now()}`;
    const title = `Borrador E2E ${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/blog/nuevo');
    await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
    await page.getByLabel('Slug (URL)').fill(slug);
    await page.getByRole('combobox', { name: 'Estado' }).selectOption('draft');
    await page.getByPlaceholder(/Subtítulo/).fill('Borrador.');
    await page.getByRole('button', { name: 'Crear artículo' }).click();

    await expect(page).toHaveURL(/\/admin\/blog/);
    await expect(page.getByRole('row', { name: new RegExp(slug) })).toBeVisible();
  });

  test('elimina el artículo creado (acepta el confirm) y desaparece de la tabla', async ({ page }) => {
    const slug = `test-e2e-del-${Date.now()}`;
    const title = `Eliminable E2E ${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/blog/nuevo');
    await page.getByRole('textbox', { name: 'Título', exact: true }).fill(title);
    await page.getByLabel('Slug (URL)').fill(slug);
    await page.getByPlaceholder(/Subtítulo/).fill('Para eliminar.');
    await page.getByRole('button', { name: 'Crear artículo' }).click();

    const row = page.getByRole('row', { name: new RegExp(slug) });
    await expect(row).toBeVisible();

    page.on('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByRole('row', { name: new RegExp(slug) })).toHaveCount(0);
  });
});
