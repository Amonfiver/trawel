# Trawel Email Templates

Plantillas documentales del bloque 93. No activan envio real.

## Reglas

- Usar solo para emails transaccionales relacionados con una aportacion concreta.
- No usar como newsletter ni marketing.
- No incluir datos sensibles innecesarios.
- No afirmar publicacion hasta que Investighost haya aprobado.
- No enviar si no existe consentimiento cuando el aviso depende de seguimiento editorial.

## A) submission_copy

Asunto:

```text
Hemos recibido tu propuesta en Trawel
```

Texto:

```text
Hola {{recipient_name}},

Hemos recibido tu propuesta en Trawel.

Resumen:
{{submission_summary}}

Estado actual: pendiente de revision.

Nada enviado por usuarios se publica automaticamente. Trawel e Investighost revisaran permisos, clasificacion y encaje editorial antes de que pueda aparecer en la comunidad.

Gracias por ayudar a construir Trawel.

Equipo Trawel
```

## B) publication_notice

Asunto:

```text
Tu aportacion ya forma parte de Trawel
```

Texto:

```text
Hola {{recipient_name}},

Tu aportacion ha sido revisada y ya forma parte de Trawel.

Puedes verla aqui:
{{public_url}}

Gracias por compartir una historia que puede ayudar a otros viajeros. Cuando quieras, puedes seguir enviando experiencias, fotos o recomendaciones desde Trawel.

Equipo Trawel
```

## C) review_status

Asunto:

```text
Actualizacion sobre tu propuesta en Trawel
```

Texto:

```text
Hola {{recipient_name}},

Tenemos una actualizacion sobre tu propuesta:

Estado: {{review_status}}

{{review_note}}

Si se publica, te avisaremos cuando exista una pagina o destino relacionado.

Equipo Trawel
```

## D) rejection_notice

Uso opcional y cuidadoso. Solo activar si existe politica editorial clara.

Asunto:

```text
Actualizacion sobre tu propuesta en Trawel
```

Texto:

```text
Hola {{recipient_name}},

Gracias por tu propuesta. Esta vez no podremos publicarla en Trawel.

{{rejection_reason}}

Aun asi, agradecemos que hayas dedicado tiempo a compartirla. Puedes enviar otra aportacion cuando quieras.

Equipo Trawel
```

## Variables Sugeridas

- `recipient_name`
- `submission_summary`
- `review_status`
- `review_note`
- `public_url`
- `rejection_reason`

## Estado

Estas plantillas son contrato documental para Investighost o una Edge Function futura. No hay proveedor activo ni envio real en este bloque.
