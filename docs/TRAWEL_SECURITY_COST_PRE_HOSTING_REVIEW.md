# Trawel Security Cost Pre-Hosting Review

Fecha: 2026-07-09.
Bloques: 85-89.

## Resumen

Trawel queda preparado para salir a hosting estatico con railes de coste, rate limit logico, politica de retencion y contrato seguro para fotos futuras.

La subida real de fotos NO esta activada.

## Bloques Cerrados

### Bloque 85

Creada la base de railes de coste:

- `system_flags`.
- `storage_usage_events`.
- `moderation_cleanup_queue`.
- `photo_uploads_enabled=false`.
- Limites de fotos, envios, storage pendiente y retencion.

### Bloque 86

Aplicado rate limit logico a formularios protegidos:

- `public_submission_events`.
- Hash SHA-256 de email normalizado.
- Hash de IP si hay cabecera disponible.
- Limites por email hash leidos desde `system_flags`.
- Respuesta `429` amable.
- Eventos aceptados y rechazados sin emails en claro.

Nota: la IP se registra como hash cuando existe cabecera, pero no se usa como bloqueo por fiabilidad variable del entorno.

### Bloque 87

Definida caducidad de colas:

- Pendientes no eternos.
- Mensajes pendientes: 90 dias.
- Mensajes rechazados/spam: 30 dias.
- Reportes pendientes: 90 dias.
- Fotos pendientes futuras: 30 dias.
- Helpers internos de auditoria y encolado sin borrado automatico.

### Bloque 88

Preparado contrato futuro de fotos:

- Flujo `guarded-photo-upload` documentado, no creado.
- Storage privado para pendientes.
- Sin bucket publico para pendientes.
- Sin `service_role` en frontend.
- Sin subida directa anonima.
- Sin originales gigantes permanentes.

### Bloque 89

Revision local final:

- `npm run build` OK.
- Rutas criticas revisadas en local.
- Formularios siguen protegidos por Turnstile.
- Sin token no envian.
- Con token simulado envian a `protected-public-submit`.
- `dist/index.html` existe.
- `dist/.htaccess` fue recreado tras build.

## Riesgos Cerrados

- Formularios publicos ya no dependen solo de Turnstile.
- Hay limites por email hash.
- Hay eventos internos para auditoria de abuso.
- Hay flags de apagado rapido.
- Fotos reales quedan apagadas por flag global.
- Pendientes y rechazados tienen politica de caducidad.
- No hay buckets abiertos para pendientes.
- No hay `service_role` en frontend.
- `.env.local` esta ignorado.

## Pendiente Antes De Produccion Real

Aplicar migraciones nuevas en Supabase remoto:

```bash
npx supabase db push --linked
```

Migraciones nuevas de esta tanda:

- `011_create_cost_guardrails.sql`.
- `012_create_public_submission_events.sql`.
- `013_create_cleanup_helpers.sql`.

Desplegar Edge Function modificada:

```bash
npx supabase functions deploy protected-public-submit
```

No desplegar ni crear `guarded-photo-upload` todavia.

## Checklist Antes De Subir A Hostinger

- [ ] Ejecutar `npm run build`.
- [ ] Confirmar `dist/index.html`.
- [ ] Confirmar o recrear `dist/.htaccess`.
- [ ] Subir el contenido de `dist/`, no la carpeta como subcarpeta.
- [ ] Configurar variables `VITE_` antes del build real:
  - `VITE_SUPABASE_URL`.
  - `VITE_SUPABASE_ANON_KEY`.
  - `VITE_TURNSTILE_SITE_KEY`.
- [ ] Confirmar `TURNSTILE_SECRET_KEY` en Supabase secrets.
- [ ] Anadir dominio real en Cloudflare Turnstile.
- [ ] Aplicar migraciones 011-013 en remoto.
- [ ] Desplegar `protected-public-submit`.

## Checklist Online Post-Deploy

- [ ] Abrir `/`.
- [ ] Abrir y recargar `/contacto`.
- [ ] Abrir y recargar `/compartir`.
- [ ] Abrir y recargar `/comunidad`.
- [ ] Abrir y recargar `/pais/mexico`.
- [ ] Abrir y recargar `/pais/espana`.
- [ ] Abrir y recargar `/pais/espana/zona/castellon`.
- [ ] Probar contacto con Turnstile real.
- [ ] Probar compartir con Mexico + Chihuahua.
- [ ] Probar compartir con ciudad manual.
- [ ] Probar reporte publico.
- [ ] Revisar consola sin errores bloqueantes.
- [ ] Revisar movil.
- [ ] Revisar `user_messages` desde SQL Editor.
- [ ] Revisar `public_submission_events` desde SQL Editor.

## Confirmacion Fotos

Fotos reales:

- [x] No estan activadas.
- [x] No se suben realmente desde `/compartir`.
- [x] Siguen como `photo_upload_pending=true` cuando el usuario adjunta fotos.
- [x] `photo_uploads_enabled=false`.
- [x] No se abrio Storage.
- [x] No se creo `guarded-photo-upload`.

## Verificacion Local Ejecutada

Build:

```text
npm run build: OK
```

Rutas revisadas:

- `/`: 200.
- `/contacto`: 200.
- `/compartir`: 200.
- `/comunidad`: 200.
- `/pais/mexico`: 200.
- `/pais/espana`: 200.
- `/pais/espana/zona/castellon`: 200.

Formularios:

- `/contacto`: deshabilitado sin token, habilitado con token simulado.
- `/compartir`: deshabilitado sin token, habilitado con token simulado.
- Reporte publico: deshabilitado sin token, habilitado con token simulado.

Hosting:

- `dist/index.html`: existe.
- `dist/.htaccess`: recreado tras build.
- Nota: Vite limpia `dist/`; recrear `.htaccess` despues de cada build antes de subir.

