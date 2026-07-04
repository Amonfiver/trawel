# Trawel Participation Email Flow

Flujo documental para emails de confirmacion y seguimiento de participaciones en Trawel.

No implementa envio. Define cuando enviar, que decir y que reglas de seguridad respetar.

## Objetivo

Enviar confirmaciones claras cuando una persona participe en Trawel, sin prometer publicacion automatica y sin exponer claves de email en el frontend.

## Cuando Enviar Email

Casos recomendados:

- Contacto recibido desde `/contacto`.
- Colaboracion recibida desde `/compartir`.
- Foto recibida cuando exista upload real seguro.
- Aviso futuro de revision, aprobacion, rechazo o solicitud de informacion adicional.

## Copy Base

Texto base para colaboraciones:

```text
Hemos recibido tu colaboracion en Trawel.

La revisaremos antes de publicarla. Si se aprueba, te avisaremos.

Gracias por ayudar a construir un mapa viajero mas vivo y cuidado.
```

Texto base para contacto:

```text
Hemos recibido tu mensaje en Trawel.

Lo revisaremos antes de responder. Este mensaje no se publica en la web.
```

Texto base para fotos futuras:

```text
Hemos recibido tu propuesta con fotos.

Las revisaremos para confirmar derechos, consentimiento, calidad y relacion con el destino. Enviar una foto no implica publicacion automatica.
```

## Reglas Editoriales

- No prometer publicacion.
- No sugerir que el contenido ya fue aprobado.
- Indicar que todo pasa por revision.
- Si se aprueba, avisar al usuario cuando exista flujo de notificacion.
- Mantener tono claro, amable y sobrio.

## Reglas Tecnicas

- No enviar emails desde frontend.
- No meter claves de email en frontend.
- No exponer API keys como variables `VITE_`.
- El envio debe hacerlo un backend seguro, Supabase Edge Function o proveedor autorizado.
- La funcion de envio debe validar el caso, registrar evento y evitar abuso.
- El frontend solo puede recibir resultado de cola, nunca credenciales.

## Relacion Con Investighost

Investighost puede integrarse como emisor futuro:

- Al marcar una colaboracion como recibida.
- Al aprobar o rechazar.
- Al solicitar mas informacion.
- Al retirar contenido publicado.

La decision final de proveedor y automatizacion queda pendiente de bloque tecnico especifico.

## Estados Recomendados

- `received`: confirmacion inicial enviada.
- `reviewing`: revision interna en curso.
- `approved`: contenido aprobado.
- `rejected`: contenido rechazado.
- `needs_info`: se requiere informacion adicional.

Estos estados pueden vivir en tablas internas o logs de notificacion, no necesariamente en la cola publica.
