# Agent Brief - Trawel

> **Start here.** Documento de entrada rápida para agentes en microtareas.
> 
> **Regla de oro:** Lee esto primero, luego los docs específicos que necesites. No releas todo.

---

## 1. Propósito del proyecto

Trawel es una **app pública de exploración de destinos de viaje**:

- Lee contenido aprobado desde Supabase
- Modo dual: Aventura (viajero) / Estudiante (educativo)
- **NO es panel editorial** → Investighost es otro proyecto
- **NO valida contenido** → Solo muestra lo aprobado

---

## 2. Flujo público actual

```
Home/Mundo → País → Zona → Aventuras futuras

/                      (HomePage)
/pais/espana           (CountryPage)
/pais/espana/zona/castilla-y-leon  (CountryZonePage)
```

**Dirección de producto:** Trawel pasa a ser principalmente interactivo por mapa. Las rutas antiguas de ciudad/aventura pueden existir, pero CountryPage ya no debe depender de tarjetones heredados como experiencia principal.

---

## 3. Fuente de datos

**Arquitectura de fuentes:**

```
travelData.service.ts  ← API interna estable (usa esto en páginas)
         ↓
   TravelDataSource (interfaz)
         ↓
   ├─ mockTravelData.source.ts    (datos locales)
   └─ supabaseTravelData.source.ts (Supabase real)
```

**Variable de entorno:**
```bash
VITE_TRAVEL_DATA_SOURCE=supabase  # o mock
```

**Regla:** Las páginas no saben de dónde vienen los datos. Usan `travelData.service.ts`.

---

## 4. Estados editoriales públicos

| Entidad | Estado | Visible en Trawel |
|---------|--------|-------------------|
| **cities** | `active` | ✅ Sí |
| | `disabled` | ❌ No (interno) |
| | `comingSoon` | ❌ No (demanda futura) |
| **destinations** | `published` | ✅ Sí |
| | `draft` | ❌ No (interno) |
| | `disabled` | ❌ No |
| | `comingSoon` | ❌ No (placeholder futuro) |

**Filtro aplicado:** SupabaseTravelDataSource filtra automáticamente.

---

## 5. Decisiones importantes

| ID | Decisión | Implicación |
|----|----------|-------------|
| **DA-027** | Mapas internos progresivos | Hoja de ruta futura, no ahora |
| **DA-028** | `comingSoon` = demanda pública | NO es fase editorial; solo registra qué buscan usuarios |
| **—** | Estética premium con v0 | No invertir en diseño final aún |
| **—** | Investighost = proyecto aparte | No mezclar código de investigación en Trawel |
| **—** | Mapa como corazón de Trawel | Flujo principal: mapa → país → zona → aventuras de viajeros |
| **—** | Aventuras de viajeros moderadas | Todo envío entra como `pending`; solo webmaster/backend aprueba |

---

## 6. Estado actual de contenido

| Ciudad/Destino | Estado Supabase | Visible en Trawel |
|----------------|-----------------|-------------------|
| Morella | `active` | ✅ Sí |
| Castillo de Morella | `published` | ✅ Sí |
| **Albarracín** | `disabled` | ❌ **No** (interno) |
| Conjunto Histórico Albarracín | `draft` | ❌ **No** (interno) |

**Albarracín:** Insertada en Supabase como contenido de prueba. No publicar hasta cambiar a `active`/`published`.

---

## 7. Reglas para futuros agentes

### Flujo de trabajo
1. **Leer AGENT_BRIEF.md primero** (este doc)
2. Leer docs específicos según la tarea
3. `git status` antes de tocar código
4. Microtareas: un cambio pequeño, una verificación

### Documentación
- **Actualizar BITACORA.md** si cambias algo significativo
- **Actualizar CODEMAP/DECISIONES** solo si aplica
- **NO** documentar cambios triviales

### Límites
- ❌ No tocar Supabase/schema si no se pide explícitamente
- ❌ No modificar mock si la tarea es sobre feature real
- ❌ No cambiar rutas públicas existentes
- ❌ No implementar features grandes mezcladas

### ¿Qué leer según la tarea?
| Tarea sobre... | Leer... |
|----------------|---------|
| Datos/Supabase | `DATA_MODEL.md`, `SUPABASE_SETUP.md` |
| Contenido editorial | `EDITORIAL_WORKFLOW.md` |
| Demo/presentación | `DEMO_CHECKLIST.md` |
| Decisiones pasadas | `DECISIONES.md` |
| Arquitectura | `ARCHITECTURE.md`, `CODEMAP.md` |

---

## 8. Checklist rápida antes de tocar código

- [ ] ¿Qué archivo exacto hay que cambiar?
- [ ] ¿Qué **NO** se debe tocar? (listar explícitamente)
- [ ] ¿Hace falta `npm run build` para verificar?
- [ ] ¿Hace falta documentar el cambio?
- [ ] ¿Puede romper Supabase, mock, o ambos?
- [ ] ¿Está el cambio alineado con DA-027/DA-028?

---

## 9. Referencias rápidas

**Rutas de ejemplo:**
- http://localhost:5173/ → Home
- http://localhost:5173/pais/italia → CountryPage con mapa interno
- http://localhost:5173/pais/italia/zona/lombardia → CountryZonePage placeholder
- http://localhost:5173/pais/espana → CountryPage con mapa local

**Comandos útiles:**
```bash
npm run dev          # Iniciar dev server
npm run build        # Verificar build sin errores
npm run maps:queue:process -- --limit 1  # Worker local/CI: procesa 1 mapa en cola
```

**Automatización de mapas:** GitHub Actions procesa `country_map_assets` cada 30 minutos con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` como secrets. El frontend nunca usa service role; solo consulta estado público y solicita cola vía Edge Function.

**Aventuras de viajeros:** la tabla `traveler_adventures` acepta envíos públicos como `pending`, pero el público solo puede leer `approved`. Fotos en bucket privado; subida/serving seguro queda para Edge Function futura.

---

## TL;DR para prompts futuros

> "Trawel es app pública de viajes centrada en mapas. Flujo principal: Home/WorldMap → País → Zona → futuras aventuras de viajeros. CountryPage prioriza mapa interno. Las aventuras de viajeros entran pending y requieren aprobación webmaster. No tocar Supabase/mock/schema sin permiso. Actualizar BITACORA si aplica."

---

*Agent Brief v1.0 - Trawel*
