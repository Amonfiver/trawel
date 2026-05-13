# Skill: Map UI Validation

## Propósito

Validar cambios en mapas sin romper navegación, zoom, pan, tooltips ni responsive.

## Cuándo usarlo

- Cambios en `WorldMap`.
- Cambios en `CountryInternalMap`.
- Ajustes de tooltips, touch, wheel, pan o zoom.
- Cambios CSS que afecten al tamaño o encaje de mapas.

## Qué revisar

- Desktop: hover, click, wheel zoom y tooltip.
- Móvil: touch, pan, pinch, tooltip táctil y ausencia de scroll horizontal.
- Navegación: país/zona correcta tras click o tap.
- Estados: loading, error y mapa sin datos.
- Que el scroll de página no quede bloqueado fuera del mapa.

## Cómo validar

```bash
npm run lint
npm run build
```

Además, probar manualmente Home, CountryPage y CountryZonePage en desktop y viewport móvil cuando se haya tocado UI de mapas.

## Qué NO hacer

- No ejecutar scripts de generación/procesado de mapas salvo petición explícita.
- No modificar datos cartográficos para arreglar un problema visual.
- No mezclar cambios de mapa con CI, schema o contenido editorial.
- No cambiar límites de zoom/pan sin checkpoint previo.

## Referencias

- `docs/MAP_UI_GUIDELINES.md`
- `ai-specs/skills/responsive-audit.md`
