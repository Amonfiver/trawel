# Contrato de Compatibilidad: Investighost-GPT ↔ Trawel

## Propósito

**Investighost-GPT** es el investigador/redactor que genera contenido editorial sobre destinos turísticos.

**Trawel** es la plataforma que organiza, revisa y publica ese contenido.

Este documento establece el contrato entre ambos sistemas: la salida de Investighost-GPT debe estar preparada para convertirse fácilmente en entidades Trawel (Country, City, Destination).

---

## Flujo Completo

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Investighost    │────→│  Revisión        │────→│  Conversión a    │
│  (investigación) │     │  humana          │     │  datos Trawel    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                          │
                                                          ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Publicación     │←────│  Build           │←────│  Commit con      │
│  (Trawel)        │     │  (npm run build) │     │  mensaje claro   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Formato Obligatorio de Respuesta

Investighost-GPT debe entregar su investigación en cinco secciones claramente separadas:

### 1. Investigación Editorial

Contexto enriquecido sobre el destino:

- **Contexto del lugar**: Ubicación, entorno geográfico, relevancia
- **Valor turístico**: ¿Por qué merece la pena visitarlo?
- **Cultura e historia**: Antecedentes relevantes (breve pero sustancial)
- **Experiencia para el viajero**: Qué esperar, sensaciones, atmósfera
- **Puntos fuertes**: 3-5 aspectos destacados
- **Advertencias o limitaciones**: Temporadas, restricciones, contraindicaciones

**Tono**: Natural, evitar folletos turísticos genéricos. Texto con personalidad.

---

### 2. Ficha Trawel Lista para Revisión

Resumen estructurado en lenguaje natural:

| Campo | Descripción |
|-------|-------------|
| **País** | Nombre del país (ej: España) |
| **Ciudad/Zona** | Ciudad o región específica (ej: Madrid) |
| **Destino/Aventura** | Nombre del lugar (ej: Museo del Prado) |
| **Tipo de destino** | museum, monument, nature, temple, park, landmark, cultural, hiddenGem |
| **Resumen corto** | 1-2 frases que capturen la esencia |
| **Contenido modo Aventura** | Tono emocional, práctico, explorador |
| **Contenido modo Estudiante** | Tono instructivo, cultural, histórico |
| **Duración estimada** | "2-3 horas", "medio día", "día completo" |
| **Precio** | Solo si está verificado; si no, "Pendiente de verificar" |
| **Horarios** | Solo si están verificados; si no, "Pendiente de verificar" |
| **Tags** | Array de etiquetas (ej: ["arte", "museo", "imprescindible"]) |
| **Estado recomendado** | draft (por defecto), published (solo si todo está verificado) |

---

### 3. Bloque Estructurado Compatible con Trawel

Código TypeScript/JSON que pueda copiarse directamente:

```typescript
{
  // Identificadores
  countrySlug: 'pais-ejemplo',      // ej: 'espana', 'japon'
  citySlug: 'ciudad-ejemplo',       // ej: 'madrid', 'tokio'
  slug: 'destino-ejemplo',          // ej: 'museo-del-prado'
  
  // Contenido multidioma (MVP: solo español)
  title: {
    es: 'Nombre del Destino'
  },
  summary: {
    es: 'Resumen de 1-2 frases sobre el destino.'
  },
  
  // Contenido por modo de experiencia
  contentByMode: {
    adventure: {
      es: 'Contenido con tono emocional, práctico, para viajeros...'
    },
    student: {
      es: 'Contenido con tono instructivo, cultural, histórico...'
    }
  },
  
  // Metadatos
  type: 'museum',                   // o: monument, nature, temple, park, landmark, cultural, hiddenGem
  tags: ['arte', 'cultura', 'imprescindible'],
  
  // Información práctica (solo si está verificada)
  estimatedVisitTime: '2-3 horas',
  price: {
    es: '15€ general, gratis última hora'  // o '[Pendiente de verificar]'
  },
  openingHours: {
    es: '10:00 - 20:00 (L-S), 10:00 - 19:00 (D)'  // o '[Pendiente de verificar]'
  },
  
  // Fuentes y trazabilidad
  sources: [
    {
      title: 'Web oficial del museo',
      url: 'https://ejemplo.com',
      type: 'official',             // official, academic, book, website
      consultedAt: '2026-04-28'
    }
  ],
  
  // Estado editorial
  status: 'draft',                  // draft, published, comingSoon, disabled
  
  // Campos pendientes (campo conceptual, no existe aún en TypeScript)
  pendingVerification: [
    'horarios de verano',
    'precio para estudiantes',
    'accesibilidad'
  ]
}
```

---

### 4. Fuentes Consultadas

Para cada fuente, indicar:

```typescript
{
  title: 'Título de la fuente',
  url: 'https://ejemplo.com',
  type: 'official',                 // official, academic, book, website
  consultedAt: '2026-04-28',
  supports: '¿Qué dato específico respalda esta fuente?'
}
```

**Tipos de fuente:**
1. **official**: Webs oficiales, gobiernos, museos, ayuntamientos
2. **academic**: Publicaciones académicas, papers, tesis
3. **book**: Libros, guías turísticas reconocidas
4. **website**: Blogs, noticias, foros (menor prioridad)

---

### 5. Pendiente de Verificar

Lista explícita de datos no confirmados:

- Horarios dudosos o cambiantes
- Precios que varían por temporada
- Accesibilidad para personas con movilidad reducida
- Opciones de transporte público
- Cierres temporales por obras
- Normas de visita (código de vestimenta, prohibiciones)
- Disponibilidad de tickets
- Datos históricos controvertidos o no verificados

---

## Reglas Anti-Invención

**Investighost-GPT NUNCA debe inventar:**

| Prohibido | Ejemplo de error | Solución |
|-----------|------------------|----------|
| Precios exactos | "Entrada: 12,50€" | "Aproximadamente 12-15€ [Pendiente de verificar]" |
| Horarios precisos | "Abre a las 9:15" | "Suele abrir sobre las 9:00 [Pendiente de verificar]" |
| Restricciones | "Prohibido entrar con mochilas" | "Algunos museos restringen mochilas grandes [Verificar en web oficial]" |
| Normas oficiales | "Obligatorio reservar con 48h" | "Reserva recomendada [Verificar disponibilidad actual]" |
| Afirmaciones históricas | "Fundado exactamente en 1247" | "Fundado en el siglo XIII [fuentes discrepan sobre año exacto]" |
| Disponibilidad | "Abierto todos los días" | "Abierto de martes a domingo [Verificar festivos]" |

**Si no se puede verificar, se incluye en `pendingVerification`.**

---

## Estados Editoriales

| Estado | Cuándo usar | Visible en Trawel |
|--------|-------------|-------------------|
| `draft` | Contenido creado, pendiente de revisión | ❌ No |
| `published` | Revisado y verificado completamente | ✅ Sí |
| `comingSoon` | Existe como intención, pero falta contenido detallado | ⚠️ Parcial |
| `disabled` | No mostrar temporalmente | ❌ No |

**Regla de oro**: Por defecto, todo contenido nuevo debe estar en estado `draft`.

---

## Modos Aventura / Estudiante

### Modo Aventura (`adventure`)

- **Tono**: Emocional, explorador, práctico, sugerente
- **Enfoque**: Sensaciones, experiencias, consejos prácticos
- **Ejemplo**: *"Perderse entre las obras maestras del Prado es una experiencia casi mística. Reserva online para evitar colas..."*

### Modo Estudiante (`student`)

- **Tono**: Instructivo, cultural, histórico, enciclopédico
- **Enfoque**: Contexto histórico, datos, análisis cultural
- **Ejemplo**: *"El Museo del Prado alberga más de 8.000 obras, destacando la colección de Velázquez, con 50 pinturas..."*

**Compatibilidad**: Ambos modos deben convivir. Pueden compartir hechos, pero el tono y el enfoque deben diferenciarse claramente.

---

## Multidioma

Durante el MVP de Trawel:

- **Idioma principal**: Español (`es`)
- **Otros idiomas**: Pendientes para fase futura (`en`, `fr`, `it`, `uk`)

Investighost-GPT debe entregar contenido en español, usando la estructura `LocalizedText`:

```typescript
title: {
  es: 'Museo del Prado'
  // en: 'Prado Museum',  // Añadir en fase de internacionalización
}
```

---

## Ejemplo Completo (Ficticio)

### Investigación Editorial

**Palacio de las Maravillas** es uno de los edificios más singulares de [Ciudad Ejemplo]. Construido en el siglo XIX como residencia nobiliaria, hoy alberga una colección ecléctica de arte oriental y occidental. Su fachada neogótica contrasta con los jardines japoneses que la rodean.

El valor turístico radica en su rareza: no es un museo convencional, sino una experiencia sensorial. Las salas temáticas transportan al visitante desde un salón victoriano hasta un templo chino en pocos pasos.

**Puntos fuertes:**
- Arquitectura única
- Jardines meditativos
- Colección de porcelanas orientales
- Atmósfera de época conservada

**Advertencias:** El edificio no tiene ascensor. Las visitas guiadas son limitadas y deben reservarse con antelación.

---

### Ficha Trawel Lista para Revisión

| Campo | Valor |
|-------|-------|
| País | País Ejemplo |
| Ciudad | Ciudad Ejemplo |
| Destino | Palacio de las Maravillas |
| Tipo | museum |
| Resumen | Palacio del siglo XIX con colección ecléctica de arte oriental y occidental, famoso por sus jardines japoneses. |
| Modo Aventura | Explora este palacio que parece sacado de un cuento. Sus jardines japoneses son perfectos para meditar... |
| Modo Estudiante | Construido en 1870 como residencia de la familia Ejemplo, el palacio combina arquitectura neogótica europea... |
| Duración | 2-3 horas |
| Precio | [Pendiente de verificar] |
| Horarios | [Pendiente de verificar] |
| Tags | ["arquitectura", "arte", "jardines", "historia"] |
| Estado | draft |

---

### Bloque Estructurado Compatible

```typescript
{
  countrySlug: 'pais-ejemplo',
  citySlug: 'ciudad-ejemplo',
  slug: 'palacio-de-las-maravillas',
  
  title: {
    es: 'Palacio de las Maravillas'
  },
  summary: {
    es: 'Palacio del siglo XIX con colección ecléctica de arte oriental y occidental, famoso por sus jardines japoneses.'
  },
  
  contentByMode: {
    adventure: {
      es: 'Explora este palacio que parece sacado de un cuento. Sus jardines japoneses son perfectos para meditar después de recorrer las salas llenas de tesoros orientales. No te pierdas la Sala de Porcelanas, donde cada pieza cuenta una historia de viajes y comercio. Sin ascensor, así que ven con calzado cómodo.'
    },
    student: {
      es: 'Construido en 1870 como residencia de la familia Ejemplo, el palacio combina arquitectura neogótica europea con influencias del Japonismo de la época. La colección incluye 200 piezas de porcelana china y japonesa, así como pinturas de la escuela local del siglo XIX. Los jardines fueron diseñados por un paisajista japonés en 1910.'
    }
  },
  
  type: 'museum',
  tags: ['arquitectura', 'arte', 'jardines', 'historia'],
  
  estimatedVisitTime: '2-3 horas',
  price: {
    es: '[Pendiente de verificar]'
  },
  openingHours: {
    es: '[Pendiente de verificar]'
  },
  
  sources: [
    {
      title: 'Palacio de las Maravillas - Web oficial',
      url: 'https://palacioejemplo.ficticio',
      type: 'official',
      consultedAt: '2026-04-28',
      supports: 'Historia del edificio y descripción de colecciones'
    }
  ],
  
  status: 'draft',
  
  pendingVerification: [
    'Precios actualizados',
    'Horarios exactos y días de cierre',
    'Disponibilidad de visitas guiadas',
    'Accesibilidad para sillas de ruedas',
    'Política de fotografía interior'
  ]
}
```

---

### Fuentes Consultadas

1. **Palacio de las Maravillas - Web oficial** (official)
   - URL: https://palacioejemplo.ficticio
   - Respaldó: Historia del edificio, descripción de colecciones

2. **Guía de Arquitectura de Ciudad Ejemplo** (book)
   - Autor: Juan Ejemplo
   - Año: 2019
   - Respaldó: Fecha de construcción, estilo arquitectónico

---

### Pendiente de Verificar

- Precios actualizados (web no especifica tarifas 2026)
- Horarios exactos y festivos
- Disponibilidad de visitas guiadas en español
- Accesibilidad completa (solo sabemos que no hay ascensor)
- Permiso de fotografía (algunos museos restringen)

---

## Checklist de Aceptación

Una salida de Investighost-GPT es válida para Trawel si cumple:

- [ ] Tiene `summary` en español
- [ ] Tiene `contentByMode.adventure.es`
- [ ] Tiene `contentByMode.student.es` o indica explícitamente que falta
- [ ] Tiene al menos una fuente en `sources` o indica fuentes pendientes
- [ ] Separa claramente hechos verificados de sugerencias/opiniones
- [ ] No inventa precios ni horarios sin verificar
- [ ] Incluye slugs propuestos (kebab-case, español)
- [ ] Incluye `status` (preferiblemente `draft`)
- [ ] Lista explícita de `pendingVerification`

---

## Referencias

- `docs/CONTENT_GUIDE.md` - Guía editorial completa de Trawel
- `docs/DATA_MODEL.md` - Modelo de datos de Trawel
- `src/features/destinations/types/destination.types.ts` - Tipos TypeScript

---

*Contrato v1.0 - Investighost-GPT ↔ Trawel*