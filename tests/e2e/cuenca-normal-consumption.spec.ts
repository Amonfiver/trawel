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
  await expect(page.getByRole('heading', { name: 'Qué te espera' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No te pierdas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'La mirada completa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Siguiente en No te pierdas' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente en No te pierdas' }).evaluate((button) => (
    (button as HTMLButtonElement).click()
  ));
  await expect(page.locator('[aria-live="polite"]').first()).toHaveText(/2 de/);
  await expect(page.locator('#aventura-galeria img')).toHaveCount(4);
  await expect(page.getByText(/borradores sin publicar|lector privado|aprobar contenido/i)).toHaveCount(0);

});

test('Adventure conserva carruseles táctiles sin overflow horizontal en viewports focalizados', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.goto('/pais/espana/cuenca');

  for (const width of [360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'Cuenca', exact: true })).toBeVisible();
    await expect(page.locator('[data-experience-mode="adventure"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  const ctaBox = await page.getByRole('link', { name: /descubrir cuenca/i }).boundingBox();
  expect(ctaBox?.height).toBeGreaterThanOrEqual(44);
});

test('el cambio de modo mantiene Adventure inmersivo y Student enciclopédico', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.goto('/pais/espana/cuenca');

  await expect(page.getByRole('heading', { name: 'No te pierdas' })).toBeVisible();
  await page.getByTitle('Modo Estudiante').click();
  await expect(page.locator('[data-experience-mode="student"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Historia', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No te pierdas' })).toHaveCount(0);
});

test('Adventure respeta la preferencia de movimiento reducido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.goto('/pais/espana/cuenca');

  await expect(page.locator('[data-experience-mode="adventure"]')).toBeVisible();
  expect(await page.locator('[data-experience-mode="adventure"]').evaluate((element) => (
    getComputedStyle(element).animationName
  ))).toBe('none');
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
