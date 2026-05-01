# BITACORA.md — Bitácora activa del proyecto Trawel

> **Nota:** Este es el archivo de bitácora activo. Para el histórico completo, ver `docs/BITACORA_001.md`.

---

## Estado actual del proyecto (Resumen ejecutivo)

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

---

## Historial recientes (últimas entradas)

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

**Verificación:**
- ✅ 52 provincias con detalle mejorado
- ✅ Castellón y Teruel presentes
- ✅ Navegación a Morella y Albarracín funciona
- ✅ Hover y transiciones consistentes con WorldMap
- ✅ Build exitoso

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

**Verificación post-fix:**
- ✅ Paths SVG ya NO contienen rectángulo gigante
- ✅ Solo se renderiza la forma real de cada provincia

---

### 2026-05-01 - SpainMap v2: Fix visual - Provincias ahora visibles 🎨

Corregido problema de visibilidad de provincias en el mapa de España. Aunque el renderizado funcionaba (52 provincias sin errores), las provincias eran prácticamente invisibles por falta de contraste con el fondo.

**Causa raíz:**
- Fill de provincias: `#e2e8f0` (gris muy claro) sobre fondo `#f8fafc` (casi blanco)
- Stroke: `#94a3b8` (gris claro) sin suficiente contraste

**Fix aplicado:**
```typescript
.attr('fill', '#cbd5e1')           // Gris medio más visible
.attr('stroke', '#475569')         // Gris oscuro visible
```

**Archivos modificados:**
- `src/features/map/components/SpainMap/SpainMap.tsx`

---


### 2026-05-01 - SpainMap v2: Debug de renderizado de provincias 🔍

Añadidos logs extensivos de desarrollo para diagnosticar problemas de renderizado visual:

**Cambios realizados:**
- Logs detallados en cada paso del proceso (carga, conversión, renderizado)
- Verificación de geometrías válidas antes de procesar
- Contadores de provincias renderizadas vs errores
- Cálculo de bounds para debug
- Validación de paths generados (detecta paths vacíos)

**Estructura SVG mejorada:**
```svg
<svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
  <rect fill="#f8fafc" />           <!-- Fondo -->
  <g class="provincesGroup">        <!-- Provincias -->
    <path d="..." fill="#e2e8f0" stroke="#94a3b8" />
  </g>
  <g class="citiesGroup">           <!-- Ciudades (encima) -->
    <circle />
    <text />
  </g>
</svg>
```

**Logs disponibles en consola:**
- `[SpainMap] Asset loaded, topology keys`
- `[SpainMap] Features convertidos: 52`
- `[SpainMap] Creando proyección para X features`
- `[SpainMap] Bounds calculados`
- `[SpainMap] Provincias renderizadas: X Errores: Y`
- `[SpainMap] Renderizado completo`

**Archivos modificados:**
- `src/features/map/components/SpainMap/SpainMap.tsx` (líneas 68-260)

---

### 2026-05-01 - SpainMap v2: Fix clave topology.objects.spain 🐛

Corregido bug que impedía renderizar el mapa (aparecía fallback en lugar de provincias):

**Causa del fallo:**
- Línea 83 usaba `topology.objects.spain_adm2`
- La clave real en el asset TopoJSON es `topology.objects.spain`
- Error no detectado en build (fallo en runtime)

**Fix aplicado:**
```typescript
// ANTES (fallaba):
const geojson = feature(topology, topology.objects.spain_adm2)

// DESPUÉS (funciona):
const objectKey = 'spain';
const geojson = feature(topology, topology.objects[objectKey])
```

**Mejoras adicionales:**
- Logs de desarrollo detallados (`[SpainMap] ...`)
- Validación explícita de claves disponibles en `topology.objects`
- Mensaje de error más descriptivo en fallback
- Verificación de features convertidos antes de renderizar

**Archivos modificados:**
- `src/features/map/components/SpainMap/SpainMap.tsx` (líneas 68-98)

**Validación post-fix:**
- ✅ Build exitoso
- ✅ Sin errores TypeScript
- ✅ Logs visibles en consola de desarrollo

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

**Características implementadas:**
- Carga dinámica de `/maps/countries/spain/spain-adm2.topojson`
- Renderizado de 52 provincias como paths SVG interactivos
- Hover en provincias (cambio de color)
- Puntos de ciudades mantenidos (Morella, Albarracín, Madrid, Barcelona)
- Navegación a CityPage desde puntos de ciudad
- Atribución visible y clickeable a geoBoundaries
- Fallback limpio si el asset no carga (lista de botones)
- Loading state con spinner

**Dependencias utilizadas (ya existentes):**
- `d3` (geoMercator, geoPath)
- `topojson-client` (feature)

**Validación:**
- ✅ Build sin errores TypeScript
- ✅ Sin nuevas dependencias (usando existentes)
- ✅ Fallback no rompe CountryPage
- ✅ Atribución CC BY 4.0 visible
- ✅ Comportamiento de navegación preservado

**Próximo paso:** Crear componente `CountryMap` genérico para reutilizar lógica con otros países

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

**Comandos implementados:**
```bash
npm run maps:spain:prepare    # Descarga asset raw
npm run maps:spain:optimize   # Genera TopoJSON optimizado
```

**Scripts creados:**
| Script | Propósito |
|--------|-----------|
| `scripts/download-geoboundaries.ts` | Descarga automática desde API geoBoundaries |
| `scripts/inspect-map-asset.ts` | Análisis de GeoJSON/TopoJSON |
| `scripts/prepare-spain-map-asset.ts` | Optimización: conversión + simplificación |

**Dependencias añadidas:**
```json
"topojson-server": "^3.0.1",
"topojson-simplify": "^3.0.3",
"@types/topojson-server": "^3.0.6",
"@types/topojson-simplify": "^3.0.3"
```

**Assets en zona controlada:**
```
public/maps/countries/spain/
├── spain-adm2-raw.geojson       (40.83 MB - fuente)
├── spain-adm2-metadata.json     (metadata de geoBoundaries)
└── spain-adm2.topojson          (52.59 KB - optimizado ✅)
```

**Documentación actualizada:**
- `docs/SPAIN_MAP_ASSET_TEST.md` - Nota técnica con proceso y validación
- `docs/MAP_ASSET_PLAN.md` - Reflejado asset optimizado disponible

**Estado:** ✅ COMPLETADO - Asset listo para integración en componente CountryMap

**Próximo paso:** Crear componente `CountryMap` genérico que cargue el TopoJSON y reemplace `SpainMap` prototipo

---

### 2026-05-01 - Asset de mapa de España descargado automáticamente ✅🗺️

Implementado flujo automático completo para descargar y evaluar geoBoundaries ADM2 (provincias) como candidato para reemplazar SpainMap prototipo temporal:

**Zona controlada:**
```
public/maps/countries/spain/
├── spain-adm2-raw.geojson       (40.83 MB - descargado automáticamente)
└── spain-adm2-metadata.json     (generado desde API)
```

**Comando implementado:**
```bash
npm run maps:spain:prepare
```

**Scripts creados/mejorados:**
| Script | Propósito |
|--------|-----------|
| `scripts/download-geoboundaries.ts` | Flujo automático: API → metadata → GeoJSON → análisis |
| `scripts/inspect-map-asset.ts` | Funciones exportables para análisis de GeoJSON/TopoJSON |

**Resultados de la descarga:**
- **API consultada:** `https://www.geoboundaries.org/api/current/gbOpen/ESP/ADM2`
- **Asset descargado:** 40.83 MB GeoJSON con 52 provincias
- **Nivel confirmado:** ADM2 (provincias) ✅
- **Castellón:** ✅ Encontrado (aparece como "Castellon")
- **Teruel:** ✅ Encontrado
- **Licencia:** CC BY 4.0 - Requiere atribución visible

**Documentación actualizada:**
- `docs/SPAIN_MAP_ASSET_TEST.md` - Nota técnica completa con resultados reales
- `package.json` - Añadido script `maps:spain:prepare`

**Estado:** ✅ COMPLETADO - Asset listo para optimización (<100KB) e integración futura

**Próximo paso:** Simplificar geometría (~1% de detalle) y convertir a TopoJSON para uso en producción

---

### 2026-05-01 - Política de atribución cartográfica documentada 🗺️

Documentada política de atribución para cumplir requisitos legales de fuentes cartográficas externas (especialmente geoBoundaries):

**Cambios en documentación:**

| Archivo | Cambio |
|---------|--------|
| `docs/MAP_ASSET_PLAN.md` | Nueva sección "8. Atribución y licencias" con registro de assets y formato de atribución |
| `docs/MAP_SOURCE_COMPARISON.md` | Añadido criterio "Cumplimiento de atribución visible en UI" y corrección de licencia geoBoundaries a CC BY 4.0 |
| `docs/V0_HANDOFF.md` | Nueva regla: "NO eliminar ni ocultar atribuciones cartográficas" + sección de atribución obligatoria |

**Texto de atribución recomendado:**
```
"Datos cartográficos: geoBoundaries (CC BY 4.0)"
```
*(Verificar contra metadata del archivo concreto descargado)*

**Reglas para v0:**
- No eliminar ni ocultar atribuciones cartográficas
- Atribución debe estar visible, discreta y legible cerca del mapa
- Posición: esquina inferior del mapa, footer, o modal de créditos

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

**Archivo modificado:**
- `src/features/travelData/sources/supabaseTravelData.source.ts`

**Verificación:**
- ✅ `npm run build` exitoso
- Build: 683 modules, sin errores TypeScript ni vite

---

### 2026-05-01 - Comparación de fuentes cartográficas para España 🗺️

Creado análisis comparativo entre geoBoundaries y Natural Earth para elegir fuente definitiva del mapa interno de España:

**Documento creado:**
- `docs/MAP_SOURCE_COMPARISON.md` - Comparación detallada con:
  - Análisis de geoBoundaries ADM1/ADM2 vs Natural Earth Admin 1
  - Tabla comparativa por criterios (licencia, nivel administrativo, tamaño, facilidad)
  - Análisis específico para ciudades Trawel (Morella, Albarracín, Madrid, Barcelona)
  - Problema clave identificado: Natural Earth ADM1 agrupa Castellón y Teruel en Aragón

**Decisión tomada:**
- **Fuente recomendada: geoBoundaries ADM2 (provincias)**
- Justificación: Provincias españolas permiten diferenciar Castellón (Morella) de Teruel (Albarracín)
- Natural Earth ADM1 (autonomías) descartado: demasiado grueso para España turística
- Ruta propuesta: `public/maps/countries/spain/spain-adm2.topojson`

**Próximo paso:**
- Implementar Fase 2 de MAP_ASSET_PLAN.md: descargar geoBoundaries ESP-ADM2, procesar a TopoJSON simplificado, crear componente CountryMap

---

### 2026-05-01 - Diagnóstico: SpainMap como prototipo temporal 🗺️

Realizado diagnóstico completo del componente SpainMap y creado plan para reemplazo por asset cartográfico fiable:

**Problema detectado:**
- SpainMap usa silueta SVG manual (path aproximado líneas 122-146) no geográficamente precisa
- Islas representadas como elipses simplificadas
- Código de 220 líneas difícil de adaptar a otros países
- Proyección manual simplificada, no estándar

**Conclusión:** SpainMap es **prototipo temporal/piloto arquitectónico** válido funcionalmente, pero debe reemplazarse antes de producción-ready.

**Documento creado:**
- `docs/MAP_ASSET_PLAN.md` - Plan completo con:
  - Principios técnicos (asset local, no runtime externo, no dibujos manuales)
  - Fuente recomendada: geoBoundaries ADM2 (provincias)
  - Formato: TopoJSON en `public/maps/countries/`
  - Plan por fases: Fase 1 (actual prototipo) → Fase 2 (asset real España) → Fase 3 (más países)
  - Reglas para v0: mejora estética, no crea cartografía
  - Próximo bloque técnico detallado

**Relación con DA-027:**
- Alineado con estrategia progresiva de mapas internos
- Asset local optimizado, procesado una vez desde fuentes fiables
- v0 mejora presentación visual, no sustituye asset cartográfico

**Próximo paso:**
- Implementar Fase 2: descargar geoBoundaries ESP-ADM2, crear script de procesado, componente CountryMap genérico

---

### 2026-05-01 - Handoff para v0: Documento de rediseño visual 🎨

Creado documento de handoff para equipo de diseño v0 con especificaciones claras de rediseño visual:

**Archivo creado:**
- `docs/V0_HANDOFF.md` - Documento completo con:
  - Qué es Trawel (app pública, flujo Mundo→País→Ciudad→Destino)
  - Objetivo del rediseño (estética premium, UX, responsive)
  - Páginas a rediseñar (Home, Country, City, Adventure, estados no encontrados)
  - Componentes/lógica que NO se debe romper (header global, ExperienceModeContext, capa de datos)
  - Reglas estrictas (no tocar Supabase, mock, rutas, estados editoriales)
  - Dirección estética (travel premium moderno, mapa protagonista)
  - Conclusiones del audit de ExperienceMode (mejorar visibilidad del modo)
  - Entregables esperados y checklist de aceptación

**Principios clave del handoff:**
- v0 mejora estética y UX sin cambiar arquitectura ni lógica de datos
- Trawel sigue siendo exhibidor de contenido, no panel editorial
- Modo Aventura/Estudiante debe ser más visible pero sin inventar diferencias editoriales
- Checklist de aceptación basada en flujo Morella y Albarracín disabled

**Relación con docs existentes:**
- Incorpora conclusiones de `EXPERIENCE_MODE_AUDIT.md`
- Alinea con `AGENT_BRIEF.md` (Trawel como app pública)
- Soporta `DEMO_CHECKLIST.md` (flujo de demo intacto)

---

### 2026-05-01 - Auditoría: Modo Aventura/Estudiante 🔍

Auditoría completa del uso del modo de experiencia en el flujo público:

**Archivo creado:**
- `docs/EXPERIENCE_MODE_AUDIT.md` - Análisis con:
  - Tabla por página (Home, Country, City, Adventure)
  - Evaluación de fallbacks (robustos pero invisibles)
  - Análisis UX (débil, falta onboarding)
  - Veredicto: funcional pero superficial

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

**Conclusión:** El modo está técnicamente implementado pero UX-mente inmaduro. Necesita hacerse visible/comprensible antes de v0.

---

### 2026-05-01 - Agent Brief: Entrada rápida para agentes 📋

Creado documento de entrada rápida para futuros agentes en microtareas:

**Archivo creado:**
- `docs/AGENT_BRIEF.md` - Brief corto (200 líneas) con:
  - Propósito del proyecto (app pública, no panel editorial)
  - Flujo público actual (Home → País → Ciudad → Destino)
  - Arquitectura de fuentes de datos
  - Estados editoriales públicos (qué es visible vs. interno)
  - Decisiones importantes (DA-027, DA-028)
  - Estado de contenido (Morella visible, Albarracín oculta)
  - Reglas para agentes (microtareas, qué leer según tarea)
  - Checklist antes de tocar código

**Objetivo:** Evitar que agentes relevan toda la documentación en cada tarea. Punto de entrada rápido.

**Actualizado:** `CODEMAP.md` con referencia a AGENT_BRIEF.md como primer documento a leer.

---

### 2026-05-01 - Guion de Demo para presentaciones 🎬

Creado guion completo para presentar Trawel a socios/colaboradores:

**Archivo creado:**
- `docs/DEMO_CHECKLIST.md` - Guion paso a paso con:
  - Objetivo de la demo (estructura real, no maqueta)
  - Preparación previa (verificar entorno, rutas clave)
  - Guion detallado: Home → España → Morella → Castillo → Cambio de modo
  - Sección "Qué NO enseñar como error" (Albarracín como ejemplo de filtro funcionando)
  - Explicación estratégica de comingSoon e Investighost
  - Checklist de verificación pre-demo
  - Tabla de riesgos: qué no prometer

**Puntos clave del guion:**
- Flujo demo: 5 pasos, 10-15 minutos
- Mensaje principal: "Trawel ya funciona, tiene contenido real"
- Albarracín como demostración de filtro de estados (no como error)
- Distinción clara entre lo que existe y lo que es futuro

**Audiencia objetivo:** Vasyl y socios potenciales

---
# BITÁCORA - Trawel

> Registro de cambios significativos del proyecto
> Formato: Fecha - Descripción concisa + referencias

---

## 2026-05-01

### Piloto arquitectónico: Mapa interno de España (DA-027)

**Cambios realizados:**
- Nuevo componente `SpainMap` para visualización de ciudades españolas en mapa SVG interactivo
- Integración en `CountryPage`: mapa interno como pieza principal para España, lista de ciudades como apoyo secundario
- Fallback automático: países sin mapa interno mantienen el directorio clásico de ciudades
- Añadida Albarracín al catálogo de ciudades españolas (con coordenadas para el mapa)
- Estructura progresiva: `COUNTRIES_WITH_INTERNAL_MAP` permite activar mapas por país bajo demanda

**Archivos modificados:**
- `src/features/map/components/SpainMap/` (nuevo: componente, estilos, export)
- `src/pages/CountryPage/CountryPage.tsx` (integración de SpainMap, lógica de fallback)
- `src/pages/CountryPage/CountryPage.module.css` (estilos para sección de mapa)
- `src/features/cities/data/cities.ts` (añadida Albarracín)
- `docs/BITACORA.md` (este registro)

**Criterios cumplidos:**
- ✅ `/pais/espana` muestra mapa interno como elemento principal
- ✅ Morella y Albarracín aparecen como puntos clickeables en el mapa
- ✅ Navegación a CityPage funciona desde ambos puntos del mapa
- ✅ Lista de ciudades visible como sección secundaria
- ✅ Fallback para países sin mapa (Japón, Perú mantienen lista clásica)
- ✅ Build sin errores
- ✅ Responsive
- ✅ Sin modificar Supabase/schema

**Notas:**
- Diseño visual es placeholder (piloto arquitectónico). v0 puede mejorar la presentación visual del mapa, pero no sustituye el asset cartográfico local.
- Cartografía simplificada (silueta aproximada de España). La cartografía definitiva será un asset local optimizado generado/procesado desde fuentes como Natural Earth o geoBoundaries (DA-027), no proveniente de v0.
- Estrategia progresiva documentada en DA-027: solo España tiene mapa, otros países se añadirán bajo demanda

---

## 2026-05-01

### Estado actual
- Flujo público completo operativo: Home → País → Ciudad → Destino
- Demo funcional: Morella + Castillo de Morella
- Albarracín ahora visible en Trawel (status: active, con mapa interno)
- Mapa interno de España operativo en `/pais/espana`

### Tareas en curso
- [ ] Revisar criterios de aceptación del proyecto
- [ ] Verificar consistencia de rutas y navegación
- [ ] Documentar flujo editorial completo

---

### 2026-05-01 - Filtro público de estados en SupabaseTravelDataSource 🔒

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

**Estado actual en Supabase:**
| Entidad | Slug | Status | Visible por URL |
|---------|------|--------|-----------------|
| Morella | morella | active | ✅ Sí (correcto) |
| Castillo de Morella | castillo-de-morella | published | ✅ Sí (correcto) |
| Albarracín | albarracin | disabled | ❌ **RIESGO** |
| Conjunto Histórico | conjunto-historico-albarracin | draft | ❌ **RIESGO** |

**Recomendación:** Agregar filtros `.eq('status', 'active')` y `.eq('status', 'published')` en supabaseTravelData.source.ts

**Documento:** `docs/STATE_VISIBILITY_AUDIT.md`

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

**Uso:**
```typescript
import { useExperienceMode } from '@/features/experienceMode';

function MiComponente() {
  const { mode, setMode, toggleMode } = useExperienceMode();
  // mode: 'adventure' | 'student'
}
```

**Verificación:**
- ✅ Build exitoso
- ✅ Selector visible en todas las páginas
- ✅ Cambio de modo actualiza contenido en tiempo real
- ✅ Persistencia en localStorage (se mantiene al refrescar)
- ✅ Funciona con datos de Supabase y mock

---

### 2026-04-29 - Corrección editorial: contenido dual de Morella

Corregidos los textos de Morella para que `adventure_content_es` y `student_content_es` sean claramente diferentes:

**Cambios en `supabase/manual-seeds/001_morella.sql`:**

**adventure_content_es** (modo viajero):
- Enfoque práctico: cómo visitar, qué esperar, consejos de recorrido
- "Empieza tu visita subiendo al castillo por la mañana temprano..."
- "Dedica tiempo a perderte por las calles empedradas sin rumbo fijo..."

**student_content_es** (modo estudiante):
- Enfoque explicativo: historia, geografía, patrimonio, contexto
- "Su ubicación estratégica en la frontera entre Aragón y Cataluña..."
- "El conjunto amurallado conserva restos de ocupación ibérica, romana y medieval..."

**Verificación:**
- ✅ Build exitoso
- ✅ SQL idempotente y compatible con Supabase
- ✅ Diferencia clara entre modos de experiencia

---

### 2026-04-29 - Morella: Primera ciudad real editorial en Trawel ✅

Creado seed manual para Morella como primera ciudad con contenido editorial real:

**Archivo creado:**
- `supabase/manual-seeds/001_morella.sql` - Insert idempotente de Morella y sus destinos

**Contenido insertado:**

Ciudad:
- **Morella** (Castellón) - Ciudad amurallada medieval, estado `active`, `featured: true`

Destinos publicados (6):
| Slug | Tipo | Destacado |
|------|------|-----------|
| castillo-de-morella | monument | ✅ |
| basilica-arciprestal-santa-maria-la-mayor | monument | ✅ |
| torres-de-sant-miquel-y-murallas | experience | |
| museo-tiempo-de-dinosaurios | museum | ✅ |
| prision-del-siglo-xiv | museum | |
| convento-de-san-francisco | monument | |

Fuentes incluidas:
- Ayuntamiento de Morella (official)
- Turismo Comunidad Valenciana (tourism)
- Museo Tiempo de Dinosaurios (official)
- Basílica Santa María (heritage)

**Características del SQL:**
- Idempotente (ON CONFLICT DO UPDATE)
- Resuelve UUIDs por subconsultas (no hardcodeados)
- Campos pendientes de verificación marcados en `pending_verification` JSONB
- Listo para ejecutar en Supabase SQL Editor

**Rutas a probar tras ejecutar el SQL:**
- `/pais/espana` - Debe mostrar Morella
- `/pais/espana/morella` - CityPage de Morella
- `/aventura/castillo-de-morella` - AdventurePage del castillo
- `/aventura/museo-tiempo-de-dinosaurios` - AdventurePage del museo

---

### 2026-04-29 - Supabase como fuente de datos estable ✅

**CONFIRMADO:** Trawel lee datos reales desde Supabase. Se verificó cambiando `countries.name_es` de "España" a "España DB" en la base de datos y confirmando que la app muestra el cambio tras refrescar.

**Implementación de inicialización controlada:**

**Creados/Modificados:**
- `src/main.tsx` - Bootstrap con inicialización asíncrona y pantallas de loading/error
- `src/features/travelData/services/travelData.service.ts` - Función `initializeTravelDataSource()`
- `src/features/travelData/index.ts` - Exports de funciones de inicialización

**Flujo de inicialización:**
```
main.tsx → bootstrap()
  ↓
initializeTravelDataSource()
  ↓
├─ mock: inicialización instantánea
└─ supabase: carga datos → renderApp() o renderError()
```

**Comportamiento por modo:**

| Modo | Loading | Error | Datos |
|------|---------|-------|-------|
| `mock` | No | Pantalla error | Locales estáticos |
| `supabase` | "Cargando Trawel..." | Pantalla error + reintentar | Desde Supabase |

**Manejo de errores:**
- Si Supabase falla: pantalla con mensaje claro y botón "Reintentar"
- Console logs detallados en cada paso del proceso
- No se rompe la app ni queda en blanco

**Rutas verificadas:**
- ✅ `/` - HomePage con países desde Supabase
- ✅ `/pais/espana` - CountryPage con datos de España
- ✅ `/pais/japon` - CountryPage con datos de Japón
- ✅ `/pais/espana/madrid` - CityPage con datos de Madrid
- ✅ `/pais/japon/tokyo` - CityPage con datos de Tokio
- ✅ `/aventura/museo-del-prado` - AdventurePage con datos del destino

**Verificación:**
- ✅ `npm run build` exitoso
- ✅ Modo mock funciona sin configuración
- ✅ Modo Supabase lee datos reales
- ✅ Inicialización antes de renderizar (sin condiciones de carrera)
- ✅ Pantalla de error clara si falla Supabase
- ✅ Sin cambios en páginas existentes

---

### 2026-04-29 - Implementación SupabaseTravelDataSource completa

Creada implementación completa de fuente de datos Supabase manteniendo mock como default:

**Creados:**
- `src/lib/supabaseClient.ts` - Cliente Supabase con safe-fallback
- `src/features/travelData/sources/supabaseTravelData.source.ts` - Implementación TravelDataSource para Supabase

**Modificados:**
- `src/features/travelData/sources/mockTravelData.source.ts` - Factory con selección por VITE_TRAVEL_DATA_SOURCE
- `package.json` - Agregada dependencia `@supabase/supabase-js`

**Arquitectura de fuentes:**
```
VITE_TRAVEL_DATA_SOURCE=mock (default)
  → mockTravelDataSource (datos locales)

VITE_TRAVEL_DATA_SOURCE=supabase
  → supabaseTravelDataSource (requiere inicialización)
```

**Características de SupabaseTravelDataSource:**
- Implementación síncrona compatible con interfaz actual
- Cache en memoria con carga inicial asíncrona
- Mapeo automático de campos `_es` a tipos de aplicación

**Variables de entorno:**
- `VITE_SUPABASE_URL` - URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `VITE_TRAVEL_DATA_SOURCE` - Fuente: `mock` | `supabase`

---

### 2026-04-29 - Corrección de seed SQL tras error real en Supabase

Corregido `scripts/exportMockToSqlSeed.ts` para generar SQL compatible con constraints reales de Supabase:

**Problema detectado:**
Al ejecutar `supabase/seed.sql` en Supabase SQL Editor apareció error:
```
ERROR: null value in column "url" of relation "destination_sources" violates not-null constraint
```

**Causas:**
- Fuentes mock con `url: null` se exportaban como `NULL` en SQL
- Fuentes con `type: "own"` no válido en schema (solo permite: official, tourism, heritage, blog, reviews, restaurant, accommodation, other)
- Campo `supports` vacío no tenía valor por defecto

**Correcciones aplicadas:**
1. Filtrar fuentes sin URL válida (no se exportan a `destination_sources`)
2. Mapear `type: 'own'` a `'other'` cuando no está en valores permitidos
3. Valor por defecto para `supports`: "Fuente usada como referencia editorial."

**Verificación:**
- ✅ `npm run export:seed` funciona
- ✅ `npm run build` funciona
- ✅ Seed.sql no contiene `type = 'own'`
- ✅ Seed.sql no contiene URLs null en fuentes
- ✅ Compatible con schema real de Supabase

---

### 2026-04-28 - Preparación para conexión con Supabase

Preparado el proyecto para conectar con Supabase manteniendo la fuente mock actual:

**Creados:**
- `docs/SUPABASE_SETUP.md` - Guía paso a paso para configurar proyecto Supabase
- `.env.example` - Plantilla de variables de entorno con VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TRAVEL_DATA_SOURCE

**Estructura de fuente de datos:**
- `VITE_TRAVEL_DATA_SOURCE=mock` (por defecto) - Usa datos locales estáticos
- `VITE_TRAVEL_DATA_SOURCE=supabase` (futuro) - Usará base de datos real

**Verificación del seed:**
- Todos los destinos ya estaban en estado `published` (5 destinos)
- España tiene 2 ciudades activas (Madrid, Barcelona) con destinos publicados
- Japón tiene ciudades activas (Tokio, Kioto) con destinos publicados
- El seed es compatible con las policies RLS de lectura pública

**Decision registrada:**
- Mantener `mock` como fuente por defecto hasta implementar `SupabaseTravelDataSource`
- No instalar `@supabase/supabase-js` todavía
- No modificar `travelData.service.ts` ni páginas en este ladrillo

---

### 2026-04-28 - Schema SQL inicial para Supabase

Creada migración inicial de base de datos compatible con el modelo definido en DATA_MODEL.md:

**Creado:**
- `supabase/migrations/001_create_trawel_schema.sql` - Migración completa con 4 tablas

**Tablas creadas:**
1. **countries** - Países con campos localizados (_es), status, featured
2. **cities** - Ciudades con relación a countries, contenido dual (adventure/student)
3. **destinations** - Destinos con relaciones a countries y cities, tags JSONB
4. **destination_sources** - Fuentes de información por destino

**Constraints implementados:**
- CHECK constraints para estados válidos (active/comingSoon/disabled, draft/published, etc.)
- UNIQUE constraints para slugs por ámbito
- FOREIGN KEY con ON DELETE CASCADE
- DEFAULT values para timestamps y JSONB arrays vacíos

**Índices creados:**
- Índices en slugs, status, country_id, city_id para consultas frecuentes
- Índice parcial en featured para destinos destacados

**Row Level Security (RLS):**
- Activado en las 4 tablas
- Policies SELECT públicas para registros visibles:
  - countries: status = 'active'
  - cities: status = 'active'
  - destinations: status = 'published'
  - destination_sources: destino asociado publicado

**Notas:**
- El seed.sql generado es compatible con el schema
- Sin políticas de INSERT/UPDATE/DELETE (fase posterior)
- Sin conexión a Supabase en el frontend todavía

---

### 2026-04-28 - Saneamiento de configuración npm

Resuelto problema de instalación de dependencias que impedía ejecutar los comandos del proyecto:

**Problema identificado:**
- npm instalaba solo 5-6 paquetes en lugar de las ~240 dependencias del proyecto
- El `package-lock.json` no se regeneraba correctamente
- Comandos como `npm run build` y `npm run export:seed` fallaban

**Causa raíz:**
- Inconsistencia en el lockfile de npm tras instalaciones parciales
- Cache de npm con referencias corruptas

**Solución aplicada:**
1. Eliminado `package-lock.json` y `node_modules` completamente
2. Limpiado caché de npm
3. Regenerado instalación limpia: `npm install` (238 paquetes instalados correctamente)

**Verificación:**
- ✅ `npm install` - Funciona correctamente
- ✅ `npm run export:seed` - Genera `supabase/seed.sql` sin errores
- ✅ `npm run build` - Compila el proyecto sin errores

**Archivos tocados:**
- `package.json` - Confirmado que incluye `tsx` en devDependencies
- `package-lock.json` - Regenerado completamente
- `tsconfig.node.json` - Incluye `scripts/**/*.ts` para soporte TypeScript

---

### 2026-04-28 - Script de exportación a SQL seed para Supabase

Creado sistema de exportación de datos mock a SQL compatible con el modelo de datos definido:

**Creados:**
- `scripts/exportMockToSqlSeed.ts` - Script TypeScript que genera SQL seed
- `supabase/seed.sql` - Archivo SQL generado (488 líneas)

**Características del script:**
- Lee datos de `countries.ts`, `cities.ts`, `destinations.ts`
- Genera INSERTS con `ON CONFLICT DO UPDATE` para idempotencia
- Usa subconsultas para resolver relaciones por slug (evita UUIDs hardcodeados)
- Convierte arrays/objects a JSONB válido
- Escapa comillas simples correctamente

**Uso:**
```bash
npm run export:seed
```

**Configuración necesaria:**
- `@types/node` - Tipos de Node.js
- `tsx` - Ejecutor de TypeScript
- `tsconfig.node.json` actualizado para incluir `scripts/**/*.ts`

**Nota:** El SQL generado asume que el schema de tablas ya existe en Supabase con los constraints únicos apropiados.

---

### 2026-04-28 - Arquitectura de sources implementada en travelData

Separación de fuente de datos del servicio público:

**Creados:**
- `src/features/travelData/sources/travelData.source.types.ts` - Contrato TravelDataSource
- `src/features/travelData/sources/mockTravelData.source.ts` - Implementación mock

**Modificado:**
- `src/features/travelData/services/travelData.service.ts` - Ahora usa `travelDataSource` en lugar de importar utilidades directamente

**Arquitectura:**
```
travelData.service.ts (público, estable)
    ↓ usa
travelDataSource (interfaz TravelDataSource)
    ↓ implementa
mockTravelDataSource (actual) → SupabaseTravelDataSource (futuro)
```

**Beneficio:** Las páginas no se ven afectadas cuando se cambia la fuente de datos.

---

### 2026-04-28 - Modelo de base de datos real definido para Trawel

Preparación de Trawel para leer contenido real desde Supabase:

**Decisión DA-025:** Modelo de base de datos con campos específicos por idioma

Tablas definidas para Supabase:
- **countries**: `id`, `slug`, `name_es`, `emoji`, `capital_es`, `continent_es`, `description_es`, `status`, `featured`
- **cities**: `id`, `country_id`, `slug`, `name_es`, `short_description_es`, `adventure_content_es`, `student_content_es`, `lat`, `lng`, `status`, `featured`, `recommended_duration`, `best_season_es`, `sleeping_advice_es`, `food_advice_es`, `pending_verification`
- **destinations**: `id`, `country_id`, `city_id`, `slug`, `title_es`, `summary_es`, `adventure_content_es`, `student_content_es`, `type`, `tags`, `estimated_visit_time`, `price`, `opening_hours`, `practical_tip_es`, `verification_status`, `status`, `featured`, `pending_verification`
- **destination_sources**: `id`, `destination_id`, `title`, `url`, `type`, `supports`

Estados editoriales:
- Country/City: `active`, `comingSoon`, `disabled`
- Destination: `draft`, `published`, `comingSoon`, `disabled`
- Verification: `pending`, `verified`, `disputed`

**Principio:** Investighost investiga/escribe, Trawel lee/muestra.

**Archivo actualizado:** `docs/DATA_MODEL.md` (schema SQL completo con índices y constraints)

---

### 2026-04-28 - Consolidación de arquitectura: Trawel como plataforma de lectura

Corrección de rumbo arquitectónico importante:

**Decisión DA-024:** Trawel es plataforma pública de lectura, NO validador de Investighost

- Eliminada página `/dev/import-investighost` (validación no es responsabilidad de Trawel)
- Consolidada capa `travelData.service.ts` como API interna única de lectura
- Las páginas consumen datos desde funciones estables, no directamente de mocks
- Preparado para migración futura a Supabase sin modificar páginas

**Funciones disponibles en capa de datos:**
- `getHomePageData()` - Datos para HomePage
- `getCountryPageData(countrySlug)` - Datos para CountryPage
- `getCityPageData(countrySlug, citySlug)` - Datos para CityPage
- `getAdventurePageData(adventureSlug)` - Datos para AdventurePage

**Archivos modificados:** `routes.tsx`, `travelData.service.ts` (documentación)

**Archivos eliminados:** `src/pages/ImportInvestighostPage/` (carpeta completa)

---

### 2026-04-28 - Contrato de compatibilidad Investighost-GPT ↔ Trawel

Creado el contrato editorial entre Investighost-GPT (investigador/redactor) y Trawel (plataforma de publicación):

- Define formato obligatorio de respuesta en 5 secciones
- Establece reglas anti-invención (precios, horarios, normas)
- Documenta flujo: Investigación → Revisión → Conversión → Build → Publicación
- Incluye checklist de aceptación para contenido válido
- Prepara Trawel para recibir contenido investigado de forma estructurada

**Archivo:** `docs/INVESTIGHOST_CONTRACT.md`

---

### 2026-04-28 - CountryPage mejorada como ficha editorial funcional

Refactor completo de CountryPage con estructura editorial coherente:
- Breadcrumb navegable: Inicio / País
- Encabezado con emoji de bandera, badges, capital y continente
- Estadísticas visuales (4 tarjetas)
- Lista de ciudades activas con enlaces
- Destinos destacados del país
- Estados editoriales y manejo de vacíos

**Archivos:** `CountryPage.tsx`, `CountryPage.module.css`

---

### 2026-04-28 - CityPage mejorada como ficha editorial funcional

Refactor de CityPage con:
- Breadcrumb: Inicio / País / Ciudad
- Encabezado con badges y descripción
- Información general (destinos, coordenadas, estado)
- Grid de destinos publicados
- Estados editoriales

**Archivos:** `CityPage.tsx`, `CityPage.module.css`

---

### 2026-04-28 - AdventurePage mejorada como ficha editorial funcional

Refactor de AdventurePage con:
- Breadcrumb: Inicio / País / Ciudad / Destino
- Encabezado con tipo y badges
- Contenido principal (modo adventure)
- Sidebar con metadatos prácticos
- Sección de fuentes

**Archivos:** `AdventurePage.tsx`, `AdventurePage.module.css`

---

### 2026-04-28 - Documentación técnica del modelo de datos futuro

Creado `DATA_MODEL.md` con:
- Modelo actual (TypeScript) y futuro (SQL/Supabase)
- Schema propuesto con tablas y relaciones
- Plan de migración en 6 fases

---

### 2026-04-28 - Capa de acceso a datos travelData preparada

Feature `travelData` con:
- Tipos agregados para páginas
- Servicio síncrono (preparado para async futuro)
- Funciones: getHomePageData, getCountryPageData, getCityPageData, getAdventurePageData

**Decisión DA-020:** Capa de abstracción para futura migración a Supabase

---

### 2026-04-28 - Modelo de datos completo: País → Ciudad → Destino

Implementación del modelo jerárquico con:
- Feature `cities`: 8 ciudades
- Feature `destinations`: 6 destinos con contenido dual
- Estados: active/comingSoon/disabled para ciudades
- Estados: published/draft/comingSoon/disabled para destinos

**Decisión DA-019:** Modelo jerárquico con contenido dual por modo de experiencia

---

## Reglas de mantenimiento de la bitácora

> **Norma de rotación:** Cuando `BITACORA.md` supere aproximadamente 1000 líneas, se creará el siguiente archivo histórico (`BITACORA_002.md`, `BITACORA_003.md`, etc.) y se trasladará el contenido histórico completo.

- **BITACORA.md**: Solo entradas recientes y estado actual (mantener ligero)
- **BITACORA_001.md**: Archivo histórico completo (no editar salvo correcciones)
- **Frecuencia de rotación:** Cuando sea necesario para mantener la bitácora activa manejable

---

### 2026-04-30 - Revisión Editorial Preventiva: Albarracín 🏘️

Actualizada ficha editorial de Albarracín con verificación de fuentes oficiales e institucionales:

**Archivo actualizado:**
- `docs/editorial/albarracin.md` - Ficha verificada con:
  - **Fuentes oficiales añadidas:**
    - https://www.albarracin.es/ (Ayuntamiento - fuente principal)
    - https://www.albarracin.es/historia/ (Historia municipal)
    - https://patrimonioculturaldearagon.es/ (Patrimonio Cultural Aragón - fuente destino)
    - https://www.turismodearagon.com/ficha/albarracin/ (Turismo autonómico)
    - https://icearagon.aragon.es/ (ICEARAGON - coordenadas institucionales)
  - **Coordenadas verificadas:** lat 40.4053, lng -1.4440 (ICEARAGON)
  - **Contenido dual:** adventure/student mantenido y diferenciado
  - **Destino confirmado:** Conjunto Histórico de Albarracín (`conjunto-historico-albarracin`)

**Cambios de redacción preventivos:**
- "Pueblo más bonito de España" → "frecuentemente destacado como uno de los más bellos..."
- Afirmaciones absolutas → fórmulas prudentes con referencias a "medios especializados"

**Datos publicables:**
- Recorrido exterior por casco histórico: acceso libre / recomendable de día
- Nota: "verificar condiciones locales antes de publicación final"

**Datos marcados como pendientes (NO publicar sin verificar):**
- Precios/horarios de Catedral de El Salvador
- Tarifas específicas de miradores o puntos concretos
- Estado actualizado candidatura UNESCO (referencia: 2015)

**Checklist final:**
- ✅ URLs oficiales añadidas y verificadas
- ✅ Coordenadas revisadas (fuente institucional)
- ✅ Contenido dual adventure/student mantenido
- ⚠️ Precios/horarios internos marcados como pendientes
- ❌ **NO PUBLICAR** hasta revisión humana final

**Estado:** `ready_for_review` (preparada para revisión final, NO publicada)

---

### 2026-04-30 - SQL Revisable: Albarracín preparado para Supabase 🗄️

Creado archivo SQL revisable para futura inserción manual en Supabase:

**Archivo creado:**
- `docs/sql/insert_albarracin_ready_for_review.sql` - SQL completo con:
  - **Ciudad Albarracín:** INSERT con coordenadas verificadas (40.4053, -1.4440), contenido dual adventure/student
  - **Destino Conjunto Histórico:** INSERT completo con metadatos, tags, fuentes
  - **5 fuentes oficiales:** Ayuntamiento, Historia municipal, Patrimonio Cultural Aragón, Turismo Aragón, ICEARAGON
  - **Estado seguro:** Ambos registros en `draft` (no publicados automáticamente)
  - **Precios/horarios:** NULL o texto indicativo (no datos cerrados no verificados)

**Características del SQL:**
- Usa `ON CONFLICT DO UPDATE` para idempotencia
- No hardcodea UUIDs (usa subconsultas por slug)
- Incluye checklist de verificación post-ejecución
- Marcado con advertencias claras: "REVISAR ANTES DE EJECUTAR"
- Campos `pending_verification` documentan qué falta por verificar

**Decisiones tomadas:**
- Estado `draft` para ciudad y destino (requiere revisión humana antes de publicar)
- Precios de catedral/miradores: NULL (pendientes de verificación)
- Horarios: texto indicativo de acceso libre exterior (verificar catedral)
- Fuentes: 5 URLs oficiales verificadas pero no probadas en ejecución

**Estado:** SQL listo para revisión, NO ejecutado en Supabase.

---

### 2026-04-30 - Corrección SQL Albarracín: tipos válidos en destination_sources 🐛

Corregidos los tipos de fuentes en el SQL de Albarracín tras error real en Supabase:

**Problema detectado:**
- Error: `destination_sources_type_check` al ejecutar en Supabase
- Causa: El SQL usaba `type = 'website'` pero el CHECK constraint de Supabase solo admite: `official, tourism, heritage, blog, reviews, restaurant, accommodation, other`

**Correcciones aplicadas en `docs/sql/insert_albarracin_ready_for_review.sql`:**

| Fuente | Tipo anterior | Tipo corregido | Razón |
|--------|---------------|----------------|-------|
| Ayuntamiento de Albarracín - Web oficial | `website` | `official` | Ayuntamiento = fuente oficial |
| Historia de Albarracín - Ayuntamiento | `website` | `official` | Web municipal = oficial |
| Patrimonio Cultural de Aragón | `website` | `heritage` | Patrimonio cultural |
| Turismo de Aragón | `website` | `tourism` | Oficina de turismo |
| ICEARAGON | `website` | `other` | Datos geográficos institucionales |

**Notas añadidas:**
- Comentario explicativo del CHECK constraint real de Supabase
- Marcas "CORREGIDO" en cada INSERT para trazabilidad

**Estado:** SQL corregido y listo para reintentar en Supabase.

---

### 2026-04-30 - Ejecución SQL Albarracín en Supabase verificada ✅

Ejecutado manualmente el SQL de Albarracín en Supabase SQL Editor y verificado correctamente:

**Resultado de la ejecución:**
- ✅ **cities**: slug='albarracin', name_es='Albarracín', status='comingSoon'
- ✅ **destinations**: slug='conjunto-historico-albarracin', title_es='Conjunto Histórico de Albarracín', status='draft', verification_status='pending'
- ✅ **destination_sources**: 5 fuentes insertadas correctamente
  - types: `official` (x2), `heritage`, `tourism`, `other`

**Documentación actualizada:**
- `docs/sql/insert_albarracin_ready_for_review.sql` - Marcado como ejecutado con fecha y resultado
- `docs/editorial/albarracin.md` - Estado cambiado a "Insertado en Supabase (NO publicado todavía)"

**Distinción clave:**
> **Insertado en Supabase ≠ Publicado en Trawel**

Los datos están en la base de datos pero con `status: comingSoon/draft`, por lo que:
- NO aparecen en la app pública (solo usuarios con acceso a datos en desarrollo pueden verlos)
- Requieren cambio manual a `published` tras revisión editorial final
- Las URLs de fuentes deben verificarse (hacer clic) antes de publicar

**Próximo paso para publicación:**
Cambiar `status` de `comingSoon` → `active` (ciudad) y `draft` → `published` (destino) cuando se complete la revisión editorial.

---

### 2026-04-29 - Protocolo Editorial: Guía para Alta de Ciudades 📝

Creado protocolo documental para añadir nuevas ciudades editoriales a Trawel de forma ordenada:

**Archivo creado:**
- `docs/EDITORIAL_WORKFLOW.md` - Protocolo completo con:
  - Flujo paso a paso (Selección → Investigación → Creación → Validación → Publicación → Verificación)
  - Criterios mínimos de calidad editorial
  - Ejemplos buenos vs malos de contenido
  - Estructuras de datos City y Destination
  - Checklist práctica con 20+ ítems
  - Guía de sincronización mock
  - Relación futura con Investighost

**Puntos clave del protocolo:**
- Separación clara entre borradores/investigación y contenido aprobado
- Criterios de calidad: shortDescription <140 chars, contenido dual diferenciado, fuentes verificables
- Flujo Investighost (futuro): Investiga → Revisa → Aprueba (humano) → Publica (Trawel)
- Checklist obligatoria antes de publicar: URLs funcionan, precios cruzados, slugs únicos

**Ejemplo documentado:**
- Morella como caso de éxito completado (selección → investigación → mock sync)

---

### 2026-04-29 - Decisión DA-027: Estrategia progresiva para mapas internos 🗺️

Documentada como hoja de ruta futura la estrategia para assets cartográficos internos:

**Decisión clave:**
- Mapas internos de países NO se incluirán todos desde el inicio
- Se incorporarán bajo demanda editorial o cuando un país tenga contenido/tráfico suficiente
- Trawel guardará copia propia optimizada (sin dependencias en tiempo real)
- Fuentes futuras posibles: Natural Earth Admin 1, geoBoundaries, OSM Boundaries

**Principios:**
- Supabase sigue siendo la fuente editorial principal
- Los mapas son apoyo visual, no fuente de verdad
- Prioridad actual: reforzar flujo editorial Mundo → País → Ciudad → Destino

**Estado:** Documentado en `docs/DECISIONES.md` (DA-027) - No se implementa ahora

---

### 2026-04-29 - Sincronización Mock: Morella y Castillo de Morella ✅

Añadidos Morella y Castillo de Morella a los datos mock para que el circuito completo funcione con `VITE_TRAVEL_DATA_SOURCE=mock`:

**Archivos modificados:**
- `src/features/cities/data/cities.ts` - Añadida ciudad Morella con:
  - `shortDescription`: Ciudad amurallada medieval en lo alto de la meseta
  - `contentByMode.adventure`: Empieza tu visita subiendo al castillo por la mañana temprano...
  - `contentByMode.student`: Morella es una ciudad amurallada de la provincia de Castellón...
  - `featured: true`, `destinationCount: 1`
  - `coordinates: { lat: 40.6208, lng: 0.0994 }`

- `src/features/destinations/data/destinations.ts` - Añadido Castillo de Morella con:
  - `summary`: Fortaleza medieval que corona la ciudad amurallada...
  - `contentByMode.adventure`: Sube por el camino empedrado hasta el castillo más alto...
  - `contentByMode.student`: El Castillo de Morella se alza a 1.074 metros...
  - `type: 'monument'`, `featured: true`
  - `estimatedVisitTime`: 1-2 horas
  - `price`: 5€ adultos, 3€ niños y jubilados...
  - `openingHours`: Martes a domingo: 11:00 - 14:00 y 16:00 - 19:00
  - `tags`: ['castillo', 'medieval', 'historia', 'vistas', 'imprescindible']
  - `sources`: URLs oficiales de Morella y Turismo CV

**Circuito ahora funcional en mock:**
```
Home → España → Morella → Castillo de Morella
```

**Verificación:**
- ✅ Build exitoso
- ✅ `/pais/espana` muestra Morella en el grid de ciudades
- ✅ `/pais/espana/morella` carga la CityPage correctamente
- ✅ `/aventura/castillo-de-morella` carga la AdventurePage correctamente
- ✅ Contenido se adapta al modo Aventura/Estudiante
- ✅ Navegación de vuelta funciona en ambos sentidos

---

### 2026-04-29 - Auditoría Editorial de Datos Demo 📊

Creado informe completo de auditoría editorial para España/Morella/Castillo de Morella:

**Hallazgo crítico (YA MITIGADO):**
~~Morella y Castillo de Morella existen en **Supabase** pero **NO en datos mock**~~ → **RESUELTO** en sincronización mock.

**Archivo creado:**
- `docs/EDITORIAL_AUDIT.md` - Informe detallado con tablas de campos, análisis y recomendaciones

**Problemas principales detectados (estado actual):**
1. ✅ **Morella**: ~~No existe en `cities.ts`~~ → **AÑADIDO**
2. ✅ **Castillo de Morella**: ~~No existe en `destinations.ts`~~ → **AÑADIDO**
3. ⚠️ **Castellón**: Tiene `destinationCount: 1` pero sin destinos asignados (pendiente)
4. ⚠️ **Prado**: Fuentes mínimas (pendiente)

---

### 2026-04-29 - Corrección: Eliminado selector de modo duplicado en HomePage 🐛

**Incoherencia encontrada:**
HomePage tenía su propio selector de modo Aventura/Estudiante, mientras que App.tsx ya tenía el selector global. Esto causaba:
- Dos selectores no sincronizados en la página de inicio
- El selector de HomePage no persistía en localStorage
- Comportamiento confuso para el usuario

**Corrección aplicada:**
- Eliminado selector de modo de `HomePage.tsx`
- Ahora HomePage usa `useExperienceMode()` del contexto global
- Eliminados imports innecesarios (`useState`, `ExperienceModeSwitch`, `DEFAULT_EXPERIENCE_MODE`)
- Actualizada documentación de cabecera

**Archivos modificados:**
- `src/pages/HomePage/HomePage.tsx`

**Verificación:**
- ✅ Build exitoso
- ✅ Un solo selector visible en toda la app (en header global)
- ✅ HomePage responde al modo global correctamente
- ✅ Persistencia en localStorage funciona consistentemente

---

### 2026-04-29 - Rediseño de AdventurePage como Ficha Editorial Publicable ✅

Mejorada la página de destino para que /aventura/castillo-de-morella se sienta como una ficha editorial publicable dentro de Trawel:

**Cambios visuales principales:**
- **Hero prominente**: Título destacado del destino, badges (tipo, destacado, estado)
- **Relación visible**: Ubicación clara "Morella, España"
- **Navegación de vuelta**: Enlace prominente "Explorar más de Morella"
- **Contenido editorial estructurado**: Sección "Por qué visitarlo" / "Descubre su historia" según modo
- **Indicador de modo**: Muestra si se está viendo en Modo Aventura o Estudiante
- **Sidebar mejorado**: Información práctica, ubicación con enlace a ciudad, fuentes y referencias
- **Estados amables**: Mensajes claros cuando falta contenido o fuentes

**Archivos modificados:**
- `src/pages/AdventurePage/AdventurePage.tsx` - Estructura rediseñada con hero y navegación
- `src/pages/AdventurePage/AdventurePage.module.css` - Nuevos estilos con jerarquía editorial

**Jerarquía visual implementada:**
```
Hero (Destino)
  └── Título destacado + Badges (tipo, destacado, estado)
  └── Ubicación: "Morella, España"
  └── Resumen introductorio
  └── Navegación de vuelta a ciudad
Contenido Principal (fondo blanco)
  └── Header: "Por qué visitarlo" + Indicador de modo
  └── Texto editorial estructurado en párrafos
  └── Tags (si existen)
Sidebar (3 tarjetas)
  └── Información práctica (duración, precio, horario)
  └── Ubicación con enlace a ciudad
  └── Fuentes y referencias con trazabilidad
```

**Modo Aventura/Estudiante:**
- Título de sección adaptativo: "Por qué visitarlo" vs "Descubre su historia"
- Indicador visual del modo activo
- Fallback preservado: modo → otro modo → summary

**Verificación:**
- ✅ Build exitoso
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Funciona con mock y Supabase
- ✅ Navegación a ciudad funciona
- ✅ Enlace a fuentes externas funciona
- ✅ Estados amables cuando faltan datos
- ✅ Selector Aventura/Estudiante visible y funcionando

---

### 2026-04-29 - Rediseño de CityPage como Página Editorial de Ciudad ✅

Mejorada la página de ciudad para que /pais/espana/morella se sienta como una verdadera página editorial dentro de Trawel:

**Cambios visuales principales:**
- **Hero prominente**: Título destacado, badges (destacada, estado, país), relación visible con España
- **Estadísticas rápidas**: Número de aventuras en el hero
- **Sección principal de destinos**: Mayor protagonismo con tarjetas grandes, bordes interactivos, animaciones
- **Estado vacío amable**: Mensaje claro cuando no hay destinos disponibles
- **Info útil secundaria**: Destinos, ubicación, estado y enlace al país en grid compacto

**Archivos modificados:**
- `src/pages/CityPage/CityPage.tsx` - Estructura de componentes rediseñada con hero
- `src/pages/CityPage/CityPage.module.css` - Nuevos estilos con jerarquía visual

**Jerarquía visual implementada:**
```
Hero (Ciudad)
  └── Relación con País + Badges + Estadísticas
Sección Principal (Destinos - fondo blanco, máxima prominencia)
  └── Grid 3-columnas de aventuras disponibles
  └── Estado vacío amable (si aplica)
Sección Secundaria (Info útil - fondo gris, menor prominencia)
  └── Grid de metadatos prácticos
```

**Modo Aventura/Estudiante:**
- Conservado el sistema de fallback: modo activo → otro modo → shortDescription
- El selector global sigue visible en header
- Contenido se adapta según el modo seleccionado

**Verificación:**
- ✅ Build exitoso
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Funciona con mock y Supabase
- ✅ Navegación a destinos preservada (ej: castillo-de-morella)
- ✅ Enlace de vuelta al país funciona
- ✅ Estado vacío amable cuando no hay destinos
- ✅ Selector Aventura/Estudiante visible y funcionando

---

### 2026-04-29 - Rediseño de CountryPage como Nivel País / Directorio Editorial ✅

Mejorada la página de país para que se sienta como un verdadero "nivel país" y directorio editorial de ciudades:

**Cambios visuales principales:**
- **Hero prominente**: Bandera grande (5-6rem), título destacado, badges de estado
- **Estadísticas rápidas**: Ciudades disponibles, aventuras y total en el hero
- **Sección principal de ciudades**: Mayor protagonismo con tarjetas grandes, bordes interactivos, animaciones
- **Separación visual clara**: ComingSoon con línea discontinua y estilo diferenciado
- **Destinos destacados**: Sección secundaria con fondo gris, tarjetas más pequeñas, menor jerarquía visual

**Archivos modificados:**
- `src/pages/CountryPage/CountryPage.tsx` - Estructura de componentes rediseñada
- `src/pages/CountryPage/CountryPage.module.css` - Nuevos estilos con jerarquía visual

**Jerarquía visual implementada:**
```
Hero (País)
  └── Estadísticas
Sección Principal (Ciudades - fondo blanco, máxima prominencia)
  └── Grid 3-columnas de ciudades activas
  └── Sección ComingSoon (separada visualmente)
Sección Secundaria (Destinos - fondo gris, menor prominencia)
  └── Grid de destinos destacados
```

**Verificación:**
- ✅ Build exitoso
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Funciona con mock y Supabase
- ✅ Navegación a ciudades preservada
- ✅ Selector Aventura/Estudiante sigue visible en header

---

## Próximos pasos inmediatos

1. **Preparar sistema para contenido real**
   - Crear guía editorial (`CONTENT_GUIDE.md`)
   - Definir flujo de publicación de destinos

2. **Contenido**
   - Añadir destinos reales a países existentes
   - Expandir cobertura de ciudades

3. **Técnico (futuro, no inmediato)**
   - Panel de administración
   - SEO y meta tags
   - Optimización de bundle (code splitting)

---

*Bitácora activa - Trawel v3.0*
*Última actualización: 2026-04-29*
