/**
 * Migracion 010: Ampliacion inicial de ciudades del catalogo
 *
 * Proposito:
 * Ampliar location_cities para mejorar la seleccion en /compartir sin meter
 * ciudades en codigo React ni publicar paginas automaticamente.
 */

WITH city_seed(country_slug, name, slug, region, admin_area) AS (
    VALUES
        ('mexico', 'Chihuahua', 'chihuahua', 'Chihuahua', 'Chihuahua'),
        ('mexico', 'Veracruz', 'veracruz', 'Veracruz', 'Veracruz'),
        ('mexico', 'Xalapa', 'xalapa', 'Veracruz', 'Veracruz'),
        ('mexico', 'Morelia', 'morelia', 'Michoacan', 'Michoacan'),
        ('mexico', 'Toluca', 'toluca', 'Estado de Mexico', 'Estado de Mexico'),
        ('mexico', 'Aguascalientes', 'aguascalientes', 'Aguascalientes', 'Aguascalientes'),
        ('mexico', 'San Luis Potosi', 'san-luis-potosi', 'San Luis Potosi', 'San Luis Potosi'),
        ('mexico', 'Hermosillo', 'hermosillo', 'Sonora', 'Sonora'),
        ('mexico', 'Culiacan', 'culiacan', 'Sinaloa', 'Sinaloa'),
        ('mexico', 'Saltillo', 'saltillo', 'Coahuila', 'Coahuila'),
        ('mexico', 'Torreon', 'torreon', 'Coahuila', 'Coahuila'),
        ('mexico', 'Villahermosa', 'villahermosa', 'Tabasco', 'Tabasco'),
        ('mexico', 'Tuxtla Gutierrez', 'tuxtla-gutierrez', 'Chiapas', 'Chiapas'),
        ('mexico', 'Acapulco', 'acapulco', 'Guerrero', 'Guerrero'),
        ('mexico', 'Mazatlan', 'mazatlan', 'Sinaloa', 'Sinaloa'),
        ('mexico', 'Campeche', 'campeche', 'Campeche', 'Campeche'),
        ('mexico', 'La Paz', 'la-paz', 'Baja California Sur', 'Baja California Sur'),
        ('mexico', 'Los Cabos', 'los-cabos', 'Baja California Sur', 'Baja California Sur'),
        ('mexico', 'Zacatecas', 'zacatecas', 'Zacatecas', 'Zacatecas'),
        ('mexico', 'Durango', 'durango', 'Durango', 'Durango'),
        ('mexico', 'Cuernavaca', 'cuernavaca', 'Morelos', 'Morelos'),
        ('mexico', 'Pachuca', 'pachuca', 'Hidalgo', 'Hidalgo'),
        ('mexico', 'Tampico', 'tampico', 'Tamaulipas', 'Tamaulipas'),
        ('mexico', 'Reynosa', 'reynosa', 'Tamaulipas', 'Tamaulipas'),
        ('mexico', 'Matamoros', 'matamoros', 'Tamaulipas', 'Tamaulipas'),
        ('mexico', 'Mexicali', 'mexicali', 'Baja California', 'Baja California'),
        ('mexico', 'Ensenada', 'ensenada', 'Baja California', 'Baja California'),
        ('espana', 'Castello de la Plana', 'castello-de-la-plana', 'Comunidad Valenciana', 'Castellon'),
        ('espana', 'Tarragona', 'tarragona', 'Cataluna', 'Tarragona'),
        ('espana', 'Girona', 'girona', 'Cataluna', 'Girona'),
        ('espana', 'Lleida', 'lleida', 'Cataluna', 'Lleida'),
        ('espana', 'Burgos', 'burgos', 'Castilla y Leon', 'Burgos'),
        ('espana', 'Leon', 'leon', 'Castilla y Leon', 'Leon'),
        ('espana', 'Salamanca', 'salamanca', 'Castilla y Leon', 'Salamanca'),
        ('espana', 'Caceres', 'caceres', 'Extremadura', 'Caceres'),
        ('espana', 'Badajoz', 'badajoz', 'Extremadura', 'Badajoz'),
        ('espana', 'Logrono', 'logrono', 'La Rioja', 'La Rioja'),
        ('espana', 'Pamplona', 'pamplona', 'Navarra', 'Navarra'),
        ('espana', 'Vitoria-Gasteiz', 'vitoria-gasteiz', 'Pais Vasco', 'Araba/Alava'),
        ('espana', 'San Sebastian', 'san-sebastian', 'Pais Vasco', 'Gipuzkoa'),
        ('espana', 'Huelva', 'huelva', 'Andalucia', 'Huelva'),
        ('espana', 'Cadiz', 'cadiz', 'Andalucia', 'Cadiz'),
        ('espana', 'Almeria', 'almeria', 'Andalucia', 'Almeria'),
        ('espana', 'Jaen', 'jaen', 'Andalucia', 'Jaen'),
        ('espana', 'Albacete', 'albacete', 'Castilla-La Mancha', 'Albacete'),
        ('espana', 'Ciudad Real', 'ciudad-real', 'Castilla-La Mancha', 'Ciudad Real'),
        ('espana', 'Cuenca', 'cuenca', 'Castilla-La Mancha', 'Cuenca'),
        ('espana', 'Guadalajara', 'guadalajara', 'Castilla-La Mancha', 'Guadalajara'),
        ('espana', 'Segovia', 'segovia', 'Castilla y Leon', 'Segovia'),
        ('espana', 'Avila', 'avila', 'Castilla y Leon', 'Avila'),
        ('espana', 'Zamora', 'zamora', 'Castilla y Leon', 'Zamora'),
        ('espana', 'Ourense', 'ourense', 'Galicia', 'Ourense'),
        ('espana', 'Lugo', 'lugo', 'Galicia', 'Lugo'),
        ('espana', 'Pontevedra', 'pontevedra', 'Galicia', 'Pontevedra')
)
INSERT INTO location_cities (
    country_id,
    country_slug,
    name,
    slug,
    region,
    admin_area,
    source,
    status
)
SELECT
    location_countries.id,
    city_seed.country_slug,
    city_seed.name,
    city_seed.slug,
    city_seed.region,
    city_seed.admin_area,
    'initial_expansion_82b',
    'active'
FROM city_seed
JOIN location_countries ON location_countries.slug = city_seed.country_slug
ON CONFLICT (country_slug, slug) DO NOTHING;
