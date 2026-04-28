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

## Historial reciente (últimas entradas)

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

## Próximos pasos inmediatos

1. **Preparar sistema para contenido real**
   - Crear guía editorial (`CONTENT_GUIDE.md`)
   - Definir flujo de publicación de destinos

2. **Contenido**
   - Añadir destinos reales a países existentes
   - Expandir cobertura de ciudades

3. **Técnico (futuro, no inmediato)**
   - Migración a Supabase (Fase 2 del plan)
   - Panel de administración
   - SEO y meta tags

---

*Bitácora activa - Trawel v2.9*
*Última actualización: 2026-04-28*