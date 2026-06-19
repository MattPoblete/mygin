import { test, expect } from '@playwright/test';

/**
 * AgeGate (+18) — barrera legal global. Este es el ÚNICO spec que NO usa
 * passAgeGate: necesita ver el modal nativo <dialog class="age-gate">.
 */
test.describe('AgeGate (+18)', () => {
  test('se muestra en la primera visita', async ({ page }) => {
    await page.goto('/');
    const dialog = page.locator('dialog.age-gate');
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('heading', { name: '¿Eres mayor de edad?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sí, soy mayor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No', exact: true })).toBeVisible();
  });

  test('"No" muestra "Lo sentimos" y "Volver" regresa a la pregunta', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'No', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Lo sentimos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Volver' })).toBeVisible();

    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByRole('heading', { name: '¿Eres mayor de edad?' })).toBeVisible();
  });

  test('"Sí, soy mayor" cierra el gate y persiste tras recargar', async ({ page }) => {
    await page.goto('/');
    const dialog = page.locator('dialog.age-gate');
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: 'Sí, soy mayor' }).click();
    await expect(dialog).toBeHidden();

    // Persistencia: misma sesión/contexto → no reaparece tras recargar.
    await page.reload();
    await expect(page.locator('dialog.age-gate')).toBeHidden();
  });

  test('Escape no cierra la barrera legal', async ({ page }) => {
    await page.goto('/');
    const dialog = page.locator('dialog.age-gate');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
  });
});
