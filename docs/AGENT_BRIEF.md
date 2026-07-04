# Agent Brief - Trawel

> **Start here.** Documento de entrada rápida para agentes en microtareas.
> 
> **Regla de oro:** Lee esto primero, luego los docs específicos que necesites. No releas todo.

---

## 1. Propósito del proyecto

Trawel es una **app pública de exploración de destinos de viaje**:

- Lee contenido aprobado desde Supabase
- Modo dual: Aventura (viajero) / Estudiante (educativo)
- **NO es panel editorial** → Investighost es otro proyecto
- **NO valida contenido** → Solo muestra lo aprobado

---

## 2. Flujo público actual

```
Home/Mundo → País → Zona → Aventuras futuras

/                      (HomePage)
/pais/espana           (CountryPage)
/pais/espana/zona/castilla-y-leon  (CountryZonePage)
```

**Dirección de producto:** Trawel pasa a ser principalmente interactivo por mapa. Las rutas antiguas de ciudad/aventura pueden existir, pero CountryPage ya no debe depender de tarjetones heredados como experiencia principal.

---

## 3. Fuente de datos

**Fase data-driven:** Trawel entra en una fase de transicion hacia contratos de datos para Supabase e Investighost. Antes de proponer cambios estructurales sobre paises, zonas, lugares, rutas, planes, imagenes, demanda o paginas estaticas, consultar `docs/TRAWEL_DATA_CONTRACTS.md`.

**Roadmap Database First:** consultar `docs/TRAWEL_DATABASE_FIRST_ROADMAP.md` como checklist oficial para llevar Trawel a funcionamiento 100% base de datos, manteniendo Supabase como fuente central e Investighost como panel futuro externo.

**Checklist salida online:** consultar `docs/TRAWEL_PRODUCTION_READINESS_CHECKLIST.md` para validar Trawel como producto online inicial y escaparate funcional antes de publicarlo o ensenarlo como version real progresiva.

**Checklist pre-hosting:** consultar `docs/TRAWEL_PRE_HOSTING_CHECKLIST.md` antes de subir Trawel a hosting real para validar variables `VITE_`, build `dist/`, fallback SPA y pruebas online post-deploy.

**Revision final pre-hosting:** `docs/TRAWEL_FINAL_PRE_HOSTING_REVIEW.md` deja registrada la revision local del bloque 69. Decision: Trawel esta listo para preparar hosting multiweb de pago. Se verificaron build, preview, rutas criticas, header responsive, `/compartir`, formularios reales, Supabase y limpieza de filas test. Los siguientes bloques deben elegir hosting y preparar deploy sin cambiar Storage ni abrir colas.

**Manual Investighost -> Trawel:** consultar `docs/INVESTIGHOST_TO_TRAWEL_HANDOFF_MANUAL.md` como manual maestro para entender que debe alimentar Investighost, que tablas usa Trawel, estados principales, colas de usuario, promociones y reglas de no publicacion directa.

**Modelo Supabase futuro:** antes de proponer tablas, migraciones, cambios de datos o RLS, consultar `docs/TRAWEL_SUPABASE_MODEL.md`.

**Mapeo Supabase legacy:** existe `docs/TRAWEL_SUPABASE_LEGACY_MAPPING.md` para reutilizar `trawel-prod` sin reconstruir desde cero. Antes de tocar Supabase, migraciones, RLS, Storage, Edge Functions o servicios de datos, consultarlo.

**Supabase fase 1 producto:** existe la migracion local `supabase/migrations/007_create_product_content_tables.sql` con tablas paralelas `editorial_contents`, `image_assets`, `static_pages`, `demand_signals` y `promotions`. No sustituye `countries`, `cities`, `destinations`, `traveler_adventures` ni `country_map_assets`; no se ha ejecutado contra remoto desde Trawel. Las promociones deben ser bloques nativos con disclosure visible, nunca popups/overlays invasivos.

**Lectura producto fase 1:** existe `src/features/travelData/productContent/` con funciones async read-only para `editorial_contents`, `static_pages` y `promotions`. Devuelve vacio/null si Supabase no esta configurado y filtra `published`. `TrustPage`, `CountryZonePage` y `CountryPage` ya la consumen de forma progresiva con fallback local silencioso; Home no esta conectada.

**Home data-driven inicial:** `HomePage` consume `getResolvedHomeScreenData(mode)` para hero, destinos destacados, planes destacados y CTA comunidad. Puede intentar paises destacados desde `countries` legacy (`status` publico y `featured=true`), planes/destinos destacados desde `destinations` legacy (`status=published`, `featured=true`) y deja preparadas `homePromotions` desde `promotions` para contexto `generic/home`, manteniendo `getHomeScreenFallbackData(mode)` como fallback local inmediato. No cambia `WorldMap` ni muestra promociones en Home todavia.

**CTA Comunidad en Home:** el CTA de Comunidad invita a contar experiencias y tambien a recomendar sitios para visitar, enlazando siempre a `/compartir`. No debe enviar usuarios a formularios alternativos ni publicar contenido directamente.

**Modelo publico Comunidad:** `docs/TRAWEL_COMMUNITY_PUBLIC_MODEL.md` define que `/comunidad` debe mostrar solo aportes aprobados: experiencias, fotos y recomendaciones de sitio. Las cards publicas deben tener destino por `country_slug` y, si existe, `zone_slug`. Nada pendiente, rechazado, reportado o sin derechos claros aparece en la pagina; Investighost aprueba, rechaza, publica y retira.

**Seed producto fase 1:** existe `supabase/seed/007_product_content_seed.sql` como seed local minimo para probar paginas estaticas, una promocion demo marcada como prueba y contenido editorial publicado de Espana. No se ejecuta automaticamente ni debe lanzarse contra remoto sin bloque explicito.

**Fachada Country/Zone:** empieza a existir una fachada data-driven en `src/features/travelData/screenData/` con `getCountryScreenData()` y `getZoneScreenData()`. Los proximos cambios de pais/zona deben respetarla y evitar nuevo contenido hardcoded en paginas.

**Repositorio puente Country/Zone:** la fachada Country/Zone delega actualmente en un repositorio local (`localCountryZoneScreenData.repository.ts`) que implementa `CountryZoneScreenDataRepository`. Futuros repositorios Supabase legacy o data-driven deben respetar esa interfaz antes de cambiar paginas.

**CountryPage data-driven:** `CountryPage` consume `getResolvedCountryScreenData(countrySlug, mode)` como fachada resuelta de pantalla: parte de `getCountryScreenData(...)` como fallback local, intenta leer datos base seguros desde `countries` legacy (`slug`, `name_es`, `status`, `featured`, `capital_es`, `description_es`), expone datos base (`countryName`, `countrySlug`, ISO/codigos, `pageData`, hero, editorial y metadata) y sustituye solo el editorial si `editorial_contents` remoto publicado esta completo. `CountryPage` no debe llamar directamente a `getCountryPageData(...)`; los siguientes pasos deben mover mas campos de `pageData` hacia contratos Supabase sin romper fallback. El contrato minimo para Investighost esta documentado en `docs/INVESTIGHOST_CONTRACT.md`: pais publicado requiere `entity_type=country`, `entity_slug`, `country_slug`, `mode`, `status=published`, `headline`, `intro`, `what_makes_special`, `highlights`, `suggested_route` y `practical_tips` completos.

**Entrada de contenido Trawel:** `docs/TRAWEL_CONTENT_INPUT_GUIDE.md` documenta como debe venir ordenado el contenido editorial para cargar `editorial_contents` en Supabase: campos minimos, modos `adventure`/`student`, calidad de copy, seguridad editorial, convencion de `load_slug` y flujo recomendado de borrador SQL -> revision humana -> ejecucion manual -> verificacion.

**Colas de contenido de usuario:** `docs/TRAWEL_USER_CONTENT_QUEUE_CONTRACT.md` define el contrato minimo para `user_messages`, `user_photo_submissions` y `content_reports`. El SQL 008 ya fue aplicado manualmente en Supabase real `trawel-prod`, creando estas colas con RLS, inserts publicos controlados y sin lectura publica. Trawel solo debe insertar en cola; Investighost revisara estados y ninguna entrada de usuario se publica directamente.

**Readiness final colas publicas:** `docs/TRAWEL_PUBLIC_QUEUES_FINAL_READINESS.md` confirma que `user_messages`, `user_photo_submissions` y `content_reports` ya fueron verificadas contra Supabase real con defaults seguros, sin `SELECT` publico y con filas test eliminadas. `/contacto`, `/compartir` y los reportes discretos de `TrustPage` ya estan conectados; fotos siguen pendientes de formulario visual.

**Mapa entradas publicas:** `docs/TRAWEL_PUBLIC_INPUTS_MAP.md` resume cada entrada publica, ruta/ubicacion, servicio frontend, tabla Supabase, estado por defecto, publicacion directa y responsable de revision.

**Readiness colas usuario:** `docs/TRAWEL_USER_QUEUE_READINESS.md` audita el estado final de colas: tablas remotas y servicios estan preparados, pero no se deben conectar formularios publicos hasta revisar UX, antispam y storage seguro para fotos.

**Storage fotos usuario:** `docs/TRAWEL_USER_PHOTO_STORAGE_PLAN.md` define la estrategia segura previa a conectar fotos: conservar `traveler-adventure-photos` como bucket privado de cuarentena, no abrir lectura publica, guardar rutas en `user_photo_submissions.storage_path` y publicar solo tras revision interna/asset aprobado.

**Contrato colaboraciones con fotos:** `docs/TRAWEL_USER_PHOTO_UPLOAD_CONTRACT.md` define el flujo documental previo a UI/Storage fuerte: maximo 3 fotos por envio, entrada JPG/PNG/WebP, salida WebP estandar, aceptacion de derechos y consentimiento, clasificacion obligatoria por pais/zona/tipo y publicacion solo tras aprobacion de Investighost.

**Estandarizador web de imagenes:** `src/features/travelData/productContent/imageStandardization.service.ts` prepara `standardizeImageFile(file, options)` para navegador: acepta JPG/PNG/WebP, reescala con canvas, convierte a WebP y devuelve blob, nombre sugerido, tamanos y dimensiones. Presets: `heroHeader` 1920/0.82, `adventureCard` 1400/0.80 y `thumbnailFuture` 800/0.78. No sube archivos ni toca Storage.

**Decision subida privada fotos:** `docs/TRAWEL_PRIVATE_PHOTO_UPLOAD_DECISION.md` documenta que no hay policy segura de `INSERT` anon en `traveler-adventure-photos`. El intento anon de upload devuelve `403`, y solo existe lectura publica de Storage para `map-assets`. No conectar subida directa desde frontend; usar Edge Function con service role o signed upload URL corta.

**Opciones publicas pais/zona:** `getPublicCountryOptions()` y `getPublicZoneOptionsByCountrySlug(countrySlug)` viven en `src/features/travelData/productContent/publicLocationOptions.service.ts`. Leen de `countries` y `cities`, filtran `status='active'`, devuelven opciones `label/value/slug/id` para selects controlados y hacen fallback a `[]` si Supabase falla o no esta configurado. Todavia no estan conectadas a UI.

**CountryZonePage data-driven:** `CountryZonePage` consume `getResolvedZoneScreenData(countrySlug, zoneSlug, mode)` como fachada resuelta de zona: parte de `getZoneScreenData(...)` como fallback local, intenta leer datos base seguros desde `cities` legacy mediante `countries.slug + cities.slug`, expone `countrySlug`, `zoneSlug`, nombres, estado, hero/fallback, editorial/copy, CTA y promociones nativas publicadas desde Supabase. Las promociones ya no deben cargarse directamente desde la pagina. Futuros cambios de zona deben pasar por la fachada antes de tocar la pagina.

**Paginas de confianza:** existen paginas minimas en `src/pages/TrustPage/` para `/sobre-trawel`, `/contacto`, `/privacidad`, `/cookies`, `/terminos`, `/creditos-imagenes` y `/compartir`. `TrustPage` intenta leer `static_pages` publicadas desde Supabase con `getPublishedStaticPageBySlug(slug)` y conserva fallback local si no hay contenido o falla la configuracion. `/contacto` ya incluye formulario real contra `submitContactMessage(...)` y `/compartir` envia propuestas mediante `submitCommunitySuggestion(...)`; ambos insertan en `user_messages` como cola privada `pending_review` sin lectura publica. `/compartir` usa selects de pais/zona desde Supabase, tipo de colaboracion controlado y fotos opcionales estandarizadas en navegador; no sube archivos ni debe volver a pais/zona como texto libre. Para `experiencia_aventura`, muestra titulo propio y envia `experience_title` en metadata. Puede preseleccionar foto de encabezado con `tipo=hero_photo` y experiencia/aventura con `tipo=adventure` o `tipo=experience`. El resto son informativas iniciales y no sustituyen textos legales definitivos.

**Header publico:** el header global vive en `src/App.tsx` y muestra enlaces superiores a Inicio, Atlas, Destinos y Contacto. En movil la navegacion se mantiene visible como segunda fila compacta del header para que `/contacto` no dependa solo de enlaces internos o footer.

**Arquitectura de fuentes:**

```
travelData.service.ts  ← API interna estable (usa esto en páginas)
         ↓
   TravelDataSource (interfaz)
         ↓
   ├─ mockTravelData.source.ts    (datos locales)
   └─ supabaseTravelData.source.ts (Supabase real)
```

**Variable de entorno:**
```bash
VITE_TRAVEL_DATA_SOURCE=supabase  # o mock
```

**Regla:** Las páginas no saben de dónde vienen los datos. Usan `travelData.service.ts`.

---

## 4. Estados editoriales públicos

| Entidad | Estado | Visible en Trawel |
|---------|--------|-------------------|
| **cities** | `active` | ✅ Sí |
| | `disabled` | ❌ No (interno) |
| | `comingSoon` | ❌ No (demanda futura) |
| **destinations** | `published` | ✅ Sí |
| | `draft` | ❌ No (interno) |
| | `disabled` | ❌ No |
| | `comingSoon` | ❌ No (placeholder futuro) |

**Filtro aplicado:** SupabaseTravelDataSource filtra automáticamente.

---

## 5. Decisiones importantes

| ID | Decisión | Implicación |
|----|----------|-------------|
| **DA-027** | Mapas internos progresivos | Hoja de ruta futura, no ahora |
| **DA-028** | `comingSoon` = demanda pública | NO es fase editorial; solo registra qué buscan usuarios |
| **—** | Estética premium con v0 | No invertir en diseño final aún |
| **—** | Investighost = proyecto aparte | No mezclar código de investigación en Trawel |
| **—** | Mapa como corazón de Trawel | Flujo principal: mapa → país → zona → aventuras de viajeros |
| **—** | Aventuras de viajeros moderadas | Todo envío entra como `pending`; solo webmaster/backend aprueba |
| **—** | Privacidad obligatoria y marketing separado | Enviar aventura exige privacidad; comunicaciones/promociones son opcionales |
| **—** | Retirada privada antes de revisión | El usuario recibe token; Edge Function solo retira si sigue `pending` |
| **—** | Heroes editoriales por slug | Países usan `src/assets/countries/hero/[countrySlug].webp`; zonas usan `src/assets/zones/hero/[zoneSlug].webp` |

---

## 6. Estado actual de contenido

| Ciudad/Destino | Estado Supabase | Visible en Trawel |
|----------------|-----------------|-------------------|
| Morella | `active` | ✅ Sí |
| Castillo de Morella | `published` | ✅ Sí |
| **Albarracín** | `disabled` | ❌ **No** (interno) |
| Conjunto Histórico Albarracín | `draft` | ❌ **No** (interno) |

**Albarracín:** Insertada en Supabase como contenido de prueba. No publicar hasta cambiar a `active`/`published`.

---

## 7. Reglas para futuros agentes

### Flujo de trabajo
1. **Leer AGENT_BRIEF.md primero** (este doc)
2. Leer docs específicos según la tarea
3. `git status` antes de tocar código
4. Microtareas: un cambio pequeño, una verificación

### Documentación
- **Actualizar BITACORA.md** si cambias algo significativo
- **Actualizar CODEMAP/DECISIONES** solo si aplica
- **NO** documentar cambios triviales

### Límites
- ❌ No tocar Supabase/schema si no se pide explícitamente
- ❌ No modificar mock si la tarea es sobre feature real
- ❌ No cambiar rutas públicas existentes
- ❌ No implementar features grandes mezcladas

### Assets hero editoriales
- Países: `src/assets/countries/hero/[countrySlug].webp`
- Zonas/ciudades: `src/assets/zones/hero/[zoneSlug].webp`
- Recomendado: `2400x900 px`, `.webp`, `250-700 KB`
- El nombre del archivo debe coincidir exactamente con el slug real de URL.
- Si un país no tiene imagen real, `CountryPage` usa fallback premium con bandera, nombre y paleta por `countrySlug`.
- El hero fallback de país debe inspirar primero; la colaboración con fotos va como llamada secundaria.
- El hero fallback de zona debe inspirar primero; la colaboración con fotos va como llamada secundaria.
- Las paletas de fallback país no deben aplicarse a zonas/ciudades ni a mapas.

### ¿Qué leer según la tarea?
| Tarea sobre... | Leer... |
|----------------|---------|
| Datos/Supabase | `DATA_MODEL.md`, `SUPABASE_SETUP.md` |
| Contenido editorial | `EDITORIAL_WORKFLOW.md` |
| Demo/presentación | `DEMO_CHECKLIST.md` |
| Decisiones pasadas | `DECISIONES.md` |
| Arquitectura | `ARCHITECTURE.md`, `CODEMAP.md` |
| **Mapas (UI/UX)** | **`MAP_UI_GUIDELINES.md`** primero, luego `CODEMAP.md` |

---

## 8. Checklist rápida antes de tocar código

- [ ] ¿Qué archivo exacto hay que cambiar?
- [ ] ¿Qué **NO** se debe tocar? (listar explícitamente)
- [ ] ¿Hace falta `npm run build` para verificar?
- [ ] ¿Hace falta documentar el cambio?
- [ ] ¿Puede romper Supabase, mock, o ambos?
- [ ] ¿Está el cambio alineado con DA-027/DA-028?

---

## 9. Referencias rápidas

**Rutas de ejemplo:**
- http://localhost:5173/ → Home
- http://localhost:5173/pais/italia → CountryPage con mapa interno
- http://localhost:5173/pais/italia/zona/lombardia → CountryZonePage placeholder
- http://localhost:5173/pais/espana → CountryPage con mapa local

**Comandos útiles:**
```bash
npm run dev          # Iniciar dev server
npm run build        # Verificar build sin errores
npm run maps:queue:process -- --limit 1  # Worker local/CI: procesa 1 mapa en cola
```

**Automatización de mapas:** GitHub Actions procesa `country_map_assets` cada 30 minutos con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como secrets. El frontend nunca usa service role; solo consulta estado público y solicita cola vía Edge Function.

**Aventuras de viajeros:** la tabla `traveler_adventures` acepta envíos públicos como `pending`, pero el público solo puede leer `approved`. El envío requiere aceptación de privacidad (`privacy_accepted_at`, `privacy_version`) y marketing queda separado/opcional. Fotos en bucket privado; subida/serving seguro queda para Edge Function futura.

**Retirada de aventuras:** al enviar una aventura se genera un token privado en navegador; la DB guarda solo `withdrawal_token_hash`. La ruta `/retirar-aventura` invoca la Edge Function `withdraw-traveler-adventure`, que usa `service_role` solo en backend y marca `status = withdrawn` si la aventura sigue `pending`.

**Monetización controlada:** `MonetizationSlot` muestra promociones propias solo si hay contenido publicado válido. Los slots van entre secciones, nunca encima de hero/mapa/header; si no hay promoción no ocupan espacio. Placements activos: `home-after-featured-destinations`, `country-after-editorial`, `zone-after-intro`. AdSense queda previsto solo como integración manual/controlada futura, no automática.
Ver estrategia completa en `docs/TRAWEL_MONETIZATION_STRATEGY.md`.

**Readiness escaparate:** auditoría corta en `docs/TRAWEL_SHOWCASE_READINESS.md`; la checklist de salida real vive en `docs/TRAWEL_PRODUCTION_READINESS_CHECKLIST.md`.

**Cola mensajes/contactos:** `submitUserMessage`, `submitContactMessage` y `submitCommunitySuggestion` estan preparados en `travelData`; no publican nada y escriben por defecto en `user_messages`, con override opcional via `VITE_TRAWEL_USER_MESSAGES_TABLE`. `/contacto` envia mensajes reales con `sourcePage='contacto'`; `/compartir` envia sugerencias reales con `sourcePage='compartir'`, `countrySlug`, `zoneSlug`, `entityType='zone'`, `entitySlug=zoneSlug` y metadata de clasificacion. El servicio no escribe `status`; Supabase aplica el default seguro `pending_review` para respetar los grants publicos por columna. El contrato minimo de colas vive en `docs/TRAWEL_USER_CONTENT_QUEUE_CONTRACT.md`.

**Cola fotos usuarios:** `submitUserPhotoSubmission` esta preparado en `travelData`; no sube archivos, no publica fotos y solo inserta propuestas en `user_photo_submissions` cuando hay derechos y consentimiento confirmados. El servicio no escribe `status`; Supabase aplica el default seguro `submitted` para respetar los grants publicos por columna. Antes de conectar formulario visual, seguir `docs/TRAWEL_USER_PHOTO_STORAGE_PLAN.md` para Storage privado seguro.

**Contrato subida fotos:** antes de disenar UI de fotos o activar Storage, seguir `docs/TRAWEL_USER_PHOTO_UPLOAD_CONTRACT.md`: pais y zona deben venir de selects controlados, el tipo de colaboracion debe llegar clasificado y nada se publica sin revision de Investighost.

**Imagenes antes de Storage:** para futuras subidas publicas, usar `standardizeImageFile(...)` antes de enviar al bucket privado. La utilidad solo prepara WebP ligero en cliente; la subida, rutas, policies y publicacion siguen pendientes de un bloque Storage explicito.

**Fotos en `/compartir`:** el formulario permite seleccionar hasta 3 JPG/PNG/WebP, genera previews WebP y envia solo metadata (`photo_count`, `photo_standardization`, `photo_upload_pending`) en `user_messages`. No guardar blobs en Supabase ni asumir que Investighost recibe archivos hasta conectar Storage seguro.

**Invitacion a fotos de encabezado:** CountryPage y CountryZonePage muestran una llamada secundaria `Proponer foto` hacia `/compartir?tipo=hero_photo&pais=...` y, en zonas, tambien `zona=...`. `/compartir` preselecciona `foto_encabezado`, pais y zona cuando esos parametros son validos. La invitacion no implica publicacion ni subida real.

**Storage fotos pendiente:** no crear policy publica amplia de `INSERT` en `storage.objects` para `traveler-adventure-photos`. La implementacion recomendada es una Edge Function que valide metadata/fotos, use service role solo en backend, suba al bucket privado e inserte `user_photo_submissions`.

**Selects pais/zona:** para futuros formularios publicos usar `getPublicCountryOptions()` y `getPublicZoneOptionsByCountrySlug(countrySlug)` desde `productContent`; no aceptar pais/zona como texto libre si el flujo necesita `country_slug` y `zone_slug` fiables para Investighost.

**Cola reportes contenido:** `submitContentReport` esta preparado en `travelData`; no lee ni muestra reportes y solo inserta en `content_reports`. `TrustPage` incluye una via discreta "Reportar contenido" apuntando a `static_page` + slug actual. El servicio no escribe `status`; Supabase aplica el default seguro `pending_review` para respetar los grants publicos por columna. Soporta reportes de error, derechos de imagen, retirada, contenido inapropiado, informacion desactualizada y otros, mapeados a los tipos admitidos por la migration local.

**Auditoria colas:** ver `docs/TRAWEL_USER_QUEUE_READINESS.md` antes de conectar cualquier formulario publico de mensajes, fotos o reportes.

---

## 10. Sistema AI-specs

Trawel usa una metodología AI-powered ligera para trabajo con agentes:

| Recurso | Propósito |
|---------|-----------|
| `docs/base-standards.md` | Reglas base: checkpoints, commits, validación |
| `docs/WORKFLOW_AI.md` | Flujo operativo: 8 pasos desde diagnóstico a commit |
| `docs/AGENTS.md` | Perfiles de agentes disponibles |
| `docs/codex.md` | Cómo usar Codex eficazmente |
| `ai-specs/skills/` | Skills específicos por situación |

### Skills disponibles

| Skill | Cuándo usar |
|-------|-------------|
| `checkpoint-before-change.md` | Antes de cambios grandes |
| `small-steps-planning.md` | Dividir en bloques "10 ladrillos" |
| `update-docs.md` | Mantener docs sin sobrecarga |
| `adversarial-review.md` | Revisar antes de "listo" |
| `responsive-audit.md` | Validar móvil/tablet/desktop |
| `map-ui-validation.md` | Cambios en WorldMap/CountryInternalMap |

### Agentes disponibles

| Agente | Especialidad |
|--------|--------------|
| `frontend-map.md` | Mapas, zoom, tooltips, responsive |
| `qa-validator.md` | Revisión de diffs, lint/build |
| `content-editorial.md` | Contenido con fuentes (futuro) |

---

## TL;DR para prompts futuros

> "Trawel es app pública de viajes centrada en mapas. Flujo principal: Home/WorldMap → País → Zona → futuras aventuras de viajeros. CountryPage prioriza mapa interno. Las aventuras de viajeros entran pending, requieren aprobación webmaster y aceptación de privacidad; marketing es separado/opcional. El usuario puede retirar envíos pending con token privado validado por Edge Function. No tocar Supabase/mock/schema sin permiso. Actualizar BITACORA si aplica. Ver docs/base-standards.md y ai-specs/skills/ para metodología."

---

*Agent Brief v1.1 - Trawel*
