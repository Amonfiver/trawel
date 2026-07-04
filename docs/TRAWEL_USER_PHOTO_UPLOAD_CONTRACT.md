# Trawel User Photo Upload Contract

Contrato documental para el flujo real de colaboraciones con fotos en Trawel.

## Objetivo

- Permitir colaboraciones con fotos sin publicacion directa.
- Clasificar pais, zona y tipo de colaboracion desde el origen.
- Preparar el flujo para aprobacion facil desde Investighost.

Flujo esperado:

```text
usuario aporta -> Trawel estandariza/clasifica -> Supabase guarda -> Investighost aprueba -> Trawel publica
```

## Tipos De Colaboracion

Los envios deben clasificar su intencion desde el formulario o servicio de entrada:

- `experiencia`: relato, recomendacion o aventura personal.
- `experiencia_aventura`: experiencia / aventura personal asociada a una futura aventura/card.
- `foto_de_encabezado`: imagen candidata para hero/header.
- `foto_de_ciudad_zona`: imagen candidata para una ciudad, zona o bloque local.
- `sugerencia_de_destino`: propuesta de nuevo destino o mejora de cobertura.
- `correccion`: aviso de error, dato incompleto o mejora editorial.

## Reglas De Fotos

- Maximo 3 fotos por envio.
- Formatos de entrada permitidos: JPG, PNG y WebP.
- Salida estandar: WebP.
- El usuario debe aceptar derechos y consentimiento antes de enviar.
- Nada se publica automaticamente.
- Las fotos quedan en cola privada hasta revision.

## Estandares De Imagen

| Uso previsto | Ancho maximo | Formato salida | Calidad |
|--------------|--------------|----------------|---------|
| Hero/header | 1920 px | WebP | 0.82 |
| Aventura/card | 1400 px | WebP | 0.80 |
| Miniatura futura | 800 px | WebP | 0.78 |

Estos estandares describen la salida web recomendada. La implementacion tecnica puede hacer la conversion en frontend, backend o Edge Function, siempre que el resultado publicado respete el contrato.

## Aviso Al Usuario

El formulario publico debe informar de forma clara que Trawel adaptara las fotos a formato web para mejorar la carga, conservar una calidad adecuada y facilitar la navegacion movil. La adaptacion puede incluir conversion a WebP, reduccion de ancho, compresion y generacion futura de miniaturas.

El aviso tambien debe dejar claro que enviar una foto no implica publicacion. Trawel recibe la colaboracion para revision y solo publica contenido aprobado.

## Clasificacion Obligatoria

El usuario no debe escribir manualmente pais o zona como texto libre.

Debe elegir:

- Pais.
- Zona dependiente del pais.
- Tipo de colaboracion.

La UI futura debe resolver `country_slug`, `zone_slug` y `submission_type` desde opciones controladas. Esto evita errores de escritura y permite que Investighost apruebe, rechace, asigne o publique sin reclasificar manualmente cada envio.

## Destino De Datos

- Fotos futuras: bucket privado `traveler-adventure-photos`.
- Registros con archivo: `user_photo_submissions`.
- Mensajes o sugerencias sin archivo: `user_messages`.
- Reportes: `content_reports`.

Las colas publicas no deben tener lectura publica. Trawel solo inserta aportes; la revision y publicacion pertenecen al flujo interno.

Decision vigente: la subida real al bucket privado no debe hacerse directamente desde frontend anon mientras no exista una policy segura especifica. Ver `docs/TRAWEL_PRIVATE_PHOTO_UPLOAD_DECISION.md`. La via recomendada es una Edge Function controlada que valide metadata/fotos, use `service_role` solo en backend, suba a `traveler-adventure-photos` e inserte `user_photo_submissions`.

## Relacion Con Investighost

Investighost revisa cada envio, decide si se aprueba o rechaza y asigna/publica el contenido aprobado.

Si `country_slug`, `zone_slug` y `submission_type` llegan correctamente desde Trawel, Investighost debe poder:

- Filtrar la cola por pais, zona y tipo.
- Revisar derechos, consentimiento y calidad visual.
- Aprobar o rechazar sin manipular manualmente la clasificacion basica.
- Publicar el resultado final solo desde tablas o assets aprobados.

La cola `user_photo_submissions` no es una fuente publica. Es una bandeja de entrada privada para moderacion.

## Reglas De Alcance

- Este contrato no crea UI.
- Este contrato no abre Storage.
- Este contrato no modifica buckets, policies, migrations ni seeds.
- Este contrato no cambia rutas publicas.
- Este contrato no publica contenido de usuario.
