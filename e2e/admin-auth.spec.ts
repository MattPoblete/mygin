import { test, expect } from '@playwright/test';
import { ADMIN, USER, passAgeGate } from './support/helpers';

/**
 * Autenticación del panel admin (`/admin`, `components/admin/LoginScreen.tsx`).
 *
 * Estos specs ejercitan el login en sí, así que NO usan el storageState del admin:
 * cada test arranca en contexto limpio (no autenticado) y loguea vía la UI.
 * El emulador de auth tiene sembrados:
 *   - admin@test.local (claim admin:true)  → dashboard
 *   - user@test.local  (sin claim admin)   → pantalla "Sin permisos"
 */

// Anula el storageState global: estos tests deben empezar sin sesión.
test.use({ storageState: { cookies: [], origins: [] } });

async function gotoLogin(page: import('@playwright/test').Page) {
  await passAgeGate(page);
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: /Ingresar/ })).toBeVisible();
}

test.describe('Admin — pantalla de login', () => {
  test('sin sesión muestra el formulario de login y opciones', async ({ page }) => {
    await gotoLogin(page);

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: /Ingresar/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: '¿Olvidaste tu contraseña?' })).toBeVisible();

    // No debe verse el dashboard aún.
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0);
  });

  test('credenciales incorrectas muestran error', async ({ page }) => {
    await gotoLogin(page);

    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: /Ingresar/ }).click();

    await expect(page.getByRole('alert')).toContainText(/Credenciales/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0);
  });
});

test.describe('Admin — recuperación de contraseña', () => {
  test('reset con email vacío pide escribir el email', async ({ page }) => {
    await gotoLogin(page);

    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();

    await expect(page.getByRole('alert')).toContainText(/email/i);
  });

  test('reset con email válido muestra aviso de envío', async ({ page }) => {
    await gotoLogin(page);

    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();

    // El emulador acepta sendPasswordResetEmail → role=status con /enviamos/.
    await expect(page.getByRole('status')).toContainText(/enviamos/i);
  });
});

test.describe('Admin — login según rol', () => {
  test('admin entra al dashboard', async ({ page }) => {
    await gotoLogin(page);

    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Contraseña').fill(ADMIN.password);
    await page.getByRole('button', { name: /Ingresar/ }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('usuario sin permisos ve la pantalla "Sin permisos"', async ({ page }) => {
    await gotoLogin(page);

    await page.getByLabel('Email').fill(USER.email);
    await page.getByLabel('Contraseña').fill(USER.password);
    await page.getByRole('button', { name: /Ingresar/ }).click();

    await expect(page.getByRole('heading', { name: 'Sin permisos' })).toBeVisible({
      timeout: 15_000,
    });
    // Muestra el email de la sesión y la opción de cerrar sesión.
    await expect(page.getByText(USER.email)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Cerrar sesión / cambiar de cuenta' }),
    ).toBeVisible();

    // No accede al dashboard.
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0);
  });
});
