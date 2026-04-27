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

### Cómo probar

1. Abrir http://localhost:5173
2. Ver lista de países (España, Japón, Perú)
3. Click en cualquier país → va a página de país
4. Click en "Volver al mapa" → regresa a inicio
5. URLs funcionan:
   - `/pais/espana`
   - `/pais/japon`
   - `/pais/peru`

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

*Entradas de bitácora - Trawel v2.0*