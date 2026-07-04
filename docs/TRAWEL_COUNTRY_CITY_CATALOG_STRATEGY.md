# Trawel Country City Catalog Strategy

Estrategia para el catalogo de paises y ciudades/zonas que alimenta formularios publicos y futuras pantallas de Comunidad.

## Objetivo

Trawel debe listar paises y ciudades/zonas desde Supabase, no desde internet en tiempo real.

La UI publica no debe consultar servicios externos, hacer scraping ni intentar completar paises o ciudades sobre la marcha. El catalogo debe estar preparado por el flujo editorial/base de datos y revisado por Investighost.

## Paises

- El catalogo de paises debe vivir en Supabase.
- Trawel lee paises publicos disponibles desde `countries`.
- Los paises aparecen en selects publicos solo si cumplen las reglas de visibilidad/estado definidas.
- Investighost o el flujo de base de datos alimenta y mantiene el catalogo.
- Trawel solo lee.

## Ciudades Y Zonas

- Las ciudades/zonas deben vivir en Supabase.
- Trawel carga ciudades/zonas dependientes del pais seleccionado.
- En `/compartir`, primero se elige pais y despues ciudad/zona.
- Si Espana tiene Castellon, Madrid o Barcelona cargadas y visibles en Supabase, apareceran.
- Si una ciudad/zona no esta cargada o visible en Supabase, no aparece.

## Responsabilidad De Investighost

Investighost debe poder:

- Crear paises.
- Crear ciudades o zonas dentro de un pais.
- Activar o desactivar visibilidad publica.
- Revisar slugs y nombres.
- Mantener clasificacion para Comunidad y formularios.

La carga masiva de paises/ciudades es responsabilidad del flujo Investighost/base de datos, no de la UI publica.

## Reglas Para Trawel

- No scraping en frontend.
- No consultas externas desde Trawel para descubrir paises o ciudades.
- No campos libres de pais/zona en formularios publicos cuando exista catalogo.
- No inventar slugs en cliente.
- No mostrar destinos que no existan en Supabase o fallback aprobado.
- Si Supabase falla, el formulario debe hacer fallback seguro y no romper.

## Relacion Con `/compartir`

`/compartir` debe seguir este orden:

1. Cargar paises publicos desde Supabase.
2. El usuario elige un pais.
3. Trawel carga ciudades/zonas visibles de ese pais.
4. El usuario elige ciudad/zona.
5. El envio guarda `country_slug` y `zone_slug` para revision en Investighost.

Esto permite que Investighost filtre, apruebe o publique sin interpretar texto libre.

## Relacion Con Comunidad

Las futuras cards publicas de Comunidad deben enlazar usando `country_slug` y `zone_slug` del catalogo.

Si un aporte aprobado no puede enlazar a pais o zona real, debe quedarse fuera de Comunidad hasta que el catalogo se complete.
