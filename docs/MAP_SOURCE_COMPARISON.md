# Comparación de Fuentes Cartográficas - Mapa Interno de España

> **Fecha:** 2026-05-01  
> **Estado:** Análisis comparativo para decisión de fuente  
> **Relacionado:** DA-027, MAP_ASSET_PLAN.md  
> **Objetivo:** Elegir fuente definitiva para asset local de España (Fase 2)

---

## 1. Objetivo de la comparación

Antes de implementar el reemplazo de SpainMap (prototipo temporal) por un asset cartográfico fiable, es necesario comparar las fuentes candidatas y seleccionar la más adecuada para el caso específico de España.

**Criterios de decisión:**
- Licencia compatible con uso comercial/público
- **Cumplimiento de atribución visible en UI** (crítico para requisitos legales)
- Nivel administrativo apropiado (provincias vs. autonomías)
- Idoneidad para mostrar ciudades como Morella, Albarracín, Madrid, Barcelona
- Tamaño optimizado para web (< 100KB)
- Facilidad de procesamiento a GeoJSON/TopoJSON
- Calidad visual en dispositivos móviles

**No implementar todavía:** Esta comparación es para tomar una decisión informada antes de descargar y procesar el asset.

---

## 2. Fuentes comparadas

### 2.1 geoBoundaries (University of California, Davis)

**Descripción:** Base de datos de límites administrativos verificados académicamente.

**Niveles disponibles para España:**
| Nivel | Descripción | Ciudades ejemplo visibles |
|-------|-------------|---------------------------|
| ADM0 | País completo | España (demasiado general) |
| ADM1 | Comunidades autónomas | Cataluña, Comunidad Valenciana, Aragón |
| ADM2 | Provincias | Castellón, Teruel, Madrid, Barcelona |
| ADM3 | Municipios/comarcas | Morella, Albarracín (posiblemente) |

**Licencia:** CC BY 4.0 para gbOpen (verificar metadata del archivo concreto)
- ✅ Uso comercial permitido
- ✅ Modificación permitida
- ✅ Distribución permitida
- ⚠️ **Requiere atribución visible**: "Datos cartográficos: geoBoundaries (CC BY 4.0)" o según indique metadata
- ⚠️ **Nota:** geoBoundaries documenta CC BY 4.0 para gbOpen; revisar siempre metadata del archivo concreto descargado

**Formato:** Shapefile, GeoJSON, TopoJSON disponibles

**Tamaño estimado (España ADM2, simplificado al 1%):**
- GeoJSON: ~150-300KB
- TopoJSON: ~50-100KB (recomendado)

**Procesamiento:**
- Descarga directa desde API o sitio web
- Conversión a TopoJSON con `topojson-simplify`
- Simplificación ajustable por porcentaje

**Idoneidad para España:**
- ✅ ADM2 (provincias) es ideal para mostrar ciudades turísticas
- ✅ Castellón y Teruel son provincias distintas (ADM2)
- ✅ Morella queda dentro de provincia de Castellón
- ✅ Albarracín queda dentro de provincia de Teruel
- ✅ Madrid y Barcelona como provincias individuales

**Fuentes de datos para España:**
- Instituto Geográfico Nacional (IGN) español
- Datos verificados académicamente

---

### 2.2 Natural Earth (naturalearthdata.com)

**Descripción:** Dataset de dominio público para cartografía a pequeña escala.

**Niveles disponibles para España:**
| Escala | Resolución | Detalle administrativo |
|--------|------------|------------------------|
| 1:10m | Alta | Admin 1 (regiones/autonomías) |
| 1:50m | Media | Admin 1 (regiones/autonomías) |
| 1:110m | Baja | Admin 1 (solo países) |

**Licencia:** Dominio público (CC0)
- ✅ Sin restricciones de uso
- ✅ Sin atribución requerida
- ✅ Uso comercial libre

**Formato:** Shapefile, GeoJSON

**Tamaño estimado (Admin 1, escala 1:10m, simplificado):**
- GeoJSON: ~200-400KB
- TopoJSON: ~80-150KB

**Procesamiento:**
- Descarga manual de shapefiles
- Conversión con herramientas como `ogr2geojson` o `mapshaper`
- Menos simplificación disponible nativamente

**Idoneidad para España:**
- ✅ Admin 1 (autonomías) útil para vista general
- ⚠️ **NO incluye provincias (ADM2)** - solo comunidades autónomas
- ❌ Castellón y Teruel aparecen juntas en Aragón (misma autonomía)
- ❌ No permite diferenciar visualmente provincias dentro de Aragón
- ⚠️ Madrid es comunidad autónoma de una sola provincia (sí se distingue)
- ⚠️ Barcelona queda dentro de Cataluña (varias provincias juntas)

**Fuentes de datos para España:**
- Varios proveedores, menos específico que geoBoundaries

---

## 3. Tabla comparativa

| Criterio | geoBoundaries ADM2 | Natural Earth Admin 1 |
|----------|-------------------|----------------------|
| **Licencia** | CC BY 4.0 (requiere atribución visible) | CC0 (dominio público) |
| **Cumplimiento atribución UI** | ⚠️ Requerido: texto visible cerca del mapa | ✅ No requiere atribución |
| **Nivel administrativo** | ✅ Provincias (ADM2) | ⚠️ Autonomías (ADM1) |
| **Castellón visible** | ✅ Sí, provincia individual | ❌ No, en Aragón junto con Teruel |
| **Teruel visible** | ✅ Sí, provincia individual | ❌ No, en Aragón junto con Castellón |
| **Morella ubicada** | ✅ En provincia Castellón | ⚠️ En Aragón (menos preciso) |
| **Albarracín ubicada** | ✅ En provincia Teruel | ⚠️ En Aragón (menos preciso) |
| **Madrid** | ✅ Provincia individual | ✅ Comunidad individual |
| **Barcelona** | ✅ Provincia individual | ⚠️ En Cataluña (varias provincias) |
| **Tamaño optimizado** | ✅ ~50-100KB TopoJSON | ⚠️ ~80-150KB TopoJSON |
| **Facilidad procesamiento** | ✅ API disponible, formatos varios | ⚠️ Descarga manual, shapefile |
| **Calidad móvil** | ✅ Alta con simplificación | ✅ Buena |
| **Riesgo mantenimiento** | Bajo (actualizado anualmente) | Bajo (estable) |
| **Específico España** | ✅ Sí, fuente IGN | ⚠️ Genérico mundial |
| **Precisión geográfica** | ✅ Alta (fuente oficial española) | ⚠️ Media (general mundial) |
| **Cumplimiento legal** | ⚠️ Requiere atribución visible en UI | ✅ Sin requisitos |

**Nota importante sobre licencias:**  
geoBoundaries documenta CC BY 4.0 para su producto gbOpen, pero siempre se debe verificar la metadata del archivo concreto descargado. La atribución debe ser visible en la interfaz de usuario, no solo en documentación técnica.

---

## 4. Análisis específico para ciudades Trawel

### Ciudades actuales en España:

| Ciudad | Provincia (ADM2) | Comunidad (ADM1) | geoBoundaries ADM2 | Natural Earth ADM1 |
|--------|-----------------|------------------|-------------------|-------------------|
| Madrid | Madrid | Madrid | ✅ Individual | ✅ Individual |
| Barcelona | Barcelona | Cataluña | ✅ Individual | ⚠️ En grupo |
| Morella | Castellón | Com. Valenciana | ✅ Individual | ⚠️ En grupo |
| Albarracín | Teruel | Aragón | ✅ Individual | ⚠️ En grupo |

### Problema clave con Natural Earth:
Para mostrar **Morella** (Castellón) y **Albarracín** (Teruel) en el mismo mapa:
- **geoBoundaries ADM2:** Dos provincias diferentes, colores diferentes posibles
- **Natural Earth ADM1:** Ambas en Aragón, mismo color, no se distingue la frontera provincial

---

## 5. Recomendación

### Fuente recomendada: **geoBoundaries ADM2 (provincias)**

**Justificación:**

1. **Nivel administrativo adecuado:** Las provincias españolas (ADM2) son la unidad territorial ideal para un mapa turístico. Permiten mostrar suficiente detalle sin saturar.

2. **Idoneidad para ciudades actuales:** Todas las ciudades españolas actuales (Madrid, Barcelona, Morella/Castellón, Albarracín/Teruel) quedan en provincias distintas, permitiendo diferenciación visual.

3. **Precisión:** Fuente basada en datos del IGN español, máxima autoridad cartográfica nacional.

4. **Tamaño optimizable:** Con simplificación al 1-2%, el TopoJSON resultante estará bien bajo 100KB.

5. **Licencia aceptable:** CC BY 4.0 requiere atribución visible pero permite uso comercial sin problemas.

### Alternativa descartada: Natural Earth Admin 1
Aunque es dominio público y más simple, el nivel de autonomías es **demasiado grueso** para España. Agrupa ciudades importantes en regiones muy grandes (Aragón, Cataluña) perdiendo valor informativo para el usuario.

### ¿Combinar ambas?
**No recomendado.** Añade complejidad innecesaria. geoBoundaries ADM2 proporciona todo lo necesario.

---

## 6. Ruta propuesta para asset local

### Opción A (recomendada):
```
public/maps/countries/spain/
├── spain-adm2.topojson          # Asset principal (provincias)
└── README.md                    # Fuente: geoBoundaries ADM2, fecha, licencia
```

### Opción B:
```
public/maps/countries/spain-provinces.topojson   # Nombre explícito
```

**Recomendación:** Opción A con estructura de carpetas, permite añadir más archivos (metadatos, ciudades, etc.) sin desordenar.

---

## 7. Proceso de incorporación (Fase 2)

Pasos a seguir una vez elegida la fuente:

1. **Descargar:**
   - Visitar https://www.geoboundaries.org/
   - Buscar "Spain" → ADM2 (provincias)
   - Descargar GeoJSON o Shapefile

2. **Procesar:**
   - Usar `mapshaper` o script Node.js para simplificación
   - Target: ~1-2% de detalle original
   - Convertir a TopoJSON

3. **Optimizar:**
   - Verificar tamaño < 100KB
   - Validar geometría (sin errores de topología)
   - Revisar que todas las provincias con ciudades Trawel estén presentes

4. **Guardar:**
   - Colocar en `public/maps/countries/spain/spain-adm2.topojson`
   - Añadir README.md con atribución requerida

5. **Integrar:**
   - Crear componente `CountryMap` genérico
   - Cargar TopoJSON dinámicamente por countrySlug
   - Renderizar provincias como paths SVG interactivos
   - Superponer puntos de ciudad publicados

6. **Verificar:**
   - Hover sobre provincia muestra nombre
   - Puntos de ciudad clickeables
   - Navegación a CityPage funciona
   - Responsive en móvil

---

## 8. Nota para v0

> **v0 mejora la presentación visual, no el origen cartográfico.**

| Aspecto | Responsabilidad v0 |
|---------|-------------------|
| Colores del mapa | ✅ Paleta, estados hover |
| Estilo de provincias | ✅ Bordes, fills, sombras |
| Tipografía labels | ✅ Fuentes, tamaños |
| Layout y espaciado | ✅ Márgenes, responsive |
| **Crear cartografía** | ❌ NO - Eso es asset geoBoundaries |
| **Cambiar provincias** | ❌ NO - Eso es decisión técnica/geoBoundaries |

---

## 9. Referencias

- **geoBoundaries:** https://www.geoboundaries.org/
- **Natural Earth:** https://www.naturalearthdata.com/
- **DA-027:** `docs/DECISIONES.md` - Estrategia progresiva para mapas internos
- **MAP_ASSET_PLAN:** `docs/MAP_ASSET_PLAN.md` - Plan general de assets cartográficos
- **IGN España:** https://www.ign.es/ (fuente original de geoBoundaries)

---

## 10. Decisión final

| Aspecto | Decisión |
|---------|----------|
| **Fuente** | geoBoundaries ADM2 (provincias) |
| **Nivel** | ADM2 - Provincias españolas |
| **Formato** | TopoJSON simplificado (~1%) |
| **Ruta** | `public/maps/countries/spain/spain-adm2.topojson` |
| **Atribución** | "Datos cartográficos: geoBoundaries (CC BY 4.0)" (verificar metadata) |
| **Próximo paso** | Descargar, procesar, integrar en Fase 2 |

---

*MAP_SOURCE_COMPARISON v1.0 - Trawel*