import { test, expect } from '@playwright/test';
import { passAgeGate, PRODUCTS } from './support/helpers';

/** Precio CLP como lo renderiza la app: formatPrice(17990) === '$17.990'. */
const formatPrice = (n: number): string =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Detalle de producto /producto/[slug].
 * <h1> = nombre; precio CLP visible; estados de stock; QtyStepper acotado al stock;
 * "Agregar al carrito" muestra confirmación con salida y actualiza el badge del navbar.
 */
test.describe('Producto en stock', () => {
  const p = PRODUCTS.inStock;

  test('muestra nombre, precio y estado "En stock"', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await expect(page.getByRole('heading', { level: 1, name: p.name })).toBeVisible();
    await expect(page.getByText(formatPrice(p.price)).first()).toBeVisible();
    await expect(page.getByText('En stock')).toBeVisible();
  });

  test('agregar al carrito muestra la confirmación con salida', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await page.getByRole('button', { name: /Agregar al carrito/ }).click();

    const confirm = page.getByText('Agregado al carrito');
    await expect(confirm).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir al carrito' })).toHaveAttribute(
      'href',
      '/carrito',
    );
    await expect(page.getByRole('button', { name: 'Seguir comprando' })).toBeVisible();
  });

  test('agregar actualiza el badge del carrito en el navbar', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await expect(page.getByRole('link', { name: 'Carrito, 1 producto' })).toBeVisible();
  });

  test('agregar 2 unidades refleja 2 en el badge', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await page.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await expect(page.getByRole('link', { name: 'Carrito, 2 productos' })).toBeVisible();
  });

  test('el stepper aumenta y disminuye la cantidad', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    const inc = page.getByRole('button', { name: 'Aumentar cantidad' });
    const dec = page.getByRole('button', { name: 'Disminuir cantidad' });

    // Empieza en 1: disminuir está deshabilitado.
    await expect(dec).toBeDisabled();
    await expect(page.getByText('1', { exact: true })).toBeVisible();

    await inc.click();
    await expect(page.getByText('2', { exact: true })).toBeVisible();
    await expect(dec).toBeEnabled();

    await dec.click();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
    await expect(dec).toBeDisabled();
  });

  test('cambiar la cantidad descarta la confirmación previa', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await page.getByRole('button', { name: /Agregar al carrito/ }).click();
    await expect(page.getByText('Agregado al carrito')).toBeVisible();

    await page.getByRole('button', { name: 'Aumentar cantidad' }).click();
    await expect(page.getByText('Agregado al carrito')).toBeHidden();
  });
});

test.describe('Producto con poco stock', () => {
  const p = PRODUCTS.lowStock;

  test('muestra "Últimas 3 unidades"', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await expect(page.getByText(/Últimas 3 unidades/)).toBeVisible();
  });

  test('el stepper no supera el stock disponible (máx 3)', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    const inc = page.getByRole('button', { name: 'Aumentar cantidad' });
    await inc.click(); // 2
    await inc.click(); // 3 (tope = stock)

    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await expect(inc).toBeDisabled();
  });
});

test.describe('Producto agotado', () => {
  const p = PRODUCTS.soldOut;

  test('muestra "Agotado" y el botón de compra deshabilitado', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await expect(page.getByText('Agotado')).toBeVisible();
    const btn = page.getByRole('button', { name: 'Agotado' });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('no expone el botón "Agregar al carrito"', async ({ page }) => {
    await passAgeGate(page);
    await page.goto(`/producto/${p.slug}`);

    await expect(page.getByRole('button', { name: /Agregar al carrito/ })).toHaveCount(0);
  });
});
