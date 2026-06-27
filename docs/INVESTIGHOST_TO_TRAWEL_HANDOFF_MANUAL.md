# Investighost -> Trawel Handoff Manual

Manual maestro para que Investighost alimente Trawel sin ir a ciegas.

Este documento no implementa Investighost, no crea migraciones y no conecta formularios. Resume como deben repartirse responsabilidades entre Trawel, Supabase e Investighost.

## 1. Rol de cada pieza

- Trawel: escaparate publico. Renderiza contenido aprobado, mantiene fallback premium y nunca modera desde la interfaz publica.
- Supabase: fuente central de verdad. Guarda contenido, estados, colas, promociones, senales y metadatos de revision.
- Investighost: panel maestro, resurtidor y moderador futuro. Crea, revisa, aprueba, rechaza, publica, despublica y mantiene el contenido.

## 2. Supabase Trawel

- Proyecto: `trawel-prod`
- Ref: `pjqisqzxajdfkimtrcby`
- URL: `https://pjqisqzxajdfkimtrcby.supabase.co`

## 3. Tablas que alimentan Trawel

- `countries`: paises base, visibilidad y destacados.
- `cities`: zonas/ciudades/regiones base.
- `destinations`: destinos, planes o lugares destacados.
- `editorial_contents`: copy editorial por entidad y modo.
- `image_assets`: imagenes aprobadas, creditos, licencias y rutas.
- `static_pages`: paginas de confianza, legales e institucionales.
- `promotions`: promociones nativas controladas.
- `demand_signals`: senales internas de demanda.
- `user_messages`: cola privada de contacto, sugerencias y solicitudes.
- `user_photo_submissions`: cola privada de fotos de usuarios.
- `content_reports`: cola privada de reportes, abuso, derechos o retirada.

## 4. Que debe hacer Investighost

- Crear y editar paises en `countries`.
- Crear y editar zonas en `cities`.
- Crear y editar destinos, planes o lugares en `destinations`.
- Cargar editorial `adventure` y `student` en `editorial_contents`.
- Gestionar imagenes, creditos, licencias y consentimientos en `image_assets`.
- Revisar fotos de usuarios desde `user_photo_submissions`.
- Revisar mensajes, contactos, sugerencias y solicitudes desde `user_messages`.
- Revisar reportes desde `content_reports`.
- Gestionar promociones propias o sponsors desde `promotions`.
- Observar senales de demanda desde `demand_signals`.
- Publicar, despublicar, archivar o rechazar contenido segun reglas de estado.

## 5. Estados principales

- `draft`: borrador interno, no visible.
- `published`: contenido publicado y visible si la tabla/pagina lo consume.
- `active`: entidad base visible, usado en tablas legacy como `countries` y `cities`.
- `comingSoon`: demanda o placeholder futuro; no sustituye contenido editorial completo.
- `pending_review`: entrada pendiente de revision.
- `submitted`: envio recibido, especialmente fotos.
- `approved`: aprobado internamente, no necesariamente publicado.
- `rejected`: rechazado, no visible.
- `archived`: retirado del flujo activo.
- `rights_issue`: incidencia de derechos, no visible.
- `removal_requested`: retirada solicitada, pendiente de gestion.
- `paused`: pausado temporalmente, util para promociones o flujos futuros si la tabla lo soporta.

Cada tabla tiene constraints propias. No asumir que todos los estados existen en todas las tablas.

## 6. Regla clave

Nada de usuario se publica directamente.

Todo mensaje, foto, sugerencia, reporte o solicitud entra en cola. Investighost aprueba o rechaza. Trawel publico solo debe leer contenido ya aprobado y publicado, o insertar entradas controladas en colas privadas.

## 7. Como alimentar CountryPage

CountryPage combina datos base, editorial, imagenes y promociones.

- `countries`: debe existir el pais con slug canonico y estado publico compatible.
- `editorial_contents`: para contenido de pais usar `entity_type = 'country'`, `entity_slug = country_slug`, `country_slug`, `mode = 'adventure' | 'student'` y `status = 'published'`.
- `image_assets`: usar si hay hero, card o galeria aprobada para el pais.
- `promotions`: usar contexto de pais con placement controlado, por ejemplo `country-after-editorial`.

Si falta remoto valido, Trawel conserva fallback premium. No forzar publicaciones incompletas.

## 8. Como alimentar CountryZonePage

CountryZonePage combina zona, posibles destinos, imagenes, promociones y futuras fotos aprobadas.

- `cities`: debe existir la zona/ciudad con slug canonico, pais asociado y estado publico compatible.
- `destinations`: usar para planes, lugares o experiencias dentro de la zona cuando aplique.
- `image_assets`: usar para hero, cards o galerias aprobadas de zona/destino.
- `promotions`: usar contexto de zona con placement controlado, por ejemplo `zone-after-intro`.
- `user_photo_submissions`: en el futuro, solo puede alimentar lo publico tras revision y publicacion mediante asset aprobado.

Las fotos pendientes, rechazadas o con incidencia de derechos no deben aparecer nunca en CountryZonePage.

## 9. Como alimentar Home

Home prioriza descubrimiento y entrada por mapa.

- `countries`: usar `featured = true` y estado publico compatible para paises destacados.
- `destinations`: usar `featured = true` y `status = 'published'` para planes/destinos destacados.
- `promotions`: usar contexto `generic/home` y placement controlado, por ejemplo `home-after-featured-destinations`.

Home debe seguir funcionando con fallback si falta contenido remoto.

## 10. Promociones

- Usar slots controlados, nativos y no invasivos.
- No usar popups, overlays o anuncios sobre hero, mapa o navegacion.
- Priorizar promociones propias desde Supabase antes que redes externas.
- AdSense queda como integracion futura manual/controlada, no estrategia automatica por defecto.
- Toda promocion debe tener disclosure visible y contexto claro.

## 11. Fotos y derechos

- Exigir autoria o permiso de uso antes de aceptar una foto.
- Guardar credito publico deseado y email privado de contacto.
- Exigir confirmacion de derechos y consentimiento aplicable.
- Usar estados de revision: `submitted`, `pending_review`, `approved`, `rejected`, `published`, `archived`, `rights_issue`, `removal_requested`.
- `published` solo tras aprobacion y vinculacion a un asset publicable, por ejemplo `published_image_asset_id`.
- Si hay duda de derechos, mantener `rights_issue` o `rejected`; nunca publicar por defecto.

## 12. Mensajes y reportes

- `user_messages` no tiene lectura publica.
- `content_reports` no tiene lectura publica.
- Investighost gestiona estados, prioridad, notas internas, respuesta y resolucion.
- Las notas internas, emails, user agents y motivos de rechazo son privados.
- Reportes de derechos o retirada deben tratarse como prioridad editorial/legal.

## 13. Checklist rapido para agentes

- No tocar Trawel visual sin bloque explicito.
- No tocar maps, `WorldMap`, D3 ni TopoJSON.
- No crear seeds o migrations sin bloque explicito.
- No ejecutar SQL remoto sin autorizacion explicita.
- Usar fallback premium cuando falte remoto.
- Lectura publica solo de contenido `published` o entidades `active`, segun tabla.
- Usuarios nunca publican directo.
- Trawel no es Investighost: el panel maestro vive fuera.

## Referencias

- `docs/TRAWEL_CONTENT_INPUT_GUIDE.md`
- `docs/INVESTIGHOST_CONTRACT.md`
- `docs/TRAWEL_DATABASE_FIRST_ROADMAP.md`
- `docs/TRAWEL_USER_CONTENT_QUEUE_CONTRACT.md`
- `docs/TRAWEL_SHOWCASE_READINESS.md`
- `docs/TRAWEL_MONETIZATION_STRATEGY.md`
