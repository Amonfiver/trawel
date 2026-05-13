# Skill: Small Steps Planning

## Propósito

Dividir tareas medianas o grandes en cambios pequeños, verificables y fáciles de revertir.

## Cuándo usarlo

- La tarea toca más de 2-3 archivos.
- Hay riesgo de mezclar refactor, UI, datos o configuración.
- El prompt incluye varias peticiones encadenadas.
- Hay cambios pendientes en Git y conviene aislar el siguiente bloque.

## Qué revisar

- Estado inicial con `git status --short`.
- Archivos exactos que se van a tocar.
- Qué queda explícitamente fuera de alcance.
- Si hace falta checkpoint antes de seguir.
- Validación mínima esperada para cada bloque.

## Cómo validar

1. Completar un bloque pequeño.
2. Revisar `git diff --stat` y `git diff`.
3. Ejecutar `npm run lint` y `npm run build` cuando aplique.
4. Documentar en `docs/BITACORA.md` si el cambio es significativo.

## Qué NO hacer

- No mezclar cambios funcionales, CI, documentación y mapas en un mismo bloque.
- No tocar más archivos “ya que estamos”.
- No seguir acumulando cambios si lint/build fallan.
- No hacer commit sin petición explícita del usuario.

## Referencias

- `docs/base-standards.md`
- `ai-specs/skills/checkpoint-before-change.md`
