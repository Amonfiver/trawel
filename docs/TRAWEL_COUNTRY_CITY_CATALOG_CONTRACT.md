# Trawel Country City Catalog Contract

Contrato minimo para cargar paises y ciudades/zonas en Supabase de forma compatible con Trawel e Investighost.

## Objetivo

Definir los campos que Investighost o el flujo de base de datos deben preparar para que Trawel pueda:

- Mostrar paises en selects publicos.
- Cargar ciudades/zonas dependientes del pais.
- Enlazar Comunidad a paises y zonas reales.
- Mantener slugs estables sin depender de internet en tiempo real.

## Pais

Campos minimos o recomendados:

- `id`: identificador unico.
- `slug`: slug estable usado en rutas y relaciones.
- `name_es`: nombre publico en espanol.
- `iso2`: codigo ISO 3166-1 alpha-2 si existe.
- `iso3`: codigo ISO 3166-1 alpha-3 si existe.
- `status`: estado editorial/publico.
- `featured`: marca para destacar en Home o listados.
- `emoji`: bandera o simbolo si procede.
- `description_es`: descripcion breve si procede.
- `visible_in_public_selects`: booleano recomendado para controlar formularios.

Estados recomendados:

- `active`: visible para Trawel.
- `disabled`: no visible.
- `comingSoon`: reservado para demanda o preparacion futura.

## Ciudad O Zona

Campos minimos o recomendados:

- `id`: identificador unico.
- `country_id`: relacion obligatoria con `countries.id`.
- `slug`: slug estable dentro del pais.
- `name_es`: nombre publico en espanol.
- `status`: estado editorial/publico.
- `featured`: marca para destacar si procede.
- `type`: tipo editorial, por ejemplo `ciudad`, `zona`, `region`, `playa`, `ruta` o similar.
- `latitude`: coordenada si procede.
- `longitude`: coordenada si procede.
- `visible_in_public_selects`: booleano recomendado para formularios.
- `visible_in_map`: booleano recomendado para mapas futuros.
- `short_description_es`: resumen breve para listados o contexto.

## Reglas De Slugs

- Los slugs son estables.
- No se cambian sin plan de redireccion o migracion.
- No puede haber duplicados dentro del mismo pais.
- Pueden existir slugs iguales en paises distintos si la ruta incluye `country_slug`, aunque conviene evitarlos cuando cree confusion editorial.
- El frontend no inventa slugs.

## Reglas De Visibilidad

- Trawel solo lee registros visibles y con estado publico compatible.
- Si una ciudad/zona no esta en Supabase, no aparece en selects.
- Si una ciudad/zona existe pero no esta visible, no aparece en selects.
- Si una ciudad/zona no debe mostrarse en mapas, `visible_in_map=false` debe permitir ocultarla sin borrarla.

## Responsabilidad De Carga

- Las ciudades/zonas las carga Investighost o un proceso de base de datos autorizado.
- Trawel no consulta internet en tiempo real.
- Trawel no hace scraping.
- Trawel no corrige catalogo desde la UI publica.
- La UI publica solo lee opciones ya disponibles.

## Relacion Con `/compartir`

El formulario publico debe guardar:

- `country_slug`.
- `zone_slug`.
- Tipo de colaboracion.

Si el pais o zona no existe en el catalogo visible, el usuario no debe poder seleccionarlo manualmente como texto libre.

## Relacion Con Comunidad

Las cards aprobadas de Comunidad deben enlazar usando:

- `/pais/{countrySlug}/zona/{zoneSlug}` cuando exista zona.
- `/pais/{countrySlug}` cuando solo exista pais.

Una card aprobada sin destino resoluble debe quedar fuera de publicacion hasta que se complete el catalogo.
