# Base Standards - Trawel AI-Specs

> **Propósito:** Reglas base mínimas para trabajo con agentes IA.
> **Alcance:** Todos los agentes y todos los cambios en Trawel.
> **Decisiones:** Preferir claridad sobre "magia". El contexto cuesta tokens.
> **Limitaciones:** No reemplaza criterio humano. Es guardarraíl, no piloto automático.

---

## 1. Checkpoints antes de cambios grandes

Antes de tocar código:

```bash
git status --short
```

Si hay cambios no relacionados:
- Hacer commit checkpoint primero
- O stash si son temporales

**Ver skill:** `ai-specs/skills/checkpoint-before-change.md`

---

## 2. Cambios pequeños ("10 ladrillos")

| Tipo de cambio | Máximo archivos | Razón |
|----------------|-----------------|-------|
| Fix simple | 1-2 | Foco, rollback fácil |
| Feature aislada | 2-4 | Mantiene contexto mental |
| Refactor | 3-5 | Puede afectar imports |
| Cambio arquitectura | 5-8 | Requiere revisión intermedia |

**Regla:** Si tocas más de 5 archivos sin commit intermedio, detente.

**Ver skill:** `ai-specs/skills/small-steps-planning.md`

---

## 3. Commits en español

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Checkpoint | `checkpoint: [contexto]` | `checkpoint: antes de refactor de WorldMap` |
| Feature | `feat: [descripción]` | `feat: añade zoom táctil a CountryInternalMap` |
| Fix | `fix: [descripción]` | `fix: corrige tooltip en móvil` |
| Docs | `docs: [descripción]` | `docs: actualiza MAP_UI_GUIDELINES` |
| Refactor | `refactor: [descripción]` | `refactor: simplifica lógica de zoom` |

---

## 4. Documentación viva

Actualizar **solo** cuando aplica:

| Documento | Cuándo actualizar |
|-----------|-------------------|
| `BITACORA.md` | Cambio significativo, fix importante, decisión técnica |
| `CODEMAP.md` | Nueva feature/namespace, cambio de estructura |
| `AGENT_BRIEF.md` | Cambio de flujo público, decisión importante (DA-0XX) |
| `DECISIONES.md` | Nueva decisión técnica con ID |

**Ver skill:** `ai-specs/skills/update-docs.md`

---

## 5. No tocar muchos archivos sin necesidad

Anti-patrón:
```
"Cambio en 15 archivos porque así queda más limpio"
```

Patrón correcto:
```
Paso 1: Cambio en 3 archivos + validar
Paso 2: Commit
Paso 3: Siguientes 3 archivos
```

---

## 6. Testing/validación antes de "listo"

Antes de declarar una tarea completada:

```bash
npm run lint    # Debe pasar
npm run build   # Debe pasar
```

**Checklist mínimo:**
- [ ] Build exitoso
- [ ] Lint sin errores (warnings documentados OK)
- [ ] Cambio hace lo que pide el prompt
- [ ] No hay cambios inesperados en el diff

**Ver skill:** `ai-specs/skills/adversarial-review.md`

---

## 7. Responsive/móvil como prioridad

En Trawel:
- **Móvil es crítico** (exploración espontánea)
- **Tablet es alta** (planning en grupo)
- **Desktop es necesaria** (planning detallado)

**Regla:** No declares UI "lista" sin prueba móvil mínima (Chrome DevTools iPhone SE).

**Ver skill:** `ai-specs/skills/responsive-audit.md`

---

## 8. Ahorro de tokens/contexto

### En prompts

❌ **Ineficiente:**
```
"Lee toda la bitácora, el CODEMAP, la arquitectura, 
las decisiones pasadas, y luego haz este cambio..."
```

✅ **Eficiente:**
```
"Contexto relevante:
- BITACORA.md últimas 3 entradas
- MAP_UI_GUIDELINES.md sección X

Tarea: [descripción concreta]"
```

### En documentación

- No dupliques información entre docs
- Usa referencias: "Ver `ARCHITECTURE.md` para..."
- BITACORA es el diario, no el archivo de diseño

---

## 9. Claridad por encima de magia

Preferir:

```typescript
// ✅ Explícito, legible
if (country.status === 'active') {
  return <ActiveView country={country} />;
}

// ❌ "Elegante" pero confuso
const View = views[country.status] || DefaultView;
return <View {...country} />;
```

Preferir:

```bash
# ✅ Comando claro
npm run build

# ❌ Script "inteligente" que hace 5 cosas
npm run magic-deploy
```

---

## Checklist de base

```
Antes de cualquier cambio:
☐ git status --short revisado
☐ Checkpoint si hay cambios no relacionados

Durante el cambio:
☐ Máximo 5 archivos sin commit intermedio
☐ Commits en español con prefijo claro

Antes de "listo":
☐ npm run lint pasa
☐ npm run build pasa
☐ Prueba móvil mínima (si es UI)
☐ BITACORA.md actualizado (si aplica)
```

---

## Referencias

- `ai-specs/skills/` — Skills específicos por situación
- `docs/WORKFLOW_AI.md` — Flujo operativo completo
- `docs/AGENTS.md` — Perfiles de agentes