import { expect, test } from '@playwright/test';

test('Cuenca se consume como destino público desde location_cities', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pais/espana/cuenca');

  await expect(page.getByRole('heading', { name: 'Cuenca', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /cuenca.*aventureros/i })
  ).toBeVisible();
  await expect(page.getByText(/borradores sin publicar|lector privado|aprobar contenido/i)).toHaveCount(0);

});
