# Protocolo de Alta de Ciudades Editoriales - Trawel

> **Versión:** 1.0  
> **Fecha:** 2026-04-29  
> **Propósito:** Guía para añadir nuevas ciudades y destinos a Trawel de forma ordenada, verificable y compatible con Investighost.

---

## Flujo Resumido

```
Selección → Investigación → Creación → Validación → Publicación → Verificación → Sincronización Mock (opcional)
```

---

## 1. Selección de País y Ciudad

### Criterios de selección

| Aspecto | Requisito | Ejemplo válido |
|---------|-----------|----------------|
| **Relevancia** | Destino con interés turístico real | Morella, Toledo, Cuenca |
| **Diferenciación** | Aporta algo único al circuito del país | Ciudad amurallada, patrimonio UNESCO |
| **Cobertura** | Cubre un territorio no representado | Interior de Castellón vs solo costa |
| **Viabilidad** | Tiene información verificable disponible | Sitios web oficiales, guías reconocidas |

### Qué evitar

- ❌ Ciudades sin identidad turística clara
- ❌ Destinos demasiado similares a los existentes (sin aportar valor)
- ❌ Lugares donde no se pueden verificar datos básicos (precios, horarios)
- ❌ Contenido genérico copiado de Wikipedia sin revisión

---

## 2. Investigación Editorial

### Fuentes recomendadas (por orden de preferencia)

1. **Oficiales**: Ayuntamientos, patronatos de turismo, museos oficiales
2. **Editoriales reconocidas**: Lonely Planet, National Geographic, Guía Michelin
3. **Medios especializados**: blogs de viajes con autor verificable
4. **Académicas**: universidades, centros de investigación histórica

### Información mínima a recopilar

Para **la ciudad**:
- Ubicación geográfica exacta (coordenadas)
- Población aproximada
- Historia breve (2-3 párrafos)
- Qué la hace especial/diferente
- Mejor época para visitar
- Cómo llegar (conexiones principales)

Para **cada destino/aventura**:
- Tipo de experiencia (monumento, museo, naturaleza, gastronomía)
- Tiempo estimado de visita
- Precios actualizados (o rango aproximado)
- Horarios de apertura
- Accesibilidad (fácil, requiere coche, senderismo...)
- Al menos 2-3 fuentes verificables

---

## 3. Preparación de Ficha de Ciudad

### Estructura de datos (City)

```typescript
{
  id: 'slug-de-la-ciudad',           // único, estable
  slug: 'slug-de-la-ciudad',         // para URLs
  countrySlug: 'slug-del-pais',      // relación
  name: { es: 'Nombre en español' },
  shortDescription: { es: '1-2 frases impactantes' },
  contentByMode: {
    adventure: { es: 'Texto emocional, narrativo, cómo vivir la experiencia' },
    student: { es: 'Texto educativo, datos históricos, contexto cultural' }
  },
  status: 'active',
  featured: true|false,              // destacada en su país
  destinationCount: N,               // número de destinos publicados
  coordinates: { lat: XX.XXXX, lng: YY.YYYY }
}
```

### Criterios de calidad para contenido

#### shortDescription
- ✅ Máximo 140 caracteres (ideal para tarjetas)
- ✅ Transmite el valor único de la ciudad
- ✅ Evita "ciudad bonita", "lugar mágico" sin especificar por qué

**Ejemplo bueno:**  
*"Ciudad amurallada medieval en lo alto de la meseta, con vistas espectaculares del Maestrazgo"*

**Ejemplo malo:**  
*"Morella es una ciudad muy bonita con mucha historia que visitar"*

#### contentByMode.adventure
- ✅ Segunda persona ("Descubre...", "Explora...", "Sube...")
- ✅ Sensaciones, experiencias concretas, consejos prácticos
- ✅ Horarios específicos ("por la mañana temprano", "al atardecer")
- ✅ Rutas sugeridas, duraciones, qué llevar

**Longitud recomendada:** 2-4 párrafos (150-300 palabras)

#### contentByMode.student
- ✅ Tercera persona informativa ("Morella es...", "El castillo fue...")
- ✅ Datos históricos verificables con fechas
- ✅ Contexto cultural, geográfico, político
- ✅ Referencias a patrimonio UNESCO, reconocimientos oficiales

**Longitud recomendada:** 2-4 párrafos (150-300 palabras)

#### Diferenciación clara

Los dos modos deben sentirse distintos. Test rápido:
- Si intercambias los textos, ¿notas que algo no encaja?
- ¿El modo adventure suena a guía de viaje y el student a enciclopedia?

---

## 4. Preparación de Destino Inicial

### Estructura mínima (Destination)

Cada ciudad debe tener **al menos un destino** publicado para no mostrar estado vacío.

```typescript
{
  id: 'slug-unico-del-destino',
  slug: 'slug-para-url',
  countrySlug: 'slug-pais',
  citySlug: 'slug-ciudad',
  title: { es: 'Nombre del destino' },
  summary: { es: '1 frase que venda la experiencia' },
  contentByMode: {
    adventure: { es: 'Cómo vivir esta experiencia' },
    student: { es: 'Qué es este lugar y por qué importa' }
  },
  status: 'published',
  featured: true|false,
  type: 'monument'|'museum'|'nature'|'experience'|'food'|'hiddenGem',
  tags: ['etiqueta1', 'etiqueta2', 'imprescindible'],
  estimatedVisitTime: 'X horas',
  price: { es: 'Precio o rango' },
  openingHours: { es: 'Horarios específicos' },
  sources: [
    { type: 'website', title: 'Nombre', url: 'https://...', author?: '...', year?: 2024 }
  ]
}
```

### Criterios de calidad para destinos

#### summary
- ✅ Enganche inmediato (el "elevator pitch")
- ✅ Máximo 120 caracteres
- ✅ Diferenciable de otros destinos similares

#### contentByMode.adventure
- ✅ Narrativa inmersiva ("Camina por...", "Contempla...", "Saborea...")
- ✅ Tips prácticos (mejor hora, dónde comer cerca, qué evitar)
- ✅ Emociones esperadas

#### contentByMode.student
- ✅ Datos verificables (año de construcción, arquitecto, eventos históricos)
- ✅ Contexto cultural amplio
- ✅ Conexiones con otros hechos históricos

#### sources
- ✅ Mínimo 1 fuente por destino
- ✅ Preferiblemente con URL verificable
- ✅ Tipos válidos: 'book' | 'article' | 'website' | 'expert'

---

## 5. Validación de Fuentes

### Checklist de verificación

- [ ] ¿Las URLs funcionan? (hacer clic y confirmar)
- [ ] ¿Los horarios coinciden en múltiples fuentes?
- [ ] ¿Los precios son de la temporada actual?
- [ ] ¿Las coordenadas están en el formato correcto? (lat, lng con decimales)
- [ ] ¿Los slugs son únicos y no conflictivos?
- [ ] ¿No hay errores tipográficos obvios?

### Red flags (revisar manualmente)

- ⚠️ Precios que parecen desactualizados (muy baratos o caros)
- ⚠️ Horarios que no tienen sentido ("abierto 24h" en monumento)
- ⚠️ Fuentes sin autor ni fecha identificables
- ⚠️ Contradicciones entre fuentes (resolver antes de publicar)

---

## 6. Alta en Supabase

### Orden recomendado

1. **Country** (si no existe) → debe estar activo antes de añadir ciudades
2. **City** → usar SQL idempotente con `ON CONFLICT DO UPDATE`
3. **Destination** → vinculado a city_id y country_id
4. **Destination_sources** → una vez el destino existe

### SQL de ejemplo (patrón)

```sql
-- Insertar/actualizar ciudad
INSERT INTO cities (country_id, slug, name_es, short_description_es, ...)
SELECT 
  c.id,
  'morella',
  'Morella',
  'Ciudad amurallada medieval...',
  ...
FROM countries c WHERE c.slug = 'espana'
ON CONFLICT (country_id, slug) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  short_description_es = EXCLUDED.short_description_es,
  ...;
```

### Verificación post-alta

```sql
-- Verificar ciudad
SELECT * FROM cities WHERE slug = 'morella';

-- Verificar destinos de la ciudad
SELECT d.* FROM destinations d
JOIN cities c ON d.city_id = c.id
WHERE c.slug = 'morella' AND d.status = 'published';
```

---

## 7. Verificación en Frontend

### Secuencia de pruebas

1. **HomePage** (`/`)
   - [ ] El país aparece en el mapa
   - [ ] La estadística de países es correcta

2. **CountryPage** (`/pais/espana`)
   - [ ] La ciudad aparece en el grid
   - [ ] Se muestra el badge "Destacada" si aplica
   - [ ] El conteo de destinos es correcto
   - [ ] El enlace funciona

3. **CityPage** (`/pais/espana/morella`)
   - [ ] Hero con nombre y descripción
   - [ ] Contenido cambia al alternar modo Aventura/Estudiante
   - [ ] Grid de destinos visible
   - [ ] Enlace de vuelta al país funciona

4. **AdventurePage** (`/aventura/castillo-de-morella`)
   - [ ] Título, tipo y badges correctos
   - [ ] Sidebar con info práctica
   - [ ] Contenido dual funciona
   - [ ] Fuentes visibles y clicables
   - [ ] Navegación de vuelta a ciudad funciona

### Modos de experiencia

Probar ambos modos y verificar:
- [ ] El contenido cambia significativamente
- [ ] No hay "agujeros" (texto vacío o placeholders)
- [ ] El fallback funciona (si falta un modo, muestra el otro)

---

## 8. Sincronización con Mock (opcional)

### Cuándo sincronizar

| Escenario | ¿Sincronizar? | Prioridad |
|-----------|---------------|-----------|
| Demo inmediata con mock | ✅ Sí | Alta |
| Desarrollo activo de UI | ✅ Sí | Alta |
| Solo producción con Supabase | ❌ No | Baja |
| Ciudad experimental/provisional | ❌ No | Baja |

### Cómo sincronizar

1. Añadir ciudad a `src/features/cities/data/cities.ts`
2. Añadir destinos a `src/features/destinations/data/destinations.ts`
3. Verificar `npm run build`
4. Probar con `VITE_TRAVEL_DATA_SOURCE=mock`

### Limitaciones del mock

- Solo español (no multidioma real)
- Sin sistema de borradores (todo es published)
- Sin metadatos editoriales avanzados (pending_verification, etc.)
- Datos estáticos (requieren rebuild para cambiar)

---

## 9. Relación con Investighost (futuro)

### Roles definidos

| Rol | Investighost | Trawel |
|-----|--------------|--------|
| **Investiga** | ✅ Busca fuentes, estructura datos | ❌ No |
| **Revisa** | ✅ Verifica hechos, detecta errores | ❌ No |
| **Aprueba** | ❌ No | ✅ Solo contenido validado |
| **Publica** | ❌ No | ✅ Control final de Trawel |
| **Muestra** | ❌ No | ✅ Frontend de lectura |

### Flujo futuro Investighost → Trawel

```
Investighost (Investigación)
    ↓
[Borrador con fuentes + notas de verificación]
    ↓
Revisión humana (editor)
    ↓
[Contenido aprobado + checklist de calidad]
    ↓
Trawel (Publicación)
    ↓
[En Supabase con status 'published']
    ↓
[Opcional: Sync a mock para desarrollo]
```

### Principios para preparar ese futuro

- ✅ Cada ficha debe tener `sources` completos
- ✅ Usar `pending_verification` para marcar datos dudosos
- ✅ Documentar decisiones editoriales en notas internas
- ✅ Separar claramente investigación de contenido publicado

---

## Checklist Rápida: Nueva Ciudad

### Antes de empezar
- [ ] La ciudad tiene interés turístico verificable
- [ ] Hay al menos 2-3 fuentes fiables disponibles
- [ ] El país ya existe en Trawel (o se creará primero)

### Investigación
- [ ] Recopiladas coordenadas exactas
- [ ] Identificado el "hook" único de la ciudad
- [ ] Seleccionado al menos 1 destino inicial prioritario

### Creación de contenido
- [ ] Ciudad: shortDescription clara (<140 chars)
- [ ] Ciudad: contentByMode.adventure diferenciado
- [ ] Ciudad: contentByMode.student diferenciado
- [ ] Destino: summary impactante (<120 chars)
- [ ] Destino: contentByMode.adventure con tips prácticos
- [ ] Destino: contentByMode.student con datos verificables
- [ ] Destino: al menos 1 fuente con URL

### Validación
- [ ] URLs de fuentes verificadas (hacer clic)
- [ ] Precios y horarios cruzados con 2+ fuentes
- [ ] Sin errores tipográficos obvios
- [ ] Slugs únicos y consistentes

### Publicación
- [ ] SQL ejecutado en Supabase sin errores
- [ ] Verificación en CountryPage exitosa
- [ ] Verificación en CityPage exitosa
- [ ] Verificación en AdventurePage exitosa
- [ ] Modo Aventura/Estudiante funcionando
- [ ] Navegación de vuelta operativa

### Post-publicación
- [ ] (Opcional) Sincronizado a mock
- [ ] Documentado en BITACORA.md
- [ ] URLs de demo compartidas para revisión

---

## Ejemplo Completado: Morella

| Paso | Estado | Notas |
|------|--------|-------|
| Selección | ✅ | Ciudad amurallada única en España |
| Investigación | ✅ | Ayuntamiento, Turismo CV, UNESCO |
| Ficha ciudad | ✅ | Contenido dual claro |
| Destino inicial | ✅ | Castillo de Morella |
| Validación | ✅ | URLs verificadas |
| Supabase | ✅ | 6 destinos publicados |
| Verificación frontend | ✅ | Circuito completo funciona |
| Mock sync | ✅ | Añadido 2026-04-29 |

---

## Referencias

- `docs/EDITORIAL_AUDIT.md` - Auditoría de datos existentes
- `docs/INVESTIGHOST_CONTRACT.md` - Contrato con herramienta futura
- `docs/DATA_MODEL.md` - Schema de base de datos
- `docs/DECISIONES.md` - Decisiones técnicas del proyecto

---

*Protocolo v1.0 - Trawel Editorial*