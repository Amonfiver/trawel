import { expect, test } from '@playwright/test';

test('la ruta editorial privada pide sesión en viewport móvil sin mostrar borradores', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/editorial/destinos/cuenca');

  await expect(page.getByRole('heading', { name: /cuenca · borradores sin publicar/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /entrar al lector privado/i })).toBeVisible();
  await expect(page.getByText('DRAFT / UNPUBLISHED')).toHaveCount(0);
});
