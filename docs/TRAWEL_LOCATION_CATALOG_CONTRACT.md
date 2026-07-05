# Trawel Location Catalog Contract

## Objetivo

Trawel usa `location_countries` y `location_cities` como catalogo propio de seleccion en formularios publicos. Este catalogo ayuda a clasificar aportes de comunidad desde el origen sin mezclar datos con las tablas actuales `countries` y `cities`, que siguen alimentando paginas publicas y contenido publicado.

## Separacion de responsabilidades

- `countries` / `cities`: contenido publico existente de Trawel.
- `location_countries` / `location_cities`: opciones de formulario para paises, ciudades y zonas.
- Investighost o un proceso interno futuro puede ampliar `location_cities` de forma progresiva.
- Anadir una ciudad al catalogo no publica una pagina ni crea contenido editorial.

## Reglas publicas

- El frontend solo lee paises con `is_active = true`.
- El frontend solo lee ciudades con `status = 'active'`.
- No hay `INSERT`, `UPDATE` ni `DELETE` publico anonimo sobre el catalogo.
- Si falta una ciudad, `/compartir` permite escribirla manualmente para revision.

## Flujo en /compartir

1. El usuario elige pais desde `location_countries`.
2. Trawel carga ciudades solo de ese pais desde `location_cities`.
3. La busqueda se activa al escribir 2 letras.
4. Si el usuario elige una ciudad existente, se guarda:
   - `country_slug`
   - `zone_slug`
   - `metadata.location_catalog_source = "location_cities"`
   - `metadata.location_city_name`
5. Si no encuentra la ciudad, se guarda:
   - `country_slug`
   - `metadata.city_name_manual`
   - `metadata.location_catalog_source = "manual"`

## Alcance inicial

La migracion `009_create_location_catalog_tables.sql` incluye paises activos y una semilla inicial de ciudades para Espana, Mexico, Italia e India. No pretende cargar todos los pueblos del mundo en codigo; las altas posteriores deben venir de Investighost, importaciones revisadas o procesos internos seguros.
