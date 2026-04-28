# Mapa de Código - Trawel

## Propósito de este documento

Este archivo describe la estructura esperada del código fuente. Sirve como guía para desarrolladores y agentes que implementen el proyecto.

**Estado:** En desarrollo - WorldMap v1 implementado con D3 + TopoJSON + world-atlas CDN

**Documentación relacionada:**
- `SPEC.md` - Especificación funcional
- `ARCHITECTURE.md` - Arquitectura del sistema
- `DATA_MODEL.md` - Modelo de datos actual y futuro (ver para entender estructura de entidades)
- `CONTENT_GUIDE.md` - Guía para crear contenido editorial
- `INVESTIGHOST_CONTRACT.md` - Contrato de compatibilidad con Investighost-GPT
- `DECISIONES.md` - Registro de decisiones técnicas
- `BITACORA.md` - Bitácora activa del proyecto
- `BITACORA_001.md` - Archivo histórico de bitácora

---

## Estructura general

```
trawel/
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
│   ├── CountryPage.tsx                 # Ficha editorial de país
│   ├── CountryPage.module.css
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

**Convención:** Lazy loading en routes.tsx para code splitting.

---

## `src/features/` - Módulos por dominio

### `src/features/map/` - Sistema de mapas

```
src/features/map/
├── components/
│   ├── WorldMap/
│   │   ├── WorldMap.tsx           # Componente principal del mapa mundial
│   │   ├── WorldMap.module.css    # Estilos específicos
│   │   └── index.ts
│   ├── CountryMap/                # (futuro) Mapa interno de país
│   │   └── ...
│   ├── MapTooltip/
│   │   ├── MapTooltip.tsx         # Tooltip reutilizable
│   │   └── MapTooltip.module.css
│   └── MapLegend/                 # (opcional) Leyenda de colores
│       └── ...
├── hooks/
│   ├── useWorldMap.ts             # Hook principal para inicializar D3
│   ├── useMapProjection.ts        # Hook para proyección geográfica
│   └── useCountryData.ts          # Hook para combinar datos geoespaciales + Trawel
├── config/
│   ├── mapTheme.ts                # Interfaz MapTheme y tema default
│   └── mapConstants.ts            # Constantes (dimensiones, proyección default)
├── utils/
│   ├── geoUtils.ts                # Utilidades geográficas
│   └── colorUtils.ts              # Utilidades para asignar colores por estado
└── types/
    └── map.types.ts               # Tipos específicos de mapas
```

**Responsabilidad:** Todo lo relacionado con renderizado de mapas. Desacoplado de datos de contenido.

**Principio:** El mapa no sabe qué es un "país Trawel", solo recibe geometrías y configuración de colores.

**Nota:** WorldMap v1 usa D3 + TopoJSON + world-atlas por CDN. Conecta geometrías UN M.49 con diccionario Trawel.

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
│   ├── countries.ts               # Diccionario de países Trawel
│   ├── countries.types.ts         # Tipos Country, Continent, etc.
│   └── countries.utils.ts         # Funciones de acceso: getBySlug, getByIso, etc.
├── hooks/
│   ├── useCountries.ts            # Hook para obtener lista de países
│   ├── useCountry.ts              # Hook para obtener un país por slug
│   └── useCountryStatus.ts        # Hook para saber si un país está activo
└── utils/
    └── countryHelpers.ts          # Funciones auxiliares (futuro)
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
│   └── travelData.types.ts      # Tipos agregados para páginas
├── sources/
│   ├── travelData.source.types.ts   # Contrato TravelDataSource
│   └── mockTravelData.source.ts     # Implementación mock actual
├── services/
│   └── travelData.service.ts    # Servicio público (usa sources)
└── index.ts                     # Export público
```

**Responsabilidad:** Proveer una capa de abstracción entre las páginas y el origen de datos actual (local).

**Propósito:** Facilitar la migración futura a base de datos externa (Supabase/API) sin modificar las páginas.

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

**Nota sobre persistencia futura:**
> Este servicio está diseñado como punto de sustitución. Cuando se implemente Supabase/API:
> 1. Convertir funciones a async
> 2. Agregar manejo de errores con TravelDataResult<T>
> 3. Implementar caché con React Query/SWR
> 4. Las páginas solo necesitarán agregar await y loading states

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
└── exportMockToSqlSeed.ts         # Exporta datos mock a SQL seed para Supabase
```

**Responsabilidad:** Scripts Node.js/TypeScript para tareas de mantenimiento y migración.

**Script `exportMockToSqlSeed.ts`:**
- Lee datos de `src/features/countries/data/countries.ts`, `cities.ts`, `destinations.ts`
- Genera archivo SQL con INSERTS idempotentes (`ON CONFLICT DO UPDATE`)
- Usa subconsultas para resolver relaciones por slug (evita UUIDs hardcodeados)
- Output: `supabase/seed.sql`

**Uso:**
```bash
npm run export:seed
```

**Requisitos:**
- `@types/node` - Tipos de Node.js
- `tsx` - Ejecutor de TypeScript
- `tsconfig.node.json` incluye `scripts/**/*.ts`

---

## `supabase/` - Configuración Supabase

```
supabase/
├── migrations/                    # Migraciones SQL de la base de datos
│   └── 001_create_trawel_schema.sql  # Schema inicial con tablas, índices y RLS
└── seed.sql                       # Datos iniciales generados automáticamente
```

**Responsabilidad:** Contener archivos relacionados con Supabase (schema, seeds, migraciones).

**Migraciones:**
- `001_create_trawel_schema.sql` - Crea tablas countries, cities, destinations, destination_sources con constraints, índices y políticas RLS

**Seed:**
- El archivo `seed.sql` se regenera ejecutando `npm run export:seed`
- Compatible con el schema definido en migraciones
- Usa `ON CONFLICT DO UPDATE` para idempotencia

**Nota:** Para aplicar el schema en Supabase, ejecutar la migración antes de cargar el seed.

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