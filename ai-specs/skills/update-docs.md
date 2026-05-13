# Skill: Update Docs

## Propósito

Mantener la documentación viva sin convertirla en ruido ni duplicar contenido.

## Cuándo usarlo

- Cambios significativos de arquitectura, flujo público, CI o metodología.
- Fixes importantes que conviene recordar.
- Nuevas decisiones técnicas o restricciones para agentes.
- Cambios que afecten a cómo se valida o despliega el proyecto.

## Qué revisar

- `docs/BITACORA.md` reciente, no toda la bitácora.
- Si el cambio requiere `docs/CODEMAP.md`, `docs/DECISIONES.md` o `docs/AGENT_BRIEF.md`.
- Que los enlaces apunten a archivos reales.
- Que no haya la misma explicación repetida en varios documentos.

## Cómo validar

- Revisar `git diff -- docs`.
- Confirmar que la bitácora refleja la realidad final del repositorio.
- Ejecutar `npm run lint` y `npm run build` si la tarea lo pide o si hay riesgo de tooling.

## Qué NO hacer

- No reescribir documentación completa por un cambio pequeño.
- No copiar la bitácora dentro de otros docs.
- No documentar cambios triviales que ya quedan claros en el commit.
- No añadir enlaces a archivos que no existen.

## Referencias

- `docs/base-standards.md`
- `docs/WORKFLOW_AI.md`
