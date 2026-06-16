# Guia de entrada de contenido para Trawel

## Proposito

Este documento define como debe venir ordenado el contenido editorial para que Trawel pueda cargarlo en Supabase y renderizarlo correctamente. Es una referencia interna de Trawel para cualquier persona, herramienta o agente que prepare contenido antes de convertirlo en SQL revisable.

No sustituye el modelo de datos ni las migraciones. Su objetivo es reducir ambiguedad: que el contenido llegue con slugs, modos, copy, fuentes y metadatos listos para revision humana y carga controlada.

## Contenido editorial de pais: minimo necesario

Para que `CountryPage` pueda usar contenido remoto de pais desde `editorial_contents`, Trawel necesita una fila completa por pais y por modo.

Cada pais publicable debe tener, como minimo:

- Una fila `mode = 'adventure'`.
- Una fila `mode = 'student'`.
- `entity_type = 'country'`.
- `entity_slug` igual al slug publico del pais, por ejemplo `mexico`.
- `country_slug` igual al mismo slug del pais.
- `status = 'published'` solo despues de revision humana.
- Textos completos en `headline`, `intro`, `what_makes_special`, `highlights`, `suggested_route` y `practical_tips`.

Si falta contenido remoto, si Supabase falla o si la primera fila publicada esta incompleta, Trawel conserva el fallback local y no muestra error publico.

## Estructura esperada en `editorial_contents`

| Campo | Requisito para pais | Nota de uso |
|---|---|---|
| `country_slug` | Obligatorio | Slug canonico del pais en Trawel. |
| `entity_slug` | Obligatorio | Igual a `country_slug` para contenido de pais. |
| `entity_type` | Obligatorio | Debe ser `country`. |
| `mode` | Obligatorio | `adventure` o `student`. |
| `headline` | Obligatorio | Titular breve, humano y especifico. |
| `intro` | Obligatorio | Entradilla editorial con contexto y promesa de viaje. |
| `what_makes_special` | Obligatorio | Explica por que este pais merece una pagina propia. |
| `highlights` | Obligatorio | JSON array con strings no vacios. |
| `suggested_route` | Obligatorio | Ruta sugerida en lenguaje natural. |
| `practical_tips` | Obligatorio | JSON array con strings no vacios; Trawel puede unirlos como texto. |
| `sections` | Obligatorio como estructura | JSON array; puede estar vacio si no se renderiza todavia. |
| `sources` | Obligatorio como estructura | JSON array; puede estar vacio solo en borradores internos, pero se recomienda completarlo. |
| `metadata` | Obligatorio como estructura | JSON object con trazabilidad de carga. |
| `status` | Obligatorio | `draft`, `review`, `published` o `archived`; CountryPage solo lee `published`. |
| `review_state` | Obligatorio operativo | Estado interno de revision, por ejemplo `prepared_for_manual_review`. |

## Modos editoriales

`adventure` es el modo viajero. Debe sonar explorador, sensorial, util y con alma. Prioriza ritmo de viaje, decisiones practicas, atmosfera, descubrimiento regional y consejos que ayuden a vivir mejor el destino.

`student` es el modo de lectura cultural. Debe explicar capas historicas, geografia, patrimonio, sociedad y conceptos utiles para aprender viajando. No debe convertirse en una ficha enciclopedica plana: sigue necesitando voz, foco y observaciones accionables.

Ambos modos pueden compartir hechos, pero no deben ser el mismo texto con pequeñas variaciones. El modo activo de Trawel filtra por `mode`, asi que cada fila debe poder sostenerse sola.

## Calidad del copy

El copy debe ser:

- Humano: frases naturales, sin tono de folleto automatico.
- Viajero: debe ayudar a imaginar como se recorre el pais.
- Util: debe orientar decisiones de ruta, ritmo, foco y expectativas.
- Con alma: debe tener una mirada editorial propia, no solo listar atractivos.
- Concreto: mejor regiones, contrastes, rutas y experiencias que adjetivos vacios.
- Publicable: sin placeholders, sin "[pendiente]" dentro de campos que CountryPage muestra.

Evitar:

- Texto generico que podria servir para cualquier pais.
- Enumeraciones sin criterio editorial.
- Tono enciclopedico plano.
- Superlativos no verificables.
- Repetir exactamente el mismo enfoque en `adventure` y `student`.

## Seguridad editorial

No inventar horarios, precios actuales, cierres, normas de visita, disponibilidad, restricciones, datos legales ni condiciones comerciales.

Si un dato puede cambiar:

- Enlazarlo o remitirlo a la fuente oficial.
- Escribirlo como consejo de verificacion, por ejemplo: "Comprueba horarios oficiales antes de cerrar la ruta".
- Evitar cifras exactas salvo que hayan sido verificadas en revision humana.
- Registrar la fuente en `sources` o la necesidad de verificacion en `metadata`.

Las recomendaciones practicas deben ser seguras y generales si no hay fuente vigente. Trawel prefiere un buen consejo de verificacion antes que una precision inventada.

## Convencion de `load_slug`

Cada carga manual debe llevar un identificador estable en `metadata.load_slug`.

Formato recomendado:

```text
{country_slug}-country-{mode}-{yyyy-mm-dd}
```

Ejemplos:

- `mexico-country-adventure-2026-06-16`
- `mexico-country-student-2026-06-16`

El `load_slug` sirve para trazabilidad e idempotencia del SQL revisable. No debe cambiarse despues de ejecutar y validar una carga, porque queda como referencia historica.

## Flujo recomendado

1. Preparar contenido estructurado por pais y modo.
2. Convertirlo en un borrador SQL revisable, preferiblemente en `docs/sql/`.
3. Revisar calidad editorial, slugs, metadatos y ausencia de datos inventados.
4. Ejecutar manualmente en Supabase solo cuando el bloque lo autorice.
5. Verificar con SQL que existen las dos filas esperadas y que `status='published'`.
6. Validar visualmente en `CountryPage` que el pais renderiza el remoto y conserva fallback si algo falla.
7. Registrar la ejecucion en `docs/BITACORA.md` y marcar el SQL como ejecutado si procede.

No usar migrations ni seeds para cargas editoriales puntuales ya validadas manualmente, salvo que exista un bloque explicito que lo pida.

## Ejemplo minimo basado en Mexico

Este ejemplo muestra la forma esperada, no el SQL completo:

```typescript
{
  entity_type: 'country',
  entity_slug: 'mexico',
  country_slug: 'mexico',
  zone_slug: null,
  mode: 'adventure',
  headline: 'México no se recorre de una sola vez: se descubre región a región.',
  intro: 'México es un país vivo, lleno de contrastes que se revelan poco a poco.',
  what_makes_special: 'Lo que hace único a México es la superposición de capas culturales, históricas y gastronómicas.',
  highlights: [
    'Recorrer Teotihuacán al amanecer',
    'Perderse en mercados de Oaxaca',
    'Descubrir pueblos mágicos'
  ],
  suggested_route: 'Ciudad de México -> Teotihuacán -> Puebla u Oaxaca -> Jalisco o Yucatán.',
  practical_tips: [
    'Elige una región principal y reserva margen para trayectos.',
    'Comprueba horarios oficiales de museos y zonas arqueológicas antes de cerrar la ruta.'
  ],
  sections: [],
  sources: [],
  metadata: {
    load_slug: 'mexico-country-adventure-2026-06-16',
    source_reference: 'docs/sql/load_mexico_editorial_contents_proposal.sql'
  },
  status: 'published',
  review_state: 'prepared_for_manual_review'
}
```

Para el mismo pais debe existir tambien la fila `mode = 'student'` con copy propio.

## Limites de alcance

Una carga de contenido editorial no debe tocar:

- Mapas.
- Rutas.
- Migrations.
- Seeds existentes.
- Frontend.
- `package.json`.
- Dependencias.
- Supabase real sin autorizacion explicita y propuesta revisada.

Si la carga necesita cambiar estructura de tabla, RLS, rutas, componentes, mapas o datos base, no es una carga editorial simple y debe abrirse como bloque separado.
