import { test as setup, expect } from '@playwright/test';
import { ADMIN, ADMIN_STORAGE, passAgeGate } from './support/helpers';

/**
 * Setup project: loguea al admin de prueba (sembrado en el emulador) vía la UI y
 * guarda el storageState para que los specs de admin no re-logueen cada vez.
 */
setup('authenticate admin', async ({ page }) => {
  await passAgeGate(page);
  await page.goto('/admin');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Contraseña').fill(ADMIN.password);
  await page.getByRole('button', { name: /Ingresar/ }).click();

  // El dashboard de admin debe cargar (claim admin presente).
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible({ timeout: 15_000 });

  await page.context().storageState({ path: ADMIN_STORAGE });
});
