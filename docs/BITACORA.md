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
