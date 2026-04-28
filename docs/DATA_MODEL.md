# Modelo de Datos - Trawel

## Propósito de este documento

Este documento describe el modelo de datos actual (TypeScript estático) y propone el modelo futuro para persistencia en base de datos (Supabase o equivalente).

Sirve como guía para:
- Entender la estructura de datos actual
- Planificar la migración a base de datos
- Implementar el schema SQL en el futuro
- Mantener consistencia entre modelo actual y futuro

---

## Modelo Actual (TypeScript Estático)

### Estructura general

```
┌─────────────────┐
│    Country      │
│  (País/Estado)  │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│      City       │
│    (Ciudad)     │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│  Destination    │
│ (Destino/Atracción) │
└─────────────────┘
```

### Entidades actuales

#### 1. Country (País)

**Archivo:** `src/features/countries/data/countries.types.ts`

```typescript
interface Country {
  id: string;              // ISO 3166-1 alpha-2 (ES, JP, PE)
  slug: string;            // Para URLs (espana, japon, peru)
  name: string;            // Identificador técnico
  displayName: string;     // Nombre para mostrar
  status: 'active' | 'comingSoon' | 'disabled';
  continent: Continent;
  capital: string;
  shortDescription: string;
  destinationCount: number;
  isoAlpha2: string;
  isoAlpha3: string;
  unM49: string;
  featured?: boolean;
}
```

**Características:**
- Datos estáticos en archivo TypeScript
- Slug estable para URLs
- Códigos ISO para integración con mapas (UN M.49)
- Estados controlan visibilidad en UI

#### 2. City (Ciudad)

**Archivo:** `src/features/cities/types/city.types.ts`

```typescript
interface City {
  id: string;
  countryId: string;       // Relación con Country
  slug: string;
  name: string;
  displayName: LocalizedText;  // Multidioma listo
  status: 'active' | 'comingSoon' | 'disabled';
  coordinates?: Coordinates;
  population?: number;
  shortDescription?: LocalizedText;
  contentByMode?: CityContentByMode;  // Adventure/Student
  destinationCount?: number;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

**Características:**
- Relación por `countryId` (string)
- Contenido diferenciado por modo (Aventura/Estudiante)
- Coordenadas para mapa futuro
- Timestamps opcionales preparados para DB

#### 3. Destination (Destino/Atracción)

**Archivo:** `src/features/destinations/types/destination.types.ts`

```typescript
interface Destination {
  id: string;
  slug: string;
  countrySlug: string;     // Relación por slug
  citySlug: string;        // Relación por slug
  title: LocalizedText;    // Multidioma
  summary?: LocalizedText;
  contentByMode?: DestinationContentByMode;  // Adventure/Student
  status: 'draft' | 'published' | 'comingSoon' | 'disabled';
  featured?: boolean;
  type?: DestinationType;  // museum, nature, etc.
  tags?: string[];
  estimatedVisitTime?: string;
  coordinates?: Coordinates;
  image?: string;
  gallery?: string[];
  sources?: Source[];      // Trazabilidad editorial
  price?: LocalizedText;
  openingHours?: LocalizedText;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}
```

**Características:**
- Relación por `countrySlug` + `citySlug` (no por ID)
- Contenido dual: `adventure` y `student` separados
- Fuentes para trazabilidad editorial
- Workflow editorial: draft → published
- Timestamps completos para control editorial

### Gestión de idiomas (actual)

**Archivo:** `src/app/i18n/i18n.types.ts`

```typescript
interface LocalizedText {
  es?: string;    // Español (por defecto)
  en?: string;    // Inglés
  fr?: string;    // Francés
  it?: string;    // Italiano
  uk?: string;    // Ucraniano
}
```

**Estrategia:**
- Objeto con campos opcionales por idioma
- Fallback: solicitado → español → inglés → disponible → vacío
- Solo español tiene contenido actualmente (MVP)

### Gestión de modos Aventura/Estudiante

**Archivo:** `src/features/experienceMode/types/experienceMode.types.ts`

```typescript
interface DestinationContentByMode {
  adventure?: LocalizedText;  // Tono emocional, narrativo
  student?: LocalizedText;    // Tono educativo, factual
}
```

**Estrategia:**
- Contenido separado por modo dentro de cada entidad
- Mismo idioma, tono diferente
- Ejemplo: "Museo del Prado" puede tener:
  - Adventure: "Un viaje sensorial por siglos de arte..."
  - Student: "Fundado en 1819, el Museo del Prado alberga..."

---

## Modelo Futuro (Base de Datos)

### Principios de diseño

1. **Normalización:** Separar entidades principales de traducciones
2. **Escalabilidad:** Soportar N idiomas sin modificar schema
3. **Trazabilidad:** Guardar fuentes y versionado editorial
4. **Flexibilidad:** Modos adventure/student como contenido separado
5. **Rendimiento:** Índices en slugs y relaciones frecuentes

### Schema propuesto

#### Tabla: `countries`

```sql
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,        -- 'espana', 'japon'
    iso_alpha2 CHAR(2) UNIQUE NOT NULL,      -- 'ES', 'JP'
    iso_alpha3 CHAR(3) UNIQUE NOT NULL,      -- 'ESP', 'JPN'
    un_m49 VARCHAR(3) UNIQUE,                -- '724', '392'
    
    -- Estado y clasificación
    status VARCHAR(20) NOT NULL DEFAULT 'comingSoon'
        CHECK (status IN ('active', 'comingSoon', 'disabled')),
    continent VARCHAR(20) NOT NULL
        CHECK (continent IN ('europe', 'asia', 'americas', 'africa', 'oceania')),
    
    -- Datos comunes (no traducibles)
    capital VARCHAR(100),
    coordinates JSONB,                       -- {lat: 40.4, lng: -3.7}
    featured BOOLEAN DEFAULT FALSE,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT idx_countries_slug UNIQUE (slug),
    CONSTRAINT idx_countries_iso UNIQUE (iso_alpha2)
);

-- Índices adicionales
CREATE INDEX idx_countries_status ON countries(status);
CREATE INDEX idx_countries_featured ON countries(featured) WHERE featured = true;
```

#### Tabla: `country_translations`

```sql
CREATE TABLE country_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,              -- 'es', 'en', 'fr'
    
    -- Campos traducibles
    name VARCHAR(100) NOT NULL,              -- 'spain' (técnico)
    display_name VARCHAR(100) NOT NULL,      -- 'España', 'Spain'
    description TEXT,                        -- Descripción larga
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un solo idioma por país
    CONSTRAINT idx_country_translation_unique UNIQUE (country_id, locale)
);

-- Índice para búsquedas
CREATE INDEX idx_country_translations_locale ON country_translations(locale);
```

#### Tabla: `cities`

```sql
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,              -- 'madrid', 'tokio'
    
    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'comingSoon'
        CHECK (status IN ('active', 'comingSoon', 'disabled')),
    featured BOOLEAN DEFAULT FALSE,
    
    -- Datos comunes
    coordinates JSONB,                       -- {lat: 40.4, lng: -3.7}
    population INTEGER,
    image_url TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Slug único por país
    CONSTRAINT idx_cities_slug_country UNIQUE (country_id, slug)
);

CREATE INDEX idx_cities_country ON cities(country_id);
CREATE INDEX idx_cities_status ON cities(status);
```

#### Tabla: `city_translations`

```sql
CREATE TABLE city_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,              -- 'es', 'en', 'fr'
    
    -- Campos traducibles
    name VARCHAR(100) NOT NULL,              -- 'madrid' (técnico)
    display_name VARCHAR(100) NOT NULL,      -- 'Madrid'
    short_description TEXT,                  -- Para listados
    
    -- Contenido por modo (Aventura/Estudiante)
    adventure_description TEXT,              -- Tono emocional
    student_description TEXT,                -- Tono educativo
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT idx_city_translation_unique UNIQUE (city_id, locale)
);

CREATE INDEX idx_city_translations_locale ON city_translations(locale);
```

#### Tabla: `destinations`

```sql
CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,  -- Opcional
    
    slug VARCHAR(100) NOT NULL,              -- 'museo-del-prado'
    
    -- Estado y tipo
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'comingSoon', 'disabled')),
    type VARCHAR(30)                         -- 'museum', 'monument', etc.
        CHECK (type IN ('monument', 'museum', 'nature', 'experience', 'food', 'hiddenGem')),
    featured BOOLEAN DEFAULT FALSE,
    
    -- Datos estructurados
    tags TEXT[],                             -- Array de strings
    estimated_visit_time VARCHAR(50),        -- '2 horas', 'medio día'
    coordinates JSONB,
    image_url TEXT,
    gallery_urls TEXT[],                     -- Array de URLs
    
    -- Información práctica (no traducible)
    price JSONB,                             -- {amount: 15, currency: 'EUR', note: 'estudiantes gratis'}
    opening_hours JSONB,                     -- {monday: '9:00-20:00', ...}
    
    -- Control editorial
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,                -- Cuándo se hizo público
    published_by UUID,                       -- Referencia a users (futuro)
    
    -- Slug único global
    CONSTRAINT idx_destinations_slug UNIQUE (slug)
);

CREATE INDEX idx_destinations_country ON destinations(country_id);
CREATE INDEX idx_destinations_city ON destinations(city_id);
CREATE INDEX idx_destinations_status ON destinations(status);
CREATE INDEX idx_destinations_type ON destinations(type);
CREATE INDEX idx_destinations_featured ON destinations(featured) WHERE featured = true;
CREATE INDEX idx_destinations_tags ON destinations USING GIN(tags);
```

#### Tabla: `destination_translations`

```sql
CREATE TABLE destination_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    locale VARCHAR(5) NOT NULL,              -- 'es', 'en', 'fr'
    
    -- Campos traducibles
    title VARCHAR(200) NOT NULL,             -- 'Museo del Prado'
    summary TEXT,                            -- Para tarjetas/listados
    
    -- Contenido por modo (Aventura/Estudiante)
    adventure_content TEXT,                  -- Contenido completo modo aventura
    student_content TEXT,                    -- Contenido completo modo estudiante
    
    -- SEO (futuro)
    meta_title VARCHAR(70),
    meta_description TEXT,
    
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT idx_destination_translation_unique UNIQUE (destination_id, locale)
);

CREATE INDEX idx_destination_translations_locale ON destination_translations(locale);
```

#### Tabla: `destination_sources`

```sql
CREATE TABLE destination_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    
    -- Información de la fuente
    title VARCHAR(300) NOT NULL,             -- 'Guía Lonely Planet 2024'
    url TEXT,                                -- Link si aplica
    source_type VARCHAR(20) NOT NULL         -- 'book', 'website', 'expert', 'own'
        CHECK (source_type IN ('book', 'article', 'website', 'expert', 'own')),
    
    -- Metadatos de la fuente
    author VARCHAR(200),                     -- Autor o entidad
    year INTEGER,                            -- Año de publicación
    notes TEXT,                              -- Notas internas
    
    -- Verificación
    checked_at TIMESTAMPTZ,                  -- Cuándo se verificó
    checked_by UUID,                         -- Quién verificó (futuro: users)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_destination_sources_destination ON destination_sources(destination_id);
CREATE INDEX idx_destination_sources_type ON destination_sources(source_type);
```

### Diagrama de relaciones (futuro)

```
┌─────────────────┐       ┌─────────────────────────┐
│    countries    │◄──────┤   country_translations  │
├─────────────────┤  1:N  ├─────────────────────────┤
│ id (PK)         │       │ country_id (FK)         │
│ slug            │       │ locale                  │
│ iso_alpha2      │       │ display_name            │
│ status          │       │ description             │
│ coordinates     │       └─────────────────────────┘
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────────────┐
│     cities      │◄──────┤    city_translations    │
├─────────────────┤  1:N  ├─────────────────────────┤
│ id (PK)         │       │ city_id (FK)            │
│ country_id (FK) │       │ locale                  │
│ slug            │       │ display_name            │
│ status          │       │ adventure_description   │
│ coordinates     │       │ student_description     │
└────────┬────────┘       └─────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────────────┐
│  destinations   │◄──────┤ destination_translations│
├─────────────────┤  1:N  ├─────────────────────────┤
│ id (PK)         │       │ destination_id (FK)     │
│ city_id (FK)    │       │ locale                  │
│ slug            │       │ title                   │
│ status          │       │ adventure_content       │
│ type            │       │ student_content         │
│ tags[]          │       └─────────────────────────┘
│ price           │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────┐
│   destination_sources   │
├─────────────────────────┤
│ id (PK)                 │
│ destination_id (FK)     │
│ title                   │
│ url                     │
│ source_type             │
│ author                  │
│ year                    │
└─────────────────────────┘
```

---

## Notas de diseño

### ¿Por qué separar traducciones en tablas propias?

**Problema:** Si añadimos campos `name_es`, `name_en`, `name_fr` directamente en la tabla, cada nuevo idioma requiere modificar el schema.

**Solución:** Tabla separada `*_translations` con relación 1:N.

**Beneficios:**
- Agregar idioma = insertar filas, no alterar tablas
- Consultas optimizadas: JOIN solo cuando se necesita
- Fallback simple: si no existe traducción, usar idioma por defecto
- Campos nulos permitidos: algunos idiomas pueden tener solo título, no descripción completa

### ¿Por qué mantener slug estable?

**Importancia:** Los slugs forman parte de las URLs (`/pais/espana/madrid`).

**Estrategia:**
- Slug nunca cambia una vez publicado
- Si debe cambiar, crear redirección 301 (futuro)
- Slug único por ámbito: `countries.slug` global, `cities.slug` por país

### ¿Por qué status va separado del contenido?

**Separación de responsabilidades:**
- `status`: Control de visibilidad (active, draft, published, disabled)
- Contenido: Textos e imágenes

**Workflow editorial:**
1. Crear destino con `status = 'draft'`
2. Escribir contenido en ambos modos (adventure/student)
3. Revisar y aprobar
4. Cambiar a `status = 'published'`, `published_at = NOW()`

### ¿Por qué las fuentes deben guardarse?

**Trazabilidad editorial:**
- Requisito para contenido profesional
- Permite verificar información
- Crédito a fuentes originales
- Útil para disputas legales o correcciones

**Campos importantes:**
- `source_type`: Distinguir fuentes primarias de secundarias
- `checked_at`: Cuándo se verificó la información
- `url`: Link directo si es web

### ¿Por qué modos adventure/student separados?

**Diferencia de enfoque:**
- Mismo destino, dos audiencias diferentes
- Adventure: Emocional, inspirador, storytelling
- Student: Educativo, factual, referencias históricas

**Implementación:**
- Columnas separadas en tabla de traducciones
- Permite tener uno sin el otro (MVP: solo uno)
- Fácil filtrar: `WHERE adventure_content IS NOT NULL`

---

## Mapeo TypeScript → Base de Datos

### Country

| TypeScript | SQL | Notas |
|------------|-----|-------|
| `id` | `iso_alpha2` | Clave primaria natural |
| `slug` | `slug` | UNIQUE |
| `displayName` | `country_translations.display_name` | Por idioma |
| `status` | `status` | ENUM |
| `capital` | `capital` | - |
| `isoAlpha2` | `iso_alpha2` | - |
| `isoAlpha3` | `iso_alpha3` | - |
| `unM49` | `un_m49` | - |

### City

| TypeScript | SQL | Notas |
|------------|-----|-------|
| `id` | `id` | UUID generado |
| `countryId` | `country_id` | FK a countries |
| `slug` | `slug` | UNIQUE por país |
| `displayName` | `city_translations.display_name` | Por idioma |
| `contentByMode.adventure` | `city_translations.adventure_description` | - |
| `contentByMode.student` | `city_translations.student_description` | - |
| `status` | `status` | ENUM |
| `coordinates` | `coordinates` | JSONB |

### Destination

| TypeScript | SQL | Notas |
|------------|-----|-------|
| `id` | `id` | UUID generado |
| `slug` | `slug` | UNIQUE global |
| `countrySlug` | `country_id` | FK (cambio de slug a ID) |
| `citySlug` | `city_id` | FK (cambio de slug a ID) |
| `title` | `destination_translations.title` | Por idioma |
| `contentByMode.adventure` | `destination_translations.adventure_content` | - |
| `contentByMode.student` | `destination_translations.student_content` | - |
| `status` | `status` | ENUM |
| `sources[]` | `destination_sources` | Tabla separada 1:N |
| `tags[]` | `tags` | Array PostgreSQL |

---

## Estrategia de migración

### Fase Actual (HOY)
- Datos en TypeScript estático
- `travelData.service` funciona sincrónicamente
- Solo español, contenido mínimo

### Fase 1: Definir Schema SQL
- Crear archivo `database/schema.sql`
- Definir todas las tablas propuestas arriba
- Políticas RLS (Row Level Security) para Supabase
- Índices y constraints

### Fase 2: Crear tablas en Supabase
- Crear proyecto Supabase
- Ejecutar schema.sql
- Configurar autenticación (futuro)

### Fase 3: Migrar datos mock
- Script de migración: TypeScript → SQL INSERT
- Exportar datos actuales a JSON
- Importar en Supabase
- Verificar integridad

### Fase 4: Adaptar travelData.service
```typescript
// ANTES (actual)
export function getCountryPageData(slug: string): CountryPageData {
  const country = getCountryBySlug(slug);
  // ...
}

// DESPUÉS (con Supabase)
export async function getCountryPageData(slug: string): Promise<CountryPageData> {
  const { data, error } = await supabase
    .from('countries')
    .select(`
      *,
      country_translations(*),
      cities(
        *,
        city_translations(*)
      )
    `)
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return transformToCountryPageData(data);
}
```

### Fase 5: Crear editor/admin
- Panel de administración (futuro)
- CRUD de destinos
- Editor de contenido dual (adventure/student)
- Gestión de traducciones
- Workflow de publicación

### Fase 6: Control editorial avanzado
- Sistema de revisiones
- Preview antes de publicar
- Programación de publicación
- Analytics de contenido

---

## Qué queda pendiente

### Pendiente técnico
- [ ] Schema SQL completo con RLS
- [ ] Scripts de migración de datos
- [ ] Adaptación de `travelData.service` a async
- [ ] Manejo de errores y loading states
- [ ] Caché con React Query/SWR
- [ ] Sistema de imágenes (Storage)

### Pendiente editorial
- [ ] Panel de administración
- [ ] Workflow de aprobación
- [ ] Sistema de notas internas
- [ ] Control de versiones de contenido
- [ ] Analytics y métricas

### Pendiente de internacionalización
- [ ] Traducciones reales (no solo español)
- [ ] Detección automática de idioma
- [ ] URLs con prefijo de idioma (`/es/pais/espana`)
- [ ] SEO multidioma (hreflang)

---

## Cómo usar este documento

### Para desarrolladores frontend
- Entender la estructura de `travelData.types.ts`
- Saber qué datos esperar de las funciones de servicio
- Preparar componentes para manejar estados de carga

### Para desarrolladores backend
- Implementar el schema SQL propuesto
- Crear APIs REST o GraphQL que sigan esta estructura
- Mantener consistencia con los nombres de campos

### Para editores de contenido
- Entender el workflow: draft → review → published
- Saber que cada destino necesita dos versiones (adventure/student)
- Entender la importancia de las fuentes y trazabilidad

---

## Referencias

- **Tipo Country:** `src/features/countries/data/countries.types.ts`
- **Tipo City:** `src/features/cities/types/city.types.ts`
- **Tipo Destination:** `src/features/destinations/types/destination.types.ts`
- **Tipo LocalizedText:** `src/app/i18n/i18n.types.ts`
- **Servicio de datos:** `src/features/travelData/services/travelData.service.ts`

---

*Modelo de datos v1.0 - Trawel*