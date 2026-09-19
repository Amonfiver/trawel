import { expect, test } from '@playwright/test';

test('Cuenca se consume como destino público desde location_cities', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pais/espana/cuenca');

  await expect(page.getByRole('heading', { name: 'Cuenca', exact: true })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="zone-editorial-title"] h2')).toBeVisible();
  await expect(page.getByText(/borradores sin publicar|lector privado|aprobar contenido/i)).toHaveCount(0);

});

test('Cuenca Student muestra las secciones educativas públicas completas', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'student');
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pais/espana/cuenca');

  await expect(page.getByRole('heading', { name: /historia en pocas claves/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /naturaleza y ciencia/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /preguntas para aprender/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /preparar el presupuesto/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /límite útil para aprender/i })).toBeVisible();
  await expect(page.getByText(/borradores sin publicar|lector privado|aprobar contenido/i)).toHaveCount(0);
});
