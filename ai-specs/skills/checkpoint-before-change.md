# Skill: Checkpoint Before Change

> **Propósito:** Establecer un punto de recuperación seguro antes de cambios significativos.
> **Alcance:** Toda modificación que toque más de 3 archivos o lógica crítica.
> **Decisiones:** Git como única fuente de verdad. Commits en español para consistencia con el equipo.
> **Limitaciones:** No reemplaza revisión de código. No garantiza ausencia de bugs.

---

## ¿Cuándo usarlo?

| Situación | ¿Checkpoint? |
|-----------|--------------|
| Cambio en 1-2 archivos simples | Opcional |
| Cambio en 3+ archivos | ✅ Obligatorio |
| Modifica lógica de mapas | ✅ Obligatorio |
| Cambia rutas/navegación | ✅ Obligatorio |
| Toca Supabase/schema | ✅ Obligatorio |
| Refactor de componente usado en múltiples páginas | ✅ Obligatorio |
| Antes de probar algo experimental | ✅ Recomendado |

---

## Comando recomendado

```bash
git status --short
```

**Interpreta la salida:**
- `M` = modificado
- `??` = nuevo sin trackear
- `A` = añadido al stage
- `D` = eliminado

---

## ¿Cuándo hacer commit checkpoint?

Si `git status` muestra cambios no commiteados que NO forman parte de tu tarea actual:

```bash
# 1. Guardar cambios existentes
git add -A
git commit -m "checkpoint: estado antes de [descripción breve]"

# 2. Verificar punto limpio
git status --short  # Debe estar vacío o mostrar solo lo esperado
```

---

## Cómo nombrar commits en español

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Checkpoint | `checkpoint: [contexto]` | `checkpoint: antes de refactor de WorldMap` |
| Feature | `feat: [descripción]` | `feat: añade zoom táctil a CountryInternalMap` |
| Fix | `fix: [descripción]` | `fix: corrige tooltip en móvil` |
| Docs | `docs: [descripción]` | `docs: actualiza MAP_UI_GUIDELINES` |
| Refactor | `refactor: [descripción]` | `refactor: simplifica lógica de zoom` |

---

## Qué NO hacer

❌ No uses `--amend` en commits checkpoint (pierdes el punto de recuperación).
❌ No hagas checkpoint con código roto que no compila (`npm run build` debe pasar).
❌ No acumules 10 cambios sin commit "porque son pequeños".
❌ No uses mensajes vagos como "wip", "cambios", "update".

---

## Rollback rápido

Si algo sale mal:

```bash
# Ver últimos commits
git log --oneline -5

# Volver al checkpoint
git reset --hard HEAD~1

# O recuperar archivo específico
git checkout checkpoint-hash -- path/al/archivo.ts
```

---

## Referencias

- `docs/base-standards.md` — Estándares base del proyecto
- `docs/WORKFLOW_AI.md` — Flujo operativo completo