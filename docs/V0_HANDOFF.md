# Handoff para v0 - Rediseño Visual Trawel

> **Versión:** 1.0  
> **Fecha:** 2026-05-01  
> **Destinatario:** v0 / equipo de diseño visual  
> **Estado:** Listo para diseño

---

## 1. Qué es Trawel

Trawel es una **app pública de exploración de destinos de viaje**:

- **Propósito:** Exhibir contenido de viajes/recomendaciones aprobado editorialmente
- **Flujo de navegación:** Mundo → País → Ciudad → Destino
- **Fuente de datos:** TravelDataSource (Supabase) con fallback a mock
- **Rol:** Trawel es **exhibidor de contenido**, no panel editorial

**Contenido real actual:** Morella (España) con 6 destinos publicados

---

## 2. Objetivo del rediseño con v0

| Objetivo | Descripción |
|----------|-------------|
| **Mejorar estética** | Look premium, moderno, inspirador |
| **Mejorar UX** | Navegación intuitiva, jerarquía visual clara |
| **Responsive** | Experiencia excelente en móvil, tablet, desktop |
| **Sensación premium** | Calidad visual que transmita confianza |

**Límites importantes:**
- ❌ NO cambiar arquitectura de datos
- ❌ NO cambiar lógica de rutas
- ❌ NO convertir Trawel en Investighost (herramienta editorial)

---

## 3. Páginas a rediseñar visualmente

### Páginas principales

| Página | Ruta | Descripción actual |
|--------|------|-------------------|
| **HomePage** | `/` | Mapa mundial interactivo (D3 + TopoJSON), selector de modo |
| **CountryPage** | `/pais/espana` | Ficha de país: hero, estadísticas, grid de ciudades |
| **CityPage** | `/pais/espana/morella` | Ficha de ciudad: hero, descripción, grid de destinos |
| **AdventurePage** | `/aventura/castillo-de-morella` | Ficha de destino: contenido dual, sidebar metadatos |

### Estados no encontrados/no disponibles

| Estado | Ruta de ejemplo | Mensaje actual |
|--------|-----------------|----------------|
| Ciudad no disponible | `/pais/espana/albarracin` | "Esta ciudad todavía no está en Trawel" |
| Aventura no publicada | `/aventura/no-existe` | "Esta aventura todavía no está publicada" |

---

## 4. Componentes/lógica que NO se debe romper

### Header global (App.tsx)
- Selector Aventura/Estudiante integrado en header
- Persistencia en localStorage (`trawel-experience-mode`)
- Visible en todas las páginas

### ExperienceModeContext
```typescript
// NO cambiar la interfaz pública
const { mode, setMode, toggleMode } = useExperienceMode();
// mode: 'adventure' | 'student'
```

### Capa de datos (NO tocar)
| Archivo | Responsabilidad |
|---------|-----------------|
| `travelData.service.ts` | API pública de datos para páginas |
| `TravelDataSource` (interfaz) | Contrato de fuente de datos |
| `supabaseTravelData.source.ts` | Implementación Supabase |
| `mockTravelData.source.ts` | Implementación mock |

### Rutas existentes (NO cambiar slugs)
```
/                      → HomePage
/pais/:countrySlug     → CountryPage
/pais/:countrySlug/:citySlug  → CityPage
/aventura/:adventureSlug      → AdventurePage
```

### Filtros de estados públicos
- Ciudades solo visibles si `status === 'active'`
- Destinos solo visibles si `status === 'published'`
- Este filtrado ocurre en `supabaseTravelData.source.ts`

---

## 5. Reglas estrictas

| Regla | Explicación |
|-------|-------------|
| **NO tocar Supabase/schema** | Base de datos ya configurada |
| **NO tocar mock** | Datos locales para desarrollo |
| **NO cambiar rutas** | Slugs ya definidos y funcionando |
| **NO cambiar estados editoriales** | Lógica de publicación estable |
| **NO introducir dependencias innecesarias** | Mantener build ligero |
| **NO mover lógica de datos a componentes visuales** | Separación de concerns |
| **NO eliminar ni ocultar atribuciones cartográficas** | Requisito legal de licencias (CC BY 4.0, ODbL). La atribución debe permanecer visible |

---

## 6. Dirección estética

### Concepto: Travel Premium Moderno

| Elemento | Dirección |
|----------|-----------|
| **Mapa en Home** | Protagonista, interactivo, elegante |
| **Tarjetas** | Ciudades y destinos con diseño premium |
| **Mobile-first** | Experiencia prioritaria en móvil |
| **Aventura/Estudiante** | Visible pero no invasivo |
| **Efectos** | Moderados, no sobrecargar |

### Referencias visuales sugeridas
- Mapas: Airbnb, Booking (exploración geográfica)
- Tarjetas: Revista de viajes digital
- Tipografía: Legible, serif opcional para títulos épicos

### Nota importante: Cartografía vs. Diseño Visual
> **v0 puede mejorar la presentación visual del mapa** (colores, interacciones, layout), **pero no sustituye el asset cartográfico local**. La cartografía definitiva (siluetas de países, límites administrativos) proviene de fuentes geoespaciales procesadas una vez (Natural Earth, geoBoundaries), no de v0.

### Atribución cartográfica (obligatoria)
> **La atribución de fuentes cartográficas debe permanecer visible.**

- **No eliminar** textos de atribución como "Datos cartográficos: geoBoundaries (CC BY 4.0)"
- **No ocultar** tras interacciones o estados del mapa
- **Posición:** Visible cerca del mapa o en zona legal definida (footer, modal de créditos)
- **Formato:** Discreto pero legible
- **Ejemplo:** Pequeño texto en esquina inferior del mapa, o enlace a página de créditos

---

**Separación de responsabilidades:**
| Aspecto | Fuente | Notas |
|---------|--------|-------|
| Cartografía (límites, siluetas) | Asset local optimizado | Generado desde Natural Earth/geoBoundaries |
| Diseño visual (colores, UX) | v0 | Mejora estética y experiencia de usuario |
| Puntos de ciudad interactivos | Componente SpainMap actual | v0 mejora estilo, no reemplaza funcionalidad |

---

## 7. Conclusiones del audit de ExperienceMode (EXPERIENCE_MODE_AUDIT.md)

### Estado actual del modo Aventura/Estudiante

| Aspecto | Evaluación |
|---------|------------|
| Técnico | ✅ Funciona correctamente |
| Visibilidad | ⚠️ Débil (pasa desapercibido) |
| Diferenciación | ⚠️ Solo cambia texto, no estructura |
| AdventurePage | ✅ Mejor ejemplo (tiene badge de modo) |

### Lo que v0 debe mejorar

1. **Badge de modo activo** en todas las páginas (Home, Country, City)
2. **Tooltip explicativo** en el selector del header
3. **Indicador visual** cuando se usa contenido fallback
4. **Diferenciación de títulos** de sección (como ya hace AdventurePage)

### Lo que v0 NO debe hacer
- NO inventar diferencias editoriales profundas (pertenece a Investighost)
- NO cambiar la lógica de fallbacks existente
- NO añadir features distintas por modo (ej: mapa de ruta solo Aventura)

---

## 8. Entregables esperados de v0

### Por página
- [ ] Propuesta visual de HomePage (mapa prominente)
- [ ] Propuesta visual de CountryPage
- [ ] Propuesta visual de CityPage
- [ ] Propuesta visual de AdventurePage
- [ ] Estados no encontrados (mensajes amables)

### Componentes reutilizables (si conviene)
- [ ] Tarjeta de ciudad
- [ ] Tarjeta de destino
- [ ] Badge de modo Aventura/Estudiante
- [ ] Breadcrumb navegable
- [ ] Hero con imagen de fondo

### Técnicos
- [ ] CSS/estructura limpia y mantenible
- [ ] Responsive testado
- [ ] Build correcto (`npm run build`)

---

## 9. Checklist de aceptación

Antes de aprobar el rediseño, verificar:

- [ ] Flujo Morella funciona completo: Home → España → Morella → Castillo
- [ ] Albarracín (`/pais/espana/albarracin`) sigue mostrando "no disponible"
- [ ] Castillo de Morella sigue publicado y accesible
- [ ] Selector modo Aventura/Estudiante persiste tras refrescar
- [ ] Cambio de modo actualiza contenido en tiempo real
- [ ] `npm run build` sin errores

---

## 10. Contexto de arquitectura (para referencia)

```
App.tsx (header global con selector)
    ↓
Pages: HomePage → CountryPage → CityPage → AdventurePage
    ↓
travelData.service.ts (API estable)
    ↓
TravelDataSource → Supabase o Mock
    ↓
ExperienceModeContext (global, persistente)
```

**Stack:** Vite + React + TypeScript + CSS Modules + D3 (mapa)

---

## 11. Notas para el handoff a desarrollo

Tras el diseño v0, el desarrollador debe:

1. **No romper la lógica de datos** - Las páginas deben seguir funcionando con `travelData.service.ts`
2. **Mantener el selector global** - En App.tsx, no duplicar en páginas
3. **Preservar localStorage** - Clave `trawel-experience-mode`
4. **Validar estados** - Asegurar que contenido `disabled`/`draft` sigue oculto

---

## TL;DR para v0

> **Trawel es una app de viajes funcional con flujo Mundo→País→Ciudad→Destino. Tiene modo dual Aventura/Estudiante que funciona pero necesita mejor presencia visual. Rediseñar páginas para look premium moderno, mapa protagonista en Home, tarjetas elegantes, buena experiencia móvil. NO tocar lógica de datos, rutas, Supabase, ni estados editoriales.**

---

*V0 Handoff v1.0 - Trawel*