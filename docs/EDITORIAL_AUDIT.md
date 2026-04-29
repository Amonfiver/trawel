# Auditoría Editorial - Trawel

> **Fecha:** 2026-04-29  
> **Objetivo:** Auditar qué datos editoriales consume Trawel y detectar carencias para la demo  
> **Alcance:** España, Morella, Castillo de Morella

---

## Resumen Ejecutivo

**Hallazgo crítico:** Morella y Castillo de Morella existen en **Supabase** pero **NO en datos mock**. Esto causa que la demo se vea diferente (y pobre) dependiendo de la fuente de datos activa.

| Entidad | Mock | Supabase | Impacto Demo |
|---------|------|----------|--------------|
| España | ✅ Completo | ✅ Completo | Consistente |
| Madrid | ✅ Completo | ✅ Completo | Consistente |
| Barcelona | ✅ Completo | ✅ Completo | Consistente |
| Castellón | ✅ Completo | ✅ Completo | Consistente |
| **Morella** | ❌ **NO EXISTE** | ✅ Completo | **Inconsistente** |
| **Castillo de Morella** | ❌ **NO EXISTE** | ✅ Completo | **Inconsistente** |

---

## Tipos de Datos y Campos Usados

### 1. Countries (Países)

**Tipo:** `src/features/countries/data/countries.types.ts`

**Campos usados en páginas:**

| Campo | HomePage | CountryPage | CityPage | AdventurePage | Crítico Demo |
|-------|----------|-------------|----------|---------------|--------------|
| `displayName` | ✅ | ✅ | ✅ | ✅ | Sí |
| `isoAlpha2` | ✅ (flag) | ✅ (flag) | - | - | No |
| `slug` | ✅ | ✅ | ✅ | ✅ | Sí |
| `shortDescription` | ✅ | ✅ | - | - | Sí |
| `capital` | - | ✅ | - | - | Medio |
| `destinationCount` | ✅ | ✅ | - | - | Sí |
| `featured` | - | ✅ | - | - | No |
| `status` | ✅ | ✅ | - | - | Sí |

**Estado de España:**
- ✅ Todos los campos críticos presentes
- ✅ `destinationCount: 3` (Madrid, Barcelona, Castellón)
- ⚠️ **Falta:** `image` (no existe en tipo, preparado para futuro)

---

### 2. Cities (Ciudades)

**Tipo:** `src/features/cities/types/city.types.ts`

**Campos usados en páginas:**

| Campo | CountryPage | CityPage | AdventurePage | Crítico Demo |
|-------|-------------|----------|---------------|--------------|
| `name` | ✅ | ✅ | - | Sí |
| `slug` | ✅ | ✅ | - | Sí |
| `shortDescription` | ✅ | ✅ | - | Sí |
| `contentByMode.adventure/student` | - | ✅ | - | Sí |
| `coordinates` | - | ✅ | - | No |
| `destinationCount` | ✅ | ✅ | - | Sí |
| `featured` | ✅ | ✅ | - | No |
| `status` | ✅ | ✅ | - | Sí |

**Estado de ciudades españolas:**

| Ciudad | Mock | Supabase | Contenido Dual | Coordenadas |
|--------|------|----------|----------------|-------------|
| Madrid | ✅ | ✅ | ✅ | ✅ |
| Barcelona | ✅ | ✅ | ✅ | ✅ |
| Castellón | ✅ | ✅ | ✅ | ✅ |
| **Morella** | ❌ **NO** | ✅ | ✅ | ✅ |

**Problema detectado:** Morella no existe en `src/features/cities/data/cities.ts` (mock), solo en Supabase.

---

### 3. Destinations (Destinos/Aventuras)

**Tipo:** `src/features/destinations/types/destination.types.ts`

**Campos usados en páginas:**

| Campo | CityPage | AdventurePage | Crítico Demo |
|-------|----------|---------------|--------------|
| `title` | ✅ | ✅ | Sí |
| `slug` | ✅ | ✅ | Sí |
| `summary` | ✅ | ✅ | Sí |
| `contentByMode.adventure/student` | - | ✅ | **CRÍTICO** |
| `type` | ✅ | ✅ | Sí |
| `estimatedVisitTime` | ✅ | ✅ | Sí |
| `price` | - | ✅ | Medio |
| `openingHours` | - | ✅ | Medio |
| `tags` | - | ✅ | No |
| `sources` | - | ✅ | Medio |
| `featured` | ✅ | ✅ | No |
| `status` | ✅ | ✅ | Sí |

**Estado de destinos españoles:**

| Destino | Ciudad | Mock | Supabase | Contenido Dual | Info Práctica | Fuentes |
|---------|--------|------|----------|----------------|---------------|---------|
| Museo del Prado | Madrid | ✅ | ✅ | ✅ | ✅ | ⚠️ Mínimas |
| Parque del Retiro | Madrid | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Castillo de Morella** | **Morella** | ❌ **NO** | ✅ | ✅ | ✅ | ✅ |
| *(otros 4 destinos Morella)* | **Morella** | ❌ **NO** | ✅ | ✅ | ✅ | ✅ |

**Problemas detectados:**
1. **Castillo de Morella no existe en mock** (solo en Supabase)
2. **Prado**: fuentes muy mínimas (solo "Guía oficial")
3. **Castellón**: tiene `destinationCount: 1` pero no hay destinos asignados en mock

---

## Análisis por Página

### HomePage (`/`)

**Datos usados:**
- `countries` (lista)
- `activeCountries` (tarjetas)
- `comingSoonCountries` (sección)
- `counts` (estadísticas)

**Campos mostrados:**
- Bandera emoji (`isoAlpha2`)
- Nombre (`displayName`)
- Descripción (`shortDescription`)
- Número de destinos (`destinationCount`)
- Estado (badge "Disponible")

**Carencias para demo:**
- ⚠️ España tiene descripción genérica ("Desde la Alhambra...")
- ⚠️ Sin imágenes de países (aparece placeholder o solo texto)

---

### CountryPage (`/pais/espana`)

**Datos usados:**
- `country` (hero)
- `activeCities` (grid principal)
- `comingSoonCities` (sección)
- `featuredDestinations` (sección secundaria)
- `publishedDestinationsCount` (estadísticas)

**Campos mostrados:**
- Bandera grande
- Nombre, capital, continente
- Badges (featured, status)
- Estadísticas (ciudades, aventuras, total)
- Grid de ciudades con nombre, descripción, conteo

**Carencias para demo:**
- ❌ **Morella no aparece** si usas mock (solo Madrid, Barcelona, Castellón)
- ⚠️ Castellón aparece con 1 destino pero al entrar está vacío

---

### CityPage (`/pais/espana/morella`)

**Datos usados:**
- `city` (hero)
- `country` (breadcrumb)
- `publishedDestinations` (grid principal)

**Campos mostrados:**
- Nombre de ciudad
- Relación con país ("En el corazón de España")
- Descripción según modo (adventure/student)
- Estadísticas (número de aventuras)
- Grid de destinos con tipo, tiempo, resumen

**Carencias para demo:**
- ❌ **Página 404 si usas mock** (Morella no existe en datos locales)
- ⚠️ Estado vacío amable sí está implementado pero no se ve porque la ciudad no existe

---

### AdventurePage (`/aventura/castillo-de-morella`)

**Datos usados:**
- `destination` (hero + contenido)
- `city` (breadcrumb, navegación)
- `country` (breadcrumb)

**Campos mostrados:**
- Título del destino
- Tipo (monument, museum, etc.)
- Ubicación ("Morella, España")
- Resumen introductorio
- Contenido según modo ("Por qué visitarlo" / "Descubre su historia")
- Info práctica (duración, precio, horario)
- Fuentes y referencias

**Carencias para demo:**
- ❌ **Página 404 si usas mock** (destino no existe)
- ⚠️ Estados amables implementados pero no visibles sin datos

---

## Recomendaciones

### Prioridad Alta (Resolver para demo sólida)

| Issue | Solución | Esfuerzo |
|-------|----------|----------|
| Morella no existe en mock | Añadir Morella a `cities.ts` | Bajo |
| Castillo de Morella no existe en mock | Añadir 1-2 destinos a `destinations.ts` | Bajo |
| Castellón tiene destinos vacíos | Crear destino de ejemplo o quitar conteo | Mínimo |

### Prioridad Media (Mejorar presentación)

| Issue | Solución | Esfuerzo |
|-------|----------|----------|
| Fuentes mínimas en Prado | Añadir URL real del museo | Mínimo |
| Descripción genérica de España | Mejorar shortDescription | Editorial |
| Sin imágenes | Usar Unsplash o placeholders | Diseño |

### Prioridad Baja (Futuro)

| Issue | Solución | Esfuerzo |
|-------|----------|----------|
| Más destinos por ciudad | Crear contenido editorial | Alto |
| Galerías de imágenes | Implementar componente | Medio |
| Videos o media enriquecida | Integrar embeds | Medio |

---

## Campos Críticos para Demo Atractiva

**Mínimo viable:**
1. ✅ `country.shortDescription` - presente
2. ✅ `city.shortDescription` - presente
3. ✅ `destination.summary` - presente
4. ✅ `destination.contentByMode` - **FALTA en Morella/Castillo (mock)**
5. ✅ `destination.estimatedVisitTime` - presente
6. ⚠️ `destination.price` - algunos vacíos
7. ⚠️ `destination.openingHours` - algunos vacíos

**Diferenciador clave:**
- Contenido dual (adventure vs student) es el valor único de Trawel
- Sin este contenido, la demo pierde su propuesta de valor principal

---

## Conclusión

**La demo funciona correctamente con Supabase** (`VITE_TRAVEL_DATA_SOURCE=supabase`), donde Morella y sus 6 destinos están completamente poblados con contenido dual.

**La demo se ve pobre con mock** (`VITE_TRAVEL_DATA_SOURCE=mock`) porque:
1. Morella no existe (404 en ciudad)
2. Castillo de Morella no existe (404 en destino)
3. Solo se ven Madrid/Barcelona con 3 destinos totales

**Recomendación inmediata:** Sincronizar datos mock con los de Supabase añadiendo Morella y al menos el Castillo de Morella a los archivos TypeScript estáticos.

---

*Auditoría completada - 2026-04-29*