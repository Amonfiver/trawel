# Skill: Adversarial Review

## Propósito

Revisar críticamente un cambio antes de declararlo listo, buscando errores sutiles, scope creep y archivos inesperados.

## Cuándo usarlo

- Antes de entregar una tarea.
- Después de que lint/build pasen.
- Cuando el cambio toca configuración, rutas, mapas, datos o documentación compartida.
- Si el diff es más grande de lo previsto.

## Qué revisar

- `git diff --stat`: que solo aparezcan archivos esperados.
- `git diff`: que no haya cambios accidentales, restos de herramienta o duplicación.
- `git status --short`: que no existan archivos no trackeados inesperados.
- Warnings nuevos frente a warnings conocidos.
- Texto duplicado, fragmentos partidos o contenido copiado en el archivo incorrecto.

## Cómo validar

```bash
npm run lint
npm run build
git status --short
```

El resultado aceptable es 0 errores. Los warnings conocidos pueden quedar si están documentados y no vienen del cambio actual.

## Qué NO hacer

- No arreglar problemas fuera de scope sin avisar.
- No ocultar errores con `any`, comentarios o reglas desactivadas.
- No aprobar un cambio solo porque compila.
- No hacer commit automáticamente.

## Referencias

- `docs/base-standards.md`
- `ai-specs/skills/update-docs.md`
