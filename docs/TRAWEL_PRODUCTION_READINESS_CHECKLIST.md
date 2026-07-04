# Trawel Production Readiness Checklist

Checklist practica para validar Trawel como producto online inicial y escaparate funcional antes de salida real.

## 1. Objetivo

- [ ] Validar Trawel como escaparate online real, no como entorno de pruebas.
- [ ] Confirmar que Supabase es fuente viva para contenido aprobado, paginas estaticas, promociones y colas privadas.
- [ ] Confirmar que el crecimiento editorial vendra cargando datos desde Investighost y Supabase.
- [ ] Confirmar que Trawel no depende de editar codigo para publicar contenido editorial nuevo cuando el contrato de datos ya exista.
- [ ] Confirmar que los envios de usuario entran siempre en cola privada y nunca se publican directamente.
- [ ] Ejecutar `docs/TRAWEL_PRE_HOSTING_CHECKLIST.md` antes de subir a hosting real.

## 2. Estado Real Actual

- [x] Home operativa con fachada Database First y fallback premium.
- [x] CountryPage operativa con fachada Database First, fallback local y editorial remoto progresivo.
- [x] CountryZonePage operativa con fachada Database First, fallback local y promociones nativas.
- [x] Paginas trust operativas con fallback local y lectura progresiva desde `static_pages`.
- [x] `/contacto` conectado a Supabase mediante `submitContactMessage(...)`.
- [x] `/compartir` conectado a Supabase mediante `submitCommunitySuggestion(...)`, con pais/zona desde Supabase, tipo controlado, titulo para experiencia/aventura y fotos opcionales estandarizadas localmente.
- [x] Colas reales creadas en Supabase:
  - `user_messages`.
  - `user_photo_submissions`.
  - `content_reports`.
- [x] Nada enviado por usuarios se publica directamente.
- [x] Monetizacion controlada preparada mediante `MonetizationSlot` y `promotions`.
- [x] Manual Investighost -> Trawel disponible para orientar carga y moderacion futura.
- [x] Revision final pre-hosting local superada en `docs/TRAWEL_FINAL_PRE_HOSTING_REVIEW.md`.

## 3. Rutas Criticas A Verificar

- [x] `/`
- [x] `/contacto`
- [x] `/pais/mexico`
- [x] `/pais/espana`
- [x] `/pais/espana/zona/albarracin`.
- [x] `/sobre-trawel`
- [x] `/privacidad`
- [x] `/cookies`
- [x] `/terminos`
- [x] `/compartir`

Si una zona sugerida no existe o no esta activa, sustituirla por una ruta real publicada en `cities`/fachada de zona y dejar anotada la ruta usada.

## 4. Checklist Visual

- [ ] Hero carga correctamente en Home.
- [ ] Logo y header aparecen correctos en desktop y movil.
- [ ] Mapa mundial se mantiene intacto y navegable.
- [ ] Cards y bloques destacados mantienen jerarquia visual coherente.
- [ ] Fallback premium aparece correctamente cuando falta contenido remoto.
- [ ] Modos `adventure` y `student` funcionan donde aplica.
- [ ] `MonetizationSlot` no rompe estructura ni empuja contenido critico.
- [ ] La experiencia es legible en movil y desktop.
- [ ] No hay textos solapados, botones cortados ni secciones vacias visibles.
- [ ] Las paginas trust mantienen tono sobrio y claro.

## 5. Checklist Funcional

- [x] Home lee datos remotos o fallback sin romper.
- [x] Mexico carga editorial remoto publicado cuando esta disponible.
- [x] Espana carga contenido remoto disponible y conserva fallback cuando falte una pieza.
- [x] CountryZonePage resuelve una zona real sin romper.
- [ ] Promociones se muestran solo si existen, estan publicadas y encajan con el placement.
- [x] `/contacto` inserta realmente en `user_messages`.
- [x] `/compartir` inserta realmente en `user_messages`.
- [x] Reportar contenido inserta realmente en `content_reports`.
- [x] Los mensajes de contacto entran como `pending_review`.
- [x] Los mensajes de contacto guardan `source_page='contacto'`.
- [x] Los mensajes de contacto guardan `privacy_accepted=true`.
- [x] Las colas no tienen `SELECT` publico util para el cliente anon segun auditorias previas y revision final.
- [x] `npm run build` pasa antes de publicar.
- [x] No aparecen errores visibles en consola durante las rutas criticas revisadas en preview.
- [ ] Fallback SPA del hosting preparado para rutas internas.

## 6. Checklist Supabase

Proyecto correcto:

- [x] `trawel-prod`.
- [x] Ref `pjqisqzxajdfkimtrcby`.

Tablas activas a comprobar:

- [x] `countries`.
- [x] `cities`.
- [ ] `destinations`.
- [ ] `editorial_contents`.
- [ ] `promotions`.
- [ ] `static_pages`.
- [x] `user_messages`.
- [x] `user_photo_submissions`.
- [x] `content_reports`.

Seguridad de colas:

- [ ] RLS activo en `user_messages`.
- [ ] RLS activo en `user_photo_submissions`.
- [ ] RLS activo en `content_reports`.
- [ ] No hay policies publicas de `SELECT` en `user_messages`.
- [ ] No hay policies publicas de `SELECT` en `user_photo_submissions`.
- [ ] No hay policies publicas de `SELECT` en `content_reports`.
- [ ] `INSERT` publico esta limitado por RLS y grants de columnas.

## 7. Que Puede Enseñarse Como Real

- Trawel como escaparate publico online inicial.
- Home, paises y zonas navegables con fallback premium.
- Mexico y Espana con contenido remoto disponible desde Supabase.
- Contacto real que entra en cola privada.
- Sistema de moderacion preparado mediante colas.
- Promociones controladas preparadas sin invadir la experiencia.
- Base lista para ser alimentada desde Investighost.

## 8. Siguiente Fase Real

- [x] Conectar `/compartir` o sugerencias a `user_messages`.
- [ ] Elegir hosting multiweb de pago.
- [ ] Preparar deploy segun hosting elegido.
- [ ] Publicar Trawel online.
- [ ] Validar rutas y formularios online post-deploy.
- [ ] Preparar subida real de fotos con Storage seguro.
- [ ] Crear o activar Investighost como panel de carga y moderacion.
- [ ] Cargar mas paises, zonas y destinos desde Supabase.
- [ ] Preparar panel para aprobar y rechazar contenido de usuario.
- [ ] Preparar flujo de revision de reportes de contenido.
- [ ] Evaluar AdSense manual futuro si procede.

## 9. Mensaje De Posicionamiento

Usar:

- Producto online inicial.
- Escaparate funcional.
- Version real progresiva.
- Base lista para ser alimentada desde Investighost.

Evitar:

- Prototipo sin datos.
- Maqueta.
- Contenido publicado desde codigo.

Mensaje recomendado:

> Trawel es un producto online inicial: un escaparate funcional de destinos con Supabase como fuente viva, entrada de contacto real y una base preparada para crecer desde Investighost sin publicar aportes de usuario sin revision.
