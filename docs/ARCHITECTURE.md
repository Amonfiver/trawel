# Arquitectura de Trawel

## Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|------|------------|---------|---------------|
| **Build tool** | Vite | 5.x | Rápido, moderno, HMR excelente, sin configuración compleja |
| **Framework UI** | React | 18.x | Ecosistema maduro, componentes reutilizables |
| **Routing** | React Router | 6.x | SPA routing estándar, lazy loading |
| **Mapas** | D3.js + TopoJSON | 7.x | Control total sobre SVG, probado en Websim |
| **Estilos** | CSS Modules | - | Scoped styles sin runtime, compatible con temas |
| **Tipos** | TypeScript | 5.x | Seguridad, autocompletado, documentación viva |

## Por qué no Next.js (todavía)

Next.js añade complejidad que no necesitamos en el MVP:

- **SSR**: No necesitamos SEO agresivo ni renderizado servidor
- **API Routes**: Usamos datos estáticos JSON
- **File-system routing**: Prefereimos control explícito con React Router
- **Mayor bundle size**: Vite + React es más ligero

**Reevaluaremos** cuando necesitemos:
- SEO avanzado para cada destino
- API backend propia
- Renderizado servidor para performance

## Estructura de carpetas propuesta

```
trawel/
├── docs/                    # Documentación del proyecto
│   ├── SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DECISIONES.md
│   ├── BITACORA.md
│   ├── CODEMAP.md
│   └── ANALISIS_MAPA_WEBSIM.md
├── public/                  # Assets estáticos
│   ├── images/
│   │   ├── countries/       # Fotos de países
│   │   ├── cities/          # Fotos de ciudades
│   │   └── adventures/      # Fotos de aventuras
│   └── data/
│       └── world-atlas.json # Datos geoespaciales (opcional, puede venir de CDN)
├── src/
│   ├── app/                 # Configuración de la aplicación
│   │   ├── App.tsx          # Root component
│   │   ├── routes.tsx       # Definición de rutas
│   │   ├── providers.tsx    # Context providers (theme, etc.)
│   │   └── i18n/            # Sistema de internacionalización
│   │       ├── i18n.types.ts    # Tipos: Locale, LocalizedText
│   │       ├── i18n.utils.ts    # Utilidades: getLocalizedText, normalizeLocale
│   │       └── index.ts         # Export público
│   ├── pages/               # Páginas de la aplicación
│   │   ├── HomePage/
│   │   ├── CountryPage/
│   │   ├── CityPage/
│   │   └── AdventurePage/
│   ├── features/            # Módulos por dominio
│   │   ├── map/             # Sistema de mapas
│   │   │   ├── components/
│   │   │   │   ├── WorldMap/
│   │   │   │   ├── CountryMap/      # (futuro)
│   │   │   │   └── MapTooltip/
│   │   │   ├── hooks/
│   │   │   │   ├── useWorldMap.ts
│   │   │   │   └── useMapProjection.ts
│   │   │   ├── config/
│   │   │   │   └── mapTheme.ts      # Configuración visual
│   │   │   └── utils/
│   │   │       └── geoUtils.ts
│   │   ├── countries/       # Lógica de países
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   │   └── countries.ts     # Diccionario de países Trawel
│   │   │   └── types/
│   │   │       └── country.types.ts
│   │   ├── cities/          # Lógica de ciudades
│   │   │   ├── data/
│   │   │   │   ├── cities.ts          # Diccionario de ciudades
│   │   │   │   └── cities.utils.ts    # Utilidades de ciudades
│   │   │   ├── types/
│   │   │   │   └── city.types.ts      # Tipos: City, CityStatus, CityContentByMode
│   │   │   └── index.ts               # Export público
│   │   ├── destinations/    # Lógica de destinos/atracciones
│   │   │   ├── data/
│   │   │   │   ├── destinations.ts          # Diccionario de destinos
│   │   │   │   └── destinations.utils.ts    # Utilidades de destinos
│   │   │   ├── types/
│   │   │   │   └── destination.types.ts     # Tipos: Destination, DestinationStatus, DestinationType
│   │   │   └── index.ts                     # Export público
│   │   ├── travelData/      # Capa de acceso a datos agregados
│   │   │   ├── types/
│   │   │   │   └── travelData.types.ts      # Tipos: HomePageData, CountryPageData, etc.
│   │   │   ├── services/
│   │   │   │   └── travelData.service.ts    # Funciones de acceso a datos para páginas
│   │   │   └── index.ts                     # Export público
│   │   └── experienceMode/  # Modos de experiencia (Aventura/Estudiante)
│   │       ├── components/
│   │       │   └── ExperienceModeSwitch/  # Selector de modo
│   │       ├── data/
│   │       │   └── experienceMode.config.ts  # Configuración y textos
│   │       └── types/
│   │           └── experienceMode.types.ts   # Tipos TypeScript
│   ├── data/                # Datos estáticos
│   │   ├── countries/       # JSON/TS por país
│   │   │   ├── spain.ts
│   │   │   ├── japan.ts
│   │   │   └── peru.ts
│   │   └── index.ts         # Export centralizado
│   ├── components/          # Componentes compartidos
│   │   ├── ui/              # Primitivas (Button, Card, etc.)
│   │   ├── layout/          # Layouts y estructura
│   │   └── shared/          # Componentes reutilizables
│   ├── styles/              # Estilos globales y temas
│   │   ├── global.css
│   │   ├── theme.css        # Variables CSS del tema
│   │   └── map.css          # Estilos específicos de mapas
│   ├── types/               # Tipos globales
│   └── utils/               # Utilidades
└── package.json
```

## Separación de responsabilidades

### 1. UI (React Components)
- Renderizan lo que ven los usuarios
- Reciben props y callbacks
- No contienen lógica de negocio
- Ejemplo: `WorldMap` recibe `countries`, `onCountryClick`, `theme`

### 2. Datos (Data Layer)
- Definición de tipos TypeScript
- Diccionario de países con metadatos Trawel
- Datos de ciudades y aventuras
- No dependen de React ni de UI

### 3. Lógica de mapa (D3 + Hooks)
- Proyecciones geográficas
- Escalas y transformaciones
- Detección de hover/click
- Desacoplada de los datos de contenido

### 4. Configuración (Tema)
- Colores, tamaños, espaciados
- Estados visuales del mapa
- Fácil de cambiar sin tocar lógica

## Sistema de tema/configuración para el mapa

### Configuración centralizada

```typescript
// src/features/map/config/mapTheme.ts
export interface MapTheme {
  colors: {
    background: string;
    default: string;        // País sin contenido
    active: string;         // País con contenido
    hover: string;          // Hover sobre cualquier país
    selected: string;       // País seleccionado actualmente
    highlighted: string;    // País destacado (ej: promoción)
    border: string;
    borderWidth: number;
  };
  tooltip: {
    background: string;
    textColor: string;
    borderRadius: string;
    padding: string;
    maxWidth: string;
  };
  animation: {
    duration: number;
    easing: string;
  };
  responsive: {
    breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
    scaleFactors: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
}

export const defaultTheme: MapTheme = {
  colors: {
    background: '#f8f9fa',
    default: '#cbd5e1',      // slate-300
    active: '#3b82f6',       // blue-500
    hover: '#f59e0b',        // amber-500
    selected: '#8b5cf6',     // violet-500
    highlighted: '#10b981',  // emerald-500
    border: '#ffffff',
    borderWidth: 0.5,
  },
  // ...
};
```

### Uso en componentes

```typescript
// El tema se inyecta, no se hardcodea
function WorldMap({ theme, countries, onCountryClick }) {
  // Usa theme.colors.active, theme.colors.hover, etc.
  // No hay colores literales en el código
}
```

## Diccionario propio de países

No usamos directamente los nombres de world-atlas. Creamos nuestro diccionario:

```typescript
// src/features/countries/data/countries.ts
export interface Country {
  id: string;              // ISO 3166-1 alpha-2 (ES, JP, PE)
  name: string;            // Nombre en español
  slug: string;            // Para URLs (espana, japon, peru)
  nameEn?: string;         // Nombre en inglés (opcional)
  continent: Continent;
  status: 'active' | 'coming-soon' | 'hidden';
  capital: string;
  shortDescription: string;
  totalDestinations: number;  // Número de ciudades/aventuras
  mapCoordinates?: {     // Para centrar mapa en este país (futuro)
    center: [number, number];
    scale: number;
  };
}

export const countries: Record<string, Country> = {
  ES: {
    id: 'ES',
    name: 'España',
    slug: 'espana',
    continent: 'europe',
    status: 'active',
    capital: 'Madrid',
    shortDescription: 'Desde la Alhambra hasta la Sagrada Familia',
    totalDestinations: 3,
  },
  JP: {
    id: 'JP',
    name: 'Japón',
    slug: 'japon',
    continent: 'asia',
    status: 'active',
    capital: 'Tokio',
    shortDescription: 'Tradición y futuro en perfecta armonía',
    totalDestinations: 2,
  },
  // ...más países
};
```

## Flujo de datos del mapa

```
world-atlas.json (CDN)
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  D3 + TopoJSON  │────→│  Geometries     │────→│  WorldMap       │
│  (carga datos)  │     │  (SVG paths)    │     │  (render SVG)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                           ┌──────────────────────────┘
                           ▼
                    ┌─────────────────┐
                    │  Diccionario    │
                    │  Trawel         │
                    │  (nombres,      │
                    │   estados, etc) │
                    └─────────────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │  Colores según  │
                    │  estado del     │
                    │  país           │
                    └─────────────────┘
```

## Rutas de la aplicación

```typescript
// src/app/routes.tsx
export const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/pais/:countrySlug', element: <CountryPage /> },
  { path: '/pais/:countrySlug/:citySlug', element: <CityPage /> },
  { path: '/aventura/:adventureSlug', element: <AdventurePage /> },
  // Redirección para URLs antiguas o cambios
  { path: '/destino/:slug', element: <Navigate to="/aventura/:slug" /> },
];
```

## Consideraciones de performance

1. **Code splitting**:
   - Cada página es un chunk separado
   - D3 se carga solo en páginas con mapa

2. **Datos geoespaciales**:
   - world-atlas se carga desde CDN con cache agresivo
   - Considerar prefetch para países activos

3. **Imágenes**:
   - Lazy loading nativo con `loading="lazy"`
   - Formatos modernos (WebP con fallback)
   - Responsive images con `srcset`

4. **Bundle size**:
   - D3 es pesado: importar solo módulos necesarios (`d3-geo`, `d3-selection`)
   - Tree-shaking automático con Vite

## Próximos pasos arquitectónicos

1. **Fase 1 (MVP)**: Estructura base, WorldMap, 3 países
2. **Fase 2**: CountryMap interno, más países
3. **Fase 3**: Buscador, filtros, más features
4. **Fase 4**: Evaluar migración a Next.js si el SEO se vuelve crítico

---

*Arquitectura v1.0 - Trawel MVP*