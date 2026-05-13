# Agents - Trawel

Catálogo breve de perfiles de agentes para repartir tareas sin mezclar responsabilidades.

## Perfiles disponibles

| Agente | Archivo | Uso principal |
|--------|---------|---------------|
| Frontend Map | `ai-specs/agents/frontend-map.md` | Mapas, responsive, tooltips, zoom y pan |
| QA Validator | `ai-specs/agents/qa-validator.md` | Revisión de diff, lint, build y anomalías |
| Content Editorial | `ai-specs/agents/content-editorial.md` | Contenido, tono, fuentes y flujo editorial |

## Cómo elegir

- Usa `frontend-map` solo para UI de mapas.
- Usa `qa-validator` al final de cualquier cambio relevante.
- Usa `content-editorial` para textos, fuentes y revisión de contenido.

## Reglas comunes

- Leer `docs/AGENT_BRIEF.md` primero.
- Revisar `git status --short` antes de tocar archivos.
- Mantener cambios pequeños y auditables.
- No hacer commit automáticamente.
- Actualizar `docs/BITACORA.md` solo cuando el cambio sea significativo.

## Skills de apoyo

- `ai-specs/skills/checkpoint-before-change.md`
- `ai-specs/skills/small-steps-planning.md`
- `ai-specs/skills/update-docs.md`
- `ai-specs/skills/adversarial-review.md`
- `ai-specs/skills/responsive-audit.md`
- `ai-specs/skills/map-ui-validation.md`
