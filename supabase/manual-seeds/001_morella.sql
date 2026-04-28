/**
 * Seed manual: Morella - Primera ciudad real editorial en Trawel
 * 
 * Propósito: Insertar Morella como ciudad activa con sus destinos publicados
 * 
 * Alcance: 
 * - Ciudad de Morella en España
 * - 6 destinos turísticos publicados
 * - Fuentes de información para cada destino
 * 
 * Notas:
 * - SQL idempotente (puede ejecutarse múltiples veces)
 * - Usa subconsultas para resolver UUIDs (no hardcodeados)
 * - Campos pendientes de verificación marcados con JSONB
 * - Todos los destinos en estado 'published' para ser visibles
 */

-- ============================================
-- CIUDAD: MORELLA
-- ============================================

INSERT INTO cities (
    country_id,
    slug,
    name_es,
    short_description_es,
    adventure_content_es,
    student_content_es,
    recommended_duration,
    best_season_es,
    sleeping_advice_es,
    food_advice_es,
    pending_verification,
    status,
    featured,
    lat,
    lng
)
SELECT 
    c.id,
    'morella',
    'Morella',
    'Ciudad amurallada medieval en la provincia de Castellón, considerada una de las poblaciones más bonitas de España. Destaca por sus murallas bien conservadas, el castillo y su casco histórico de calles empedradas.',
    'Morella te espera con sus imponentes murallas que han resistido siglos de historia. Subir al castillo es una aventura que te transporta a la Edad Media, con vistas espectaculares del Maestrazgo. Perderse por sus calles empedradas entre casas de piedra, descubrir rincones secretos y sentir la brisa milenaria que ha visto pasar guerreros, comerciantes y artistas. La ciudad guarda secretos en cada rincón, desde sus torres defensivas hasta sus portales góticos.',
    'Morella es una ciudad de origen medieval ubicada en la provincia de Castellón, en la comarca del Maestrazgo. Su casco antiguo está completamente amurallado y ha sido declarado Conjunto Histórico-Artístico. La ciudad tiene una rica historia que se remonta a la Edad Media, siendo un importante enclave defensivo en la frontera aragonesa-catalana. Destaca su arquitectura civil y religiosa, con edificios que datan de los siglos XIV al XVI.',
    '1–2 días',
    'Pendiente de verificar: primavera y otoño recomendables',
    'Pendiente de verificar: alojamientos en casco antiguo',
    'Pendiente de verificar: gastronomía local con trufa y cordero',
    '["best_season_es", "sleeping_advice_es", "food_advice_es", "coordinates"]'::jsonb,
    'active',
    true,
    null,
    null
FROM countries c
WHERE c.slug = 'espana'
ON CONFLICT (country_id, slug) 
DO UPDATE SET
    name_es = EXCLUDED.name_es,
    short_description_es = EXCLUDED.short_description_es,
    adventure_content_es = EXCLUDED.adventure_content_es,
    student_content_es = EXCLUDED.student_content_es,
    recommended_duration = EXCLUDED.recommended_duration,
    best_season_es = EXCLUDED.best_season_es,
    sleeping_advice_es = EXCLUDED.sleeping_advice_es,
    food_advice_es = EXCLUDED.food_advice_es,
    pending_verification = EXCLUDED.pending_verification,
    status = EXCLUDED.status,
    featured = EXCLUDED.featured,
    updated_at = NOW();

-- ============================================
-- DESTINOS DE MORELLA
-- ============================================

-- 1. Castillo de Morella
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
    pending_verification
)
SELECT 
    c.country_id,
    c.id,
    'castillo-de-morella',
    'Castillo de Morella',
    'Fortaleza medieval situada en lo alto de la ciudad, ofreciendo vistas panorámicas del Maestrazgo. Testigo de sitios históricos y batallas durante siglos.',
    'Subir al Castillo de Morella es una auténtica aventura medieval. Las murallas imponen respeto mientras avanzas por el camino de ronda. Desde lo alto, el viento cuenta historias de sitios y batallas, de guerreros que defendieron estas tierras. Las vistas del Maestrazgo son simplemente espectaculares, un paisaje montañoso que se extiende hasta el horizonte.',
    'El Castillo de Morella es una fortaleza de origen árabe situada en el punto más alto de la ciudad. Ha sido escenario de importantes episodios históricos, incluyendo el Cid Campeador y las guerras carlistas. La fortaleza conserva restos de diferentes épocas, desde la época musulmana hasta reformas cristianas medievales.',
    'monument',
    '["monumento", "historia", "vistas", "medieval"]'::jsonb,
    '1-2 horas',
    'Pendiente de verificar',
    'Pendiente de verificar',
    'Llevar calzado cómodo para la subida. El acceso puede ser empinado en algunos tramos.',
    'pending',
    'published',
    true,
    '["price", "opening_hours", "exact_coordinates"]'::jsonb
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella'
ON CONFLICT (country_id, city_id, slug)
DO UPDATE SET
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

-- 2. Basílica Arciprestal de Santa María la Mayor
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
    pending_verification
)
SELECT 
    c.country_id,
    c.id,
    'basilica-arciprestal-santa-maria-la-mayor',
    'Basílica Arciprestal de Santa María la Mayor',
    'Joyón gótico valenciano del siglo XV. Destaca su fachada con el Pórtico de los Apóstoles y su interior con obras de arte religioso de gran valor.',
    'Cruzando el portal gótico de Santa María te adentras en siglos de fe y arte. La luz filtrada por las vidrieras crea un ambiente místico mientras descubres capillas que guardan tesoros artísticos. El claustro es un oasis de paz donde el tiempo parece detenerse, perfecto para reflexionar sobre la historia que estas piedras han vivido.',
    'La Basílica Arciprestal de Santa María la Mayor es uno de los ejemplos más importantes del gótico valenciano. Construida entre los siglos XV y XVI, destaca por su Pórtico de los Apóstoles, una obra maestra de la escultura gótica. El interior alberga importantes obras de arte, incluyendo retablos y pinturas de diferentes épocas.',
    'monument',
    '["iglesia", "gótico", "arte", "historia"]'::jsonb,
    '45 minutos',
    'Pendiente de verificar',
    'Pendiente de verificar',
    'Respetar los horarios de misa. Fotografía permitida sin flash.',
    'pending',
    'published',
    true,
    '["price", "opening_hours", "exact_mass_times"]'::jsonb
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella'
ON CONFLICT (country_id, city_id, slug)
DO UPDATE SET
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

-- 3. Torres de Sant Miquel y Murallas
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
    pending_verification
)
SELECT 
    c.country_id,
    c.id,
    'torres-de-sant-miquel-y-murallas',
    'Torres de Sant Miquel y Murallas',
    'Sistema defensivo medieval que rodea la ciudad amurallada. Incluye varias torres y portales de acceso que conservan su aspecto original.',
    'Recorrer las murallas de Morella es caminar sobre la historia misma. Las torres se alzan imponentes, testigos de asedios y defensas heroicas. Cada portal cuenta una historia diferente: el de Sant Miquel, el de la Nevera... Subir a las torres ofrece perspectivas únicas de la ciudad y el paisaje que la protege.',
    'Las murallas de Morella forman uno de los conjuntos defensivos medievales mejor conservados de la Comunidad Valenciana. Construidas principalmente entre los siglos XIV y XV, incluyen varias torres defensivas y portales de acceso. El sistema murallario tiene más de 2 kilómetros de perímetro y ha sido objeto de importantes trabajos de restauración.',
    'experience',
    '["murallas", "vistas", "caminata", "medieval"]'::jsonb,
    '1-2 horas',
    'Gratis',
    'Acceso libre',
    'Algunos tramos pueden estar en restauración. Consultar en turismo.',
    'verified',
    'published',
    false,
    '[]'::jsonb
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella'
ON CONFLICT (country_id, city_id, slug)
DO UPDATE SET
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

-- 4. Museo Tiempo de Dinosaurios
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
    pending_verification
)
SELECT 
    c.country_id,
    c.id,
    'museo-tiempo-de-dinosaurios',
    'Museo Tiempo de Dinosaurios',
    'Museo paleontológico que muestra los restos de dinosaurios encontrados en la comarca del Maestrazgo. Incluye réplicas y fósiles originales.',
    '¡Un viaje al Jurásico en pleno corazón de Morella! Descubre los gigantes que habitaron estas tierras hace millones de años. El museo te sumerge en un mundo prehistórico donde los dinosaurios eran los verdaderos reyes del Maestrazgo. Perfecto para familias y curiosos de todas las edades.',
    'El Museo Tiempo de Dinosaurios está dedicado a la rica herencia paleontológica de la comarca del Maestrazgo. La zona ha proporcionado importantes hallazgos de restos de dinosaurios del Cretácico. El museo combina exposiciones de fósiles originales con réplicas a escala y elementos interactivos.',
    'museum',
    '["museo", "dinosaurios", "familia", "paleontología"]'::jsonb,
    '1 hora',
    'Pendiente de verificar',
    'Pendiente de verificar',
    'Ideal para visitar con niños. Consultar talleres educativos.',
    'pending',
    'published',
    true,
    '["price", "opening_hours", "accessibility"]'::jsonb
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella'
ON CONFLICT (country_id, city_id, slug)
DO UPDATE SET
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

-- 5. Prisión del Siglo XIV
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
    pending_verification
)
SELECT 
    c.country_id,
    c.id,
    'prision-del-siglo-xiv',
    'Prisión del Siglo XIV',
    'Antigua cárcel medieval convertida en espacio museístico. Muestra las duras condiciones de vida de los presos históricos.',
    'Descender a la prisión medieval es adentrarse en las profundidades de la historia oscura de Morella. Las paredes de piedra guardan ecos de siglos de cautiverio, de historias de prisioneros de guerra y presos comunes. Un lugar que te hace reflexionar sobre cómo era la justicia en la Edad Media.',
    'La antigua prisión de Morella es una de las pocas cárceles medievales que se conservan en España. Funcionó como penal desde el siglo XIV hasta el XIX. El espacio ha sido museizado para mostrar las condiciones de vida de los presos, con reconstrucciones de celdas y documentación histórica.',
    'museum',
    '["historia", "medieval", "museo", "penitenciario"]'::jsonb,
    '30-45 minutos',
    'Pendiente de verificar',
    'Pendiente de verificar',
    'Puede no ser apto para personas sensibles. Consultar disponibilidad de visitas guiadas.',
    'pending',
    'published',
    false,
    '["price", "opening_hours", "guided_tours"]'::jsonb
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella'
ON CONFLICT (country_id, city_id, slug)
DO UPDATE SET
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

-- 6. Convento de San Francisco
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
    pending_verification
)
SELECT 
    c.country_id,
    c.id,
    'convento-de-san-francisco',
    'Convento de San Francisco',
    'Antiguo convento franciscano del siglo XIII, actualmente rehabilitado como espacio cultural y de eventos.',
    'El Convento de San Francisco es un rincón de serenidad en lo alto de Morella. Sus ruinas rehabilitadas cuentan la historia de la orden franciscana en estas tierras. Pasear por sus claustros es sentir la paz que los frailes buscaban, lejos del bullicio de la ciudad pero vigilando sobre ella desde la altura.',
    'El Convento de San Francisco es una fundación franciscana que data del siglo XIII, aunque el edificio actual tiene elementos de diferentes épocas. Ha sido objeto de una cuidadosa rehabilitación que respeta sus valores históricos mientras lo adapta para usos culturales contemporáneos.',
    'monument',
    '["convento", "historia", "cultura", "arquitectura"]'::jsonb,
    '30 minutos',
    'Gratis',
    'Pendiente de verificar',
    'Consultar programación cultural antes de visitar.',
    'pending',
    'published',
    false,
    '["opening_hours", "current_exhibitions"]'::jsonb
FROM cities c
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella'
ON CONFLICT (country_id, city_id, slug)
DO UPDATE SET
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

-- ============================================
-- FUENTES (DESTINATION_SOURCES)
-- ============================================

-- Fuente: Ayuntamiento de Morella (oficial)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT d.id, 'Ayuntamiento de Morella', 'https://www.morella.net', 'official', 'Información oficial sobre turismo en Morella'
FROM destinations d
JOIN cities c ON d.city_id = c.id
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella' AND d.slug IN (
    'castillo-de-morella',
    'torres-de-sant-miquel-y-murallas',
    'convento-de-san-francisco'
)
ON CONFLICT DO NOTHING;

-- Fuente: Turismo Comunidad Valenciana
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT d.id, 'Turismo Comunidad Valenciana - Morella', 'https://www.comunitatvalenciana.com/morella', 'tourism', 'Información turística oficial de la Comunidad Valenciana'
FROM destinations d
JOIN cities c ON d.city_id = c.id
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella' AND d.slug IN (
    'castillo-de-morella',
    'basilica-arciprestal-santa-maria-la-mayor',
    'torres-de-sant-miquel-y-murallas'
)
ON CONFLICT DO NOTHING;

-- Fuente: Museo Tiempo de Dinosaurios (oficial)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT d.id, 'Museo Tiempo de Dinosaurios - Web oficial', 'https://www.tiempodedinosaurios.com', 'official', 'Web oficial del museo paleontológico'
FROM destinations d
JOIN cities c ON d.city_id = c.id
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella' AND d.slug = 'museo-tiempo-de-dinosaurios'
ON CONFLICT DO NOTHING;

-- Fuente: Basílica Santa María (información religiosa)
INSERT INTO destination_sources (destination_id, title, url, type, supports)
SELECT d.id, 'Basílica Arciprestal de Santa María', 'https://www.morella.net/basilica/', 'heritage', 'Información sobre el patrimonio religioso de Morella'
FROM destinations d
JOIN cities c ON d.city_id = c.id
JOIN countries co ON c.country_id = co.id
WHERE co.slug = 'espana' AND c.slug = 'morella' AND d.slug = 'basilica-arciprestal-santa-maria-la-mayor'
ON CONFLICT DO NOTHING;

-- ============================================
-- FIN DEL SEED DE MORELLA
-- ============================================