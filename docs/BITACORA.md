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

*Primera entrada - Inicio del proyecto Trawel v2.0*