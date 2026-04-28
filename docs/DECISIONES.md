# Registro de Decisiones - Trawel

## Cómo usar este documento

Este archivo registra decisiones técnicas y de diseño importantes del proyecto. Cada decisión incluye:
- Contexto: ¿Qué problema estábamos resolviendo?
- Decisión: ¿Qué elegimos?
- Consecuencias: ¿Qué implica esta elección?

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

### DA-002: D3 + TopoJSON + SVG para mapas

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitamos renderizar un mapa mundial interactivo con hover/click por país. La versión Websim ya usaba esta aproximación.

**Decisión:** Usar D3.js v7 con TopoJSON y SVG renderizado manualmente.

**Razones:**
- Probado en la versión Websim: funciona bien para hover/click por país
- Control total sobre el renderizado (no dependemos de librerías de mapas de terceros)
- Flexible: podemos personalizar colores, estados, tooltips
- TopoJSON es eficiente en tamaño de datos
- SVG es vectorial y se ve bien en cualquier resolución

**Consecuencias:**
- Curva de aprendizaje de D3 para desarrolladores nuevos
- Bundle size: D3 es pesado (pero podemos importar solo módulos necesarios)
- Responsividad manual: debemos manejar resize del SVG
- Accesibilidad: debemos añadir ARIA labels manualmente

**Alternativas consideradas:**
- Leaflet: más para mapas de calles, menos flexible para estilos personalizados
- Mapbox/MapLibre: requieren tokens, más complejos
- Google Maps: costo, dependencia de terceros, poco personalizable
- Canvas en lugar de SVG: más performante con muchos elementos, pero más difícil de debuggear

**Reversibilidad:** Baja. Cambiar la tecnología de mapas sería reescribir el componente completo.

---

### DA-003: No copiar código de la versión Websim

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Tenemos una versión funcional en trawel-websim-original que podríamos reutilizar.

**Decisión:** No copiar directamente el código de Websim. Rehacer desde cero con mejores prácticas.

**Razones:**
- Código original acoplado, sin tipos, con estilos hardcodeados
- Queremos arquitectura limpia desde el inicio
- Separación de responsabilidades (UI, datos, configuración)
- Sistema de temas configurable
- TypeScript desde el inicio

**Consecuencias:**
- Más tiempo inicial de desarrollo
- Mejor mantenibilidad a largo plazo
- Código más testeable
- Otros agentes pueden entender y continuar más fácilmente

**Qué SÍ aprovechamos de Websim:**
- Concepto validado: mapa mundial con hover/click funciona
- Elección de tecnología de mapa (D3/TopoJSON)
- UX básica: tooltip, cambio de color en hover

**Reversibilidad:** No aplica. Es una decisión de proceso, no técnica.

---

### DA-004: Datos estáticos JSON/TS, sin base de datos

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitamos almacenar información de países, ciudades y aventuras.

**Decisión:** Usar archivos JSON/TypeScript estáticos. No usar base de datos en el MVP.

**Razones:**
- Contenido curado y limitado (3-5 países inicialmente)
- No hay contenido generado por usuarios
- No necesitamos búsqueda compleja ni filtros dinámicos
- Deploy más simple (solo archivos estáticos)
- TypeScript da type safety a los datos

**Estructura de datos:**
```
src/data/
  countries/
    spain.ts
    japan.ts
    peru.ts
  index.ts  # Exporta todo
```

**Consecuencias:**
- Agregar/actualizar contenido requiere deploy
- No hay CMS fácil para no-desarrolladores
- Búsqueda global debe implementarse sobre los datos estáticos

**Cuándo reconsiderar:**
- Más de 20 países con contenido
- Necesitamos CMS para editores de contenido
- Features de usuario (favoritos, reviews) requieren persistencia

**Reversibilidad:** Alta. Los datos estáticos pueden migrarse fácilmente a cualquier base de datos.

---

### DA-005: Activar solo países con contenido, mostrar resto como "Próximamente"

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** El mapa muestra todos los países del mundo, pero solo algunos tienen contenido Trawel.

**Decisión:** Distinguir visualmente países activos vs. sin contenido. Click en activos navega, click en inactivos muestra "Próximamente".

**Razones:**
- Mapa completo es visualmente atractivo y da sensación de alcance global
- Evita frustración de click en país vacío que lleva a página 404
- "Próximamente" crea expectativa y permite feedback de usuarios
- Prioriza calidad sobre cantidad

**Estados visuales del país:**
- `active`: Tiene contenido, click navega
- `comingSoon`: Visible en mapa, hover muestra tooltip "Próximamente", click no navega
- `hidden`: No aparece en mapa (para países con restricciones legales, etc.)

**Consecuencias:**
- Necesitamos diccionario de países con campo `status`
- Tooltip debe adaptarse según estado (mostrar info enriquecida o "Próximamente")

**Reversibilidad:** Alta. Cambiar un país de estado es modificar un campo en el diccionario.

---

### DA-006: Diccionario propio de países, no usar nombres de world-atlas

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** world-atlas (fuente de datos geoespaciales) solo provee nombres en inglés y IDs numéricos UN M.49.

**Decisión:** Crear diccionario propio `countries.ts` con nombres en español, slugs para URLs, ISO codes, y metadatos Trawel.

**Estructura:**
```typescript
{
  id: 'ES',           // ISO 3166-1 alpha-2
  name: 'España',     // Nombre en español
  slug: 'espana',     // Para URLs
  status: 'active',
  capital: 'Madrid',
  shortDescription: '...',
  totalDestinations: 3,
  // ...
}
```

**Razones:**
- Control total sobre los nombres mostrados
- URLs amigables en español (/pais/espana, no /pais/spain)
- Podemos añadir metadatos (continente, capital, descripción)
- Facilita internacionalización futura (añadir nameEn, nameFr, etc.)
- Desacopla datos de contenido de datos geoespaciales

**Consecuencias:**
- Mantenimiento manual del diccionario
- Necesitamos mapear IDs de world-atlas a nuestros ISO codes

**Reversibilidad:** Media. El diccionario es la fuente de verdad, cambiarlo afecta URLs y datos.

---

### DA-007: Sistema de tema configurable para mapas

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** La versión Websim tenía colores hardcodeados (`steelblue`, `orange`) en el código JavaScript.

**Decisión:** Crear sistema de temas con configuración centralizada. Nada de estilos hardcodeados en la lógica D3.

**Principios:**
- Todos los colores vienen del tema
- Estados visuales definidos explícitamente (default, active, hover, selected, highlighted)
- Fácil cambiar todo el look sin tocar componentes
- Soporte para múltiples temas (light, dark, seasonal)

**Estructura del tema:**
```typescript
interface MapTheme {
  colors: {
    default: string;
    active: string;
    hover: string;
    selected: string;
    highlighted: string;
    border: string;
    borderWidth: number;
  };
  tooltip: { ... };
  animation: { ... };
}
```

**Consecuencias:**
- Más código inicial (definir interfaces, tema default)
- Cambios de diseño son modificaciones en un solo archivo
- Preparado para temas múltiples en el futuro

**Reversibilidad:** Alta. El tema es inyectado, puede cambiarse o ignorarse.

---

### DA-008: Feature-based folder structure

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitamos organizar el código de forma escalable y mantenible.

**Decisión:** Usar estructura por features (dominios) en lugar de por tipos de archivo.

**Estructura:**
```
src/features/
  map/           # Todo lo relacionado con mapas
  countries/     # Todo lo relacionado con países
  cities/        # Todo lo relacionado con ciudades
  adventures/    # Todo lo relacionado con aventuras
```

Cada feature contiene:
- `components/` - Componentes React específicos
- `hooks/` - Custom hooks
- `data/` - Datos estáticos y tipos
- `utils/` - Funciones auxiliares
- `config/` - Configuración específica

**Razones:**
- Cohesión: todo lo relacionado con mapas está en un lugar
- Descubrimiento: fácil encontrar código relacionado
- Escalabilidad: nuevas features no contaminan otras
- Colaboración: diferentes personas pueden trabajar en features diferentes

**Consecuencias:**
- Algunos componentes compartidos pueden no tener lugar claro (van a `components/shared/`)
- Imports pueden ser más largos (pero se resuelve con aliases)

**Reversibilidad:** Baja. Cambiar estructura de carpetas en proyecto en curso es difícil.

---

### DA-009: Campos ISO estandarizados en tipos de país

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitamos integrar con world-atlas que usa códigos UN M.49 para identificar países.

**Decisión:** Añadir campos ISO explícitos: `isoAlpha2`, `isoAlpha3`, `unM49` al tipo Country.

**Estructura:**
```typescript
interface Country {
  isoAlpha2: string;  // ES, JP, PE
  isoAlpha3: string;  // ESP, JPN, PER
  unM49: string;      // 724, 392, 604 (usado por world-atlas)
  // ...
}
```

**Razones:**
- Mapeo directo con datos geoespaciales externos (world-atlas)
- Consistencia con estándares internacionales
- Búsqueda por diferentes criterios (ISO, UN, slug)
- Facilita debugging y trazabilidad

**Consecuencias:**
- Más campos que mantener sincronizados
- Duplicación de información (isoAlpha2 = id en la práctica)
- Mayor claridad en el código cuando se integra con D3

**Reversibilidad:** Media. Cambiar la estructura de tipos afecta todo el sistema de países.

---

### DA-010: Separación name/displayName en tipos de país

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitamos nombres técnicos para código (variables, keys) y nombres para mostrar en UI.

**Decisión:** Separar en dos campos: `name` (técnico, kebab-case) y `displayName` (presentación, español).

**Estructura:**
```typescript
{
  name: 'spain',           // Para código: variables, keys
  displayName: 'España',   // Para UI: títulos, tarjetas
  slug: 'espana',          // Para URLs
}
```

**Razones:**
- URLs limpias y consistentes con el slug
- Presentación localizada en español
- Identificadores técnicos en inglés (convención de código)
- Evita transformaciones en runtime (toLowerCase, replace, etc.)

**Consecuencias:**
- Más campos en el diccionario
- Convención clara: name en inglés, displayName en español
- Código más legible: `country.name` vs `country.displayName.toLowerCase()`

**Reversibilidad:** Media. Cambiar requiere actualizar todas las referencias en el código.

---

### DA-011: Tema de mapa centralizado en objeto configurable

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Evitar hardcodeo de colores en la lógica de renderizado D3. Queremos poder cambiar el aspecto del mapa sin tocar el código de renderizado.

**Decisión:** Crear objeto `MapTheme` completo con colores, tooltip y animaciones, exportado desde archivo de configuración.

**Estructura:**
```typescript
// map/config/mapTheme.ts
export const defaultMapTheme: MapTheme = {
  colors: {
    default: '#cbd5e1',
    active: '#3b82f6',
    hover: '#f59e0b',
    // ...más estados
    border: '#ffffff',
    borderWidth: 0.5,
  },
  tooltip: { /* ... */ },
  animation: { /* ... */ },
};
```

**Razones:**
- Cambios de diseño sin tocar código de renderizado
- Preparado para múltiples temas (default, minimal, dark)
- Type safety con interfaz MapTheme
- Fácil de documentar y mantener

**Consecuencias:**
- Import explícito del tema en componentes
- Tema debe pasarse como prop o usarse context
- Más código inicial (definir toda la estructura)

**Reversibilidad:** Alta. El tema es opcional, puede ignorarse o reemplazarse.

---

### DA-012: Dataset world-atlas desde CDN

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitamos datos geoespaciales (TopJSON) para renderizar el mapa mundial. Incluirlo en el bundle aumentaría significativamente el tamaño.

**Decisión:** Cargar world-atlas desde CDN (unpkg.com) en tiempo de ejecución.

**Implementación:**
```typescript
const WORLD_ATLAS_URL = 'https://unpkg.com/world-atlas@2/countries-110m.json';
// Carga con fetch en useEffect
```

**Razones:**
- Reduce bundle inicial (~100KB menos)
- Aprovecha cache del CDN
- Dataset probado y mantenido (Mike Bostock)
- Fácil actualización cambiando versión en URL

**Consecuencias:**
- Requiere conexión a internet para cargar el mapa
- Necesita loading state mientras carga
- Posible latencia inicial
- Fallback necesario si falla la carga

**Alternativas consideradas:**
- Bundle local: aumenta tamaño, pero funciona offline
- API propia: complejidad innecesaria para MVP

**Reversibilidad:** Media. Cambiar a bundle local es modificar la URL por un import.

---

### DA-013: Proyección cartográfica Mercator

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Elegir proyección cartográfica para el mapa mundial.

**Decisión:** Usar proyección Mercator estándar via `d3.geoMercator()`.

**Configuración:**
```typescript
const projection = d3.geoMercator()
  .scale(150)
  .translate([width / 2, height / 2 + 40]);
```

**Razones:**
- Proyección familiar para usuarios (Google Maps, etc. la usan)
- Mantiene ángulos, útil para navegación
- Simple de implementar con D3
- Buen balance para visualización mundial

**Consecuencias:**
- Áreas polares distorsionadas (Groenlandia aparece muy grande)
- No es equivalente (áreas no proporcionales)
- Aceptable para propósito de exploración turística

**Alternativas consideradas:**
- Natural Earth: más proporcional, pero menos familiar
- Orthographic: esférica, más compleja de navegar
- Equal Earth: proporcional, pero nueva y menos conocida

**Reversibilidad:** Alta. Cambiar proyección es cambiar una línea de código.

---

## DA-017: Modos de experiencia dual (Aventura/Estudiante)

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Trawel puede servir tanto a viajeros emocionales que buscan aventuras como a estudiantes/curiosos que buscan contenido educativo y cultural.

**Decisión:** Implementar un selector de modo de experiencia con dos opciones:
- **Aventura** (por defecto): Tono emocional, explorador, inspirador
- **Estudiante**: Tono educativo, enciclopédico, cultural

**Razones:**
- Ampliar el público objetivo sin duplicar el desarrollo
- Permite contenido dual preparado para diferentes necesidades
- Base para personalización futura según tipo de usuario
- Implementación simple con estado local (no requiere backend inicialmente)

**Implementación:**
- Feature `experienceMode` con tipos, configuración y componente selector
- Contenido diferenciado en HomePage (título, subtítulo, CTA, descripción)
- Preparado para extender a países, ciudades y aventuras
- Sin persistencia inicial (futuro: localStorage o base de datos)

**Consecuencias:**
- Doble trabajo de contenido si se quiere aprovechar el modo dual completamente
- UI debe mantenerse consistente entre modos (solo cambia el contenido/tono)
- Testing más complejo (dos flujos de usuario)

**Reversibilidad:** Media. Cambiar el sistema requiere modificar todos los componentes que usen modo dual.

---

## DA-018: Sistema i18n propio sin librería externa

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Necesitamos preparar base multidioma para futuro, pero sin aumentar bundle ni añadir complejidad innecesaria durante el MVP donde solo usaremos español.

**Decisión:** Implementar sistema i18n propio simple con TypeScript, sin depender de librerías como i18next o react-intl.

**Implementación:**
- Tipos: `Locale`, `LocalizedText`, `LocaleConfig`
- Funciones: `getLocalizedText`, `normalizeLocale`, `isSupportedLocale`
- Fallback en cascada: solicitado → español → inglés → primer disponible → ''
- Traducciones parciales permitidas (no exige todos los idiomas)

**Razones:**
- Bundle más ligero (sin dependencias de i18n)
- Control total sobre estrategia de fallback
- Suficiente para MVP (solo español inicialmente)
- Fácil migrar a librería externa en el futuro si se necesita funcionalidad avanzada

**Idiomas soportados:** es, en, fr, it, uk  
**Idioma por defecto:** es  
**Idioma production-ready:** solo es (los demás se activarán cuando haya contenido)

**Consecuencias:**
- Sin features avanzadas (pluralización, interpolación compleja, date/number formatting)
- Desarrollo manual de utilidades (ya implementado)
- Puede requerir migración a librería externa si las necesidades crecen

**Reversibilidad:** Media. Migrar a i18next o similar requiere cambiar imports y adaptar formato de traducciones, pero la estructura de datos (`LocalizedText`) es compatible.

---


---

## DA-019: Modelo jerárquico de datos País → Ciudad → Destino

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Necesitábamos una estructura de datos que soporte la navegación del usuario desde el mapa mundial hasta el contenido específico de cada destino turístico. El modelo debe ser escalable, permitir contenido diferenciado por modo de experiencia y prepararse para futura persistencia en base de datos.

**Decisión:** Implementar un modelo de tres niveles jerárquicos:
```
Country (País)
    └── City[] (Ciudades)
            └── Destination[] (Destinos/Atracciones)
                    └── ContentByMode (Contenido dual)
                            ├── adventure: Tono emocional
                            └── student: Tono educativo
```

**Estructura implementada:**
- **City**: id, countryId, name, slug, status (active/comingSoon/disabled), coordinates, population
- **Destination**: id, cityId, name, slug, status (published/draft/comingSoon/disabled), type (museum/temple/park/etc.), contentByMode
- **ContentByMode**: title, description, highlights, story (diferenciado por adventure/student)

**Razones:**
- Navegación intuitiva y progresiva: Mapa → País → Ciudad → Destino
- Contenido adaptado según modo de experiencia (aventura vs estudiante)
- Relaciones por IDs permiten acceso O(1) mediante diccionarios indexados
- Timestamps opcionales preparan para futura migración a base de datos
- Estados diferenciados permiten controlar visibilidad y accesibilidad de cada entidad

**Consecuencias:**
- Mayor complejidad en datos: más archivos y tipos que mantener
- Doble trabajo de contenido si se quiere aprovechar contentByMode completamente
- Necesidad de funciones utilitarias para navegar las relaciones (getCitiesByCountrySlug, getPublishedDestinationsByCity, etc.)
- Rutas anidadas más complejas (/pais/:countrySlug/:citySlug)

**Estados implementados:**
- **CityStatus**: active (clicable), comingSoon (visible, no clicable), disabled (oculto)
- **DestinationStatus**: published (visible), draft (edición), comingSoon (próximamente), disabled (oculto)

**Tipos de destino:** museum, temple, park, monument, landmark, nature, cultural

**Reversibilidad:** Baja. El modelo de datos es fundamental para toda la aplicación. Cambiarlo requeriría reescribir features cities y destinations, y modificar todas las páginas que dependen de la jerarquía.

---


---

## DA-020: Capa de acceso a datos local antes de persistencia externa

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Necesitamos preparar el proyecto Trawel para futura migración a una base de datos externa (Supabase, API REST) sin tener que reescribir las páginas. Las páginas actuales importan directamente utilidades de countries, cities y destinations, acoplando la UI al origen de datos actual.

**Decisión:** Crear una feature `travelData` que actúe como capa de abstracción/repositorio entre las páginas y los datos. Las páginas consumirán `travelData.service` en lugar de acceder directamente a los diccionarios.

**Estructura implementada:**
```
src/features/travelData/
├── types/travelData.types.ts      # Tipos agregados para páginas
├── services/travelData.service.ts # Funciones de acceso a datos
└── index.ts                       # Export público
```

**Funciones del servicio:**
- `getHomePageData()` → `HomePageData`
- `getCountryPageData(countrySlug)` → `CountryPageData`
- `getCityPageData(countrySlug, citySlug)` → `CityPageData`
- `getAdventurePageData(adventureSlug)` → `AdventurePageData`

**Razones:**
- Desacopla las páginas del origen de datos actual
- Facilita migración futura a Supabase/API sin modificar UI
- Contrato estable: las páginas dependen de tipos agregados, no de entidades individuales
- Preparado para evolución: síncrono → async → React Query

**Plan de migración documentado:**
1. **Actual (Fase 1):** Funciones síncronas con datos locales
2. **Futuro (Fase 2):** Convertir a async con fetch/Supabase
3. **Futuro (Fase 3):** Agregar React Query/SWR con caché

**Ejemplo de migración:**
```typescript
// Fase 1 (actual):
const data = getCountryPageData(countrySlug);

// Fase 2 (con API):
const data = await getCountryPageData(countrySlug);

// Fase 3 (con React Query):
const { data, isLoading, error } = useCountryPageData(countrySlug);
```

**Consecuencias:**
- Mayor indirección: las páginas no conocen la estructura interna de datos
- Build aumenta ligeramente (~1KB) por la nueva capa
- Sin caché ni optimizaciones (se agregarán con React Query en el futuro)
- Las páginas refactorizadas son más simples (un solo import vs múltiples)

**Reversibilidad:** Media. Eliminar la capa requeriría que las páginas vuelvan a importar directamente las utilidades de cada feature.

---


---

## DA-021: Modelo persistente separa entidades principales y traducciones para multidioma escalable

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Necesitamos diseñar el modelo de datos para persistencia futura (Supabase) que soporte multidioma desde el inicio, sin requerir migraciones complejas cada vez que se añade un idioma.

**Decisión:** Separar las entidades principales (`countries`, `cities`, `destinations`) de sus traducciones (`*_translations`) en tablas distintas con relación 1:N.

**Estructura propuesta:**
```
countries (datos base, no traducibles)
  └── country_translations (1:N)
        ├── locale: 'es', 'en', 'fr'
        ├── display_name
        └── description

cities (datos base)
  └── city_translations (1:N)
        ├── locale
        ├── display_name
        ├── adventure_description  (modo aventura)
        └── student_description    (modo estudiante)
```

**Razones:**
- **Escalabilidad:** Agregar idioma = insertar filas, no alterar schema
- **Normalización:** Datos comunes en tabla principal, traducibles en tabla secundaria
- **Consultas eficientes:** JOIN solo cuando se necesita traducción específica
- **Fallback simple:** Si no existe traducción, usar idioma por defecto
- **Consistencia:** Mismo patrón para todas las entidades

**Gestión de modos Aventura/Estudiante:**
- Columnas separadas: `adventure_content` y `student_content`
- Permite tener uno sin el otro (MVP: solo uno)
- Fácil consultar: `WHERE adventure_content IS NOT NULL`

**Trazabilidad editorial:**
- Tabla `destination_sources` separada (1:N)
- Guarda fuentes, URLs, autores, fechas de verificación
- Requisito para contenido profesional y verificación factual

**Consecuencias:**
- Más tablas que gestionar (vs. campos JSON monolíticos)
- JOINs necesarios en consultas con traducciones
- Mayor complejidad inicial, mayor flexibilidad futura
- Documentación más extensa requerida

**Alternativas consideradas:**
- **Campos JSONB:** Más flexible, peor rendimiento en búsquedas, sin constraints
- **Tabla única con columnas por idioma:** Simple, requiere ALTER TABLE para nuevos idiomas
- **i18n library externa:** Añade dependencia, menos control sobre schema

**Reversibilidad:** Baja. Una vez en producción con datos en múltiples idiomas, cambiar el esquema de traducciones sería complejo.

---

## DA-022: Rotación de bitácora en archivos históricos

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** La bitácora (`docs/BITACORA.md`) ha crecido a más de 1300 líneas, dificultando su consulta y mantenimiento.

**Decisión:** Implementar sistema de rotación de bitácora:
- Archivo activo (`BITACORA.md`) mantiene solo entradas recientes (~200-300 líneas)
- Archivos históricos (`BITACORA_001.md`, `BITACORA_002.md`, etc.) almacenan el historial completo
- Rotación cuando la bitácora activa supere ~1000 líneas

**Razones:**
- BITACORA.md debe ser ligera para consulta rápida del estado actual
- El historial completo debe preservarse sin perder información
- Facilita la navegación por el historial del proyecto

**Consecuencias:**
- Necesidad de crear nuevos archivos históricos periódicamente
- Referencias cruzadas entre bitácora activa e históricos
- Los archivos históricos no deben editarse (solo correcciones puntuales)

**Implementación:**
- Creado `BITACORA_001.md` con todo el historial
- `BITACORA.md` reducida a ~100 líneas con estado actual
- Regla documentada: rotar cuando supere 1000 líneas

---

## DA-023: Contrato editorial estructurado con Investighost-GPT

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Trawel necesita recibir contenido investigado de forma estructurada para poder convertirlo fácilmente en datos publicables. Se usará Investighost-GPT como investigador/redactor.

**Decisión:** Crear un contrato formal (INVESTIGHOST_CONTRACT.md) que define:
- Formato obligatorio de respuesta en 5 secciones
- Reglas anti-invención (no inventar precios, horarios, normas)
- Separación entre investigación editorial, ficha para revisión y bloque estructurado
- Estados editoriales y flujo de publicación

**Razones:**
- Estandariza la salida de investigación
- Facilita la revisión humana antes de publicar
- Reduce errores de datos no verificados
- Prepara Trawel para escalar contenido sin perder calidad

**Consecuencias:**
- Investighost-GPT debe seguir formato estricto
- Revisión humana sigue siendo obligatoria antes de publicar
- Mayor overhead inicial, mejor calidad final

**Implementación:**
- Creado `docs/INVESTIGHOST_CONTRACT.md`
- Definido formato de 5 secciones: Investigación, Ficha, Bloque estructurado, Fuentes, Pendientes
- Incluye checklist de aceptación y ejemplo completo

---

## DA-024: Trawel es plataforma de lectura, NO validador de Investighost

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Se había creado una página `/dev/import-investighost` en Trawel para validar JSON generado por Investighost-GPT. Esto confunde las responsabilidades entre las dos aplicaciones.

**Decisión:** Eliminar toda funcionalidad de validación/importación de Investighost de Trawel. Trawel es únicamente una plataforma pública de lectura y visualización.

**Responsabilidades claras:**

**Trawel (plataforma pública):**
- Lee datos desde su fuente (actualmente mocks, futuro Supabase)
- Muestra países, ciudades, destinos
- Muestra modo Aventura / modo Estudiante
- Funciona igual con 10 o 100 registros
- No valida, no importa, no edita contenido

**Investighost (herramienta editorial):**
- Investiga y genera contenido
- Valida datos antes de publicar
- Completa datos faltantes
- Guarda en base de datos (futuro)
- Es la herramienta del redactor, no pública

**Cambios realizados:**
- Eliminada página `/dev/import-investighost`
- Eliminada carpeta `src/pages/ImportInvestighostPage/`
- Consolidada capa `travelData.service.ts` como API interna única de lectura
- Documentación actualizada en BITACORA.md y CODEMAP.md

**Razones:**
- Separación de responsabilidades clara (Single Responsibility Principle)
- Trawel no se convierte en app puente ni editor
- La validación editorial pertenece a Investighost
- Trawel consume datos ya publicados, sin importar su origen
- Preparado para recibir datos de cualquier fuente (manual, Investighost, CMS futuro)

**Consecuencias:**
- Investigador usa Investighost para crear/validar contenido
- Trawel solo muestra lo que está publicado
- Flujo claro: Investighost → (revisión humana) → publicación → Trawel consume

**Reversibilidad:** Media. Si en el futuro se necesita un panel de administración en Trawel, se crearía como feature separada, no como validador de Investighost.

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

## Decisiones pendientes

| ID | Descripción | Bloqueado por | Fecha estimada |
|----|-------------|---------------|----------------|
| DP-001 | ¿Implementar persistencia de modo en localStorage? | Ver si es necesario para MVP | 2026-05-05 |
| DP-002 | ¿Contenido dual completo para países/ciudades? | Requiere más contenido escrito | 2026-05-10 |
| DP-003 | ¿Implementar CountryMap en Fase 1 o Fase 2? | Ver complejidad de datos geoespaciales | 2026-05-05 |
| DP-004 | ¿Activar inglés como segundo idioma? | Contenido traducido y estable | 2026-05-15 |

---

*Registro de decisiones v1.7 - Trawel*
