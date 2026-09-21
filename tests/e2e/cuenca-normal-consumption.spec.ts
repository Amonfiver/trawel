import { expect, test } from '@playwright/test';

test('Cuenca se consume como destino público desde location_cities', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pais/espana/cuenca');

  await expect(page.getByRole('heading', { name: 'Cuenca', exact: true })).toBeVisible();
  await expect(
    page.locator('header').getByRole('img', { name: /Casas Colgadas de Cuenca iluminadas al atardecer/i })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Por qué ir' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cuenca en varias escalas' })).toBeVisible();
  await expect(page.locator('#aventura-galeria img')).toHaveCount(4);
  await expect(page.getByText(/borradores sin publicar|lector privado|aprobar contenido/i)).toHaveCount(0);

});

test('Cuenca Student muestra las secciones educativas públicas completas', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'student');
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pais/espana/cuenca');

  await expect(page.getByRole('img', { name: /Barranco boscoso y paredes calizas/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Historia', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /naturaleza, geología y ciencia/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /para comprender mejor/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /datos y conceptos clave/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /visión de conjunto/i })).toBeVisible();
  await expect(page.getByText(/borradores sin publicar|lector privado|aprobar contenido/i)).toHaveCount(0);
});
