# Trawel Post-Deploy Checklist

Checklist de validacion online tras subir Trawel a hosting real.

Fecha: 2026-07-09.
Bloque: 84.

## 1. Sitio Online

- [ ] Abrir la home online.
- [ ] Confirmar que logo, hero, atlas y enlaces principales cargan.
- [ ] Confirmar que los assets de `dist/assets/` cargan sin 404.
- [ ] Confirmar que no hay errores bloqueantes en consola.

## 2. Rutas Internas Con Recarga Directa

Abrir cada ruta pegandola directamente en el navegador y recargar:

- [ ] `/`
- [ ] `/contacto`
- [ ] `/compartir`
- [ ] `/comunidad`
- [ ] `/pais/mexico`
- [ ] `/pais/espana`
- [ ] `/pais/espana/zona/castellon`

Resultado esperado:

- [ ] Todas cargan Trawel.
- [ ] Ninguna muestra 404 del hosting.
- [ ] El fallback SPA de `.htaccess` funciona.

## 3. Turnstile Online

- [ ] Confirmar que Cloudflare Turnstile reconoce el hostname real.
- [ ] Confirmar que el widget carga en `/contacto`.
- [ ] Confirmar que el widget carga en `/compartir`.
- [ ] Confirmar que el widget carga en el reporte publico de TrustPage.
- [ ] Confirmar que Turnstile marca exito y habilita envio.

## 4. Formularios Publicos

Contacto:

- [ ] Enviar una prueba desde `/contacto`.
- [ ] Confirmar mensaje de exito.
- [ ] Confirmar que no envia sin token Turnstile.

Compartir:

- [ ] Enviar una prueba desde `/compartir` con Mexico + Chihuahua.
- [ ] Enviar una prueba desde `/compartir` con ciudad manual inventada.
- [ ] Confirmar mensajes de exito.
- [ ] Confirmar que no envia sin token Turnstile.

Reporte publico:

- [ ] Abrir un bloque TrustPage, por ejemplo `/sobre-trawel`.
- [ ] Abrir `Reportar contenido`.
- [ ] Enviar reporte de prueba.
- [ ] Confirmar mensaje de exito.
- [ ] Confirmar que no envia sin token Turnstile.

## 5. Supabase

Desde Supabase SQL Editor:

- [ ] Comprobar filas recientes en `user_messages`.
- [ ] Confirmar contacto con `source_page='contacto'`.
- [ ] Confirmar compartir con `source_page='compartir'`.
- [ ] Confirmar `status='pending_review'`.
- [ ] Confirmar metadata de ciudad/zona cuando aplique.
- [ ] Confirmar que el cliente anon no puede leer `user_messages`.

Consulta sugerida:

```sql
select
  id,
  created_at,
  status,
  type,
  kind,
  source_page,
  name,
  email,
  subject,
  country_slug,
  zone_slug,
  message,
  metadata
from user_messages
order by created_at desc
limit 10;
```

Si se prueba reporte publico, revisar tambien `content_reports` desde SQL Editor.

## 6. Movil

- [ ] Abrir home en movil real o responsive mode.
- [ ] Revisar header y navegacion.
- [ ] Revisar `/contacto`.
- [ ] Revisar `/compartir`.
- [ ] Revisar autocomplete de ciudad.
- [ ] Revisar Turnstile en pantalla pequena.
- [ ] Confirmar que no hay solapamientos ni cortes graves.

## 7. Cierre

- [ ] Borrar filas test si no deben conservarse.
- [ ] Documentar dominio final.
- [ ] Documentar resultado de formularios online.
- [ ] No publicar contenido de usuario directamente.

