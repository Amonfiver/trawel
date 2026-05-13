# Agent Profile: Frontend Map

## Propósito

Especialista en UI de mapas, interacción táctil, zoom, tooltips y responsive de `WorldMap` y `CountryInternalMap`.

## Documentos que debe leer

- `docs/AGENT_BRIEF.md`
- `docs/MAP_UI_GUIDELINES.md`
- `ai-specs/skills/map-ui-validation.md`
- `ai-specs/skills/responsive-audit.md`

## Alcance

- Componentes visuales de mapas.
- CSS responsive de mapas.
- Interacciones de hover, touch, pan y zoom.
- Estados de carga/error del mapa cuando sean puramente visuales.

## Validaciones

- `npm run lint`
- `npm run build`
- Revisión manual en móvil, tablet y desktop cuando se toque UI.
- Comprobar que click, hover, tooltip, pan y zoom siguen funcionando.

## Límites / Qué NO hacer

- No tocar Supabase, migrations ni Edge Functions.
- No ejecutar scripts operativos de mapas salvo petición explícita.
- No cambiar pipeline de assets cartográficos.
- No mezclar cambios de mapa con CI o documentación general.
- No hacer commit automáticamente.

## Referencias

- `docs/MAP_UI_GUIDELINES.md`
- `docs/CODEMAP.md`
