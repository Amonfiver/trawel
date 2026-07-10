# Trawel Email Follow-Up Consent

Documento creado en el bloque 91 para definir el consentimiento opcional de seguimiento por email en `/compartir`.

## Principio

El consentimiento de seguimiento editorial es opcional e independiente de la aceptacion de privacidad. Una persona puede enviar una propuesta aunque no marque este consentimiento.

## Que Permite

Si el usuario marca el checkbox, Trawel guarda en `user_messages.metadata`:

```json
{
  "email_followup_consent": true,
  "email_followup_scope": [
    "submission_copy",
    "review_status",
    "publication_notice"
  ]
}
```

Este consentimiento permite preparar, en una fase posterior:

- Una copia de lo compartido.
- Avisos sobre el estado de revision.
- Aviso si la aportacion se publica.

Si el usuario no lo marca, se guarda `email_followup_consent: false` y no deben programarse emails de seguimiento.

## No Es Newsletter

Este consentimiento no autoriza marketing ni newsletter. Solo cubre comunicaciones relacionadas con la aportacion concreta enviada desde `/compartir`.

## Privacidad

El email se usa para contactar con la persona sobre su propuesta. No se publica el email en Trawel ni en Comunidad.

## Estado De Envio Real

No hay envio real de emails en este bloque. Trawel solo guarda metadata de consentimiento para que Investighost o una Edge Function futura puedan actuar con seguridad cuando exista proveedor transaccional configurado.

## Relacion Con Investighost

Investighost usara este consentimiento para decidir si puede notificar cambios de estado, revision o publicacion de una aportacion. Sin consentimiento, Investighost no debe generar emails de seguimiento editorial.
