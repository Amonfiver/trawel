# Bitácora de Trawel

## Formato de entradas

Cada entrada incluye:
- Fecha
- Participantes (si aplica)
- Qué se hizo/decidió
- Por qué
- Próximos pasos

---

## 2026-04-27 - Análisis y decisión de rehacer desde cero

**Participantes:** SDD session inicial

### Qué se hizo

1. **Analizamos la versión Websim original** (`trawel-websim-original/`)
   - Revisamos `index.html`, `script.js`, `styles.css`
   - Entendimos el funcionamiento del mapa D3/TopoJSON
   - Documentamos hallazgos en `ANALISIS_MAPA_WEBSIM.md`

2. **Decidimos rehacer Trawel desde cero**
   - No copiar código de la versión original
   - Mantener el concepto validado (mapa mundial interactivo)
   - Crear arquitectura limpia y mantenible

3. **Definimos stack tecnológico para el MVP**
   - Vite + React (no Next.js todavía)
   - D3.js + TopoJSON para mapas
   - TypeScript desde el inicio
   - Datos estáticos JSON/TS

4. **Creamos documentación base del proyecto**
   - `SPEC.md` - Especificación y alcance
   - `ARCHITECTURE.md` - Arquitectura y estructura
   - `DECISIONES.md` - Registro de decisiones técnicas
   - `BITACORA.md` - Esta bitácora
   - `CODEMAP.md` - Mapa de código futuro

### Decisiones clave de hoy

| Decisión | Racional |
|----------|----------|
| Vite + React | Simplicidad, velocidad, sin necesidad de SSR |
| No Next.js | Añade complejidad innecesaria para el MVP |
| D3 + TopoJSON | Probado en Websim, control total del renderizado |
| Datos estáticos | Contenido curado, sin necesidad de backend |
| Feature-based folders | Escalabilidad y cohesión |
| Sistema de temas | Evitar hardcodeo de estilos, permitir personalización |

### Aprendizajes de la versión Websim

**Lo que funciona y mantenemos:**
- Concepto de mapa mundial como punto de entrada
- Hover para resaltar país y mostrar nombre
- Click para interactuar (aunque en la nueva versión navegará)
- D3/TopoJSON es la tecnología adecuada

**Lo que mejoramos:**
- Código acoplado → Separación de responsabilidades
- Estilos hardcodeados → Sistema de temas configurable
- Datos mínimos (solo nombre en inglés) → Diccionario propio completo
- Sin navegación real → Flujo completo Mapa → País → Ciudad → Aventura
- Tooltip simple → Tooltip enriquecido con estado y metadatos

### Próximos pasos

1. **Preparar proyecto Vite + React**
   - Inicializar con `npm create vite@latest`
   - Configurar TypeScript
   - Configurar rutas base

2. **Crear sistema de datos**
   - Definir tipos TypeScript para Country, City, Adventure
   - Crear diccionario de países con 3 activos (España, Japón, Perú)
   - Crear datos de ciudades y aventuras de ejemplo

3. **Implementar WorldMap básico**
   - Componente WorldMap con D3
   - Cargar world-atlas desde CDN
   - Renderizar países con colores del tema
   - Implementar hover y tooltip

4. **Crear páginas iniciales**
   - HomePage con mapa
   - CountryPage básica
   - CityPage básica
   - AdventurePage básica

### Notas para futuros agentes

- El análisis de la versión Websim está en `ANALISIS_MAPA_WEBSIM.md`
- Las decisiones técnicas están registradas en `DECISIONES.md`
- La especificación completa está en `SPEC.md`
- La arquitectura propuesta está en `ARCHITECTURE.md`

**Principio rector:** Trawel no es "un mapa", es un **sistema visual de exploración configurable**. Cada decisión debe mantener esta filosofía: componentes reutilizables, configurables, sin hardcodeo, preparados para escalar.

---

## 2026-04-27 - Proyecto base creado y servidor arrancado

**Participantes:** SDD implementación inicial

### Qué se hizo

1. **Inicializamos proyecto Vite + React + TypeScript**
   - Usamos `npm create vite@latest` con template `react-ts`
   - Instalamos dependencias base (react, react-dom, typescript)
   - Instalamos react-router-dom para navegación

2. **Creamos estructura de carpetas inicial**
   ```
   src/
   ├── app/           # Configuración (routes)
   ├── pages/         # HomePage, CountryPage, CityPage, AdventurePage
   ├── features/      # countries (diccionario y tipos)
   ├── styles/        # Variables CSS
   └── App.tsx        # Root component
   ```

3. **Implementamos datos iniciales**
   - Tipos TypeScript para Country (`countries.types.ts`)
   - Diccionario de países con 3 activos (ES, JP, PE) y 2 "Próximamente" (FR, IT)
   - Helper functions: `getActiveCountries`, `getCountryBySlug`, `getCountryById`

4. **Creamos páginas básicas**
   - **HomePage**: Lista de países activos con navegación, placeholder para mapa
   - **CountryPage**: Información del país, botón volver
   - **CityPage**: Estructura básica para ciudades
   - **AdventurePage**: Estructura básica para aventuras

5. **Configuramos routing**
   - `/` → HomePage
   - `/pais/:countrySlug` → CountryPage
   - `/pais/:countrySlug/:citySlug` → CityPage
   - `/aventura/:adventureSlug` → AdventurePage

6. **Arrancamos servidor de desarrollo**
   - Vite corriendo en http://localhost:5173
   - Hot Module Replacement activo

### Estado actual

- ✅ Proyecto base funcional
- ✅ Navegación entre páginas
- ✅ Lista de países dinámica desde datos
- ✅ 3 países activos navegables
- ✅ Placeholder para mapa mundial
- ⏳ Mapa D3 (próximo paso)
- ⏳ Datos de ciudades y aventuras
- ⏳ Estilos finales

### Próximos pasos

1. **Implementar WorldMap con D3**
   - Cargar world-atlas desde CDN
   - Renderizar países como SVG paths
   - Colores según estado (active, coming-soon)
   - Hover con tooltip
   - Click para navegar (solo países activos)

2. **Mejorar CountryPage**
   - Mostrar lista de ciudades del país
   - Diseño más completo

3. **Añadir datos de ciudades**
   - Crear estructura de datos para ciudades
   - Datos de ejemplo para Madrid, Barcelona, Tokio, etc.

---

## 2026-04-27 - Capa de datos y configuración de mapa preparada

**Participantes:** SDD implementación de infraestructura de datos

### Qué se hizo

1. **Mejoramos los tipos de países** (`countries.types.ts`)
   - Nuevos campos ISO estandarizados: `isoAlpha2`, `isoAlpha3`, `unM49`
   - Separación de `name` (técnico) y `displayName` (presentación)
   - Campo `status` cambiado a: `'active' | 'comingSoon' | 'disabled'`
   - Añadidos campos opcionales: `featured`, `capital`, `destinationCount`, `shortDescription`
   - Nuevo tipo `CountryMapData` para datos mínimos del mapa
   - Documentación JSDoc en español

2. **Actualizamos el diccionario de países** (`countries.ts`)
   - 3 países activos: España (ES), Japón (JP), Perú (PE)
   - 2 países próximamente: Francia (FR), Italia (IT)
   - Todos los países con códigos ISO completos
   - Campos consistentes con los nuevos tipos

3. **Creamos utilidades de acceso a países** (`countries.utils.ts`)
   - `getCountryBySlug()` - Búsqueda por slug URL
   - `getCountryByIsoAlpha2()` - Búsqueda por código ISO
   - `getCountryByUnM49()` - Búsqueda por código UN (para world-atlas)
   - `getActiveCountries()` - Lista de países navegables
   - `getComingSoonCountries()` - Lista de países "Próximamente"
   - `getFeaturedCountries()` - Países destacados
   - `getCountriesByContinent()` - Filtrado por continente
   - `isCountryClickable()` - Verificación de navegabilidad
   - `isCountryAvailable()` - Verificación de visibilidad
   - `getStatusLabel()` - Labels localizados para UI
   - `getAllCountries()` - Todos los países
   - `getCountryCounts()` - Conteos por estado

4. **Creamos configuración visual del mapa** (`map/config/mapTheme.ts`)
   - Tema por defecto con paleta de colores completa
   - Tema minimalista como alternativa
   - Configuración de colores por estado:
     - `default`, `active`, `hover`, `selected`, `highlighted`, `comingSoon`, `disabled`
   - Configuración de tooltip (colores, tamaños, bordes)
   - Configuración de animaciones
   - Helper `createCustomTheme()` para temas personalizados
   - Helper `getThemeByName()` para selección de temas

5. **Creamos tipos del mapa** (`map/types/map.types.ts`)
   - `CountryVisualStatus` - Estados visuales posibles
   - `MapCountryData` - Datos mínimos para renderizar país
   - `MapTooltipData` - Estructura de tooltip
   - `MapTheme` - Interface completa de configuración visual
   - `WorldMapProps` - Props del futuro componente WorldMap
   - `WorldMapState` - Estado interno del mapa

6. **Actualizamos páginas para usar nuevas utilidades**
   - `HomePage` ahora usa `countries.utils` y muestra conteos
   - `CountryPage` muestra metadatos completos del país
   - `CityPage` actualizada con nuevo sistema
   - Todas las páginas con cabeceras de documentación

7. **Build exitoso**
   - `npm run build` sin errores de TypeScript
   - Bundle de ~60KB gzipped

### Decisiones técnicas registradas

**DA-009: Campos ISO estandarizados en tipos de país**
- Contexto: Necesitamos integrar con world-atlas que usa códigos UN M.49
- Decisión: Añadir `isoAlpha2`, `isoAlpha3`, `unM49` explícitamente
- Consecuencias: Mapeo directo con datos geoespaciales externos

**DA-010: Separación name/displayName**
- Contexto: Necesitamos nombres técnicos para código y nombres para UI
- Decisión: `name` para identificadores (kebab-case), `displayName` para mostrar
- Consecuencias: URLs limpias y presentación localizada

**DA-011: Tema de mapa centralizado**
- Contexto: Evitar hardcodeo de colores en lógica D3
- Decisión: Tema completo en objeto configurable importado
- Consecuencias: Cambios de diseño sin tocar código de renderizado

### Archivos creados/modificados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `countries.types.ts` | ✅ Modificado | Tipos mejorados con ISO y campos nuevos |
| `countries.ts` | ✅ Modificado | Diccionario actualizado con datos completos |
| `countries.utils.ts` | ✅ Creado | 12 funciones de acceso a datos |
| `map/types/map.types.ts` | ✅ Creado | Tipos para el sistema de mapas |
| `map/config/mapTheme.ts` | ✅ Creado | Tema visual configurable |
| `HomePage.tsx` | ✅ Modificado | Usa nuevas utilidades, muestra conteos |
| `CountryPage.tsx` | ✅ Modificado | Muestra metadatos completos |
| `CityPage.tsx` | ✅ Modificado | Usa nuevas utilidades |

### Estado de preparación para D3/TopoJSON

**Listo para integración:**
- ✅ Diccionario de países con códigos UN M.49 (para mapear con world-atlas)
- ✅ Funciones de búsqueda por ISO y UN M.49
- ✅ Tema visual completo con colores por estado
- ✅ Tipos TypeScript para props del mapa
- ✅ Diferenciación de países clickeables vs no clickeables
- ✅ Estructura de tooltip definida

**Próximo paso para mapa:**
- Instalar `d3` y `topojson-client`
- Crear componente `WorldMap` que use `useEffect` para cargar world-atlas
- Renderizar paths SVG con colores del tema
- Implementar eventos mouseover/mouseout/click
- Integrar tooltip con datos de países

### Cómo probar el sistema de países

1. Abrir http://localhost:5173
2. Ver sección "Sistema de países preparado" con conteos
3. Ver lista de 3 países activos (España, Japón, Perú)
4. Ver sección "Próximamente" con 2 países
5. Click en país activo → navega a página de detalle
6. Ver información completa: capital, continente, códigos ISO
7. Badge de estado "Disponible" o "Próximamente"

---

## 2026-04-27 - WorldMap v1 implementado con D3 + TopoJSON

**Participantes:** SDD implementación de mapa interactivo

### Qué se hizo

1. **Instalamos dependencias D3 y TopoJSON**
   - `d3` v7.x - Biblioteca de visualización
   - `topojson-client` - Conversión TopoJSON a GeoJSON
   - `@types/d3`, `@types/topojson-client` - Tipos TypeScript

2. **Creamos componente WorldMap** (`map/components/WorldMap/`)
   - `WorldMap.tsx` - Componente principal con lógica D3
   - `WorldMap.module.css` - Estilos del mapa y tooltip
   - `index.ts` - Export público

3. **Implementamos renderizado SVG**
   - Proyección Mercator estándar
   - Carga de world-atlas desde CDN (unpkg.com)
   - Conversión TopoJSON → GeoJSON con `feature()`
   - Renderizado de países como `<path>` SVG
   - ViewBox para responsividad

4. **Conectamos world-atlas con diccionario Trawel**
   - El dataset world-atlas usa códigos UN M.49 (campo `id` en features)
   - Nuestro diccionario tiene `unM49` en cada país
   - Función `getCountryByUnM49()` hace el mapeo:
     ```typescript
     // world-atlas feature.id = "724" → España
     const trawelCountry = getCountryByUnM49(feature.id);
     ```
   - Si no encuentra país → muestra como "No disponible"

5. **Aplicamos colores desde mapTheme**
   - `default` - Países sin información en Trawel
   - `active` (azul) - España, Japón, Perú
   - `comingSoon` (gris) - Francia, Italia
   - `hover` (naranja) - Al pasar el cursor
   - Bordes blancos desde tema

6. **Implementamos tooltip**
   - Posición fija al cursor (clientX/clientY)
   - Contenido dinámico según estado:
     - País activo: nombre + "X destinos disponibles"
     - Próximamente: nombre + "Próximamente"
     - No disponible: "País no disponible"
   - Estilos desde mapTheme (colores, padding, border-radius)

7. **Implementamos navegación por click**
   - Solo países con `status: 'active'` navegan
   - Usa `useNavigate` de React Router
   - Navega a `/pais/${slug}`
   - Países `comingSoon` o `disabled` no navegan (cursor default)

8. **Integramos en HomePage**
   - Reemplaza placeholder anterior
   - Mantiene lista de países debajo como fallback
   - Estadísticas de países (activos/próximamente/total) visibles

### Cómo funciona la conexión UN M.49

```
1. world-atlas.json tiene features con id = código UN M.49
   { "type": "Feature", "id": "724", ... }  // España

2. Nuestro diccionario tiene unM49 en cada país
   { id: 'ES', unM49: '724', slug: 'espana', status: 'active' }

3. En el renderizado:
   const trawelCountry = getCountryByUnM49(feature.id) // '724' → España

4. Si encuentra: aplica colores y comportamiento según status
   Si no encuentra: aplica color default y "no disponible"
```

### Decisiones técnicas registradas

**DA-012: Dataset world-atlas desde CDN**
- Contexto: Necesitamos datos geoespaciales sin aumentar el bundle
- Decisión: Cargar desde https://unpkg.com/world-atlas@2/countries-110m.json
- Consecuencias: Requiere conexión a internet, loading state necesario

**DA-013: Proyección Mercator**
- Contexto: Elegir proyección cartográfica
- Decisión: Mercator estándar (d3.geoMercator)
- Consecuencias: Áreas polares distorsionadas, pero familiar para usuarios

### Archivos creados/modificados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `package.json` | ✅ Modificado | Dependencias d3, topojson-client añadidas |
| `WorldMap.tsx` | ✅ Creado | Componente mapa con D3 |
| `WorldMap.module.css` | ✅ Creado | Estilos del mapa |
| `HomePage.tsx` | ✅ Modificado | Integra WorldMap, mantiene lista países |

### Criterios de éxito verificados

- ✅ `npm run build` pasa sin errores
- ✅ Mapa mundial visible en HomePage
- ✅ España, Japón, Perú aparecen en azul (active)
- ✅ Francia, Italia aparecen en gris (comingSoon)
- ✅ Hover muestra tooltip con información
- ✅ Click en activo navega a página de país
- ✅ Click en comingSoon no navega
- ✅ Colores desde mapTheme
- ✅ SVG responsive

### Próximos pasos

1. **Mejoras de UX en mapa**
   - Animaciones suaves en hover
   - Indicador visual de país seleccionado
   - Leyenda de colores

2. **Datos de ciudades**
   - Crear estructura para ciudades
   - Datos de Madrid, Barcelona, Tokio, etc.
   - Mostrar en CountryPage

3. **Optimizaciones**
   - Cache de datos geoespaciales
   - Lazy loading del mapa
   - Error boundary para fallos de carga

---

*Entradas de bitácora - Trawel v2.0*