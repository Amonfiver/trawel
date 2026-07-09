# Trawel Retention And Cleanup Policy

Fecha: 2026-07-09.
Bloque: 87.

## Principio

`pending_review` no es eterno.

Trawel puede recibir mensajes, sugerencias, reportes y futuras fotos, pero ninguna cola debe crecer indefinidamente. Mientras Investighost no tenga panel completo, la limpieza debe hacerse mediante SQL controlado y revision humana.

## Politica De Retencion

| Tipo | Estado | Plazo | Accion |
|------|--------|-------|--------|
| Mensajes de usuario | `pending_review` | 90 dias | Revisar, responder, archivar o encolar limpieza. |
| Mensajes rechazados/spam | `rejected` o equivalente futuro | 30 dias | Borrar salvo obligacion de conservar minimo necesario. |
| Reportes publicos | `pending_review` | 90 dias | Revisar y resolver. |
| Fotos pendientes futuras | `pending_review` / `submitted` | 30 dias | Revisar o borrar de cuarentena privada. |
| Fotos rechazadas | `rejected` | Lo antes posible | Borrar archivo privado y metadata no necesaria. |
| Contenido aprobado | `approved` / `published` | Segun contrato editorial | Mover o replicar a tabla/catalogo publicado. |

Antes de borrar, conservar solo lo estrictamente necesario para auditoria, privacidad o resolucion de incidencias.

## Helpers SQL

La migracion `013_create_cleanup_helpers.sql` crea vistas internas:

- `pending_user_messages_for_cleanup`.
- `rejected_user_messages_for_cleanup`.
- `pending_content_reports_for_cleanup`.

Tambien crea la funcion manual:

```sql
select * from enqueue_expired_pending_items();
```

La funcion no borra datos. Solo encola candidatos en `moderation_cleanup_queue` y evita duplicados abiertos con un indice unico parcial.

## Consultas Utiles

Ver mensajes pendientes antiguos:

```sql
select *
from pending_user_messages_for_cleanup
order by created_at asc;
```

Ver mensajes rechazados antiguos:

```sql
select *
from rejected_user_messages_for_cleanup
order by coalesce(reviewed_at, updated_at, created_at) asc;
```

Ver reportes pendientes antiguos:

```sql
select *
from pending_content_reports_for_cleanup
order by created_at asc;
```

Contar cola de mensajes por estado:

```sql
select status, count(*) as total
from user_messages
group by status
order by total desc;
```

Contar reportes por estado:

```sql
select status, count(*) as total
from content_reports
group by status
order by total desc;
```

Contar cola de limpieza:

```sql
select status, reason, count(*) as total
from moderation_cleanup_queue
group by status, reason
order by total desc;
```

Detectar crecimiento anomalo de mensajes por dia:

```sql
select date_trunc('day', created_at) as day, count(*) as total
from user_messages
where created_at >= now() - interval '30 days'
group by day
order by day desc;
```

Detectar crecimiento anomalo de eventos publicos:

```sql
select date_trunc('day', created_at) as day, status, count(*) as total
from public_submission_events
where created_at >= now() - interval '30 days'
group by day, status
order by day desc, status;
```

## Ejecucion Manual Mientras No Exista Panel

Flujo recomendado:

1. Revisar vistas internas.
2. Ejecutar `enqueue_expired_pending_items()` si procede.
3. Revisar `moderation_cleanup_queue`.
4. Borrar o anonimizar manualmente solo tras decision humana.
5. Registrar en bitacora interna cualquier limpieza relevante.

No hay cron externo activo y no se borra nada automaticamente.

## Futuro Investighost

Investighost o un job programado seguro podra:

- Revisar pendientes.
- Resolver reportes.
- Encolar caducados.
- Borrar rechazados/spam.
- Borrar fotos privadas caducadas o rechazadas.
- Mover contenido aprobado a tablas publicadas.

Ese flujo debe usar backend seguro o roles internos. Nunca `service_role` en frontend.

