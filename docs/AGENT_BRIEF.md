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

**Fase data-driven:** Trawel entra en una fase de transicion hacia contratos de datos para Supabase e Investighost. Antes de proponer cambios estructurales sobre paises, zonas, lugares, rutas, planes, imagenes, demanda o paginas estaticas, consultar `docs/TRAWEL_DATA_CONTRACTS.md`.

**Modelo Supabase futuro:** antes de proponer tablas, migraciones, cambios de datos o RLS, consultar `docs/TRAWEL_SUPABASE_MODEL.md`.

**Mapeo Supabase legacy:** existe `docs/TRAWEL_SUPABASE_LEGACY_MAPPING.md` para reutilizar `trawel-prod` sin reconstruir desde cero. Antes de tocar Supabase, migraciones, RLS, Storage, Edge Functions o servicios de datos, consultarlo.

**Supabase fase 1 producto:** existe la migracion local `supabase/migrations/007_create_product_content_tables.sql` con tablas paralelas `editorial_contents`, `image_assets`, `static_pages`, `demand_signals` y `promotions`. No sustituye `countries`, `cities`, `destinations`, `traveler_adventures` ni `country_map_assets`; no se ha ejecutado contra remoto desde Trawel. Las promociones deben ser bloques nativos con disclosure visible, nunca popups/overlays invasivos.

**Fachada Country/Zone:** empieza a existir una fachada data-driven en `src/features/travelData/screenData/` con `getCountryScreenData()` y `getZoneScreenData()`. Los proximos cambios de pais/zona deben respetarla y evitar nuevo contenido hardcoded en paginas.

**Repositorio puente Country/Zone:** la fachada Country/Zone delega actualmente en un repositorio local (`localCountryZoneScreenData.repository.ts`) que implementa `CountryZoneScreenDataRepository`. Futuros repositorios Supabase legacy o data-driven deben respetar esa interfaz antes de cambiar paginas.

**CountryPage data-driven:** `CountryPage` empieza a consumir `getCountryScreenData(countrySlug, mode)` para datos normalizados de pantalla, especialmente editorial y estado de mapa. Mantener el comportamiento visual actual y respetar la fachada antes de conectar Supabase o cambiar fuentes locales.

**CountryZonePage data-driven:** `CountryZonePage` empieza a consumir `getZoneScreenData(countrySlug, zoneSlug, mode)` para datos normalizados de pantalla, manteniendo hero local/fallback, copy de zona y CTA comunitario actuales. Futuros cambios de zona deben pasar por la fachada antes de tocar la pagina.

**Paginas de confianza:** existen paginas minimas en `src/pages/TrustPage/` para `/sobre-trawel`, `/contacto`, `/privacidad`, `/cookies`, `/terminos`, `/creditos-imagenes` y `/compartir`. Son informativas iniciales; no sustituyen textos legales definitivos ni conectan formularios/backend.

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
| **—** | Privacidad obligatoria y marketing separado | Enviar aventura exige privacidad; comunicaciones/promociones son opcionales |
| **—** | Retirada privada antes de revisión | El usuario recibe token; Edge Function solo retira si sigue `pending` |
| **—** | Heroes editoriales por slug | Países usan `src/assets/countries/hero/[countrySlug].webp`; zonas usan `src/assets/zones/hero/[zoneSlug].webp` |

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

### Assets hero editoriales
- Países: `src/assets/countries/hero/[countrySlug].webp`
- Zonas/ciudades: `src/assets/zones/hero/[zoneSlug].webp`
- Recomendado: `2400x900 px`, `.webp`, `250-700 KB`
- El nombre del archivo debe coincidir exactamente con el slug real de URL.
- Si un país no tiene imagen real, `CountryPage` usa fallback premium con bandera, nombre y paleta por `countrySlug`.
- El hero fallback de país debe inspirar primero; la colaboración con fotos va como llamada secundaria.
- El hero fallback de zona debe inspirar primero; la colaboración con fotos va como llamada secundaria.
- Las paletas de fallback país no deben aplicarse a zonas/ciudades ni a mapas.

### ¿Qué leer según la tarea?
| Tarea sobre... | Leer... |
|----------------|---------|
| Datos/Supabase | `DATA_MODEL.md`, `SUPABASE_SETUP.md` |
| Contenido editorial | `EDITORIAL_WORKFLOW.md` |
| Demo/presentación | `DEMO_CHECKLIST.md` |
| Decisiones pasadas | `DECISIONES.md` |
| Arquitectura | `ARCHITECTURE.md`, `CODEMAP.md` |
| **Mapas (UI/UX)** | **`MAP_UI_GUIDELINES.md`** primero, luego `CODEMAP.md` |

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

**Aventuras de viajeros:** la tabla `traveler_adventures` acepta envíos públicos como `pending`, pero el público solo puede leer `approved`. El envío requiere aceptación de privacidad (`privacy_accepted_at`, `privacy_version`) y marketing queda separado/opcional. Fotos en bucket privado; subida/serving seguro queda para Edge Function futura.

**Retirada de aventuras:** al enviar una aventura se genera un token privado en navegador; la DB guarda solo `withdrawal_token_hash`. La ruta `/retirar-aventura` invoca la Edge Function `withdraw-traveler-adventure`, que usa `service_role` solo en backend y marca `status = withdrawn` si la aventura sigue `pending`.

---

## 10. Sistema AI-specs

Trawel usa una metodología AI-powered ligera para trabajo con agentes:

| Recurso | Propósito |
|---------|-----------|
| `docs/base-standards.md` | Reglas base: checkpoints, commits, validación |
| `docs/WORKFLOW_AI.md` | Flujo operativo: 8 pasos desde diagnóstico a commit |
| `docs/AGENTS.md` | Perfiles de agentes disponibles |
| `docs/codex.md` | Cómo usar Codex eficazmente |
| `ai-specs/skills/` | Skills específicos por situación |

### Skills disponibles

| Skill | Cuándo usar |
|-------|-------------|
| `checkpoint-before-change.md` | Antes de cambios grandes |
| `small-steps-planning.md` | Dividir en bloques "10 ladrillos" |
| `update-docs.md` | Mantener docs sin sobrecarga |
| `adversarial-review.md` | Revisar antes de "listo" |
| `responsive-audit.md` | Validar móvil/tablet/desktop |
| `map-ui-validation.md` | Cambios en WorldMap/CountryInternalMap |

### Agentes disponibles

| Agente | Especialidad |
|--------|--------------|
| `frontend-map.md` | Mapas, zoom, tooltips, responsive |
| `qa-validator.md` | Revisión de diffs, lint/build |
| `content-editorial.md` | Contenido con fuentes (futuro) |

---

## TL;DR para prompts futuros

> "Trawel es app pública de viajes centrada en mapas. Flujo principal: Home/WorldMap → País → Zona → futuras aventuras de viajeros. CountryPage prioriza mapa interno. Las aventuras de viajeros entran pending, requieren aprobación webmaster y aceptación de privacidad; marketing es separado/opcional. El usuario puede retirar envíos pending con token privado validado por Edge Function. No tocar Supabase/mock/schema sin permiso. Actualizar BITACORA si aplica. Ver docs/base-standards.md y ai-specs/skills/ para metodología."

---

*Agent Brief v1.1 - Trawel*
