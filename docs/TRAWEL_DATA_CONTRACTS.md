# Contratos de datos de Trawel

## 1. Proposito del documento

Este documento define la base estrategica y tecnica para convertir Trawel en una plataforma data-driven preparada para Supabase e Investighost.

Trawel no debe crecer como una web mantenida a mano pais por pais, zona por zona o plan por plan. Debe funcionar como un esqueleto visual y funcional capaz de renderizar automaticamente contenido aprobado desde una fuente de datos.

El objetivo de estos contratos es fijar el lenguaje comun entre:

- Investighost: investiga, genera, revisa y prepara contenido.
- Supabase: almacena entidades, textos, imagenes, estados y senales.
- Trawel: lee datos publicados y los muestra mediante plantillas genericas.

Este documento no implementa tablas, SQL ni migraciones. Define el modelo conceptual previo.

## 2. Principio rector

**Trawel renderiza, Investighost investiga y Supabase almacena.**

Implicaciones:

- Trawel no debe contener contenido editorial masivo dentro de componentes React.
- Trawel no debe requerir cambios de codigo para publicar un nuevo pais, zona, lugar, ruta o plan.
- Investighost debe producir contenido ajustado a contratos estables.
- Supabase debe actuar como fuente de verdad del contenido publicado y revisado.
- Las plantillas de Trawel deben tolerar datos incompletos con fallbacks premium.

## 3. Arquitectura objetivo

```text
Investighost
  -> investiga fuentes
  -> genera contenido estructurado
  -> revisa calidad, permisos y estado editorial
  -> guarda en Supabase

Supabase
  -> almacena entidades, textos, imagenes, senales y paginas
  -> expone solo contenido publico aprobado a Trawel

Trawel
  -> consulta datos publicados
  -> renderiza plantillas genericas
  -> registra demanda publica cuando falte contenido
```

La direccion de dependencias debe ser clara: Trawel consume datos; no decide el contenido editorial de fondo.

## 4. Entidades principales

### Country

**Proposito:** representar un pais navegable y servir como contenedor principal de zonas, lugares, rutas, planes, textos editoriales e imagenes.

**Campos minimos recomendados:**

- `id`
- `slug`
- `name`
- `displayName`
- `isoAlpha2`
- `isoAlpha3`
- `unM49`
- `continent`
- `status`
- `featured`
- `capital`
- `summary`
- `heroImageId`
- `sortOrder`
- `createdAt`
- `updatedAt`

**Relaciones:**

- Tiene muchas `Zone`.
- Tiene muchos `Place`.
- Tiene muchas `Route`.
- Tiene muchos `Plan`.
- Tiene muchos `EditorialContent`.
- Tiene muchos `ImageAsset`.
- Puede recibir `DemandSignal`.

**Que renderiza Trawel:** hero de pais, bandera, nombre, estado publico, intro, contenido editorial por modo, mapa interno, zonas, rutas, planes y CTA secundarios.

**Que rellena Investighost:** resumen, textos editoriales, seleccion destacada, prioridad editorial, fuentes y relacion con imagenes.

**Estado actual aproximado:** parcial y hardcoded en `countries.ts`, `worldCountries.ts`, `countryEditorial.ts` y heroes locales por slug.

**Prioridad:** alta.

### Zone / Region / City

**Proposito:** representar una region, provincia, ciudad o zona explorable dentro de un pais. Debe ser flexible para paises con divisiones distintas.

**Campos minimos recomendados:**

- `id`
- `countryId`
- `parentZoneId`
- `slug`
- `name`
- `type` (`region`, `province`, `city`, `area`, `island`, `custom`)
- `status`
- `mapName`
- `summary`
- `heroImageId`
- `coordinates`
- `sortOrder`
- `createdAt`
- `updatedAt`

**Relaciones:**

- Pertenece a `Country`.
- Puede depender de otra `Zone`.
- Tiene muchos `Place`.
- Tiene muchas `Route`.
- Tiene muchos `Plan`.
- Tiene muchos `Adventure`.
- Tiene muchos `EditorialContent`.
- Tiene muchos `ImageAsset`.

**Que renderiza Trawel:** pagina de zona, hero, intro, lugares imprescindibles, planes, rutas, consejos, aventuras aprobadas y formulario comunitario.

**Que rellena Investighost:** descripcion de zona, que la hace especial, lugares clave, rutas recomendadas, consejos y contexto cultural.

**Estado actual aproximado:** parcial. `CountryZonePage` es generica, pero el contenido de zona es placeholder. `cities.ts` cubre ciudades legacy, no zonas data-driven.

**Prioridad:** alta.

### Place

**Proposito:** representar un lugar concreto visitable: monumento, museo, playa, parque, barrio, mirador, templo, experiencia local o punto de interes.

**Campos minimos recomendados:**

- `id`
- `countryId`
- `zoneId`
- `slug`
- `name`
- `type`
- `status`
- `summary`
- `heroImageId`
- `coordinates`
- `estimatedVisitTime`
- `price`
- `openingHours`
- `officialUrl`
- `tags`
- `createdAt`
- `updatedAt`

**Relaciones:**

- Pertenece a `Country`.
- Pertenece normalmente a una `Zone`.
- Puede aparecer en muchas `Route`.
- Puede aparecer en muchos `Plan`.
- Tiene `EditorialContent`.
- Tiene `ImageAsset`.

**Que renderiza Trawel:** ficha de lugar, informacion practica, contenido por modo, fuentes, ubicacion, imagenes y relacion con rutas/planes.

**Que rellena Investighost:** descripcion, contexto, datos practicos verificables, fuentes, etiquetas, relacion con rutas y planes.

**Estado actual aproximado:** parcial en `destinations.ts` y `AdventurePage`, pero mezclado con el concepto de aventura/destino.

**Prioridad:** alta.

### Route

**Proposito:** representar un itinerario estructurado, no solo una frase de ruta sugerida.

**Campos minimos recomendados:**

- `id`
- `slug`
- `title`
- `countryId`
- `zoneIds`
- `placeIds`
- `durationDays`
- `durationLabel`
- `intensity`
- `travelerType`
- `transportMode`
- `dayByDay`
- `transportTips`
- `variants`
- `bestSeason`
- `status`
- `createdAt`
- `updatedAt`

**Relaciones:**

- Pertenece a uno o varios `Country`.
- Recorre una o varias `Zone`.
- Incluye muchos `Place`.
- Puede estar asociada a muchos `Plan`.
- Tiene `EditorialContent`.
- Tiene `ImageAsset`.

**Que renderiza Trawel:** pagina de ruta, duracion, dia a dia, intensidad, lugares incluidos, transporte, variantes y CTA final.

**Que rellena Investighost:** itinerario, orden recomendado, tiempos, consejos, variantes por perfil y fuentes.

**Estado actual aproximado:** pendiente. Solo hay rutas sugeridas como texto dentro de contenido editorial o cards de Home.

**Prioridad:** alta.

### Plan

**Proposito:** representar una idea de viaje o experiencia empaquetada para inspirar al usuario.

**Campos minimos recomendados:**

- `id`
- `slug`
- `title`
- `type`
- `countryId`
- `zoneId`
- `routeId`
- `relatedPlaceIds`
- `summary`
- `whoFor`
- `bestSeason`
- `durationLabel`
- `suggestedRoute`
- `heroImageId`
- `status`
- `featured`
- `createdAt`
- `updatedAt`

**Relaciones:**

- Pertenece a `Country`.
- Puede pertenecer a `Zone`.
- Puede basarse en una `Route`.
- Puede incluir varios `Place`.
- Tiene `EditorialContent`.
- Tiene `ImageAsset`.

**Que renderiza Trawel:** card de plan, pagina de plan, tipo, para quien es, mejor epoca, ruta sugerida, lugares relacionados y CTA.

**Que rellena Investighost:** enfoque del plan, seleccion de lugares, temporada, perfil de viajero, copy comercial/editorial y fuentes.

**Estado actual aproximado:** hardcoded en `HomePage.tsx` como `featuredAdventures`.

**Prioridad:** alta.

### Adventure

**Proposito:** representar experiencias reales enviadas por viajeros y moderadas antes de publicarse.

**Campos minimos recomendados:**

- `id`
- `countryId`
- `zoneId`
- `placeId`
- `title`
- `story`
- `practicalTips`
- `authorName`
- `authorEmail`
- `status`
- `privacyAcceptedAt`
- `privacyVersion`
- `marketingConsent`
- `withdrawalTokenHash`
- `createdAt`
- `approvedAt`
- `withdrawnAt`

**Relaciones:**

- Pertenece a `Country`.
- Pertenece a `Zone`.
- Puede relacionarse con `Place`.
- Puede tener `CommunityPhoto`.

**Que renderiza Trawel:** aventuras aprobadas, historia, consejos, autor visible, fecha y nota de moderacion/retirada cuando aplique.

**Que rellena Investighost:** no deberia rellenar aventuras personales; puede revisar, moderar o enriquecer metadatos si el flujo editorial lo permite.

**Estado actual aproximado:** parcial real con `traveler_adventures`, formulario en `CountryZonePage` y retirada en `/retirar-aventura`.

**Prioridad:** media.

### EditorialContent

**Proposito:** almacenar contenido editorial reutilizable por modo y por entidad, separando texto de presentacion visual.

**Campos minimos recomendados:**

- `id`
- `entityType`
- `entityId`
- `mode`
- `headline`
- `intro`
- `whatMakesSpecial`
- `highlights`
- `suggestedRoute`
- `practicalTips`
- `sections`
- `sources`
- `status`
- `reviewState`
- `createdAt`
- `updatedAt`

**Relaciones:**

- Se asocia a `Country`, `Zone`, `Place`, `Route` o `Plan`.
- Puede referenciar `ImageAsset`.
- Puede contener fuentes verificadas.

**Que renderiza Trawel:** bloques editoriales por modo Aventura/Estudiante, secciones, listas, tips, rutas sugeridas y fuentes.

**Que rellena Investighost:** todo el contenido textual estructurado, las fuentes y el estado de revision.

**Estado actual aproximado:** parcial y hardcoded en `countryEditorial.ts`, `cities.ts` y `destinations.ts`.

**Prioridad:** alta.

### ImageAsset

**Proposito:** almacenar imagenes curadas o generadas con informacion de uso, permisos, creditos y relacion con entidades.

**Campos minimos recomendados:**

- `id`
- `entityType`
- `entityId`
- `storagePath`
- `publicUrl`
- `alt`
- `caption`
- `credit`
- `license`
- `source`
- `usageType` (`hero`, `card`, `gallery`, `inline`)
- `status`
- `focalPoint`
- `width`
- `height`
- `createdAt`
- `updatedAt`

**Relaciones:**

- Puede pertenecer a cualquier entidad editorial.
- Puede sustituir o complementar `CommunityPhoto`.

**Que renderiza Trawel:** heroes, cards, galerias, creditos, alt text y fallback si falta imagen aprobada.

**Que rellena Investighost:** seleccion, alt, caption, creditos, licencia, relacion con entidad y revision de uso.

**Estado actual aproximado:** parcial con assets locales por slug en `src/assets`.

**Prioridad:** alta.

### CommunityPhoto

**Proposito:** almacenar fotos aportadas por la comunidad, con permisos, moderacion y credito.

**Campos minimos recomendados:**

- `id`
- `adventureId`
- `entityType`
- `entityId`
- `storagePath`
- `authorName`
- `creditName`
- `permissionStatus`
- `moderationStatus`
- `licenseAcceptedAt`
- `takedownTokenHash`
- `createdAt`
- `approvedAt`
- `removedAt`

**Relaciones:**

- Puede pertenecer a `Adventure`.
- Puede asociarse a `Country`, `Zone`, `Place`, `Route` o `Plan`.

**Que renderiza Trawel:** fotos aprobadas, creditos, aviso de autoria y mecanismos de retirada cuando aplique.

**Que rellena Investighost:** no rellena la foto original; puede moderar, clasificar, asociar y aprobar.

**Estado actual aproximado:** pendiente. Hay menciones a fotos futuras y bucket privado, pero no render publico de fotos comunitarias.

**Prioridad:** media.

### DemandSignal

**Proposito:** registrar interes real de usuarios para priorizar contenido y alimentar decisiones de Investighost.

**Campos minimos recomendados:**

- `id`
- `signalType`
- `query`
- `normalizedQuery`
- `countrySlug`
- `zoneSlug`
- `entityType`
- `entitySlug`
- `sourcePage`
- `action`
- `count`
- `lastSeenAt`
- `createdAt`

**Relaciones:**

- Puede relacionarse con cualquier entidad existente o inexistente.
- Puede alimentar cola editorial de Investighost.

**Que renderiza Trawel:** normalmente no renderiza el detalle; puede mostrar estados como "destino en preparacion" o "registraremos tu interes".

**Que rellena Investighost:** consume estas senales para priorizar investigacion y creacion de contenido.

**Estado actual aproximado:** muy parcial. Existe `requested_count` en assets de mapas, pero no hay buscador ni demanda editorial general.

**Prioridad:** alta.

### StaticPage / LegalPage

**Proposito:** publicar paginas estaticas de confianza, legales, contacto, creditos y politica editorial.

**Campos minimos recomendados:**

- `id`
- `slug`
- `type`
- `title`
- `summary`
- `body`
- `status`
- `version`
- `publishedAt`
- `updatedAt`

**Relaciones:**

- Puede referenciar `ImageAsset` o versiones legales.
- Puede enlazarse desde formularios, footer y pages de confianza.

**Que renderiza Trawel:** paginas de sobre Trawel, contacto, privacidad, cookies, terminos, creditos de imagenes y aviso de informacion turistica cambiante.

**Que rellena Investighost:** puede preparar borradores informativos, pero textos legales deben revisarse con criterio legal/humano.

**Estado actual aproximado:** pendiente. Hay enlaces en Home y privacidad inline en formulario, pero no rutas/paginas completas.

**Prioridad:** alta.

## 5. Contrato editorial comun

El contenido editorial debe guardarse separado de la entidad base. Una misma entidad puede tener contenido distinto para modo Aventura y modo Estudiante.

Campos recomendados:

- `entityType`: `country`, `zone`, `place`, `route`, `plan`.
- `entityId`: id estable de la entidad.
- `mode`: `adventure` o `student`.
- `headline`: frase principal del bloque.
- `intro`: introduccion editorial.
- `whatMakesSpecial`: explicacion de valor diferencial.
- `highlights`: lista estructurada de puntos destacados.
- `suggestedRoute`: ruta sugerida breve o referencia a `Route`.
- `practicalTips`: consejos practicos.
- `sections`: array de secciones con titulo, cuerpo, orden y tipo.
- `sources`: fuentes, enlaces, autores, fecha y notas de verificacion.
- `status`: estado publico/editorial del contenido.
- `reviewState`: estado de revision interna.
- `updatedAt`: fecha de ultima actualizacion.

### Modo Aventura

Debe priorizar tono viajero, emocional, sensorial y util para decidir o imaginar el viaje.

Ejemplos de foco:

- que se vive alli
- que sensaciones transmite
- que ruta inspira
- que conviene saber antes de ir
- que experiencias merecen prioridad

### Modo Estudiante

Debe priorizar contexto cultural, historico, geografico y educativo sin perder claridad.

Ejemplos de foco:

- que procesos historicos explica
- que observar para entender el lugar
- que patrimonio o geografia lo define
- que conceptos culturales aparecen
- que fuentes o referencias sostienen el contenido

## 6. Estados editoriales recomendados

- `draft`: contenido creado pero no listo para revision publica.
- `review`: contenido pendiente de revision editorial, factual, legal o de permisos.
- `published`: contenido aprobado y visible en Trawel.
- `archived`: contenido retirado de la vista publica pero conservado por trazabilidad.

Regla recomendada: Trawel solo debe renderizar como contenido principal lo que este en `published`. Puede mostrar estados publicos amables cuando una entidad exista pero no tenga contenido publicado.

## 7. Principios para no romper la escalabilidad

- No anadir paises a mano en componentes.
- No crear arrays locales por seccion si el contenido debe escalar.
- No duplicar estructuras por pais.
- No mezclar contenido editorial con presentacion visual.
- No depender de imagenes locales como solucion final.
- No convertir cada destino nuevo en una excepcion de UI.
- Usar fallback premium cuando falten datos.
- Mantener plantillas genericas por entidad.
- Separar estado editorial interno de visibilidad publica.
- Registrar demanda cuando el usuario busque o pulse algo que aun no esta preparado.

## 8. Fases de transicion

### Fase estatica temporal

Mantener el contenido actual como demo y referencia visual. Evitar ampliar masivamente datos hardcoded.

Objetivo: no romper lo que ya funciona.

### Contratos de datos

Definir entidades, campos minimos, estados y relaciones antes de escribir SQL o migrar datos.

Objetivo: que Investighost sepa que formato debe producir.

### Modelo Supabase

Traducir contratos a tablas, indices, constraints, RLS y storage.

Objetivo: que Supabase sea la fuente de verdad publica y editorial.

### Repositorios de lectura

Crear servicios de lectura estables para Trawel, idealmente independientes de la fuente exacta.

Objetivo: que las paginas consuman datos publicados sin conocer detalles de almacenamiento.

### Plantillas data-driven

Adaptar Home, CountryPage, CountryZonePage, PlacePage, RoutePage y PlanPage para renderizar entidades desde datos.

Objetivo: publicar contenido nuevo sin tocar componentes.

### Panel Investighost

Permitir que Investighost cree, revise, relacione y publique entidades siguiendo estos contratos.

Objetivo: escalar contenido con control editorial y trazabilidad.

## 9. Primeras piezas candidatas a migrar

1. `Country`: base de navegacion y SEO.
2. `Zone`: clave para el flujo mapa -> pais -> zona.
3. `EditorialContent`: evita seguir creciendo en archivos como `countryEditorial.ts`.
4. `ImageAsset`: separa imagenes, creditos y permisos del codigo.
5. `StaticPage`: cierra confianza, legal y enlaces de footer.
6. `DemandSignal`: permite priorizar trabajo real de Investighost.

## 10. Checklist final antes de carga masiva con Investighost

- [ ] Entidades principales definidas con campos minimos.
- [ ] Estados editoriales comunes acordados.
- [ ] Contrato Aventura/Estudiante cerrado.
- [ ] Relacion Country -> Zone -> Place -> Route -> Plan definida.
- [ ] Politica de imagenes, creditos y permisos documentada.
- [ ] Fallbacks publicos definidos para datos incompletos.
- [ ] Separacion entre contenido editorial y presentacion visual aceptada.
- [ ] Estrategia de demanda definida para busquedas/clicks sin contenido.
- [ ] Paginas legales y de confianza contempladas.
- [ ] Supabase preparado como fuente de verdad antes de producir contenido masivo.

---

*Documento base v1.0 - Contratos data-driven de Trawel*
