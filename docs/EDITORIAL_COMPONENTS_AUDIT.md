# Auditoría de Componentes Editoriales - Trawel

**Fecha:** 2026-05-12  
**Objetivo:** Detectar patrones repetidos en páginas principales para decidir qué componentes base crear antes de pasar a v0.

---

## 1. Archivos Revisados

| Archivo | Líneas TSX | Líneas CSS | Patrones Detectados |
|---------|-----------|-----------|---------------------|
| `src/pages/HomePage/HomePage.tsx` | 383 | 696 | 7 |
| `src/pages/CountryPage/CountryPage.tsx` | 970 | 1501 | 9 |
| `src/pages/CityPage/CityPage.tsx` | 528 | 1005 | 8 |
| `src/pages/AdventurePage/AdventurePage.tsx` | 584 | 1021 | 8 |
| `src/pages/CountryZonePage/CountryZonePage.tsx` | 651 | - | 6 |

**Total:** ~3,116 líneas de TSX + ~4,223 líneas de CSS = **~7,339 líneas de código**

---

## 2. Tabla de Patrones Repetidos

### 2.1 VisualPlaceholder / HeroVisual / CardVisual

| Ubicación | Nombre usado | Implementación | Duplicación |
|-----------|--------------|----------------|-------------|
| HomePage.tsx | `ImagePlaceholder` + `CardImage` | Interna (líneas 132-184) | ⚠️ Parcial |
| CityPage.tsx | `CityVisual` | Interna (líneas 49-87) | ✅ Sí |
| AdventurePage.tsx | `AdventureVisual` | Interna (líneas 56-94) | ✅ Sí |
| CountryZonePage.tsx | `ZoneVisualPlaceholder` | Interna (líneas 65-75) | ✅ Simplificada |

**Análisis:**  
- Mismo patrón implementado 4 veces con variaciones menores
- Diferencias: `kind` enum (ImageKind vs VisualKind), iconos, estilos
- HomePage usa gradientes; CityPage/AdventurePage usan bordes dashed
- **Convendría extraer:** Sí, alta prioridad

---

### 2.2 SectionHeader

| Ubicación | Implementación | Variaciones |
|-----------|----------------|-------------|
| HomePage.tsx | `.section` + `.sectionTitle` + `.sectionDescription` | Centrado, sin eyebrow |
| CountryPage.tsx | `.sectionHeader` + `.sectionTitle` + `.sectionSubtitle` | Centrado, con eyebrow opcional |
| CityPage.tsx | `.sectionHeader` + `.sectionTitle` + `.sectionSubtitle` | Centrado, con modo indicator |
| AdventurePage.tsx | `.sectionHeader` + `.sectionTitle` + `.sectionSubtitle` | Izquierda en contenido, centrado en highlights |
| CountryZonePage.tsx | `.sectionHeader` + `.sectionTitle` + `.sectionSubtitle` | Centrado |

**Análisis:**  
- Patrón idéntico en estructura, variaciones en alineación
- Algunos incluyen eyebrow (span superior), otros no
- **Convendría extraer:** Sí, media prioridad

---

### 2.3 EmptyContentState

| Ubicación | Nombre usado | Contexto |
|-----------|--------------|----------|
| HomePage.tsx | No tiene (usa grids directos) | - |
| CountryPage.tsx | `.emptySection` + `.emptyContent` | Sin ciudades ni destinos |
| CityPage.tsx | `.emptyState` + `.emptyText` | Sin experiencias |
| AdventurePage.tsx | `.emptyContent` | Sin contenido editorial |
| CountryZonePage.tsx | `EmptyAdventuresState` (componente) | Sin aventuras aprobadas |

**Análisis:**  
- 4 implementaciones diferentes del mismo concepto
- Algunos tienen iconos, otros no
- CountryZonePage ya extrajo a componente interno
- **Convendría extraer:** Sí, media prioridad

---

### 2.4 CommunityCTA

| Ubicación | Nombre usado | Estilo |
|-----------|--------------|--------|
| HomePage.tsx | `.shareSection` | Oscuro (gradiente azul) |
| CityPage.tsx | `.communitySection` | Oscuro (gradiente azul) |
| AdventurePage.tsx | `.communitySection` | Verde (gradiente éxito) |
| CountryZonePage.tsx | `.communityPurpose` | Blanco con borde |

**Análisis:**  
- 4 implementaciones similares pero con estilos diferentes
- Copy adaptado a cada contexto (ciudad, aventura, país, zona)
- **Convendría extraer:** Sí, baja prioridad (muy dependiente de contexto)

---

### 2.5 FutureResourcesBlock

| Ubicación | Nombre usado | Estilo |
|-----------|--------------|--------|
| HomePage.tsx | `.resourcesSection` + `.resourcesGrid` | Blanco, 3 columnas |
| CityPage.tsx | `.guidesPlaceholder` | Azul claro, dashed |
| AdventurePage.tsx | `.guidesPlaceholder` | Violeta claro, dashed |
| CountryZonePage.tsx | `FutureResourcesBlock` (componente) | Componente reutilizable |

**Análisis:**  
- 3 implementaciones diferentes del mismo concepto
- CountryZonePage ya extrajo a componente
- **Convendría extraer:** Sí, baja prioridad

---

### 2.6 Cards de destino/ciudad/aventura

| Ubicación | Nombre usado | Tipo |
|-----------|--------------|------|
| HomePage.tsx | `.destinationCard` | País con bandera |
| HomePage.tsx | `.adventureCard` | Aventura con badge "Próximamente" |
| CountryPage.tsx | `CityCard` (componente) | Ciudad con estado |
| CountryPage.tsx | `DestinationCard` (componente) | Destino con tipo |
| CityPage.tsx | `ExperienceCard` (componente) | Experiencia con visual |
| AdventurePage.tsx | `PlaceholderHighlightCard` | Tarjeta fantasma |
| CountryZonePage.tsx | `.adventureCard` | Aventura de viajero |

**Análisis:**  
- Múltiples implementaciones de cards similares
- Algunos usan imágenes, otros placeholders
- Props diferentes pero estructura similar
- **Convendría extraer:** Sí, alta prioridad para `Card` base

---

### 2.7 Bloques de modo Aventura/Estudiante

| Ubicación | Implementación |
|-----------|----------------|
| HomePage.tsx | `.modesGrid` con `.modeCard` (2 columnas) |
| CityPage.tsx | `.modeIndicator` en sección de experiencias |
| AdventurePage.tsx | `.contentModeIndicator` en header de contenido |

**Análisis:**  
- 3 implementaciones diferentes
- HomePage es el más completo (grid de 2 modos)
- Otros son indicadores simples
- **Convendría extraer:** No prioritario, muy específico de HomePage

---

### 2.8 Badges de estado

| Ubicación | Estados soportados |
|-----------|-------------------|
| HomePage.tsx | `.comingSoonBadge` |
| CountryPage.tsx | `.statusBadge` (comingSoon, disabled) + `.featuredBadge` |
| CityPage.tsx | `.statusBadge` (comingSoon, disabled) + `.featuredBadge` |
| AdventurePage.tsx | `.statusBadge` (draft, comingSoon, disabled) + `.featuredBadge` + `.typeBadge` |

**Análisis:**  
- Mismo patrón de badge con variantes de color
- Estados: comingSoon, disabled, draft, featured
- **Convendría extraer:** Sí, alta prioridad

---

### 2.9 Breadcrumb

| Ubicación | Implementación |
|-----------|----------------|
| CountryPage.tsx | `.breadcrumb` + `.breadcrumbLink` + `.breadcrumbSeparator` |
| CityPage.tsx | Idéntico a CountryPage |
| AdventurePage.tsx | Idéntico con más niveles |
| CountryZonePage.tsx | Idéntico |

**Análisis:**  
- 4 implementaciones idénticas del mismo patrón
- Usa estructura: Inicio / País / Ciudad / Página actual
- **Convendría extraer:** Sí, alta prioridad

---

### 2.10 Hero con overlay

| Ubicación | Características |
|-----------|-----------------|
| HomePage.tsx | Hero simple con gradiente, sin visual prominente |
| CountryPage.tsx | Hero con bandera grande, sin imagen de fondo |
| CityPage.tsx | Hero con `CityVisual` prominente + overlay oscuro |
| AdventurePage.tsx | Hero con `AdventureVisual` prominente + overlay oscuro |
| CountryZonePage.tsx | Hero con `ZoneVisualPlaceholder` + overlay oscuro |

**Análisis:**  
- 3 implementaciones similares (CityPage, AdventurePage, CountryZonePage)
- HomePage y CountryPage son diferentes
- **Convendría extraer:** Sí, media prioridad para EditorialHero

---

## 3. Componentes Base Recomendados

### Prioridad ALTA (extraer primero)

| Componente | Descripción | Ubicación sugerida | Complejidad |
|------------|-------------|-------------------|-------------|
| `VisualPlaceholder` | Placeholder para fotos futuras con tipos (paisaje, monumento, etc.) | `src/components/editorial/VisualPlaceholder/` | Media |
| `StatusBadge` | Badge de estado reutilizable (comingSoon, featured, etc.) | `src/components/editorial/StatusBadge/` | Baja |
| `Breadcrumb` | Navegación jerárquica Inicio / País / Ciudad | `src/components/common/Breadcrumb/` | Baja |
| `Card` | Card base extensible para destinos, ciudades, aventuras | `src/components/editorial/Card/` | Media |

### Prioridad MEDIA (extraer después)

| Componente | Descripción | Ubicación sugerida | Complejidad |
|------------|-------------|-------------------|-------------|
| `SectionHeader` | Header de sección con título, subtítulo, eyebrow opcional | `src/components/editorial/SectionHeader/` | Baja |
| `EmptyState` | Estado vacío con icono, título, descripción, CTA opcional | `src/components/editorial/EmptyState/` | Baja |
| `EditorialHero` | Hero con visual prominente + overlay + contenido | `src/components/editorial/EditorialHero/` | Media |
| `CommunityCTA` | Bloque de llamada a la comunidad | `src/components/editorial/CommunityCTA/` | Baja |

### Prioridad BAJA (evaluar más adelante)

| Componente | Descripción | Justificación |
|------------|-------------|---------------|
| `ModeIndicator` | Indicador de modo Aventura/Estudiante | Muy específico, baja reutilización |
| `FutureResourcesBlock` | Bloque de recursos futuros | Solo 3 usos, fácil de mantener duplicado |
| `AdSlotPlaceholder` | Placeholder para futuros anuncios | Sin implementación actual, puramente conceptual |

---

## 4. Riesgos de Extracción

| Componente | Riesgo | Mitigación |
|------------|--------|------------|
| `VisualPlaceholder` | Diferencias de estilo entre páginas | Crear variantes: `gradient` (HomePage) y `dashed` (CityPage/AdventurePage) |
| `Card` | Props muy diferentes entre usos | Usar composición: `Card`, `CardImage`, `CardContent`, `CardFooter` |
| `Breadcrumb` | Dependencia de router | Aceptar `items: BreadcrumbItem[]` como prop, sin depender de router |
| `SectionHeader` | Alineación variable | Prop `align: 'left' \| 'center'` |
| `EmptyState` | Contexto muy diferente | Props genéricas: `icon`, `title`, `description`, `action` |

---

## 5. Beneficios para v0

| Beneficio | Descripción |
|-----------|-------------|
| **Consistencia visual** | v0 trabajará sobre componentes normalizados, no sobre código duplicado |
| **Menor deuda técnica** | Menos código duplicado = menos esfuerzo de mantenimiento post-v0 |
| **Mejor handoff** | v0 puede entender la estructura de componentes base y generar variantes coherentes |
| **Testing más fácil** | Componentes aislados son más fáciles de testear |
| **Documentación** | Los componentes base sirven como documentación viva del sistema de diseño |

---

## 6. Ubicación Recomendada

```
src/
├── components/
│   ├── editorial/           # Componentes editoriales específicos de Trawel
│   │   ├── VisualPlaceholder/
│   │   ├── StatusBadge/
│   │   ├── SectionHeader/
│   │   ├── EmptyState/
│   │   ├── EditorialHero/
│   │   ├── CommunityCTA/
│   │   └── Card/
│   │       ├── Card.tsx
│   │       ├── CardImage.tsx
│   │       ├── CardContent.tsx
│   │       └── CardFooter.tsx
│   ├── common/              # Componentes reutilizables genéricos
│   │   └── Breadcrumb/
│   └── ui/                  # Componentes UI atómicos (futuro)
```

**Rationale:**
- `editorial/` contiene patrones específicos de Trawel (placeholders de fotos, modos de viaje)
- `common/` contiene componentes genéricos que podrían usarse en cualquier proyecto
- Separación clara facilita la documentación para v0

---

## 7. Qué NO Refactorizar Ahora

| Área | Razón |
|------|-------|
| **Mapas** (WorldMap, CountryInternalMap, SpainMap) | Lógica crítica, compleja, fuera del scope editorial |
| **Lógica de datos** (travelData, Supabase) | Demasiado acoplada, riesgo de breaking changes |
| **Rutas** | Sin cambios en navegación en este bloque |
| **Formularios complejos** (AdventureSubmissionForm) | Demasiado específico, baja reutilización |
| **Worker** | Infraestructura crítica, no tocar |
| **Assets** (imágenes, mapas) | No son código, gestión separada |
| **Zoom/pan/touch** | Lógica de mapas, no tocar según instrucciones |

---

## 8. Siguiente Bloque Recomendado

### Opción A: VisualPlaceholder (RECOMENDADA)

**Justificación:**
- Mayor impacto visual (afecta a 4 páginas)
- Bajo riesgo (componente presentacional puro)
- Alto beneficio para v0 (normaliza placeholders de fotos)
- Fácil de implementar (1-2 archivos)

**Implementación:**
1. Crear `src/components/editorial/VisualPlaceholder/`
2. Mover lógica de CityPage como base (más completa)
3. Agregar variantes: `gradient` y `dashed`
4. Reemplazar en CityPage primero (página más estable)
5. Luego AdventurePage, CountryZonePage, HomePage

**Tamaño estimado:** ~150 líneas de código

---

### Opción B: StatusBadge

**Justificación:**
- Muy bajo riesgo
- Componente simple y reutilizable
- Afecta a 4 páginas

**Tamaño estimado:** ~80 líneas de código

---

### Opción C: Breadcrumb

**Justificación:**
- 4 implementaciones idénticas
- Fácil de extraer
- Componente estable

**Tamaño estimado:** ~60 líneas de código

---

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Páginas revisadas** | 5 |
| **Líneas de código totales** | ~7,339 |
| **Patrones repetidos detectados** | 10 |
| **Componentes recomendados (alta prioridad)** | 4 |
| **Componentes recomendados (media prioridad)** | 4 |
| **Duplicación estimada** | ~25-30% del código CSS/TSX |

**Recomendación:**  
Extraer `VisualPlaceholder` como primer componente base. Es de **bajo riesgo**, **alto beneficio visual** y **prepara el terreno** para que v0 trabaje sobre un sistema de placeholders coherente.