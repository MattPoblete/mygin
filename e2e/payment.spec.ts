import { test, expect, type Page } from '@playwright/test';
import { passAgeGate, seedDefaultCart } from './support/helpers';

/**
 * E2E del pago MOCK (popup window) + confirmación.
 * Al enviar un formulario válido, el checkout hace window.open() de
 * /checkout/mock?orderId=…. El popup comunica el resultado al opener vía
 * postMessage; el opener navega a /checkout/confirmacion/{orderId} si se paga.
 *
 * RUT válido usado: 12.345.678-5 (self-check de lib/checkout.ts).
 */

async function fillCheckout(page: Page): Promise<void> {
  await page.getByLabel('Nombre completo').fill('María Pérez');
  await page.getByLabel('RUT (opcional)').fill('12.345.678-5');
  await page.getByLabel('Email').fill('maria@example.com');
  await page.getByLabel('Teléfono').fill('+56 9 1234 5678');
  await page.getByLabel('Región').selectOption('Región Metropolitana');
  await page.getByLabel('Comuna').fill('Providencia');
  await page.getByLabel('Calle').fill('Av. Siempre Viva');
  await page.getByLabel('Número (opcional)').fill('742');
}

async function gotoCheckout(page: Page): Promise<void> {
  await passAgeGate(page);
  await seedDefaultCart(page);
  await page.goto('/checkout');
  await expect(page.getByRole('button', { name: /Pagar/ })).toBeVisible();
}

/** Envía el form válido y captura el popup de pago abierto con window.open. */
async function submitAndGetPopup(page: Page) {
  await fillCheckout(page);
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Pagar/ }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  await expect(popup).toHaveURL(/\/checkout\/mock\?orderId=/);
  const orderId = new URL(popup.url()).searchParams.get('orderId') ?? '';
  expect(orderId).not.toBe('');
  return { popup, orderId };
}

test.describe('Pago mock — apertura del popup', () => {
  test('enviar el formulario válido abre el popup /checkout/mock', async ({ page }) => {
    await gotoCheckout(page);
    const { popup } = await submitAndGetPopup(page);
    await expect(popup.getByRole('button', { name: 'Aceptar pago' })).toBeVisible();
    await expect(popup.getByRole('button', { name: 'Rechazar pago' })).toBeVisible();
  });

  test('el popup muestra el total del pedido', async ({ page }) => {
    await gotoCheckout(page);
    const { popup } = await submitAndGetPopup(page);
    // Total con despacho incluido (server-side); basta con que muestre un monto en CLP.
    await expect(popup.getByText(/\$\d/)).toBeVisible();
    await expect(popup.getByText(/Pago simulado/)).toBeVisible();
  });
});

test.describe('Pago mock — aceptar (happy path)', () => {
  test('aceptar el pago navega a la confirmación y muestra éxito', async ({ page }) => {
    await gotoCheckout(page);
    const { popup, orderId } = await submitAndGetPopup(page);

    await popup.getByRole('button', { name: 'Aceptar pago' }).click();

    // El opener navega a la confirmación del pedido pagado.
    await page.waitForURL(new RegExp(`/checkout/confirmacion/${orderId}`));
    await expect(
      page.getByRole('heading', { name: /Compra confirmada|¡Compra/ }),
    ).toBeVisible();
    await expect(page.getByText(/¿Qué sigue\?/)).toBeVisible();
  });

  test('tras pagar, el carrito queda vacío (badge del navbar desaparece)', async ({ page }) => {
    await gotoCheckout(page);
    const { popup } = await submitAndGetPopup(page);
    await popup.getByRole('button', { name: 'Aceptar pago' }).click();
    await page.waitForURL(/\/checkout\/confirmacion\//);

    // El carrito se limpió: no debe quedar nada en localStorage.
    await expect
      .poll(async () =>
        page.evaluate(() => {
          try {
            const raw = localStorage.getItem('mygin_cart');
            if (!raw) return 0;
            const arr = JSON.parse(raw) as { qty: number }[];
            return Array.isArray(arr) ? arr.reduce((n, i) => n + (i.qty ?? 0), 0) : 0;
          } catch {
            return 0;
          }
        }),
      )
      .toBe(0);
  });
});

test.describe('Pago mock — rechazar', () => {
  test('rechazar el pago vuelve al form con aviso y permite reintentar', async ({ page }) => {
    await gotoCheckout(page);
    const { popup } = await submitAndGetPopup(page);

    await popup.getByRole('button', { name: 'Rechazar pago' }).click();

    // Sigue en el checkout (no navega a confirmación).
    await expect(page).toHaveURL(/\/checkout$/);
    // <p role="alert"> del form; se acota para excluir el route-announcer de Next.
    await expect(page.locator('p[role="alert"]')).toContainText(/no se completó|pago/i);
    // El botón vuelve a estar disponible como "Reintentar pago".
    await expect(page.getByRole('button', { name: /Reintentar pago/ })).toBeEnabled();
  });
});

test.describe('Pago mock — popup cerrado sin actuar', () => {
  test('cerrar el popup muestra aviso de falta de confirmación y no navega', async ({ page }) => {
    await gotoCheckout(page);
    const { popup } = await submitAndGetPopup(page);

    await popup.close();

    // No navega a confirmación; sigue en el checkout.
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.locator('p[role="alert"]')).toContainText(/No recibimos confirmación/);
    await expect(page.getByRole('button', { name: /Reintentar pago/ })).toBeEnabled();
  });
});

test.describe('Confirmación — directa por id', () => {
  test('un id inexistente muestra "Pedido no encontrado"', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/checkout/confirmacion/no-existe-12345');
    await expect(page.getByRole('heading', { name: /Pedido no encontrado/ })).toBeVisible();
  });

  test('una orden pagada (vía aceptar) muestra confirmación con detalle', async ({ page }) => {
    await gotoCheckout(page);
    const { popup, orderId } = await submitAndGetPopup(page);
    await popup.getByRole('button', { name: 'Aceptar pago' }).click();
    await page.waitForURL(new RegExp(`/checkout/confirmacion/${orderId}`));

    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Despacho')).toBeVisible();
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Seguir comprando/ })).toBeVisible();
  });
});
