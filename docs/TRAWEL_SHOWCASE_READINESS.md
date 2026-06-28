# Trawel Showcase Readiness

Auditoria practica para cerrar la etapa de escaparate publico y evitar microbloques infinitos.

La checklist operativa de salida real vive en `docs/TRAWEL_PRODUCTION_READINESS_CHECKLIST.md`.

## 1. Pantallas Ya Preparadas

- [x] Home: usa fachada `getResolvedHomeScreenData()` y puede mezclar remoto/fallback.
- [x] CountryPage: usa `getResolvedCountryScreenData()` con pais, editorial y promociones.
- [x] CountryZonePage: usa `getResolvedZoneScreenData()` con zona y promociones.
- [x] Trust pages: `static_pages` ya permite contenido publicado desde Supabase.
- [~] Compartir/contacto/comunidad: `/contacto` y `/compartir` ya envian a `user_messages`; fotos y reportes siguen con servicios preparados pero sin formulario publico.
- [x] Handoff Investighost -> Trawel: existe manual maestro para alimentar Supabase sin mezclar panel editorial dentro de Trawel.
- [x] Auditoria de colas de usuario: `docs/TRAWEL_USER_QUEUE_READINESS.md` confirma preparacion local y bloqueos de produccion.

## 2. Datos Que Ya Puede Leer Desde Supabase

- [x] `countries`: base de paises destacados y datos de CountryPage.
- [x] `cities`: base conservadora para zonas.
- [x] `destinations`: planes/destinos destacados de Home.
- [x] `editorial_contents`: editorial publicado para pais.
- [x] `promotions`: slots controlados en Home, CountryPage y CountryZonePage.
- [x] `static_pages`: paginas de confianza/legales/estaticas.

## 3. Sigue Local O Fallback

- [ ] Imagenes y assets visuales.
- [ ] Hero/copy cuando no hay remoto suficiente.
- [ ] Algunos planes/destinos destacados.
- [ ] Mapas internos y assets cartograficos.
- [ ] CTA comunidad.
- [ ] Fallback premium de contenido y experiencia.

## 4. Necesario Para Escaparate Funcional

- [x] Recibir mensajes/contactos desde paginas publicas: `/contacto` usa `submitContactMessage(...)` y entra en `user_messages` como `pending_review`.
- [x] Recibir propuestas/sugerencias desde paginas publicas: `/compartir` usa `submitCommunitySuggestion(...)` y entra en `user_messages` como `pending_review`.
- [~] Recibir fotos/aportes de usuarios: tabla remota, servicio y plan de Storage preparados; falta Edge Function/upload seguro y formulario.
- [~] Recibir reportes de contenido: tabla remota y servicio preparados; falta formulario.
- [x] Guardar todo en cola de revision: SQL 008 aplicado manualmente en Supabase real, con RLS activo y sin SELECT publico.
- [x] Nunca publicar directo desde usuario: servicios actuales solo insertan estados iniciales privados.
- [x] Permitir promociones controladas sin invadir la experiencia.
- [x] Mantener fallback premium si falta contenido remoto.

## 5. Queda Para Investighost Futuro

- [ ] Panel de moderacion.
- [ ] Aprobar/rechazar fotos.
- [ ] Aprobar/rechazar comentarios o aportes.
- [ ] Cargar y revisar contenido editorial.
- [ ] Gestionar promociones, sponsors y campanas.
- [ ] Revisar senales de demanda.
- [x] Seguir el handoff maestro `docs/INVESTIGHOST_TO_TRAWEL_HANDOFF_MANUAL.md`.

## 6. Proximos 3 Bloques Recomendados

1. Ejecutar `docs/TRAWEL_PRODUCTION_READINESS_CHECKLIST.md` antes de salida publica.
2. Implementar Edge Function/upload seguro para fotos siguiendo `docs/TRAWEL_USER_PHOTO_STORAGE_PLAN.md`.
3. Preparar formulario de reportes de contenido si se decide abrir ese canal.

## Conclusion

Trawel ya tiene base de escaparate funcional alimentable desde Supabase. La salida real debe validarse con la checklist operativa y la publicacion de aportes de usuario debe mantenerse siempre bajo revision.
