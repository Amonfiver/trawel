/**
 * Seed local 007: contenido producto minimo
 *
 * Proposito:
 * Crear datos publicados de prueba para validar la capa read-only de contenido
 * producto en Supabase, sin tocar tablas legacy ni modificar schema/policies.
 *
 * Uso previsto:
 * Ejecutar manualmente solo contra el entorno Supabase elegido para pruebas.
 * No contiene service role ni operaciones sobre mapas, comunidad o legacy.
 */

-- ============================================
-- STATIC_PAGES
-- ============================================

INSERT INTO static_pages (
    slug,
    type,
    title,
    summary,
    body,
    version,
    seo_title,
    seo_description,
    canonical_slug,
    noindex,
    metadata,
    status,
    review_state,
    published_at
)
VALUES
(
    'sobre-trawel',
    'about',
    'Sobre Trawel',
    'Trawel es una guia publica para explorar destinos desde mapas, contexto editorial y experiencias revisadas.',
    '{
        "sections": [
            {
                "heading": "Que es Trawel",
                "body": "Trawel ayuda a descubrir paises, zonas y futuras aventuras de viajeros con una experiencia centrada en mapas y contenido publicado."
            },
            {
                "heading": "Como trabajamos",
                "body": "El contenido se prepara con criterio editorial y se muestra solo cuando esta listo para publicarse. Si falta informacion, la interfaz usa estados prudentes de preparacion."
            }
        ]
    }'::jsonb,
    '2026-06-15-demo',
    'Sobre Trawel',
    'Informacion inicial sobre Trawel y su forma de presentar destinos.',
    'sobre-trawel',
    false,
    '{"seed": "007_product_content_seed"}'::jsonb,
    'published',
    'demo_seed',
    NOW()
),
(
    'contacto',
    'contact',
    'Contacto',
    'Canal inicial de contacto para consultas sobre Trawel.',
    '{
        "sections": [
            {
                "heading": "Consultas generales",
                "body": "Puedes usar esta pagina como referencia inicial de contacto mientras Trawel prepara canales definitivos de atencion."
            },
            {
                "heading": "Contenido y colaboraciones",
                "body": "Las propuestas editoriales o colaboraciones deben revisarse antes de aparecer en la app publica."
            }
        ]
    }'::jsonb,
    '2026-06-15-demo',
    'Contacto - Trawel',
    'Informacion inicial de contacto para Trawel.',
    'contacto',
    false,
    '{"seed": "007_product_content_seed"}'::jsonb,
    'published',
    'demo_seed',
    NOW()
),
(
    'privacidad',
    'privacy',
    'Privacidad',
    'Texto inicial de privacidad para pruebas de contenido estatico.',
    '{
        "sections": [
            {
                "heading": "Datos personales",
                "body": "Trawel debe tratar los datos personales con prudencia y solo para las finalidades informadas en cada flujo."
            },
            {
                "heading": "Estado del texto",
                "body": "Este contenido es una version inicial para validar el sistema y no sustituye una revision legal definitiva."
            }
        ]
    }'::jsonb,
    '2026-06-15-demo',
    'Privacidad - Trawel',
    'Politica inicial de privacidad para Trawel.',
    'privacidad',
    false,
    '{"seed": "007_product_content_seed"}'::jsonb,
    'published',
    'demo_seed',
    NOW()
),
(
    'cookies',
    'cookies',
    'Cookies',
    'Informacion inicial sobre cookies y tecnologias similares.',
    '{
        "sections": [
            {
                "heading": "Uso de cookies",
                "body": "Trawel puede usar cookies tecnicas o herramientas equivalentes para mantener la experiencia publica funcionando correctamente."
            },
            {
                "heading": "Preferencias",
                "body": "Cualquier uso no esencial debera explicarse y gestionarse mediante mecanismos adecuados antes de activarse en producto."
            }
        ]
    }'::jsonb,
    '2026-06-15-demo',
    'Cookies - Trawel',
    'Informacion inicial sobre cookies en Trawel.',
    'cookies',
    false,
    '{"seed": "007_product_content_seed"}'::jsonb,
    'published',
    'demo_seed',
    NOW()
),
(
    'terminos',
    'terms',
    'Terminos de uso',
    'Condiciones iniciales de uso para pruebas de contenido.',
    '{
        "sections": [
            {
                "heading": "Uso de la app",
                "body": "Trawel ofrece informacion de viaje con fines orientativos. Las decisiones finales de viaje deben contrastarse con fuentes oficiales y actualizadas."
            },
            {
                "heading": "Contenido publicado",
                "body": "El contenido puede evolucionar y corregirse cuando se detecten cambios, errores o informacion incompleta."
            }
        ]
    }'::jsonb,
    '2026-06-15-demo',
    'Terminos de uso - Trawel',
    'Condiciones iniciales de uso de Trawel.',
    'terminos',
    false,
    '{"seed": "007_product_content_seed"}'::jsonb,
    'published',
    'demo_seed',
    NOW()
),
(
    'creditos-imagenes',
    'image_credits',
    'Creditos de imagenes',
    'Pagina inicial para creditos, licencias y atribuciones de imagenes.',
    '{
        "sections": [
            {
                "heading": "Creditos",
                "body": "Las imagenes editoriales deben conservar informacion de autoria, fuente, licencia y uso permitido cuando corresponda."
            },
            {
                "heading": "Correcciones",
                "body": "Si una atribucion falta o necesita corregirse, debe revisarse antes de mantener la imagen publicada."
            }
        ]
    }'::jsonb,
    '2026-06-15-demo',
    'Creditos de imagenes - Trawel',
    'Creditos y atribuciones iniciales de imagenes en Trawel.',
    'creditos-imagenes',
    false,
    '{"seed": "007_product_content_seed"}'::jsonb,
    'published',
    'demo_seed',
    NOW()
),
(
    'compartir',
    'share',
    'Compartir una aventura',
    'Informacion inicial para orientar futuros envios de experiencias viajeras.',
    '{
        "sections": [
            {
                "heading": "Aventuras viajeras",
                "body": "Trawel prepara una experiencia para recibir historias reales, revisarlas y publicarlas solo cuando cumplan criterios de privacidad y moderacion."
            },
            {
                "heading": "Antes de publicar",
                "body": "Los envios deben entrar como pendientes y no mostrarse publicamente hasta ser aprobados."
            }
        ]
    }'::jsonb,
    '2026-06-15-demo',
    'Compartir una aventura - Trawel',
    'Informacion inicial para compartir experiencias en Trawel.',
    'compartir',
    false,
    '{"seed": "007_product_content_seed"}'::jsonb,
    'published',
    'demo_seed',
    NOW()
)
ON CONFLICT (slug) DO UPDATE SET
    type = EXCLUDED.type,
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    body = EXCLUDED.body,
    version = EXCLUDED.version,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    canonical_slug = EXCLUDED.canonical_slug,
    noindex = EXCLUDED.noindex,
    metadata = EXCLUDED.metadata,
    status = EXCLUDED.status,
    review_state = EXCLUDED.review_state,
    published_at = EXCLUDED.published_at;

-- ============================================
-- PROMOTIONS
-- ============================================

INSERT INTO promotions (
    slug,
    title,
    description,
    sponsor_name,
    sponsor_url,
    image_asset_id,
    placement_type,
    target_entity_type,
    target_entity_id,
    target_entity_slug,
    country_slug,
    zone_slug,
    traveler_type,
    mode,
    starts_at,
    ends_at,
    status,
    priority,
    disclosure_label,
    metadata,
    published_at
)
VALUES (
    'hotel-colaborador-demo-madrid',
    'Hotel colaborador de ejemplo',
    'Promocion ficticia de prueba para validar el sistema de bloques patrocinados de Trawel. No representa una oferta real, no esta vendida y no debe mostrarse como anuncio comercial definitivo.',
    'Trawel Demo Partner',
    NULL,
    NULL,
    'recommended_hotel',
    'zone',
    NULL,
    'madrid',
    'espana',
    'madrid',
    NULL,
    'adventure',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    'published',
    10,
    'Patrocinado',
    '{"seed": "007_product_content_seed", "demo": true, "real_ad": false}'::jsonb,
    NOW()
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    sponsor_name = EXCLUDED.sponsor_name,
    sponsor_url = EXCLUDED.sponsor_url,
    image_asset_id = EXCLUDED.image_asset_id,
    placement_type = EXCLUDED.placement_type,
    target_entity_type = EXCLUDED.target_entity_type,
    target_entity_id = EXCLUDED.target_entity_id,
    target_entity_slug = EXCLUDED.target_entity_slug,
    country_slug = EXCLUDED.country_slug,
    zone_slug = EXCLUDED.zone_slug,
    traveler_type = EXCLUDED.traveler_type,
    mode = EXCLUDED.mode,
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    status = EXCLUDED.status,
    priority = EXCLUDED.priority,
    disclosure_label = EXCLUDED.disclosure_label,
    metadata = EXCLUDED.metadata,
    published_at = EXCLUDED.published_at;

-- ============================================
-- EDITORIAL_CONTENTS
-- ============================================

DELETE FROM editorial_contents
WHERE metadata->>'seed_slug' IN (
    'demo-espana-adventure',
    'demo-espana-student'
);

INSERT INTO editorial_contents (
    entity_type,
    entity_id,
    entity_slug,
    country_slug,
    zone_slug,
    mode,
    headline,
    intro,
    what_makes_special,
    highlights,
    suggested_route,
    practical_tips,
    sections,
    sources,
    metadata,
    status,
    review_state,
    published_at
)
VALUES
(
    'country',
    NULL,
    'espana',
    'espana',
    NULL,
    'adventure',
    'Espana, un viaje de regiones vivas',
    'Espana se descubre mejor alternando ciudades historicas, paisajes abiertos, costa, pueblos y gastronomia local.',
    'Su variedad regional permite cambiar de ritmo sin salir del mismo pais: museos, montanas, playas, mercados y caminos con memoria.',
    '[
        "Combinar Madrid con escapadas cercanas",
        "Explorar cascos antiguos a pie",
        "Reservar tiempo para mercados y cocina local"
    ]'::jsonb,
    'Madrid como puerta de entrada, una zona cercana para caminar sin prisa y una segunda region segun temporada.',
    '[
        "Comprobar horarios oficiales antes de visitar monumentos.",
        "Evitar cargar demasiadas ciudades en pocos dias."
    ]'::jsonb,
    '[
        {
            "heading": "Primer enfoque",
            "body": "Este contenido demo sirve para validar la lectura editorial publicada por pais y modo aventura."
        }
    ]'::jsonb,
    '[]'::jsonb,
    '{"seed": "007_product_content_seed", "seed_slug": "demo-espana-adventure", "demo": true}'::jsonb,
    'published',
    'demo_seed',
    NOW()
),
(
    'country',
    NULL,
    'espana',
    'espana',
    NULL,
    'student',
    'Espana como mosaico cultural',
    'Estudiar Espana desde el viaje permite observar lenguas, territorios, patrimonio, rutas historicas y vida cotidiana en dialogo.',
    'El pais concentra capas romanas, islamicas, cristianas, modernas y contemporaneas que se leen mejor al comparar regiones.',
    '[
        "Relacionar patrimonio con geografia",
        "Comparar identidades regionales",
        "Observar cambios historicos en plazas, caminos y museos"
    ]'::jsonb,
    'Madrid para contexto institucional, una ciudad historica cercana y una region con identidad cultural marcada.',
    '[
        "Preparar una pregunta de observacion antes de cada visita.",
        "Separar fuentes oficiales, memoria local y lectura turistica."
    ]'::jsonb,
    '[
        {
            "heading": "Primer enfoque",
            "body": "Este contenido demo sirve para validar la lectura editorial publicada por pais y modo estudiante."
        }
    ]'::jsonb,
    '[]'::jsonb,
    '{"seed": "007_product_content_seed", "seed_slug": "demo-espana-student", "demo": true}'::jsonb,
    'published',
    'demo_seed',
    NOW()
);
