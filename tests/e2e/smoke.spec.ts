import { expect, test } from '@playwright/test';

test('loads the public home page shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('header').getByRole('link', { name: /trawel/i })).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: /historias reales para viajes inolvidables/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /explora el mapa/i })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: /enlaces de pie de p.gina/i }),
  ).toBeVisible();
});
