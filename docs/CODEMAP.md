# Mapa de Código - Trawel

## Propósito de este documento

Este archivo describe la estructura esperada del código fuente. Sirve como guía para desarrolladores y agentes que implementen el proyecto.

**Estado:** Planificación / No implementado todavía

---

## Estructura general

```
trawel/
├── docs/                    # Documentación del proyecto (ya existe)
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
└── main.tsx             # Entry point (render React)
```

**Responsabilidad:** Inicialización y configuración global. No contiene lógica de negocio.

---

## `src/pages/` - Páginas

```
src/pages/
├── HomePage/
│   ├── HomePage.tsx
│   ├── HomePage.module.css
│   └── index.ts
├── CountryPage/
│   ├── CountryPage.tsx
│   ├── CountryPage.module.css
│   └── index.ts
├── CityPage/
│   ├── CityPage.tsx
│   ├── CityPage.module.css
│   └── index.ts
└── AdventurePage/
    ├── AdventurePage.tsx
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
│   └── countryMappers.ts          # Funciones para mapear IDs de world-atlas a nuestros países
├── hooks/
│   ├── useCountries.ts            # Hook para obtener lista de países
│   ├── useCountry.ts              # Hook para obtener un país por slug
│   └── useCountryStatus.ts        # Hook para saber si un país está activo
└── utils/
    └── countryHelpers.ts          # Funciones auxiliares (getCountryById, etc.)
```

**Responsabilidad:** Definición de países, sus metadatos, y componentes relacionados.

**Archivo clave:** `countries.ts` contiene la fuente de verdad de los países Trawel.

### `src/features/cities/` - Lógica de ciudades

```
src/features/cities/
├── components/
│   ├── CityCard/
│   ├── CityList/
│   └── CityHero/
├── data/
│   ├── cities.ts                  # Datos de ciudades
│   └── cities.types.ts
├── hooks/
│   ├── useCities.ts
│   ├── useCity.ts
│   └── useCitiesByCountry.ts      # Ciudades de un país específico
└── utils/
    └── cityHelpers.ts
```

**Responsabilidad:** Datos y componentes de ciudades/regiones.

### `src/features/adventures/` - Lógica de aventuras

```
src/features/adventures/
├── components/
│   ├── AdventureCard/
│   ├── AdventureList/
│   └── AdventureDetail/
├── data/
│   ├── adventures.ts
│   └── adventures.types.ts
├── hooks/
│   ├── useAdventures.ts
│   ├── useAdventure.ts
│   └── useAdventuresByCity.ts
└── utils/
    └── adventureHelpers.ts
```

**Responsabilidad:** Datos y componentes de aventuras/fichas de destino.

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