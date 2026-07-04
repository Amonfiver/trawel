# Trawel Community Public Model

Modelo funcional de la futura pagina publica de Comunidad.

## 1. Objetivo

Comunidad sera una pagina publica para mostrar aportes aprobados de viajeros y colaboradores de Trawel.

Su funcion no es recibir contenido bruto ni moderar desde la web publica. Su funcion es mostrar una seleccion visual de experiencias, fotos y recomendaciones ya revisadas, con enlace al pais o zona correspondiente.

Flujo objetivo:

```text
usuario aporta -> Trawel clasifica -> Supabase guarda -> Investighost revisa -> Comunidad muestra solo aprobados
```

## 2. Contenido Que Puede Aparecer

Solo puede aparecer contenido aprobado y preparado para publicacion:

- Experiencias aprobadas.
- Fotos aprobadas.
- Recomendaciones de sitio aprobadas.

Cada aporte publico debe tener clasificacion editorial suficiente para enlazarlo con un destino real de Trawel.

## 3. Contenido Que No Aparece

Comunidad no debe mostrar:

- Aportes pendientes de revision.
- Aportes rechazados.
- Aportes reportados y no resueltos.
- Fotos sin derechos claros.
- Fotos sin consentimiento confirmado.
- Textos con datos personales sensibles.
- Contenido que no tenga pais o zona verificable cuando el aporte lo requiera.

Nada enviado por usuarios se publica directamente.

## 4. Estructura De Card

Cada card publica de Comunidad debe incluir, como minimo:

- Foto principal.
- Titulo.
- Pais.
- Zona o ciudad, si existe.
- Texto corto.
- Credito visible si aplica.
- Tipo de aporte:
  - experiencia.
  - foto.
  - recomendacion de sitio.

Campos recomendados:

- `id`.
- `title`.
- `summary`.
- `image_url` o asset aprobado.
- `country_slug`.
- `country_name`.
- `zone_slug`.
- `zone_name`.
- `contribution_type`.
- `credit_name`.
- `published_at`.
- `status='published'` o equivalente aprobado.

## 5. Navegacion

Las cards deben enlazar siempre a un destino publico existente:

- Con `country_slug` y `zone_slug`: `/pais/{countrySlug}/zona/{zoneSlug}`.
- Solo con `country_slug`: `/pais/{countrySlug}`.

Si una card no puede resolver destino, no debe publicarse hasta que Investighost complete la clasificacion.

## 6. Relacion Con Investighost

Investighost es responsable de:

- Revisar aportes.
- Aprobar contenido publicable.
- Rechazar contenido no apto.
- Publicar contenido aprobado hacia la fuente publica que Comunidad lea.
- Retirar contenido publicado si hay reporte, retirada de consentimiento o problema editorial.
- Mantener creditos, derechos y clasificacion.

Trawel solo lee contenido ya aprobado.

## 7. Reglas De Seguridad

- Ningun aporte pendiente aparece en Comunidad.
- Ningun archivo privado se expone por accidente.
- Las fotos publicas deben provenir de assets aprobados o URLs publicas controladas.
- El bucket privado de cuarentena no se usa como fuente directa de Comunidad.
- No hay `service_role` en frontend.
- Si un aporte es reportado, Investighost debe poder retirarlo o despublicarlo.

## 8. Proximos Bloques

- Crear ruta publica `/comunidad`.
- Disenar cards visuales de Comunidad.
- Enlazar cards a paises y zonas.
- Documentar la estrategia de catalogo pais/ciudad.
- Definir contratos de publicacion aprobada.
- Revisar seguridad antes de hosting.
