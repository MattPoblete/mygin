import { test, expect } from '@playwright/test';
import { passAgeGate } from './support/helpers';

/**
 * Formulario de contacto público (`/contacto`, `components/marketing/ContactForm.tsx`).
 * Campos requeridos: Nombre, Correo, Mensaje. El submit válido escribe en la
 * colección `contactSubmissions` del emulador (create público permitido por reglas)
 * y muestra la pantalla de éxito. No usa storageState: el form es público/anónimo.
 */

const VALID = {
  name: 'Camila Soto',
  email: 'camila@example.com',
  message: 'Quisiera coordinar un pedido al por mayor para mi bar.',
};

async function gotoContact(page: import('@playwright/test').Page) {
  await passAgeGate(page);
  await page.goto('/contacto');
  // El form se renderiza con su botón de envío.
  await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeVisible();
}

test.describe('Contacto — validación', () => {
  test('al enviar vacío muestra errores en los 3 campos requeridos', async ({ page }) => {
    await gotoContact(page);

    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    // Errores por campo (role=alert) + aria-invalid en cada input requerido.
    // Se acota al <form> para excluir el route-announcer de Next (role=alert global).
    const alerts = page.locator('form').getByRole('alert');
    await expect(alerts).toHaveCount(3);
    await expect(alerts.nth(0)).toHaveText('Ingresa tu nombre.');
    await expect(alerts.nth(1)).toHaveText('Ingresa tu correo.');
    await expect(alerts.nth(2)).toHaveText('Cuéntanos en qué te podemos ayudar.');
    await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Mensaje')).toHaveAttribute('aria-invalid', 'true');

    // No navega a éxito.
    await expect(page.getByText('¡Mensaje enviado!')).toHaveCount(0);
  });

  test('enfoca el primer campo inválido (Nombre)', async ({ page }) => {
    await gotoContact(page);

    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(page.getByLabel('Nombre')).toBeFocused();
  });

  test('correo con formato inválido bloquea el envío y marca solo el correo', async ({ page }) => {
    await gotoContact(page);

    await page.getByLabel('Nombre').fill(VALID.name);
    await page.getByLabel('Correo').fill('no-es-un-correo');
    await page.getByLabel('Mensaje').fill(VALID.message);

    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(page.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Correo')).toBeFocused();
    await expect(page.getByLabel('Nombre')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Mensaje')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('¡Mensaje enviado!')).toHaveCount(0);
  });

  test('error de correo por blur aparece sin enviar', async ({ page }) => {
    await gotoContact(page);

    await page.getByLabel('Correo').fill('malo');
    await page.getByLabel('Correo').blur();

    await expect(page.getByLabel('Correo')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('form').getByRole('alert')).toHaveText('Ingresa un correo válido.');
  });
});

test.describe('Contacto — envío exitoso', () => {
  test('completar campos requeridos escribe y muestra éxito', async ({ page }) => {
    await gotoContact(page);

    await page.getByLabel('Nombre').fill(VALID.name);
    await page.getByLabel('Correo').fill(VALID.email);
    await page.getByLabel('Mensaje').fill(VALID.message);

    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(page.getByText('¡Mensaje enviado!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar otro mensaje' })).toBeVisible();
  });

  test('completar campos opcionales y tipo también envía', async ({ page }) => {
    await gotoContact(page);

    await page.getByLabel('Nombre').fill(VALID.name);
    await page.getByLabel('Correo').fill(VALID.email);
    await page.getByLabel('Teléfono').fill('+56 9 1234 5678');
    await page.getByLabel('Empresa').fill('Bar La Esquina');
    await page.getByLabel('Tipo de consulta').selectOption({ label: 'General' });
    await page.getByLabel('Mensaje').fill(VALID.message);

    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(page.getByText('¡Mensaje enviado!')).toBeVisible();
  });

  test('"Enviar otro mensaje" resetea y vuelve al formulario vacío', async ({ page }) => {
    await gotoContact(page);

    await page.getByLabel('Nombre').fill(VALID.name);
    await page.getByLabel('Correo').fill(VALID.email);
    await page.getByLabel('Mensaje').fill(VALID.message);
    await page.getByRole('button', { name: 'Enviar mensaje' }).click();

    await expect(page.getByText('¡Mensaje enviado!')).toBeVisible();

    await page.getByRole('button', { name: 'Enviar otro mensaje' }).click();

    // De vuelta al form, con los campos limpios.
    await expect(page.getByRole('button', { name: 'Enviar mensaje' })).toBeVisible();
    await expect(page.getByLabel('Nombre')).toHaveValue('');
    await expect(page.getByLabel('Correo')).toHaveValue('');
    await expect(page.getByLabel('Mensaje')).toHaveValue('');
  });
});
