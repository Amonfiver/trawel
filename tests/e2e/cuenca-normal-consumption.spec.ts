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
  const heroImage = page.locator('header[aria-label] img');
  await expect(heroImage).toHaveAttribute('src', /\/destinations\/cuenca\/shared\/hero\/casas-colgadas-atardecer\.png$/);
  await expect(heroImage).toHaveAttribute('fetchpriority', 'high');
  await expect(page.getByRole('heading', { name: 'Por qué ir' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Qué te espera' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No te pierdas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'La mirada completa' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Siguiente en No te pierdas' })).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente en No te pierdas' }).evaluate((button) => (
    (button as HTMLButtonElement).click()
  ));
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'No te pierdas' })).toHaveText(/2 de/);
  await expect(page.locator('#aventura-galeria img')).toHaveCount(4);
  await expect(page.locator('section[aria-labelledby="adventure-expectations-title"] img')).toHaveCount(4);
  await expect(page.locator('section[aria-labelledby="adventure-highlights-title"] img')).toHaveCount(6);
  await expect(page.locator('#aventura-galeria img').first()).toHaveAttribute('loading', 'lazy');
  await expect(page.locator('#aventura-galeria img').first()).toHaveAttribute('decoding', 'async');
  await expect(page.locator('[data-traveler-experiences="true"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Experiencias de viajeros' })).toBeVisible();
  await expect(page.locator('[data-ai-notice="true"]')).toContainText(/ilustrativas generadas con IA/i);
  await expect(page.locator('[data-experience-type="AI_SAMPLE"]')).toHaveCount(4);
  await expect(page.getByText('Generada con IA')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Cuéntanos tu experiencia' })).toBeDisabled();
  await expect(page.getByText(/Próximamente: podrás compartir una experiencia real/i)).toBeVisible();
  const businessLayer = page.locator('[data-destination-business="true"]');
  await expect(businessLayer).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dónde alojarte' })).toBeVisible();
  const businessNext = page.getByRole('button', { name: 'Siguiente en Propuestas locales' });
  await businessNext.click();
  await expect(page.getByRole('heading', { name: 'Dónde comer' })).toBeVisible();
  await businessNext.click();
  await expect(page.getByRole('heading', { name: 'Experiencias locales' })).toBeVisible();
  await expect(businessLayer.locator('[data-business-status="PLACEHOLDER"]')).toHaveCount(3);
  await expect(businessLayer.getByText('Espacio disponible')).toHaveCount(3);
  await expect(businessLayer.locator('article img')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Quiero aparecer en Trawel' })).toBeDisabled();
  await expect(page.getByText(/borradores sin publicar|lector privado|aprobar contenido/i)).toHaveCount(0);

});

test('Adventure aplica fallback premium solo cuando falla un asset del manifest', async ({ page }) => {
  await page.route('**/destinations/cuenca/shared/hero/casas-colgadas-atardecer.png', (route) => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.goto('/pais/espana/cuenca');

  await expect(page.locator('[data-media-fallback="true"]').first()).toBeVisible();
  await expect(page.locator('header[aria-label] img')).toHaveCount(0);
});

test('detecta un manifest capturado por la SPA en vez de ocultar el fallo', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.route('**/destinations/cuenca/manifest.json', (route) => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html><body><div id="root"></div></body></html>',
  }));
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.goto('/pais/espana/cuenca');

  await expect.poll(() => warnings.some((warning) => (
    warning.includes('content-type inesperado') && warning.includes('/destinations/cuenca/manifest.json')
  ))).toBe(true);
  await expect(page.locator('img[src^="/destinations/cuenca/"]')).toHaveCount(0);
});

test('Adventure conserva carruseles táctiles sin overflow horizontal en viewports focalizados', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.goto('/pais/espana/cuenca');

  for (const width of [360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'Cuenca', exact: true })).toBeVisible();
    await expect(page.locator('[data-experience-mode="adventure"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  const ctaBox = await page.getByRole('link', { name: /descubrir cuenca/i }).boundingBox();
  expect(ctaBox?.height).toBeGreaterThanOrEqual(44);
});

test('AdventureCarousel desplaza contenido real con flechas, teclado y arrastre de ratón', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/pais/espana/cuenca');

  const track = page.locator('[data-carousel-track="Qué te espera"]');
  const counter = page.locator('[aria-live="polite"]').filter({ hasText: 'Qué te espera' });
  const next = page.getByRole('button', { name: 'Siguiente en Qué te espera' });
  await track.scrollIntoViewIfNeeded();
  await expect(track).toHaveCSS('overflow-x', 'auto');
  await expect(track).toHaveCSS('scroll-snap-type', 'x mandatory');
  await expect(counter).toHaveText('1 de 4: Qué te espera');

  const initialScroll = await track.evaluate((element) => element.scrollLeft);
  await next.click();
  await expect(counter).toHaveText('2 de 4: Qué te espera');
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(initialScroll);

  await track.focus();
  await page.keyboard.press('ArrowRight');
  await expect(counter).toHaveText('3 de 4: Qué te espera');

  const box = await track.boundingBox();
  if (!box) throw new Error('Carousel track is not measurable');
  const beforeDrag = await track.evaluate((element) => element.scrollLeft);
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(beforeDrag);
  await expect(track).toHaveAttribute('data-dragging', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('AdventureCarousel conserva swipe nativo y peek intencional en móvil', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.goto('/pais/espana/cuenca');

  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const metrics = await page.locator('[data-carousel-track="Qué te espera"]').evaluate((track) => {
      const secondCard = track.children.item(1) as HTMLElement;
      const trackRect = track.getBoundingClientRect();
      const secondRect = secondCard.getBoundingClientRect();
      return {
        clientWidth: track.clientWidth,
        scrollWidth: track.scrollWidth,
        overflowX: getComputedStyle(track).overflowX,
        snap: getComputedStyle(track).scrollSnapType,
        secondCardPeeks: secondRect.left < trackRect.right && secondRect.right > trackRect.right,
      };
    });

    expect(metrics.overflowX).toBe('auto');
    expect(metrics.snap).toBe('x mandatory');
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    expect(metrics.secondCardPeeks).toBe(true);

    const travelerMetrics = await page.locator('[data-carousel-track="Experiencias de viajeros"]').evaluate((track) => ({
      clientWidth: track.clientWidth,
      scrollWidth: track.scrollWidth,
      overflowX: getComputedStyle(track).overflowX,
      snap: getComputedStyle(track).scrollSnapType,
    }));
    expect(travelerMetrics.overflowX).toBe('auto');
    expect(travelerMetrics.snap).toBe('x mandatory');
    expect(travelerMetrics.scrollWidth).toBeGreaterThan(travelerMetrics.clientWidth);

    const businessMetrics = await page.locator('[data-carousel-track="Propuestas locales"]').evaluate((track) => ({
      clientWidth: track.clientWidth,
      scrollWidth: track.scrollWidth,
      overflowX: getComputedStyle(track).overflowX,
      snap: getComputedStyle(track).scrollSnapType,
    }));
    expect(businessMetrics.overflowX).toBe('auto');
    expect(businessMetrics.snap).toBe('x mandatory');
    expect(businessMetrics.scrollWidth).toBeGreaterThan(businessMetrics.clientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('Adventure presenta muestras IA transparentes y un carrusel de experiencias reutilizable', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/pais/espana/cuenca');

  const section = page.locator('[data-traveler-experiences="true"]');
  const track = page.locator('[data-carousel-track="Experiencias de viajeros"]');
  const counter = page.locator('[aria-live="polite"]').filter({ hasText: 'Experiencias de viajeros' });
  await section.scrollIntoViewIfNeeded();
  await expect(track).toHaveCSS('overflow-x', 'auto');
  await expect(track).toHaveCSS('scroll-snap-type', 'x mandatory');
  await expect(counter).toHaveText('1 de 4: Experiencias de viajeros');
  await page.getByRole('button', { name: 'Siguiente en Experiencias de viajeros' }).click();
  await expect(counter).toHaveText('2 de 4: Experiencias de viajeros');
  await expect(section.locator('[data-experience-type="REAL_USER"]')).toHaveCount(0);
  await expect(section.locator('img')).toHaveCount(1);
});

test('Adventure presenta slots comerciales transparentes y contextuales', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('trawel-experience-mode', 'adventure');
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/pais/espana/cuenca');

  const layer = page.locator('[data-destination-business="true"]');
  const track = page.locator('[data-carousel-track="Propuestas locales"]');
  const counter = page.locator('[aria-live="polite"]').filter({ hasText: 'Propuestas locales' });
  await layer.scrollIntoViewIfNeeded();
  await expect(track).toHaveCSS('overflow-x', 'auto');
  await expect(track).toHaveCSS('scroll-snap-type', 'x mandatory');
  await expect(counter).toHaveText('1 de 3: Propuestas locales');
  await page.getByRole('button', { name: 'Siguiente en Propuestas locales' }).click();
  await expect(counter).toHaveText('2 de 3: Propuestas locales');
  await expect(layer.locator('[data-business-status="READY"]')).toHaveCount(0);
  await expect(layer.locator('[data-business-category="STAY"]')).toHaveCount(1);
  await expect(layer.locator('[data-business-category="EAT"]')).toHaveCount(1);
  await expect(layer.locator('[data-business-category="LOCAL_EXPERIENCE"]')).toHaveCount(1);
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
  await expect(page.locator('[data-traveler-experiences]')).toHaveCount(0);
  await expect(page.locator('[data-destination-business]')).toHaveCount(0);
});
