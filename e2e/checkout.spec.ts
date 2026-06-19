import { test, expect, type Page } from '@playwright/test';
import {
  passAgeGate,
  seedDefaultCart,
  PRODUCTS,
  SHIPPING_CLP,
  COUPON_OK,
  COUPON_EXPIRED,
} from './support/helpers';

/**
 * E2E del formulario de checkout (validación + cupones).
 * Corre contra el emulador Firebase. El carrito se siembra en localStorage antes
 * de navegar a /checkout (la página redirige a /tienda si el carrito está vacío).
 *
 * RUT válido usado: 12.345.678-5 (el mismo del self-check de lib/checkout.ts).
 */

/** Datos válidos del cliente. Sólo rellena los campos requeridos + RUT. */
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

/** Siembra carrito + salta el AgeGate y abre /checkout ya hidratado. */
async function gotoCheckout(page: Page): Promise<void> {
  await passAgeGate(page);
  await seedDefaultCart(page);
  await page.goto('/checkout');
  // El form sólo se monta tras hidratar y con carrito no vacío.
  await expect(page.getByRole('button', { name: /Pagar/ })).toBeVisible();
}

test.describe('Checkout — acceso y carrito', () => {
  test('redirige a /tienda si el carrito está vacío', async ({ page }) => {
    await passAgeGate(page);
    await page.goto('/checkout');
    await page.waitForURL(/\/tienda/);
    await expect(page).toHaveURL(/\/tienda/);
  });

  test('muestra el formulario y el resumen con carrito sembrado', async ({ page }) => {
    await gotoCheckout(page);
    await expect(page.getByRole('heading', { name: /Finalizar compra/ })).toBeVisible();
    const summary = page.getByRole('complementary');
    await expect(summary.getByRole('heading', { name: /Resumen/ })).toBeVisible();
    // "Despacho" aparece varias veces (legend, notas, resumen); se acota al resumen.
    await expect(summary.getByText('Despacho', { exact: true })).toBeVisible();
    await expect(summary.getByText('Total', { exact: true })).toBeVisible();
    await expect(summary.getByText(/IVA incluido/)).toBeVisible();
  });

  test('el botón Pagar muestra el total estimado (subtotal + despacho)', async ({ page }) => {
    await gotoCheckout(page);
    const total = PRODUCTS.inStock.price + SHIPPING_CLP; // 17.990 + 3.990 = 21.980
    await expect(
      page.getByRole('button', { name: /Pagar \$21\.980/ }),
    ).toBeVisible();
  });
});

test.describe('Checkout — validación de campos', () => {
  test('submit vacío muestra errores por campo y no navega', async ({ page }) => {
    await passAgeGate(page);
    await seedDefaultCart(page);
    await page.goto('/checkout');
    await expect(page.getByRole('button', { name: /Pagar/ })).toBeVisible();

    await page.getByRole('button', { name: /Pagar/ }).click();

    // El form usa validación nativa (los inputs son `required`), así que el submit
    // vacío es bloqueado por el navegador antes de llegar al handler de React: no
    // navega y el primer campo requerido queda inválido/enfocado.
    await expect(page).toHaveURL(/\/checkout$/);
    const nombre = page.getByLabel('Nombre completo');
    await expect(nombre).toBeFocused();
    await expect(nombre).toHaveJSProperty('validity.valid', false);
  });

  test('enfoca el primer campo inválido (Nombre) al enviar vacío', async ({ page }) => {
    await gotoCheckout(page);
    await page.getByRole('button', { name: /Pagar/ }).click();
    await expect(page.getByLabel('Nombre completo')).toBeFocused();
  });

  test('email inválido marca el campo como inválido', async ({ page }) => {
    await gotoCheckout(page);
    await page.getByLabel('Email').fill('no-es-email');
    await page.getByLabel('Email').blur();
    await expect(page.getByText('Email no válido.')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('RUT inválido muestra error', async ({ page }) => {
    await gotoCheckout(page);
    await page.getByLabel('RUT (opcional)').fill('12.345.678-9'); // dv incorrecto
    await page.getByLabel('RUT (opcional)').blur();
    await expect(page.getByText(/RUT no válido/)).toBeVisible();
    await expect(page.getByLabel('RUT (opcional)')).toHaveAttribute('aria-invalid', 'true');
  });

  test('RUT válido (12.345.678-5) no muestra error', async ({ page }) => {
    await gotoCheckout(page);
    await page.getByLabel('RUT (opcional)').fill('12.345.678-5');
    await page.getByLabel('RUT (opcional)').blur();
    await expect(page.getByText(/RUT no válido/)).toHaveCount(0);
    await expect(page.getByLabel('RUT (opcional)')).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('formulario completo no muestra errores de validación', async ({ page }) => {
    await gotoCheckout(page);
    await fillCheckout(page);
    // No hay errores de campo visibles antes de pagar.
    await expect(page.getByText('Ingresa tu nombre.')).toHaveCount(0);
    await expect(page.getByText('Email no válido.')).toHaveCount(0);
    await expect(page.getByText(/RUT no válido/)).toHaveCount(0);
  });
});

test.describe('Checkout — cupones', () => {
  test('cupón válido (BIENVENIDA10) aplica descuento y baja el total', async ({ page }) => {
    await gotoCheckout(page);

    const subtotal = PRODUCTS.inStock.price;
    const totalBefore = subtotal + SHIPPING_CLP;
    await expect(page.getByRole('button', { name: new RegExp(`Pagar`) })).toBeVisible();

    await page.getByPlaceholder('CÓDIGO').fill(COUPON_OK);
    await page.getByRole('button', { name: 'Aplicar' }).click();

    // Texto verde de confirmación.
    await expect(page.getByText(/Cupón aplicado/)).toBeVisible();
    // Aparece la línea de descuento en el resumen.
    await expect(page.getByText('Descuento', { exact: true })).toBeVisible();

    // El total del botón baja (10% de 17.990 = 1.799 → total 20.181).
    const discounted = Math.max(0, subtotal - Math.round(subtotal * 0.1)) + SHIPPING_CLP;
    await expect(
      page.getByRole('button', { name: new RegExp(`Pagar`) }),
    ).not.toContainText(String(totalBefore));
    await expect(page.getByRole('button', { name: /Pagar \$20\.181/ })).toBeVisible();
  });

  test('cupón vencido (VENCIDO) muestra error rojo', async ({ page }) => {
    await gotoCheckout(page);
    await page.getByPlaceholder('CÓDIGO').fill(COUPON_EXPIRED);
    await page.getByRole('button', { name: 'Aplicar' }).click();

    await expect(page.getByText(/vencido|no válido/i)).toBeVisible();
    // Sin línea de descuento.
    await expect(page.getByText('Descuento', { exact: true })).toHaveCount(0);
  });

  test('editar el código tras aplicar invalida el estado del cupón', async ({ page }) => {
    await gotoCheckout(page);
    await page.getByPlaceholder('CÓDIGO').fill(COUPON_OK);
    await page.getByRole('button', { name: 'Aplicar' }).click();
    await expect(page.getByText(/Cupón aplicado/)).toBeVisible();

    // Editar el input limpia el mensaje (couponState = null).
    await page.getByPlaceholder('CÓDIGO').fill(`${COUPON_OK}X`);
    await expect(page.getByText(/Cupón aplicado/)).toHaveCount(0);
  });

  test('el botón Aplicar está deshabilitado sin código', async ({ page }) => {
    await gotoCheckout(page);
    await expect(page.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
    await page.getByPlaceholder('CÓDIGO').fill('X');
    await expect(page.getByRole('button', { name: 'Aplicar' })).toBeEnabled();
  });
});
