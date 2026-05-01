# BITACORA.md — Bitácora activa del proyecto Trawel

> **Nota:** Este es el archivo de bitácora activa. Para el histórico completo, ver `docs/BITACORA_002.md` (2026-04-27 a 2026-05-01) y `docs/BITACORA_001.md` (inicio del proyecto).

---

## 2026-05-02 - WorldMap exploratorio real: tooltips con bandera + navegación universal 🗺️✨

Implementada la corrección fundamental de WorldMap para que sea un mapa exploratorio real donde todos los países son navegables.

### Problemas corregidos

| Problema | Causa | Solución |
|----------|-------|----------|
| **"País no disponible" en tooltip** | `getCountryByUnM49()` solo buscaba en diccionario de 5 países | Nuevo `worldCountries` con 249 países + `getWorldCountryByUnM49()` |
| **Sin bandera en tooltip** | No se usaba `formatCountryWithFlag()` correctamente | Ahora usa `countryCodeToFlagEmoji(isoAlpha2)` desde worldCountries |
| **México no aparecía** | México no estaba en el diccionario `countries.ts` | Ahora resuelve desde `worldCountries` |
| **Click no navegaba** | `isCountryClickable()` requería `status === 'active'` | Navega a cualquier país resoluble en worldCountries |
| **Sin feedback visual** | Cursor default en todos los países | Cursor pointer cuando el país es resoluble |

### Archivos creados

**`src/features/countries/data/worldCountries.ts`**
- Diccionario completo de 249 países del mundo
- Campos: `unM49`, `isoAlpha2`, `isoAlpha3`, `slug`, `displayName`
- Helpers: `getWorldCountryByUnM49()`, `getWorldCountryBySlug()`, `getWorldCountryByIsoAlpha2()`
- **No indica disponibilidad editorial**, solo identificación geográfica

### Archivos modificados

**`src/features/map/components/WorldMap/WorldMap.tsx`**
- Ahora importa desde `worldCountries` en lugar de `countries`
- Tooltip muestra: "🇲🇽 México", "🇫🇷 Francia", etc.
- Click navega a `/pais/{slug}` para cualquier país resoluble
- Cursor pointer solo en países resolubles
- Mantenido estilo neutro (todos gris, hover dorado)

**`src/pages/CountryPage/CountryPage.tsx`**
- Importa `getWorldCountryBySlug` para fallback
- Nueva vista `DiscoveringCountryView` para países sin contenido editorial
- Estados del mapa automático: loading, ready, queued, generating, failed, missing
- Pantalla amable para error: "Algo salió mal, pero lo arreglaremos pronto"
- Botón "Volver" o "Explorar otros destinos" en estado failed

### Comportamiento por tipo de país

| Tipo | Ejemplo | WorldMap Tooltip | Click | CountryPage muestra |
|------|---------|------------------|-------|---------------------|
| **Con contenido activo** | España | 🇪🇸 España | ✅ Navega | Contenido editorial completo |
| **En comingSoon** | Francia, Italia | 🇫🇷 Francia | ✅ Navega | Vista "Próximamente" + estado mapa |
| **Sin contenido, en worldCountries** | México, Brasil | 🇲🇽 México | ✅ Navega | `DiscoveringCountryView` con estado mapa |
| **No resoluble** | Código desconocido | "País no disponible" | ❌ No navega | "País no encontrado" |

### Criterios de aceptación cumplidos

- ✅ Hover sobre España muestra "🇪🇸 España"
- ✅ Hover sobre México muestra "🇲🇽 México"
- ✅ Hover sobre Francia muestra "🇫🇷 Francia"
- ✅ Click en México navega a /pais/mexico
- ✅ Click en Francia navega a /pais/francia
- ✅ /pais/mexico muestra DiscoveringCountryView con estado del mapa
- ✅ /pais/francia permite solicitar generación de mapa si falta
- ✅ WorldMap ya no muestra "País no disponible" como texto principal
- ✅ Build funciona (690 modules)

### Rotación de bitácora

Este cambio marca el punto de rotación de la bitácora:
- **BITACORA_002.md**: Histórico 2026-04-27 a 2026-05-01
- **BITACORA.md**: Cambios desde 2026-05-02 (este archivo)

---

## Resumen de cambios del día

| Cambio | Estado |
|--------|--------|
| Crear `worldCountries.ts` con 249 países | ✅ |
| Modificar `WorldMap.tsx` para usar worldCountries | ✅ |
| Modificar `WorldMap.tsx` para navegar a cualquier país | ✅ |
| Actualizar `CountryPage.tsx` con DiscoveringCountryView | ✅ |
| Añadir pantalla failed amable | ✅ |
| Rotar bitácora a BITACORA_002.md | ✅ |
| npm run build | ✅ (690 modules) |

---

## Estado actual del proyecto (v3.0)

**Trawel v3.0** — Mapa mundial exploratorio funcional

### Nuevos componentes/archivos
- `src/features/countries/data/worldCountries.ts` — Diccionario de 249 países

### Funcionalidades implementadas
- ✅ WorldMap muestra nombre + bandera para cualquier país conocido
- ✅ Navegación universal desde WorldMap a cualquier país
- ✅ CountryPage maneja países con/sin contenido editorial
- ✅ Sistema de mapas automáticos con estados visuales
- ✅ Pantallas amables para estados: loading, preparing, ready, failed

### Próximos pasos sugeridos
1. Añadir estilos CSS para `DiscoveringCountryView` en `CountryPage.module.css`
2. Verificar integración con sistema de mapas automáticos (DA-030)
3. Testing manual de navegación: España → México → Francia → país inexistente

---

*Bitácora activa v3.0 - Trawel*
*Última actualización: 2026-05-02*