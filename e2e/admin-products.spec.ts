import { test, expect } from '@playwright/test';
import { passAgeGate, ADMIN_STORAGE } from './support/helpers';

test.use({ storageState: ADMIN_STORAGE });

/**
 * Admin · Productos — CRUD completo + dashboard + guard de cambios sin guardar.
 *
 * El admin ya viene autenticado vía storageState (auth.setup.ts). El AgeGate (+18)
 * es global (también en /admin) → se siembra sessionStorage antes del primer goto.
 *
 * Entidades creadas usan prefijo `test-e2e-` para ser idempotentes y no chocar con
 * el seed. Cada test de creación limpia detrás de sí (delete) salvo el flujo dedicado.
 */

const UNIQUE = 'test-e2e-prod';

test.describe('Admin · Dashboard', () => {
  test('muestra el heading Dashboard y las estadísticas', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    // Las etiquetas de las tarjetas de estadísticas viven en <main> (el nav lateral
    // también tiene un enlace "Productos").
    const main = page.getByRole('main');
    await expect(main.getByText('Productos', { exact: true })).toBeVisible();
    await expect(main.getByText('Activos', { exact: true })).toBeVisible();
    await expect(main.getByText('Stock bajo', { exact: true })).toBeVisible();
  });

  test('enlaza a gestionar productos y nuevo producto', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin');

    await expect(page.getByRole('link', { name: 'Gestionar productos' })).toHaveAttribute(
      'href',
      '/admin/productos',
    );
    await expect(page.getByRole('link', { name: 'Nuevo producto' })).toHaveAttribute(
      'href',
      '/admin/productos/nuevo',
    );

    await page.getByRole('link', { name: 'Gestionar productos' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Productos' })).toBeVisible();
  });
});

test.describe('Admin · Productos · lista', () => {
  test('lista los productos sembrados en una tabla', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/productos');

    await expect(page.getByRole('heading', { level: 1, name: 'Productos' })).toBeVisible();
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    await expect(
      page.getByRole('row', { name: /MyGin — Botella Individual/ }),
    ).toBeVisible();
    await expect(page.getByRole('row', { name: /MyGin — Pack Amigos/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /MyGin — Edición Limitada/ })).toBeVisible();
    await expect(page.getByRole('row', { name: /MyGin — Agotado/ })).toBeVisible();
  });

  test('cada fila ofrece Editar y Eliminar', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/productos');

    const row = page.getByRole('row', { name: /MyGin — Botella Individual/ });
    await expect(row.getByRole('link', { name: 'Editar' })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Eliminar' })).toBeVisible();
  });

  test('+ Nuevo navega al formulario de creación', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/productos');

    await page.getByRole('link', { name: '+ Nuevo' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nuevo producto' })).toBeVisible();
  });
});

test.describe('Admin · Productos · crear / editar / eliminar', () => {
  test('crea un producto y lo muestra en la lista con flash de guardado', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/productos/nuevo');

    const name = `Producto E2E ${Date.now()}`;
    // Los labels requeridos llevan un " *" visible (aria-hidden), por eso getByLabel
    // exact no calza; se usa el accessible name vía role.
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(name);
    await page.getByLabel('Slug (URL)').fill(UNIQUE);
    await page.getByLabel('SKU').fill('E2E-SKU-1');
    await page.getByRole('combobox', { name: 'Tipo', exact: true }).selectOption('gin');
    await page.getByLabel('Descripción corta').fill('Creado por E2E');
    await page.getByRole('spinbutton', { name: 'Precio (CLP)', exact: true }).fill('12990');
    await page.getByRole('spinbutton', { name: 'Stock', exact: true }).fill('25');
    // "Activo" ya viene marcado por defecto; lo dejamos así.

    await page.getByRole('button', { name: 'Crear producto' }).click();

    await expect(page).toHaveURL(/\/admin\/productos/);
    await expect(page.getByText(/Guardado/)).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible();
  });

  test('edita un producto sembrado y refleja el cambio', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/productos/mygin-edicion-limitada');

    await expect(page.getByRole('heading', { level: 1, name: 'Editar producto' })).toBeVisible();
    // El slug es de solo lectura en edición.
    await expect(page.getByText('No editable')).toBeVisible();

    const newSku = `EDIT-${Date.now()}`;
    await page.getByLabel('SKU').fill(newSku);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page).toHaveURL(/\/admin\/productos/);
    await expect(page.getByText(/Guardado/)).toBeVisible();
    // El SKU aparece bajo el nombre en la fila.
    await expect(page.getByText(newSku)).toBeVisible();
  });

  test('elimina el producto creado (acepta el confirm) y desaparece de la tabla', async ({ page }) => {
    // Crear primero un producto descartable con slug único.
    const slug = `${UNIQUE}-del-${Date.now()}`;
    const name = `Eliminable E2E ${Date.now()}`;

    await passAgeGate(page);
    await page.goto('/admin/productos/nuevo');
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(name);
    await page.getByLabel('Slug (URL)').fill(slug);
    await page.getByRole('spinbutton', { name: 'Precio (CLP)', exact: true }).fill('9990');
    await page.getByRole('spinbutton', { name: 'Stock', exact: true }).fill('5');
    await page.getByRole('button', { name: 'Crear producto' }).click();

    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();

    page.on('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Eliminar' }).click();

    await expect(page.getByRole('row', { name: new RegExp(name) })).toHaveCount(0);
  });

  test('editar un campo y Cancelar dispara el confirm de cambios sin guardar', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/admin/productos/mygin-botella-individual');
    await expect(page.getByRole('heading', { level: 1, name: 'Editar producto' })).toBeVisible();

    await page.getByLabel('SKU').fill('DIRTY-CHANGE');

    let dialogMessage = '';
    page.on('dialog', (d) => {
      dialogMessage = d.message();
      d.dismiss(); // cancelamos el descarte → seguimos en el form
    });
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await expect.poll(() => dialogMessage).toContain('cambios sin guardar');
  });
});
