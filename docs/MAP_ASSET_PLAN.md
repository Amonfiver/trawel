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

### Opción A: geoBoundaries (Recomendada) ✅

**Ver análisis detallado en:** `docs/MAP_SOURCE_COMPARISON.md`

- **Fuente:** [geoBoundaries](https://www.geoboundaries.org/) - ADM2 (provincias)
- **Ventajas:** 
  - Datos abiertos, verificados académicamente
  - Resolución ajustable (simplificación TopoJSON)
  - Formato GeoJSON/TopoJSON nativo
- **Uso:** Descargar shapefile → convertir a GeoJSON → simplificar → guardar local

### ✅ Asset de España ya disponible (Optimizado)

**Estado:** COMPLETADO - Asset optimizado listo para producción

| Asset | Tamaño | Formato | Ubicación |
|-------|--------|---------|-----------|
| Original (raw) | 40.83 MB | GeoJSON | `public/maps/countries/spain/spain-adm2-raw.geojson` |
| **Optimizado** | **52.59 KB** | **TopoJSON** | **`public/maps/countries/spain/spain-adm2.topojson`** |

**Proceso de optimización implementado:**
- Fuente: geoBoundaries ESP-ADM2 (52 provincias)
- Conversión: GeoJSON → TopoJSON
- Simplificación: 5% de detalle original (factor 0.05)
- Validación: Castellón ✓, Teruel ✓, todas las provincias presentes
- Arquitectura final: 509 arcos compartidos en topología

**Script de procesado:**
```bash
npm run maps:spain:optimize
```
- Script: `scripts/prepare-spain-map-asset.ts`
- Requiere: `topojson-server`, `topojson-simplify`

**Documentación técnica:** `docs/SPAIN_MAP_ASSET_TEST.md` (incluye detalles de implementación y validación)

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

> **Actualizado por DA-029 (2026-05-01):** Mapas exploratorios homogéneos sin revelar disponibilidad

### Interacciones objetivo (reemplazo de SpainMap)

| Interacción | Comportamiento |
|-------------|----------------|
| **Hover sobre provincia/zona** | Cambia color de fondo, muestra nombre en tooltip |
| **Puntos de ciudad** | ❌ NO renderizar puntos/marcadores de ciudad sobre el mapa (DA-029) |
| **Labels fijos** | ❌ NO mostrar nombres siempre visibles sobre el mapa (DA-029) |
| **Click en ciudad** | Navega a `/pais/:country/:city` (si existe contenido) o página "Próximamente" |
| **Tooltip de provincia** | Muestra solo nombre (sin bandera, es subdivisión interna) |
| **Fallback sin asset** | Muestra lista clásica de ciudades (comportamiento actual Japón/Perú) |

### Principios de mapa exploratorio (DA-029)

| Principio | Implementación |
|-----------|----------------|
| **Estilo neutro** | Todos los territorios se ven igual, sin revelar disponibilidad |
| **Sin marcadores** | No hay puntos de ciudades sobre el mapa |
| **Tooltips informativos** | Nombres solo aparecen al hacer hover |
| **Color hover** | Amarillo/dorado consistente con WorldMap |
| **Descubrimiento** | El usuario explora sin saber de antemano qué tiene contenido |

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

## 8. Atribución y licencias

### Registro de assets externos

Todo asset cartográfico externo debe registrarse con:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Fuente** | Nombre de la fuente | geoBoundaries, Natural Earth, IGN |
| **Licencia** | Tipo de licencia y versión | CC BY 4.0, CC0, ODbL |
| **Fecha de descarga/procesado** | Cuándo se obtuvo el dato | 2026-05-01 |
| **Atribución requerida** | Texto exacto o referencia | "Contains data from geoBoundaries" |
| **URL de verificación** | Dónde verificar la licencia | https://www.geoboundaries.org/ |

### geoBoundaries

- **Licencia típica:** CC BY 4.0 (Creative Commons Attribution 4.0 International)
- **Requisito:** Atribución visible en la aplicación
- **Nota importante:** Verificar siempre la metadata del archivo concreto descargado, ya que pueden existir variaciones

**Atribución recomendada (verificar contra metadata del archivo):**
```
"Datos cartográficos: geoBoundaries (CC BY 4.0)"
```

O texto final equivalente según especifique la metadata del archivo descargado.

### Ubicación de la atribución en UI

- Posición: Visible cerca del mapa o en zona legal definida (footer, modal de créditos, etc.)
- Formato: Discreto pero legible
- Ejemplo: Pequeño texto en esquina inferior del mapa, o enlace a página de créditos

---

## 9. Arquitectura definitiva: Generación automática y persistente (DA-030)

> **Nota:** Esta sección reemplaza las secciones anteriores de "Próximo paso técnico" y "Decisiones pendientes".  
> Ver **DA-030** en `docs/DECISIONES.md` para la decisión completa.

### Visión general

Trawel implementará **generación automática bajo demanda** de mapas internos mediante arquitectura de worker + Supabase Storage. Cuando un usuario hace click en un país sin mapa, el sistema:

1. Inicia generación automática del asset
2. Muestra pantalla de preparación durante el proceso
3. Persiste el resultado en Supabase Storage
4. Servirá el mapa cacheado en visitas posteriores

### Flujo de generación automática

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Supabase  │◀────│  Worker/Backend │
│  (CountryMap)│    │   (Estado)  │     │  (Generación)   │
└──────┬──────┘     └──────┬──────┘     └─────────────────┘
       │                   │
       │            ┌──────┴──────┐
       │            │   Storage   │
       └───────────▶│ map-assets  │
                    │  (TopoJSON) │
                    └─────────────┘
```

| Paso | Acción | Responsable |
|------|--------|-------------|
| 1 | Usuario navega a `/pais/{countrySlug}` | Frontend |
| 2 | Consulta `country_map_assets.status` | Frontend → Supabase |
| 3 | Si `ready`: carga TopoJSON desde Storage URL | Frontend |
| 4 | Si `missing`: solicita generación (insert `queued`) | Frontend |
| 5 | Worker detecta registro `queued` | Worker |
| 6 | Actualiza estado a `generating` | Worker |
| 7 | Descarga GeoJSON de geoBoundaries | Worker |
| 8 | Normaliza winding, simplifica, convierte a TopoJSON | Worker |
| 9 | Sube asset a Storage bucket `map-assets` | Worker |
| 10 | Actualiza estado a `ready` con URL | Worker |
| 11 | Frontend detecta `ready` (polling/refresh) y carga mapa | Frontend |

### Estados del mapa

| Estado | Significado | UI mostrada |
|--------|-------------|-------------|
| `missing` | No existe asset | Botón "Explorar" → inicia generación |
| `queued` | En cola de procesamiento | Pantalla "Preparando mapa..." |
| `generating` | Procesando (10-30s típico) | Animación de progreso |
| `ready` | Asset disponible | Mapa interactivo renderizado |
| `failed` | Error en generación | Mensaje + botón reintentar |

### Distinción crítica: Investighost vs Sistema técnico de Trawel

| Aspecto | Investighost | Trawel (sistema técnico) |
|---------|--------------|--------------------------|
| **Genera** | Contenido editorial (sitios, rutas, textos) | Mapas cartográficos (assets TopoJSON) |
| **Input** | Investigación humana/IA | geoBoundaries API |
| **Output** | Drafts en tablas Supabase | Assets en Storage bucket |
| **Responsabilidad** | Contenido editorial | Infraestructura cartográfica |

> **Regla fundamental:** Investighost **NO** genera mapas. Los mapas son responsabilidad del sistema técnico de Trawel.

### Persistencia

**Tabla `country_map_assets`** (ver migración completa en `supabase/migrations/002_create_country_map_assets.sql`):

```sql
CREATE TABLE country_map_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_slug TEXT NOT NULL UNIQUE,
    country_name TEXT,
    iso_alpha2 TEXT,
    iso_alpha3 TEXT,
    admin_level TEXT NOT NULL DEFAULT 'ADM2',
    status TEXT NOT NULL DEFAULT 'missing',
    storage_bucket TEXT DEFAULT 'map-assets',
    storage_path TEXT,
    source TEXT DEFAULT 'geoBoundaries',
    license TEXT,
    attribution TEXT,
    feature_count INTEGER,
    size_bytes INTEGER,
    requested_count INTEGER NOT NULL DEFAULT 0,
    last_requested_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraints
CHECK (status IN ('missing', 'queued', 'generating', 'ready', 'failed'))
CHECK (admin_level IN ('ADM0', 'ADM1', 'ADM2', 'ADM3', 'ADM4', 'ADM5'))

-- Índices
CREATE INDEX idx_country_map_assets_status ON country_map_assets(status);
CREATE INDEX idx_country_map_assets_country_slug ON country_map_assets(country_slug);

-- RLS: SELECT público, escritura restringida a service role
ALTER TABLE country_map_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to country_map_assets"
ON country_map_assets FOR SELECT USING (true);
```

**Storage bucket `map-assets`:**
```
countries/
  espana/
    espana-adm2.topojson
    metadata.json
  francia/
    francia-adm2.topojson
    metadata.json
```

**Políticas de Storage:**
- Bucket: `map-assets` (público para lectura)
- SELECT: Público (frontend puede descargar assets)
- INSERT/UPDATE/DELETE: Solo service role (backend/worker)

### Componentes del sistema

| Componente | Tecnología | Responsabilidad |
|------------|------------|-----------------|
| Frontend | React + D3 | UI de estados, renderizado de mapa, polling |
| Supabase DB | PostgreSQL | Tabla `country_map_assets`, estado |
| Supabase Storage | S3-compatible | Bucket `map-assets`, archivos TopoJSON |
| Worker | Edge Function / Serverless | Procesamiento GeoJSON → TopoJSON |
| Fuente | geoBoundaries API | Datos cartográficos oficiales |

### Proceso del worker (detalle)

El worker ejecuta el pipeline ya probado en scripts locales:

```typescript
// Pseudo-código del worker
async function generateMapAsset(countrySlug: string) {
  // 1. Consultar metadata de geoBoundaries
  const metadata = await fetchGeoBoundariesMetadata(countrySlug);
  
  // 2. Descargar GeoJSON (puede ser 10-40MB)
  const geojson = await downloadGeoJSON(metadata.downloadUrl);
  
  // 3. Normalizar winding de polígonos
  const normalized = normalizePolygonWinding(geojson);
  
  // 4. Simplificar geometría (~1-5% de detalle)
  const simplified = simplifyGeometry(normalized, 0.02);
  
  // 5. Convertir a TopoJSON
  const topojson = convertToTopoJSON(simplified);
  
  // 6. Subir a Storage
  const path = `countries/${countrySlug}/${countrySlug}-adm2.topojson`;
  await uploadToStorage(path, topojson);
  
  // 7. Actualizar estado a 'ready'
  await updateAssetStatus(countrySlug, 'ready', path);
}
```

### Runtime del navegador: limitaciones claras

| Aspecto | ¿Navegador? | ¿Worker? |
|---------|-------------|----------|
| Descargar archivos 10-40MB | ❌ No | ✅ Sí |
| Escribir archivos locales | ❌ No (seguridad) | ✅ Sí (Storage) |
| Procesar GeoJSON pesado | ⚠️ Lento/Bloqueante | ✅ Optimizado |
| Persistencia entre sesiones | ❌ No | ✅ Sí (Storage) |

**Conclusión:** El navegador **nunca** procesa directamente archivos grandes ni escribe assets locales. Todo el procesamiento pesado ocurre en el worker backend.

### Primera visita vs. posteriores

| Escenario | Tiempo estimado | Experiencia |
|-----------|-----------------|-------------|
| **Primera visita** (asset no existe) | 10-30 segundos | Pantalla de preparación con animación |
| **Segunda visita** (misma sesión) | <1 segundo | Mapa cacheado en memoria |
| **Días después** | <1 segundo | Asset persistido en Storage |
| **Asset corrupto** | 10-30 segundos | Detecta error, marca `failed`, permite reintentar |

### Ventajas de esta arquitectura

1. **Escalabilidad:** Cualquier país del mundo bajo demanda
2. **Sin preparación manual:** No requiere descargar/procesar países por adelantado
3. **Separación de responsabilidades:** Investighost se enfoca en contenido editorial
4. **Persistencia:** El trabajo de generación se hace una sola vez
5. **Fallback controlado:** Estados claros para errores y reintentos
6. **Costo eficiente:** Solo se almacenan países que los usuarios realmente visitan

### Referencias

- **DA-030:** `docs/DECISIONES.md` - Decisión completa de generación automática
- **DA-029:** `docs/DECISIONES.md` - Mapas exploratorios con bandera
- **DA-027:** `docs/DECISIONES.md` - Estrategia progresiva (reemplazada por DA-030)
- **SpainMap actual:** `src/features/map/components/SpainMap/SpainMap.tsx`
- **geoBoundaries:** https://www.geoboundaries.org/
- **Natural Earth:** https://www.naturalearthdata.com/

---

*MAP_ASSET_PLAN v2.0 - Trawel*
*Actualizado para DA-030: Generación automática y persistente*
