# Codex - Uso en Trawel

Guía breve para usar Codex en este proyecto React + Vite + TypeScript.

## Para qué usarlo

- Cambios pequeños y auditables.
- Revisar diffs y validar lint/build.
- Crear o ajustar documentación técnica.
- Arreglos quirúrgicos con contexto claro.

## Contexto mínimo recomendado

Antes de pedir un cambio:

- Estado de `git status --short`.
- Archivo o carpeta exacta que se puede tocar.
- Qué no se debe tocar.
- Validación esperada.
- Extracto reciente de `docs/BITACORA.md` si aporta contexto.

## Flujo recomendado

1. Leer `docs/AGENT_BRIEF.md`.
2. Revisar el skill o agente aplicable en `ai-specs/`.
3. Hacer un cambio pequeño.
4. Ejecutar `npm run lint` y `npm run build` cuando aplique.
5. Revisar `git diff`.
6. Entregar sin commit salvo instrucción explícita.

## Qué evitar

- Pedir “arregla todo” sin scope.
- Mezclar CI, mapas, documentación y código funcional en un mismo bloque.
- Instalar dependencias sin aprobación.
- Hacer commits automáticos.
- Releer toda la bitácora cuando basta con las últimas entradas.

## Prompt base

```text
Actúa como agente técnico senior en Trawel.
Antes de tocar: revisa git status y los docs relevantes.
Tarea: [descripción concreta].
No tocar: [límites explícitos].
Validar con: npm run lint, npm run build.
No hagas commit.
```

## Referencias

- `docs/WORKFLOW_AI.md`
- `docs/base-standards.md`
- `docs/AGENTS.md`
