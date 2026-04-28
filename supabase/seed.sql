-- ============================================
-- TRAWEL SEED DATA
-- ============================================
-- Generated automatically from mock data
-- Date: 2026-04-28T21:50:52.420Z
-- ============================================

-- NOTE: This file assumes the schema already exists in Supabase.
-- Run this after creating tables with proper constraints.

BEGIN;

-- ============================================
-- COUNTRIES
-- ============================================

-- España
INSERT INTO countries (slug, name_es, emoji, capital_es, continent_es, description_es, status, featured, created_at, updated_at)
VALUES (
  'espana',
  'España',
  '🇪🇸',
  'Madrid',
  'Europa',
  'Desde la Alhambra hasta la Sagrada Familia',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  capital_es = EXCLUDED.capital_es,
  description_es = EXCLUDED.description_es,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  updated_at = NOW();

-- Japón
INSERT INTO countries (slug, name_es, emoji, capital_es, continent_es, description_es, status, featured, created_at, updated_at)
VALUES (
  'japon',
  'Japón',
  '🇯🇵',
  'Tokio',
  'Asia',
  'Tradición y futuro en perfecta armonía',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  capital_es = EXCLUDED.capital_es,
  description_es = EXCLUDED.description_es,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  updated_at = NOW();

-- Perú
INSERT INTO countries (slug, name_es, emoji, capital_es, continent_es, description_es, status, featured, created_at, updated_at)
VALUES (
  'peru',
  'Perú',
  '🇵🇪',
  'Lima',
  'América',
  'Machu Picchu y mucho más',
  'active',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  capital_es = EXCLUDED.capital_es,
  description_es = EXCLUDED.description_es,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  updated_at = NOW();

-- Francia
INSERT INTO countries (slug, name_es, emoji, capital_es, continent_es, description_es, status, featured, created_at, updated_at)
VALUES (
  'francia',
  'Francia',
  '🇫🇷',
  'París',
  'Europa',
  'Próximamente',
  'comingSoon',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  capital_es = EXCLUDED.capital_es,
  description_es = EXCLUDED.description_es,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  updated_at = NOW();

-- Italia
INSERT INTO countries (slug, name_es, emoji, capital_es, continent_es, description_es, status, featured, created_at, updated_at)
VALUES (
  'italia',
  'Italia',
  '🇮🇹',
  'Roma',
  'Europa',
  'Próximamente',
  'comingSoon',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  capital_es = EXCLUDED.capital_es,
  description_es = EXCLUDED.description_es,
  status = EXCLUDED.status,
  featured = EXCLUDED.featured,
  updated_at = NOW();

-- ============================================
-- CITIES
-- ============================================

-- Madrid (espana)
INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'espana'),
  'madrid',
  'Madrid',
  'Capital vibrante con museos de clase mundial y vida nocturna inigualable',
  'Descubre Madrid como nunca antes: desde el arte del Prado hasta la movida de Malasaña. Una ciudad que nunca duerme donde cada rincón esconde una aventura.',
  'Madrid, capital de España desde 1561. Hogar del Museo del Prado, uno de los mejores del mundo. Su arquitectura mezcla los Austrias con la modernidad del siglo XXI.',
  40.4168,
  -3.7038,
  'active',
  true,
  '2-3 días',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Barcelona (espana)
INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'espana'),
  'barcelona',
  'Barcelona',
  'Arquitectura modernista, playas mediterráneas y cultura catalana vibrante',
  'Barcelona te espera con la Sagrada Familia, las playas del Mediterráneo y el bullicio de Las Ramblas. Una ciudad donde Gaudí dejó su huella mágica.',
  'Barcelona, capital de Cataluña. Famosa por la arquitectura modernista de Gaudí, incluyendo la Sagrada Familia, obra inconclusa desde 1882. Ciudad olímpica en 1992.',
  41.3851,
  2.1734,
  'active',
  true,
  '2-3 días',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Castellón de la Plana (espana)
INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'espana'),
  'castellon',
  'Castellón de la Plana',
  'Auténtico encanto mediterráneo lejos del turismo masivo',
  'Castellón, la joya escondida de la costa mediterránea. Playas vírgenes, montañas para senderismo y una gastronomía que sorprende.',
  'Castellón de la Plana, capital de la provincia homónima. Fundada en 1251, conserva un casco antiguo medieval y es puerta al Parque Natural de la Serra d''Espadà.',
  39.9857,
  -0.0494,
  'active',
  false,
  '2-3 días',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Tokio (japon)
INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'japon'),
  'tokyo',
  'Tokio',
  'Metrópolis futurista donde tradición milenaria convive con tecnología de vanguardia',
  'Tokio: del bullicio de Shibuya a la serenidad de los templos de Asakusa. Una ciudad que desafía todos los sentidos con su energía única.',
  'Tokio, capital de Japón desde 1868. Con 37 millones de habitantes en su área metropolitana, es la mayor aglomeración urbana del mundo. Mezcla perfecta de tradición y tecnología.',
  35.6762,
  139.6503,
  'active',
  true,
  '2-3 días',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Kioto (japon)
INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'japon'),
  'kioto',
  'Kioto',
  'Antigua capital imperial con templos milenarios y geishas',
  'Kioto, el alma tradicional de Japón. Pasea entre los torii rojos del Fushimi Inari, descubre templos zen y quizás avistes a una geisha en Gion.',
  'Kioto fue capital de Japón durante más de 1,000 años (794-1868). Patrimonio de la Humanidad con 17 sitios, incluyendo el templo dorado Kinkaku-ji y el bosque de bambú de Arashiyama.',
  35.0116,
  135.7681,
  'active',
  true,
  '2-3 días',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Lima (peru)
INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'peru'),
  'lima',
  'Lima',
  'Ciudad de reyes con gastronomía premiada y costa pacífica',
  'Lima, donde la historia colonial se encuentra con olas del Pacífico. Explora el centro histórico, saborea la mejor gastronomía de Sudamérica y surfea en sus playas.',
  'Lima, capital de Perú. Fundada en 1535 por Francisco Pizarro. Centro histórico Patrimonio de la Humanidad. Reconocida como capital gastronómica de América con mezcla de tradiciones andinas y europeas.',
  -12.0464,
  -77.0428,
  'active',
  true,
  '2-3 días',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Cusco (peru)
INSERT INTO cities (country_id, slug, name_es, short_description_es, adventure_content_es, student_content_es, lat, lng, status, featured, recommended_duration, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'peru'),
  'cusco',
  'Cusco',
  'Ombligo del mundo inca y puerta de entrada a Machu Picchu',
  'Cusco te lleva a 3,400 metros de altura, entre calles de piedra inca y templos coloniales. La puerta sagrada a Machu Picchu y el Valle Sagrado de los Incas.',
  'Cusco fue capital del Imperio Inca hasta la conquista española en 1533. Ciudad Patrimonio de la Humanidad donde se superponen arquitectura inca y colonial. Punto de partida para Machu Picchu.',
  -13.1631,
  -72.545,
  'active',
  true,
  '2-3 días',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- DESTINATIONS
-- ============================================

-- Museo del Prado (madrid)
INSERT INTO destinations (country_id, city_id, slug, title_es, summary_es, adventure_content_es, student_content_es, type, tags, estimated_visit_time, price, opening_hours, status, featured, verification_status, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'espana'),
  (SELECT id FROM cities WHERE slug = 'madrid' AND country_id = (SELECT id FROM countries WHERE slug = 'espana')),
  'museo-del-prado',
  'Museo del Prado',
  'Uno de los mejores museos del mundo, hogar de Las Meninas de Velázquez y el Jardín de las Delicias del Bosco',
  'Sumérgete en siglos de arte español en el Prado. Desde las Meninas de Velázquez hasta los horrores del Jardín de las Delicias de El Bosco, cada sala es un viaje en el tiempo. No te pierdas la colección de Goya, especialmente los Pinturas Negras en la segunda planta.',
  'El Museo del Prado, inaugurado en 1819, alberga más de 8,000 obras y es considerado el museo de arte más importante de España. Destacan Velázquez (Las Meninas, 1656), Goya (La maja desnuda, 1797-1800) y El Bosco (El jardín de las delicias, 1490-1510). El edificio neoclásico fue diseñado por Juan de Villanueva.',
  'museum',
  '["arte","cultura","imprescindible","historia"]'::jsonb,
  '2-3 horas',
  '15€ general, gratis de lunes a sábado 18h-20h y domingos 17h-19h',
  'Lunes a sábado: 10:00 - 20:00. Domingos y festivos: 10:00 - 19:00',
  'published',
  true,
  'verified',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Templo Senso-ji (tokyo)
INSERT INTO destinations (country_id, city_id, slug, title_es, summary_es, adventure_content_es, student_content_es, type, tags, estimated_visit_time, price, opening_hours, status, featured, verification_status, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'japon'),
  (SELECT id FROM cities WHERE slug = 'tokyo' AND country_id = (SELECT id FROM countries WHERE slug = 'japon')),
  'templo-senso-ji',
  'Templo Senso-ji',
  'El templo budista más antiguo de Tokio, famoso por su puerta Thunder Gate y calle Nakamise llena de tradición',
  'Cruza el impresionante Kaminarimon (Puerta del Trueno) con su enorme linterna roja y adéntrate en la calle Nakamise, donde vendedores de dulces tradicionales y souvenirs crean un ambiente mágico. El templo principal, con su incienso eterno, ofrece una experiencia espiritual única en medio del bullicio de Asakusa.',
  'El Templo Senso-ji, fundado en 645 d.C., es el templo budista más antiguo de Tokio. Dedicado a Kannon, la diosa de la misericordia. La Nakamise-dori, calle comercial que lleva al templo, data del siglo XVIII. El pagoda de cinco pisos (1973) alberga cenizas de Buda. El incienso del templo se cree que tiene poderes curativos.',
  'monument',
  '["templo","budismo","historia","cultura","imprescindible"]'::jsonb,
  '1-2 horas',
  'Gratis (acepta donaciones)',
  'Siempre abierto (el templo principal 6:00 - 17:00)',
  'published',
  true,
  'verified',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Machu Picchu (cusco)
INSERT INTO destinations (country_id, city_id, slug, title_es, summary_es, adventure_content_es, student_content_es, type, tags, estimated_visit_time, price, opening_hours, status, featured, verification_status, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'peru'),
  (SELECT id FROM cities WHERE slug = 'cusco' AND country_id = (SELECT id FROM countries WHERE slug = 'peru')),
  'machu-picchu',
  'Machu Picchu',
  'La ciudad perdida de los incas, maravilla del mundo y destino imperdible de Sudamérica',
  'Despierta antes del amanecer en Aguas Calientes y sube en bus serpenteando hasta la entrada. Cuando la niebla se disipa y las primeras luces iluminan las terrazas de piedra, entenderás por qué es una de las maravillas del mundo moderno. Camina hasta la Puerta del Sol para la vista clásica, o sube al Huayna Picchu si te atreves (reserva con meses de anticipación).',
  'Machu Picchu, construida alrededor de 1450 durante el imperio inca de Pachacútec, fue abandonada en el siglo XVI durante la conquista española. Redescubierta por Hiram Bingham en 1911. Patrimonio de la Humanidad desde 1983 y una de las Nuevas Siete Maravillas del Mundo Moderno. El sitio incluye más de 150 edificios: templos, almacenes y residencias. La arquitectura se adapta perfectamente a la geografía montañosa.',
  'monument',
  '["incas","arqueología","patrimonio","naturaleza","imprescindible","montaña"]'::jsonb,
  'Medio día completo',
  '152 soles (≈40€) entrada general. Huayna Picchu: 200 soles adicionales. Obligatorio guía oficial desde 2024.',
  '6:00 - 17:30 (última entrada 14:00). Dos turnos: mañana (6:00-12:00) y tarde (12:00-17:30)',
  'published',
  true,
  'verified',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Parque del Retiro (madrid)
INSERT INTO destinations (country_id, city_id, slug, title_es, summary_es, adventure_content_es, student_content_es, type, tags, estimated_visit_time, price, opening_hours, status, featured, verification_status, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'espana'),
  (SELECT id FROM cities WHERE slug = 'madrid' AND country_id = (SELECT id FROM countries WHERE slug = 'espana')),
  'parque-del-retiro',
  'Parque del Retiro',
  'El pulmón verde de Madrid con estanque, palacio de cristal y jardines históricos',
  'Alquila una barca de remos en el estanque del Retiro con el monumento a Alfonso XII de fondo. Explora el Palacio de Velázquez y el mágico Palacio de Cristal, donde la luz se filtra creando un ambiente etéreo. Los jardines secretos como el Rosaleda ofrecen rincones de paz en medio de la ciudad.',
  'El Parque del Buen Retiro fue creado en el siglo XVII como jardín privado de la monarquía española. Abierto al público en 1868. 125 hectáreas con más de 15,000 árboles. Destacan: el Palacio de Cristal (1887, estilo victoriano), el estanque artificial (año 1634) y la estatua del Ángel Caído (1878, única escultura del mundo dedicada al demonio).',
  'nature',
  '["parque","naturaleza","jardines","gratis"]'::jsonb,
  '2 horas',
  'Gratis',
  '6:00 - 00:00 (horario variable según estación)',
  'published',
  false,
  'verified',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Fushimi Inari Taisha (kioto)
INSERT INTO destinations (country_id, city_id, slug, title_es, summary_es, adventure_content_es, student_content_es, type, tags, estimated_visit_time, price, opening_hours, status, featured, verification_status, created_at, updated_at)
VALUES (
  (SELECT id FROM countries WHERE slug = 'japon'),
  (SELECT id FROM cities WHERE slug = 'kioto' AND country_id = (SELECT id FROM countries WHERE slug = 'japon')),
  'fushimi-inari',
  'Fushimi Inari Taisha',
  'Santuario shinto famoso por sus miles de torii rojos formando túneles en la montaña',
  'Camina entre los 10,000 torii rojos que serpentean por la montaña sagrada. Cada puerta fue donada por un empresario buscando el favor de Inari, dios del arroz y el negocio. Subir hasta la cumbre toma 2-3 horas y ofrece vistas espectaculares de Kioto. Los santuarios más pequeños en la cima son mágicos y casi vacíos de turistas.',
  'Fushimi Inari Taisha es el santuario principal de los 30,000 santuarios dedicados a Inari en Japón. Fundado en el año 711. Los famosos torii rojos (vermillón) comenzaron a donarse en el período Edo (1603-1868). El santuario incluye el monte Inari (233m) con senderos que toman 2-3 horas recorrer. Inari es dios del arroz, sake, fertilidad y éxito en los negocios.',
  'monument',
  '["santuario","shinto","senderismo","gratis","imprescindible"]'::jsonb,
  '2-3 horas (ida y vuelta completa)',
  'Gratis',
  'Siempre abierto',
  'published',
  true,
  'verified',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- DESTINATION SOURCES
-- ============================================

-- Source for: Museo del Prado
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'museo-del-prado'),
  'Guía oficial del Museo del Prado',
  NULL,
  'own',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Source for: Templo Senso-ji
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'templo-senso-ji'),
  'Folletos oficiales del templo Senso-ji',
  NULL,
  'own',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Source for: Machu Picchu
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'machu-picchu'),
  'Ministerio de Cultura del Perú',
  'https://www.machupicchu.gob.pe',
  'website',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Source for: Machu Picchu
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'machu-picchu'),
  'Machu Picchu: Unveiling the Mystery of the Incas',
  NULL,
  'book',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Source for: Parque del Retiro
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'parque-del-retiro'),
  'Ayuntamiento de Madrid - Parque del Retiro',
  'https://www.madrid.es/retiro',
  'website',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Source for: Parque del Retiro
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'parque-del-retiro'),
  'El Retiro: Historia y Arte',
  NULL,
  'book',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Source for: Fushimi Inari Taisha
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'fushimi-inari'),
  'Fushimi Inari Taisha Official',
  'https://inari.jp/en/',
  'website',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;

-- Source for: Fushimi Inari Taisha
INSERT INTO destination_sources (destination_id, title, url, type, supports, created_at)
VALUES (
  (SELECT id FROM destinations WHERE slug = 'fushimi-inari'),
  'The Fox and the Jewel: Shared and Private Meanings in Contemporary Japanese Inari Worship',
  NULL,
  'book',
  NULL,
  NOW()
)
ON CONFLICT DO NOTHING;


COMMIT;

-- ============================================
-- END OF SEED
-- ============================================