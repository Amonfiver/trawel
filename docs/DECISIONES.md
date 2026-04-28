# Registro de Decisiones - Trawel

## Cómo usar este documento

Este archivo registra decisiones técnicas y de diseño importantes del proyecto. Cada decisión incluye:
- Contexto: ¿Qué problema estábamos resolviendo?
- Decisión: ¿Qué elegimos?
- Consecuencias: ¿Qué implica esta elección?

---

## Decisiones arquitectónicas

### DA-001: Vite + React en lugar de Next.js

**Fecha:** 2026-04-27  
**Estado:** Aceptada  
**Contexto:** Necesitábamos elegir el framework base para el MVP. Next.js es popular pero añade complejidad.

**Decisión:** Usar Vite + React para el MVP. No usar Next.js en esta fase.

**Razones:**
- SSR no es necesario inicialmente (no hay SEO crítico todavía)
- API Routes no se usan (datos estáticos)
- Vite es más ligero y rápido para desarrollo
- Menos magia, más control explícito
- React Router da suficiente flexibilidad de routing

**Consecuencias:**
- Migración futura a Next.js será más trabajo si la necesitamos
- No tenemos Image optimization automático
- No tenemos font optimization automático
- Mayor libertad en estructura de carpetas

**Reversibilidad:** Media. Una app Vite React puede migrarse a Next.js, requiere reestructurar rutas y configuración.

---

## DA-026: Mock como fuente de datos por defecto hasta conectar Supabase

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Hemos preparado el schema SQL para Supabase y la guía de configuración, pero no queremos romper la app actual ni cambiar el comportamiento visible hasta tener todo listo para la conexión.

**Decisión:** Mantener `mock` como fuente de datos por defecto mediante variable de entorno `VITE_TRAVEL_DATA_SOURCE=mock`. No instalar `@supabase/supabase-js` todavía ni crear `SupabaseTravelDataSource` hasta que se complete el setup de Supabase.

**Implementación:**
- Creado `.env.example` con `VITE_TRAVEL_DATA_SOURCE=mock`
- Documentado en `docs/SUPABASE_SETUP.md` el flujo completo
- Seed.sql generado compatible con RLS (todos los destinos en estado `published`)
- Sin modificar `travelData.service.ts` ni páginas

**Razones:**
- La app sigue funcionando 100% con datos locales mientras se prepara Supabase
- No hay dependencias nuevas hasta que sea necesario
- Permite probar el setup de Supabase de forma independiente
- Migración gradual: preparar → configurar → conectar → activar

**Flujo previsto:**
1. **Actual (Fase 1):** Mock activo, documentación lista, schema creado
2. **Fase 2:** Crear proyecto Supabase, ejecutar schema, cargar seed
3. **Fase 3:** Instalar `@supabase/supabase-js`, crear `SupabaseTravelDataSource`
4. **Fase 4:** Cambiar `VITE_TRAVEL_DATA_SOURCE=supabase`, probar conexión

**Consecuencias:**
- Desarrollo paralelo: frontend estable mientras se configura backend
- Sin riesgo de romper la app actual
- Setup de Supabase puede hacerse en cualquier momento siguiendo la guía
- Cambio de fuente es solo cambiar una variable de entorno

**Reversibilidad:** Alta. Volver a mock es cambiar la variable de entorno.

---

## DA-025: Modelo de base de datos real para Trawel con campos específicos por idioma

**Fecha:** 2026-04-28  
**Estado:** Aceptada  
**Contexto:** Trawel necesita evolucionar desde datos mock estáticos hacia una arquitectura que permita leer contenido real desde Supabase. Investighost será la herramienta que alimente los datos, Trawel solo los lee.

**Decisión:** Definir modelo de base de datos con tablas específicas y campos `_es` para contenido en español (extensible a otros idiomas):

**Tablas definidas:**

1. **countries**: `id`, `slug`, `name_es`, `emoji`, `capital_es`, `continent_es`, `description_es`, `status`, `featured`, timestamps

2. **cities**: `id`, `country_id`, `slug`, `name_es`, `short_description_es`, `adventure_content_es`, `student_content_es`, `lat`, `lng`, `status`, `featured`, `recommended_duration`, `best_season_es`, `sleeping_advice_es`, `food_advice_es`, `pending_verification`, timestamps

3. **destinations**: `id`, `country_id`, `city_id`, `slug`, `title_es`, `summary_es`, `adventure_content_es`, `student_content_es`, `type`, `tags`, `estimated_visit_time`, `price`, `opening_hours`, `practical_tip_es`, `verification_status`, `status`, `featured`, `pending_verification`, timestamps

4. **destination_sources**: `id`, `destination_id`, `title`, `url`, `type`, `supports`, timestamps

**Estados editoriales:**
- Country/City: `active`, `comingSoon`, `disabled`
- Destination: `draft`, `published`, `comingSoon`, `disabled`
- Verification: `pending`, `verified`, `disputed`

**Principios:**
- Trawel lee datos publicados (`status = 'published'`)
- Investighost investiga, valida y guarda contenido
- Campos `_es` permiten extensión a `_en`, `_fr`, etc.
- `pending_verification` como JSONB para marcar datos pendientes

**Cambios realizados:**
- Actualizado `docs/DATA_MODEL.md` con schema SQL completo
- Documentados índices y constraints
- Definidos estados editoriales y workflow

**Razones:**
- Separación clara: Investighost escribe, Trawel lee
- Modelo preparado para Supabase sin reescribir páginas
- Campos específicos por idioma facilitan queries
- Estados editoriales controlan visibilidad

**Consecuencias:**
- Migración futura requiere script de datos mock → SQL
- `travelData.service` evolucionará de sync a async
- Las páginas no cambian, solo la fuente de datos

**Reversibilidad:** Media. Cambiar el modelo de base de datos requeriría migración de datos, pero el contrato de `travelData.service` permanece estable.

---

## Índice de Decisiones

| ID | Fecha | Título | Estado |
|----|-------|--------|--------|
| DA-026 | 2026-04-28 | Mock como fuente por defecto hasta conectar Supabase | ✅ Aprobada |
| DA-025 | 2026-04-28 | Modelo de base de datos real para Trawel | ✅ Aprobada |
| DA-024 | 2026-04-28 | Trawel como plataforma pública de lectura | ✅ Aprobada |
| DA-023 | 2026-04-28 | Contrato editorial con Investighost-GPT | ✅ Aprobada |
| DA-022 | 2026-04-28 | Rotación de bitácora en archivos históricos | ✅ Aprobada |
| DA-021 | 2026-04-28 | Modelo persistente separa entidades y traducciones | ✅ Aprobada |
| DA-020 | 2026-04-28 | Capa de acceso a datos local antes de persistencia externa | ✅ Aprobada |
| DA-019 | 2026-04-28 | Modelo jerárquico País → Ciudad → Destino | ✅ Aprobada |
| DA-018 | 2026-04-28 | Sistema i18n propio sin librería externa | ✅ Aprobada |
| DA-017 | 2026-04-28 | Modos de experiencia dual (Aventura/Estudiante) | ✅ Aprobada |
| DA-013 | 2026-04-27 | Proyección cartográfica Mercator | ✅ Aprobada |
| DA-012 | 2026-04-27 | Dataset world-atlas desde CDN | ✅ Aprobada |
| DA-011 | 2026-04-27 | Tema de mapa centralizado en objeto configurable | ✅ Aprobada |
| DA-010 | 2026-04-27 | Separación name/displayName en tipos de país | ✅ Aprobada |
| DA-009 | 2026-04-27 | Campos ISO estandarizados en tipos de país | ✅ Aprobada |
| DA-008 | 2026-04-27 | Feature-based folder structure | ✅ Aprobada |
| DA-007 | 2026-04-27 | Sistema de tema configurable para mapas | ✅ Aprobada |
| DA-006 | 2026-04-27 | Diccionario propio de países | ✅ Aprobada |
| DA-005 | 2026-04-27 | Activar solo países con contenido | ✅ Aprobada |
| DA-004 | 2026-04-27 | Datos estáticos JSON/TS sin base de datos | ✅ Aprobada |
| DA-003 | 2026-04-27 | No copiar código de la versión Websim | ✅ Aprobada |
| DA-002 | 2026-04-27 | D3 + TopoJSON + SVG para mapas | ✅ Aprobada |
| DA-001 | 2026-04-27 | Vite + React en lugar de Next.js | ✅ Aprobada |

---

*Registro de decisiones v1.8 - Trawel*
*Última actualización: 2026-04-28*