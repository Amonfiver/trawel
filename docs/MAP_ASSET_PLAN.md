# Plan de Assets Cartográficos - Trawel

> **Fecha:** 2026-05-01  
> **Estado:** Diagnóstico completado, planificado para implementación futura  
> **Relacionado:** DA-027 (Estrategia progresiva para mapas internos)

---

## 1. Problema detectado

### Estado actual de SpainMap (src/features/map/components/SpainMap/)

El componente `SpainMap` implementado es **funcional pero no definitivo**:

| Aspecto | Estado actual | Problema |
|---------|---------------|----------|
| **Silueta de España** | Path SVG manual (~línea 122) | Forma aproximada, no geográficamente precisa |
| **Islas** | Elipses simplificadas | Representación simbólica, no real |
| **Mantenibilidad** | Código manual de 220 líneas | Difícil de adaptar a otros países |
| **Escala** | Bounding box manual | Proyección simplificada, no estándar |
| **Escalabilidad** | SVG estático inline | No reusable para otros países sin refactor mayor |

**Conclusión:** El SpainMap actual es un **prototipo temporal/piloto arquitectónico** válido para demostrar funcionalidad, pero debe reemplazarse por un asset cartográfico fiable antes de considerarse producción-ready.

---

## 2. Principio técnico

Los mapas internos de Trawel deben seguir estos principios (basado en DA-027):

| Principio | Implementación |
|-----------|----------------|
| **Asset local fiable** | GeoJSON/TopoJSON procesado una vez desde fuentes autorizadas |
| **No runtime externo** | Sin llamadas a APIs de mapas en tiempo de ejecución |
| **No generación por usuario** | Sin dibujos manuales ni componentes gigantes por país |
| **Procesado offline** | Script de build genera assets optimizados |
| **Independencia de v0** | v0 mejora estética, no crea cartografía |

---

## 3. Fuente recomendada para España

### Opción A: geoBoundaries (Recomendada)
- **Fuente:** [geoBoundaries](https://www.geoboundaries.org/) - ADM2 (provincias)
- **Ventajas:** 
  - Datos abiertos, verificados académicamente
  - Resolución ajustable (simplificación TopoJSON)
  - Formato GeoJSON/TopoJSON nativo
- **Uso:** Descargar shapefile → convertir a GeoJSON → simplificar → guardar local

### Opción B: Natural Earth Admin 1
- **Fuente:** [Natural Earth](https://www.naturalearthdata.com/) - Admin 1 (regiones/autonomías)
- **Ventajas:**
  - Dataset estable y bien mantenido
  - Ya usado para WorldMap (consistencia)
  - Escalas múltiples disponibles (1:10m, 1:50m)
- **Uso:** Similar a geoBoundaries, división administrativa más gruesa

### Opción C: Fuente oficial española (Futuro)
- **Fuente:** IGN (Instituto Geográfico Nacional) o equivalente
- **Ventajas:** Máxima precisión oficial
- **Desventajas:** Requiere verificación de licencia, formato puede necesitar conversión

**Recomendación:** Empezar con **geoBoundaries ADM2** para España (nivel provincia).

---

## 4. Formato y ubicación recomendada

### Estructura de carpetas propuesta

```
public/maps/
└── countries/
    ├── spain/
    │   ├── spain-adm2.geojson          # Original descargado
    │   ├── spain-adm2-simplified.json  # Optimizado para web
    │   └── spain-cities.json           # Puntos de ciudades (lat/lng)
    ├── france/
    │   └── ...
    └── README.md                        # Documentación de fuentes
```

O alternativa en src:

```
src/assets/maps/
└── countries/
    ├── spain/
    │   ├── spain-adm2-simplified.json
    │   └── spain-cities.json
    └── index.ts                         # Exports tipados
```

### Especificaciones del asset

| Propiedad | Valor recomendado |
|-----------|-------------------|
| **Formato** | TopoJSON (más compacto) o GeoJSON |
| **Tamaño objetivo** | < 100KB por país (comprimido) |
| **Simplificación** | 0.5% - 2% de detalle original |
| **Proyección** | WGS84 (EPSG:4326) para consistencia |
| **Metadatos** | Fuente, fecha, versión en JSON |

---

## 5. Comportamiento esperado del mapa

### Interacciones objetivo (reemplazo de SpainMap)

| Interacción | Comportamiento |
|-------------|----------------|
| **Hover sobre provincia/zona** | Cambia color de fondo, muestra nombre |
| **Puntos de ciudad** | Renderizados encima del mapa base |
| **Click en ciudad publicada** | Navega a `/pais/:country/:city` |
| **Click en ciudad no publicada** | Tooltip "Próximamente" o similar |
| **Fallback sin asset** | Muestra lista clásica de ciudades (comportamiento actual Japón/Perú) |

### Diferencias con SpainMap actual

| Aspecto | SpainMap actual | Mapa con asset real |
|---------|-----------------|---------------------|
| Base cartográfica | SVG manual (~líneas 119-146) | GeoJSON/TopoJSON preciso |
| Provincias/zonas | No disponible | Hover con nombre |
| Escalabilidad | España única | Fácil añadir países |
| Precisión | Aproximada (~km) | Precisión de fuente oficial |
| Mantenimiento | Manual | Script de procesado |

---

## 6. Plan por fases

### Fase 1: Actual (COMPLETADA)
- ✅ SpainMap como prototipo funcional con puntos interactivos
- ✅ Integración en CountryPage con fallback automático
- ✅ Albarracín y Morella visibles en mapa

### Fase 2: Asset real de España (SIGUIENTE BLOQUE TÉCNICO)

**Tareas:**
1. Descargar geoJSON de geoBoundaries (ADM2 España)
2. Crear script de procesado (scripts/process-map-assets.ts):
   - Simplificación de geometría
   - Conversión a TopoJSON
   - Validación de formato
3. Guardar asset en `public/maps/countries/spain/`
4. Crear componente `CountryMap` genérico (reemplaza SpainMap):
   - Acepta `countrySlug` y carga asset dinámicamente
   - Renderiza provincias/zonas como paths
   - Superpone puntos de ciudad
   - Hover/click en provincias
5. Actualizar CountryPage para usar `CountryMap` en lugar de `SpainMap`
6. Marcar `SpainMap` como deprecated/legacy

**Criterios de aceptación:**
- [ ] Asset de España < 100KB
- [ ] Provincias visibles con hover
- [ ] Puntos de ciudad posicionados correctamente sobre provincias
- [ ] Navegación a CityPage funciona
- [ ] Fallback sin asset mantiene lista clásica
- [ ] Build sin errores

### Fase 3: Añadir más países bajo demanda

**Cuándo añadir un nuevo país:**
- Cuando tenga 3+ ciudades publicadas
- Cuando haya tráfico significativo en su CountryPage
- Bajo demanda editorial explícita

**Proceso por país:**
1. Descargar geoBoundaries ADM1/ADM2 del país
2. Ejecutar script de procesado
3. Añadir a `public/maps/countries/{country}/`
4. Añadir `countrySlug` a lista de países con mapa
5. Verificar posicionamiento de ciudades

---

## 7. Reglas para v0 (diseño visual)

| Aspecto | ¿Puede hacer v0? | Notas |
|---------|------------------|-------|
| **Colores del mapa** | ✅ Sí | Paleta, estados hover, contrastes |
| **Layout y espaciado** | ✅ Sí | Tamaños, márgenes, responsive |
| **Tipografía de labels** | ✅ Sí | Fuentes, tamaños, pesos |
| **Estilo de puntos ciudad** | ✅ Sí | Formas, animaciones, sombras |
| **Crear cartografía** | ❌ NO | v0 no genera límites geográficos |
| **Sustituir asset real** | ❌ NO | v0 trabaja sobre el asset existente |
| **Cambiar proyección** | ❌ NO | Eso es configuración del componente |

**Resumen:** v0 mejora la **piel** (CSS, colores, UX), no el **esqueleto** (geometría, límites, precisión cartográfica).

---

## 8. Decisiones pendientes

| Decisión | Opciones | Recomendación provisional |
|----------|----------|---------------------------|
| **Nivel administrativo** | ADM1 (autonomías) vs ADM2 (provincias) | ADM2 para España (más granular) |
| **Ubicación de assets** | `public/` vs `src/assets/` | `public/maps/` (más flexible) |
| **Carga dinámica** | Lazy load por país vs bundle | Lazy load (import dinámico) |
| **Librería de mapas** | D3 vs Mapbox GL JS vs Leaflet | D3 (consistencia con WorldMap) |

---

## 9. Próximo paso técnico recomendado

**Bloque de trabajo inmediato:**

1. **Crear script de procesado:** `scripts/process-map-assets.ts`
   - Input: GeoJSON de geoBoundaries
   - Output: TopoJSON simplificado en `public/maps/countries/{country}/`

2. **Descargar y procesar España:**
   - geoBoundaries ESP-ADM2
   - Simplificar al ~1% de detalle
   - Guardar como `public/maps/countries/spain/spain-adm2.topojson`

3. **Crear componente `CountryMap`:**
   - Reutiliza lógica de SpainMap
   - Carga TopoJSON dinámicamente
   - Renderiza provincias como paths interactivos

4. **Migrar CountryPage:**
   - Reemplaza `<SpainMap />` por `<CountryMap countrySlug="espana" />`
   - Verificar que todo funciona igual o mejor

5. **Documentar:**
   - Actualizar CODEMAP.md
   - Añadir entrada en BITACORA.md

---

## Referencias

- **DA-027:** `docs/DECISIONES.md` - Estrategia progresiva para mapas internos
- **SpainMap actual:** `src/features/map/components/SpainMap/SpainMap.tsx`
- **geoBoundaries:** https://www.geoboundaries.org/
- **Natural Earth:** https://www.naturalearthdata.com/

---

*MAP_ASSET_PLAN v1.0 - Trawel*