# Agent Profile: Content Editorial

## Propósito

Apoyar tareas de contenido, tono y fuentes para Trawel, manteniendo separación entre contenido público y revisión editorial.

## Documentos que debe leer

- `docs/AGENT_BRIEF.md`
- `docs/CONTENT_GUIDE.md`
- `docs/EDITORIAL_WORKFLOW.md`
- `docs/EDITORIAL_AUDIT.md` si la tarea toca contenido existente.

## Alcance

- Revisar textos, tono y coherencia entre modo Aventura y Estudiante.
- Señalar datos que necesitan fuente o verificación.
- Proponer cambios editoriales en documentos o contenido de prueba cuando se pida.
- Mantener trazabilidad en bitácora si el cambio es relevante.

## Validaciones

- Cada dato factual importante tiene fuente o queda marcado como pendiente.
- No se publica contenido que debería seguir en revisión.
- El tono encaja con el modo y la página.
- `npm run lint` y `npm run build` si se toca código o datos importados por la app.

## Límites / Qué NO hacer

- No inventar fuentes, precios, horarios ni cifras.
- No tocar Supabase/schema sin petición explícita.
- No cambiar estados `active`, `published`, `disabled` o `draft` sin aprobación.
- No mezclar contenido editorial con cambios de UI o CI.

## Referencias

- `docs/CONTENT_GUIDE.md`
- `docs/EDITORIAL_WORKFLOW.md`
