# Mapa de Código - Trawel

## Propósito de este documento

Este archivo describe la estructura esperada del código fuente. Sirve como guía para desarrolladores y agentes que implementen el proyecto.

**Estado:** En desarrollo - WorldMap v1 implementado con D3 + TopoJSON + world-atlas CDN

**Documentación relacionada:**
- `AGENT_BRIEF.md` - **Start here.** Entrada rápida para agentes en microtareas
- `SPEC.md` - Especificación funcional
- `ARCHITECTURE.md` - Arquitectura del sistema
- `DATA_MODEL.md` - Modelo de datos actual y futuro (ver para entender estructura de entidades)
- `SUPABASE_SETUP.md` - Guía de configuración de Supabase
- `CONTENT_GUIDE.md` - Guía para crear contenido editorial
- `INVESTIGHOST_CONTRACT.md` - Contrato de compatibilidad con Investighost-GPT
- `EDITORIAL_WORKFLOW.md` - Protocolo para alta de ciudades y destinos
- `EDITORIAL_AUDIT.md` - Auditoría de datos editoriales
- `DEMO_CHECKLIST.md` - Guion de demo para presentaciones a socios/colaboradores
- `EXPERIENCE_MODE_AUDIT.md` - Auditoría del modo Aventura/Estudiante
- `V0_HANDOFF.md` - Handoff para rediseño visual con v0
- `MAP_ASSET_PLAN.md` - Plan de assets cartográficos (diagnóstico SpainMap)
- `MAP_SOURCE_COMPARISON.md` - Comparación geoBoundaries vs Natural Earth para España
- `DECISIONES.md` - Registro de decisiones técnicas (incluye DA-029: Mapas exploratorios)
- `BITACORA.md` - Bitácora activa del proyecto (cambios recientes desde 2026-05-02)
- `BITACORA_002.md` - Histórico 2026-04-27 a 2026-05-01
- `BITACORA_001.md` - Archivo histórico de bitácora (período inicial)

---

## Estructura general

```
trawel/
├── .github/
│   └── workflows/
│       └── process-country-map-queue.yml  # CI: procesa cola de mapas cada 30 min con secrets
├── docs/                    # Documentación del proyecto
│   ├── SPEC.md              # Especificación funcional
│   ├── ARCHITECTURE.md      # Arquitectura y stack
│   ├── DATA_MODEL.md        # Modelo de datos actual/futuro
│   ├── DECISIONES.md        # Decisiones técnicas
│   ├── BITACORA.md          # Historial de cambios
│   ├── CODEMAP.md           # Este archivo
│   └── ANALISIS_MAPA_WEBSIM.md
├── scripts/                 # Scripts de utilidad (Node.js/TypeScript)
│   └── exportMockToSqlSeed.ts  # Exporta datos mock a SQL seed
├── supabase/                # Configuración y seed para Supabase
│   └── seed.sql             # Datos iniciales generados
├── public/                  # Assets estáticos servidos tal cual
│   ├── images/
│   │   ├── countries/       # Fotos hero de países
│   │   ├── cities/          # Fotos de ciudades
│   │   ├── adventures/      # Fotos de aventuras
│   │   └── icons/           # Iconos SVG
│   └── data/                # Datos estáticos opcionales
│       └── world-atlas.json # Si queremos hostear localmente
├── src/
│   ├── app/                 # Configuración raíz de la app
│   ├── pages/               # Páginas de la aplicación (rutas)
│   ├── features/            # Módulos por dominio de negocio
│   ├── data/                # Datos de contenido (países, ciudades, etc.)
│   ├── components/          # Componentes compartidos
│   ├── styles/              # Estilos globales y temas
│   ├── types/               # Tipos TypeScript globales
│   └── utils/               # Utilidades
└── package.json
```

---

## `src/app/` - Configuración de la aplicación

```
src/app/
├── App.tsx              # Root component, providers
├── routes.tsx           # Definición de rutas con React Router
├── providers.tsx        # Context providers (ThemeProvider, etc.)
├── main.tsx             # Entry point (render React)
└── i18n/                # Sistema de internacionalización
    ├── i18n.types.ts    # Tipos: Locale, LocalizedText
    ├── i18n.utils.ts    # Utilidades: getLocalizedText, normalizeLocale
    └── index.ts         # Export público
```

**Responsabilidad:** Inicialización y configuración global. No contiene lógica de negocio.

---

## `src/lib/` - Clientes y utilidades externas

```
src/lib/
└── supabaseClient.ts    # Cliente Supabase con safe-fallback
```

**Responsabilidad:** Configuración de clientes para servicios externos (Supabase, APIs, etc.).

### Cliente Supabase (`src/lib/supabaseClient.ts`)

**Propósito:** Proveer instancia reutilizable del cliente Supabase para conectar con base de datos en la nube.

**Variables de entorno requeridas:**
- `VITE_SUPABASE_URL` - URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave anónima pública

**Exports:**
- `supabase` - Instancia del cliente (null si no está configurado)
- `isSupabaseConfigured()` - Verifica si las credenciales están presentes
- `getSupabase()` - Obtiene el cliente o lanza error si no está configurado

**Uso:**
```typescript
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

if (isSupabaseConfigured()) {
  const { data, error } = await supabase.from('countries').select('*');
}
```

**Nota:** El cliente es seguro de usar sin configuración (retorna null), evitando que la app falle si no se usa Supabase.

### Sistema i18n (`src/app/i18n/`)

**Archivos:**
- `i18n.types.ts` - Tipos base del sistema multidioma
- `i18n.utils.ts` - Funciones de localización con fallback
- `index.ts` - Export centralizado

**Idiomas soportados:** es, en, fr, it, uk  
**Idioma por defecto:** es (español)

**Funciones principales:**
- `getLocalizedText(text, locale)` - Obtiene texto con fallback inteligente
- `normalizeLocale(value)` - Normaliza código de idioma
- `isSupportedLocale(value)` - Verifica si un locale es válido

**Estrategia de fallback:**
1. Idioma solicitado
2. Español (DEFAULT_LOCALE)
3. Inglés
4. Primer texto disponible
5. String vacío

---

## `src/pages/` - Páginas

```
src/pages/
├── HomePage/
│   ├── HomePage.tsx
│   ├── HomePage.module.css
│   └── index.ts
├── CountryPage/
│   ├── CountryPage.tsx                 # Ficha de país centrada en mapa interno
│   ├── CountryPage.module.css
│   └── index.ts
├── CountryZonePage/
│   ├── CountryZonePage.tsx             # Placeholder de zona/región desde mapa interno
│   ├── CountryZonePage.module.css
│   └── index.ts
├── CityPage/
│   ├── CityPage.tsx                    # Ficha editorial de ciudad
│   ├── CityPage.module.css
│   └── index.ts
└── AdventurePage/
    ├── AdventurePage.tsx               # Ficha editorial de destino/aventura
    ├── AdventurePage.module.css
    └── index.ts
```

**Responsabilidad:** Cada página es un "screen" que corresponde a una ruta. Orquesta componentes de features.

**Rutas relevantes:**
- `/pais/:countrySlug` - Ficha de país centrada en mapa interno; ya no prioriza tarjetones heredados de ciudades/aventuras.
- `/pais/:countrySlug/zona/:zoneSlug` - Placeholder amable para zona/región seleccionada en `CountryInternalMap`.
- `/pais/:countrySlug/:citySlug` - Ficha de ciudad editorial.

**Convención:** Lazy loading en routes.tsx para code splitting.

---

## `src/features/` - Módulos por dominio

### `src/features/map/` - Sistema de mapas

```
src/features/map/
├── components/
│   ├── WorldMap/
│   │   ├── WorldMap.tsx           # Mapa mundial exploratorio (DA-029)
│   │   ├── WorldMap.module.css    # Estilos específicos
│   │   └── index.ts
│   ├── CountryInternalMap/        # Mapa interno genérico (DA-029/DA-030)
│   │   ├── CountryInternalMap.tsx # Carga TopoJSON local o Storage
│   │   ├── CountryInternalMap.module.css
│   │   └── index.ts
│   ├── SpainMap/                  # Wrapper legado temporal
│   │   ├── SpainMap.tsx           # Delegado a CountryInternalMap
│   │   ├── SpainMap.module.css
│   │   └── index.ts
│   ├── MapTooltip/
│   │   ├── MapTooltip.tsx         # Tooltip reutilizable
│   │   └── MapTooltip.module.css
│   └── MapLoading/                # Estados de generación (DA-030)
│       ├── MapLoading.tsx         # Pantalla "Preparando mapa..."
│       └── index.ts
├── hooks/
│   ├── useWorldMap.ts             # Hook para WorldMap
│   ├── useCountryMap.ts           # Hook para CountryMap con estados DA-030
│   ├── useMapProjection.ts        # Proyección geográfica
│   └── useCountryData.ts          # Datos geoespaciales + Trawel
├── services/
│   └── countryMapAssets.service.ts  # Consulta read-only a country_map_assets (DA-030)
├── config/
│   ├── mapTheme.ts                # Tema visual de mapas
│   ├── countryMapProfiles.ts      # Nivel cartográfico recomendado por país (DA-031)
│   └── mapConstants.ts            # Constantes
├── utils/
│   ├── geoUtils.ts                # Utilidades geográficas
│   ├── countryCodeToFlagEmoji.ts  # Helper de banderas (DA-029)
│   └── colorUtils.ts              # Utilidades de color
└── types/
    └── map.types.ts               # Tipos específicos de mapas
```

**Responsabilidad:** Todo lo relacionado con renderizado de mapas. Desacoplado de datos de contenido.

**Principio:** El mapa no sabe qué es un "país Trawel", solo recibe geometrías y configuración de colores.

**Nota:** WorldMap v1 usa D3 + TopoJSON + world-atlas por CDN. Conecta geometrías UN M.49 con diccionario Trawel.

**✅ CountryInternalMap (v1):**
- Carga TopoJSON desde asset local o Supabase Storage.
- Detecta automáticamente la primera key válida de `topology.objects`.
- Renderiza subdivisiones con D3 + `geoMercator().fitSize()`.
- No pinta puntos, marcadores ni labels fijos.
- Tooltip al hover con el nombre de la zona/área.
- Estilo homogéneo con WorldMap: gris neutro + hover dorado.
- Atribución visible y discreta.

**SpainMap:**
- Wrapper legado temporal sobre `CountryInternalMap`.
- No mantiene círculos, nombres fijos ni leyenda de ciudades.

### `src/features/map/services/countryMapAssets.service.ts` - Servicio de assets cartográficos (DA-030)

**Propósito:** Consulta read-only del estado de mapas internos en Supabase y solicitud de generación mediante Edge Function.

**Características:**
- **Frontend-only**: No requiere service role key
- **Read-only**: Solo SELECT sobre tabla `country_map_assets`
- **Edge Function**: Solicita generación mediante `request-country-map` (sin service role en frontend)
- **Missing limpio**: Devuelve `null` cuando no existe registro; errores reales se reportan a la UI
- **Integración DA-030**: Compatible con arquitectura de generación automática

**Tipos exportados:**
- `CountryMapAssetStatus`: 'missing' | 'queued' | 'generating' | 'ready' | 'failed'
- `CountryMapAsset`: Interface completa con metadatos del asset (id, countrySlug, status, storagePath, etc.)
- `RequestCountryMapGenerationInput`: Input para solicitar generación
- `RequestCountryMapGenerationResponse`: Respuesta de la solicitud

**Funciones:**

| Función | Descripción | Retorno |
|---------|-------------|---------|
| `getCountryMapAsset(countrySlug, adminLevel?)` | Consulta Supabase por country_slug y, opcionalmente, por admin_level esperado | `Promise<CountryMapAsset \| null>` |
| `getCountryMapPublicUrl(asset)` | Obtiene URL pública de Storage con cache-busting por metadatos | `string \| null` |
| `isCountryMapReady(asset)` | Helper para verificar si el asset está listo | `boolean` |
| `requestCountryMapGeneration(input)` | Solicita generación vía Edge Function | `Promise<RequestCountryMapGenerationResponse>` |

**Uso típico - Consulta de estado:**
```typescript
import { 
  getCountryMapAsset, 
  getCountryMapPublicUrl,
  isCountryMapReady 
} from '@/features/map/services/countryMapAssets.service';

// Consultar estado del mapa
const asset = await getCountryMapAsset('francia');

if (isCountryMapReady(asset)) {
  // Obtener URL y cargar el mapa
  const url = getCountryMapPublicUrl(asset);
  const response = await fetch(url!);
  const topojson = await response.json();
  // renderizar mapa...
} else {
  // Mostrar UI de "preparando mapa" o botón de solicitud
}
```

**Uso típico - Solicitar generación:**
```typescript
import { requestCountryMapGeneration } from '@/features/map/services/countryMapAssets.service';

// Solicitar generación de mapa (seguro, sin service role en frontend)
const result = await requestCountryMapGeneration({
  countrySlug: 'mexico',
  countryName: 'México',
  isoAlpha2: 'MX',
  isoAlpha3: 'MEX',
  adminLevel: 'ADM1',
  source: 'world_map'
});

if (result.success) {
  console.log('Estado:', result.status); // 'queued' | 'generating' | 'ready'
  console.log('Mensaje:', result.message);
} else {
  console.error('Error:', result.error);
}
```

**Integración en CountryPage (2026-05-02):**
CountryPage ahora consulta automáticamente el estado del mapa para países que no son España:

```typescript
// En CountryPage.tsx
const [mapState, setMapState] = useState<MapAssetState>({ status: 'loading' });

// Estados UI implementados:
// - loading: Consultando asset en Supabase
// - ready: Asset listo con publicUrl disponible  
// - missing: No existe registro → solicita generación
// - queued/generating: Muestra "Preparando mapa" con animación
// - failed: Muestra error amable + botón "Reintentar"

// Polling cada 8 segundos mientras status sea queued/generating
useEffect(() => {
  if (mapState.status === 'queued' || mapState.status === 'generating') {
    const interval = setInterval(checkMapAsset, 8000);
    return () => clearInterval(interval);
  }
}, [mapState.status]);
```

**Notas:**
- La consulta (`getCountryMapAsset`) NO incluye caching (la capa superior puede implementarlo)
- La solicitud de generación (`requestCountryMapGeneration`) usa la Edge Function `request-country-map`
- El nivel cartográfico interno se decide por país en `src/features/map/config/countryMapProfiles.ts`: España usa ADM2 y México usa ADM1.
- La URL pública de mapas añade `v` usando `generatedAt`, `updatedAt` o `sizeBytes` para evitar servir TopoJSON antiguo desde disk cache tras reprocesar.
- Para uso público desde el mapa mundial, desplegar la función con JWT verification desactivado:
  `npx supabase functions deploy request-country-map --no-verify-jwt`
- Requiere que Supabase esté configurado (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- España (`countrySlug === 'espana'`) usa `CountryInternalMap` con asset local y NO consulta este servicio

### `src/features/countries/` - Lógica de países

```
src/features/countries/
├── components/
│   ├── CountryCard/
│   │   ├── CountryCard.tsx        # Tarjeta de país para listados
│   │   └── CountryCard.module.css
│   ├── CountryList/
│   │   └── CountryList.tsx        # Lista de países
│   └── CountryHero/
│       └── CountryHero.tsx        # Sección hero de página de país
├── data/
│   ├── countries.ts               # Diccionario de países Trawel (con contenido editorial)
│   ├── worldCountries.ts          # Diccionario de 249 países del mundo (identificación geográfica)
│   ├── countries.types.ts         # Tipos Country, Continent, etc.
│   └── countries.utils.ts         # Funciones de acceso: getBySlug, getByIso, etc.
├── hooks/
│   ├── useCountries.ts            # Hook para obtener lista de países
│   ├── useCountry.ts              # Hook para obtener un país por slug
│   └── useCountryStatus.ts        # Hook para saber si un país está activo
├── utils/
│   └── countryHelpers.ts          # Helpers de banderas y formato (DA-029)
└── index.ts                       # Export público
```

**Responsabilidad:** Definición de países, sus metadatos, y componentes relacionados.

**Archivo clave:** `countries.ts` contiene la fuente de verdad de los países Trawel.

### `src/features/cities/` - Lógica de ciudades

```
src/features/cities/
├── data/
│   ├── cities.ts                  # Diccionario de ciudades Trawel
│   ├── cities.utils.ts            # Funciones de acceso: getBySlug, getByCountry, etc.
│   └── cities.types.ts            # Tipos: City, CityStatus, CityContentByMode
└── index.ts                       # Export público
```

**Responsabilidad:** Definición de ciudades, sus metadatos y utilidades de acceso.

**Archivo clave:** `cities.ts` contiene 8 ciudades: Madrid, Barcelona, Castellón, Tokio, Kioto, Lima, Cusco.

**Estados de ciudad (`CityStatus`):**
- `active`: Ciudad con contenido disponible (clicable)
- `comingSoon`: Ciudad próximamente (no clicable, visual diferente)
- `disabled`: Ciudad deshabilitada (no se muestra)

**Funciones principales en `cities.utils.ts`:**
- `getCitiesByCountrySlug(countrySlug)` - Obtiene ciudades de un país
- `getCityBySlug(slug)` - Obtiene ciudad por slug
- `getCityById(id)` - Obtiene ciudad por ID
- `isCityClickable(city)` - Verifica si una ciudad es clicable
- `getAllActiveCities()` - Obtiene todas las ciudades activas

### `src/features/destinations/` - Lógica de destinos/atracciones

```
src/features/destinations/
├── data/
│   ├── destinations.ts            # Diccionario de destinos Trawel
│   ├── destinations.utils.ts      # Funciones de acceso y filtrado
│   └── destinations.types.ts      # Tipos: Destination, DestinationStatus, DestinationType
└── index.ts                       # Export público
```

**Responsabilidad:** Definición de destinos turísticos/atracciones con contenido por modo de experiencia.

**Archivo clave:** `destinations.ts` contiene destinos como Prado, Senso-ji, Machu Picchu, Retiro, Fushimi Inari.

**Estados de destino (`DestinationStatus`):**
- `published`: Contenido publicado y disponible
- `draft`: En edición, no visible públicamente
- `comingSoon`: Próximamente disponible
- `disabled`: Deshabilitado

**Tipos de destino (`DestinationType`):**
- `museum`: Museos y galerías
- `temple`: Templos y lugares religiosos
- `park`: Parques y jardines
- `monument`: Monumentos históricos
- `landmark`: Puntos de interés urbanos
- `nature`: Atracciones naturales
- `cultural`: Centros culturales

**Contenido por modo (`contentByMode`):** Cada destino tiene contenido diferenciado:
- Modo `adventure`: Tono emocional, explorador
- Modo `student`: Tono educativo, datos históricos

**Funciones principales en `destinations.utils.ts`:**
- `getDestinationBySlug(slug)` - Obtiene destino por slug
- `getDestinationsByCityId(cityId)` - Obtiene destinos de una ciudad
- `getPublishedDestinationsByCity(city)` - Obtiene destinos publicados de una ciudad
- `getDestinationContentByMode(destination, mode)` - Obtiene contenido según modo
- `getDestinationTitle(destination)` - Obtiene título localizado
- `getDestinationSummary(destination)` - Obtiene resumen localizado

### `src/features/travelData/` - Capa de acceso a datos agregados

```
src/features/travelData/
├── types/
│   └── travelData.types.ts              # Tipos agregados para páginas
├── sources/
│   ├── travelData.source.types.ts       # Contrato TravelDataSource
│   ├── mockTravelData.source.ts         # Implementación mock (default)
│   └── supabaseTravelData.source.ts     # Implementación Supabase
├── services/
│   └── travelData.service.ts            # Servicio público (usa sources)
└── index.ts                             # Export público
```

**Responsabilidad:** Proveer una capa de abstracción entre las páginas y el origen de datos (mock o Supabase).

**Arquitectura de fuentes:**
```
VITE_TRAVEL_DATA_SOURCE=mock (default)
  → mockTravelDataSource (datos locales estáticos)

VITE_TRAVEL_DATA_SOURCE=supabase
  → supabaseTravelDataSource (base de datos real)
```

**Tipos definidos:**
- `HomePageData` - Datos para HomePage (países, estadísticas)
- `CountryPageData` - Datos para CountryPage (país, ciudades, conteos)
- `CityPageData` - Datos para CityPage (ciudad, destinos)
- `AdventurePageData` - Datos para AdventurePage (destino, ciudad, país)

**Funciones principales en `travelData.service.ts`:**
- `getHomePageData()` - Obtiene datos agregados para HomePage
- `getCountryPageData(countrySlug)` - Obtiene datos para CountryPage
- `getCityPageData(countrySlug, citySlug)` - Obtiene datos para CityPage
- `getAdventurePageData(adventureSlug)` - Obtiene datos para AdventurePage

**Implementaciones disponibles:**

1. **mockTravelDataSource** (default): Usa datos locales de `countries.ts`, `cities.ts`, `destinations.ts`

2. **supabaseTravelDataSource**: Conecta con Supabase
   - Requiere inicialización: `await supabaseTravelDataSource.initialize()`
   - Cache en memoria para operaciones síncronas
   - Mapeo automático de campos `_es` a tipos de aplicación

### `src/features/experienceMode/` - Modos de experiencia

```
src/features/experienceMode/
├── components/
│   └── ExperienceModeSwitch/
│       ├── ExperienceModeSwitch.tsx    # Selector Aventura/Estudiante
│       ├── ExperienceModeSwitch.module.css
│       └── index.ts
├── data/
│   └── experienceMode.config.ts        # Configuración y textos por modo
└── types/
    └── experienceMode.types.ts         # Tipos TypeScript
```

**Responsabilidad:** Gestión de modos de experiencia (Aventura vs Estudiante).

**Modos disponibles:**
- `adventure`: Tono emocional, explorador, viajero (por defecto)
- `student`: Tono educativo, enciclopédico, cultural

**Uso:** El componente `ExperienceModeSwitch` se integra en `HomePage` para permitir al usuario cambiar entre modos. El contenido se adapta dinámicamente según el modo seleccionado.

---

## `src/data/` - Datos de contenido centralizados

```
src/data/
├── countries/
│   ├── spain.ts                   # Datos completos de España
│   ├── japan.ts                   # Datos completos de Japón
│   ├── peru.ts                    # Datos completos de Perú
│   └── index.ts                   # Exporta todos los países
├── cities/
│   ├── spain/
│   │   ├── madrid.ts
│   │   ├── barcelona.ts
│   │   └── seville.ts
│   ├── japan/
│   │   ├── tokyo.ts
│   │   └── kyoto.ts
│   └── index.ts
├── adventures/
│   ├── spain/
│   │   ├── madrid/
│   │   │   ├── prado-museum.ts
│   │   │   └── retiro-park.ts
│   │   └── barcelona/
│   │       └── sagrada-familia.ts
│   └── index.ts
└── index.ts                       # Export centralizado de todo el contenido
```

**Responsabilidad:** Contenido estático del sitio. Cada archivo contiene la información completa de una entidad.

**Formato:** Archivos TypeScript que exportan objetos tipados. No JSON puro para tener autocompletado y validación.

**Ejemplo de estructura:**
```typescript
// src/data/countries/spain.ts
import { Country } from '@/features/countries/data/countries.types';

export const spain: Country = {
  id: 'ES',
  name: 'España',
  slug: 'espana',
  status: 'active',
  capital: 'Madrid',
  shortDescription: '...',
  totalDestinations: 3,
  heroImage: '/images/countries/spain-hero.jpg',
  // ...más datos
};
```

---

## `src/components/` - Componentes compartidos

```
src/components/
├── ui/                            # Primitivas de UI
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   └── Button.types.ts
│   ├── Card/
│   ├── Badge/
│   ├── Loading/
│   └── ErrorBoundary/
├── layout/                        # Componentes de layout
│   ├── Header/
│   ├── Footer/
│   ├── MainLayout/
│   └── Container/
└── shared/                        # Componentes compartidos entre features
    ├── PageHero/
    ├── ImageGallery/
    └── Breadcrumbs/
```

**Responsabilidad:** Componentes genéricos reutilizables. No contienen lógica de negocio específica.

**Convención:** Cada componente en su carpeta con `.tsx`, `.module.css`, y `index.ts`.

---

## `src/styles/` - Estilos globales

```
src/styles/
├── global.css                     # Reset, tipografía base, utilidades
├── theme.css                      # Variables CSS del tema
├── map.css                        # Estilos específicos de mapas (opcional)
└── variables/
    ├── colors.css                 # Paleta de colores
    ├── spacing.css                # Espaciados
    ├── typography.css             # Tipografía
    └── breakpoints.css            # Breakpoints responsive
```

**Responsabilidad:** Estilos globales y variables CSS. Los estilos de componentes van en `.module.css`.

**Ejemplo de `theme.css`:**
```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --color-accent: #f59e0b;
  
  /* Map colors */
  --map-color-default: #cbd5e1;
  --map-color-active: #3b82f6;
  --map-color-hover: #f59e0b;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  
  /* Breakpoints (para JS) */
  --bp-mobile: 640px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
}
```

---

## `src/types/` - Tipos globales

```
src/types/
├── global.types.ts                # Tipos usados en toda la app
├── api.types.ts                   # (futuro) Tipos de API
└── index.ts                       # Barrel export
```

**Responsabilidad:** Tipos que no pertenecen a una feature específica.

---

## `src/utils/` - Utilidades

```
src/utils/
├── formatters.ts                  # Formateo de fechas, números, etc.
├── validators.ts                  # Validaciones
├── constants.ts                   # Constantes globales
└── hooks/                         # Hooks genéricos
    ├── useMediaQuery.ts
    └── useScrollPosition.ts
```

**Responsabilidad:** Funciones puras y hooks reutilizables. Sin dependencias de features.

---

## `scripts/` - Scripts de utilidad

```
scripts/
├── exportMockToSqlSeed.ts         # Exporta datos mock a SQL seed para Supabase
├── inspect-map-asset.ts           # Inspecciona archivos GeoJSON/TopoJSON de mapas
├── download-geoboundaries.ts      # Descarga automática assets de geoBoundaries
├── prepare-spain-map-asset.ts     # Optimiza GeoJSON raw a TopoJSON simplificado
├── process-country-map-queue.ts   # Worker: procesa cola de mapas (DA-030)
└── lib/
    └── mapAssetPipeline.ts        # Utilidades compartidas del pipeline cartográfico
```

**Responsabilidad:** Scripts Node.js/TypeScript para tareas de mantenimiento, migración y procesado de assets.

### `exportMockToSqlSeed.ts`
- Lee datos de `src/features/countries/data/countries.ts`, `cities.ts`, `destinations.ts`
- Genera archivo SQL con INSERTS idempotentes (`ON CONFLICT DO UPDATE`)
- Usa subconsultas para resolver relaciones por slug (evita UUIDs hardcodeados)
- Output: `supabase/seed.sql`

**Uso:**
```bash
npm run export:seed
```

### `inspect-map-asset.ts`
- Analiza archivos GeoJSON/TopoJSON descargados
- Exporta funciones reutilizables: `analyzeMapAsset()`, `extractFeatures()`, `searchTerms()`, `detectADM2Level()`
- Extrae información: tamaño, campos, nombres de provincias, nivel administrativo
- Busca términos específicos (Castellón, Teruel, etc.)
- Verifica metadatos de licencia

**Uso directo:**
```bash
npx tsx scripts/inspect-map-asset.ts <ruta-al-archivo>
```

**Uso como módulo:**
```typescript
import { analyzeMapAsset, displayAnalysis } from './inspect-map-asset.js';
const analysis = analyzeMapAsset('ruta/al/archivo.geojson');
displayAnalysis(analysis);
```

### `prepare-spain-map-asset.ts`
- **Flujo de optimización:**
  1. Lee GeoJSON raw: `public/maps/countries/spain/spain-adm2-raw.geojson` (40.83 MB)
  2. Convierte a TopoJSON usando `topojson-server`
  3. Simplifica geometría al 5% usando `topojson-simplify`
  4. Valida: 52 provincias, Castellón presente, Teruel presente
  5. Guarda resultado: `public/maps/countries/spain/spain-adm2.topojson` (52.59 KB)

**Transformación:**
| Entrada | Salida | Reducción |
|---------|--------|-----------|
| 40.83 MB GeoJSON | 52.59 KB TopoJSON | 99.9% |

**Uso:**
```bash
npm run maps:spain:optimize
```

**Requisitos:**
- `topojson-server`, `topojson-simplify`
- Asset raw previamente descargado (`npm run maps:spain:prepare`)

---

### `download-geoboundaries.ts`
- **Flujo automático completo:**
  1. Consulta API de geoBoundaries: `https://www.geoboundaries.org/api/current/gbOpen/ESP/ADM2`
  2. Detecta campo `gjDownloadURL` en metadata
  3. Descarga GeoJSON automáticamente
  4. Ejecuta análisis integrado vía `inspect-map-asset.ts`
  5. Genera reporte completo
- Sigue redirecciones HTTP automáticamente
- Limpia archivos corruptos si falla
- Guarda metadata en: `public/maps/countries/spain/spain-adm2-metadata.json`
- Guarda GeoJSON en: `public/maps/countries/spain/spain-adm2-raw.geojson`

**Uso:**
```bash
npm run maps:spain:prepare
```

---

### `process-country-map-queue.ts` (Worker DA-030)
- **Propósito:** Procesar registros `queued` en `country_map_assets` y generar assets TopoJSON
- **Flujo:** Consulta cola → Descarga geoBoundaries → Procesa → Sube a Storage → Actualiza BD
- **Perfiles:** Aplica `src/features/map/config/countryMapProfiles.ts` para decidir el `admin_level` efectivo por país
- **CLI:** Soporta `--country`, `--limit`, `--dry-run`, `--force`

**Uso:**
```bash
npm run maps:queue:process              # Procesar toda la cola
npm run maps:queue:process -- --country mexico   # Solo México
npm run maps:queue:process -- --limit 1          # Solo 1 elemento
npm run maps:queue:process -- --dry-run          # Simulación
npm run maps:queue:process -- --country mexico --force  # Reprocesar aunque esté ready
```

Para México, el reprocesado usa ADM1 por perfil, sube `countries/mexico/mexico-adm1.topojson` y actualiza `country_map_assets.admin_level`.

**Variables de entorno:**
- `SUPABASE_URL` - URL de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clave de servicio (requerida para Storage)

**Automatización CI:**
- Workflow: `.github/workflows/process-country-map-queue.yml`
- Frecuencia inicial: cada 30 minutos (`*/30 * * * *`)
- Ejecución manual: `workflow_dispatch`
- Comando: `npm run maps:queue:process -- --limit 1`
- Secrets requeridos: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- La `SUPABASE_SERVICE_ROLE_KEY` vive solo en GitHub Actions/backend/worker; no se expone al frontend ni a assets públicos.

---

### `lib/mapAssetPipeline.ts`
- **Propósito:** Utilidades compartidas para el pipeline de procesamiento cartográfico
- **Funciones exportadas:**
  - `fetchGeoBoundariesMetadata()` - Consulta API de geoBoundaries
  - `downloadGeoJSON()` - Descarga archivo GeoJSON
  - `extractGeoJsonUrl()` - Extrae URL de descarga de metadata
  - `extractLicenseInfo()` - Extrae información de licencia
  - `convertToTopoJSON()` - Convierte GeoJSON a TopoJSON simplificado
  - `normalizeGeoJSON()` - Normaliza orientación de polígonos (winding)
  - `formatBytes()` - Formatea tamaños de archivo
- **Winding:** `convertToTopoJSON()` normaliza antes de convertir y vuelve a normalizar después de `topojson-simplify`, para evitar polígonos complementarios en D3.

**Usado por:**
- `process-country-map-queue.ts` (worker de producción)
- `prepare-spain-map-asset.ts` (procesamiento manual de España)

**Requisitos para todos los scripts:**
- `@types/node` - Tipos de Node.js
- `tsx` - Ejecutor de TypeScript
- `tsconfig.node.json` incluye `scripts/**/*.ts`

---

## `supabase/` - Configuración Supabase

```
supabase/
├── migrations/                    # Migraciones SQL de la base de datos
│   ├── 001_create_trawel_schema.sql   # Schema inicial (countries, cities, destinations)
│   └── 002_create_country_map_assets.sql  # Tabla para assets de mapas (DA-030)
└── seed.sql                       # Datos iniciales generados automáticamente
```

**Responsabilidad:** Contener archivos relacionados con Supabase (schema, seeds, migraciones).

**Migraciones:**

1. **`001_create_trawel_schema.sql`** - Schema inicial con 4 tablas:
   - `countries`, `cities`, `destinations`, `destination_sources`
   - Constraints, índices y políticas RLS para lectura pública

2. **`002_create_country_map_assets.sql`** - Tabla para persistencia de mapas (DA-030):
   - `country_map_assets` - Metadatos de assets cartográficos por país
   - Estados: `missing`, `queued`, `generating`, `ready`, `failed`
   - RLS: SELECT público, escritura restringida a service role
   - Índices: `status`, `country_slug`, `(country_slug, status)`
   - Trigger `updated_at` automático

**Seed:**
- El archivo `seed.sql` se regenera ejecutando `npm run export:seed`
- Compatible con el schema definido en migraciones
- Usa `ON CONFLICT DO UPDATE` para idempotencia

**Notas:**
- Ejecutar migraciones en orden numérico en Supabase SQL Editor
- La tabla `country_map_assets` requiere crear bucket `map-assets` en Storage
- Ver instrucciones detalladas en `002_create_country_map_assets.sql`

---

## Convenciones de nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes React | PascalCase | `WorldMap.tsx` |
| Hooks | camelCase con prefix `use` | `useWorldMap.ts` |
| Utilidades | camelCase | `geoUtils.ts` |
| Tipos | PascalCase con suffix `Type` | `CountryType.ts` |
| Constantes | SCREAMING_SNAKE_CASE | `MAP_DEFAULT_SCALE` |
| Archivos CSS | kebab-case | `world-map.module.css` |
| Carpetas | kebab-case | `map-tooltip/` |

---

## Flujo de dependencias

```
┌─────────────────────────────────────────────────────────────┐
│                        pages/                               │
│  (orquestan features y components, conocen rutas)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌─────────────┐
│  features/   │ │   data/  │ │ components/ │
│  (lógica     │ │ (contenido│ │   (UI      │
│   negocio)   │ │  estático)│ │  genérica) │
└──────┬───────┘ └──────────┘ └──────┬──────┘
       │                              │
       └──────────────┬───────────────┘
                      │
                      ▼
              ┌──────────────┐
              │   styles/    │
              │  (variables  │
              │   CSS)       │
              └──────────────┘
```

**Regla:** Dependencias solo hacia abajo. Features no importan de pages. Data no importa de features.

---

## Ejemplo de flujo: Renderizar mapa con países activos

1. **`HomePage.tsx`** importa `WorldMap` de `features/map`
2. **`WorldMap.tsx`** usa `useWorldMap` hook para inicializar D3
3. **`useWorldMap`** usa `useCountryData` para combinar:
   - Geometrías de world-atlas (geoespacial)
   - Datos de `features/countries/data/countries.ts` (contenido Trawel)
4. **`countries.ts`** exporta diccionario con estados (active, coming-soon, etc.)
5. **`WorldMap`** recibe theme de `features/map/config/mapTheme.ts`
6. Cada país se renderiza con color según su estado en el tema

---

## Notas para implementación

1. **Alias de imports:** Configurar en `vite.config.ts`:
   ```typescript
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
       '@features': path.resolve(__dirname, './src/features'),
       '@components': path.resolve(__dirname, './src/components'),
     },
   }
   ```

2. **CSS Modules:** Activar en `vite.config.ts` (viene por defecto)

3. **TypeScript:** Configurar `paths` en `tsconfig.json` para los aliases

4. **Orden de implementación sugerido:**
   1. Estructura de carpetas
   2. Tipos TypeScript base
   3. Diccionario de países (3 activos)
   4. Tema del mapa
   5. Componente WorldMap básico
   6. HomePage
   7. CountryPage
   8. CityPage
   9. AdventurePage

---

*CodeMap v1.0 - Trawel*
