/**
 * Migración 002: Tabla de assets de mapas por país (DA-030)
 * 
 * Propósito:
 * Persistir metadatos de mapas internos generados automáticamente para cada país.
 * La tabla almacena estado de generación, ubicación en Storage y metadatos del asset.
 * 
 * Alcance:
 * - Tabla: country_map_assets
 * - Índices para consultas frecuentes (status, country_slug)
 * - CHECK constraint para estados válidos
 * - Row Level Security (RLS) con SELECT público
 * - No incluye políticas de escritura (reservadas a backend/worker con service role)
 * 
 * Decisiones técnicas:
 * - country_slug como UNIQUE para evitar duplicados por país
 * - Estados: missing → queued → generating → ready (o failed)
 * - Storage bucket 'map-assets' separado de datos editoriales
 * - requested_count y last_requested_at para métricas de demanda
 * - Sin políticas INSERT/UPDATE/DELETE públicas (solo service role/backend)
 * 
 * Integración con DA-030:
 * - Frontend consulta esta tabla para saber si el mapa está disponible
 * - Worker actualiza esta tabla tras generar el asset en Storage
 * - Storage bucket 'map-assets' contiene los archivos TopoJSON
 * 
 * Seguridad:
 * - Lectura pública: cualquiera puede consultar estado del mapa
 * - Escritura restringida: solo backend/worker con service role key
 * - NO exponer service role key en frontend
 */

-- ============================================
-- TABLA: COUNTRY_MAP_ASSETS
-- ============================================

CREATE TABLE country_map_assets (
    -- Identificador único
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificación del país (único por país)
    country_slug TEXT NOT NULL UNIQUE,
    country_name TEXT,
    
    -- Códigos ISO para referencia
    iso_alpha2 TEXT,
    iso_alpha3 TEXT,
    
    -- Nivel administrativo del mapa (ADM1=regiones, ADM2=provincias)
    admin_level TEXT NOT NULL DEFAULT 'ADM2',
    
    -- Estado de generación del mapa
    status TEXT NOT NULL DEFAULT 'missing',
    
    -- Ubicación en Storage
    storage_bucket TEXT DEFAULT 'map-assets',
    storage_path TEXT,
    
    -- Fuente y licencia
    source TEXT DEFAULT 'geoBoundaries',
    license TEXT,
    attribution TEXT,
    
    -- Metadatos del asset
    feature_count INTEGER,
    size_bytes INTEGER,
    
    -- Métricas de demanda (DA-030: captura de demanda pública)
    requested_count INTEGER NOT NULL DEFAULT 0,
    last_requested_at TIMESTAMPTZ,
    
    -- Timestamps de generación
    generated_at TIMESTAMPTZ,
    
    -- Error (para estado 'failed')
    error_message TEXT,
    
    -- Timestamps automáticos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONSTRAINTS
-- ============================================

-- CHECK constraint para estados válidos
ALTER TABLE country_map_assets
ADD CONSTRAINT country_map_assets_status_check
CHECK (status IN ('missing', 'queued', 'generating', 'ready', 'failed'));

-- CHECK constraint para niveles administrativos válidos
ALTER TABLE country_map_assets
ADD CONSTRAINT country_map_assets_admin_level_check
CHECK (admin_level IN ('ADM0', 'ADM1', 'ADM2', 'ADM3', 'ADM4', 'ADM5'));

-- ============================================
-- ÍNDICES
-- ============================================

-- Índice por status para filtrar por estado (ej: todos los 'ready')
CREATE INDEX idx_country_map_assets_status ON country_map_assets(status);

-- Índice por country_slug ya es UNIQUE (implícito), pero explicitamos para claridad
CREATE INDEX idx_country_map_assets_country_slug ON country_map_assets(country_slug);

-- Índice compuesto para consultas frecuentes: país + estado
CREATE INDEX idx_country_map_assets_slug_status ON country_map_assets(country_slug, status);

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================

-- Función para actualizar updated_at (reutilizable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para country_map_assets
CREATE TRIGGER update_country_map_assets_updated_at
    BEFORE UPDATE ON country_map_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activar RLS
ALTER TABLE country_map_assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: SELECT PÚBLICO
-- ============================================

-- Política SELECT pública: cualquiera puede leer el estado del mapa
-- El frontend necesita esto para saber si mostrar el mapa o la pantalla de preparación
CREATE POLICY "Allow public read access to country_map_assets"
ON country_map_assets
FOR SELECT
USING (true);

-- ============================================
-- POLICIES: ESCRITURA RESTRINGIDA
-- ============================================

-- NOTA: No creamos políticas INSERT/UPDATE/DELETE públicas.
-- La escritura debe hacerse mediante:
-- 1. Backend/Worker con service role key (bypass RLS)
-- 2. Edge Function con service role key
-- 3. Futuro: authenticated users con roles específicos (fase posterior)

-- Ejemplo de política para authenticated (comentado, descomentar cuando haya auth):
-- CREATE POLICY "Allow authenticated users to request map generation"
-- ON country_map_assets
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (status = 'queued');

-- ============================================
-- STORAGE BUCKET: map-assets
-- ============================================

-- Nota: Los buckets de Storage se crean mediante la API de Supabase o el dashboard.
-- Este SQL documenta la configuración recomendada:

/*
-- Crear bucket (ejecutar en SQL Editor de Supabase o usar API/dashboard):
INSERT INTO storage.buckets (id, name, public)
VALUES ('map-assets', 'map-assets', true);

-- Política de lectura pública para objetos del bucket:
CREATE POLICY "Allow public read access to map-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'map-assets');

-- NOTA: No crear política de escritura pública.
-- La escritura debe hacerse con service role key desde backend/worker.
*/

-- ============================================
-- DATOS INICIALES (Opcional)
-- ============================================

-- Insertar registro inicial para España (ya tenemos el asset preparado)
-- Descomentar después de crear el bucket y subir el asset:
/*
INSERT INTO country_map_assets (
    country_slug,
    country_name,
    iso_alpha2,
    iso_alpha3,
    admin_level,
    status,
    storage_path,
    source,
    license,
    attribution,
    feature_count,
    size_bytes,
    requested_count,
    generated_at
) VALUES (
    'espana',
    'España',
    'ES',
    'ESP',
    'ADM2',
    'ready',
    'countries/espana/espana-adm2.topojson',
    'geoBoundaries',
    'CC BY 4.0',
    'Datos cartográficos: geoBoundaries (CC BY 4.0)',
    52,
    57500,
    0,
    NOW()
)
ON CONFLICT (country_slug) DO NOTHING;
*/

-- ============================================
-- COMENTARIOS DOCUMENTALES
-- ============================================

COMMENT ON TABLE country_map_assets IS 'Metadatos de assets cartográficos generados automáticamente por país (DA-030)';
COMMENT ON COLUMN country_map_assets.status IS 'Estado de generación: missing, queued, generating, ready, failed';
COMMENT ON COLUMN country_map_assets.storage_path IS 'Ruta relativa dentro del bucket map-assets';
COMMENT ON COLUMN country_map_assets.requested_count IS 'Contador de solicitudes de generación (métrica de demanda)';
COMMENT ON COLUMN country_map_assets.admin_level IS 'Nivel administrativo: ADM1 (regiones), ADM2 (provincias), etc.';

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

/*
1. EJECUTAR ESTA MIGRACIÓN:
   - Abrir Supabase SQL Editor
   - Copiar y pegar este archivo completo
   - Ejecutar

2. CREAR BUCKET DE STORAGE (si no existe):
   - Ir a Supabase Dashboard → Storage
   - Crear bucket 'map-assets'
   - Marcar como 'Public bucket'
   - Configurar CORS si es necesario

3. CONFIGURAR POLÍTICAS DE STORAGE:
   - En Storage → Policies, añadir:
     - SELECT: allow public access (para que frontend pueda descargar mapas)
     - NO añadir INSERT/UPDATE/DELETE públicas

4. SUBIR ASSETS EXISTENTES (opcional):
   - Subir public/maps/countries/spain/spain-adm2.topojson
   - Ruta en Storage: countries/espana/espana-adm2.topojson
   - Actualizar registro en country_map_assets a status='ready'

5. USO DESDE FRONTEND:
   - Consultar: SELECT * FROM country_map_assets WHERE country_slug = 'francia'
   - Si status='ready', descargar desde: {SUPABASE_URL}/storage/v1/object/public/map-assets/{storage_path}

6. USO DESDE WORKER/BACKEND:
   - Usar service role key para INSERT/UPDATE
   - Actualizar status: missing → queued → generating → ready
   - Subir archivo a Storage con client admin (service role)
*/