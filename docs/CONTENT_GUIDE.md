# Guía Editorial de Contenido - Trawel

Esta guía ayuda a convertir investigación editorial en contenido Trawel de forma consistente.

---

## Jerarquía de contenido

- **País**: Contenedor de ciudades
- **Ciudad**: Contenedor de destinos  
- **Destino/Aventura**: La experiencia específica

---

## Campos mínimos para publicar un destino

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| `countrySlug` | Slug del país (ej: 'espana') | ✅ |
| `citySlug` | Slug de la ciudad (ej: 'madrid') | ✅ |
| `slug` | Identificador único del destino | ✅ |
| `title` | Título del destino | ✅ |
| `summary` | Resumen breve (1-2 frases) | ✅ |
| `contentByMode.adventure` | Contenido modo aventura | ✅ |
| `contentByMode.student` | Contenido modo estudiante | ⏳ Recomendado |
| `type` | Tipo: museum, monument, nature, etc. | ✅ |
| `tags` | Array de etiquetas | ✅ |
| `estimatedVisitTime` | Duración estimada | ⏳ |
| `price` | Precio o información | ⏳ |
| `openingHours` | Horario de apertura | ⏳ |
| `sources` | Fuentes de información | ✅ |
| `status` | Estado editorial | ✅ |

---

## Criterios de calidad

- **Texto natural**: Evitar contenido genérico o de relleno
- **Fuentes verificables**: Preferir fuentes oficiales o académicas
- **Tono diferenciado**:
  - *Aventura*: Útil para viajeros, emocional, práctico
  - *Estudiante*: Instructivo, enciclopédico, datos históricos
- **No inventar datos**: Horarios/precios solo si están verificados
- **Marcar pendientes**: Usar comentarios para datos pendientes de verificación

---

## Estados editoriales

| Estado | Descripción | Visible |
|--------|-------------|---------|
| `draft` | En edición | ❌ No |
| `published` | Publicado | ✅ Sí |
| `comingSoon` | Aprobado, pendiente de publicar | ⚠️ Parcial |
| `disabled` | Oculto temporalmente | ❌ No |

---

## Uso de fuentes

```typescript
{
  title: "Título de la fuente",
  url: "https://ejemplo.com", // Preferiblemente oficial
  author: "Autor si aplica",
  year: 2024, // Año de publicación/consulta
  type: "official" | "academic" | "book" | "website"
}
```

**Tipos preferidos (por orden):**
1. Fuentes oficiales (museos, ayuntamientos)
2. Publicaciones académicas reconocidas
3. Libros especializados
4. Webs reconocidas (con fecha de consulta)

---

## Ejemplo: Ficha editorial (formato humano)

**Destino:** Museo del Prado, Madrid

**Investigación:**
- Fundado en 1819, uno de los museos más importantes del mundo
- Obras destacadas: Las Meninas (Velázquez), El Jardín de las Delicias (Bosch)
- Horario: 10:00-20:00 (L-S), 10:00-19:00 (D)
- Precio: 15€ general, gratis última hora de lunes a sábado

**Contenido modo Aventura:**
"Perderse entre los grandes maestros españoles. Reserva entrada online para evitar colas..."

**Contenido modo Estudiante:**
"El Museo del Prado alberga más de 8.000 obras, destacando la colección de Velázquez..."

---

## Ejemplo: Objeto Destination (TypeScript)

```typescript
// [EJEMPLO FICTICIO] Museo de Ejemplo - NO USAR EN PRODUCCIÓN
{
  id: 'museo-ejemplo-001',
  countrySlug: 'pais-ejemplo',
  citySlug: 'ciudad-ejemplo', 
  slug: 'museo-de-ejemplo',
  title: createLocalizedText('Museo de Ejemplo'),
  summary: createLocalizedText('[EJEMPLO] Resumen del museo...'),
  contentByMode: {
    adventure: createLocalizedText('[EJEMPLO] Contenido modo aventura...'),
    student: createLocalizedText('[EJEMPLO] Contenido modo estudiante...')
  },
  type: 'museum',
  tags: ['arte', 'historia', 'cultura'],
  estimatedVisitTime: '2-3 horas',
  price: createLocalizedText('Entrada gratuita'),
  openingHours: createLocalizedText('10:00 - 18:00'),
  sources: [
    {
      title: 'Web oficial del Museo de Ejemplo',
      url: 'https://ejemplo-museo.ficticio',
      type: 'official'
    }
  ],
  status: 'draft', // Iniciar siempre como draft
  featured: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

---

## Flujo recomendado

```
1. Investigación → Recopilar información de fuentes verificables
2. Revisión editorial → Verificar calidad y tono
3. Crear objeto Destination → Siguiendo tipos TypeScript
4. npm run build → Verificar que compila
5. Commit → Con mensaje descriptivo
```

---

## Datos pendientes de verificar

Cuando no se dispone de información concreta:

```typescript
// Opción A: Omitir el campo
// Opción B: Marcar como pendiente
price: createLocalizedText('[Pendiente de verificar]'),
```


---

## Compatibilidad con Investighost-GPT

**Investighost-GPT** es el investigador/redactor que genera contenido editorial para Trawel.

- Investighost-GPT genera la investigación estructurada
- Trawel exige formato específico para publicación
- El contrato oficial está en `docs/INVESTIGHOST_CONTRACT.md`
- Antes de convertir una investigación en datos, revisar siempre la sección `pendingVerification`
- El flujo es: Investigación → Revisión humana → Conversión a datos Trawel → Build → Publicación

---

## Recursos útiles

- `docs/DATA_MODEL.md` - Modelo de datos completo
- `docs/INVESTIGHOST_CONTRACT.md` - Contrato de compatibilidad con Investighost-GPT
- `src/features/destinations/types/destination.types.ts` - Tipos TypeScript
- `src/features/destinations/data/destinations.ts` - Ejemplos reales
- `docs/BITACORA.md` - Estado actual del proyecto

---

*Guía Editorial v1.0 - Trawel*
