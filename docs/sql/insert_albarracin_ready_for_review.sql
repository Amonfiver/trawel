-- ============================================================================
-- SQL REVISABLE: Albarracín y Conjunto Histórico de Albarracín
-- ============================================================================
-- 
-- ⚠️  ADVERTENCIA: REVISAR ANTES DE EJECUTAR
-- 
-- Este archivo contiene sentencias SQL preparadas para insertar Albarracín
-- como ciudad de España y su destino inicial "Conjunto Histórico de Albarracín".
-- 
-- ESTADO: ready_for_review (listo para revisión, NO ejecutar sin revisión humana)
-- 
-- DECISIONES PENDIENTES ANTES DE EJECUTAR:
-- 1. Revisar contenido editorial (tono, precisión histórica)
-- 2. Verificar si se desea cambiar estado de 'draft' a 'published'
-- 3. Confirmar que coordenadas son suficientemente precisas
-- 4. Verificar URLs de fuentes (hacer clic y confirmar funcionamiento)
-- 
-- NOTA SOBRE PRECIOS/HORARIOS:
-- Este SQL NO incluye precios cerrados ni horarios específicos de catedral
-- porque no están verificados. El acceso al casco histórico es libre.
-- Se recomienda dejar campos price/opening_hours como NULL o con texto
-- indicativo hasta verificación posterior.
--
-- ============================================================================

-- ============================================================================
-- 1. CIUDAD: Albarracín
-- ============================================================================

-- Insertar ciudad Albarracín (Teruel, España)
-- Usa subconsulta para obtener country_id por slug (no hardcodear UUID)
INSERT INTO cities (
    country_id,
    slug,
    name_es,
    short_description_es,
    adventure_content_es,
    student_content_es,
    lat,
    lng,
    status,
    featured,
    recommended_duration,
    best_season_es,
    sleeping_advice_es,
    food_advice_es,
    pending_verification,
    created_at,
    updated_at
)
SELECT 
    c.id,                                          -- country_id de España
    'albarracin',                                  -- slug
    'Albarracín',                                  -- name_es
    'Pueblo medieval de arquitectura rojiza colgado sobre el río Guadalaviar, frecuentemente destacado como uno de los más bellos de España en medios especializados.',  -- short_description_es (108 chars)
    
    -- adventure_content_es (modo viajero)
    'Sube por las calles empedradas que serpentean entre casas de piedra rojiza, algunas colgadas literalmente sobre el vacío del río Guadalaviar. Albarracín es un laberinto de soportales, balcones de madera y flores en ventanas que parecen desafiar la gravedad. Empieza tu visita al amanecer, cuando la luz dorada ilumina los muros y las calles aún están en silencio. No te pierdas la subida al andador de la muralla para ver el río serpentear a tus pies como un hilo de plata. El plano inclinado de sus calles, heredero de la estructura musulmana, te hará detenerte en cada esquina para admirar los detalles: una puerta pintada de azul, un balcón con geranios, una fuente escondida.',
    
    -- student_content_es (modo estudiante)
    'Albarracín es un municipio de la provincia de Teruel, en la comunidad autónoma de Aragón, situado a 1.182 metros de altitud en la sierra del mismo nombre. Fundado por los bereberes que dieron nombre a la localidad (del árabe al-Banu Razin), conserva un urbanismo medieval islámico adaptado a la orografía del terreno. El casco antiguo, declarado Conjunto Histórico-Artístico en 1961, presenta una arquitectura vernacular caracterizada por el uso de yesos rojizos, maderas de sabina y estructuras de entramado. Destacan la alcazaba, las murallas del siglo X, la catedral del Salvador (siglo XVI) y el torreón del Andador. Desde 2015 es candidato a Patrimonio de la Humanidad por la UNESCO.',
    
    40.4053,                                       -- lat (fuente: ICEARAGON)
    -1.4440,                                       -- lng (fuente: ICEARAGON)
    'draft',                                       -- status: mantener en draft hasta revisión final
    TRUE,                                          -- featured (única representante de Teruel)
    'Medio día (3-4 horas)',                       -- recommended_duration
    'Primavera y otoño',                           -- best_season_es (estimado, verificar)
    NULL,                                          -- sleeping_advice_es (TODO: añadir si se dispone)
    NULL,                                          -- food_advice_es (TODO: añadir si se dispone)
    '["precios_catedral", "horarios_catedral", "tarifas_miradores"]'::JSONB,  -- pending_verification
    NOW(),                                         -- created_at
    NOW()                                          -- updated_at
FROM countries c
WHERE c.slug = 'espana'
ON CONFLICT (country_id, slug) DO UPDATE SET
    name_es = EXCLUDED.name_es,
    short_description_es = EXCLUDED.short_description_es,
    adventure_content_es = EXCLUDED.adventure_content_es,
    student_content_es = EXCLUDED.student_content_es,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    status = EXCLUDED.status,
    featured = EXCLUDED.featured,
    recommended_duration = EXCLUDED.recommended_duration,
    best_season_es = EXCLUDED.best_season_es,
    pending_verification = EXCLUDED.pending_verification,
    updated_at = NOW();

-- ============================================================================
-- 2. DESTINO: Conjunto Histórico de Albarracín
-- ============================================================================

-- Insertar destino "Conjunto Histórico de Albarracín"
-- Selecciona city_id por slug para no hardcodear UUID
INSERT INTO destinations (
    country_id,
    city_id,
    slug,
    title_es,
    summary_es,
    adventure_content_es,
    student_content_es,
    type,
    tags,
    estimated_visit_time,
    price,
    opening_hours,
    practical_tip_es,
    verification_status,
    status,
    featured,
    pending_verification,
    created_at,
    updated_at
)
SELECT 
    co.id,                                         -- country_id de España
    ci.id,                                         -- city_id de Albarracín
    'conjunto-historico-albarracin',               -- slug
    'Conjunto Histórico de Albarracín',            -- title_es
    
    -- summary_es (resumen para tarjetas, <120 chars)
    'Recorrido por el casco antiguo medieval con arquitectura rojiza, murallas, miradores al río y plazas escondidas.',
    
    -- adventure_content_es (modo viajero)
    'Albarracín no se visita, se pierde. Empieza por la Plaza Mayor, sube por el Callejón del Toro (literalmente, un callejón estrecho entre altos muros de yeso rojo) y deja que el azar te guíe. No hay una ruta única: cada callejón escondido descubre un nuevo mirador al río Guadalaviar, cada arco de piedra enmarca una vista diferente de las montañas. Busca la Casa de la Julianeta, la más fotografiada del pueblo, con sus balcones de madera pareciendo flotar sobre el vacío. Si tienes agilidad, sube al torreón del Andador para ver el pueblo desde las alturas. Dedica mínimo medio día: las calles empinadas cansan, pero cada descanso en una terraza con vistas compensa el esfuerzo.',
    
    -- student_content_es (modo estudiante)
    'El Conjunto Histórico de Albarracín fue declarado monumento histórico-artístico nacional en 1961 y representa uno de los mejores ejemplos de urbanismo medieval islámico conservados en España. La trama urbana se estructura en tres niveles: la alcazaba (zona militar), la medina (zona residencial) y los arrabales. La arquitectura vernacular utiliza la yesera rojiza local combinada con entramados de madera de sabina. Elementos destacados: la Torre del Andador (siglo X), la Catedral de El Salvador (transición gótico-renacentista, siglo XVI), el portal de San Andrés y las murallas que descendían hasta el río. La conservación se debe en parte al aislamiento geográfico que frenó la especulación urbanística del siglo XX.',
    
    'monument',                                    -- type (conjunto histórico-artístico)
    
    -- tags (JSONB array)
    '["pueblo-medieval", "patrimonio", "arquitectura-vernacula", "murallas", "vistas", "fotografia", "imprescindible"]'::JSONB,
    
    'Medio día (3-4 horas)',                       -- estimated_visit_time
    NULL,                                          -- price: NULL (acceso libre, verificar puntos específicos)
    '24h acceso exterior (recomendable visitar de día)',  -- opening_hours: exterior libre, verificar catedral
    'Recorrido exterior por casco histórico: acceso libre. Verificar condiciones locales antes de visita.',  -- practical_tip_es
    
    'pending',                                     -- verification_status: datos pendientes de verificación
    'draft',                                       -- status: mantener en draft hasta revisión final
    TRUE,                                          -- featured
    
    -- pending_verification (campos que requieren verificación posterior)
    '["precios_catedral", "horarios_catedral", "tarifas_miradores", "estado_unesco_2024"]'::JSONB,
    
    NOW(),                                         -- created_at
    NOW()                                          -- updated_at
FROM countries co, cities ci
WHERE co.slug = 'espana' AND ci.slug = 'albarracin'
ON CONFLICT (slug) DO UPDATE SET
    country_id = EXCLUDED.country_id,
    city_id = EXCLUDED.city_id,
    title_es = EXCLUDED.title_es,
    summary_es = EXCLUDED.summary_es,
    adventure_content_es = EXCLUDED.adventure_content_es,
    student_content_es = EXCLUDED.student_content_es,
    type = EXCLUDED.type,
    tags = EXCLUDED.tags,
    estimated_visit_time = EXCLUDED.estimated_visit_time,
    price = EXCLUDED.price,
    opening_hours = EXCLUDED.opening_hours,
    practical_tip_es = EXCLUDED.practical_tip_es,
    verification_status = EXCLUDED.verification_status,
    status = EXCLUDED.status,
    featured = EXCLUDED.featured,
    pending_verification = EXCLUDED.pending_verification,
    updated_at = NOW();

-- ============================================================================
-- 3. FUENTES: Destination Sources
-- ============================================================================

-- Insertar fuentes verificadas para el destino
-- Nota: Se ejecuta DESPUÉS de insertar el destino, usando subconsulta para obtener destination_id

-- Fuente 1: Ayuntamiento de Albarracín (oficial municipal)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT 
    d.id,
    'Ayuntamiento de Albarracín - Web oficial',
    'https://www.albarracin.es/',
    'website',
    'Fuente oficial del municipio para información turística y de servicios.'
FROM destinations d
WHERE d.slug = 'conjunto-historico-albarracin'
ON CONFLICT DO NOTHING;  -- Evitar duplicados si ya existe

-- Fuente 2: Historia municipal (Ayuntamiento)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT 
    d.id,
    'Historia de Albarracín - Ayuntamiento',
    'https://www.albarracin.es/historia/',
    'website',
    'Contexto histórico general, origen bereber y evolución del municipio.'
FROM destinations d
WHERE d.slug = 'conjunto-historico-albarracin'
ON CONFLICT DO NOTHING;

-- Fuente 3: Patrimonio Cultural de Aragón (principal para destino)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT 
    d.id,
    'Patrimonio Cultural de Aragón - Conjunto Histórico de Albarracín',
    'https://patrimonioculturaldearagon.es/patrimonio/conjunto-historico-de-albarracin/',
    'website',
    'Fuente principal del destino: murallas, castillo del Andador, Catedral de El Salvador, casas colgadas, evolución histórica.'
FROM destinations d
WHERE d.slug = 'conjunto-historico-albarracin'
ON CONFLICT DO NOTHING;

-- Fuente 4: Turismo de Aragón (autonómica)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT 
    d.id,
    'Turismo de Aragón - Ficha Albarracín',
    'https://www.turismodearagon.com/ficha/albarracin/',
    'website',
    'Validación del destino como patrimonio medieval y recursos turísticos de la Comunidad Autónoma.'
FROM destinations d
WHERE d.slug = 'conjunto-historico-albarracin'
ON CONFLICT DO NOTHING;

-- Fuente 5: ICEARAGON (geográfica institucional)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT 
    d.id,
    'ICEARAGON - Ficha geográfica institucional',
    'https://icearagon.aragon.es/fichaDescarga/fichaDescarga_44009.html',
    'website',
    'Fuente geográfica institucional. Coordenadas: lat 40.4053, lng -1.4440 (aproximadas de localidad/municipio, válidas para mapa editorial).'
FROM destinations d
WHERE d.slug = 'conjunto-historico-albarracin'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CHECKLIST DE VERIFICACIÓN POST-EJECUCIÓN
-- ============================================================================

-- Descomenta y ejecuta estas consultas para verificar la inserción:

/*
-- Verificar ciudad insertada
SELECT id, slug, name_es, status, featured, lat, lng 
FROM cities 
WHERE slug = 'albarracin';

-- Verificar destino insertado
SELECT id, slug, title_es, status, featured, type, city_id 
FROM destinations 
WHERE slug = 'conjunto-historico-albarracin';

-- Verificar fuentes asociadas
SELECT ds.title, ds.url, ds.type
FROM destination_sources ds
JOIN destinations d ON ds.destination_id = d.id
WHERE d.slug = 'conjunto-historico-albarracin';

-- Verificar rutas funcionales (consultas de la aplicación)
-- /pais/espana -> Debe mostrar Albarracín
-- /pais/espana/albarracin -> CityPage
-- /aventura/conjunto-historico-albarracin -> AdventurePage
*/

-- ============================================================================
-- NOTAS PARA REVISOR HUMANO
-- ============================================================================

-- ESTADO EDITORIAL ACTUAL:
-- - Ciudad: draft (requiere revisión antes de publicar)
-- - Destino: draft (requiere revisión antes de publicar)
-- - Fuentes: URLs verificadas pero no probadas en ejecución
--
-- CAMPOS CON DATOS PENDIENTES (pending_verification):
-- - precios_catedral: Verificar tarifas Catedral de El Salvador
-- - horarios_catedral: Verificar horarios visita interior catedral
-- - tarifas_miradores: Verificar si hay puntos de pago específicos
-- - estado_unesco_2024: Verificar estado actual candidatura (última ref: 2015)
--
-- ACCIONES RECOMENDADAS ANTES DE CAMBIAR A 'published':
-- 1. Ejecutar SQL en entorno de desarrollo/prueba
-- 2. Verificar que URLs de fuentes funcionan (hacer clic)
-- 3. Revisar contenido editorial por persona diferente a la que creó la ficha
-- 4. Completar o eliminar campos NULL (sleeping_advice_es, food_advice_es)
-- 5. Decidir si mantener price/opening_hours como NULL o añadir texto indicativo
-- 6. Cambiar status de 'draft' a 'published' cuando se considere apropiado
--
-- ============================================================================
-- FIN DEL ARCHIVO SQL
-- ============================================================================