# Workflow AI - Trawel

Guía breve para trabajar con agentes en Trawel sin perder trazabilidad ni mezclar alcances.

## 1. Diagnóstico inicial

Antes de tocar archivos:

```bash
git status --short
```

Leer solo el contexto necesario: `docs/AGENT_BRIEF.md`, la bitácora reciente y el documento específico de la tarea.

## 2. Definir alcance

Dejar claro:

- Qué se va a cambiar.
- Qué no se va a tocar.
- Qué archivos son sensibles.
- Qué validación demostrará que el bloque está listo.

## 3. Checkpoint si aplica

Usar `ai-specs/skills/checkpoint-before-change.md` si hay cambios pendientes no relacionados o si la tarea va a tocar varios archivos.

## 4. Plan pequeño

Usar `ai-specs/skills/small-steps-planning.md` para dividir cambios medianos en bloques revisables.

## 5. Ejecutar el cambio

Mantener el diff acotado. No instalar dependencias, cambiar workflows, tocar mapas o modificar Supabase si no está explícito en la tarea.

## 6. Actualizar documentación

Usar `ai-specs/skills/update-docs.md` cuando el cambio sea significativo. `docs/BITACORA.md` registra el contexto; otros documentos solo se actualizan si realmente cambian las reglas o la estructura.

## 7. Validar

Validación mínima habitual:

```bash
npm run lint
npm run build
```

Para UI responsive o mapas, sumar revisión manual según:

- `ai-specs/skills/responsive-audit.md`
- `ai-specs/skills/map-ui-validation.md`

## 8. Revisión final

Antes de entregar:

- Revisar `git diff --stat`.
- Revisar `git status --short`.
- Confirmar qué se tocó y qué no.
- No hacer commit salvo petición explícita.

## Referencias

- `docs/base-standards.md`
- `docs/AGENTS.md`
- `docs/codex.md`
- `ai-specs/skills/`
