# Plan de Assets Cartográficos - Trawel

> **Fecha:** 2026-05-01  
> **Estado:** Diagnóstico completado, planificado para implementación futura  
> **Relacionado:** DA-027 (Estrategia progresiva para mapas internos)

---

## 1. Problema detectado

### Estado actual de mapas internos

`CountryInternalMap` es el render principal para mapas internos:

| Aspecto | Estado actual |
|---------|---------------|
| **España** | Usa `/maps/countries/spain/spain-adm2.topojson` |
| **Países automáticos** | Usan `publicUrl` desde Supabase Storage cuando `country_map_assets.status = 'ready'` |
| **Render** | D3 + TopoJSON + `geoMercator().fitSize()` |
| **Estilo** | Gris neutro + hover dorado, homogéneo con WorldMap |
| **Marcadores** | No hay puntos ni labels fijos de ciudad |
| **Tooltip** | Solo nombre de zona/área al pasar el ratón |

`SpainMap` queda como wrapper legado temporal sobre `CountryInternalMap`.

### Estado anterior de SpainMap (src/features/map/components/SpainMap/)

El componente `SpainMap` implementado es **funcional pero no definitivo**:

| Aspecto | Estado actual | Problema |
|---------|---------------|----------|
| **Silueta de España** | Path SVG manual (~línea 122) | Forma aproximada, no geográficamente precisa |
| **Islas** | Elipses simplificadas | Representación simbólica, no real |
| **Mantenibilidad** | Código manual de 220 líneas | Difícil de adaptar a otros países |
| **Escala** | Bounding box manual | Proyección simplificada, no estándar |
| **Escalabilidad** | SVG estático inline | No reusable para otros países sin refactor mayor |

**Conclusión histórica:** este SpainMap fue reemplazado por `CountryInternalMap`. El wrapper `SpainMap` ya no mantiene render propio ni pinta ciudades encima del mapa.

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
| **Optimizado actual** | **~231 KB** | **TopoJSON** | **`public/maps/countries/spain/spain-adm2.topojson`** |

**Proceso de optimización implementado:**
- Fuente: geoBoundaries ESP-ADM2 (52 provincias)
- Conversión: GeoJSON → TopoJSON
- Simplificación: threshold conservador `0.0002`
- Validación: Castellón ✓, Teruel ✓, todas las provincias presentes, islas pequeñas aceptadas visualmente
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
| **Tamaño objetivo** | Peso razonable por país; priorizar calidad visual si gzip sigue asumible |
| **Simplificación** | Threshold configurable por país/nivel; default recomendado `0.0001` |
| **Proyección** | WGS84 (EPSG:4326) para consistencia |
| **Metadatos** | Fuente, fecha, versión en JSON |

---

## 4.1 Estándar de calidad cartográfica (2026-05-10)

### WorldMap

El mapa mundial de Trawel es una pieza protagonista y debe usar una resolución suficiente para zoom/pan:

| Asset world-atlas | Estado | Motivo |
|-------------------|--------|--------|
| `countries-110m.json` | Descartado para mapa protagonista | Costas/fronteras demasiado simplificadas |
| `countries-50m.json` | Estándar actual MVP | Mejor equilibrio entre detalle, peso y rendimiento |
| `countries-10m.json` | Futuro opcional | Mucho más pesado; solo evaluar con optimización/cache |

Métricas de referencia sin Antártida:

| Resolución | Tamaño | Gzip aprox. | Puntos aprox. | Decisión |
|------------|--------|-------------|---------------|----------|
| 110m | 107,761 B | 38,423 B | 9,934 | No usar como estándar visual |
| 50m | 756,420 B | 232,879 B | 94,625 | Estándar actual |
| 10m | 3,661,071 B | 954,233 B | 521,877 | Reservado para futuro |

### Mapas internos de país

El threshold fijo `0.02` de `topojson.simplify` queda descartado como estándar global: no equivale a "2% de detalle" y puede colapsar islas o zonas pequeñas en triángulos/cajas.

Regla actual:

| Caso | Threshold validado | Resultado |
|------|--------------------|-----------|
| España ADM2 | `0.0002` | Aceptado visualmente; islas pequeñas ya no aparecen como triángulos perfectos |
| México ADM1 | `0.0001` | Aceptado visualmente tras probar que `0.0002` seguía algo rectilíneo |
| India ADM1 | `0.0001` pendiente de regenerar | `0.0002` funciona, pero queda algo rectilíneo |
| Rumanía ADM1 | `0.0001` pendiente de regenerar | `0.0002` funciona, pero queda algo rectilíneo |
| Default actual | `0.0001` | Estándar visual principal para MVP |

El pipeline resuelve la simplificación por `countrySlug + adminLevel`, con overrides explícitos para países costeros, insulares o con fronteras complejas. `0.0002` queda como opción ligera excepcional; `0.00005` queda reservado para países costeros/insulares difíciles si `0.0001` no basta.

### Validación mínima antes de aprobar un asset

Para cada asset interno se debe registrar:

- Tamaño final y gzip aproximado.
- Número de features.
- Número de arcos.
- Puntos totales.
- Conteo de puntos en features pequeñas, costeras o insulares.
- Revisión visual de islas, costas, fronteras finas y zonas pequeñas.
- Prueba de zoom/pan en escritorio.
- Prueba rápida de touch móvil cuando aplique.

No aprobar assets donde zonas pequeñas queden reducidas a 4-10 puntos salvo justificación explícita. No borrar ni sobrescribir assets antiguos sin backup o rollback claro, especialmente cuando el asset vive en Supabase Storage.

---

## 5. Comportamiento esperado del mapa

> **Actualizado por DA-029 (2026-05-01):** Mapas exploratorios homogéneos sin revelar disponibilidad

### Interacciones objetivo

| Interacción | Comportamiento |
|-------------|----------------|
| **Hover sobre provincia/zona** | Cambia color de fondo, muestra nombre en tooltip |
| **Puntos de ciudad** | ❌ NO renderizar puntos/marcadores de ciudad sobre el mapa (DA-029) |
| **Labels fijos** | ❌ NO mostrar nombres siempre visibles sobre el mapa (DA-029) |
| **Click en ciudad** | ❌ No ocurre dentro del mapa; el contenido se navega desde bloques/listas fuera del mapa |
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

### Diferencias con SpainMap anterior

| Aspecto | SpainMap anterior | CountryInternalMap |
|---------|-----------------|---------------------|
| Base cartográfica | SVG manual (~líneas 119-146) | GeoJSON/TopoJSON preciso |
| Provincias/zonas | No disponible | Hover con nombre |
| Escalabilidad | España única | Fácil añadir países |
| Precisión | Aproximada (~km) | Precisión de fuente oficial |
| Mantenimiento | Manual | Script de procesado |

---

## 6. Plan por fases

### Fase 1: Prototipo SpainMap (SUPERADA)
- ✅ SpainMap funcionó como prototipo con puntos interactivos
- ✅ Integración inicial en CountryPage
- ✅ Reemplazado por `CountryInternalMap` para cumplir DA-029

### Fase 2: Render genérico limpio (COMPLETADA)

**Tareas:**
1. ✅ Usar asset real de España desde `public/maps/countries/spain/`
2. ✅ Crear `CountryInternalMap` genérico:
   - Recibe `assetUrl`, `countryName`, `attribution`
   - Detecta automáticamente `topology.objects`
   - Renderiza provincias/zonas como paths
   - No superpone puntos de ciudad
   - No muestra labels fijos
3. ✅ Actualizar CountryPage para usar `CountryInternalMap` en España y assets `ready` de Storage
4. ✅ Marcar `SpainMap` como wrapper legado temporal

**Criterios de aceptación:**
- [x] Asset de España con gzip asumible y calidad visual aceptada
- [x] Provincias visibles con hover
- [x] Sin puntos de ciudad
- [x] Sin labels fijos
- [x] Contenido editorial fuera del mapa
- [x] Build sin errores

### Fase 3: Añadir más países bajo demanda

**Cuándo añadir un nuevo país:**
- Cuando tenga 3+ ciudades publicadas
- Cuando haya tráfico significativo en su CountryPage
- Bajo demanda editorial explícita

**Proceso por país:**
1. Definir el nivel recomendado en `src/features/map/config/countryMapProfiles.ts`
2. Descargar geoBoundaries ADM1/ADM2 del país según el perfil
3. Ejecutar script de procesado
4. Añadir a `public/maps/countries/{country}/`
5. Añadir `countrySlug` a lista de países con mapa
6. Verificar posicionamiento de ciudades

### Nivel cartográfico por país (DA-031)

El nivel interno se decide por utilidad UX/turística, no por máximo detalle administrativo. La base general para países nuevos es `ADM1` (regiones, estados o provincias principales). `ADM2` solo se usa por excepción justificada cuando aporta valor visual/comercial claro.

Las ciudades importantes no salen de ADM2: se gestionan como contenido editorial, aventuras, rutas, cards o listados de Trawel/Investighost.

| País | Nivel recomendado | Motivo |
|------|-------------------|--------|
| España | ADM2 | Provincias |
| México | ADM1 | Estados, evitando granularidad excesiva |
| Estados Unidos | ADM1 | Estados, evitando granularidad excesiva y errores observados con ADM2 |
| Italia | ADM1 | Regiones principales; ciudades como contenido editorial |
| Rumanía | ADM1 | ADM2 genera miles de subdivisiones demasiado pequeñas |
| India | ADM1 | Estados/territorios; ADM2 es demasiado granular para Trawel |

La fuente técnica inicial vive en `src/features/map/config/countryMapProfiles.ts`. El frontend la usa al solicitar/consultar assets, y el worker la usa al procesar/reprocesar. El default técnico actual es `ADM1`; España queda como override explícito `ADM2`.

Si ya existen assets antiguos demasiado granulares en Storage, por ejemplo `countries/rumania/rumania-adm2.topojson` o `countries/india/india-adm2.topojson`, no se borran sin backup/rollback. El sistema debe solicitar/generar los paths activos nuevos:

- `countries/rumania/rumania-adm1.topojson`
- `countries/india/india-adm1.topojson`

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
┌────────────────────┐     ┌─────────────┐     ┌─────────────────┐
│ Frontend           │────▶│   Supabase  │◀────│  Worker/Backend │
│ CountryInternalMap │     │   (Estado)  │     │  (Generación)   │
└─────────┬──────────┘     └──────┬──────┘     └─────────────────┘
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
    francia-adm1.topojson
    metadata.json
  mexico/
    mexico-adm1.topojson
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
  
  // 4. Simplificar geometría con threshold configurable por país/nivel
  const simplified = simplifyGeometry(normalized, resolveSimplificationThreshold({ countrySlug, adminLevel }));
  
  // 5. Convertir a TopoJSON
  const topojson = convertToTopoJSON(simplified);
  
  // 6. Subir a Storage
  const path = `countries/${countrySlug}/${countrySlug}-${adminLevel.toLowerCase()}.topojson`;
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

### 10. Worker: Procesamiento de cola de mapas

Script Node.js que procesa registros `queued` en `country_map_assets` y genera automáticamente los assets TopoJSON en Supabase Storage.

#### Ubicación
```
scripts/process-country-map-queue.ts
scripts/lib/mapAssetPipeline.ts        # Utilidades compartidas
```

#### Variables de entorno requeridas
| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (requerida para Storage) |

#### Uso

```bash
# Procesar toda la cola
npm run maps:queue:process

# Procesar solo un país específico
npm run maps:queue:process -- --country mexico

# Procesar máximo N elementos
npm run maps:queue:process -- --limit 1

# Simular sin hacer cambios reales
npm run maps:queue:process -- --country mexico --dry-run

# Reprocesar un país aunque ya esté ready (uso admin/desarrollo)
npm run maps:queue:process -- --country mexico --force
```

#### Flujo del worker

| Paso | Acción | Descripción |
|------|--------|-------------|
| 1 | Consultar cola | Buscar registros con `status='queued'` |
| 2 | Actualizar a `generating` | Marcar que se está procesando |
| 3 | Descargar metadata | Consultar API de geoBoundaries |
| 4 | Descargar GeoJSON | Obtener archivo fuente (10-40MB) |
| 5 | Normalizar winding | Corregir orientación de polígonos para D3 |
| 6 | Simplificar | Aplicar threshold configurable por país/nivel; no usar `0.02` como estándar global |
| 7 | Re-normalizar winding | Corregir posibles cambios de orientación tras simplificar |
| 8 | Convertir a TopoJSON final | Generar formato optimizado |
| 9 | Subir a Storage | Guardar en bucket `map-assets` |
| 10 | Actualizar a `ready` | Guardar metadatos del asset |

> `--force` requiere `--country` para evitar reprocesados masivos accidentales. Está pensado para corregir assets ya generados, por ejemplo después de mejorar normalización de winding.
> El worker aplica `countryMapProfiles.ts` antes de consultar geoBoundaries; México se reprocesa como ADM1 y actualiza el registro único de `country_map_assets`.
> La simplificación se resuelve por `countrySlug + adminLevel` mediante `resolveSimplificationThreshold()`: default `0.0001`; `mexico/ADM1 = 0.0001` puede mantenerse como caso validado explícito aunque coincida con el default.

#### Automatización con GitHub Actions

La cola se procesa automáticamente desde CI mediante:

```
.github/workflows/process-country-map-queue.yml
```

Configuración inicial recomendada:

| Aspecto | Valor |
|---------|-------|
| Frecuencia | Cada 30 minutos (`*/30 * * * *`) |
| Límite por ejecución | `--limit 1` |
| Ejecución manual | `workflow_dispatch` |
| Runtime | GitHub Actions + Node 22.13.0 |
| Instalación | `npm ci` |
| Comando | `npm run maps:queue:process -- --limit 1` |

Secrets requeridos en GitHub:

| Secret | Uso |
|--------|-----|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Escritura en `country_map_assets` y Storage desde worker/CI |

Reglas de seguridad:
- El frontend usa solo `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y la Edge Function pública.
- La Edge Function `request-country-map` solo encola o actualiza registros de estado; no procesa GeoJSON pesado.
- El worker pesado corre en GitHub Actions/backend con `SUPABASE_SERVICE_ROLE_KEY` inyectada como secret.
- El navegador nunca ejecuta `npm`, nunca procesa assets cartográficos grandes y nunca recibe `SUPABASE_SERVICE_ROLE_KEY`.

#### Flujo navegador → cola → worker → mapa

| Paso | Responsable | Acción |
|------|-------------|--------|
| 1 | Frontend | Usuario navega a `/pais/{slug}` desde WorldMap |
| 2 | Frontend | Consulta `country_map_assets` con flujo anon/public |
| 3 | Frontend | Si falta o falló, llama a `request-country-map` |
| 4 | Edge Function | Inserta/actualiza registro como `queued` usando service role en servidor |
| 5 | GitHub Actions | Cada 30 minutos ejecuta el worker con `--limit 1` |
| 6 | Worker CI/backend | Descarga geoBoundaries, genera TopoJSON, sube a Storage |
| 7 | Worker CI/backend | Actualiza `country_map_assets.status` a `ready` |
| 8 | Frontend | `CountryInternalMap` carga la URL pública de Storage y renderiza el mapa |

#### Estructura de archivos en Storage

```
map-assets/
└── countries/
    ├── mexico/
    │   └── mexico-adm1.topojson
    ├── france/
    │   └── france-adm2.topojson
    └── ...
```

#### Campos actualizados en `country_map_assets`

Al completar con éxito, el worker actualiza:
- `status` → `'ready'`
- `storage_bucket` → `'map-assets'`
- `admin_level` → nivel efectivo del perfil de país, por ejemplo `ADM1` para México
- `storage_path` → `'countries/{slug}/{slug}-{admin_level}.topojson'`
- `source` → `'geoBoundaries'`
- `license` → Licencia detectada (ej: 'CC BY 4.0')
- `attribution` → Texto de atribución
- `feature_count` → Número de provincias/regiones
- `size_bytes` → Tamaño del archivo
- `generated_at` → Timestamp de generación
- `error_message` → `null`

### 11. Edge Function: request-country-map

Endpoint seguro para solicitar generación de mapas internos. Actúa como puerta de entrada controlada, usando `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor (nunca en frontend).

#### Ubicación
```
supabase/functions/request-country-map/index.ts
```

#### Variables de entorno requeridas
| Variable | Descripción |
|----------|-------------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (bypass RLS) |

#### Contrato de entrada (Input)
```typescript
interface RequestCountryMapInput {
  countrySlug: string;           // Obligatorio - ej: 'mexico'
  countryName?: string;          // Opcional - ej: 'México'
  isoAlpha2?: string;            // Opcional - ej: 'MX'
  isoAlpha3?: string;            // Recomendable - ej: 'MEX'
  adminLevel?: 'ADM0' | 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4' | 'ADM5';  // Default frontend/worker: ADM1
  source?: string;               // Default: 'unknown'
}
```

#### Contrato de salida (Response)
```typescript
interface RequestCountryMapResponse {
  success: boolean;
  countrySlug: string;
  status: 'missing' | 'queued' | 'generating' | 'ready' | 'failed';
  message: string;
  requestedCount: number;
  lastRequestedAt: string | null;
  error?: string;
}
```

#### Comportamiento por estado

| Estado actual | Acción | Respuesta |
|---------------|--------|-----------|
| **No existe** | Insertar registro con `status='queued'`, `requested_count=1` | `queued` |
| **ready** | NO regenerar, solo incrementar `requested_count` | `ready` |
| **queued** | Incrementar `requested_count`, actualizar `last_requested_at` | `queued` |
| **generating** | Incrementar `requested_count`, actualizar `last_requested_at` | `generating` |
| **failed** | Cambiar a `queued`, limpiar `error_message`, incrementar contador | `queued` |
| **missing** | Cambiar a `queued`, incrementar contador | `queued` |

#### Uso desde frontend
```typescript
import { requestCountryMapGeneration } from '@/features/map/services/countryMapAssets.service';

const result = await requestCountryMapGeneration({
  countrySlug: 'mexico',
  countryName: 'México',
  isoAlpha2: 'MX',
  isoAlpha3: 'MEX',
  adminLevel: 'ADM1',
  source: 'world_map'
});

if (result.success) {
  console.log('Estado:', result.status);
  console.log('Mensaje:', result.message);
}
```

#### Seguridad
- ✅ Usa `service role key` solo dentro de la Edge Function
- ✅ Frontend usa `supabase.functions.invoke()` (sin service role)
- ✅ Validación de input (countrySlug obligatorio, formato válido)
- ✅ CORS habilitado para peticiones cross-origin
- ✅ Función pública para usuarios anónimos del mapa mundial: desplegar sin verificación JWT

#### Deploy
```bash
npx supabase functions deploy request-country-map --no-verify-jwt
```

> Importante: si se despliega sin `--no-verify-jwt`, Supabase bloqueará la llamada anónima desde `CountryPage` con `401 Unauthorized` antes de ejecutar la función. La seguridad de escritura sigue estando en la Edge Function, que usa `SUPABASE_SERVICE_ROLE_KEY` solo en servidor y valida el payload.

### Referencias

- **DA-030:** `docs/DECISIONES.md` - Decisión completa de generación automática
- **DA-029:** `docs/DECISIONES.md` - Mapas exploratorios con bandera
- **DA-027:** `docs/DECISIONES.md` - Estrategia progresiva (reemplazada por DA-030)
- **CountryInternalMap:** `src/features/map/components/CountryInternalMap/CountryInternalMap.tsx`
- **SpainMap legado:** `src/features/map/components/SpainMap/SpainMap.tsx`
- **Edge Function:** `supabase/functions/request-country-map/index.ts`
- **Servicio Frontend:** `src/features/map/services/countryMapAssets.service.ts`
- **geoBoundaries:** https://www.geoboundaries.org/
- **Natural Earth:** https://www.naturalearthdata.com/

---

*MAP_ASSET_PLAN v2.0 - Trawel*
*Actualizado para DA-030: Generación automática y persistente*
