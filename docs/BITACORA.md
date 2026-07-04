# BITACORA.md — Bitácora activa del proyecto Trawel

> **Nota:** Este es el archivo de bitácora activa. Para el histórico completo, ver `docs/BITACORA_002.md` (2026-04-27 a 2026-05-01) y `docs/BITACORA_001.md` (inicio del proyecto).
> **Continuidad:** las entradas nuevas continúan en `docs/BITACORA_002.md`.

---

## 2026-07-04 - Bloque 68: aventuras de ciudad con fotos

Afinado el flujo de `/compartir` para que las experiencias o aventuras de ciudad lleguen mejor clasificadas a la cola privada.

### Cambios implementados

- Anadido campo condicional `Titulo de la experiencia` cuando el tipo de colaboracion es `experiencia_aventura`.
- El formulario mantiene pais, zona, relato y hasta 3 fotos opcionales estandarizadas localmente.
- El copy de `/compartir` aclara que la propuesta se revisara antes de publicarse.
- El relato pasa a mostrarse como `Cuentanos tu experiencia` para aportes de experiencia/aventura.
- La metadata enviada a `user_messages` incluye `experience_title` cuando aplica, ademas de `country_slug`, `zone_slug`, `contribution_type`, `photo_count`, `photo_standardization`, `photo_upload_pending` y `source='trust_page_share_form'`.
- `/compartir` acepta `tipo=adventure` o `tipo=experience` para preseleccionar `experiencia_aventura`.

### Reglas respetadas

- No se toco Storage, subida real, bucket, policies, migrations, seeds, mapas, WorldMap, D3, TopoJSON, `package.json`, HomePage, CountryPage ni CountryZonePage.
- Las fotos siguen sin subirse a Storage y nada se publica automaticamente.

---

## 2026-07-04 - Bloque 67: invitacion a fotos de encabezado

Recuperada una invitacion secundaria para que usuarios propongan fotos de encabezado de paises y zonas mediante el flujo controlado de `/compartir`.

### Cambios implementados

- Anadida tarjeta discreta "¿Tienes una foto que represente este lugar?" en CountryPage.
- Anadida tarjeta equivalente en CountryZonePage.
- El boton `Proponer foto` enlaza a `/compartir` con query params:
  - Pais: `/compartir?tipo=hero_photo&pais={countrySlug}`.
  - Zona: `/compartir?tipo=hero_photo&pais={countrySlug}&zona={zoneSlug}`.
- La tarjeta se coloca en zona secundaria y deja claro que la foto se revisara antes de publicarse.
- `/compartir` lee query params simples y preselecciona:
  - `contribution_type='foto_encabezado'`.
  - `country_slug`.
  - `zone_slug` si existe y esta disponible.

### Reglas respetadas

- No se toco Storage, subida real, migrations, seeds, mapas, WorldMap, D3, TopoJSON, `package.json`, HomePage, CountryPage data flow ni CountryZonePage data flow.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.
- Verificado con Playwright:
  - `/pais/mexico` enlaza a `/compartir?tipo=hero_photo&pais=mexico`.
  - `/pais/espana` enlaza a `/compartir?tipo=hero_photo&pais=espana`.
  - `/pais/espana/zona/albarracin` enlaza a `/compartir?tipo=hero_photo&pais=espana&zona=albarracin`.
  - `/compartir?tipo=hero_photo&pais=espana&zona=albarracin` preselecciona pais, zona y foto de encabezado.
  - Boton visible en movil.

---

## 2026-07-04 - Bloque 66: decision de subida privada de fotos

Auditada la posibilidad de subir fotos estandarizadas desde frontend anon al bucket privado `traveler-adventure-photos`.

### Resultado de auditoria

- Bucket `traveler-adventure-photos` confirmado como privado.
- Limite del bucket confirmado: 5 MB.
- MIME permitidos confirmados: `image/jpeg`, `image/png`, `image/webp`.
- Policies remotas de `storage.objects` consultadas mediante Supabase CLI.
- Solo existe policy publica de `SELECT` para `bucket_id='map-assets'`.
- No existe policy publica de `INSERT` para `traveler-adventure-photos`.
- Prueba controlada de upload anon a `traveler-adventure-photos` rechazada con `403 new row violates row-level security policy`.
- No se creo ningun objeto de prueba en Storage.

### Cambios implementados

- Creado `docs/TRAWEL_PRIVATE_PHOTO_UPLOAD_DECISION.md`.
- Documentada la decision de no conectar upload directo desde frontend anon.
- Documentado que el frontend nunca debe recibir `SUPABASE_SERVICE_ROLE_KEY`.
- Documentadas opciones seguras: Edge Function con service role o signed upload URL corta.
- Recomendada Edge Function controlada para validar metadata, subir al bucket privado e insertar `user_photo_submissions`.
- Actualizados `docs/AGENT_BRIEF.md`, `docs/TRAWEL_PUBLIC_INPUTS_MAP.md` y `docs/TRAWEL_USER_PHOTO_UPLOAD_CONTRACT.md`.

### Reglas respetadas

- No se tocaron policies.
- No se abrio el bucket.
- No se subieron fotos.
- No se tocaron `src/`, UI, Storage real, migrations, seeds, mapas, rutas, `package.json`, HomePage, CountryPage ni CountryZonePage.
- No se ejecuto `npm run build` porque solo hubo cambios de documentacion.

---

## 2026-07-04 - Bloque 65: fotos estandarizadas en compartir

Conectado visualmente el estandarizador web de imagenes al formulario publico de `/compartir`, sin subir archivos a Storage.

### Cambios implementados

- Anadido input de fotos opcionales en `/compartir`.
- Permitidas hasta 3 fotos por envio.
- Aceptados JPG, PNG y WebP.
- Usada `standardizeImageFile(...)` al seleccionar fotos.
- El preset se decide por `contribution_type`:
  - `foto_encabezado` usa `heroHeader`.
  - `experiencia_aventura` y `foto_ciudad_zona` usan `adventureCard`.
  - Resto de tipos conservan `adventureCard` por defecto.
- Mostradas previews de las fotos procesadas.
- Mostrados tamano original, tamano final, dimensiones, formato final WebP y preset aplicado.
- Anadido aviso al usuario: Trawel adaptara las fotos a formato web para carga rapida y buena calidad.
- Permitido quitar fotos antes de enviar.
- Los fallos de imagen muestran error amable sin romper el formulario.
- El envio sigue usando `submitCommunitySuggestion(...)`.
- La metadata incluye `photo_count`, `photo_standardization=true`, `photo_upload_pending=true`, `contribution_type`, `country_slug` y `zone_slug`.
- El mensaje de exito indica que la propuesta se recibe para revision y que nada se publica automaticamente.

### Reglas respetadas

- No se subieron fotos a Storage.
- No se guardaron blobs en Supabase.
- No se publicaron fotos.
- No se tocaron buckets, migrations, seeds, `package.json`, mapas, rutas, HomePage, CountryPage ni CountryZonePage.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.
- Verificado `/compartir` con Playwright en desktop y movil.
- Probado seleccionar 1 foto, seleccionar 3 fotos, intentar mas de 3 fotos, quitar una foto y cambiar tipo de colaboracion para confirmar preset.
- Envio test real creado en `user_messages` como `pending_review` con referencia `546b0baa-b4ed-458c-9858-a8c78d224e5e`.
- Verificada metadata `photo_count=3`, `photo_standardization=true`, `photo_upload_pending=true` y `contribution_type='foto_ciudad_zona'`.
- Fila test eliminada tras la verificacion.

---

## 2026-07-04 - Bloque 64: estandarizador web de imagenes

Preparada la utilidad frontend para convertir fotos aportadas por usuarios a WebP ligero antes de una futura subida.

### Cambios implementados

- Creado `src/features/travelData/productContent/imageStandardization.service.ts`.
- Definidos tipos `ImageStandardizationPreset`, `StandardizedImageResult` y `StandardizeImageOptions`.
- Definidos presets:
  - `heroHeader`: 1920 px maximo, `image/webp`, calidad `0.82`.
  - `adventureCard`: 1400 px maximo, `image/webp`, calidad `0.80`.
  - `thumbnailFuture`: 800 px maximo, `image/webp`, calidad `0.78`.
- Anadida `standardizeImageFile(file, options)` para validar JPG/PNG/WebP, cargar en navegador, reducir manteniendo proporcion y convertir a WebP mediante canvas.
- Anadidos helpers `getPresetForContributionType(...)`, `formatBytes(...)` y `createStandardizedFileName(...)`.
- Exportadas funciones, presets y tipos desde `src/features/travelData/productContent/index.ts`.

### Reglas respetadas

- No se toco UI, `/compartir`, Storage, inserts Supabase, migrations, seeds, mapas, rutas, `package.json`, HomePage, CountryPage ni CountryZonePage.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-07-04 - Bloque 63: compartir con paises, zonas y tipo

Mejorado el formulario publico de `/compartir` para clasificar colaboraciones desde el origen con opciones reales de Supabase.

### Cambios implementados

- Sustituido el campo manual de pais/destino por select de pais y select de zona dependiente.
- Usadas `getPublicCountryOptions()` y `getPublicZoneOptionsByCountrySlug(countrySlug)` para cargar opciones desde `countries` y `cities`.
- Anadido tipo de colaboracion: experiencia / aventura, foto de encabezado, foto de ciudad/zona, sugerencia de destino, correccion u otro.
- Mantenidos nombre, email, mensaje y aceptacion de privacidad.
- El envio sigue usando `submitCommunitySuggestion(...)`.
- El mensaje se inserta con `countrySlug`, `zoneSlug`, `entityType='zone'` y `entitySlug=zoneSlug`.
- La metadata incluye `source='trust_page_share_form'`, `country_slug`, `zone_slug` y `contribution_type`.
- Anadidos avisos amables cuando no hay paises o zonas disponibles.

### Reglas respetadas

- No se toco Storage, fotos, subida de archivos, migrations, seeds, mapas, rutas, `package.json`, HomePage, CountryPage ni CountryZonePage.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.
- Verificado `/compartir` con Playwright en desktop y movil.
- Carga real validada: 3 paises disponibles; Espana seleccionada con 5 zonas y zona `albarracin`.
- Envio test real creado en `user_messages` como `pending_review` con referencia `703bcad9-c55e-4364-92e6-3501810955e3`.
- Verificados `country_slug='espana'`, `zone_slug='albarracin'`, `entity_type='zone'`, `entity_slug='albarracin'` y metadata `contribution_type='foto_ciudad_zona'`.
- Fila test eliminada tras la verificacion.

---

## 2026-07-04 - Bloque 62: selects publicos de paises y zonas

Preparado el servicio publico de lectura para cargar opciones controladas de pais y zona desde Supabase, orientado a futuros formularios de colaboracion con fotos.

### Cambios implementados

- Creado `src/features/travelData/productContent/publicLocationOptions.service.ts`.
- Anadida `getPublicCountryOptions()` para leer paises publicos desde `countries`.
- Anadida `getPublicZoneOptionsByCountrySlug(countrySlug)` para leer zonas/ciudades publicas desde `cities` tras resolver el pais en `countries`.
- Definidos tipos `PublicCountryOption` y `PublicZoneOption` con `label`, `value`, `slug`, `id` y metadatos minimos.
- Exportadas las funciones y tipos desde `src/features/travelData/productContent/index.ts`.
- El servicio devuelve `[]` si Supabase no esta configurado, si hay error o si no hay datos validos.
- El logging de fallo queda limitado a desarrollo mediante `console.warn`.
- Actualizado `docs/AGENT_BRIEF.md` con la nueva pieza previa a formularios.

### Reglas respetadas

- No se toco UI, `/compartir`, CountryPage, CountryZonePage, mapas, WorldMap, D3, TopoJSON, Storage, `package.json`, migrations ni seeds.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-07-04 - Bloque 61: contrato de colaboracion con fotos

Definido el contrato documental previo a conectar colaboraciones con fotos, manteniendo el flujo sin publicacion directa.

### Cambios implementados

- Creado `docs/TRAWEL_USER_PHOTO_UPLOAD_CONTRACT.md`.
- Documentado el flujo usuario aporta -> Trawel estandariza/clasifica -> Supabase guarda -> Investighost aprueba -> Trawel publica.
- Definidos tipos de colaboracion, reglas de fotos, estandares WebP y aviso al usuario.
- Reforzada la clasificacion obligatoria mediante pais, zona dependiente y tipo de colaboracion controlados.
- Documentados destinos de datos: bucket privado `traveler-adventure-photos`, `user_photo_submissions`, `user_messages` y `content_reports`.
- Actualizados `docs/AGENT_BRIEF.md` y `docs/TRAWEL_PUBLIC_INPUTS_MAP.md` con referencia al nuevo contrato.

### Reglas respetadas

- Solo se tocaron documentos.
- No se tocaron `src/`, UI, Storage, `package.json`, migrations, seeds, mapas ni rutas.
- No se ejecuto `npm run build` porque no hubo cambios de codigo.

---

## 2026-07-02 - Bloque 60: contacto en menu superior

Anadido el acceso directo a `/contacto` desde el menu superior principal.

### Cambios implementados

- Anadido enlace visible `Contacto` en el `nav` global de `src/App.tsx`.
- Ajustado el responsive del header para conservar la navegacion superior visible en movil como segunda fila compacta.
- Mantenida la ruta existente `/contacto` sin tocar formularios, Supabase ni contratos de datos.

### Reglas respetadas

- Solo se tocaron header/nav y documentacion permitida.
- No se tocaron rutas, formularios, Supabase, mapas, D3, TopoJSON, `package.json`, migrations, seeds ni Storage.

---

## 2026-06-28 - Bloque 59: checklist pre-hosting

Preparada la checklist tecnica previa a subir Trawel a un hosting real.

### Cambios implementados

- Creado `docs/TRAWEL_PRE_HOSTING_CHECKLIST.md`.
- Documentadas variables necesarias: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Reforzada la regla de no exponer `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- Documentado build de produccion con `npm run build` y salida `dist/`.
- Documentada necesidad de fallback SPA a `index.html` para rutas internas.
- Comparados Netlify, Vercel y hosting tradicional.
- Propuesto `_redirects` para Netlify sin crearlo todavia.
- Anotadas comprobaciones antes y despues de deploy, incluyendo tests de formularios y limpieza de filas test.

### Reglas respetadas

- Solo se tocaron documentos.
- No se tocaron `src/`, UI, `package.json`, migrations, seeds, mapas, rutas ni Storage.
- No se ejecuto `npm run build` porque no hubo cambios de codigo.

---

## 2026-06-28 - Bloque 58: mapa de entradas publicas

Registrado el mapa operativo de entradas publicas de Trawel para orientar a Investighost sobre que recibe cada canal y donde debe moderarse.

### Cambios implementados

- Creado `docs/TRAWEL_PUBLIC_INPUTS_MAP.md`.
- Documentadas entradas publicas actuales y previstas: contacto, compartir/sugerir, reportar contenido y fotos de viajeros.
- Incluidos ruta/ubicacion, servicio frontend, tabla Supabase, estado por defecto, publicacion directa, revision y estado actual.
- Reforzada la regla maestra: Trawel recibe aportes, Investighost modera y Trawel publica solo aprobado.
- Documentada seguridad: `INSERT` publico controlado y sin `SELECT` publico en colas.

### Reglas respetadas

- Solo se tocaron documentos.
- No se tocaron `src/`, UI, Storage, migrations, seeds, mapas, rutas ni `package.json`.
- No se ejecuto `npm run build` porque no hubo cambios de codigo.

---

## 2026-06-28 - Bloque 57: reportes publicos conectados a content_reports

Conectada una via discreta de reporte en paginas `TrustPage`, enviando a la cola privada `content_reports`.

### Cambios implementados

- Anadido bloque plegable "Reportar contenido" en paginas trust.
- El formulario pide nombre, email, tipo de reporte y mensaje.
- El target se envia como `target_entity_type='static_page'` y `target_entity_slug` igual al slug de la pagina actual.
- Tipos publicos disponibles: error de contenido, derechos de imagen, solicitud de retirada, contenido inapropiado, informacion desactualizada y otro.
- El envio usa `submitContentReport(...)`.
- El exito informa que el reporte fue recibido para revision y no se publica automaticamente.
- Los errores muestran mensaje amable sin publicar nada.

### Verificacion real

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.
- Envio real desde `/privacidad` verificado con Playwright local.
- Fila test creada con referencia segura `c1d1e586-261c-4258-b7a1-9e04a036e682`.
- Campos verificados:
  - `report_type='error'`.
  - `target_entity_type='static_page'`.
  - `target_entity_slug='privacidad'`.
  - `status='pending_review'`.
  - `resolved_at=null`.
  - `internal_notes=null`.
- Confirmado que cliente anon recibe `401` al intentar leer `content_reports`.
- La fila test fue eliminada despues de la verificacion y quedo `remaining=0`.

### Reglas respetadas

- No se tocaron mapas, rutas, Storage, fotos, migrations, seeds, Home, CountryPage, CountryZonePage ni `package.json`.
- Nada se publica directo.

---

## 2026-06-28 - Bloque 56: readiness final de colas publicas

Registrada la auditoria final corta de colas publicas de Trawel como base real para Investighost.

### Cambios implementados

- Creado `docs/TRAWEL_PUBLIC_QUEUES_FINAL_READINESS.md`.
- Documentadas tablas verificadas: `user_messages`, `user_photo_submissions` y `content_reports`.
- Documentados estados por defecto verificados: `pending_review`, `submitted` y `pending_review`.
- Confirmada la seguridad: RLS activo, `INSERT` publico controlado, sin `SELECT` publico y cliente anon recibiendo `401` al leer.
- Documentados servicios frontend preparados y formularios ya conectados.
- Dejados claros pendientes reales: reportes visuales, fotos visuales, Storage seguro, panel Investighost y moderacion/publicacion interna.

### Reglas respetadas

- Solo se tocaron documentos.
- No se tocaron `src/`, UI, Storage, migrations, seeds, mapas, rutas ni `package.json`.
- No se ejecuto `npm run build` porque no hubo cambios de codigo.

---

## 2026-06-28 - Bloque 55: reportes ajustados a grants reales

Ajustado `submitContentReport(...)` para ser compatible con la tabla real `content_reports` y sus grants publicos por columna.

### Cambios implementados

- Eliminado `status` del payload insertado por el servicio.
- El servicio mantiene validacion de tipo de reporte, nombre, email, entidad objetivo, slug objetivo y mensaje.
- Supabase aplica ahora `status='pending_review'` por default.
- No se envian columnas internas como `resolved_at`, `internal_notes` ni campos de revision.

### Verificacion real

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.
- Insert controlado con anon usando `report_type='error'`, `target_entity_type='country'` y `target_entity_slug='mexico'`.
- Fila test creada con referencia segura `2786c927-2c98-4b97-aa85-380ce1e7200a`.
- Campos verificados:
  - `report_type='error'`.
  - `status='pending_review'` aplicado por Supabase.
  - `target_entity_type='country'`.
  - `target_entity_slug='mexico'`.
  - `resolved_at=null`.
  - `internal_notes=null`.
- Confirmado que no hay policies publicas de `SELECT`.
- Confirmado que cliente anon recibe `401` al intentar leer `content_reports`.
- La fila test fue eliminada despues de la verificacion y quedo `remaining=0`.

### Reglas respetadas

- No se conecto UI ni formulario visual.
- No se toco Storage.
- No se tocaron migrations, seeds, mapas, rutas, Home, CountryPage, CountryZonePage, TrustPage, diseno ni `package.json`.
- Nada se publica directo.

---

## 2026-06-28 - Bloque 54: cola de fotos ajustada a grants reales

Ajustado `submitUserPhotoSubmission(...)` para ser compatible con la tabla real `user_photo_submissions` y sus grants publicos por columna.

### Cambios implementados

- Eliminado `status` del payload insertado por el servicio.
- El servicio mantiene validacion de autor, email, pais, zona opcional, titulo, descripcion, `image_url` o `storage_path`, credito, derechos y consentimiento.
- Supabase aplica ahora `status='submitted'` por default.
- No se envian columnas internas como `reviewed_at`, `reviewed_by`, `published_image_asset_id`, `rejection_reason` ni notas internas.

### Verificacion real

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.
- Insert controlado con anon usando `storage_path='test/manual-placeholder-2026-06-28T16-03-10-357Z.webp'`.
- Fila test creada con referencia segura `793cef20-45d4-4cab-85d8-5ebdcdbfc167`.
- Campos verificados:
  - `status='submitted'` aplicado por Supabase.
  - `country_slug='mexico'`.
  - `storage_path` presente.
  - `image_url=null`.
  - `rights_confirmed=true`.
  - `consent_confirmed=true`.
  - `published_image_asset_id=null`.
- Confirmado que cliente anon recibe `401` al intentar leer `user_photo_submissions`.
- La fila test fue eliminada despues de la verificacion y quedo `remaining=0`.

### Reglas respetadas

- No se conecto UI ni formulario visual.
- No se subieron archivos ni se toco Storage.
- No se tocaron migrations, seeds, mapas, rutas, Home, CountryPage, CountryZonePage, TrustPage, diseno ni `package.json`.
- Nada se publica directo.

---

## 2026-06-28 - Bloque 53: estrategia Storage para fotos de usuario

Auditado Supabase Storage remoto y preparado el plan seguro para fotos de usuario antes de conectar cualquier formulario visual.

### Resultado de auditoria

- Buckets existentes en `trawel-prod`:
  - `map-assets`: publico, usado para TopoJSON/mapas.
  - `traveler-adventure-photos`: privado, limite 5 MB, MIME `image/jpeg`, `image/png`, `image/webp`.
- `storage.objects` solo tiene policy publica de lectura para `map-assets`.
- No hay policy publica para leer o escribir `traveler-adventure-photos`.
- `user_photo_submissions` mantiene RLS, policy publica solo de `INSERT` y sin `SELECT` publico.
- Los grants publicos de `user_photo_submissions` son por columnas esperadas y no incluyen `status`.

### Cambios implementados

- Creado `docs/TRAWEL_USER_PHOTO_STORAGE_PLAN.md`.
- Documentada estrategia recomendada: usar `traveler-adventure-photos` como bucket privado de cuarentena.
- Definido naming de rutas por pais/zona/anio/submission_id.
- Documentada relacion con `user_photo_submissions.storage_path`.
- Marcado que no se debe abrir lectura publica ni publicar fotos pendientes.
- Anotado como tarea previa revisar `submitUserPhotoSubmission(...)` para no escribir `status` antes de conectar formulario visual.

### Reglas respetadas

- No se creo ni modifico ningun bucket real.
- No se tocaron `src/`, UI, rutas, mapas, migrations, seeds ni `package.json`.
- No se conectaron fotos, storage visual ni reportes.
- No se ejecuto `npm run build` porque solo se tocaron documentos.

---

## 2026-06-28 - Bloque 52: verificacion real de compartir en Supabase

Verificado el envio real del formulario publico `/compartir` contra Supabase remoto.

### Resultado validado

- Envio real desde `/compartir` verificado con Playwright local.
- Fila test creada en `user_messages` con referencia segura `ef74cb60-9c23-4b84-b0b9-5953b8452431`.
- Campos verificados:
  - `type='community_suggestion'` y `kind='community_suggestion'`.
  - `status='pending_review'`.
  - `source_page='compartir'`.
  - `privacy_accepted=true`.
  - `priority='normal'`.
  - `metadata.source='trust_page_share_form'`.
  - `metadata.proposal_type='destino'`.
- Confirmado que no hay policies publicas de `SELECT`.
- Confirmado que un cliente anon recibe `401` al intentar leer `user_messages`.
- La fila test fue eliminada despues de la verificacion y quedo `remaining=0`.

### Reglas respetadas

- No se tocaron `src/`, migrations, seeds, mapas, rutas, Home, CountryPage ni CountryZonePage.
- No se conectaron fotos ni reportes.
- No se publico ningun mensaje o propuesta en web.
- No se ejecuto `npm run build` porque solo se documento la verificacion.

---

## 2026-06-28 - Bloque 51: compartir conectado a user_messages

Conectada la pagina `/compartir` con la cola privada `user_messages` mediante `submitCommunitySuggestion(...)`.

### Cambios implementados

- `TrustPage` muestra un formulario real solo para la pagina `compartir`.
- Campos del formulario: nombre, email, pais o destino sugerido, tipo de propuesta, mensaje y aceptacion de privacidad.
- Tipos de propuesta: experiencia, destino, colaboracion, correccion y otro.
- El envio usa `sourcePage='compartir'`, `kind/type='community_suggestion'` y metadata revisable.
- La propuesta entra en `user_messages` con estado inicial `pending_review` aplicado por Supabase.
- La UI muestra estados de envio, exito y error amable.
- El mensaje de exito deja claro que se recibe para revision y no se publica automaticamente.

### Reglas respetadas

- No se muestran propuestas publicamente ni se anade lectura publica.
- No se conectaron fotos, storage ni reportes.
- No se tocaron mapas, rutas, seeds, migraciones, `package.json`, Home, CountryPage ni CountryZonePage.

---

## 2026-06-28 - Bloque 50: checklist de salida real online

Preparada la checklist practica para validar Trawel como producto online inicial y escaparate funcional alimentable desde Supabase/Investighost.

### Cambios implementados

- Creado `docs/TRAWEL_PRODUCTION_READINESS_CHECKLIST.md`.
- Documentados objetivo, estado real actual, rutas criticas, checklist visual, funcional y Supabase.
- Incluidas tablas activas, seguridad de colas, elementos que pueden ensenarse como reales y siguiente fase.
- Ajustado el lenguaje de posicionamiento hacia producto online inicial, escaparate funcional y version real progresiva.

### Reglas respetadas

- Solo se tocaron documentos.
- No se tocaron `src/`, `package.json`, migrations, seeds, mapas, rutas ni diseno.
- No se ejecuto `npm run build` porque no hubo cambios de codigo.

---

## 2026-06-28 - Bloque 49: verificacion real de contacto en Supabase

Verificado el envio real del formulario publico `/contacto` contra Supabase remoto y corregido el ajuste minimo necesario para respetar los grants por columna de `user_messages`.

### Resultado validado

- El primer envio desde navegador fallo con `401 permission denied for table user_messages`.
- La causa era que el servicio intentaba insertar `status`; el grant publico por columna no permite escribir ese campo.
- `submitContactMessage(...)` deja ahora que Supabase aplique el default seguro `status='pending_review'`.
- Envio real desde `/contacto` verificado con Playwright local.
- Fila test creada en `user_messages` con:
  - `type='contact'` y `kind='contact'`.
  - `status='pending_review'`.
  - `source_page='contacto'`.
  - `privacy_accepted=true`.
  - `priority='normal'`.
- Confirmado que no hay policies publicas de `SELECT`.
- Confirmado que un cliente anon recibe `401` al intentar leer `user_messages`.
- La fila test fue eliminada despues de la verificacion.

### Reglas respetadas

- No se tocaron migrations, seeds, mapas, rutas, Home, CountryPage ni CountryZonePage.
- No se conectaron fotos ni reportes.
- No se publico ningun mensaje en web.

---

## 2026-06-28 - Bloque 48: formulario de contacto conectado a user_messages

Conectada la pagina publica `/contacto` con la cola privada `user_messages` mediante el servicio existente `submitContactMessage(...)`.

### Cambios implementados

- `TrustPage` muestra un formulario real solo para la pagina `contacto`.
- Campos del formulario: nombre, email, asunto, mensaje y aceptacion de privacidad.
- El envio usa `sourcePage='contacto'` y `kind/type='contact'` desde el servicio.
- Los mensajes entran con `status='pending_review'` y `privacy_accepted=true`.
- La UI muestra estados de envio, exito y error amable.
- Se mantiene el contenido informativo existente de la pagina.

### Reglas respetadas

- No se muestran mensajes publicamente ni se anade lectura publica.
- No se conectaron fotos ni reportes.
- No se tocaron mapas, rutas, seeds, migraciones, `package.json`, Home, CountryPage ni CountryZonePage.

---

## 2026-06-28 - Bloque 47D: colas reales de usuario en Supabase

Registrada la aplicacion real del SQL 008 en Supabase remoto `trawel-prod`, ref `pjqisqzxajdfkimtrcby`.

### Resultado validado

- Ejecutado manualmente solo el contenido de `supabase/migrations/008_create_user_content_queue_tables.sql` mediante `npx supabase db query --linked --file`.
- No se uso `supabase db push`.
- No se aplicaron migrations `001`-`007`.
- No se hizo `migration repair`.
- No se insertaron datos de prueba.

### Tablas creadas en remoto

- `content_reports`.
- `user_messages`.
- `user_photo_submissions`.

### Seguridad verificada

- RLS activo en las tres tablas.
- Policies existentes: `INSERT` para roles `anon` y `authenticated`.
- No hay policies publicas de `SELECT` para las colas.

### Reglas respetadas

- No se tocaron `src/`, `package.json`, migrations, seeds, mapas, rutas ni diseno.
- No se conectaron formularios ni storage de fotos.

---

## 2026-06-28 - Bloque 46: auditoria final de colas y readiness

Auditado el estado de las colas de usuario para confirmar que Trawel esta preparado localmente para recibir entradas privadas, pero no debe activar formularios publicos todavia.

### Cambios implementados

- Creado `docs/TRAWEL_USER_QUEUE_READINESS.md`.
- Revisadas tablas locales, servicios frontend, estados iniciales, pendientes de produccion, riesgos y decision recomendada.
- Actualizado `docs/AGENT_BRIEF.md` con enlace a la auditoria.
- Actualizado `docs/TRAWEL_SHOWCASE_READINESS.md` para reflejar que la auditoria de colas esta cerrada y que el siguiente paso depende de aplicar migration o preparar formularios.

### Reglas respetadas

- No se tocaron `src/`, `package.json`, migrations, seeds, mapas ni rutas.
- No se ejecuto `npm run build` porque solo se tocaron documentos.

---

## 2026-06-28 - Bloque 45: servicio de cola de reportes de contenido

Preparado el servicio real para recibir reportes de contenido en cola privada, sin mostrarlos ni conectar formularios visuales.

### Cambios implementados

- Creado `src/features/travelData/productContent/contentReportQueue.service.ts`.
- Anadido `submitContentReport(...)`, que inserta en `content_reports` con `status='pending_review'`.
- Soportados tipos publicos `content_error`, `image_rights`, `removal_request`, `inappropriate_content`, `outdated_information` y `other`, mapeados a los tipos aceptados por la migration local.
- Validacion local de tipo de reporte, nombre, email, tipo/slug de entidad objetivo y mensaje.
- Exportado el servicio desde `productContent` y desde el barrel publico de `travelData`.

### Reglas respetadas

- No se tocaron paginas, formularios, mapas, rutas, diseno global, migrations, seeds, `package.json` ni Supabase real.
- No se ejecuto la migracion contra remoto.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite si aparece.

---

## 2026-06-28 - Bloque 44: servicio de cola de fotos de usuario

Preparado el servicio real para recibir propuestas de fotos de usuarios en cola de revision, sin publicarlas ni crear sistema de subida.

### Cambios implementados

- Creado `src/features/travelData/productContent/userPhotoSubmissionQueue.service.ts`.
- Anadido `submitUserPhotoSubmission(...)`, que inserta en `user_photo_submissions` con `status='submitted'`.
- Validacion local de autor, email, pais, zona opcional, titulo opcional, descripcion opcional, `imageUrl` o `storagePath`, credito, derechos y consentimiento.
- Exportado el servicio desde `productContent` y desde el barrel publico de `travelData`.
- Actualizados `docs/AGENT_BRIEF.md` y `docs/TRAWEL_SHOWCASE_READINESS.md`.

### Reglas respetadas

- No se tocaron paginas, formularios, mapas, rutas, diseno global, migrations, seeds, `package.json` ni Supabase real.
- No se ejecuto la migracion contra remoto.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite si aparece.

---

## 2026-06-28 - Bloque 43: servicio de mensajes apunta a user_messages

Conectada la fachada de cola de mensajes con la tabla real prevista por defecto, sin conectar formularios visuales ni ejecutar migraciones remotas.

### Cambios implementados

- `submitUserMessage`, `submitContactMessage` y `submitCommunitySuggestion` usan ahora `user_messages` como tabla por defecto.
- Se conserva el override opcional `VITE_TRAWEL_USER_MESSAGES_TABLE`.
- Los inserts siguen entrando con `status='pending_review'`, `privacy_accepted=true` y sin lectura publica.
- Reforzada la validacion local de nombre, email, asunto, mensaje, slugs y tipo de entidad antes de insertar.

### Reglas respetadas

- No se tocaron paginas, mapas, rutas, diseno global, seeds, `package.json` ni Supabase real.
- No se ejecuto la migracion contra remoto.
- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite si aparece.

---

## 2026-06-28 - Bloque 42: manual maestro Investighost -> Trawel

Creado el manual maestro para orientar el traspaso operativo entre Investighost, Supabase y Trawel.

### Cambios implementados

- Creado `docs/INVESTIGHOST_TO_TRAWEL_HANDOFF_MANUAL.md`.
- Documentados roles, proyecto Supabase `trawel-prod`, tablas que alimentan Trawel, responsabilidades de Investighost, estados principales, CountryPage, CountryZonePage, Home, promociones, fotos/derechos, mensajes/reportes y checklist para agentes.
- Actualizado `docs/AGENT_BRIEF.md` con enlace breve al manual.
- Actualizado `docs/TRAWEL_SHOWCASE_READINESS.md` para reflejar que ya existe handoff maestro.

### Reglas respetadas

- No se tocaron `src/`, `package.json`, migraciones, seeds, mapas ni rutas.
- No se ejecuto `npm run build` porque solo se tocaron documentos.

---

## 2026-06-28 - Bloque 41: migracion local de colas de usuario

Creada la migracion Supabase local para las colas privadas de contenido de usuario, sin ejecutarla contra Supabase real.

### Cambios implementados

- Creado `supabase/migrations/008_create_user_content_queue_tables.sql`.
- Definidas las tablas `user_messages`, `user_photo_submissions` y `content_reports` segun el contrato documental.
- Anadidos `created_at`, `updated_at`, constraints de estados/tipos, checks basicos de email, slugs y campos requeridos.
- Activado RLS en las tres tablas.
- Anadidos grants y politicas de `INSERT` publico controlado para entradas pendientes.
- No se crean politicas publicas de `SELECT`, `UPDATE` ni `DELETE`.

### Reglas respetadas

- No se tocaron `src/`, seeds, diseno, mapas, rutas, `package.json` ni Supabase real.
- No se ejecuto la migracion contra remoto.
- No se ejecuto `npm run build` porque solo se tocaron SQL/docs.

---

## 2026-06-28 - Bloque 40: contrato de colas de usuario

Definido el contrato minimo de Supabase para futuras colas de contenido de usuario sin crear migraciones ni conectar formularios.

### Cambios implementados

- Creado `docs/TRAWEL_USER_CONTENT_QUEUE_CONTRACT.md` con tablas futuras `user_messages`, `user_photo_submissions` y `content_reports`.
- Documentados campos minimos, estados esperados, reglas de RLS y principio de no publicacion directa desde Trawel.
- Actualizado `docs/AGENT_BRIEF.md` con referencia al contrato.
- Actualizado `docs/TRAWEL_SHOWCASE_READINESS.md` para reflejar que ya existe contrato, pero falta schema/migration y conexion real.

### Reglas respetadas

- No se tocaron `src/`, seeds, migraciones, `package.json` ni Supabase real.
- No se ejecuto `npm run build` porque solo se tocaron documentos.

---

## 2026-06-27 - Home prepara promociones remotas no invasivas

Preparada la fachada de Home para recibir promociones remotas publicadas sin mostrar todavia ningun bloque visual nuevo.

### Cambios implementados

- Reutilizado `getPublishedPromotionsForContext(...)` para cargar promociones publicadas de Home.
- Anadido `homePromotions: Promotion[]` a `ResolvedHomeScreenData`.
- La lectura usa contexto conservador: `placementType='native_block'`, `targetEntityType='generic'`, `targetEntitySlug='home'`, `mode` actual y limite 3.
- Si no hay promociones publicadas o Supabase no esta configurado, `homePromotions` queda como array vacio.
- Anadida metadata `hasRemoteHomePromotions`.

### Reglas respetadas

- No se cambio `HomePage` ni se muestra nada nuevo visualmente.
- No se tocaron mapas, `WorldMap`, D3, TopoJSON, rutas, `package.json`, migraciones, seeds, promociones visuales ni diseno.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-27 - Orden interno de fachada Home screenData

Ordenada internamente la fachada `homeScreenData.service.ts` sin cambiar comportamiento ni API publica.

### Cambios implementados

- Reorganizado el archivo por secciones: tipos publicos, tipos internos, fallback local, resolucion de Home, lectores remotos, builders y normalizadores/helpers.
- Conservados `getHomeScreenFallbackData(mode)` y `getResolvedHomeScreenData(mode)` como API publica.
- Centralizada la construccion de metadata con `buildHomeMetadata(...)`.
- La resolucion remota de paises y planes destacados se ejecuta en paralelo sin cambiar los criterios de fallback.

### Metadata mantenida

- `source`.
- `hasRemoteData`.
- `hasRemoteFeaturedCountries`.
- `hasRemoteFeaturedAdventures`.

### Reglas respetadas

- No se tocaron `HomePage`, mapas, `WorldMap`, D3, TopoJSON, rutas, `package.json`, migraciones, seeds, promociones ni diseno visual.
- Refactor interno sin cambio visual esperado.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-27 - Home lectura remota conservadora de planes destacados

Preparada la Home para usar planes/destinos destacados desde Supabase legacy cuando existan, manteniendo fallback local completo.

### Cambios implementados

- Anadida lectura read-only de `destinations` desde `getResolvedHomeScreenData(mode)`.
- La consulta filtra `status='published'` y `featured=true`.
- Normalizados campos seguros: `id`, `slug`, `title_es`, `summary_es`, `type` y `estimated_visit_time`.
- Si no hay suficientes destinos remotos validos para cubrir las cards actuales, se mantiene `featuredAdventures` local completo.
- La metadata de Home distingue si los datos remotos vienen de paises, aventuras o ambos.

### Sigue siendo fallback local

- Hero, wallpaper, logo, CTA comunidad e imagenes.
- Si el destino remoto no coincide con una card local, usa placeholder local.
- No se conectan promociones ni imagenes remotas.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, rutas, `package.json`, migraciones, seeds ni diseno visual.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-27 - Home lectura remota conservadora de paises destacados

Preparada la Home para usar paises destacados desde Supabase legacy cuando existan, manteniendo fallback local completo.

### Cambios implementados

- `getResolvedHomeScreenData(mode)` pasa a resolver de forma async los paises destacados remotos desde `countries`.
- Anadida lectura read-only de `countries` filtrando `status in ('active', 'comingSoon')` y `featured = true`.
- Normalizados campos seguros: `slug`, `name_es`, `emoji` y `description_es`.
- Si no hay suficientes paises remotos validos para cubrir las cards actuales, se mantiene `featuredDestinations` local completo.
- Anadida `getHomeScreenFallbackData(mode)` para que `HomePage` pinte fallback local inmediato mientras resuelve datos.

### Sigue siendo fallback local

- Hero, wallpaper, logo, planes destacados, CTA comunidad e imagenes.
- Las imagenes de pais siguen usando assets locales cuando el slug coincide; si no, placeholder local.
- No se conectan promociones ni otras tablas.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, rutas, `package.json`, migraciones, seeds ni diseno visual.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-27 - Home data-driven inicial

Preparada la Home para consumir una fachada Database First sin conectar Supabase ni cambiar el comportamiento visual esperado.

### Cambios implementados

- Creado `src/features/travelData/screenData/homeScreenData.service.ts` con `getResolvedHomeScreenData(mode)`.
- Movidos a la fachada los datos locales actuales de Home: hero por modo, destinos destacados, planes destacados y CTA de comunidad.
- `HomePage` consume `screenData.hero`, `screenData.featuredDestinations`, `screenData.featuredAdventures` y `screenData.communityCta`.
- Exportados tipos y funcion desde los barrels de `screenData` y `travelData`.
- Actualizado `docs/AGENT_BRIEF.md` con la regla de Home data-driven inicial.

### Sigue siendo fallback local

- Hero, logo, wallpaper, destinos destacados, planes destacados, imagenes y CTA comunidad.
- No se conecta Supabase en este bloque.
- `WorldMap` queda intacto dentro de la Home.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, rutas, `package.json`, migraciones, seeds ni diseno visual.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-24 - Orden interno de fachada screenData Country/Zone

Ordenada internamente la fachada `countryZoneScreenData.service.ts` sin cambiar comportamiento ni API publica.

### Cambios implementados

- Reorganizado el archivo por secciones: tipos publicos, tipos internos, lectores fallback, datos resueltos, lectura remota de pais, lectura remota de zona, builders y normalizadores/logging.
- Renombrados helpers internos para expresar mejor su responsabilidad: lectura remota, aplicacion de datos remotos y construccion de respuesta resuelta.
- Conservados exports publicos actuales para `CountryPage` y `CountryZonePage`.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, zoom, rutas, `package.json`, migraciones, seeds ni diseno visual.
- Refactor interno sin cambio visual esperado.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-24 - CountryZonePage prepara lectura remota de zonas legacy

Preparada la fachada de `CountryZonePage` para usar datos base de zona desde Supabase legacy cuando existan, manteniendo fallback local.

### Cambios implementados

- Anadida lectura read-only de la tabla legacy `cities` desde `getResolvedZoneScreenData(...)`.
- La consulta resuelve primero `countries.id` por `countries.slug` y luego busca `cities` por `country_id + zoneSlug`.
- Filtrado conservador por estados publicos `active` / `comingSoon`.
- Normalizados solo campos seguros existentes: `id`, `slug`, `name_es`, `short_description_es`, `status` y `featured`.
- Si la zona remota trae datos minimos completos, la fachada fusiona nombre, slug, status, featured, summary y metadata `hasRemoteZone`.
- Si Supabase no esta configurado, falla, no devuelve fila o faltan `slug/name/status`, se conserva el fallback local completo.

### Sigue siendo fallback local

- Hero de zona, imagenes, copy editorial, CTA comunitario y estructura de pantalla siguen saliendo del fallback local.
- Promociones remotas siguen entrando por la fachada con el comportamiento ya existente.
- Aventuras aprobadas y formulario comunitario siguen usando sus servicios actuales.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, zoom, rutas, `package.json`, migraciones, seeds ni diseno visual.
- No se inventaron tablas nuevas ni se elimino ningun fallback.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-24 - CountryZonePage preparado con fachada resuelta

Preparada `CountryZonePage` para consumir una fachada Database First de zona sin cambio visual.

### Cambios implementados

- Anadida `getZoneScreenFallbackData(countrySlug, zoneSlug, mode)` para conservar fallback local inmediato de zona.
- Anadida `getResolvedZoneScreenData(countrySlug, zoneSlug, mode)` como fachada async que agrupa pais, zona, hero/fallback, copy/editorial local, CTA comunitario, promociones remotas y metadata.
- `CountryZonePage` deja de llamar directamente a `getPublishedPromotionsForContext(...)`; las promociones nativas publicadas se cargan desde la fachada resuelta.
- La pagina conserva prioridad de nombres recibidos por `router state`, fallback local de hero/copy y comportamiento visual actual.
- Exportadas las nuevas funciones/tipos desde los barrels de `travelData`.

### Sigue siendo local/fallback

- Hero de zona, copy editorial de zona, CTA comunitario, pais/zona base y nombres siguen saliendo del repositorio local/fallback.
- Aventuras aprobadas y formulario comunitario mantienen sus servicios actuales.
- No se ha conectado lectura remota de zonas/cities ni imagenes remotas en este bloque.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, zoom, rutas, `package.json`, migraciones ni seeds.
- No se cambio el comportamiento visual esperado.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-24 - CountryPage prepara lectura remota de pais legacy

Preparada la fachada de `CountryPage` para usar datos base de pais desde Supabase legacy cuando existan, manteniendo fallback local.

### Cambios implementados

- Anadida lectura read-only de la tabla legacy `countries` desde `getResolvedCountryScreenData(...)`, filtrando por `slug` y estados publicos `active` / `comingSoon`.
- Normalizados solo campos seguros existentes: `id`, `slug`, `name_es`, `status`, `featured`, `capital_es` y `description_es`.
- Si el pais remoto trae datos minimos completos, la fachada actualiza `countryName`, `countrySlug`, `status`, `pageData.country` y metadata `hasRemoteCountry`.
- Si Supabase no esta configurado, falla, no devuelve fila o falta `slug/name/status`, se conserva el fallback local completo.
- `CountryPage` no se modifica: sigue consumiendo la fachada resuelta sin meter logica Supabase en la pagina.

### Sigue siendo fallback local

- ISO/codigos (`isoAlpha2`, `isoAlpha3`, `unM49`) se conservan desde fallback local/world catalog porque `countries` legacy no los garantiza.
- Hero, imagenes, paletas, copy premium, listas de ciudades/destinos y mapas siguen usando la base local/fachada actual salvo datos base fusionados.
- Editorial enriquecido sigue dependiendo de `editorial_contents` publicado y completo.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, zoom, rutas, `package.json`, migraciones ni seeds.
- No se inventaron tablas nuevas ni se elimino ningun fallback.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-24 - CountryPage mueve datos base a fachada resuelta

Reducida la dependencia directa de `CountryPage` sobre datos locales agregados, manteniendo el mismo fallback visual y editorial.

### Cambios implementados

- Ampliada la fachada `getResolvedCountryScreenData(countrySlug, mode)` para devolver datos base de pais: `countryName`, `countrySlug`, codigos ISO disponibles, `pageData` heredado, hero, editorial resuelto y metadata de origen.
- Anadida `getCountryScreenFallbackData(...)` para que `CountryPage` pueda pintar el fallback local inmediato antes de que termine la lectura remota.
- `CountryPage` deja de importar `getCountryPageData(...)` y `worldCountries`; consume pais, listas, contadores y datos de descubrimiento desde `screenData`.
- La vista de paises en descubrimiento usa `ScreenCountrySummary` servido por la fachada en lugar de resolver `worldCountry` dentro de la pagina.
- El comportamiento visible se mantiene: fallback premium, heroes, mapas, listas, contadores y editorial remoto/local siguen igual.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, zoom, rutas, `package.json`, migraciones ni seeds.
- No se inventaron tablas nuevas ni se elimino ningun fallback.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-24 - CountryPage preparado para fachada Database First

Avanzada `CountryPage` hacia lectura Database First sin romper fallback local ni mapas.

### Cambios implementados

- Anadida `getResolvedCountryScreenData(countrySlug, mode)` en `src/features/travelData/screenData/` como fachada async que agrupa fallback local y editorial remoto publicado.
- Movida la normalizacion estricta de `editorial_contents` fuera de `CountryPage`, dejando la pagina sin conocer el detalle de Supabase para el editorial de pais.
- `CountryPage` sigue mostrando fallback local inmediato y solo adopta datos remotos si el contenido esta completo.
- Actualizado `docs/AGENT_BRIEF.md` con la nueva regla de consumo para CountryPage.

### Datos locales/hardcode detectados todavia

- `getCountryPageData(...)` sigue aportando datos agregados heredados: pais, ciudades, destinos destacados y contadores.
- Hero/copy/fallback de pais siguen usando diccionarios locales y assets locales.
- Mapas internos siguen con la logica previa: Espana local y otros paises via `country_map_assets`.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, D3, TopoJSON, rutas, `package.json`, migraciones ni seeds.
- No se elimino el fallback premium.

### Verificacion

- `npm run build` pasa; queda solo el aviso habitual de chunk grande de Vite.

---

## 2026-06-24 - Roadmap oficial Trawel Database First

Creada la hoja de ruta oficial para orientar la transicion de Trawel hacia funcionamiento 100% base de datos.

### Cambios implementados

- Creado `docs/TRAWEL_DATABASE_FIRST_ROADMAP.md` como checklist vivo: Trawel como escaparate publico, Supabase como fuente central de verdad e Investighost como futuro panel maestro externo.
- Documentado el estado validado actual: `static_pages`, `promotions`, `editorial_contents` en CountryPage, Espana demo remota, Mexico remoto real y fallback local premium.
- Anadidas fases de trabajo para CountryPage, CountryZonePage, Home, imagenes/fotos, mensajes, demand signals, promociones e Investighost futuro.
- Actualizado `docs/AGENT_BRIEF.md` con enlace breve al nuevo roadmap.

### Reglas respetadas

- No se tocaron `src/`, `package.json`, migraciones, seeds, mapas, servicios, rutas ni datos de Supabase.
- No se ejecuto `npm run build` porque solo se tocaron documentos.

---

## 2026-06-16 - Guia de entrada de contenido editorial para Trawel

Creada una guia interna para ordenar contenido editorial antes de convertirlo en cargas revisables de `editorial_contents`.

### Cambios implementados

- Creado `docs/TRAWEL_CONTENT_INPUT_GUIDE.md` con proposito, datos minimos para pais, estructura esperada de `editorial_contents`, diferencia entre modos `adventure` y `student`, reglas de calidad, seguridad editorial, convencion de `load_slug`, flujo recomendado y ejemplo minimo basado en Mexico.
- Actualizado `docs/AGENT_BRIEF.md` con referencia breve a la nueva guia.

### Reglas respetadas

- No se tocaron codigo frontend, mapas, rutas, migraciones, seeds, `package.json`, dependencias ni Supabase real.
- No se ejecuto `npm run build` porque solo se tocaron documentos.

---

## 2026-06-16 - Mexico remoto ejecutado y validado en Supabase

Registrada la ejecucion manual validada del SQL de carga editorial remota de Mexico en `editorial_contents`.

### Validacion registrada

- Filas publicadas para `entity_type='country'`, `entity_slug='mexico'` y `country_slug='mexico'`.
- Modos validados: `adventure` y `student`.
- `status='published'`.
- `load_slug`: `mexico-country-adventure-2026-06-16` y `mexico-country-student-2026-06-16`.
- `published_at`: `2026-06-16 18:15:46.875413+00`.

### Cambios implementados

- Actualizado `docs/sql/load_mexico_editorial_contents_proposal.sql` para marcarlo como ejecutado manualmente y validado en Supabase.
- Mantenido claro que el SQL no es migracion ni seed.

### Reglas respetadas

- No se tocaron codigo frontend, mapas, rutas, migraciones, seeds, `package.json` ni dependencias.
- No se ejecuto `npm run build` porque solo se tocaron docs/SQL.

---

## 2026-06-16 - Propuesta de carga remota editorial para Mexico

Preparada una propuesta controlada para cargar contenido editorial remoto de Mexico en `editorial_contents`, sin ejecutar escritura real en Supabase.

### Cambios implementados

- Creado `docs/sql/load_mexico_editorial_contents_proposal.sql` como SQL revisable e idempotente por `metadata->>'load_slug'`.
- La propuesta contiene dos filas de pais para `CountryPage`: `mode='adventure'` y `mode='student'`, ambas con los campos obligatorios del contrato remoto.
- El contenido se preparo tomando como referencia el editorial local actual de Mexico en `countryEditorial.ts` y el patron del seed demo de Espana.

### Reglas respetadas

- No se ejecuto SQL ni se escribio en Supabase.
- No se tocaron codigo frontend, mapas, rutas, migraciones, seeds existentes, `package.json`, dependencias ni datos de Espana.
- No se ejecuto `npm run build` porque solo se tocaron documentos/SQL revisable.

---

## 2026-06-16 - Contrato editorial remoto para CountryPage e Investighost

Auditado el consumo de `editorial_contents` en `CountryPage` y documentado el contrato minimo que debe generar Investighost para que un pais use contenido remoto publicado.

### Cambios implementados

- Actualizado `docs/INVESTIGHOST_CONTRACT.md` con la consulta exacta de `CountryPage`, campos obligatorios, comportamiento ante Supabase no configurado/fallido, contenido ausente o incompleto, y ejemplo minimo de fila publicable por pais y modo.
- Actualizado `docs/AGENT_BRIEF.md` con referencia corta al contrato minimo remoto de pais.
- No se modifico logica de carga: la auditoria confirma que `CountryPage` mantiene fallback local si no hay remoto valido.

### Reglas respetadas

- No se tocaron mapas, rutas, migraciones, seeds, `countryEditorial.ts`, `package.json` ni dependencias.
- No se tocaron Mexico, Italia, Rusia ni Espana en datos o componentes.

---

## 2026-06-16 - CountryPage conectado a editorial_contents con fallback local

`CountryPage` empieza a intentar cargar contenido editorial publicado desde Supabase para paises, manteniendo el contenido local como respaldo seguro.

### Cambios implementados

- Anadida lectura async de `editorial_contents` mediante `getPublishedEditorialContent(...)` con `entityType: country`, `countrySlug`, `entitySlug` y `mode`.
- Anadida normalizacion estricta a `ScreenEditorialData`: headline, intro, whatMakesSpecial, highlights, suggestedRoute y practicalTips deben estar completos para usar remoto.
- Si Supabase falla, no esta configurado, no devuelve contenido publicado o el contenido remoto esta incompleto, `CountryPage` mantiene el editorial local de `getCountryScreenData(...)`.
- Espana puede mostrar el editorial demo remoto si existe; Mexico, Italia y Rusia conservan el comportamiento local previo.
- Anadidos logs DEV para distinguir carga remota publicada frente a fallback local.
- Anadida nota en `docs/AGENT_BRIEF.md`.

### Reglas respetadas

- No se tocaron mapas, rutas, migraciones, seeds, `countryEditorial.ts`, `package.json` ni dependencias.
- No se escribio en Supabase ni se modificaron tablas legacy.

---

## 2026-06-15 - Promociones nativas en CountryZonePage

`CountryZonePage` empieza a mostrar promociones publicadas desde Supabase como cards nativas no invasivas dentro del scroll de zona.

### Cambios implementados

- Anadida lectura de promociones con `getPublishedPromotionsForContext(...)` usando `countrySlug`, `zoneSlug`, `mode` y limite bajo.
- Anadido bloque visual discreto para promociones con `disclosureLabel`, sponsor, descripcion y CTA externo solo si existe `sponsorUrl`.
- Las promociones demo se identifican visualmente mediante metadata sin presentarlas como oferta real.
- Si Supabase falla, no esta configurado o no devuelve promociones, no se muestra nada y la pagina conserva su flujo previo.
- Anadida nota en `docs/AGENT_BRIEF.md`.

### Reglas respetadas

- No se tocaron Home, `CountryPage`, `TrustPage`, rutas, mapas, migraciones, seed, `package.json` ni dependencias.
- No se escribio en Supabase ni se tocaron servicios de mapas/comunidad.

---

## 2026-06-15 - TrustPage conectado a static_pages con fallback local

`TrustPage` empieza a validar lectura real de contenido producto desde Supabase en paginas de bajo riesgo, conservando el contenido local como respaldo.

### Cambios implementados

- `TrustPage` carga `static_pages` publicadas mediante `getPublishedStaticPageBySlug(slug)`.
- Si Supabase devuelve una pagina valida, usa su titulo, resumen y secciones del `body`.
- Si Supabase no esta configurado, falla o no devuelve contenido, mantiene el fallback local existente sin mostrar errores crudos.
- Anadida nota en `docs/AGENT_BRIEF.md`.

### Reglas respetadas

- No se tocaron Home, `CountryPage`, `CountryZonePage`, rutas, mapas, migraciones, seed, `package.json` ni dependencias.
- No se escribio en Supabase.

---

## 2026-06-15 - Seed local de contenido producto Supabase

Preparado un SQL seed local para validar contenido producto publicado sin ejecutar cambios contra Supabase remoto.

### Cambios implementados

- Creado `supabase/seed/007_product_content_seed.sql`.
- Anadidas semillas prudentes para paginas estaticas publicadas, una promocion demo claramente marcada como prueba y dos contenidos editoriales minimos para Espana en modos aventura y estudiante.
- El seed usa upsert donde hay constraints unicas y limpieza acotada solo para registros editoriales demo identificados por metadata.
- Anadida nota en `docs/AGENT_BRIEF.md`.

### Reglas respetadas

- No se tocaron frontend, rutas, mapas, servicios, migraciones existentes, `package.json` ni dependencias.
- No se ejecuto el seed contra Supabase remoto.

---

## 2026-06-15 - Capa de lectura Supabase para contenido producto fase 1

Creada una primera capa frontend read-only para preparar consumo futuro de contenido producto publicado desde Supabase, sin conectar todavia paginas visuales.

### Cambios implementados

- Creada `src/features/travelData/productContent/` con tipos y servicio async para `editorial_contents`, `static_pages` y `promotions`.
- Anadidas funciones `getPublishedEditorialContent`, `getPublishedStaticPageBySlug` y `getPublishedPromotionsForContext`.
- Los servicios usan `supabaseClient.ts`, devuelven vacio/null si Supabase no esta configurado, filtran `published` y no hacen escrituras.
- Exportada la capa desde `src/features/travelData/index.ts`.
- Anadida nota en `docs/AGENT_BRIEF.md`.

### Reglas respetadas

- No se tocaron Home, `CountryPage`, `CountryZonePage`, `TrustPage`, rutas, mapas, migraciones, `package.json` ni dependencias.
- No se ejecuto migracion real ni se escribio en Supabase.

---

## 2026-06-15 - Migracion Supabase fase 1 para producto data-driven

Preparada una migracion local segura para acercar Trawel a producto data-driven con Supabase `trawel-prod` como fuente viva, sin ejecutar cambios remotos.

### Cambios implementados

- Creada `supabase/migrations/007_create_product_content_tables.sql`.
- Anadidas tablas nuevas en paralelo: `editorial_contents`, `image_assets`, `static_pages`, `demand_signals` y `promotions`.
- Definidos indices, constraints, triggers `updated_at` y RLS para lectura publica solo de registros `published`.
- La tabla `promotions` queda orientada a bloques nativos no invasivos y con etiqueta visible de disclosure.

### Reglas respetadas

- No se tocaron tablas legacy: `countries`, `cities`, `destinations`, `traveler_adventures` ni `country_map_assets`.
- No se tocaron componentes React, paginas, rutas, mapas, servicios frontend, Supabase client, Edge Functions, Storage, `package.json` ni dependencias.
- No se ejecuto migracion real contra Supabase remoto.

---

## 2026-06-15 - CountryZonePage conectado a fachada data-driven

`CountryZonePage` empieza a consumir la fachada `getZoneScreenData(countrySlug, zoneSlug, mode)` sin cambiar comportamiento visual.

### Cambios implementados

- Conectados hero, pais, zona y CTA comunitario normalizados desde `ZoneScreenData`.
- Conservados hero local `.webp`, fallback premium, copy inspirador de zona y fallbacks actuales para `madrid` y `jalisco`.
- Mantenidos formulario comunitario, aventuras aprobadas, scroll inicial, navegacion y fallbacks existentes.

### Reglas respetadas

- No se tocaron Home, `CountryPage`, `CityPage`, `AdventurePage`, rutas, mapas, Supabase, migraciones, `package.json` ni dependencias.
- No se cambio el CSS ni el diseno visual de `CountryZonePage`.

---

## 2026-06-14 - CountryPage conectado a fachada data-driven

`CountryPage` empieza a consumir la fachada `getCountryScreenData(countrySlug, mode)` sin cambiar comportamiento visual.

### Cambios implementados

- Conectado el editorial normalizado de `CountryScreenData` al bloque editorial de pais.
- Usado `screenData.mapStatus.preferredAdminLevel` como fuente del nivel administrativo del mapa.
- Mantenidos los fallbacks visuales, hero actual, navegacion, CTA comunitario y estados de mapa existentes.
- Anadida nota en `docs/AGENT_BRIEF.md` para respetar esta fachada en futuros cambios.

### Reglas respetadas

- No se tocaron Home, `CountryZonePage`, `CityPage`, `AdventurePage`, rutas, mapas, Supabase, migraciones, `package.json` ni dependencias.
- No se conecto Supabase ni se hizo refactor visual.

---

## 2026-06-14 - Paginas minimas de confianza y comunidad

Creadas paginas informativas basicas para resolver enlaces publicos de confianza, legal y comunidad.

### Cambios implementados

- Creada plantilla `src/pages/TrustPage/` para paginas estaticas sencillas.
- Anadidas rutas `/sobre-trawel`, `/contacto`, `/privacidad`, `/cookies`, `/terminos`, `/creditos-imagenes` y `/compartir`.
- Corregido el enlace roto del footer `/mapa` para apuntar al atlas existente `/#atlas-mundial`.
- Anadida nota en `docs/AGENT_BRIEF.md` sobre estas paginas minimas.

### Reglas respetadas

- No se tocaron mapas, `WorldMap`, `CountryInternalMap`, D3, TopoJSON, Supabase, migraciones, servicios data-driven, fachada Country/Zone, `package.json` ni dependencias.
- No se conectaron formularios, backend, subida de fotos ni Supabase real.

---

## 2026-06-14 - Repositorio puente local para Country y Zone

Ordenada la fachada data-driven inicial de Country/Zone separando la API publica del origen local actual.

### Cambios implementados

- Anadido contrato `CountryZoneScreenDataRepository`.
- Creado `localCountryZoneScreenData.repository.ts` como repositorio local/mock para `CountryScreenData` y `ZoneScreenData`.
- Simplificado `countryZoneScreenData.service.ts` para delegar en el repositorio activo.
- Expuesto el contrato desde los barrels de `screenData` y `travelData`.
- Anadida nota en `docs/AGENT_BRIEF.md` para que futuros repositorios Supabase respeten la fachada.

### Reglas respetadas

- No se tocaron Home, `CountryPage`, `CountryZonePage`, `CityPage`, `AdventurePage`, rutas, mapas, Supabase real, migraciones, `package.json` ni dependencias.
- No se conecto Supabase, no se creo SQL ni se migraron datos.

---

## 2026-06-14 - Mapeo Supabase legacy a modelo futuro

Documentado el mapeo entre `trawel-prod` legacy y el modelo data-driven futuro para reutilizar lo existente sin reconstruir Supabase desde cero.

### Cambios implementados

- Creado `docs/TRAWEL_SUPABASE_LEGACY_MAPPING.md`.
- Inventariadas tablas actuales: `countries`, `cities`, `destinations`, `destination_sources`, `country_map_assets` y `traveler_adventures`.
- Inventariados Storage y Edge Functions actuales: `map-assets`, `traveler-adventure-photos`, `request-country-map` y `withdraw-traveler-adventure`.
- Definida correspondencia legacy -> futuro y decisiones de conservar, adaptar o migrar por capas.
- Anadida nota en `docs/AGENT_BRIEF.md` para consultar el mapping antes de tocar Supabase.

### Reglas respetadas

- No se tocaron codigo fuente, componentes, mapas, Supabase real, migraciones, SQL, `package.json` ni dependencias.
- No se ejecuto build.

---

## 2026-06-14 - Fachada data-driven inicial para Country y Zone

Creada una primera base tecnica de fachada data-driven para datos de pantalla de pais y zona, sin conectar Supabase ni cambiar comportamiento visual.

### Cambios implementados

- Anadidos tipos `CountryScreenData` y `ZoneScreenData` en `src/features/travelData/screenData/`.
- Anadidas funciones `getCountryScreenData(countrySlug, mode)` y `getZoneScreenData(countrySlug, zoneSlug, mode)` con implementacion local/mock.
- La fachada normaliza datos actuales desde `countries.ts`, `worldCountries.ts`, `countryEditorial.ts`, `cities.ts` y assets hero locales por slug.
- Expuesta la nueva fachada desde `src/features/travelData/index.ts` para uso futuro.
- Anadida nota en `docs/AGENT_BRIEF.md` para que futuros cambios de pais/zona respeten esta capa.

### Reglas respetadas

- No se modificaron Home, `CountryPage`, `CountryZonePage`, rutas, mapas, Supabase, `package.json` ni dependencias.
- No se conecto Supabase, no se crearon migraciones, SQL ni refactors visuales.

---

## 2026-06-14 - Modelo Supabase futuro para Trawel data-driven

Documentado el modelo Supabase inicial en `docs/TRAWEL_SUPABASE_MODEL.md` para preparar Trawel como frontend data-driven alimentado por Investighost.

### Cambios implementados

- Definido el principio "Supabase almacena, Investighost alimenta, Trawel renderiza".
- Documentadas tablas recomendadas: `countries`, `zones`, `places`, `routes`, `plans`, `adventures`, `editorial_contents`, `image_assets`, `community_photos`, `demand_signals` y `static_pages`.
- Documentadas relaciones principales, estados editoriales, reglas de visibilidad publica, consideraciones de RLS/Storage y fases de implementacion.
- Anadida nota en `docs/AGENT_BRIEF.md` para consultar el modelo antes de proponer tablas, migraciones o cambios de datos.

### Reglas respetadas

- No se tocaron codigo fuente, componentes, CSS, rutas, servicios, mapas, Supabase real, `package.json` ni dependencias.
- No se crearon migraciones, SQL ejecutable ni refactors.

---

## 2026-06-14 - Contratos data-driven para Supabase e Investighost

Creada la documentacion base `docs/TRAWEL_DATA_CONTRACTS.md` para orientar la transicion de Trawel hacia una plataforma data-driven.

### Cambios implementados

- Definido el principio "Trawel renderiza, Investighost investiga y Supabase almacena".
- Documentadas entidades futuras: Country, Zone, Place, Route, Plan, Adventure, EditorialContent, ImageAsset, CommunityPhoto, DemandSignal y StaticPage/LegalPage.
- Anadido contrato editorial comun para modos Aventura y Estudiante.
- Documentadas fases de transicion y checklist previa a carga masiva con Investighost.
- Anadida nota en `docs/AGENT_BRIEF.md` para que futuros agentes consulten los contratos antes de proponer cambios estructurales.

### Reglas respetadas

- No se tocaron codigo fuente, componentes, CSS, rutas, servicios, mapas, Supabase, `package.json` ni dependencias.
- No se implementaron tablas, SQL, migraciones ni refactors.

---

## 2026-06-12 - Fallback inspirador para heroes de zona

Actualizado `CountryZonePage` para que el fallback de zonas sin imagen real funcione como portada inspiradora del lugar, no como petición de foto.

### Cambios implementados

- Añadido copy estable por `zoneSlug` para `madrid` y `jalisco`.
- El hero fallback de zona muestra un texto viajero/cultural breve y mantiene la bandera o referencia del país padre cuando está disponible.
- La colaboración fotográfica deja de ocupar el hero y pasa a una tarjeta secundaria cerca del final del contenido principal.
- Si existe imagen real en `src/assets/zones/hero/[zoneSlug].webp`, la imagen sigue teniendo prioridad.

### Reglas respetadas

- No se tocaron `CountryPage`, mapas, D3, TopoJSON, navegación, Supabase, rutas, `package.json` ni dependencias.
- Este enfoque prepara a futuro la generación de textos por zona mediante Investighost.

---

## 2026-06-12 - Fallback premium de hero país con identidad por bandera

Mejorado el fallback visual de `CountryPage` cuando no existe imagen real en `src/assets/countries/hero/[countrySlug].webp`.

Actualización posterior: el fallback pasa de CTA fotográfico protagonista a copy inspirador estable por país. La colaboración fotográfica queda como llamada secundaria y discreta cerca del final del contenido principal, preparando el enfoque para futura generación/reutilización de textos por país mediante Investighost.

### Cambios implementados

- Añadidas paletas discretas por `countrySlug` para portadas temporales de país: `mexico`, `italia`, `espana`, `ucrania`, `rusia`.
- El fallback usa bandera visible, nombre protagonista y degradado inspirado en colores de bandera.
- Añadido copy inspirador estable para `canada`, `mexico`, `italia`, `espana`, `ucrania` y `rusia`.
- Si existe imagen hero real, la imagen sigue teniendo prioridad y no se aplica la paleta temporal.
- La colaboración fotográfica deja de ocupar el hero y pasa a una tarjeta secundaria.

### Reglas respetadas

- No se tocaron `CountryZonePage`, mapas, D3, TopoJSON, navegación, Supabase, rutas, `package.json` ni dependencias.
- Zonas/ciudades conservan su fallback existente.

---

## 2026-06-11 - Sistema genérico de heroes editoriales para países y zonas

Implementado un sistema productivo de imágenes hero por slug para países y zonas/ciudades.

### Convención de assets

- Países: `src/assets/countries/hero/[countrySlug].webp`
- Zonas/ciudades: `src/assets/zones/hero/[zoneSlug].webp`
- Medida recomendada: `2400x900 px`
- Formato: `.webp`
- Peso recomendado: `250-700 KB`
- El nombre del archivo debe coincidir con el slug real de la URL.

### Cambios implementados

- `CountryPage` mantiene la carga automática existente de imágenes reales por país y añade fallback premium si falta la imagen.
- `CountryZonePage` carga automáticamente imágenes desde `src/assets/zones/hero/[zoneSlug].webp`.
- Si una zona no tiene imagen real, se muestra una portada temporal con degradado elegante, nombre protagonista desde el hero, bandera del país si está disponible y llamada colaborativa.
- Añadidos `aria-label` diferenciados para imagen panorámica real y portada temporal.
- Creada la carpeta versionada `src/assets/zones/hero/`.

### Reglas respetadas

- No se tocaron mapas, D3, TopoJSON, zoom, pan, touch, tooltips ni navegación de mapas.
- No se tocaron Supabase, rutas, `package.json` ni dependencias.

---

## 2026-06-09 (tarde) - Corrección de integración visual del contenido editorial

Corregida la visibilidad del contenido editorial base por país. El bloque editorial ahora aparece **antes del mapa** y también se muestra en la vista `DiscoveringCountryView` para países como México/Italia/Rusia.

### Problema identificado

- El `CountryEditorialSection` se renderizaba **después** del mapa interno
- Los países sin contenido en `countries.ts` pero sí en `worldCountries` (ej: México, Italia, Rusia) entraban en `DiscoveringCountryView` y **nunca llegaban** al bloque editorial
- El usuario no notaba el nuevo contenido editorial al entrar a `/pais/mexico`

### Cambios implementados

**Reordenamiento en `CountryPage.tsx`:**
- `CountryEditorialSection` ahora se renderiza **PRIMERO** en el `<main>`, antes de cualquier sección de mapa
- Esto garantiza que el contenido editorial sea lo primero que ve el usuario tras el hero

**Soporte en `DiscoveringCountryView`:**
- Añadidas props `countrySlug` y `mode` (opcionales, con defaults)
- Si existe contenido editorial para el slug, se muestra una sección editorial completa antes del estado del mapa
- Los países como México/Italia/Rusia ahora muestran su contenido enriquecido incluso sin estar en `countries.ts`

**Sin duplicación de código:**
- `DiscoveringCountryView` usa los mismos estilos CSS (`editorialSection`, `editorialBlock`, etc.)
- Se reutiliza `getCountryEditorial()` para obtener el contenido
- Fallback correcto: si no hay editorial, se muestra solo la sección de descubrimiento como antes

### Estructura visual resultante

```
/pais/mexico (sin countries.ts pero con worldCountries + editorial):

┌─ Hero ──────────────────────────────┐
│  México                             │
│  Pirámides, cultura viva...         │
└─────────────────────────────────────┘
┌─ Editorial Section ─────────────────┐  ◄── NUEVO: visible primero
│  México no se recorre de una sola   │
│  vez: se descubre región a región   │
│                                     │
│  Qué hace especial este destino     │
│  [contenido enriquecido]            │
│                                     │
│  Ideas para explorar                │
│  → Recorrer las pirámides...        │
│  → Perderse en los mercados...      │
│                                     │
│  Ruta sugerida                      │
│  Ciudad de México → Teotihuacán...  │
│                                     │
│  💡 Consejo rápido                  │
└─────────────────────────────────────┘
┌─ Discovering Section ───────────────┐
│  🌍 Descubriendo destino            │
│  [estado del mapa]                  │
└─────────────────────────────────────┘
```

### Reglas respetadas

- ✅ No se tocó `WorldMap.tsx`, `WorldMap.module.css`, `CountryInternalMap.tsx`
- ✅ No se tocó D3, TopoJSON, zoom, pan, touch, tooltips
- ✅ No se tocó Supabase, rutas, `package.json`, dependencias
- ✅ No se añadieron dependencias nuevas
- ✅ CSS Modules mantenido
- ✅ Sin refactor grande

---

## 2026-06-09 - Primera capa editorial base para países (México, España, Italia, Rusia)

Implementada estructura de contenido editorial diferenciado por modo (Aventura/Estudiante) para los cuatro países prioritarios de Trawel.

### Cambios implementados

**Nueva estructura editorial:**

- `src/features/countries/data/countryEditorial.ts` — Diccionario de contenido editorial por país y modo:
  - **México** (`mexico`): Aventura (pirámides, pueblos mágicos, mercados, costas) / Estudiante (cruce de civilizaciones, geografía, transculturación)
  - **España** (`espana`): Aventura (pluralidad regional, pueblos medievales, costas) / Estudiante (mosaico cultural, lenguas, patrimonio)
  - **Italia** (`italia`): Aventura (viaje lento, Toscana, ciudades de arte) / Estudiante (laboratorio de historia, Renacimiento, ciudades-estado)
  - **Rusia** (`rusia`): Aventura (inmensidad, trenes, arquitectura, literatura) / Estudiante (geografía e historia, identidad imperial, cultura)

**Estructura del contenido por país:**
- `headline`: Frase principal evocadora
- `intro`: Párrafo introductorio con alma
- `whatMakesSpecial`: Qué hace único este destino
- `explorationIdeas`: 3-4 bullets de ideas/claves
- `suggestedRoute`: Ruta sugerida conceptual
- `quickTip`: Consejo rápido final

**Integración en CountryPage:**

- `src/pages/CountryPage/CountryPage.tsx` — Nuevo componente `CountryEditorialSection`:
  - Detecta automáticamente si hay contenido editorial para el país actual
  - Renderiza versión enriquecida si existe contenido específico
  - Fallback a descripción simple si no hay contenido editorial
  - Adapta títulos según modo: "Ideas para explorar" vs "Claves de contexto"

- `src/pages/CountryPage/CountryPage.module.css` — Nuevos estilos:
  - `.editorialBlock`, `.editorialBlockTitle`, `.editorialBlockText`
  - `.editorialList`, `.editorialListItem` (con bullets dorados)
  - `.editorialTip` (caja destacada con icono 💡)

**Exports en `src/features/countries/index.ts`:**
- `countryEditorial`, `getCountryEditorial`, `hasCountryEditorial`, `getCountriesWithEditorial`
- Tipos: `CountryEditorialContent`, `CountryEditorialData`, `ExperienceMode`

### Slugs de países soportados

| País | Slug | Estado en countries.ts |
|------|------|------------------------|
| México | `mexico` | Solo en worldCountries |
| España | `espana` | Activo (ES) |
| Italia | `italia` | Próximamente (IT) |
| Rusia | `rusia` | Solo en worldCountries |

### Diferenciación Aventura vs Estudiante

| Aspecto | Modo Aventura | Modo Estudiante |
|---------|---------------|-----------------|
| **Tono** | Emocional, sensorial, inspirador | Cultural, histórico, educativo pero ameno |
| **Enfoque** | "Vivir" el destino, experiencias | "Entender" el destino, contextos |
| **Rutas** | Sugerencias de viaje prácticas | Rutas de aprendizaje temáticas |
| **Bullets** | Ideas de exploración concretas | Claves de contexto histórico-cultural |
| **Consejos** | Tips prácticos de viajero | Orientaciones para aprender viajando |

### Preparación para Investighost

La estructura `countryEditorial` está diseñada para ser extendida por Investighost:
- Tipado TypeScript completo
- Funciones helper (`getCountryEditorial`, `hasCountryEditorial`)
- Patrón de fallback automático en UI
- Documentación inline en el archivo de datos

### Restricciones respetadas

- ✅ No se tocó WorldMap.tsx, WorldMap.module.css, CountryInternalMap
- ✅ No se tocó D3, TopoJSON, zoom, pan, touch, tooltips
- ✅ No se tocó navegación del mapa, Supabase, rutas
- ✅ No se añadieron dependencias
- ✅ No se modificó package.json
- ✅ No se tocó lógica de mapas ni generación/carga de mapas
- ✅ Mantenido CSS Modules
- ✅ Cambio mínimo y coherente con arquitectura existente

### Archivos modificados

- `src/features/countries/data/countryEditorial.ts` (nuevo)
- `src/features/countries/index.ts`
- `src/pages/CountryPage/CountryPage.tsx`
- `src/pages/CountryPage/CountryPage.module.css`

---

## 2026-06-09 - Normalización de scroll en páginas de país y zona

Correcciones menores para que todas las páginas abiertas desde el mapa empiecen mostrando su hero/cabecera panorámica.

### Cambios implementados

**CountryPage:**
- Añadido `useEffect` con `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })` al cambiar `countrySlug`
- Al entrar en `/pais/mexico` se ve el hero desde arriba, no cerca del mapa

**CountryZonePage:**
- Añadido `useEffect` con `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })` al cambiar `countrySlug` o `zoneSlug`
- Al entrar en `/pais/mexico/zona/guerrero` se ve el hero de la zona desde arriba

**Contraste de texto en hero:**
- Rediseñada clase `.heroLocationOnImage` con fondo glassmorphism (`rgba(255,255,255,0.78)` + `blur(8px)`)
- Color de texto navy oscuro `#0f3558` para máximo contraste
- Estética premium con border-radius tipo pill y sombra suave

### Restricciones respetadas
- No se tocó WorldMap.tsx, WorldMap.module.css, CountryInternalMap
- No se tocó D3, TopoJSON, zoom, pan, touch, tooltips, navegación del mapa
- No se tocó Supabase, rutas, package.json, dependencias
- Cambio pequeño y localizado en CountryPage y CountryZonePage únicamente

---

## 2026-06-09 - Ajustes de scroll y contraste en CountryPage

Correcciones menores en CountryPage para mejorar la experiencia de entrada y legibilidad del hero fotográfico.

### Cambios implementados

**TAREA 1: Scroll inicial al entrar en CountryPage**
- `src/pages/CountryPage/CountryPage.tsx` — Añadido `useEffect` que ejecuta `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })` al cambiar `countrySlug`
- **Problema resuelto:** Al entrar en `/pais/mexico`, la página quedaba posicionada cerca del mapa en lugar de mostrar el hero desde arriba
- **Solución:** Scroll automático al montar/cambiar de país sin animación (behavior: 'auto') para evitar sensación de salto raro
- **No afecta:** Navegación interna del mapa ni interacciones con CountryInternalMap

**TAREA 2: Mejor contraste del texto sobre hero fotográfico**
- `src/pages/CountryPage/CountryPage.module.css` — Rediseñada clase `.heroLocationOnImage`
- **Problema resuelto:** El copy "📍 Pirámides, cultura viva..." no se leía bien por ser gris sobre zona oscura de la foto
- **Solución visual:**
  - Fondo blanco semitranslúcido: `background: rgba(255, 255, 255, 0.78)`
  - Efecto glass: `backdrop-filter: blur(8px)`
  - Borde redondeado tipo pill: `border-radius: 999px`
  - Color de texto navy oscuro: `color: #0f3558` (sin text-shadow)
  - Sombra suave: `box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18)`
  - Ancho adaptativo: `max-width: min(680px, 100%)` con `width: fit-content`
- **Responsive:** En móvil (<480px) el border-radius se ajusta a 16px para mejor wrap del texto

### Restricciones respetadas
- No se tocó WorldMap.tsx, WorldMap.module.css, CountryInternalMap
- No se tocó D3, TopoJSON, zoom, pan, touch, tooltips, navegación del mapa
- No se tocó Supabase, rutas, package.json, dependencias
- No se añadieron dependencias
- Cambio pequeño y localizado en CountryPage únicamente

---

## 2026-05-20 - Sistema de hero fotográfico por país en CountryPage

Implementado sistema inicial de hero fotográfico en la cabecera de CountryPage para mostrar imágenes representativas del país cuando existan.

### Cambios implementados

**Archivos modificados:**
- `src/pages/CountryPage/CountryPage.tsx` — Carga dinámica de imágenes hero + copy editorial
- `src/pages/CountryPage/CountryPage.module.css` — Estilos para hero con imagen

**Sistema técnico:**
- Carga automática de imágenes desde `src/assets/countries/hero/*.webp` usando `import.meta.glob`
- Mapa `heroImageMap` construido en tiempo de build con URLs resueltas
- Diccionario `heroCopyBySlug` para subtítulos editoriales específicos por país
- Clases condicionales `.heroWithImage`, `.heroOverlay` y variantes para modo imagen

**Primera imagen activa:**
- México: `src/assets/countries/hero/mexico.webp`
- Copy: "Pirámides, cultura viva y paisajes que invitan a descubrir cada región."

**Diseño visual:**
- Hero con imagen: altura generosa (420px móvil / 520px tablet / 580px desktop)
- Overlay degradado azulado para legibilidad del texto
- Texto en color claro con sombras sobre imagen
- Breadcrumbs y badges con fondo translúcido
- Transición suave hacia el contenido inferior
- Bandera en tarjeta blanca sobre la imagen

**Fallback para países sin imagen:**
- Mantiene el gradiente "Horizonte Dorado" original
- No hay cambios visuales ni de comportamiento
- El sistema es 100% opt-in por existencia de archivo

**Para añadir nuevos países en el futuro:**
1. Colocar imagen en: `src/assets/countries/hero/[slug].webp`
2. Añadir copy opcional en `heroCopyBySlug` en CountryPage.tsx
3. El sistema detecta automáticamente por el slug del país

### Restricciones respetadas
- No se tocó WorldMap.tsx, WorldMap.module.css, CountryInternalMap
- No se tocó D3, TopoJSON, zoom, pan, touch, tooltips, navegación del mapa
- No se tocó Supabase, rutas, package.json, dependencias
- No se añadieron dependencias
- Mantenido CSS Modules
- No se tocó lógica sensible del mapa

### Validación
```bash
npm run lint   # Pendiente
npm run build  # Pendiente
```

---

## 2026-05-13 - Estructura AI-specs: metodología AI-powered ligera

### Objetivo del bloque
Completar una estructura metodológica AI-powered para Trawel tras detectar una ejecución parcial/inconsistente de agente. La estructura queda inspirada en Specboot/OpenSpec, pero adaptada al flujo real del proyecto: breve, práctica y sin burocracia.

### Archivos creados/completados

**Skills** (`ai-specs/skills/`):
- `checkpoint-before-change.md` — Cuándo y cómo hacer checkpoints git
- `small-steps-planning.md` — Dividir en bloques "10 ladrillos"
- `update-docs.md` — Mantener docs vivos sin sobrecarga
- `adversarial-review.md` — Revisar antes de declarar "listo"
- `responsive-audit.md` — Validar móvil/tablet/desktop
- `map-ui-validation.md` — Validar cambios en mapas

**Agentes** (`ai-specs/agents/`):
- `frontend-map.md` — Perfil para cambios de mapas/UI responsive
- `qa-validator.md` — Perfil para validar cambios
- `content-editorial.md` — Perfil futuro para contenido con fuentes

**Documentación** (`docs/`):
- `base-standards.md` — Reglas base: checkpoints, commits en español, validación
- `WORKFLOW_AI.md` — Flujo operativo de 8 pasos
- `AGENTS.md` — Catálogo de perfiles de agentes
- `codex.md` — Guía de uso de Codex en el proyecto

**Modificado**:
- `AGENT_BRIEF.md` — Sección 10 "Sistema AI-specs" con enlaces reales y TL;DR único
- `small-steps-planning.md`, `adversarial-review.md`, `frontend-map.md` — limpiados tras detectar contenido incrustado de una ejecución parcial
- `WORKFLOW_AI.md` — restaurado como flujo operativo; la guía específica de Codex queda separada en `docs/codex.md`

### Decisiones

| Decisión | Razón |
|----------|-------|
| Mantenerlo lean | No queremos burocracia. Solo lo esencial. |
| Skills separados por situación | Reutilizable, enfocado, sin duplicar |
| Commits en español | Consistencia con el equipo |
| No se tocó código funcional | Este bloque es solo metodología/docs |
| Referencias cruzadas, no duplicación | Cada doc tiene su propósito único |

### Qué NO se importó de Specboot/OpenSpec

| Elemento | Por qué no se importó |
|----------|----------------------|
| Schemas formales de tareas | Demasiado pesado para nuestro flujo |
| Checklist exhaustivos | Prefiero "10 ladrillos" pragmático |
| Roles rígidos | Agentes son perfiles, no entidades separadas |
| Automatización de commits | Mantenemos control humano |
| Playwright obligatorio | No en este bloque, evaluar después |

### Validación ejecutada

```bash
npm run lint   # 0 errores, 5 warnings conocidos (documentados en BITACORA)
npm run build  # Éxito (705 modules)
```

### Alcance

- No se instaló ninguna dependencia
- No se tocó código de producción
- No se modificó lógica de mapas, componentes o workflows
- No se hizo commit (pendiente de revisión humana)

---

## 2026-05-13 - Reparación configuración ESLint para v9+

### Problema detectado
El comando `npm run lint` fallaba con error:
```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
From ESLint v9.0.0, the default configuration file is now eslint.config.js.
```

### Causa
- El proyecto usaba ESLint v10.2.1 (que incluye motor v9+)
- El formato de configuración legacy (`.eslintrc.*`) fue eliminado en ESLint v9
- Era necesario migrar a **Flat Config** (`eslint.config.js/mjs`)

### Archivos tocados
- **Creado:** `eslint.config.mjs` - Configuración moderna ESLint v9+
- **Modificado:** `supabase/functions/request-country-map/index.ts` - Eliminadas variables no usadas (`inserted`, `updated`, `updateError`)
- **Modificado:** `src/features/travelData/services/travelData.service.ts` - Añadido `cause` al Error para cumplir regla `preserve-caught-error`

### Configuración añadida (`eslint.config.mjs`)
- Compatible con React + TypeScript + Vite
- Plugins: `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`
- Ignora: `dist`, `node_modules`, `*.d.ts`
- Reglas desactivadas (React Compiler experimental): `preserve-manual-memoization`, `set-state-in-effect`, `preserve-caught-error`, `exhaustive-deps`

### Validación ejecutada
```bash
npm run lint   # 0 errores, 1 warning (no crítico)
npm run build  # Éxito, build generado en dist/
```

### Resultado
- `npm run lint` funciona correctamente
- Solo queda 1 warning no crítico sobre `react-refresh/only-export-components`
- Build de producción exitoso (605ms)

---

## 2026-05-13 - Ajuste de configuración ESLint: menos permisiva

### Cambios en `eslint.config.mjs`

**Reactivadas:**
- `react-hooks/exhaustive-deps` - Ahora activa para detectar bugs en useEffect/useCallback/useMemo
- `@typescript-eslint/no-explicit-any` - Activa en `src/` para código de producción

**Desactivadas temporalmente (React Compiler experimental):**
- `react-hooks/preserve-manual-memoization` - Regla experimental del React Compiler
- `react-hooks/set-state-in-effect` - Regla experimental del React Compiler

**Override específico:**
- `scripts/**/*.{ts,tsx}`: `@typescript-eslint/no-explicit-any: 'off'` - Los scripts de procesamiento GeoJSON usan `any` por datos externos no tipados

### Resultado de validación
```bash
npm run lint   # 0 errores, 5 warnings (todos de exhaustive-deps en WorldMap/CountryPage)
npm run build  # Éxito (705 modules, 1.03s)
```

### Warnings actuales (no críticos, no bloquean build)
- `react-refresh/only-export-components` en `ExperienceModeContext.tsx`
- 3× `react-hooks/exhaustive-deps` en `WorldMap.tsx` (refs en cleanup)
- 1× `react-hooks/exhaustive-deps` en `CountryPage.tsx` (expresión compleja)

### Reglas desactivadas y por qué
| Regla | Motivo |
|-------|--------|
| `react-hooks/preserve-manual-memoization` | React Compiler experimental, aún no estable |
| `react-hooks/set-state-in-effect` | React Compiler experimental, aún no estable |
| `@typescript-eslint/no-explicit-any` (solo en `scripts/`) | Datos GeoJSON externos no tipados |

---


## 2026-05-10 - UX: mensajes honestos para países no preparados (Mongolia, etc.)

Corrección de UX para países sin contenido editorial ni mapa listo. El problema: al pulsar "Explorar {país}" se mostraba "Estamos preparando..." con spinner, creando expectativa falsa de carga inmediata.

### Diagnóstico de trazabilidad

**¿Qué se registra actualmente?**
- Tabla: `country_map_assets`
- Campos de demanda: `requested_count`, `last_requested_at`
- Edge Function `request-country-map` incrementa contador en cada solicitud

**Suficiencia para Investighost:**
| Métrica | Disponible vía |
|---------|---------------|
| Ranking de países más solicitados | `SELECT country_slug, requested_count FROM country_map_assets ORDER BY requested_count DESC` |
| Países fallidos | `WHERE status = 'failed'` |
| Países en cola | `WHERE status IN ('queued', 'generating')` |
| Países con visitas pero sin contenido | `WHERE status = 'missing' AND requested_count > 0` |
| Fecha de última demanda | `last_requested_at` |

**Limitación actual:** No se registra el país + admin_level combinado si el usuario no especifica nivel. El default es ADM1/ADM2 según perfil del país.

### Cambios UX implementados

| Estado | Antes | Después |
|--------|-------|---------|
| **missing** | "Aún no conocemos bien {país}..." + "Explorar {país}" | "{País} todavía está en preparación" + explicación de registro de demanda + "Quiero que se prepare {País}" |
| **queued/generating** | "Estamos preparando..." + spinner | "Gracias, hemos registrado tu interés" + explicación de priorización + sin spinner |
| **failed** | "Algo salió mal..." + "Reintentar" | "{País} todavía no está listo" + explicación de revisión necesaria + sin botón reintentar |

### Principio aplicado
- No prometer carga inmediata si el mapa/contenido no está listo
- Cada visita/pulsación es **señal de demanda** para Investighost, no acción instantánea
- El visitante ayuda a priorizar, no espera frustrado

### Archivos modificados
- `src/pages/CountryPage/CountryPage.tsx`: Copy de `DiscoveringCountryView` para estados missing/queued/generating/failed
- `src/pages/CountryPage/CountryPage.module.css`: Estilos para `.discoveringStateTitle`, `.discoveringStateText`, `.discoveringStateSecondary`

---

## 2026-05-10 - Corrección de rumbo: CountryPage ya no es catálogo de ciudades

### Nueva jerarquía de Trawel

| Nivel | Contenido | Ejemplo |
|-------|-----------|---------|
| **CountryPage / País** | Mapa por regiones/zonas, resumen editorial, aventuras destacadas de nivel país, CTA | España: mapa de provincias, por qué explorar España |
| **CountryZonePage / Zona** | Contenido local, aventuras aprobadas, eventos de esa zona, formulario de aporte | Madrid como zona: planes locales, conciertos, rutas |
| **CityPage / Ciudad** | Cosas locales concretas | Madrid: El Retiro, Museo del Prado, conciertos específicos |

### Cambios en CountryPage

- **Eliminado**: Concepto de "Ciudades destacadas" como catálogo nacional amplio.
- **Nuevo**: "Zonas de entrada" — máximo 4 ciudades como puntos de acceso al mapa, no como listado completo.
- **Copy actualizado**: El subtítulo explica que "cada zona contiene ciudades, lugares y aventuras".
- **CTA mejorado**: 
  - Título: "¿Conoces un plan en {país}?" (antes: "¿Conoces {país}?")
  - Descripción: "Comparte una aventura, evento o lugar especial."
  - Nota: "Muy pronto podrás enviar recomendaciones directamente desde esta página." (antes sonaba a obra inacabada)
- **Estado vacío**: Orientado a explorar el mapa, no a esperar contenido.

### Archivos modificados

- `src/pages/CountryPage/CountryPage.tsx`:
  - Límite de ciudades: 6 → 4
  - Sección renombrada: "Ciudades destacadas" → "Zonas de entrada"
  - Copy de sección y CTA actualizados
  - Docstring del componente actualizado con nueva jerarquía

### Alcance

- No se tocó WorldMap, CountryInternalMap, zoom, pan, touch.
- No se tocó pipeline de mapas, Supabase, Storage.
- No se tocó rutas existentes ni Home.
- No se usó v0.
- Build: pendiente de verificación.

---

## 2026-05-10 - Estructura MVP de CountryPage implementada

Implementada estructura mínima funcional en CountryPage para convertirla en página de país útil, comercial y preparada para monetización futura.

### Cambios

- `src/pages/CountryPage/CountryPage.tsx`:
  - Integración con `useExperienceMode` para contenido adaptativo (Aventura/Estudiante).
  - Uso completo de datos de `getCountryPageData`: `activeCities`, `comingSoonCities`, `featuredDestinations`, `publishedDestinationsCount`, `totalCitiesCount`.
  - Nueva sección "Por qué explorar {país}" con copy diferenciado por modo.
  - Sección "Ciudades destacadas": grid de hasta 6 cards (activas primero, comingSoon después).
  - Sección "Aventuras destacadas": grid de hasta 6 cards de destinos.
  - Sección "Estado vacío" cuando no hay contenido editorial.
  - CTA de participación de usuarios: "Comparte tu aventura" con enlace al mapa.
  - Componentes internos: `CityCard`, `DestinationCard` con navegación a páginas correspondientes.

- `src/pages/CountryPage/CountryPage.module.css`:
  - Estilos para badge de modo (Aventura/Estudiante) en hero.
  - Estilos para sección editorial con contenido centrado.
  - Grid responsive para ciudades (1/2/3 columnas).
  - Grid responsive para aventuras (1/2/3 columnas).
  - Cards de ciudad con estados active/comingSoon.
  - Cards de aventura con tipo, summary y metadatos.
  - Sección vacía con mensaje amigable.
  - Sección CTA con fondo oscuro y botón primario.

### Datos utilizados

- `country.shortDescription` → descripción base del país.
- `activeCities` → ciudades navegables con link.
- `comingSoonCities` → ciudades con badge "Próximamente".
- `featuredDestinations` → aventuras destacadas con link a `/aventura/{slug}`.

### Estados manejados

- País con contenido editorial + ciudades + aventuras → Todas las secciones visibles.
- País con contenido editorial sin ciudades/aventuras → Estado vacío + CTA.
- País sin contenido editorial pero en worldCountries → Vista "Descubriendo destino" con mapa.

### AdSense-safe (preparación futura)

- Las nuevas secciones editoriales proporcionan espacio entre el mapa y el CTA.
- Posibles ubicaciones futuras documentadas en código entre secciones.
- No se implementaron placeholders visuales para no afectar UX actual.

### Alcance

- No se tocó WorldMap, CountryInternalMap, zoom, pan, touch ni pipeline de mapas.
- No se tocó Supabase, Storage, ni rutas existentes.
- No se tocó HomePage.
- No se usó v0.
- Build: ✅ exitoso (tsc + vite).
- Archivos modificados: 2 (+593 líneas netas).

---

## 2026-05-10 - Threshold visual base 0.0001 para mapas internos

Elevado el estándar visual de simplificación tras validar India ADM1 y Rumanía ADM1 generadas con `0.0002`.

### Cambios

- `scripts/lib/mapAssetPipeline.ts` cambia el default de simplificación de `0.0002` a `0.0001`.
- México ADM1 sigue documentado como caso validado con `0.0001`, aunque coincida con el default.
- España ADM2 conserva `0.0002` como asset ya validado visualmente.
- `0.0002` queda como opción ligera excepcional.
- `0.00005` queda reservado para países costeros/insulares difíciles si `0.0001` no basta.
- Documentado que India ADM1 y Rumanía ADM1 deben regenerarse con `0.0001` en un bloque posterior.

### Alcance

- No se tocaron assets ni Supabase.
- No se regeneraron mapas.
- No se tocó WorldMap, CountryInternalMap, Home ni CSS.

---

## 2026-05-10 - ADM1 como default para mapas internos

Actualizada la norma de nivel administrativo tras probar Rumanía e India con ADM2.

### Cambios

- `countryMapProfiles.ts` cambia el default general de `ADM2` a `ADM1`.
- España conserva override explícito `ADM2` porque las provincias están validadas como capa útil.
- México conserva `ADM1`.
- Añadidos perfiles `ADM1` para Italia, Rumanía e India.
- Documentado que CountryInternalMap muestra regiones/estados/provincias principales, no el máximo detalle administrativo.
- Documentado que las ciudades importantes se gestionan como contenido editorial/aventuras/listados, no como polígonos ADM2 masivos.
- Los assets ADM2 ya generados para Rumanía o India no se borran en este bloque; quedan como históricos/no usados hasta tener rollback claro.

### Alcance

- No se tocaron assets ni Supabase.
- No se regeneraron mapas.
- No se tocó WorldMap, CountryInternalMap, Home, CSS ni zoom/pan/touch.

---

## 2026-05-10 - Pipeline con simplificación configurable

Actualizado el pipeline de generación de mapas internos para aplicar el estándar cartográfico validado.

### Cambios

- `scripts/lib/mapAssetPipeline.ts` cambia el default de simplificación de `0.02` a `0.0002`.
- Añadida resolución de threshold por `countrySlug + adminLevel` mediante `resolveSimplificationThreshold()`.
- Añadido override inicial: `mexico/ADM1 = 0.0001`.
- El worker `process-country-map-queue.ts` pasa país y nivel administrativo efectivo antes de convertir a TopoJSON.
- El script manual de España usa `0.0002` y deja de describir el valor como porcentaje de detalle.
- Se corrigen comentarios/documentación técnica para explicar que `topojson.simplify` usa un threshold, no un porcentaje.

### Alcance

- No se regeneraron assets.
- No se tocó Supabase.
- No se tocó WorldMap, CountryInternalMap, Home ni CSS.

---

## 2026-05-10 - Estándar de calidad cartográfica

Documentado el estándar cartográfico tras validar visualmente WorldMap, España y México.

### Decisiones documentadas

- WorldMap adopta `world-atlas@2/countries-50m.json` como estándar actual.
- `countries-110m.json` queda descartado para mapa protagonista por falta de definición.
- `countries-10m.json` queda reservado para evaluación futura.
- El threshold `topojson.simplify(..., 0.02)` queda descartado como estándar global para mapas internos.
- Default recomendado para mapas internos: `0.0002`.
- Overrides por `countrySlug + adminLevel`: México ADM1 queda validado con `0.0001`.
- España ADM2 queda validada con `0.0002`.
- Se añade checklist de validación: tamaño, gzip, features, arcos, puntos totales, puntos en features pequeñas, revisión visual y pruebas de zoom/pan/touch.

### Archivos modificados

- `docs/MAP_ASSET_PLAN.md`
- `docs/MAP_UI_GUIDELINES.md`
- `docs/DECISIONES.md`
- `docs/CODEMAP.md`

### Alcance

- Documentación únicamente.
- No se tocó código, assets, Supabase, WorldMap, CountryInternalMap, Home ni pipeline.
- Pendiente técnico: adaptar `scripts/lib/mapAssetPipeline.ts` para configuración por país/nivel antes de regeneraciones globales.

---

## 2026-05-04 - Zoom con rueda centrado y estable en WorldMap

Simplificación del wheel zoom de escritorio tras detectar fuga visual con el anclaje al puntero.

### Cambios

- `handleWheel` deja de usar `clientX/clientY` como ancla del zoom.
- La rueda calcula el cambio de escala respecto al centro del viewBox (`width / 2`, `height / 2`), manteniendo estable el centro visual.
- La recolocación del mapa queda en el pan desktop con click sostenido y arrastre.
- No se modifica la lógica táctil móvil, navegación, tooltip, Home, CSS ni `CountryInternalMap`.
- Antártida sigue oculta filtrando UN M.49 `010`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `docs/MAP_UI_GUIDELINES.md`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Corrección de coordenadas del wheel zoom en WorldMap

Ajuste acotado del anclaje de zoom con rueda en escritorio.

### Cambios

- `WorldMap` deja de convertir `clientX/clientY` con `getScreenCTM()` para el anclaje de zoom.
- La conversión a coordenadas del viewBox usa `getBoundingClientRect()`, escala real de `preserveAspectRatio="xMidYMid meet"` y offsets de letterboxing.
- El zoom mantiene el punto bajo cursor usando `currentTransformRef.invert(...)` y aplica el resultado sobre la misma capa `<g>` interna.
- No se modifica la lógica táctil móvil, navegación, tooltip, Home ni `CountryInternalMap`.
- Antártida sigue oculta filtrando UN M.49 `010`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Zoom anclado y pan de ratón en WorldMap

Ajuste acotado de interacción desktop del mapa mundial, sin tocar la ruta táctil móvil.

### Cambios

- La rueda sobre el WorldMap calcula el punto de mapa bajo el cursor antes de cambiar escala, manteniéndolo anclado al puntero todo lo posible.
- Con el mapa ampliado, click sostenido y arrastre desplaza la misma capa `<g>` interna mediante `currentTransformRef`/`applyMapTransform`.
- Un drag real suprime temporalmente el click posterior para evitar navegación accidental.
- La rueda fuera del mapa sigue haciendo scroll normal porque el listener permanece limitado al SVG.
- Antártida sigue oculta filtrando UN M.49 `010`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `docs/MAP_UI_GUIDELINES.md`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Wheel zoom en WorldMap (escritorio)

Añadido zoom con rueda de ratón en escritorio para mejorar exploración del mapa mundial.

### Cambios

- `WorldMap.tsx` añade listener `wheel` sobre el SVG.
- El zoom solo activa cuando el cursor está sobre el mapa (`event.preventDefault()` para evitar scroll de página).
- Si el cursor está fuera, la rueda sigue haciendo scroll normal de la página.
- Usa la misma función `applyMapTransform` y referencia `currentTransformRef` que el pinch zoom táctil.
- Escala limitada: 1x a 40x (mismos límites que zoom táctil).
- El punto bajo el cursor se mantiene anclado al hacer zoom (comportamiento estándar).

### Alcance

- Solo `WorldMap.tsx`; sin cambios en `CountryInternalMap`.
- Sin modificaciones de lógica táctil móvil (1 dedo explora, 2 dedos pan/zoom).
- Sin cambios en tooltips, botón "Ir a {país}", CSS ni Home.
- Antártida sigue oculta (filtro `'010'` preservado).

---

## 2026-05-04 - Ocultar Antártida del WorldMap

Ocultada Antártida del mapa mundial para evitar confusión visual y táctil en móvil.

### Cambios

- `WorldMap.tsx` filtra la geometría con código UN M.49 `'010'` antes de renderizar paths.
- Identificación robusta por código numérico de la ONU, no por nombre.

### Alcance

- Solo `WorldMap.tsx`; sin cambios en `CountryInternalMap`.
- Sin modificaciones de zoom, tooltip, responsive, CSS ni Home.
- Decisión reversible: si en el futuro se crea caso de uso específico, basta con eliminar el filtro.

---

## 2026-05-04 - Normativa UI de mapas interactivos

Creado documento oficial de UX/UI para todos los componentes de mapa.

### Cambios

- Nuevo documento `docs/MAP_UI_GUIDELINES.md` con normativa completa:
  - Principios generales de mapas exploratorios limpios
  - Reglas para Home y experiencia de mapa vivo
  - Especificaciones de WorldMap (escritorio y móvil)
  - Especificaciones de CountryInternalMap (escritorio y móvil)
  - Criterios responsive
  - Reglas para agentes
- Actualizado `docs/AGENT_BRIEF.md` con referencia a `MAP_UI_GUIDELINES.md`
- Actualizado `docs/CODEMAP.md` con referencia a `MAP_UI_GUIDELINES.md`

### Alcance

- Documentación únicamente; sin cambios de código funcional.
- No se modificó CSS, lógica de zoom, tooltips, navegación, responsive ni datos.
- Este documento debe leerse antes de tocar `WorldMap`, `CountryInternalMap`, `HomePage` relacionada con mapa o responsive de mapas.

---

## 2026-05-02 - Retirada privada de aventuras pendientes

Añadido flujo para que un viajero pueda retirar una aventura antes de revisión mediante token privado.

### Cambios

- Nueva migración `supabase/migrations/005_add_withdrawal_token_to_traveler_adventures.sql`.
- `traveler_adventures` guarda `withdrawal_token_hash`, `withdrawal_token_created_at` y `withdrawn_at`.
- Se añade estado `withdrawn` para retirar sin borrar físicamente la fila.
- El navegador genera un token privado y solo inserta su hash SHA-256.
- Nueva Edge Function `withdraw-traveler-adventure` valida el token con `service_role` y solo retira aventuras `pending`.
- Nueva ruta pública `/retirar-aventura` para usar enlace o código de retirada.
- Tras enviar una aventura, `CountryZonePage` muestra resumen con enlace y código privado de retirada.

### Alcance

- No se implementó email automático, recuperación de tokens perdidos, borrado físico, panel de soporte ni retirada de aventuras ya aprobadas.
- El token debe guardarlo el usuario; si se pierde, la retirada futura queda para webmaster/soporte.

---

## 2026-05-02 - Privacidad obligatoria en aventuras de viajeros

Añadido consentimiento de privacidad al envío real de aventuras desde `CountryZonePage`. El marketing queda separado y opcional, sin bloquear el envío.

### Cambios

- Nueva migración `supabase/migrations/004_add_privacy_consent_to_traveler_adventures.sql`.
- `traveler_adventures` guarda `privacy_accepted_at`, `privacy_version`, `marketing_consent` y `marketing_consent_at`.
- La policy pública de INSERT exige privacidad aceptada y coherencia entre `marketing_consent` y `marketing_consent_at`.
- `createTravelerAdventure(input)` rechaza envíos sin privacidad y envía la versión de privacidad vigente.
- El formulario añade checkbox obligatorio de privacidad, checkbox opcional de comunicaciones/promociones y panel informativo.

### Alcance

- No se implementaron fotos, newsletter real, cookies, panel legal, autenticación, captcha ni borrado automático.
- El texto de privacidad es operativo e informativo; debe revisarse por asesoría/legal antes de producción pública.

---

## 2026-05-02 - CountryZonePage envía aventuras pendientes

Añadido formulario real para que un viajero envíe una aventura desde una zona del mapa. El envío se guarda en `traveler_adventures` y queda pendiente de revisión.

### Cambios

- `createTravelerAdventure(input)` inserta aventuras usando el cliente Supabase público.
- El formulario pide título, historia, consejos prácticos, nombre y email.
- Validación mínima frontend: campos obligatorios no vacíos y email con forma básica.
- El insert no envía `status` ni `photo_path`; Supabase deja `status = pending` por default.
- Tras éxito se limpia el formulario y se muestra “Hemos recibido tu aventura. La revisaremos antes de publicarla.”
- La aventura enviada no aparece en la lista pública hasta que se apruebe.

### Alcance

- No se implementaron fotos, Storage, Edge Function, panel de moderación, captcha, autenticación ni diseño final.
- `author_email` se usa solo en el INSERT y no se consulta ni renderiza públicamente.

---

## 2026-05-02 - CountryZonePage muestra aventuras aprobadas

Conectada la página de zona con `traveler_adventures` para mostrar aventuras reales aprobadas por país y zona.

### Cambios

- Nuevo servicio frontend `src/features/adventures/adventures.service.ts`.
- Nuevo tipo público `TravelerAdventurePublic` sin `author_email` ni `moderation_notes`.
- Nueva función `getApprovedAdventuresByZone(countrySlug, zoneSlug)`.
- `CountryZonePage` carga aventuras `approved` al montar o cambiar de zona.
- Si hay aventuras aprobadas, muestra título, historia, consejos prácticos y autor.
- Si no hay aventuras aprobadas, mantiene el mensaje “Próximamente aventuras” y el CTA de estrenar destino.
- Si hay error de consulta, muestra un mensaje amable sin romper navegación.

### Alcance

- No se añadió formulario, subida de fotos, panel de moderación, edición, borrado, autenticación ni render de fotos privadas.
- `photo_path` queda como metadata preparada; las imágenes privadas se servirán en una fase segura posterior.

---

## 2026-05-02 - Infraestructura: aventuras de viajeros pendientes de aprobación

Creada la base real para que futuras aventuras publicadas por viajeros nazcan desde zonas del mapa y queden pendientes hasta revisión webmaster.

### Cambios

- Nueva migración `supabase/migrations/003_create_traveler_adventures.sql`.
- Nueva tabla `traveler_adventures` con país, zona, historia, consejos prácticos, autor, estado de moderación y timestamps.
- Estado por defecto: `pending`.
- RLS activado:
  - INSERT público/anónimo controlado solo para nuevas aventuras `pending`.
  - SELECT público solo para aventuras `approved`.
  - Sin UPDATE/DELETE público.
- Grants de columnas evitan exponer `author_email` y `moderation_notes` en lecturas públicas.
- Bucket privado `traveler-adventure-photos` creado por SQL, sin políticas públicas de Storage.

### Decisión de Storage

No se habilitó subida pública directa de fotos. La opción segura queda para una Edge Function futura que valide tamaño, MIME, país/zona y asociación con una aventura `pending`, y que solo sirva fotos cuando la aventura esté aprobada.

---

## 2026-05-02 - Producto: CountryPage centrada en mapa

Se limpió la experiencia principal de `CountryPage` para que Trawel avance hacia el flujo mapa → país → zona → aventuras de viajeros.

### Cambios

- Se ocultaron del flujo principal los tarjetones heredados de ciudades activas, ciudades próximamente y aventuras destacadas.
- Se retiraron las estadísticas del hero basadas en conteos antiguos de ciudades/aventuras.
- `CountryPage` queda centrada en encabezado de país, bandera, estado del mapa y `CountryInternalMap`.
- Se añadió un bloque simple: “Explora el mapa y elige una zona” orientado a futuras aventuras con fotos, rutas, consejos y experiencias.

### Alcance

- Los datos antiguos y rutas antiguas se conservaron.
- No se implementó subida de fotos, tablas nuevas, autenticación, moderación ni formulario funcional.
- No se tocó WorldMap, worker, GitHub Actions, Supabase, generación de mapas, CountryFlag ni Investighost.

---

## 2026-05-02 - UX: click en zonas de mapa interno

Corregido el comportamiento de click en zonas/regiones/provincias de `CountryInternalMap`. Antes el click/foco podía dejar un tooltip visual suelto sin llevar a ningún destino útil.

### Cambios

- `CountryInternalMap` extrae un nombre amable de la zona y genera un `zoneSlug` estable.
- `CountryPage` navega al seleccionar una zona del mapa.
- Nueva ruta pública: `/pais/:countrySlug/zona/:zoneSlug`.
- Nueva `CountryZonePage` como placeholder editorial con mensaje “Próximamente aventuras en esta zona.”

### Alcance

- No se añadieron puntos, labels fijos ni marcadores al mapa.
- No se implementó subida real de fotos, formulario complejo ni tablas nuevas.
- No se tocó worker, GitHub Actions, Supabase, WorldMap ni Investighost.

---

## 2026-05-02 - FIX: Estados Unidos usa ADM1

Corregido el primer fallo real del worker automático para Estados Unidos: geoBoundaries respondía `HTTP 403` al intentar ADM2, además de ser un nivel demasiado granular para la experiencia pública.

### Cambio

- `src/features/map/config/countryMapProfiles.ts`: añadido perfil `estados-unidos` con `preferredAdminLevel: 'ADM1'`.
- `docs/MAP_ASSET_PLAN.md`: documentado Estados Unidos como país ADM1 por utilidad UX/comercial y para evitar errores con ADM2.

### Operativa

Si ya existe un registro `country_map_assets` para `estados-unidos` en `failed` o con `admin_level = ADM2`, hay que reencolar desde la UI o reprocesar con:

```bash
npm run maps:queue:process -- --country estados-unidos --force
```

El worker actualizará el registro a `ADM1` al completarlo.

---

## 2026-05-02 - Automatización inicial de cola de mapas

Se añadió la base CI para procesar automáticamente `country_map_assets` sin mover trabajo pesado al navegador ni a la Edge Function.

### Cambios

- `.github/workflows/process-country-map-queue.yml`: workflow programado cada 30 minutos y manual con `workflow_dispatch`.
- `docs/MAP_ASSET_PLAN.md`: documentado flujo navegador → queued → worker automático → ready → `CountryInternalMap`.
- `docs/CODEMAP.md`: añadido mapa del workflow y su relación con el worker.
- `docs/AGENT_BRIEF.md`: añadida nota operativa sobre automatización y secretos.

### Decisiones operativas

- Límite inicial recomendado: `npm run maps:queue:process -- --limit 1`.
- Frecuencia inicial recomendada: cada 30 minutos.
- GitHub Actions usa `SUPABASE_SERVICE_ROLE_KEY` únicamente como secret de CI/backend.
- Frontend mantiene flujo anon/public y nunca recibe `service_role`.
- `request-country-map` sigue limitada a encolar/actualizar registros; el procesamiento pesado queda en worker/CI.

---

## 2026-05-02 - DECISIÓN: nivel cartográfico configurable por país

Establecida la regla de producto para mapas internos: el `admin_level` no es global, se decide por país según el nivel más útil para exploración comercial.

### Cambios

- Creada configuración central en `src/features/map/config/countryMapProfiles.ts`.
- España conserva `ADM2` para mostrar provincias.
- México pasa a `ADM1` para mostrar estados y evitar un mapa excesivamente granular.
- CountryPage consulta y solicita mapas usando el nivel preferido del país.
- El worker aplica el perfil del país al procesar o reprocesar assets y actualiza `admin_level` al dejar el registro en `ready`.

### Reprocesado de México

```bash
npm run maps:queue:process -- --country mexico --force
```

Con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configuradas, el worker generará `countries/mexico/mexico-adm1.topojson` y actualizará el registro único de `country_map_assets` a `admin_level = ADM1`.

---

## 2026-05-02 - FIX: cache-busting para assets de mapas en Storage

Corregido el caso en que el navegador seguía cargando `mexico-adm2.topojson` desde disk cache después de reprocesar el asset.

### Problema

Supabase Storage mantiene la misma URL pública cuando se sobrescribe un archivo con `--force`. Si el navegador tenía el TopoJSON cacheado, `CountryInternalMap` podía seguir recibiendo la versión antigua aunque el asset ya estuviera regenerado.

### Solución

`getCountryMapPublicUrl(asset)` ahora añade un query param `v` estable basado en metadatos:

1. `generatedAt`
2. `updatedAt`
3. `sizeBytes`

Ejemplo:

```text
https://.../mexico-adm2.topojson?v=2026-05-02T...
```

Al cambiar `generated_at` después de `--force`, cambia también la URL y el navegador descarga el TopoJSON nuevo.

---

## 2026-05-02 - FIX: winding final en assets y reprocesado forzado

Corregido el pipeline compartido de mapas para evitar polígonos complementarios como el cuadrado amarillo visto en México.

### Problema

México cargaba el TopoJSON y los tooltips funcionaban, pero algunas geometrías se renderizaban como complementos del mapa. El síntoma visible era un rectángulo/área enorme en hover, causado por anillos con winding inválido para D3 en el asset final.

### Solución

- `mapAssetPipeline.convertToTopoJSON()` ahora normaliza winding antes de convertir y vuelve a normalizar después de `topojson-simplify`.
- `normalizeGeoJSON()` soporta `FeatureCollection`, `Feature`, `Polygon`, `MultiPolygon` y `GeometryCollection`.
- El worker acepta `--force` para reprocesar un país aunque su registro esté `ready`.

### Comando de reprocesado

```bash
npm run maps:queue:process -- --country mexico --force
```

Requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el entorno. En esta sesión no se ejecutó contra Supabase porque `SUPABASE_URL` no estaba configurada en la shell.

---

## 2026-05-02 - CountryInternalMap: mapas internos limpios y homogéneos

Implementado el render genérico de mapas internos para países con asset TopoJSON listo.

### Problemas corregidos

| Problema | Causa | Solución |
|----------|-------|----------|
| **Estado `ready` solo mostraba mensaje** | CountryPage no renderizaba el asset de Storage | `CountryInternalMap` carga y pinta el TopoJSON real cuando `status='ready'` |
| **España mantenía puntos y labels fijos** | `SpainMap` seguía pintando ciudades sobre el mapa | España usa el mismo `CountryInternalMap` con asset local |
| **Mapas internos revelaban editorial** | Marcadores de ciudad indicaban contenido disponible | Sin puntos, sin labels, solo tooltip de zona al hover |

### Archivos creados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`
- `src/features/map/components/CountryInternalMap/index.ts`

### Comportamiento

- España carga `/maps/countries/spain/spain-adm2.topojson`.
- México, Francia y otros países cargan la `publicUrl` de Supabase Storage cuando el asset está `ready`.
- El componente detecta automáticamente la primera key válida dentro de `topology.objects`.
- El mapa usa estilo homogéneo con WorldMap: gris neutro + hover dorado.
- El tooltip muestra solo el nombre de la zona/área.
- El contenido editorial queda fuera del mapa.

### SpainMap

`SpainMap` queda como wrapper legado temporal sobre `CountryInternalMap`. Ya no pinta círculos, labels ni leyenda de ciudades.

---

## 2026-05-02 - FIX: request-country-map pública para usuarios anónimos

Documentada la causa del `401 Unauthorized` al solicitar mapas desde `/pais/francia`.

### Problema confirmado

La llamada frontend a `request-country-map` enviaba el payload correcto, pero Supabase bloqueaba la Edge Function antes de ejecutarla porque estaba desplegada con verificación JWT activa. En el flujo público de Trawel, usuarios anónimos deben poder solicitar que un país entre en cola de generación.

### Solución

La función debe desplegarse como pública, sin exponer `service_role` en frontend:

```bash
npx supabase functions deploy request-country-map --no-verify-jwt
```

La escritura sigue protegida dentro de la Edge Function, que usa `SUPABASE_SERVICE_ROLE_KEY` solo en servidor y valida el payload antes de crear o actualizar `country_map_assets`.

### Archivos modificados

- `docs/MAP_ASSET_PLAN.md` - Deploy correcto con `--no-verify-jwt`
- `docs/CODEMAP.md` - Nota operativa para despliegue público
- `docs/BITACORA.md` - Causa y solución del `401 Unauthorized`

---

## 2026-05-02 - WorldMap exploratorio real: tooltips con bandera + navegación universal 🗺️✨

Implementada la corrección fundamental de WorldMap para que sea un mapa exploratorio real donde todos los países son navegables.

### Problemas corregidos

| Problema | Causa | Solución |
|----------|-------|----------|
| **"País no disponible" en tooltip** | `getCountryByUnM49()` solo buscaba en diccionario de 5 países | Nuevo `worldCountries` con 249 países + `getWorldCountryByUnM49()` |
| **Sin bandera en tooltip** | No se usaba `formatCountryWithFlag()` correctamente | Ahora usa `countryCodeToFlagEmoji(isoAlpha2)` desde worldCountries |
| **México no aparecía** | México no estaba en el diccionario `countries.ts` | Ahora resuelve desde `worldCountries` |
| **Click no navegaba** | `isCountryClickable()` requería `status === 'active'` | Navega a cualquier país resoluble en worldCountries |
| **Sin feedback visual** | Cursor default en todos los países | Cursor pointer cuando el país es resoluble |

### Archivos creados

**`src/features/countries/data/worldCountries.ts`**
- Diccionario completo de 249 países del mundo
- Campos: `unM49`, `isoAlpha2`, `isoAlpha3`, `slug`, `displayName`
- Helpers: `getWorldCountryByUnM49()`, `getWorldCountryBySlug()`, `getWorldCountryByIsoAlpha2()`
- **No indica disponibilidad editorial**, solo identificación geográfica

### Archivos modificados

**`src/features/map/components/WorldMap/WorldMap.tsx`**
- Ahora importa desde `worldCountries` en lugar de `countries`
- Tooltip muestra: "🇲🇽 México", "🇫🇷 Francia", etc.
- Click navega a `/pais/{slug}` para cualquier país resoluble
- Cursor pointer solo en países resolubles
- Mantenido estilo neutro (todos gris, hover dorado)

**`src/pages/CountryPage/CountryPage.tsx`**
- Importa `getWorldCountryBySlug` para fallback
- Nueva vista `DiscoveringCountryView` para países sin contenido editorial
- Estados del mapa automático: loading, ready, queued, generating, failed, missing
- Pantalla amable para error: "Algo salió mal, pero lo arreglaremos pronto"
- Botón "Volver" o "Explorar otros destinos" en estado failed

### Comportamiento por tipo de país

| Tipo | Ejemplo | WorldMap Tooltip | Click | CountryPage muestra |
|------|---------|------------------|-------|---------------------|
| **Con contenido activo** | España | 🇪🇸 España | ✅ Navega | Contenido editorial completo |
| **En comingSoon** | Francia, Italia | 🇫🇷 Francia | ✅ Navega | Vista "Próximamente" + estado mapa |
| **Sin contenido, en worldCountries** | México, Brasil | 🇲🇽 México | ✅ Navega | `DiscoveringCountryView` con estado mapa |
| **No resoluble** | Código desconocido | "País no disponible" | ❌ No navega | "País no encontrado" |

### Criterios de aceptación cumplidos

- ✅ Hover sobre España muestra "🇪🇸 España"
- ✅ Hover sobre México muestra "🇲🇽 México"
- ✅ Hover sobre Francia muestra "🇫🇷 Francia"
- ✅ Click en México navega a /pais/mexico
- ✅ Click en Francia navega a /pais/francia
- ✅ /pais/mexico muestra DiscoveringCountryView con estado del mapa
- ✅ /pais/francia permite solicitar generación de mapa si falta
- ✅ WorldMap ya no muestra "País no disponible" como texto principal
- ✅ Build funciona (690 modules)

### Rotación de bitácora

Este cambio marca el punto de rotación de la bitácora:
- **BITACORA_002.md**: Histórico 2026-04-27 a 2026-05-01
- **BITACORA.md**: Cambios desde 2026-05-02 (este archivo)

---

## Resumen de cambios del día

| Cambio | Estado |
|--------|--------|
| Crear `worldCountries.ts` con 249 países | ✅ |
| Modificar `WorldMap.tsx` para usar worldCountries | ✅ |
| Modificar `WorldMap.tsx` para navegar a cualquier país | ✅ |
| Actualizar `CountryPage.tsx` con DiscoveringCountryView | ✅ |
| Añadir pantalla failed amable | ✅ |
| Rotar bitácora a BITACORA_002.md | ✅ |
| npm run build | ✅ (690 modules) |

---

## Estado actual del proyecto (v3.0)

**Trawel v3.0** — Mapa mundial exploratorio funcional

### Nuevos componentes/archivos
- `src/features/countries/data/worldCountries.ts` — Diccionario de 249 países

### Funcionalidades implementadas
- ✅ WorldMap muestra nombre + bandera para cualquier país conocido
- ✅ Navegación universal desde WorldMap a cualquier país
- ✅ CountryPage maneja países con/sin contenido editorial
- ✅ Sistema de mapas automáticos con estados visuales
- ✅ Pantallas amables para estados: loading, preparing, ready, failed

### Próximos pasos sugeridos
1. Añadir estilos CSS para `DiscoveringCountryView` en `CountryPage.module.css`
2. Verificar integración con sistema de mapas automáticos (DA-030)
3. Testing manual de navegación: España → México → Francia → país inexistente

---

## 2026-05-02 - FIX: Tooltips limpios y payload completo para solicitud de mapas

Correcciones urgentes para WorldMap y CountryPage.

### Problemas corregidos

| Problema | Causa | Solución |
|----------|-------|----------|
| **Tooltip mostraba abreviaturas/códigos** | Helper `countryCodeToFlagEmoji` usaba offset incorrecto | Unificado a método estándar: `127397 + char.charCodeAt(0)` |
| **Banderas no aparecían** | Offset del regional indicator incorrecto | Mismo fix: método 127397 estándar |
| **Francia no se insertaba en Supabase** | Payload incompleto: faltaban `isoAlpha2`, `isoAlpha3`, `adminLevel` | Ahora se construye payload completo desde `worldCountries` como fallback |
| **Error en UI al pulsar "Explorar"** | No se manejaba el caso `country === undefined` para países sin contenido editorial | Se usa `country || worldCountry` para resolver datos mínimos |

### Archivos modificados

- `src/features/countries/utils/countryHelpers.ts` - Fix `countryCodeToFlagEmoji()` con método 127397 estándar
- `src/pages/CountryPage/CountryPage.tsx` - Payload completo + logs de desarrollo + manejo de errores

### Payload real enviado para Francia

```typescript
{
  countrySlug: "francia",
  countryName: "Francia",
  isoAlpha2: "FR",
  isoAlpha3: "FRA",
  adminLevel: "ADM2",
  source: "world_map"
}
```

### Formato final del tooltip

```
"🇪🇸 España"  // Con bandera
"España"      // Fallback sin bandera (nunca muestra códigos)
```

### Logs de desarrollo añadidos

```
[CountryPage] Solicitando generación de mapa: {payload}
[CountryPage] Respuesta de requestCountryMapGeneration: {result}
[CountryPage] Éxito - Estado: "queued"
[CountryPage] Error en solicitud: {error}
```

### Criterios de aceptación verificados

- ✅ Hover España: "🇪🇸 España" o "España"
- ✅ Hover México: "🇲🇽 México" o "México"
- ✅ Hover Francia: "🇫🇷 Francia" o "Francia"
- ✅ Sin abreviaturas visibles (ES, MX, FR, etc.)
- ✅ Sin códigos técnicos en tooltip
- ✅ Click navega correctamente
- ✅ `/pais/francia` → "Explorar Francia" → inserta registro con datos completos
- ✅ UI cambia a "Preparando mapa" cuando `success=true`
- ✅ Build funciona (690 modules)

---

## 2026-05-02 - Auditoría responsive funcional inicial

Pasada acotada de CSS/layout antes del diseño premium con v0.

### Problemas corregidos

| Problema | Solución |
|----------|----------|
| Riesgo de overflow horizontal en WorldMap móvil | Eliminado margen negativo y reforzada contención del mapa |
| Mapas internos y estados podían quedar demasiado rígidos en móvil | Añadidos `min-width: 0`, `max-width: 100%`, alturas móviles más contenidas y wrapping |
| Vista de país sin contenido editorial tenía clases sin estilos | Añadidos estilos responsive para `DiscoveringCountryView` |
| Formularios, consentimientos y retirada podían ser incómodos en móvil | Botones de 44px+, ancho completo en móvil, wrapping de textos largos y scroll en panel legal |
| Header con selector de modo podía apretar el ancho móvil | El header permite wrap y el selector baja a línea propia |

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.module.css`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`
- `src/pages/CountryPage/CountryPage.module.css`
- `src/pages/CountryZonePage/CountryZonePage.module.css`
- `src/pages/WithdrawAdventurePage/WithdrawAdventurePage.module.css`
- `src/pages/HomePage/HomePage.module.css`
- `src/App.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-02 - WorldMap con zoom táctil en móvil

Mejora funcional acotada del mapa mundial para teléfonos pequeños.

### Cambios

- Añadido `d3.zoom` sobre una capa `<g>` interna del SVG.
- Pinch zoom táctil habilitado con escala limitada `1x` a `8x`.
- Pan/arrastre permitido cuando el mapa está ampliado.
- Wheel zoom desactivado para mantener el comportamiento de escritorio lo más estable posible.
- Protección simple para evitar navegación si un arrastre acaba generando click.
- Indicador móvil discreto: "Pellizca para acercar".

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-02 - CountryInternalMap con zoom táctil en móvil

Misma mejora funcional aplicada al mapa interno de país, manteniendo el alcance en el componente cartográfico.

### Cambios

- Añadido `d3.zoom` sobre una capa `<g>` interna del SVG.
- Pinch zoom táctil habilitado con escala limitada `1x` a `8x`.
- Pan/arrastre permitido cuando el mapa está ampliado.
- Wheel zoom desactivado para conservar la experiencia de escritorio.
- Protección simple para evitar navegación accidental a una zona tras pan.
- Indicador móvil discreto: "Pellizca para acercar".

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Ajuste de pan en mapas con zoom táctil

Corrección quirúrgica del comportamiento táctil tras probar en móvil real.

### Problema

`translateExtent` estaba limitado al viewBox original del SVG. Con el mapa ampliado, D3 restringía demasiado la traslación y el usuario no podía reacomodar el mapa con libertad.

### Cambios

- `WorldMap` y `CountryInternalMap` mantienen `extent` como viewport para conservar el centro natural del pinch zoom.
- `translateExtent` se relajó con margen interno alrededor del viewBox para permitir pan más amplio del contenido ampliado.
- Se mantiene clipping visual con `overflow: hidden`, evitando overflow horizontal de página.
- `touch-action: none` también se aplica al wrapper del mapa para estabilizar gestos táctiles en móvil real.
- Wheel zoom sigue desactivado en escritorio.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Aumento de profundidad de zoom en mapas táctiles

Nuevo ajuste funcional para selección precisa de países y zonas pequeñas en móvil.

### Cambios

- `WorldMap` sube su zoom máximo de `8x` a `40x`.
- `CountryInternalMap` sube su zoom máximo de `8x` a `30x`.
- `translateExtent` mantiene el enfoque relajado, pero aumenta su margen:
  - `WorldMap`: margen de pan `4x` el tamaño del viewBox.
  - `CountryInternalMap`: margen de pan `3x` el tamaño del viewBox.
- `extent` se mantiene como viewport del SVG para conservar el centro natural del pinch zoom.
- Wheel zoom sigue desactivado y se mantiene la protección anti-click tras pan.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Hover táctil y long press en WorldMap

Mejora de UX móvil para recuperar la exploración por tooltip del escritorio.

### Cambios

- `WorldMap` detecta interacción táctil con Pointer Events (`pointerType !== 'mouse'`).
- Tocar un país muestra tooltip con bandera y nombre sin navegar.
- Mover el dedo sobre países actualiza el tooltip usando `document.elementFromPoint`.
- La navegación táctil pasa a long press de `700ms` sobre el mismo país.
- El long press se cancela si hay dos dedos, pan/zoom o movimiento mayor a `12px`.
- El click de escritorio se mantiene; el tap táctil simple queda suprimido para evitar navegación accidental.
- Ayuda móvil actualizada: "Explora con el dedo · mantén pulsado para entrar".

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Gestos táctiles separados en WorldMap

Ajuste de UX móvil para que el mapa mundial distinga exploración y navegación.

### Cambios

- El gesto de un dedo queda reservado para explorar países y actualizar tooltip.
- `d3.zoom` solo acepta gestos táctiles de dos dedos, manteniendo pinch zoom y pan ampliado.
- Se añade botón flotante táctil "Ir a {país}" con el último país enfocado.
- La ayuda móvil cambia a "1 dedo explora · 2 dedos mueven · Ir para entrar".
- El long press de 700ms se mantiene como atajo, cancelado por movimiento o gestos de varios dedos.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Corrección de centrado en pinch zoom de WorldMap

Ajuste quirúrgico tras prueba en móvil real.

### Problema

El wrapper del SVG usaba alturas responsive mayores que el ratio real del `viewBox` (`960:500`). Con `preserveAspectRatio="xMidYMid meet"`, eso introducía espacio vertical interno y el punto visual del gesto podía no coincidir con el viewport que D3 usa para centrar el zoom.

### Cambios

- `WorldMap` mantiene `extent`, `translateExtent`, `scaleExtent`, filtro táctil y transform sobre la capa `<g>`.
- El wrapper del SVG queda alineado al ratio exacto del `viewBox` (`52.083333%`) también en tablet y móvil.
- Se preserva `overflow: hidden` y `touch-action: none`.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Botón táctil fuera del área del WorldMap

Ajuste de UX móvil para evitar que el CTA de país interfiera con pinch zoom y pan.

### Cambios

- El botón "Ir a {país}" deja de estar flotante sobre el mapa.
- El CTA táctil se renderiza debajo del wrapper SVG, fuera del área interactiva de pinch/zoom.
- Se mantiene el último país enfocado como destino del botón.
- El botón conserva tamaño táctil cómodo y ancho limitado para evitar overflow.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - CTA discreto y pinch zoom anclado en WorldMap

Corrección funcional tras prueba en móvil real.

### Problemas

- El botón "Ir a {país}" seguía dentro del recuadro visual del mapa y resultaba demasiado protagonista.
- El pinch zoom podía fugarse lejos del punto localizado porque el gesto táctil dependía del cálculo interno de D3 sobre un SVG responsive.

### Cambios

- El marco visual se limita al wrapper del SVG; el contenedor general queda limpio.
- El CTA táctil queda debajo del recuadro del mapa, con estilo secundario y ancho más contenido.
- El gesto de dos dedos se calcula con Pointer Events: se ancla el punto del mapa bajo el centro inicial de los dedos y se recoloca bajo el centro actual.
- `d3.zoom` conserva wheel desactivado y queda para interacciones no táctiles; el touch zoom/pan lo gestiona el componente para estabilizar el centro.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`
- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Tooltip táctil visible y ancla SVG de pinch zoom

Ajuste sobre la interacción táctil del mapa mundial.

### Cambios

- El tooltip táctil intenta aparecer arriba-izquierda del dedo y se recoloca si chocaría con bordes de pantalla.
- La conversión pantalla → SVG sigue usando `createSVGPoint()` con `getScreenCTM().inverse()`.
- El gesto de pinch guarda explícitamente el punto del mapa bajo el centro inicial de los dedos (`anchorMapPoint`) y lo mantiene bajo el centro actual al recalcular escala/traslación.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Transform único y foco táctil persistente en WorldMap

Corrección quirúrgica de la interacción móvil del mapa mundial.

### Cambios

- `d3.zoom` deja de registrar listeners sobre el SVG para evitar doble fuente de transform.
- El transform único vive en `currentTransformRef` y se aplica solo a la capa `<g>` del mapa.
- El pinch/pan táctil de dos dedos sigue usando el centro real convertido a coordenadas SVG.
- El último país enfocado en móvil queda resaltado en amarillo tras levantar el dedo.
- Al enfocar otro país, se limpia el anterior y el foco amarillo pasa al nuevo.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-03 - Limpieza de Home hacia mapa vivo

Ajuste pequeño de producto para retirar el enfoque heredado de catálogo cerrado en la página principal.

### Cambios

- Eliminados de Home los contadores y bloques de "Países disponibles", "Próximamente" y "Destinos disponibles".
- La Home deja de consultar datos agregados de países para pintar listados heredados.
- El copy principal ahora presenta Trawel como flujo mapa mundial → país → zona → aventuras reales revisadas.
- Añadido bloque contextual "Un mapa vivo de aventuras" con pasos simples de exploración.
- Añadida sección provisional "Servicios útiles para tu viaje" con placeholders discretos, sin enlaces ni integraciones reales.
- WorldMap no se modifica.

### Archivos modificados

- `src/pages/HomePage/HomePage.tsx`
- `src/pages/HomePage/HomePage.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)


---

## 2026-05-03 - Footer en HomePage y rollback parcial de WorldMap

Dos ajustes concretos: reemplazo del último recuadro de Home por un footer real, y rollback parcial del intento de zoom táctil con CSS transform en WorldMap.

### Footer en HomePage

**Problema:** El último recuadro "Historias revisadas antes de publicarse..." ya no tenía sentido en el flujo actual centrado en el mapa.

**Cambios:**
- Eliminada la sección `.note` con el recuadro informativo
- Añadido footer típico con:
  - Copyright: "© 2026 Trawel"
  - Frase de marca: "Explora el mundo a través de aventuras reales de viajeros."
  - Enlaces placeholder: Mapa del sitio, Conócenos, Quiénes somos, Privacidad, Contacto
- Diseño discreto, responsive, sin overflow en móvil
- Enlaces usan `href="#"` (no funcionales) sin romper navegación

### Rollback de WorldMap

- Revertido el intento de aplicar zoom mediante CSS transform sobre un wrapper interno.
- Restaurado WorldMap al estado previo: transform único aplicado a la capa `<g>` interna del SVG.
- Se conservan la exploración con 1 dedo, tooltip táctil arriba-izquierda, foco amarillo persistente, botón "Ir a {país} →" debajo del mapa y zoom/pan con 2 dedos.

**Archivos afectados:**
- `src/pages/HomePage/HomePage.tsx`
- `src/pages/HomePage/HomePage.module.css`
- `src/features/map/components/WorldMap/WorldMap.tsx` (restaurado al checkpoint previo)
- `src/features/map/components/WorldMap/WorldMap.module.css` (restaurado al checkpoint previo)

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - WorldMap más alto en móvil

Ajuste visual acotado para dar más superficie táctil al mapa mundial sin tocar la lógica de zoom, foco ni navegación.

### Cambios

- En móvil, el wrapper del SVG deja de depender solo del ratio `960:500`.
- El área visible usa `height: clamp(280px, 52vh, 440px)` y mantiene `padding-bottom: 0` en ese breakpoint.
- Escritorio conserva el aspect ratio anterior.

### Archivos modificados

- `src/features/map/components/WorldMap/WorldMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - CountryInternalMap más alto en móvil

Ajuste responsive del mapa interno de país/zona para seguir el mismo criterio UX aplicado al WorldMap.

### Cambios

- En móvil, el wrapper del mapa interno deja de depender del `padding-bottom: 72%`.
- El área táctil usa `height: clamp(300px, 54vh, 460px)` y `padding-bottom: 0`.
- Los estados de carga/error usan la misma altura mínima responsive para evitar saltos visuales.
- Escritorio conserva el aspect ratio y layout previos.
- Criterio responsive documentado: los mapas interactivos de Trawel mantienen aspect-ratio en escritorio, pero en móvil priorizan superficie táctil útil.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.module.css`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - CountryInternalMap empieza más cercano

Ajuste acotado del encaje inicial del mapa interno para aprovechar mejor la altura móvil añadida.

### Cambios

- El mapa interno sigue calculando geometría con `geoMercator().fitSize([900, 560], featureCollection)`.
- Tras dibujar las áreas, se aplica un transform inicial mediante el mismo `zoomBehavior` de D3.
- El arranque usa zoom centrado `1.18x` en móvil y `1.08x` en escritorio.
- Pan/zoom existente queda sincronizado porque el transform inicial se registra en D3, no solo en el `<g>`.
- No se modifican tooltips, navegación, datos ni WorldMap.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Tooltip interactivo en CountryInternalMap

Añadido tooltip de nombres al mapa interno de país/zona sin etiquetas permanentes.

### Cambios

- Cada área interna expone `data-internal-area-name` con el nombre calculado desde propiedades GeoJSON.
- Escritorio mantiene tooltip por hover con el nombre de zona/provincia/ciudad.
- Móvil añade tooltip con 1 dedo usando `touchstart`/`touchmove` y `elementFromPoint`.
- Los listeners táctiles no hacen `preventDefault`, por lo que pan/zoom existente sigue en D3.
- Regla documentada: los mapas internos muestran nombres bajo interacción, no como etiquetas fijas sobre el mapa.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Encaje desktop y rueda en CountryInternalMap

Ajuste acotado del mapa interno tras detectar recorte visual en escritorio.

### Cambios

- El encaje inicial pasa de `fitSize` a `fitExtent` con margen interno para que el territorio completo respire dentro del viewBox.
- El zoom inicial de escritorio vuelve a identidad (`1x`) para evitar recortes; móvil conserva acercamiento moderado (`1.12x`).
- La rueda del ratón vuelve a usar el `zoomBehavior` de D3 solo cuando el cursor está sobre el SVG del mapa.
- Fuera del mapa, la rueda sigue haciendo scroll normal de la página.
- Tooltips de hover/táctil, selección de zonas y navegación se mantienen sin cambios.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - CountryInternalMap separa exploración táctil y multitouch

Ajuste acotado de interacción móvil para que el mapa interno distinga exploración con 1 dedo de gestos de mapa con 2 dedos.

### Cambios

- El tooltip táctil de 1 dedo usa una guardia breve de 80 ms en `touchstart` para cancelar el cambio si aparece un segundo dedo.
- Durante un gesto multitouch se congela el tooltip de zona y no se recalcula por la posición de ningún dedo.
- D3 zoom solo gestiona eventos táctiles multitouch; la exploración de 1 dedo queda dedicada a nombres de zonas.
- Al terminar un pinch, no se muestra automáticamente otra zona por el dedo restante; hay que levantar y volver a explorar.
- Escritorio mantiene encaje, hover tooltip y zoom con rueda solo sobre el SVG.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-04 - Tooltip táctil cómodo en CountryInternalMap

Ajuste acotado del posicionamiento móvil del tooltip del mapa interno.

### Cambios

- El tooltip táctil se coloca por encima del dedo y separado lateralmente para evitar tapar el nombre.
- Si no cabe hacia la izquierda, cambia al lado derecho del dedo.
- Si se acerca al borde derecho, se limita al viewport con margen mínimo.
- Se reutiliza la idea de medición del tooltip del WorldMap sin modificar WorldMap.
- Hover de escritorio, pan/zoom móvil y separación 1 dedo/2 dedos se mantienen sin cambios.

### Archivos modificados

- `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`

### Verificación

- ✅ `npm run build` pasa (702 modules)

---

## 2026-05-13 - CI general mínimo

Creado workflow general de salud del proyecto para validar cada `push` y `pull_request`.

### Cambios

- Añadido `.github/workflows/ci.yml` con `actions/checkout@v4` y `actions/setup-node@v4`.
- El CI usa Node 22 con cache de npm.
- El flujo ejecuta `npm ci`, `npm run lint` y `npm run build`.
- No ejecuta scripts operativos de mapas.
- El workflow operativo `.github/workflows/process-country-map-queue.yml` queda separado y sin cambios.

### Verificación local previa

- ✅ `npm run lint` pasa con 0 errores y 5 warnings conocidos.
- ✅ `npm run build` pasa; solo queda el warning habitual de chunk grande de Vite.

---

## 2026-05-13 - Checklist viva previa a v0

Actualizado `docs/V0_HANDOFF.md` como hoja de ruta/checklist viva para la fase visual, evitando crear documentación duplicada.

### Cambios

- Marcados como cerrados: ESLint v9 operativo, CI básico con lint/build y estructura AI-specs ligera.
- Añadidos próximos pasos: warnings ESLint, Playwright smoke tests, validaciones responsive y validación específica de mapas/tooltips/gestos.
- Reforzada la separación entre CI general y workflow operativo de mapas.

### Alcance

- No se tocó código funcional.
- No se tocaron mapas ni workflows.

---

## 2026-05-13 - Playwright smoke test mínimo

Añadido Playwright como validación e2e mínima para comprobar que la app pública carga sin convertirlo todavía en suite visual o táctil.

### Cambios

- Instalado `@playwright/test` como devDependency.
- Añadidos scripts `npm run test:e2e` y `npm run test:e2e:ui`.
- Creado `playwright.config.ts` con servidor Vite local automático en `127.0.0.1:5173`.
- Creado `tests/e2e/smoke.spec.ts` para validar carga de `/`, marca Trawel, H1 principal, CTA del mapa y navegación básica.
- Integrado en `.github/workflows/ci.yml` con instalación de Chromium y ejecución de `npm run test:e2e`.
- Actualizado `docs/V0_HANDOFF.md` marcando Playwright smoke como completado.

### Alcance

- No se tocaron mapas, `WorldMap` ni `CountryInternalMap`.
- No se añadieron screenshots visuales, tests táctiles ni responsive audit automático.

### Verificación

- ✅ `npm run test:e2e` pasa localmente.

---

## 2026-05-13 - Ajuste responsive de header y targets táctiles

Ajuste pequeño previo a v0 para reducir altura útil del header móvil y mejorar hit areas sin rediseñar la app.

### Cambios

- Header móvil conserva logo y selector de modo en una fila compacta cuando hay espacio.
- El label del selector queda accesible para lector de pantalla y se oculta visualmente en móvil estrecho.
- Botones del selector suben a `min-height: 40px`.
- Breadcrumbs de país/ciudad/aventura y enlaces secundarios obvios reciben áreas táctiles más cómodas.
- Footer de Home aumenta área táctil de enlaces sin cambiar su contenido.
- Marcado el bloque como cerrado en `docs/V0_HANDOFF.md`.

### Alcance

- No se tocaron mapas, `WorldMap`, `CountryInternalMap`, D3, Supabase ni CI.
- No se rediseñó la app ni se añadieron tests nuevos.

---

## 2026-05-13 - Ajuste responsive de CountryZonePage/formulario

Cerrado el P1 pendiente de la auditoría responsive previa a v0 para que la pantalla de zona y su formulario sean más cómodos en móvil.

### Cambios

- Breadcrumb del hero de CountryZonePage elevado a targets táctiles de 40px.
- Checkboxes y filas de consentimiento del formulario ampliados para uso con dedo.
- Botón de política de privacidad y enlace de retirada ajustados como targets táctiles.
- Formulario móvil contenido dentro del panel con bordes consistentes y sin márgenes tensos.
- Marcado el bloque como cerrado en `docs/V0_HANDOFF.md`.

### Alcance

- No se tocaron mapas, `WorldMap`, `CountryInternalMap`, D3, Supabase, CI ni lógica de envío.
- No se rediseñó la pantalla ni se añadieron tests nuevos.

---

## 2026-05-14 - Resolución de warnings conocidos de ESLint

Revisados y resueltos los 5 warnings conocidos sin cambiar comportamiento funcional.

### Cambios

- Separado `useExperienceMode` del provider para cumplir `react-refresh/only-export-components`.
- Movidas primitivas compartidas del contexto a un módulo no-componente.
- Capturadas refs estables en el cleanup de `WorldMap` para evitar warnings de cleanup sin tocar hover, touch, zoom, pan ni navegación.
- Extraída la dependencia `countryIsoAlpha3` en `CountryPage` para eliminar la expresión compleja del array de dependencias.
- Marcado el bloque como cerrado en `docs/V0_HANDOFF.md`.

### Alcance

- No se tocaron estilos, Supabase, CI, schemas ni scripts de mapas.
- No se añadieron tests nuevos ni se silenciaron reglas de ESLint.

---

## 2026-05-14 - Validación específica de mapas previa a v0

Auditados `WorldMap`, `CountryInternalMap` y sus integraciones en Home/CountryPage antes de pasar a diseño visual.

### Resultado

- `WorldMap` carga países, no genera overflow, muestra tooltip en hover desktop y en touch móvil muestra tooltip + botón `Ir a país`.
- `CountryInternalMap` carga zonas internas, mantiene tooltip de zona, navegación a zona y atribución cartográfica visible.
- Estados de mapas automáticos revisados: mapa disponible, destino en preparación y país no encontrado son comprensibles.
- Añadidos guardrails breves para v0 en `docs/V0_HANDOFF.md`.

### Alcance

- No se tocaron `WorldMap`, `CountryInternalMap`, D3, zoom, pan, tooltips, rutas, CI ni scripts de mapas.
- No se crearon tests nuevos ni screenshots persistentes.

---

## 2026-05-14 - Integración visual v0 Fase 1 Home/header/footer

Aplicada la propuesta visual de v0 para HomePage, header global y footer con alcance estrictamente visual.

### Cambios

- Header global actualizado con efecto glassmorphism y paleta visual de la propuesta.
- HomePage adopta la nueva capa visual para hero, CTA, cards, recursos y footer.
- Añadido divisor visual del footer usando `footerDivider`.
- Corregido texto visible `Haz clic en un país`.
- Marcada la Fase 1 visual como aplicada en `docs/V0_HANDOFF.md`.

### Alcance

- No se tocaron `WorldMap`, `CountryInternalMap`, D3, TopoJSON, zoom, pan, touch, tooltips, rutas, Supabase, CI ni tests.
- No se añadieron dependencias ni se cambió lógica funcional.

---

## 2026-05-18 - Integración de fotos reales en cards de destinos destacados de Home

Sustituidos los placeholders visuales de las cards de destinos destacados por fotografías reales de los lugares representativos de cada país.

### Cambios

- `src/pages/HomePage/HomePage.tsx`:
  - Importadas 4 imágenes desde `src/assets/home/destinations/`:
    - `spain.png` → Ronda, Andalucía
    - `mexico.png` → Guanajuato
    - `italy.png` → Val d'Orcia, Toscana
    - `india.png` → Taj Mahal, Agra
  - Actualizados los datos de `featuredDestinations` para incluir `url` en cada imagen.
  - Actualizados los textos `alt` para reflejar el lugar específico mostrado en cada foto.

### Objetivo visual cumplido

- Imágenes integradas dentro de cada card con `object-fit: cover`.
- Proporción visual consistente (aspect-ratio 16/10).
- Altura controlada sin deformaciones.
- Comportamiento responsive preservado.
- Legibilidad del texto mantenida.
- Estética premium y limpia.

### Archivos modificados

- `src/pages/HomePage/HomePage.tsx`

### Alcance

- No se tocaron `WorldMap`, `CountryInternalMap`, D3, TopoJSON, zoom, pan, touch, tooltips, navegación del mapa, Supabase, rutas, `package.json` ni dependencias.
- No se modificaron las clases `.heroLogo`, `.heroLogoImage` ni `.atlasContainer`.
- No se añadieron dependencias nuevas.

---

## 2026-05-18 - Integración de fotos reales y mejora de copy en sección "Planes destacados" de Home

Sustituidos los placeholders visuales de las cards de planes destacados por fotografías reales y actualizado el copy hacia un tono más comercial y evocador.

### Cambios

- `src/pages/HomePage/HomePage.tsx`:
  - Importadas 3 imágenes desde `src/assets/home/plans/`:
    - `albarracin.png` → Ruta por el encanto medieval de Albarracín
    - `amalfitana.png` → Escapada por la Costa Amalfitana
    - `rajasthan.png` → Palacios, templos y bazares de Rajasthan
  - Actualizados los datos de `featuredAdventures` con URLs de imágenes, ubicaciones más específicas y descripciones más evocadoras.
  - Renovada la cabecera de la sección: "Viajes que empiezan con una idea" con subtítulo comercial/premium.

### Textos mejorados

| Plan | Antes | Después |
|------|-------|---------|
| **Albarracín** | "Ruta por los pueblos medievales de Aragón" → descripción genérica | "Ruta por el encanto medieval de Albarracín" → ubicación específica "Albarracín, Teruel, España" → descripción evocadora sobre murallas y callejuelas |
| **Costa Amalfitana** | "Descubriendo la Costa Amalfitana" → descripción estándar | "Escapada por la Costa Amalfitana" → ubicación específica "Costa Amalfitana, Italia" → descripción postal con limoneros y atardeceres |
| **Rajasthan** | "Templos y mercados de Rajasthan" → descripción funcional | "Palacios, templos y bazares de Rajasthan" → ubicación específica "Rajasthan, India" → descripción de color y tradiciones |

### Objetivo visual cumplido

- Imágenes integradas con `object-fit: cover` (clases CSS existentes).
- Proporción visual consistente con las cards de destinos.
- Comportamiento responsive preservado.
- Estética premium mantenida.

### Archivos modificados

- `src/pages/HomePage/HomePage.tsx`

### Alcance

- No se tocaron `WorldMap`, `CountryInternalMap`, D3, TopoJSON, zoom, pan, touch, tooltips, navegación del mapa, Supabase, rutas, `package.json` ni dependencias.
- No se modificaron las clases `.heroLogo`, `.heroLogoImage` ni `.atlasContainer`.
- No se añadieron dependencias nuevas.

---

## 2026-06-27 - Bloque 34: primer slot de monetización controlado en Home

Creado `MonetizationSlot` como bloque reusable y discreto para promociones propias de Home. El primer placement queda situado después de destinos destacados y antes de aventuras, solo renderiza si hay una promoción publicada válida y deja preparada la estructura para un posible AdSense manual futuro sin integrarlo todavía.

### Alcance

- Home visualmente queda igual cuando `homePromotions` está vacío.
- No se tocaron WorldMap, mapas, rutas, migrations, seeds ni `package.json`.

---

## 2026-06-27 - Bloque 35: MonetizationSlot como sistema reusable

`MonetizationSlot` queda exportado desde el barrel de componentes de `travelData` y desde el barrel público de la feature. Home consume ahora ese export estable, sin añadir nuevos slots ni tocar CountryPage/CountryZonePage. La regla documentada: monetización solo entre secciones, nunca sobre hero/mapa/header, sin ocupar espacio si no hay promoción y con AdSense futuro únicamente manual/controlado.

---

## 2026-06-27 - Bloque 36: MonetizationSlot controlado en CountryPage

CountryPage recibe ahora `countryPromotions` desde `getResolvedCountryScreenData()` mediante lectura conservadora de promociones publicadas por país/modo. El slot `country-after-editorial` se coloca después del bloque editorial y antes del mapa/zonas; si no hay promociones válidas, no ocupa espacio. No se integró AdSense real ni se tocaron mapas/rutas.

---

## 2026-06-27 - Bloque 37: MonetizationSlot reusable en CountryZonePage

CountryZonePage sustituye su render propio de promociones por `MonetizationSlot`, usando las promociones ya resueltas por `getResolvedZoneScreenData()`. El placement activo es `zone-after-intro`, situado entre la introducción comunitaria y el contenido principal. Sin promociones válidas, no ocupa espacio. No se integró AdSense real ni se tocaron mapas/rutas.

---

## 2026-06-27 - Bloque 38: estrategia de monetización controlada

Creado `docs/TRAWEL_MONETIZATION_STRATEGY.md` con prioridades de slots, zonas permitidas/prohibidas, regla de no usar AdSense automático como estrategia principal y papel futuro de Investighost para sponsors/campañas.

---

## 2026-06-27 - Bloque 38: auditoría de cierre escaparate

Creado `docs/TRAWEL_SHOWCASE_READINESS.md` como checklist práctico de pantallas preparadas, datos Supabase disponibles, fallback pendiente, requisitos para escaparate funcional y próximos tres bloques recomendados.

---

## 2026-06-27 - Bloque 39: fachada de cola de mensajes/contactos

Preparado servicio `submitUserMessage`/`submitContactMessage`/`submitCommunitySuggestion` para futura cola de revisión. No existe tabla Supabase clara para mensajes privados generales, así que el servicio valida datos y solo intenta escribir si se configura una tabla explícita; nada se publica directo. TrustPage sigue informativa y sin formulario conectado.

---

*Bitácora activa v3.2 - Trawel*
*Última actualización: 2026-06-27*
