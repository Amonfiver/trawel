# Registro de Decisiones - Trawel

## Cómo usar este documento

Este archivo registra decisiones técnicas y de diseño importantes del proyecto. Cada decisión incluye:
- Contexto: ¿Qué problema estábamos resolviendo?
- Decisión: ¿Qué elegimos?
- Consecuencias: ¿Qué implica esta elección?

---

## Decisiones arquitectónicas

### DA-001: Vite + React en lugar de Next.js

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitábamos elegir el framework base para el MVP. Next.js es popular pero añade complejidad.

**Decisión:** Usar Vite + React para el MVP. No usar Next.js en esta fase.

**Razones:**
- SSR no es necesario inicialmente (no hay SEO crítico todavía)
- API Routes no se usan (datos estáticos)
- Vite es más ligero y rápido para desarrollo
- Menos magia, más control explícito
- React Router da suficiente flexibilidad de routing

**Consecuencias:**
- Migración futura a Next.js será más trabajo si la necesitamos
- No tenemos Image optimization automático
- No tenemos font optimization automático
- Mayor libertad en estructura de carpetas

**Reversibilidad:** Media. Una app Vite React puede migrarse a Next.js, requiere reestructurar rutas y configuración.

---

## DA-026: Mock como fuente de datos por defecto hasta conectar Supabase

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Hemos preparado el schema SQL para Supabase y la guía de configuración, pero no queremos romper la app actual ni cambiar el comportamiento visible hasta tener todo listo para la conexión.

**Decisión:** Mantener `mock` como fuente de datos por defecto mediante variable de entorno `VITE_TRAVEL_DATA_SOURCE=mock`. No instalar `@supabase/supabase-js` todavía ni crear `SupabaseTravelDataSource` hasta que se complete el setup de Supabase.

**Implementación:**
- Creado `.env.example` con `VITE_TRAVEL_DATA_SOURCE=mock`
- Documentado en `docs/SUPABASE_SETUP.md` el flujo completo
- Seed.sql generado compatible con RLS (todos los destinos en estado `published`)
- Sin modificar `travelData.service.ts` ni páginas

**Razones:**
- La app sigue funcionando 100% con datos locales mientras se prepara Supabase
- No hay dependencias nuevas hasta que sea necesario
- Permite probar el setup de Supabase de forma independiente
- Migración gradual: preparar → configurar → conectar → activar

**Flujo previsto:**
1. **Actual (Fase 1):** Mock activo, documentación lista, schema creado
2. **Fase 2:** Crear proyecto Supabase, ejecutar schema, cargar seed
3. **Fase 3:** Instalar `@supabase/supabase-js`, crear `SupabaseTravelDataSource`
4. **Fase 4:** Cambiar `VITE_TRAVEL_DATA_SOURCE=supabase`, probar conexión

**Consecuencias:**
- Desarrollo paralelo: frontend estable mientras se configura backend
- Sin riesgo de romper la app actual
- Setup de Supabase puede hacerse en cualquier momento siguiendo la guía
- Cambio de fuente es solo cambiar una variable de entorno

**Reversibilidad:** Alta. Volver a mock es cambiar la variable de entorno.

---

## DA-025: Modelo de base de datos real para Trawel con campos específicos por idioma

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Trawel necesita evolucionar desde datos mock estáticos hacia una arquitectura que permita leer contenido real desde Supabase. Investighost será la herramienta que alimente los datos, Trawel solo los lee.

**Decisión:** Definir modelo de base de datos con tablas específicas y campos `_es` para contenido en español (extensible a otros idiomas):

**Tablas definidas:**

1. **countries**: `id`, `slug`, `name_es`, `emoji`, `capital_es`, `continent_es`, `description_es`, `status`, `featured`, timestamps

2. **cities**: `id`, `country_id`, `slug`, `name_es`, `short_description_es`, `adventure_content_es`, `student_content_es`, `lat`, `lng`, `status`, `featured`, `recommended_duration`, `best_season_es`, `sleeping_advice_es`, `food_advice_es`, `pending_verification`, timestamps

3. **destinations**: `id`, `country_id`, `city_id`, `slug`, `title_es`, `summary_es`, `adventure_content_es`, `student_content_es`, `type`, `tags`, `estimated_visit_time`, `price`, `opening_hours`, `practical_tip_es`, `verification_status`, `status`, `featured`, `pending_verification`, timestamps

4. **destination_sources**: `id`, `destination_id`, `title`, `url`, `type`, `supports`, timestamps

**Estados editoriales:**
- Country/City: `active`, `comingSoon`, `disabled`
- Destination: `draft`, `published`, `comingSoon`, `disabled`
- Verification: `pending`, `verified`, `disputed`

**Principios:**
- Trawel lee datos publicados (`status = 'published'`)
- Investighost investiga, valida y guarda contenido
- Campos `_es` permiten extensión a `_en`, `_fr`, etc.
- `pending_verification` como JSONB para marcar datos pendientes

**Cambios realizados:**
- Actualizado `docs/DATA_MODEL.md` con schema SQL completo
- Documentados índices y constraints
- Definidos estados editoriales y workflow

**Razones:**
- Separación clara: Investighost escribe, Trawel lee
- Modelo preparado para Supabase sin reescribir páginas
- Campos específicos por idioma facilitan queries
- Estados editoriales controlan visibilidad

**Consecuencias:**
- Migración futura requiere script de datos mock → SQL
- `travelData.service` evolucionará de sync a async
- Las páginas no cambian, solo la fuente de datos

**Reversibilidad:** Media. Cambiar el modelo de base de datos requeriría migración de datos, pero el contrato de `travelData.service` permanece estable.

---

## DA-028: comingSoon como demanda pública, no como fase editorial

**Fecha:** 2026-04-30  
**Estado:** Aprobada  
**Contexto:** Estábamos usando `comingSoon` como estado intermedio para contenido editorial en desarrollo (ej: Albarracín insertada en Supabase pero no publicada). Esto generaba confusión sobre el propósito real del estado.

**Decisión:** Redefinir `comingSoon` como indicador de **demanda pública**, no como fase editorial interna:

| Aspecto | Definición |
|---------|------------|
| **comingSoon origen** | Búsquedas, solicitudes y demanda real de usuarios por lugares que Trawel no tiene |
| **Función** | Lista de pedidos editoriales para priorizar qué investigar y publicar |
| **Investighost** | NO inserta contenido como `comingSoon`. Produce contenido revisado que pasa directamente a `active`/`published` |
| **Contenido interno** | Editorial no publicado permanece oculto: `city.status = 'disabled'`, `destination.status = 'draft'` |

**Principios:**
- `comingSoon` = "Los usuarios quieren este lugar, lo investigaremos pronto"
- `disabled` + `draft` = "Estamos trabajando en ello, aún no visible"
- Investighost solo publica contenido completo y revisado
- No hay fases públicas de "construcción" del contenido

**Correcciones aplicadas:**
- Albarracín: `city.status` cambiado de `'comingSoon'` a `'disabled'` (contenido interno no publicado)
- Destinos: mantener `'draft'` hasta publicación

**Consecuencias:**
- Estados editoriales más claros y separados de la demanda
- Investighost tiene cola de prioridades basada en usuarios reales
- Contenido en desarrollo no aparece públicamente

**Reversibilidad:** Alta. Cambio conceptual con ajustes menores de status.

---

## DA-027: Estrategia progresiva para assets cartográficos internos

**Fecha:** 2026-04-29  
**Estado:** Aprobada (Hoja de ruta futura - no implementar ahora)  
**Contexto:** Trawel tiene mapa mundial base funcional y navegación editorial Mundo → País → Ciudad → Destino. Los mapas deben ser apoyo visual, no fuente de verdad editorial. No queremos guardar desde el inicio todos los mapas internos del mundo.

**Decisión:** Trawel usará una estrategia progresiva para assets cartográficos internos:

| Aspecto | Estrategia |
|---------|------------|
| Mapa mundial base | Copia propia optimizada como asset estático (procesado desde world-atlas/Natural Earth) |
| Mapas internos de países | NO se incluirán todos desde el inicio |
| Incorporación | Bajo demanda editorial o cuando un país tenga contenido/tráfico suficiente |
| Almacenamiento | Una vez incorporado, Trawel guardará copia propia optimizada |
| Dependencia externa | NO se dependerá de consultas en tiempo real para pintar mapas |
| Fuentes futuras | Natural Earth Admin 1, geoBoundaries, OSM Boundaries |
| Prioridad actual | Reforzar flujo editorial Mundo → País → Ciudad → Destino |

**Principios:**
- Supabase sigue siendo la fuente editorial principal (countries → cities → destinations)
- Los mapas son apoyo visual, no fuente de verdad
- Sin dependencias de terceros en tiempo real para usuarios finales
- Escalabilidad: cargar solo lo necesario, cuando sea necesario

**Nota sobre v0 y diseño visual:**
> v0 puede mejorar la presentación visual del mapa, pero no sustituye el asset cartográfico local. La cartografía definitiva proviene de fuentes geoespaciales (Natural Earth, geoBoundaries), no de herramientas de diseño.

**Implementación:** Futura. No se desarrolla en este ciclo.

**Reversibilidad:** Alta. Estrategia documental sin código implementado.

---

## DA-029: Mapas exploratorios con bandera y captura de demanda pública

**Fecha:** 2026-05-01  
**Estado:** Aprobada por Vasyl  
**Contexto:** Trawel necesita una experiencia de mapa más exploratoria y homogénea. El objetivo es que los usuarios descubran destinos navegando, sin que el mapa revele anticipadamente qué lugares tienen contenido disponible. Además, se quiere capturar la demanda pública para priorizar el trabajo editorial.

**Decisión:** Implementar mapas exploratorios homogéneos con banderas, tooltips y captura de demanda pública:

### 1. Comportamiento de mapas (WorldMap y mapas internos)

| Aspecto | Regla |
|---------|-------|
| **Marcadores de zona** | ❌ NO habrá puntos/marcadores de zona en ningún mapa |
| **Labels fijos** | ❌ NO habrá títulos/nombres siempre visibles sobre los mapas |
| **Información** | ✅ Los nombres solo aparecen al pasar el ratón mediante tooltip |
| **Estilo base** | Todos los territorios se ven en estilo neutro |
| **Hover** | Cambia color (idealmente amarillo como WorldMap) |
| **Disponibilidad** | El mapa NO revela visualmente qué países/ciudades tienen contenido |

### 2. Tooltips con bandera

**Tooltip del mapa mundial (hover sobre país):**
- Muestra: nombre del país + bandera (emoji)
- Enfoque: "viajar y aprender" (descubrimiento)

**Tooltip de mapas internos (hover sobre provincia/región):**
- Muestra: nombre de la provincia/región
- (Sin bandera, ya que es subdivisión interna)

### 3. Página de país (CountryPage)

| Antes | Después |
|-------|---------|
| Abreviaturas tipo "ES", "es", "España" | Solo nombre limpio + bandera |
| Ejemplo: "ES España" | Ejemplo: "🇪🇸 España" |

### 4. Clicks en países y captura de demanda

**Flujo de click en país:**
1. Usuario hace click en un país en el mapa
2. Trawel intenta abrir la página del país
3. **Si el país tiene contenido publicado:** muestra contenido normalmente
4. **Si el país NO tiene contenido:** muestra página "Próximamente" atractiva
5. **El click se registra como señal de demanda pública**

**Uso de la demanda:**
- Los clicks en países sin contenido alimentan métricas de demanda
- Investighost usa estas métricas para priorizar qué países/ciudades investigar
- comingSoon representa **demanda pública detectada**, no fase editorial interna

### 5. Distinción crítica: comingSoon vs draft/disabled

| Estado | Significado | Ejemplo |
|--------|-------------|---------|
| **comingSoon** | Demanda pública: usuarios han clickeado, queremos este lugar | "Francia está en comingSoon porque 50 usuarios han clickeado" |
| **draft/disabled** | Editorial interno: estamos trabajando en ello, no es público | "Albarracín está en disabled mientras Investighost termina la investigación" |

**Regla:** El contenido editorial en desarrollo nunca se muestra como comingSoon. Permanece oculto (draft/disabled) hasta su publicación.

### 6. Homogeneidad visual

| Mapa | Estilo |
|------|--------|
| **WorldMap** | Exploratorio: sin puntos de ciudades, tooltips con nombre+bandera |
| **SpainMap** | Exploratorio: sin marcadores de ciudades sobre el mapa, solo hover/nombre |
| **Futuros mapas** | Mismo patrón: exploratorio, neutro, sin revelar disponibilidad |

### 7. Referencias visuales

- Tooltip estilo oscuro (fondo `rgba(15, 23, 42, 0.95)`) alineado con WorldMap
- Transiciones `cubic-bezier(0.4, 0, 0.2, 1)` consistentes
- Hover amarillo/dorado como en WorldMap actual

**Razones:**
- Experiencia de descubrimiento más orgánica y exploratoria
- No penaliza visualmente países sin contenido (todos son igual de invitativos)
- Captura datos reales de interés para priorizar inversión editorial
- comingSoon como métrica de negocio, no como estado técnico
- Consistencia visual entre todos los mapas de la aplicación

**Consecuencias:**
- Los mapas actuales (WorldMap, SpainMap) necesitarán ajustes para eliminar puntos/marcadores
- Se necesitará sistema de tracking de clicks para demanda pública (futuro)
- Las páginas "Próximamente" deben ser atractivas, no errores
- Investighost recibirá reportes de demanda para planificar investigaciones

**Reversibilidad:** Media. Cambio de comportamiento de UI que afecta la experiencia, pero no la arquitectura de datos.

---

## DA-030: Generación automática y persistente de mapas internos por país

**Fecha:** 2026-05-01  
**Estado:** Aprobada  
**Contexto:** Trawel necesita un sistema escalable para proporcionar mapas internos de países bajo demanda, sin requerir preparación manual previa ni depender de que Investighost genere assets cartográficos.

**Decisión:** Implementar generación automática y persistente de mapas internos mediante arquitectura de worker + Supabase Storage:

### Arquitectura definitiva

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Supabase  │◀────│  Worker/Backend │
│  (CountryMap)│    │   (Estado)  │     │  (Generación)   │
└──────┬──────┘     └──────┬──────┘     └─────────────────┘
       │                   │
       │            ┌──────┴──────┐
       │            │   Storage   │
       └───────────▶│ map-assets  │
                    │  (TopoJSON) │
                    └─────────────┘
```

### Flujo de generación

| Paso | Frontend | Supabase | Worker |
|------|----------|----------|--------|
| 1 | Usuario hace click en país | | |
| 2 | Consulta estado del mapa | `country_map_assets.status` | |
| 3 | **Si `ready`** | Devuelve URL del asset | |
| 4 | Frontend carga TopoJSON desde Storage | | |
| 5 | **Si `missing`** | | |
| 6 | Frontend solicita generación | Inserta registro `queued` | |
| 7 | | Worker detecta nuevo registro | Inicia procesamiento |
| 8 | | Actualiza a `generating` | Descarga geoBoundaries |
| 9 | | | Normaliza, simplifica, convierte |
| 10 | | Actualiza a `ready` | Sube a Storage |
| 11 | Frontend hace polling/refresh | Devuelve `ready` | |

### Estados del mapa

| Estado | Significado | UI |
|--------|-------------|-----|
| `missing` | No existe asset para este país | Botón "Explorar" → inicia generación |
| `queued` | Solicitado, esperando worker | Pantalla de preparación |
| `generating` | Procesando (descarga, conversión) | Animación de progreso |
| `ready` | Asset disponible en Storage | Mapa interactivo |
| `failed` | Error en generación | Mensaje + reintentar |

### Persistencia

**Tabla `country_map_assets`:**
```sql
- country_slug (PK)
- status (missing/queued/generating/ready/failed)
- storage_path
- admin_level (ADM1/ADM2)
- source_url (geoBoundaries)
- created_at, updated_at
- error_message (para failed)
```

**Storage bucket `map-assets`:**
```
countries/
  {countrySlug}/
    {countrySlug}-adm2.topojson
    metadata.json
```

### Distinción crítica: Investighost vs Trawel

| Aspecto | Investighost | Trawel (sistema técnico) |
|---------|--------------|--------------------------|
| **Genera** | Contenido editorial (sitios, rutas, textos) | Mapas cartográficos (assets TopoJSON) |
| **Input** | Investigación humana/IA | geoBoundaries API |
| **Output** | Drafts en Supabase | Assets en Storage |
| **Rol** | Redactor/Investigador | Sistema de generación técnica |

> **Regla:** Investighost NO genera mapas. Los mapas son responsabilidad técnica de Trawel.

### Componentes del sistema

| Componente | Tecnología | Responsabilidad |
|------------|------------|-----------------|
| Frontend | React + D3 | Consultar estado, mostrar UI, renderizar mapa |
| API/DB | Supabase | Tabla de estado, Storage, RLS |
| Worker | Edge Function / Serverless | Procesar GeoJSON, generar TopoJSON |
| Fuente | geoBoundaries | Datos cartográficos oficiales |

### Primera carga vs posteriores

| Escenario | Experiencia |
|-----------|-------------|
| **Primera vez** | 10-30s de espera (descarga + procesamiento) |
| **Siguientes visitas** | <1s (asset cacheado en Storage) |
| **Días después** | Inmediato (persistente en Supabase) |

### Razones

- Escalabilidad: cualquier país del mundo bajo demanda
- Sin preparación manual: no requiere descargar procesar países por adelantado
- Separación de responsabilidades: Investighost se enfoca en contenido editorial
- Persistencia: el trabajo de generación se hace una vez
- Fallback controlado: estados claros para errores y reintentos

### Consecuencias

- Requiere configurar Supabase Storage bucket `map-assets`
- Necesita Edge Function o worker para procesamiento
- Frontend debe manejar estados asíncronos (polling/refresh)
- Costo de almacenamiento en Supabase (mínimo: ~50KB por país)

### Reversibilidad: Media

- Cambiar de estrategia requiere migrar assets existentes
- Pero el contrato del frontend (status + URL) permanece estable

---

## DA-031: Nivel cartográfico interno configurable por país

**Fecha:** 2026-05-02  
**Estado:** Aceptada  
**Contexto:** España funciona bien en ADM2 porque las provincias son reconocibles y útiles para exploración. México en ADM2 resulta demasiado granular para Trawel: el mapa queda dividido en demasiadas áreas y pierde valor comercial/UX.

**Decisión:** El `admin_level` de mapas internos se decide por país, no como regla global. Cada país usará el nivel cartográfico más útil para la experiencia editorial y comercial.

**Configuración inicial:**

| País | Nivel | Criterio |
|------|-------|----------|
| España | ADM2 | Provincias |
| México | ADM1 | Estados |

**Implementación:**
- Configuración central en `src/features/map/config/countryMapProfiles.ts`.
- `CountryPage` usa el perfil para consultar el asset esperado y para solicitar generación.
- El worker usa el perfil para descargar geoBoundaries, nombrar el TopoJSON y actualizar `country_map_assets.admin_level`.

**Consecuencias:**
- No todos los países tendrán el mismo nivel administrativo.
- `country_map_assets` sigue teniendo un registro único por `country_slug`; al cambiar el nivel de un país se reprocesa el registro existente.
- Los paths en Storage reflejan el nivel efectivo, por ejemplo `mexico-adm1.topojson`.

**Reversibilidad:** Alta. Cambiar el nivel recomendado de un país es editar el perfil y reprocesar el asset.

---

## Índice de Decisiones

| ID | Fecha | Título | Estado |
|----|-------|--------|--------|
| DA-031 | 2026-05-02 | Nivel cartográfico interno configurable por país | ✅ Aprobada |
| DA-030 | 2026-05-01 | Generación automática y persistente de mapas internos | ✅ Aprobada |
| DA-029 | 2026-05-01 | Mapas exploratorios con bandera y demanda pública | ✅ Aprobada |
| DA-028 | 2026-04-30 | comingSoon como demanda pública | ✅ Aprobada |
| DA-027 | 2026-04-29 | Estrategia progresiva para mapas internos | ✅ Hoja de ruta (reemplazada por DA-030) |
| DA-026 | 2026-04-28 | Mock como fuente por defecto hasta conectar Supabase | ✅ Aprobada |
| DA-025 | 2026-04-28 | Modelo de base de datos real para Trawel | ✅ Aprobada |
| DA-024 | 2026-04-28 | Trawel como plataforma pública de lectura | ✅ Aprobada |
| DA-023 | 2026-04-28 | Contrato editorial con Investighost-GPT | ✅ Aprobada |
| DA-022 | 2026-04-28 | Rotación de bitácora en archivos históricos | ✅ Aprobada |
| DA-021 | 2026-04-28 | Modelo persistente separa entidades y traducciones | ✅ Aprobada |
| DA-020 | 2026-04-28 | Capa de acceso a datos local antes de persistencia externa | ✅ Aprobada |
| DA-019 | 2026-04-28 | Modelo jerárquico País → Ciudad → Destino | ✅ Aprobada |
| DA-018 | 2026-04-28 | Sistema i18n propio sin librería externa | ✅ Aprobada |
| DA-017 | 2026-04-28 | Modos de experiencia dual (Aventura/Estudiante) | ✅ Aprobada |
| DA-013 | 2026-04-27 | Proyección cartográfica Mercator | ✅ Aprobada |
| DA-012 | 2026-04-27 | Dataset world-atlas desde CDN | ✅ Aprobada |
| DA-011 | 2026-04-27 | Tema de mapa centralizado en objeto configurable | ✅ Aprobada |
| DA-010 | 2026-04-27 | Separación name/displayName en tipos de país | ✅ Aprobada |
| DA-009 | 2026-04-27 | Campos ISO estandarizados en tipos de país | ✅ Aprobada |
| DA-008 | 2026-04-27 | Feature-based folder structure | ✅ Aprobada |
| DA-007 | 2026-04-27 | Sistema de tema configurable para mapas | ✅ Aprobada |
| DA-006 | 2026-04-27 | Diccionario propio de países | ✅ Aprobada |
| DA-005 | 2026-04-27 | Activar solo países con contenido | ✅ Aprobada |
| DA-004 | 2026-04-27 | Datos estáticos JSON/TS sin base de datos | ✅ Aprobada |
| DA-003 | 2026-04-27 | No copiar código de la versión Websim | ✅ Aprobada |
| DA-002 | 2026-04-27 | D3 + TopoJSON + SVG para mapas | ✅ Aprobada |
| DA-001 | 2026-04-27 | Vite + React en lugar de Next.js | ✅ Aprobada |

---

*Registro de decisiones v1.9 - Trawel*
*Última actualización: 2026-04-29*
