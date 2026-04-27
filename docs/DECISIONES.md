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

## Decisiones pendientes

| ID | Descripción | Bloqueado por | Fecha estimada |
|----|-------------|---------------|----------------|
| DP-001 | ¿Usar CSS Modules o Styled Components? | Necesitamos probar ambos approaches | 2026-04-30 |
| DP-002 | ¿Cargar world-atlas desde CDN o bundle local? | Ver performance en rede lenta | 2026-04-30 |
| DP-003 | ¿Implementar CountryMap en Fase 1 o Fase 2? | Ver complejidad de datos geoespaciales | 2026-05-05 |

---

*Registro de decisiones v1.0 - Trawel*