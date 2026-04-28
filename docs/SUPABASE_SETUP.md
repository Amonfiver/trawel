/**
 * Guía de configuración de Supabase para Trawel
 * 
 * Propósito:
 * Explicar paso a paso cómo configurar un proyecto Supabase para Trawel,
 * desde la creación hasta la verificación de datos públicos.
 * 
 * Alcance:
 * - Creación de proyecto en Supabase
 * - Ejecución de schema y seed
 * - Verificación de tablas y RLS
 * - Obtención de credenciales para conexión futura
 * 
 * Decisiones técnicas:
 * - Uso de SQL Editor para ejecución manual (control total)
 * - Verificación paso a paso antes de conectar frontend
 * - Separación clara entre schema (estructura) y seed (datos)
 * 
 * Limitaciones / estado temporal:
 * - Esta guía es para setup manual inicial
 * - En el futuro se podría automatizar con CLI de Supabase
 * - La app todavía NO está conectada a Supabase (usa mock)
 * 
 * Cambios recientes (2026-04-28):
 * - Creada guía inicial de configuración
 * - Documentado flujo de verificación de RLS
 */

# Setup de Supabase para Trawel

Esta guía explica cómo configurar Supabase para Trawel paso a paso.

## 1. Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) e inicia sesión
2. Haz clic en "New Project"
3. Selecciona tu organización
4. Configura el proyecto:
   - **Name**: `trawel` (o el nombre que prefieras)
   - **Database Password**: Genera una segura y guárdala
   - **Region**: Selecciona la más cercana a tus usuarios (ej: West Europe)
5. Espera a que se complete la creación (2-3 minutos)

## 2. Abrir SQL Editor

1. En el dashboard de Supabase, ve a la sección **SQL Editor** (en el menú lateral)
2. Haz clic en **"New query"**
3. Se abrirá un editor SQL donde ejecutaremos las migraciones

## 3. Ejecutar el schema de tablas

1. Abre el archivo local: `supabase/migrations/001_create_trawel_schema.sql`
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** (botón verde arriba a la derecha)
5. Verifica que no hay errores en la consola

**Esto creará las siguientes tablas:**
- `countries` - Países con campos localizados
- `cities` - Ciudades con relación a países
- `destinations` - Destinos turísticos
- `destination_sources` - Fuentes de información

## 4. Ejecutar el seed de datos

1. Abre el archivo local: `supabase/seed.sql`
2. Copia todo el contenido del archivo
3. Crea una nueva query en SQL Editor (botón "New query")
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**

**Esto insertará:**
- 5 países (España, Japón, Perú activos; Francia, Italia comingSoon)
- 7 ciudades (Madrid, Barcelona, Castellón, Tokio, Kioto, Lima, Cusco)
- 5 destinos publicados (Museo del Prado, Senso-ji, Machu Picchu, Retiro, Fushimi Inari)
- Fuentes asociadas a los destinos

## 5. Verificar tablas creadas

Ve a **Table Editor** en el menú lateral y verifica que existen:

- [ ] `countries`
- [ ] `cities`
- [ ] `destinations`
- [ ] `destination_sources`

Haz clic en cada tabla y verifica que:
- Tiene registros (filas)
- Las columnas coinciden con el schema
- Los tipos de datos son correctos

## 6. Verificar RLS (Row Level Security)

Ve a **Authentication > Policies** en el menú lateral y verifica:

### Debe mostrar RLS activo en:
- [ ] `countries` - RLS enabled
- [ ] `cities` - RLS enabled
- [ ] `destinations` - RLS enabled
- [ ] `destination_sources` - RLS enabled

### Policies configuradas:

**countries:**
- Policy: "Allow public read access to active countries"
- Condición: `status = 'active'`

**cities:**
- Policy: "Allow public read access to active cities"
- Condición: `status = 'active'`

**destinations:**
- Policy: "Allow public read access to published destinations"
- Condición: `status = 'published'`

**destination_sources:**
- Policy: "Allow public read access to sources of published destinations"
- Condición: Verifica que el destino asociado tenga `status = 'published'`

## 7. Verificar datos públicos con RLS

Para probar que RLS funciona correctamente, ejecuta estas queries en SQL Editor:

### Ver países activos (debe mostrar España, Japón, Perú):
```sql
SELECT slug, name_es, status FROM countries WHERE status = 'active';
```

### Ver ciudades activas:
```sql
SELECT slug, name_es, status FROM cities WHERE status = 'active';
```

### Ver destinos publicados:
```sql
SELECT slug, title_es, status FROM destinations WHERE status = 'published';
```

### Verificar que no se ven destinos en draft:
```sql
-- Esta query debería retornar 0 resultados porque todos están published
SELECT * FROM destinations WHERE status = 'draft';
```

## 8. Obtener credenciales de conexión

Para conectar la app a Supabase necesitas dos valores:

### Project URL
1. Ve a **Project Settings** (icono de engranaje en la barra lateral)
2. Sección **API**
3. Copia el valor de **"Project URL"** (ej: `https://abcdefgh12345678.supabase.co`)

### Anon Public Key
1. En la misma sección **API**
2. Copia el valor de **"anon public"** (empieza con `eyJ...`)

### Guardar credenciales (IMPORTANTE)
Estas credenciales se usarán en el siguiente paso cuando conectemos la app. Guarda:
- `Project URL` → será `VITE_SUPABASE_URL`
- `Anon Public Key` → será `VITE_SUPABASE_ANON_KEY`

**Nota de seguridad:**
- La `anon key` es pública y segura para usar en frontend
- No compartas la `service_role key` (es solo para backend)
- No subas el archivo `.env` con credenciales reales a git

## 9. Preparar archivo de entorno local

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y rellena con tus credenciales:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_TRAVEL_DATA_SOURCE=mock
   ```

3. **IMPORTANTE**: Mantén `VITE_TRAVEL_DATA_SOURCE=mock` por ahora.
   Cambiará a `supabase` cuando implementemos la fuente real.

## 10. Verificación final

Antes de continuar, verifica:

- [ ] Tablas creadas y con datos
- [ ] RLS activo en las 4 tablas
- [ ] Policies configuradas correctamente
- [ ] Datos públicos visibles según reglas de negocio
- [ ] Credenciales guardadas de forma segura

## Próximo paso

Una vez completado este setup, el siguiente paso será:

**Crear `SupabaseTravelDataSource`** - Implementación de `TravelDataSource` que use el cliente de Supabase para leer datos desde la base de datos real.

Esto se hará en un ladrillo posterior, manteniendo la app funcionando con mock hasta entonces.

---

## Troubleshooting

### Error: "relation does not exist"
- Verifica que ejecutaste el schema antes que el seed
- Revisa que no hay errores de sintaxis en el SQL

### Error: "violates row level security policy"
- Esto es normal si intentas leer sin la anon key correcta
- Verifica que las policies están configuradas como se indica arriba

### No veo datos en el Table Editor
- Refresca la página después de ejecutar el seed
- Verifica que el seed se ejecutó sin errores

---

*Guía creada: 2026-04-28*
*Versión: 1.0*