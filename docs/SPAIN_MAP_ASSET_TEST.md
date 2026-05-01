# Prueba Técnica: Asset de Mapa de España (geoBoundaries ADM2)

> **Fecha:** 2026-05-01  
> **Estado:** ✅ COMPLETADO - Asset descargado automáticamente  
> **Asset candidato:** geoBoundaries gbOpen ESP ADM2 (provincias)

---

## 1. Resumen Ejecutivo

Se ha implementado un flujo automático para descargar y evaluar el asset cartográfico de geoBoundaries ADM2 para España como candidato para reemplazar el SpainMap prototipo temporal.

**Resultado:** ✅ ÉXITO - Asset descargado, analizado y verificado automáticamente.

---

## 2. Zona Controlada

```
public/maps/countries/spain/
├── spain-adm2-raw.geojson       ✅ Descargado (40.83 MB)
├── spain-adm2-metadata.json     ✅ Generado automáticamente
└── README.md                    (opcional)
```

**Ruta absoluta:** `D:\Proyectos\trawel\public\maps\countries\spain\`

---

## 3. Comando para Preparar el Asset

```bash
npm run maps:spain:prepare
```

Este comando ejecuta automáticamente:

1. **Consulta a API de geoBoundaries** - Obtiene metadata del país
2. **Descarga del GeoJSON** - Usa la URL proporcionada por la API
3. **Análisis automático** - Extrae información del asset descargado
4. **Generación de reporte** - Muestra resultados por consola

---

## 4. Scripts Implementados

### 4.1 Script de Descarga Automática: `scripts/download-geoboundaries.ts`

**Flujo completo:**
- Consulta API: `https://www.geoboundaries.org/api/current/gbOpen/ESP/ADM2`
- Detecta campo `gjDownloadURL` en la metadata
- Descarga GeoJSON automáticamente
- Ejecuta análisis integrado
- Genera reporte completo

**Características:**
- Sigue redirecciones HTTP automáticamente
- Limpia archivos corruptos si falla
- Muestra progreso detallado en consola
- Maneja múltiples URLs de fallback

### 4.2 Script de Inspección: `scripts/inspect-map-asset.ts`

**Funcionalidades exportadas:**
- `analyzeMapAsset(filePath)` - Analiza un archivo GeoJSON/TopoJSON
- `displayAnalysis(analysis)` - Muestra análisis formateado
- `extractFeatures(data)` - Extrae features de GeoJSON/TopoJSON
- `searchTerms(names, terms)` - Busca términos específicos
- `detectADM2Level()` - Detecta si es nivel administrativo ADM2

**Uso directo:**
```bash
npx tsx scripts/inspect-map-asset.ts public/maps/countries/spain/spain-adm2-raw.geojson
```

---

## 5. Resultados de la Descarga

### Metadata de geoBoundaries

| Campo | Valor |
|-------|-------|
| **boundaryID** | ESP-ADM2-93216281 |
| **boundaryName** | Spain |
| **boundaryISO** | ESP |
| **boundaryYearRepresented** | 2018 |
| **boundaryType** | ADM2 |
| **boundaryCanonical** | Province |
| **boundarySource** | El Instituto Nacional de Estadística (INE) |
| **admUnitCount** | 52 |
| **buildDate** | Dec 12, 2023 |

### Asset Descargado

| Propiedad | Valor |
|-----------|-------|
| **Archivo** | `spain-adm2-raw.geojson` |
| **Tamaño** | 40.83 MB |
| **Formato** | GeoJSON |
| **Features** | 52 (provincias españolas) |
| **Nivel** | ADM2 ✅ |
| **Sistema coordenadas** | WGS84 (EPSG:4326) |

### Propiedades del GeoJSON

- `shapeGroup` - Código del grupo
- `shapeID` - ID único de la forma
- `shapeISO` - Código ISO
- `shapeName` - Nombre de la provincia
- `shapeType` - Tipo de forma

---

## 6. Búsqueda de Términos Clave

| Término | Resultado | Notas |
|---------|-----------|-------|
| **Castellón** | ✅ ENCONTRADO EXACTO | Aparece como "Castellon" |
| **Castelló** | ✅ ENCONTRADO EXACTO | Aparece como "Castellon" (sin acento) |
| **Teruel** | ✅ ENCONTRADO EXACTO | Provincia correcta |
| **Albarracín** | ❌ NO ENCONTRADO | Correcto - es municipio, no provincia |
| **Morella** | ⚠️ SIMILAR (57%) | Correcto - es municipio, no provincia |

### Provincias Clave Confirmadas

| Provincia | Ciudad Trawel Asociada |
|-----------|------------------------|
| **Castellon** | Morella |
| **Teruel** | Albarracín |
| **Barcelona** | Barcelona |
| **Madrid** | Madrid |

---

## 7. Licencia y Atribución

### Detectada en Metadata

| Aspecto | Valor |
|---------|-------|
| **Producto** | geoBoundaries gbOpen |
| **Licencia fuente** | National Institute of Statistics (INE) Data License |
| **Licencia geoBoundaries** | CC BY 4.0 |
| **Requiere atribución** | ✅ Sí |

### Texto de Atribución Recomendado

```
"Datos cartográficos: geoBoundaries (CC BY 4.0)"
```

### Fuentes de Datos

- **Fuente original:** Instituto Nacional de Estadística (INE) de España
- **Procesado por:** geoBoundaries (University of California, Davis)
- **Año de datos:** 2018
- **URL fuente:** www.ine.es

---

## 8. Análisis: ¿Sirve ADM2 para Diferenciar Castellón y Teruel?

**✅ SÍ - CONFIRMADO**

- **Castellón** es una provincia (ADM2) con ID propio
- **Teruel** es una provincia (ADM2) con ID propio
- Ambas tienen geometrías separadas en el asset
- El asset contiene exactamente **52 features** (provincias españolas)

**Comparación de niveles:**

| Nivel | Descripción | Resultado |
|-------|-------------|-----------|
| ADM1 | Comunidades autónomas | ❌ Castellón y Teruel aparecerían juntas |
| **ADM2** | **Provincias** | ✅ **Separadas - Castellón y Teruel son distintas** |
| ADM3 | Municipios | ❌ Demasiado granular (~8,000) |

---

## 9. Próximos Pasos Recomendados

### Optimización del Asset (40.83 MB → <100KB)

El asset actual es muy grande para uso web. Se recomienda:

```bash
# 1. Simplificar geometría con mapshaper o similar
# Target: ~1% de detalle original
# Objetivo: <100KB

# 2. Convertir a TopoJSON (más compacto)
# TopoJSON suele ser 50-80% más pequeño que GeoJSON
```

### Integración Futura

1. **Crear componente `CountryMap`** genérico
2. **Cargar asset dinámicamente** por countrySlug
3. **Renderizar provincias** como paths SVG interactivos
4. **Superponer puntos de ciudad** sobre el mapa
5. **Añadir hover/click** en provincias

### Atribución en UI

- Añadir texto `"Datos cartográficos: geoBoundaries (CC BY 4.0)"`
- Posición: esquina inferior del mapa o footer
- Tamaño discreto pero legible

---

## 10. Referencias Técnicas

- **geoBoundaries API:** https://www.geoboundaries.org/api.html
- **Licencia:** https://www.geoboundaries.org/license.html
- **GitHub:** https://github.com/wmgeolab/geoBoundaries
- **INE España:** https://www.ine.es/

---

## 11. Registro de Cambios

| Fecha | Cambio |
|-------|--------|
| 2026-05-01 | Creada zona controlada `public/maps/countries/spain/` |
| 2026-05-01 | Creado script `scripts/inspect-map-asset.ts` con funciones exportables |
| 2026-05-01 | Creado script `scripts/download-geoboundaries.ts` con flujo automático |
| 2026-05-01 | Añadido script `maps:spain:prepare` a package.json |
| 2026-05-01 | **Asset descargado automáticamente** - 52 provincias confirmadas |
| 2026-05-01 | **Castellón y Teruel confirmadas** como provincias separadas |

---

*Documento actualizado tras descarga exitosa del asset geoBoundaries ESP ADM2.*