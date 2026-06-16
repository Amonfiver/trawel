-- ============================================================================
-- PROPUESTA REVISABLE: editorial_contents remoto para México CountryPage
-- ============================================================================
--
-- Estado: EJECUTADO MANUALMENTE Y VALIDADO EN SUPABASE.
-- Fecha de preparación: 2026-06-16.
-- Fecha de ejecución manual validada: 2026-06-16 18:15:46.875413+00.
--
-- Objetivo:
-- - Preparar la primera carga editorial remota de México para CountryPage.
-- - Cumplir el contrato documentado en docs/INVESTIGHOST_CONTRACT.md.
-- - Insertar dos filas publicadas, una por modo: adventure y student.
--
-- Importante:
-- - SQL histórico ejecutado manualmente; no ejecutar de nuevo sin revisión humana.
-- - NO es una migración.
-- - NO es un seed y NO modifica seeds existentes.
-- - NO toca España.
-- - CountryPage solo usará estas filas si status='published' y todos los
--   campos obligatorios están completos.
--
-- Resultado validado:
-- - entity_type: country
-- - entity_slug: mexico
-- - country_slug: mexico
-- - mode: adventure / student
-- - status: published
-- - load_slug: mexico-country-adventure-2026-06-16
-- - load_slug: mexico-country-student-2026-06-16
-- - published_at: 2026-06-16 18:15:46.875413+00
--
-- Idempotencia:
-- - Este borrador borra solamente filas creadas por esta propuesta mediante
--   metadata->>'load_slug'.
-- - No borra otros contenidos remotos de México que pudieran existir.
--
-- Preflight recomendado antes de ejecutar manualmente:
-- SELECT id, entity_type, entity_slug, country_slug, mode, status, published_at, metadata
-- FROM editorial_contents
-- WHERE entity_type = 'country'
--   AND entity_slug = 'mexico'
--   AND country_slug = 'mexico'
-- ORDER BY published_at DESC NULLS LAST, updated_at DESC;
--
-- ============================================================================

BEGIN;

DELETE FROM editorial_contents
WHERE metadata->>'load_slug' IN (
    'mexico-country-adventure-2026-06-16',
    'mexico-country-student-2026-06-16'
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
) VALUES
(
    'country',
    NULL,
    'mexico',
    'mexico',
    NULL,
    'adventure',
    'México no se recorre de una sola vez: se descubre región a región.',
    'México es un país vivo, lleno de contrastes que se revelan poco a poco. Pirámides que emergen de la selva, mercados donde colores y aromas crean un mapa sensorial, pueblos detenidos en el tiempo y costas que cambian de personalidad cada pocos kilómetros.',
    'Lo que hace único a México es la superposición de capas: ruinas prehispánicas bajo ciudades coloniales, tradiciones indígenas que resisten en pleno siglo XXI y una gastronomía tan diversa que cambia radicalmente de un estado a otro. No es un destino para ver cosas: es para dejarse llevar por la corriente de sus regiones.',
    '[
        "Recorrer Teotihuacán al amanecer, cuando la luz transforma la Ciudad de los Dioses",
        "Perderse en mercados de Oaxaca para probar mole y leer la vida local en sus puestos",
        "Descubrir pueblos mágicos donde las plazas siguen marcando el ritmo del viaje",
        "Alternar Pacífico y Caribe para entender dos formas distintas de costa mexicana"
    ]'::jsonb,
    'Ciudad de México -> Teotihuacán -> Puebla u Oaxaca -> Jalisco o Yucatán según busques arquitectura colonial, gastronomía ancestral o playas.',
    '[
        "Elige una región principal y reserva margen para trayectos: México es grande y los desplazamientos pueden consumir más tiempo del previsto.",
        "Comprueba horarios oficiales de museos, zonas arqueológicas y reservas antes de cerrar la ruta.",
        "Evita convertir el viaje en una lista de ciudades: México se disfruta mejor profundizando que acumulando paradas."
    ]'::jsonb,
    '[
        {
            "heading": "Enfoque editorial",
            "body": "Texto preparado a partir del contenido local actual de countryEditorial.ts para validar la carga remota progresiva de México en CountryPage."
        }
    ]'::jsonb,
    '[]'::jsonb,
    '{
        "load_slug": "mexico-country-adventure-2026-06-16",
        "country": "mexico",
        "mode": "adventure",
        "prepared_by": "Codex",
        "source_reference": "src/features/countries/data/countryEditorial.ts",
        "contract_reference": "docs/INVESTIGHOST_CONTRACT.md",
        "real_remote_load_proposal": true,
        "requires_human_review_before_execution": true
    }'::jsonb,
    'published',
    'prepared_for_manual_review',
    NOW()
),
(
    'country',
    NULL,
    'mexico',
    'mexico',
    NULL,
    'student',
    'México es un cruce de civilizaciones que puedes leer en su paisaje.',
    'Entender México requiere mirar sus capas históricas. En un mismo viaje conviven vestigios de grandes civilizaciones prehispánicas, ciudades coloniales que fueron nodos del mundo novohispano y una sociedad contemporánea en diálogo constante con su pasado.',
    'México ofrece un laboratorio vivo para estudiar la transculturación: cómo el encuentro entre mundos generó algo nuevo. Su geografía, hecha de montañas, valles, costas y desiertos, ha moldeado regiones culturalmente distintas dentro de un mismo país.',
    '[
        "Observar la superposición arquitectónica: templos prehispánicos, iglesias coloniales y ciudad moderna",
        "Comparar cómo el español adquiere matices distintos en cada región",
        "Estudiar milpas y chinampas como ingeniería agrícola prehispánica aún vigente",
        "Analizar el papel de México como puente cultural entre Norteamérica y Latinoamérica"
    ]'::jsonb,
    'Comienza en la Ciudad de México, con Museo de Antropología y Templo Mayor, para entender las raíces. Después elige una región para profundizar: Oaxaca por diversidad indígena, Puebla por barroco novohispano o Yucatán por civilización maya.',
    '[
        "Lleva un cuaderno de campo: los contrastes temporales, culturales y sociales merecen anotarse durante el viaje.",
        "Distingue fuentes oficiales, interpretación museística y memoria local cuando tomes notas.",
        "Antes de citar fechas, precios u horarios, verifica siempre la fuente oficial vigente."
    ]'::jsonb,
    '[
        {
            "heading": "Enfoque editorial",
            "body": "Texto preparado a partir del contenido local actual de countryEditorial.ts para validar la carga remota progresiva de México en CountryPage."
        }
    ]'::jsonb,
    '[]'::jsonb,
    '{
        "load_slug": "mexico-country-student-2026-06-16",
        "country": "mexico",
        "mode": "student",
        "prepared_by": "Codex",
        "source_reference": "src/features/countries/data/countryEditorial.ts",
        "contract_reference": "docs/INVESTIGHOST_CONTRACT.md",
        "real_remote_load_proposal": true,
        "requires_human_review_before_execution": true
    }'::jsonb,
    'published',
    'prepared_for_manual_review',
    NOW()
);

-- Verificación posterior recomendada:
-- SELECT entity_type, entity_slug, country_slug, mode, status, headline, published_at, metadata->>'load_slug' AS load_slug
-- FROM editorial_contents
-- WHERE metadata->>'load_slug' IN (
--     'mexico-country-adventure-2026-06-16',
--     'mexico-country-student-2026-06-16'
-- )
-- ORDER BY mode;

COMMIT;
