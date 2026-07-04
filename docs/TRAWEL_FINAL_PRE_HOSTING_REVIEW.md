# Trawel Final Pre-Hosting Review

Revision final local antes de preparar hosting multiweb de pago.

Fecha: 2026-07-04.
Bloque: 69.
Resultado: listo para preparar hosting multiweb.

## 1. Resumen Ejecutivo

Trawel esta en fase candidata a hosting.

- Es un producto real inicial, no una demo aislada.
- Supabase real `trawel-prod` esta conectado.
- Home, paises, zonas y paginas trust funcionan con datos remotos progresivos y fallback local.
- Las colaboraciones publicas estan controladas mediante colas privadas.
- Nada enviado por usuarios se publica directamente.
- Las fotos se estandarizan localmente, pero la subida real queda pendiente de una via segura futura.

## 2. Rutas Verificadas

Rutas revisadas en `npm run preview`:

- [x] `/`
- [x] `/contacto`
- [x] `/compartir`
- [x] `/pais/mexico`
- [x] `/pais/espana`
- [x] `/pais/espana/zona/albarracin`
- [x] `/privacidad`
- [x] `/cookies`
- [x] `/terminos`
- [x] `/sobre-trawel`

Resultado:

- Todas respondieron `200`.
- No aparecieron errores bloqueantes de consola durante la revision automatizada.

## 3. Checklist Navegacion

- [x] Contacto visible en menu desktop.
- [x] Contacto visible en movil.
- [x] Links principales funcionan.
- [x] Header no rompe responsive en desktop ni movil.
- [x] Rutas internas principales cargan desde preview.

## 4. Checklist `/compartir`

- [x] Carga paises desde Supabase.
- [x] Carga zonas dependientes desde Supabase.
- [x] Tipo de colaboracion funciona.
- [x] Foto de encabezado se puede preseleccionar por query params con `tipo=hero_photo`.
- [x] Experiencia/aventura se puede preseleccionar con `tipo=experience` o `tipo=adventure`.
- [x] Experiencia/aventura muestra `Titulo de la experiencia`.
- [x] Fotos opcionales limitadas a maximo 3.
- [x] Fotos se estandarizan a WebP localmente.
- [x] Se muestra preview de la foto procesada.
- [x] Se puede quitar una foto antes de enviar.
- [x] Se envia metadata correcta a `user_messages`.
- [x] Nada se publica directamente.

Metadata verificada en envio real de prueba:

- `source='trust_page_share_form'`.
- `country_slug='espana'`.
- `zone_slug='albarracin'`.
- `contribution_type='experiencia_aventura'`.
- `experience_title`.
- `photo_count=1`.
- `photo_standardization=true`.
- `photo_upload_pending=true`.

## 5. Checklist Formularios Reales

- [x] `/contacto` inserta en `user_messages`.
- [x] `/compartir` inserta en `user_messages`.
- [x] `Reportar contenido` inserta en `content_reports`.
- [x] Todas las entradas verificadas entraron como `pending_review`.
- [x] Las filas test fueron eliminadas despues de la verificacion.

Filas test creadas y borradas:

- `user_messages`: 2 filas.
  - Contacto.
  - Compartir experiencia/aventura con foto local estandarizada.
- `content_reports`: 1 fila.
  - Reporte sobre `/sobre-trawel`.

## 6. Checklist Fotos

- [x] Estandarizacion local OK.
- [x] Entrada JPG/PNG/WebP preparada.
- [x] Salida WebP verificada en preview.
- [x] Preview visible.
- [x] Eliminacion de foto antes de enviar verificada.
- [x] Storage privado auditado en bloque 66.
- [x] No hay upload anon seguro para `traveler-adventure-photos`.
- [x] Decision segura documentada en `docs/TRAWEL_PRIVATE_PHOTO_UPLOAD_DECISION.md`.
- [x] No se abrio el bucket.
- [x] No hay `service_role` en frontend.

## 7. Checklist Supabase

- [x] `trawel-prod` conectado.
- [x] `countries` responde.
- [x] `cities` responde.
- [x] `user_messages` recibe contacto y compartir.
- [x] `content_reports` recibe reportes.
- [x] `user_photo_submissions` esta preparada como cola privada para fotos futuras.
- [x] Colas sin lectura publica validada por ausencia de `SELECT` publico util desde cliente anon durante pruebas previas y auditorias documentadas.

Tablas relevantes:

- `countries`.
- `cities`.
- `user_messages`.
- `content_reports`.
- `user_photo_submissions`.

## 8. Checklist Produccion Local

- [x] `npm run build`.
- [x] `npm run preview`.
- [x] Revision de consola sin errores bloqueantes.
- [x] Revision de rutas internas.
- [x] Revision responsive desktop/movil.
- [x] Formularios reales probados.
- [x] Filas test eliminadas.

Resultado de build:

- `npm run build` pasa.
- Aviso conocido: chunk grande de Vite. No bloquea el deploy inicial.
- Carpeta `dist/` generada.

## 9. Decision

Decision marcada:

- [x] Listo para preparar hosting multiweb.
- [ ] Requiere fixes antes de hosting.

No se han detectado bugs bloqueantes durante la revision final local.

Condiciones antes de deploy real:

- Elegir hosting.
- Configurar fallback SPA.
- Configurar `VITE_SUPABASE_URL`.
- Configurar `VITE_SUPABASE_ANON_KEY`.
- No configurar `SUPABASE_SERVICE_ROLE_KEY` como variable frontend.
- Repetir pruebas online post-deploy y borrar filas test.

## 10. Proximos Pasos

- Bloque 70: elegir hosting multiweb de pago.
- Bloque 71: preparar deploy segun hosting elegido.
- Bloque 72: subida real.
- Bloque 73: validacion online.

## 11. Alcance Respetado

- No se toco `src/`.
- No se toco UI.
- No se toco Storage.
- No se tocaron migrations.
- No se tocaron seeds.
- No se tocaron mapas, rutas ni `package.json`.
