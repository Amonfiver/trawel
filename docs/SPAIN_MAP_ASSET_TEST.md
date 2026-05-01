# Prueba Técnica: Asset de Mapa de España (geoBoundaries ADM2)

> **Fecha:** 2026-05-01  
> **Estado:** Intentado - Requiere descarga manual desde GitHub  
> **Asset candidato:** geoBoundaries gbOpen ESP ADM2 (provincias)

---

## 1. Resumen Ejecutivo

Se intentó descargar y evaluar el asset cartográfico de geoBoundaries ADM2 para España como candidato para reemplazar el SpainMap prototipo temporal. 

**Resultado:** Las descargas automatizadas fallaron debido a GitHub LFS (Large File Storage). Se proporcionan instrucciones manuales y scripts de inspección listos para usar.

**Recomendación:** Descargar manualmente desde el sitio web de geoBoundaries y ejecutar el script de inspección localmente.

---

## 2. Zona Controlada Creada

```
public/maps/countries/spain/
├── spain-adm2-raw.geojson    (pendiente: descargar manualmente)
├── spain-adm2-metadata.json  (pendiente: generar tras descarga)
└── README.md                 (pendiente: crear tras validación)
```

**Ruta absoluta:** `D:\Proyectos\trawel\public\maps\countries\spain\`

---

## 3. Fuentes de Descarga

### Opción A: Descarga Web Manual (Recomendada)
1. Visitar: https://www.geoboundaries.org/
2. Navegar a: **Download → gbOpen → Spain → ADM2**
3. Descargar: `ESP_ADM2.geojson` (versión completa) o `ESP_ADM2_simplified.geojson` (versión simplificada)
4. Guardar en: `public/maps/countries/spain/spain-adm2-raw.geojson`

### Opción B: GitHub Releases
- URL base: https://github.com/wmgeolab/geoBoundaries/releases
- Buscar release más reciente (ej: v6.0.0)
- Descargar: `gbOpen_ESP_ADM2.geojson` o `gbOpen_ESP_ADM2_simplified.geojson`

### Opción C: API geoBoundaries (para referencia)
```
GET https://www.geoboundaries.org/api/gb/2.0.0/gbOpen/ESP/ADM2
```
*Nota: La API devuelve metadatos JSON con URLs de descarga, no el archivo directamente.*

---

## 4. Scripts Creados

### 4.1 Script de Inspección: `scripts/inspect-map-asset.ts`

**Uso:**
```bash
npx tsx scripts/inspect-map-asset.ts public/maps/countries/spain/spain-adm2-raw.geojson
```

**Funcionalidades:**
- Lee archivos GeoJSON/TopoJSON
- Muestra tamaño del archivo
- Lista campos disponibles en properties
- Extrae y lista nombres únicos (provincias)
- Busca términos clave: Castellón, Castelló, Teruel, Albarracín, Morella
- Detecta nivel administrativo (ADM1/ADM2/ADM3)
- Verifica metadatos de licencia si existen
- Genera conclusión sobre idoneidad del asset

**Dependencias:** Ninguna (usa solo Node.js nativo)

### 4.2 Script de Descarga (fallback): `scripts/download-geoboundaries.ts`

**Uso:**
```bash
npx tsx scripts/download-geoboundaries.ts
```

**Nota:** Falla en entornos donde GitHub LFS no resuelve archivos grandes. Usar solo como referencia de URLs.

---

## 5. Licencia y Atribución

### Fuente: geoBoundaries (University of California, Davis)

| Aspecto | Valor |
|---------|-------|
| **Producto** | gbOpen (geoBoundaries Open) |
| **Licencia típica** | CC BY 4.0 (Creative Commons Attribution 4.0 International) |
| **Requiere atribución** | ✅ Sí, visible en UI |
| **Uso comercial** | ✅ Permitido |
| **Modificación** | ✅ Permitida |
| **Distribución** | ✅ Permitida |

### Texto de atribución recomendado:
```
"Datos cartográficos: geoBoundaries (CC BY 4.0)"
```

### Verificación requerida:
- [ ] Verificar metadata específica del archivo descargado
- [ ] Confirmar licencia en: https://www.geoboundaries.org/license.html
- [ ] Añadir atribución visible cerca del mapa en la UI

---

## 6. Especificaciones Esperadas del Asset

Basado en la documentación de geoBoundaries:

| Propiedad | Valor esperado |
|-----------|----------------|
| **Formato** | GeoJSON |
| **Sistema de coordenadas** | WGS84 (EPSG:4326) |
| **Nivel administrativo** | ADM2 (provincias) |
| **Número de features** | ~52 (provincias españolas) |
| **Tamaño estimado** | 200-400 KB (sin simplificar) |
| **Campos típicos** | shapeName, shapeISO, shapeGroup, etc. |

### Provincias clave para verificar:
| Provincia | Ciudad Trawel asociada |
|-----------|------------------------|
| Castellón/Castelló | Morella |
| Teruel | Albarracín |
| Madrid | Madrid |
| Barcelona | Barcelona |

---

## 7. Instrucciones para Completar la Prueba

### Paso 1: Descargar manualmente
```bash
# Opción: Usar navegador web
# 1. Ir a https://www.geoboundaries.org/
# 2. Descargar ESP_ADM2.geojson
# 3. Guardar como: public/maps/countries/spain/spain-adm2-raw.geojson
```

### Paso 2: Ejecutar inspección
```bash
npx tsx scripts/inspect-map-asset.ts public/maps/countries/spain/spain-adm2-raw.geojson
```

### Paso 3: Verificar resultados
El script debe confirmar:
- [ ] Número de features (~52 provincias)
- [ ] Presencia de "Castellón" o "Castelló"
- [ ] Presencia de "Teruel"
- [ ] Ausencia de "Morella" y "Albarracín" (son municipios, no provincias)
- [ ] Campos de nombre disponibles

### Paso 4: Documentar resultados
Actualizar este archivo con:
- Tamaño real del archivo
- Número exacto de features
- Lista de campos encontrados
- Resultado de búsqueda de términos clave
- Confirmación de nivel ADM2

---

## 8. Análisis Preliminar (sin archivo)

### ¿Sirve geoBoundaries ADM2 para diferenciar Castellón y Teruel?

**SÍ.** Según la documentación de geoBoundaries:

- **Castellón** es una provincia (ADM2) dentro de la Comunidad Valenciana (ADM1)
- **Teruel** es una provincia (ADM2) dentro de Aragón (ADM1)
- Ambas están en el mismo nivel administrativo (ADM2 = provincias)
- El asset ADM2 las representa como features separadas con geometrías distintas

### ¿Por qué ADM2 y no ADM1?

| Nivel | Descripción | Problema para Trawel |
|-------|-------------|----------------------|
| ADM1 | Comunidades autónomas | Castellón y Teruel aparecen juntas en "Aragón" |
| **ADM2** | **Provincias** | ✅ **Castellón y Teruel son provincias separadas** |
| ADM3 | Municipios/comarcas | Demasiado granular, ~8,000 municipios |

---

## 9. Próximos Pasos Recomendados

### Inmediato (tras descarga manual):
1. Ejecutar `scripts/inspect-map-asset.ts`
2. Documentar resultados en esta nota técnica
3. Verificar licencia específica del archivo

### Fase 2 (si el asset es válido):
1. Simplificar geometría si es necesario (>100KB)
2. Convertir a TopoJSON para optimización
3. Crear componente `CountryMap` genérico
4. Reemplazar `SpainMap` provisional

### Atribución UI:
- Añadir texto "Datos cartográficos: geoBoundaries (CC BY 4.0)" cerca del mapa
- Posición: esquina inferior derecha del mapa o footer

---

## 10. Referencias

- **geoBoundaries:** https://www.geoboundaries.org/
- **Licencia gbOpen:** https://www.geoboundaries.org/license.html
- **GitHub:** https://github.com/wmgeolab/geoBoundaries
- **MAP_ASSET_PLAN.md:** Plan general de assets cartográficos
- **MAP_SOURCE_COMPARISON.md:** Comparación con Natural Earth

---

## 11. Registro de Cambios

| Fecha | Cambio |
|-------|--------|
| 2026-05-01 | Creada zona controlada `public/maps/countries/spain/` |
| 2026-05-01 | Creado script `scripts/inspect-map-asset.ts` |
| 2026-05-01 | Creado script `scripts/download-geoboundaries.ts` (fallback) |
| 2026-05-01 | Intentadas descargas automatizadas (fallidas por GitHub LFS) |
| 2026-05-01 | Documentado procedimiento manual de descarga |

---

*Nota: Este documento será actualizado tras la descarga manual y ejecución del script de inspección.*