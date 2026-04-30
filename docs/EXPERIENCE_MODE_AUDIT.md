# Auditoría: Modo Aventura/Estudiante

> **Fecha:** 2026-05-01  
> **Alcance:** Flujo público Home → País → Ciudad → Destino  
> **Objetivo:** Evaluar cómo se usa actualmente el modo y qué tan diferenciado se siente

---

## 1. Resumen ejecutivo

| Aspecto | Estado |
|---------|--------|
| Cobertura técnica | ✅ 3 de 4 páginas usan el modo |
| Diferenciación de contenido | ⚠️ Media (solo textos, no estructura) |
| UX explicativa | ❌ Débil (falta onboarding/copy) |
| Fallbacks | ✅ Robustos (3 niveles) |
| **Veredicto** | Funcional pero superficial. Necesita mejorar UX y profundidad antes de v0 |

---

## 2. Tabla por página

| Página | Lee modo | Cambia contenido | Indicador visual | Fallback |
|--------|----------|------------------|------------------|----------|
| **HomePage** | ✅ `useExperienceMode()` | ✅ Hero + CTA | ❌ No | ❌ No aplica |
| **CountryPage** | ❌ No | ❌ No | ❌ No | ❌ No aplica |
| **CityPage** | ✅ `useExperienceMode()` | ✅ Descripción ciudad | ❌ No | ✅ Modo → otro modo → shortDesc |
| **AdventurePage** | ✅ `useExperienceMode()` | ✅ Contenido destino | ✅ Sí (badge modo) | ✅ Modo → otro modo → summary |

### Detalle por página

#### HomePage
- **Qué cambia:** `heroTitle`, `heroSubtitle`, `sectionDescription`, `ctaTitle`, `ctaText`
- **Fuente:** `getHomePageContent(experienceMode)` en `experienceMode.config.ts`
- **Problema:** El cambio es sutil (tono del copy), no estructural

#### CountryPage  
- **Qué cambia:** Nada. Solo muestra datos del país/ciudades
- **Oportunidad:** Podría añadirse perspectiva por modo (ej: "Para viajeros" vs "Para estudiantes")

#### CityPage
- **Qué cambia:** Descripción en el hero vía `getCityDescription(city, mode)`
- **Fallback:** Modo activo → otro modo → `shortDescription`
- **Problema:** Sin indicador visual, el usuario no nota que cambió algo

#### AdventurePage
- **Qué cambia:** Contenido completo del destino + título de sección
- **Indicador:** Badge "🎒 Modo Aventura" / "🎓 Modo Estudiante"
- **Título adaptativo:** "Por qué visitarlo" (Aventura) vs "Descubre su historia" (Estudiante)
- **Mejor UX:** Es la única página donde el modo se siente presente

---

## 3. Fallbacks existentes

```
CityPage/AdventurePage:

1. Intentar contentByMode[modoActivo]
   ↓ (si no existe)
2. Intentar contentByMode[modoContrario]  
   ↓ (si no existe)
3. Usar shortDescription/summary genérico
```

**Evaluación:** Los fallbacks funcionan bien, pero el usuario no sabe que está viendo contenido alternativo. Falta indicador de "modo fallback".

---

## 4. UX/Copy explicativo

| Elemento | Estado | Notas |
|----------|--------|-------|
| Selector en header | ✅ Visible | Siempre presente gracias a App.tsx |
| Tooltip explicativo | ❌ No existe | Hover sobre selector no explica nada |
| Página de onboarding | ❌ No existe | No hay "/bienvenida" que explique los modos |
| Badge modo activo | ⚠️ Solo en AdventurePage | Debería estar en todas las páginas |
| Diferenciación visual | ❌ Ninguna | Mismo layout, solo cambia texto |

**Copy actual del selector:** No se encontró archivo de configuración de textos del selector.

---

## 5. ¿Se siente como diferencial real?

| Criterio | Evaluación |
|----------|------------|
| **Percepción inmediata** | ❌ Débil. Usuario nuevo no entiende qué cambió al togglear |
| **Profundidad de cambio** | ⚠️ Media. Solo textos, no estructura ni features |
| **Valor añadido** | ⚠️ Potencial. El concepto es bueno, falta ejecución |
| **Memorabilidad** | ❌ Baja. No hay "momento wow" al cambiar de modo |

**Problema principal:** El modo es un cambio de **tono**, no de **experiencia**. Un usuario podría no notar la diferencia si no lee atentamente.

---

## 6. Recomendaciones priorizadas

### Antes de v0 (Pequeñas, alta prioridad)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| 1 | **Añadir badge de modo activo** en HomePage, CityPage, CountryPage | Alto | Bajo |
| 2 | **Tooltip explicativo** en el selector: "Modo Aventura: tono práctico y emocional" vs "Modo Estudiante: tono educativo y cultural" | Alto | Bajo |
| 3 | **Indicador de fallback** cuando se muestra contenido del otro modo | Medio | Medio |
| 4 | **Diferenciar títulos de sección** en CityPage como se hace en AdventurePage | Medio | Bajo |

### Post-v0 (Mayores, media prioridad)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| 5 | **Estructura diferenciada**: Aventura = info práctica primero; Estudiante = contexto histórico primero | Alto | Alto |
| 6 | **Features distintas**: Aventura = mapa de ruta; Estudiante = timeline histórico | Alto | Alto |
| 7 | **Onboarding inicial**: Primera visita explica los modos con ejemplos | Alto | Medio |

---

## 7. Métricas sugeridas para validar

Antes de implementar mejoras, medir:
- ¿Cuántos usuarios cambian de modo en su primera sesión?
- ¿Cuánto tiempo pasan en cada modo?
- ¿Hay diferencia en engagement (clics, tiempo) entre modos?

---

## 8. Conclusión

El modo Aventura/Estudiante está **técnicamente implementado** pero **UX-mente inmaduro**. 

**Lo que funciona:**
- Arquitectura sólida (Context + localStorage + fallbacks)
- AdventurePage tiene buen ejemplo de diferenciación

**Lo que falta:**
- Hacer el modo **visible** (badges, indicadores)
- Hacer el modo **comprensible** (tooltips, copy explicativo)
- Hacer el modo **valioso** (features diferenciadas, no solo tono)

**Recomendación para v0:** Implementar items 1-4 de las recomendaciones. Sin eso, el modo pasará desapercibido y no aportará diferenciación de producto.

---

*Audit v1.0 - Trawel*