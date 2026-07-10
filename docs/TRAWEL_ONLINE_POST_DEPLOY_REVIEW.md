# Trawel Online Post-Deploy Review

Documento de cierre del bloque 96 para dejar Trawel online preparado antes de entrar en Investighost.

## 1. Dominio

- `https://trawel.net`: OK.
- `https://www.trawel.net`: OK.
- SSL/candado: OK.
- Hostinger: OK como hosting publico actual.

## 2. Rutas

Rutas a mantener en revision manual online:

- `/`
- `/contacto`
- `/compartir`
- `/comunidad`
- `/pais/mexico`
- `/pais/espana`
- `/pais/espana/zona/castellon`

## 3. Formularios

Estado esperado:

- `/contacto` online envia.
- `/compartir` online envia.
- Aviso de revision visible: nada se publica automaticamente.
- Turnstile online OK.
- `public_submission_events` registra `accepted`.
- `user_messages` registra `pending_review`.
- `/compartir` puede guardar consentimiento opcional de seguimiento por email.
- Si hay consentimiento, `email_notification_queue` prepara una fila `pending` de `submission_copy` tras aplicar la migracion 014 y redesplegar `protected-public-submit`.

## 4. Seguridad

- RLS protege colas privadas.
- No lectura anon de `user_messages`.
- Rate limit activo mediante `public_submission_events` y `system_flags`.
- `system_flags` activo para apagar formularios/limites cuando haga falta.
- Fotos reales bloqueadas: no hay subida real a Storage publico.
- No service role en frontend.
- No buckets privados abiertos.
- Emails reales desactivados hasta elegir proveedor y secrets.

## 5. Costes

- Hostinger plan cerrado.
- Email de dominio gratis 12 meses: revisar renovacion antes de que venza.
- Supabase Free/plan actual bajo control.
- No storage masivo activo.
- No API email de pago activa.
- No R2 activo todavia.
- No hay proveedor transaccional con consumo activado.

## 6. Pendientes Inmediatos

- Aplicar migracion 014 si aun no esta en remoto:

```bash
npx supabase db push --linked
```

- Redesplegar `protected-public-submit` si se quiere activar encolado email:

```bash
npx supabase functions deploy protected-public-submit
```

- Desplegar `process-email-notifications` solo como stub seguro si interesa:

```bash
npx supabase functions deploy process-email-notifications
```

- Elegir proveedor email transaccional.
- Configurar secrets solo en Supabase cuando exista decision.
- Probar `contacto@trawel.net`.
- Limpiar mensajes de prueba si hace falta.
- Revisar ultimo fallo de GitHub Actions del mapa y confirmar secrets/datos de cola.
- Ejecutar manualmente `Process country map queue` solo cuando se haya revisado.

## 7. Siguiente Fase: Investighost

Investighost debe permitir:

- Login/admin seguro.
- Ver `user_messages`.
- Ver futuras `community_suggestions` si se separan de `user_messages`.
- Ver `content_reports`.
- Aprobar/rechazar aportaciones.
- Controlar `system_flags`.
- Revisar `public_submission_events`.
- Revisar `email_notification_queue`.
- Cargar paises/ciudades.
- Alimentar `location_cities`.
- Alimentar `editorial_contents`, `static_pages` y `promotions`.
- Gestionar cola de limpieza.
- Preparar flujo futuro de fotos aprobadas.

## 8. Comportamiento Online Esperado

Trawel funciona como escaparate publico: muestra contenido editorial, recibe contacto y propuestas, protege formularios con Turnstile y deja todo lo aportado en revision. Comunidad usa ejemplos editoriales hasta que haya aportes reales aprobados. No se publican envios automaticamente, no se envian emails reales y no se suben fotos reales sin una fase segura posterior.
