# BITACORA_002.md — Histórico de cambios (2026-04-27 a 2026-05-01)

> **Período:** Inicio del proyecto Trawel hasta integración DA-030 (antes de WorldMap exploratorio)
> 
> **Archivo anterior:** `docs/BITACORA_001.md` (período inicial)
> **Archivo siguiente:** `docs/BITACORA.md` (cambios recientes)

---

## Estado del proyecto al final de este período (Resumen ejecutivo)

**Trawel v2.9** — Sistema de exploración de destinos de viaje funcional

### Componentes principales implementados

| Componente | Estado | Descripción |
|------------|--------|-------------|
| WorldMap v1 | ✅ | Mapa mundial interactivo con D3 + TopoJSON |
| ExperienceMode | ✅ | Selector Aventura/Estudiante funcional |
| i18n Base | ✅ | Sistema multidioma preparado (es, en, fr, it, uk) |
| Países | ✅ | 3 activos (ES, JP, PE), 2 próximamente (FR, IT) |
| Ciudades | ✅ | 8 ciudades con datos |
| Destinos | ✅ | 6 destinos con contenido dual |
| Páginas | ✅ | HomePage, CountryPage, CityPage, AdventurePage como fichas editoriales |
| travelData | ✅ | Capa de acceso a datos preparada para persistencia futura |
| **Edge Function request-country-map** | ✅ | Endpoint seguro para solicitar generación de mapas (DA-030) |

### Arquitectura de datos

```
País → Ciudad → Destino → ContentByMode (adventure/student)
```

### Stack tecnológico

- Vite + React + TypeScript
- D3.js + TopoJSON para mapas
- CSS Modules + Variables CSS
- React Router para navegación
- Datos estáticos TypeScript (futuro: Supabase)
- Supabase Edge Functions (Deno)

---

## Historial completo del período

### 2026-05-01 - Edge Function: request-country-map para generación segura de mapas 🗺️⚡

Creada Edge Function `request-country-map` como endpoint seguro para solicitar generación de mapas internos de países (DA-030).

**Archivo creado:** `supabase/functions/request-country-map/index.ts`

**Propósito:** Actuar como puerta de entrada controlada para el sistema de generación automática, usando `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor.

**Variables de entorno requeridas:**
| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (bypass RLS, nunca en frontend) |

**Contrato de entrada:**
```typescript
{
  countrySlug: string;      // Obligatorio - ej: 'mexico'
  countryName?: string;     // Opcional - ej: 'México'
  isoAlpha2?: string;       // Opcional - ej: 'MX'
  isoAlpha3?: string;       // Recomendable - ej: 'MEX'
  adminLevel?: string;      // Default: 'ADM2'
  source?: string;          // Default: 'unknown'
}
```

**Comportamiento por estado:**

| Estado actual | Acción | Respuesta |
|---------------|--------|-----------|
| **No existe** | Insertar registro con `status='queued'`, `requested_count=1` | `queued` |
| **ready** | NO regenerar, solo incrementar `requested_count` | `ready` |
| **queued** | Incrementar contador, actualizar timestamp | `queued` |
| **generating** | Incrementar contador, actualizar timestamp | `generating` |
| **failed/missing** | Cambiar a `queued`, limpiar error, incrementar contador | `queued` |

**Características:**
- ✅ Validación de input (countrySlug obligatorio, formato válido)
- ✅ CORS habilitado para peticiones cross-origin
- ✅ Sin service role en frontend (usa `supabase.functions.invoke`)
- ✅ Manejo seguro de errores
- ✅ Documentación completa en JSDoc

**Función frontend creada:** `requestCountryMapGeneration()` en `countryMapAssets.service.ts`

```typescript
const result = await requestCountryMapGeneration({
  countrySlug: 'mexico',
  countryName: 'México',
  isoAlpha2: 'MX',
  isoAlpha3: 'MEX'
});
```

**Restricciones cumplidas:**
- NO pone service role en frontend
- NO genera mapa todavía (solo crea registro `queued`)
- NO toca CountryPage, WorldMap, SpainMap
- NO modifica schema SQL

**Verificación:**
- ✅ `npm run build` exitoso (688 modules, sin errores TypeScript)

---

### 2026-05-01 - Servicio CountryMapAssets para consulta de mapas internos (DA-030) 🗺️

Creado servicio frontend read-only para consultar estado de assets cartográficos en Supabase.

**Archivo creado:** `src/features/map/services/countryMapAssets.service.ts`

**Tipos definidos:**
- `CountryMapAssetStatus`: 'missing' | 'queued' | 'generating' | 'ready' | 'failed'
- `CountryMapAsset`: Interface completa con metadatos del asset (id, countrySlug, status, storagePath, etc.)

**Funciones implementadas:**

| Función | Propósito | Retorno |
|---------|-----------|---------|
| `getCountryMapAsset(countrySlug)` | Consulta tabla country_map_assets | `Promise<CountryMapAsset \| null>` |
| `getCountryMapPublicUrl(asset)` | Obtiene URL pública de Storage | `string \| null` |
| `isCountryMapReady(asset)` | Helper para verificar status === 'ready' | `boolean` |

**Características:**
- ✅ Read-only (solo SELECT, no escribe)
- ✅ Sin service role (usa cliente anónimo con RLS)
- ✅ Manejo seguro de errores (devuelve null, no rompe la app)
- ✅ Documentación completa en JSDoc
- ✅ Compatible con DA-030 (arquitectura de generación automática)

**Restricciones cumplidas:**
- NO modifica Supabase/schema
- NO toca CountryPage, WorldMap, SpainMap
- NO genera assets (solo consulta)
- NO crea estructura de exports innecesaria

**Verificación:**
- ✅ `npm run build` exitoso (688 modules, sin errores TypeScript)

---

### 2026-05-01 - Decisión DA-029: Mapas exploratorios con bandera y demanda pública ✅🗺️

Aprobada por Vasyl la nueva dirección para mapas en Trawel: experiencia exploratoria homogénea con banderas y captura de demanda.

**Puntos clave de DA-029:**

| Aspecto | Decisión |
|---------|----------|
| **Marcadores** | ❌ NO puntos de ciudad en ningún mapa |
| **Labels fijos** | ❌ NO nombres siempre visibles |
| **Información** | ✅ Solo tooltips al hacer hover |
| **Estilo** | Neutro para todos, sin revelar disponibilidad |
| **Color hover** | Amarillo/dorado consistente |

**Banderas:**
- Tooltip WorldMap: nombre del país + bandera (emoji)
- CountryPage: nombre limpio + bandera (ej: "🇪🇸 España", sin "ES")

**Captura de demanda pública:**
- Click en país sin contenido → página "Próximamente" atractiva
- El click se registra como señal de demanda
- Investighost usa estas métricas para priorizar investigaciones
- comingSoon = demanda pública detectada (NO fase editorial interna)

**Distinción crítica:**
- **comingSoon**: usuarios han clickeado, queremos este lugar
- **draft/disabled**: editorial interno, no es público

**Archivos de referencia:**
- Decisión completa: `docs/DECISIONES.md` (DA-029)
- MAP_ASSET_PLAN.md actualizado con principios de mapa exploratorio

---

### 2026-05-01 - SQL: Tabla country_map_assets para persistencia de mapas 🗄️

Creada migración SQL completa para persistir metadatos de mapas generados automáticamente.

**Archivo creado:** `supabase/migrations/002_create_country_map_assets.sql`

**Estructura de la tabla:**
```sql
country_map_assets
├── id (UUID PK)
├── country_slug (TEXT UNIQUE) - identificador del país
├── country_name, iso_alpha2, iso_alpha3
├── admin_level (ADM1/ADM2) - nivel administrativo
├── status (missing/queued/generating/ready/failed)
├── storage_bucket, storage_path - ubicación en Storage
├── source, license, attribution - metadatos de fuente
├── feature_count, size_bytes - estadísticas del asset
├── requested_count, last_requested_at - métricas de demanda
├── generated_at, error_message
└── created_at, updated_at (con trigger automático)
```

**Constraints:**
- CHECK status ∈ {missing, queued, generating, ready, failed}
- CHECK admin_level ∈ {ADM0..ADM5}
- Índices: status, country_slug, (country_slug, status)

**Seguridad:**
- RLS activado
- Policy SELECT: pública (frontend puede consultar estado)
- NO hay policies INSERT/UPDATE/DELETE públicas
- Escritura reservada a backend/worker con service role key

**Storage bucket:**
- Bucket: `map-assets` (documentado, crear en dashboard)
- Política SELECT: pública (frontend descarga assets)
- Política INSERT/UPDATE/DELETE: solo service role

**Instrucciones de uso en el SQL:**
1. Ejecutar migración en Supabase SQL Editor
2. Crear bucket 'map-assets' en Storage (público)
3. Configurar política SELECT pública en Storage
4. Subir assets con service role desde backend/worker

---

### 2026-05-01 - DA-030: Arquitectura definitiva de generación automática de mapas 🗺️⚙️

Documentada la decisión definitiva para generación automática y persistente de mapas internos por país.

**Arquitectura aprobada:**

| Componente | Tecnología | Rol |
|------------|------------|-----|
| **Frontend** | React + D3 | Consultar estado, UI de estados, renderizar |
| **Supabase DB** | PostgreSQL | Tabla `country_map_assets` con estados |
| **Supabase Storage** | S3-compatible | Bucket `map-assets` para TopoJSON |
| **Worker** | Edge Function | Procesar GeoJSON → TopoJSON |
| **Fuente** | geoBoundaries | Datos cartográficos oficiales |

**Flujo de estados:**
```
missing → queued → generating → ready
              ↓
            failed (reintentable)
```

**Persistencia:**
- Tabla: `country_map_assets` (country_slug PK, status, storage_path, etc.)
- Storage: `map-assets/countries/{slug}/{slug}-adm2.topojson`
- Una vez generado, permanece disponible para todas las visitas futuras

**Distinción crítica:**
- **Investighost**: Genera contenido editorial (sitios, rutas, textos)
- **Trawel (sistema técnico)**: Genera mapas cartográficos (assets TopoJSON)

---

### 2026-05-01 - WorldMap DA-029: Mapa exploratorio neutro con banderas ✅🗺️

Implementada DA-029 en WorldMap: mapa mundial exploratorio donde todos los países se ven igual, con tooltips de bandera + nombre.

**Cambios realizados:**

| Aspecto | Antes | Después (DA-029) |
|---------|-------|------------------|
| **Colores de países** | Diferenciados por estado (azul=activo, gris=comingSoon) | Todos iguales (neutro/gris) |
| **Hover** | Azul oscuro en activos, gris en otros | Amarillo/dorado (`#f59e0b`) para todos |
| **Tooltip** | Nombre + contador de destinos + badge | Solo bandera + nombre |
| **Leyenda** | Visible con "Disponible", "Próximamente", "No disponible" | ❌ Eliminada |
| **Indicadores visuales** | Revelaban qué países tienen contenido | Neutral, no revela disponibilidad |

**Helper de banderas creado:**
- Archivo: `src/features/countries/utils/countryHelpers.ts`
- Función `countryCodeToFlagEmoji(isoAlpha2)`: convierte código ISO a emoji
- Función `formatCountryWithFlag(name, isoAlpha2)`: "🇪🇸 España"

**Archivos modificados:**
- `src/features/map/components/WorldMap/WorldMap.tsx` - Lógica neutralizada, tooltip simplificado
- `src/features/map/components/WorldMap/WorldMap.module.css` - Tooltip compacto, CSS limpio
- `src/features/countries/utils/countryHelpers.ts` - Nuevo helper de banderas
- `src/features/countries/index.ts` - Export público del helper

**Verificación:**
- ✅ Build exitoso (`npm run build`)
- ✅ Sin errores TypeScript
- ✅ Tooltip muestra "🇪🇸 España" correctamente

---

### 2026-05-01 - SpainMap v2: Alineación visual con WorldMap y mejora de detalle 🎨

Alineado SpainMap con el lenguaje visual de WorldMap y mejorado el detalle del asset.

**Cambios visuales aplicados:**
- Factor de simplificación: `0.05` (5%) → `0.02` (2%) para mayor detalle
- Tamaño del asset: 52.59 KB → 57.67 KB (aún dentro del objetivo <150KB)
- Provincias ahora usan `defaultMapTheme` (colores consistentes con WorldMap)
- Tooltip estilo oscuro (fondo `rgba(15, 23, 42, 0.95)`) como en WorldMap
- Transiciones `cubic-bezier(0.4, 0, 0.2, 1)` idénticas a WorldMap
- Container con gradiente y sombras alineadas
- Aspect ratio responsive con `padding-bottom: 75%`

**Archivos modificados:**
- `scripts/prepare-spain-map-asset.ts` - Factor de simplificación 0.02, target 150KB
- `src/features/map/components/SpainMap/SpainMap.tsx` - Usa `defaultMapTheme`
- `src/features/map/components/SpainMap/SpainMap.module.css` - Estilos alineados con WorldMap
- `public/maps/countries/spain/spain-adm2.topojson` - Regenerado con 2% de detalle

---

### 2026-05-01 - SpainMap v2: Fix de orientación de polígonos (winding) 🗺️

Corregido problema crítico donde cada provincia mostraba un rectángulo gigante además de su forma real.

**Diagnóstico real:**
- En DevTools, cada path de provincia contenía: `M395...Z` (forma real) + `M700,0...L100,0Z` (rectángulo gigante)
- Causa: D3 geoPath interpretaba polígonos como "complementarios" (agujeros del mundo)

**Fix aplicado en pipeline de asset:**
- Añadida fase de normalización en `scripts/prepare-spain-map-asset.ts`
- Función `ringArea()` calcula área firmada (fórmula del shoelace)
- Función `normalizePolygon()` invierte anillos según área para cumplir expectativa de D3

---

### 2026-05-01 - SpainMap v2: Fix visual - Provincias ahora visibles 🎨

Corregido problema de visibilidad de provincias en el mapa de España.

**Causa raíz:**
- Fill de provincias: `#e2e8f0` (gris muy claro) sobre fondo `#f8fafc` (casi blanco)
- Stroke: `#94a3b8` (gris claro) sin suficiente contraste

**Fix aplicado:**
```typescript
.attr('fill', '#cbd5e1')           // Gris medio más visible
.attr('stroke', '#475569')         // Gris oscuro visible
```

---

### 2026-05-01 - SpainMap v2: Reemplazo de prototipo temporal por asset real ✅🗺️

Implementado SpainMap v2 que reemplaza la silueta SVG manual por el asset TopoJSON optimizado de geoBoundaries:

**Cambios realizados:**
| Aspecto | Anterior (v1) | Nuevo (v2) |
|---------|---------------|------------|
| Base cartográfica | SVG manual (~200 líneas) | TopoJSON real (52.59 KB) |
| Provincias | ❌ No disponibles | ✅ 52 provincias interactivas |
| Proyección | Manual aproximada | geoMercator con fitSize |
| Precisión | Kilométrica (~errors) | Exacta (geoBoundaries ADM2) |
| Atribución | ❌ No visible | ✅ "Datos cartográficos: geoBoundaries (CC BY 4.0)" |

**Archivos modificados:**
- `src/features/map/components/SpainMap/SpainMap.tsx` - Nueva implementación con D3 + topojson-client
- `src/features/map/components/SpainMap/SpainMap.module.css` - Estilos para provincias, atribución, fallback

---

### 2026-05-01 - Asset de mapa de España optimizado para producción ✅🗺️

Implementada optimización completa del asset ADM2 de España, generando TopoJSON de 52.59 KB apto para producción desde el GeoJSON raw de 40.83 MB:

**Transformación realizada:**
| Etapa | Tamaño | Formato | Notas |
|-------|--------|---------|-------|
| Raw descargado | 40.83 MB | GeoJSON | Fuente: geoBoundaries ESP-ADM2 |
| Optimizado | **52.59 KB** | **TopoJSON** | 99.9% reducción, ideal <100KB ✅ |

**Proceso técnico:**
- Conversión: GeoJSON → TopoJSON con `topojson-server`
- Simplificación: 5% de detalle original (factor 0.05) con `topojson-simplify`
- Validación: 52 provincias preservadas, Castellón ✓, Teruel ✓
- Arquitectura: 509 arcos compartidos en topología

---

### 2026-05-01 - Política de atribución cartográfica documentada 🗺️

Documentada política de atribución para cumplir requisitos legales de fuentes cartográficas externas (especialmente geoBoundaries):

**Texto de atribución recomendado:**
```
"Datos cartográficos: geoBoundaries (CC BY 4.0)"
```

---

### 2026-05-01 - Fix Supabase destinations: resolución correcta city_id → citySlug 🐛

Corregido bug en `supabaseTravelData.source.ts` que impedía cargar destinos publicados desde Supabase:

**Problema:**
- Al indexar destinations, el código intentaba resolver `citySlug` usando `countriesById` con `dbDest.city_id`
- `countriesById` mapea `country_id` → `countrySlug`, no `city_id` → `citySlug`
- Resultado: siempre retornaba `undefined`, los destinations se saltaban con `continue`

**Fix aplicado:**
- Agregado `citiesById` al cache: mapea `city_id` (UUID) → `citySlug`
- Al indexar ciudades: guardar `cache.citiesById.set(dbCity.id, city.slug)`
- Al indexar destinations: usar `cache.citiesById.get(dbDest.city_id)`

---

### 2026-05-01 - Comparación de fuentes cartográficas para España 🗺️

Creado análisis comparativo entre geoBoundaries y Natural Earth para elegir fuente definitiva del mapa interno de España:

**Decisión tomada:**
- **Fuente recomendada: geoBoundaries ADM2 (provincias)**
- Justificación: Provincias españolas permiten diferenciar Castellón (Morella) de Teruel (Albarracín)
- Natural Earth ADM1 (autonomías) descartado: demasiado grueso para España turística

---

### 2026-05-01 - Diagnóstico: SpainMap como prototipo temporal 🗺️

Realizado diagnóstico completo del componente SpainMap y creado plan para reemplazo por asset cartográfico fiable:

**Problema detectado:**
- SpainMap usa silueta SVG manual (path aproximado líneas 122-146) no geográficamente precisa
- Islas representadas como elipses simplificadas
- Código de 220 líneas difícil de adaptar a otros países
- Proyección manual simplificada, no estándar

**Conclusión:** SpainMap es **prototipo temporal/piloto arquitectónico** válido funcionalmente, pero debe reemplazarse antes de producción-ready.

---

### 2026-05-01 - Handoff para v0: Documento de rediseño visual 🎨

Creado documento de handoff para equipo de diseño v0 con especificaciones claras de rediseño visual:

**Principios clave del handoff:**
- v0 mejora estética y UX sin cambiar arquitectura ni lógica de datos
- Trawel sigue siendo exhibidor de contenido, no panel editorial
- Modo Aventura/Estudiante debe ser más visible pero sin inventar diferencias editoriales

---

### 2026-05-01 - Auditoría: Modo Aventura/Estudiante 🔍

Auditoría completa del uso del modo de experiencia en el flujo público:

**Hallazgos clave:**
| Página | Usa modo | Indicador visual |
|--------|----------|------------------|
| HomePage | ✅ Sí | ❌ No |
| CountryPage | ❌ No | ❌ No |
| CityPage | ✅ Sí | ❌ No |
| AdventurePage | ✅ Sí | ✅ Sí (badge) |

**Recomendaciones priorizadas (antes de v0):**
1. Añadir badge de modo en todas las páginas
2. Tooltip explicativo en el selector
3. Indicador cuando se usa contenido fallback
4. Diferenciar títulos de sección en CityPage

---

### 2026-05-01 - Agent Brief: Entrada rápida para agentes 📋

Creado documento de entrada rápida para futuros agentes en microtareas:

**Archivo creado:** `docs/AGENT_BRIEF.md` - Brief corto (200 líneas) con:
- Propósito del proyecto (app pública, no panel editorial)
- Flujo público actual (Home → País → Ciudad → Destino)
- Arquitectura de fuentes de datos
- Estados editoriales públicos (qué es visible vs. interno)
- Decisiones importantes (DA-027, DA-028)
- Estado de contenido (Morella visible, Albarracín oculta)
- Reglas para agentes (microtareas, qué leer según tarea)
- Checklist antes de tocar código

---

### 2026-05-01 - Guion de Demo para presentaciones 🎬

Creado guion completo para presentar Trawel a socios/colaboradores:

**Archivo creado:** `docs/DEMO_CHECKLIST.md` - Guion paso a paso con:
- Objetivo de la demo (estructura real, no maqueta)
- Preparación previa (verificar entorno, rutas clave)
- Guion detallado: Home → España → Morella → Castillo → Cambio de modo
- Sección "Qué NO enseñar como error" (Albarracín como ejemplo de filtro funcionando)
- Explicación estratégica de comingSoon e Investighost
- Checklist de verificación pre-demo
- Tabla de riesgos: qué no prometer

---

### 2026-05-01 - Piloto arquitectónico: Mapa interno de España (DA-027)

**Cambios realizados:**
- Nuevo componente `SpainMap` para visualización de ciudades españolas en mapa SVG interactivo
- Integración en `CountryPage`: mapa interno como pieza principal para España, lista de ciudades como apoyo secundario
- Fallback automático: países sin mapa interno mantienen el directorio clásico de ciudades
- Añadida Albarracín al catálogo de ciudades españolas (con coordenadas para el mapa)
- Estructura progresiva: `COUNTRIES_WITH_INTERNAL_MAP` permite activar mapas por país bajo demanda

**Criterios cumplidos:**
- ✅ `/pais/espana` muestra mapa interno como elemento principal
- ✅ Morella y Albarracín aparecen como puntos clickeables en el mapa
- ✅ Navegación a CityPage funciona desde ambos puntos del mapa
- ✅ Lista de ciudades visible como sección secundaria
- ✅ Fallback para países sin mapa (Japón, Perú mantienen lista clásica)
- ✅ Build sin errores
- ✅ Responsive
- ✅ Sin modificar Supabase/schema

---

### 2026-05-01 - Fix Supabase: Filtro público de estados editoriales 🔒

Mitigado riesgo de visibilidad de contenido interno detectado en auditoría DA-028:

**Cambios aplicados en `src/features/travelData/sources/supabaseTravelData.source.ts`:**
- Consulta de cities: añadido filtro `.eq('status', 'active')`
- Consulta de destinations: añadido filtro `.eq('status', 'published')`

**Verificación manual con Supabase (VITE_TRAVEL_DATA_SOURCE=supabase):**
- `/pais/espana/albarracin` → "Ciudad no encontrada" ✅ (disabled filtrado)
- `/aventura/conjunto-historico-albarracin` → "Aventura no encontrada" ✅ (draft filtrado)
- `/pais/espana/morella` y `/aventura/castillo-de-morella` funcionan correctamente ✅

---

### 2026-04-30 - Auditoría: Visibilidad de estados editoriales en Supabase 🔍

Auditoría de seguridad sobre filtrado de estados editoriales (DA-028):

**Hallazgos críticos:**
- SupabaseTravelDataSource **NO filtra** por status: carga `disabled` y `draft`
- CityPage permite acceso por URL a ciudades `disabled` (riesgo: Albarracín visible)
- AdventurePage permite acceso por URL a destinos `draft` (riesgo: contenido en desarrollo expuesto)

**Recomendación:** Agregar filtros `.eq('status', 'active')` y `.eq('status', 'published')` en supabaseTravelData.source.ts

---

### 2026-04-30 - Decisión DA-028: comingSoon como demanda pública

Redefinido el propósito de `comingSoon`: ya no es fase editorial, sino indicador de **demanda pública**.

| Estado | Significado |
|--------|-------------|
| `comingSoon` | Lugares que usuarios buscan pero Trawel aún no tiene (cola de prioridades editoriales) |
| `disabled` + `draft` | Contenido editorial en desarrollo, interno/no visible |

**Consecuencias:**
- Investighost NO publica contenido incompleto como `comingSoon`
- Albarracín corregida: `city.status = 'disabled'` (era `comingSoon`)
- Contenido en desarrollo permanece oculto hasta publicación

---

### 2026-04-30 - Ejecución SQL Albarracín en Supabase verificada

Verificada ejecución manual del SQL de Albarracín en Supabase:
- cities.slug = albarracin (status: disabled - DA-028)
- destinations.slug = conjunto-historico-albarracin (status: draft, verification_status: pending)
- destination_sources: 5 fuentes insertadas

**Distinción clave:** Insertado en Supabase ≠ Publicado en Trawel. Los datos requieren cambio manual a `published` tras revisión editorial final.

---

### 2026-04-29 - Selector global de modo Aventura/Estudiante ✅

Implementado selector de modo de experiencia visible en toda la aplicación:

**Creados/Modificados:**
- `src/features/experienceMode/context/ExperienceModeContext.tsx` - Context global con persistencia en localStorage
- `src/App.tsx` - Header global con selector integrado
- `src/App.module.css` - Estilos del header y layout
- `src/pages/CityPage/CityPage.tsx` - Usa modo global con fallback
- `src/pages/AdventurePage/AdventurePage.tsx` - Usa modo global con fallback
- `src/features/experienceMode/index.ts` - Exports del Provider y hook

**Características:**
- Selector visible en header en todas las páginas
- Persistencia en localStorage (`trawel-experience-mode`)
- Modo por defecto: `adventure`
- Hook `useExperienceMode()` para acceder al modo desde cualquier componente
- Fallback automático: si falta contenido del modo activo, usa el otro modo

---

### 2026-04-29 - Corrección editorial: contenido dual de Morella

Corregidos los textos de Morella para que `adventure_content_es` y `student_content_es` sean claramente diferentes:

**adventure_content_es** (modo viajero):
- Enfoque práctico: cómo visitar, qué esperar, consejos de recorrido
- "Empieza tu visita subiendo al castillo por la mañana temprano..."

**student_content_es** (modo estudiante):
- Enfoque explicativo: historia, geografía, patrimonio, contexto
- "Su ubicación estratégica en la frontera entre Aragón y Cataluña..."

---

### 2026-04-29 - Decisión DA-027: Estrategia progresiva para mapas internos

Aprobada estrategia progresiva para assets cartográficos internos:

| Aspecto | Estrategia |
|---------|------------|
| Mapa mundial base | Copia propia optimizada como asset estático |
| Mapas internos de países | NO se incluirán todos desde el inicio |
| Incorporación | Bajo demanda editorial o cuando un país tenga contenido/tráfico suficiente |
| Almacenamiento | Una vez incorporado, Trawel guardará copia propia optimizada |
| Dependencia externa | NO se dependerá de consultas en tiempo real para pintar mapas |

---

### 2026-04-28 - Setup de Supabase completado ✅

**Schema SQL ejecutado en Supabase:**
- Tablas: countries, cities, destinations, destination_sources
- Estados editoriales: active/comingSoon/disabled, draft/published/comingSoon/disabled
- RLS policies: SELECT público, escritura solo service role
- Índices para queries comunes

**Seed data insertado:**
- Country: España (active)
- Cities: Morella (active), Albarracín (disabled)
- Destinations: Castillo de Morella (published), Conjunto Histórico Albarracín (draft)

---

### 2026-04-28 - Decisión DA-026: Mock como fuente por defecto hasta conectar Supabase

Decisión de mantener `mock` como fuente de datos por defecto mediante variable de entorno `VITE_TRAVEL_DATA_SOURCE=mock`.

**Implementación:**
- Creado `.env.example` con `VITE_TRAVEL_DATA_SOURCE=mock`
- Documentado en `docs/SUPABASE_SETUP.md` el flujo completo
- Seed.sql generado compatible con RLS

**Flujo previsto:**
1. **Actual (Fase 1):** Mock activo, documentación lista, schema creado
2. **Fase 2:** Crear proyecto Supabase, ejecutar schema, cargar seed
3. **Fase 3:** Instalar `@supabase/supabase-js`, crear `SupabaseTravelDataSource`
4. **Fase 4:** Cambiar `VITE_TRAVEL_DATA_SOURCE=supabase`, probar conexión

---

### 2026-04-28 - Modelo de base de datos real para Trawel (DA-025)

Definido modelo de base de datos con tablas específicas y campos `_es` para contenido en español:

**Tablas definidas:**
1. **countries**: `id`, `slug`, `name_es`, `emoji`, `capital_es`, `continent_es`, `description_es`, `status`, `featured`, timestamps
2. **cities**: `id`, `country_id`, `slug`, `name_es`, `short_description_es`, `adventure_content_es`, `student_content_es`, `lat`, `lng`, `status`, `featured`, etc.
3. **destinations**: `id`, `country_id`, `city_id`, `slug`, `title_es`, `summary_es`, `adventure_content_es`, `student_content_es`, `type`, `tags`, etc.
4. **destination_sources**: `id`, `destination_id`, `title`, `url`, `type`, `supports`, timestamps

---

### 2026-04-27 - Inicio del proyecto Trawel

**Decisión DA-001:** Usar Vite + React para el MVP. No usar Next.js en esta fase.

**Stack inicial:**
- Vite + React + TypeScript
- React Router para navegación
- CSS Modules + Variables CSS
- D3.js + TopoJSON para mapas (DA-002)

**Estructura de carpetas:**
```
src/
├── features/     # Módulos por dominio
├── pages/        # Componentes de página
├── app/          # Configuración global
└── lib/          # Utilidades compartidas
```

---

## Referencias cruzadas

- **Decisiones:** `docs/DECISIONES.md`
- **Arquitectura:** `docs/ARCHITECTURE.md`
- **CODEMAP:** `docs/CODEMAP.md`
- **Setup Supabase:** `docs/SUPABASE_SETUP.md`
- **Handoff v0:** `docs/V0_HANDOFF.md`
- **MAP_ASSET_PLAN:** `docs/MAP_ASSET_PLAN.md`

---

*Histórico v1.0 - Trawel*
*Período: 2026-04-27 a 2026-05-01*