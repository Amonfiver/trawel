# Trawel GitHub Actions Map Queue Diagnostic

Documento del bloque 95 para diagnosticar el aviso:

> Procesar cola de flujo de trabajo de ejecucion de mapa de paises / Todos los trabajos han fallado.

## Workflow Detectado

Archivo:

```text
.github/workflows/process-country-map-queue.yml
```

Nombre:

```text
Process country map queue
```

Job:

```text
Process one queued map asset
```

Comando:

```bash
npm run maps:queue:process -- --limit 1
```

Script:

```text
scripts/process-country-map-queue.ts
```

## Trigger Antes Del Bloque 95

El workflow se ejecutaba automaticamente cada 30 minutos:

```yaml
schedule:
  - cron: "*/30 * * * *"
workflow_dispatch:
```

## Trigger Tras El Bloque 95

Se deja solo manual:

```yaml
workflow_dispatch:
```

Esto evita correos recurrentes por fallos automaticos mientras se revisa la cola.

## Secrets Requeridos

El workflow requiere estos repository secrets en GitHub:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

El script exige ambos al arrancar. Si falta cualquiera, termina con exit code 1.

## Recursos Remotos Usados

El script consulta:

- Supabase: tabla `country_map_assets`.
- Supabase Storage: bucket `map-assets`.
- geoBoundaries API para metadata y descarga GeoJSON.

## Causas Probables De Fallo

Sin acceso a los logs remotos de GitHub Actions no se puede confirmar una causa unica. Las causas probables son:

- Falta o valor incorrecto de `SUPABASE_URL`.
- Falta o valor incorrecto de `SUPABASE_SERVICE_ROLE_KEY`.
- Registro en `country_map_assets` con `status='queued'` pero sin `iso_alpha3`.
- Error temporal o cambio de respuesta en geoBoundaries.
- Error al subir al bucket `map-assets`.
- Dependencias o instalacion en CI, aunque el workflow fija Node `22.13.0`, npm `11.6.2` y usa `npm ci`.

## Afecta A Produccion Online

No afecta al sitio online ya publicado si los mapas necesarios ya estan disponibles o si el frontend tiene fallback. Este workflow es un worker tecnico para generar assets cartograficos pendientes, no una ruta publica ni un formulario.

## Accion Tomada

Se desactivo el schedule automatico y se conserva `workflow_dispatch` manual.

Motivo:

- Evitar spam de correos por fallos cada 30 minutos.
- Mantener disponible la ejecucion manual para diagnostico cuando Octavio revise logs/secrets.
- No tocar WorldMap, D3, TopoJSON ni componentes visuales.

## Como Reactivarlo

Cuando se confirme que los secrets existen y que la cola contiene registros validos, se puede reactivar el schedule:

```yaml
on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch:
```

Alternativa futura: que Investighost controle la cola y active procesado manual o programado con observabilidad clara.

## Pendiente

- Revisar el ultimo run fallido en GitHub Actions.
- Confirmar si existen `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- Revisar filas `country_map_assets` en `queued`, especialmente `country_slug`, `iso_alpha3`, `admin_level` y `error_message`.
- Ejecutar manualmente el workflow tras corregir secretos/datos.
