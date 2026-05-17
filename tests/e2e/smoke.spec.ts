import { expect, test } from '@playwright/test';

test('loads the public home page shell', async ({ page }) => {
  await page.goto('/');

  // Logo en el hero header (header ahora integrado en HomePage)
  await expect(page.getByRole('link', { name: 'Trawel Atlas' })).toBeVisible();
  
  // Titular principal
  await expect(
    page.getByRole('heading', {
      name: /el mundo no empieza en una lista/i,
    }),
  ).toBeVisible();
  
  // CTA principal
  await expect(page.getByRole('link', { name: /abrir el atlas/i })).toBeVisible();
  
  // Footer navigation
  await expect(
    page.getByRole('navigation', { name: /enlaces de pie de p.gina/i }),
  ).toBeVisible();
});
