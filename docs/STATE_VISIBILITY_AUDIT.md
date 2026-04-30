# Auditoría de Visibilidad de Estados Editoriales (DA-028)

**Fecha:** 2026-04-30  
**Decisión de referencia:** DA-028 - comingSoon como demanda pública, no como fase editorial  
**Estado en Supabase:**
- Morella: `active` / Castillo de Morella: `published`
- Albarracín: `disabled` / Conjunto Histórico de Albarracín: `draft`

---

## Resumen Ejecutivo

La implementación actual de **SupabaseTravelDataSource** NO filtra correctamente los estados editoriales. Carga **todos** los registros de Supabase sin discriminar por `status`, lo que permite que contenido interno (`disabled`, `draft`) sea accesible si se conoce la URL directa.

**Riesgo principal:** Un usuario podría acceder a Albarracín (`disabled`) o su destino (`draft`) mediante URL directa, violando el principio de DA-028 de que el contenido en desarrollo debe permanecer **oculto/interno**.

---

## 1. ¿La fuente Supabase filtra cities por status?

**Respuesta: NO ❌**

**Ubicación:** `src/features/travelData/sources/supabaseTravelData.source.ts` (líneas 249-271)

```typescript
// Cargar cities - SIN FILTRO DE STATUS
const { data: dbCities, error: citiesError } = await supabase
  .from('cities')
  .select('*');  // ← Carga TODAS las ciudades

// Indexar cities - Sin verificación de status
for (const dbCity of (dbCities as DBCity[] || [])) {
  const countrySlug = cache.countriesById.get(dbCity.country_id);
  if (!countrySlug) continue;
  
  const city = mapDBCityToCity(dbCity, countrySlug);
  // ... se indexa sin importar el status
}
```

**Comportamiento actual:**
- Carga ciudades con `status = 'disabled'` (ej: Albarracín)
- Carga ciudades con `status = 'comingSoon'`
- Carga ciudades con `status = 'active'`

**Comportamiento esperado (DA-028):**
- Solo cargar `status = 'active'` para vista pública
- `status = 'disabled'` → No cargar (contenido interno)
- `status = 'comingSoon'` → Definir según estrategia de demanda pública

---

## 2. ¿La fuente Supabase filtra destinations por status?

**Respuesta: NO ❌**

**Ubicación:** `src/features/travelData/sources/supabaseTravelData.source.ts` (líneas 273-303)

```typescript
// Cargar destinations - SIN FILTRO DE STATUS
const { data: dbDestinations, error: destinationsError } = await supabase
  .from('destinations')
  .select('*');  // ← Carga TODOS los destinos

// Indexar destinations - Sin verificación de status
for (const dbDest of (dbDestinations as DBDestination[] || [])) {
  // ... se indexa sin importar el status
  const destination = mapDBDestinationToDestination(dbDest, countrySlug, citySlug);
  cache.destinations.set(destination.slug, destination);
}
```

**Comportamiento actual:**
- Carga destinos con `status = 'draft'` (ej: Conjunto Histórico de Albarracín)
- Carga destinos con `status = 'disabled'`
- Carga destinos con `status = 'comingSoon'`
- Carga destinos con `status = 'published'`

**Comportamiento esperado (DA-028):**
- Solo cargar `status = 'published'` para vista pública
- `status = 'draft'` / `disabled` → No cargar (contenido interno)

---

## 3. ¿CountryPage oculta cities.status = disabled?

**Respuesta: PARCIALMENTE ✅ (pero filtra en UI, no en fuente)**

**Ubicación:** `src/pages/CountryPage/CountryPage.tsx` (líneas 192-198)

```typescript
const cities = travelDataSource.getCitiesByCountrySlug(countrySlug);
const activeCities = cities.filter((city: City): city is City => 
  city.status === 'active' as CityStatus
);
const comingSoonCities = cities.filter((city: City): city is City => 
  city.status === 'comingSoon' as CityStatus
);
```

**Análisis:**
- CountryPage **sí filtra** en el componente: solo muestra `activeCities` en el grid principal
- `comingSoonCities` se muestra en sección separada "Próximamente"
- **PERO:** La ciudad `disabled` (Albarracín) **no aparece** ni en activas ni en comingSoon
- `totalCitiesCount` incluye **todas** las ciudades (línea 221: `totalCitiesCount: cities.length`)

**Problema:** Aunque no se muestra visualmente, la ciudad `disabled` está en el cache y podría ser accesible.

---

## 4. ¿CountryPage muestra o separa cities.status = comingSoon?

**Respuesta: SÍ, SEPARA ✅**

**Ubicación:** `src/pages/CountryPage/CountryPage.tsx` (líneas 227-246)

```typescript
{comingSoonCities.length > 0 && (
  <div className={styles.comingSoonSection}>
    <div className={styles.comingSoonHeader}>
      <h3 className={styles.comingSoonTitle}>Próximamente</h3>
      <p className={styles.comingSoonSubtitle}>Ciudades en preparación</p>
    </div>
    <div className={styles.comingSoonGrid} role="list">
      {comingSoonCities.map(city => (
        <div key={city.id} className={styles.comingSoonCard} role="listitem">
          <span className={styles.comingSoonName}>{cityName}</span>
          <span className={styles.comingSoonBadge}>Muy pronto</span>
        </div>
      ))}
    </div>
  </div>
)}
```

**Nota sobre DA-028:** Según la decisión, `comingSoon` ahora es **demanda pública** (lugares que usuarios buscan pero Trawel no tiene). La implementación actual lo trata como "en preparación", lo cual es inconsistente con la nueva definición.

---

## 5. ¿CityPage permite abrir una city disabled si se conoce la URL?

**Respuesta: SÍ ❌ (RIESGO)**

**Flujo:**
1. Usuario navega a `/pais/espana/albarracin` (URL directa)
2. `getCityPageData()` llama a `travelDataSource.getCityBySlug('espana', 'albarracin')`
3. `supabaseTravelDataSource` busca en cache: `cache.cities.get('espana:albarracin')`
4. **Encuentra Albarracín** porque fue cargada en el cache sin filtrar
5. CityPage renderiza la ciudad completa

**Ubicación:** `src/pages/CityPage/CityPage.tsx` (líneas 71-100)

```typescript
export function CityPage() {
  const { countrySlug, citySlug } = useParams();
  const { country, city, publishedDestinations: destinations } = getCityPageData(
    countrySlug || '',
    citySlug || ''
  );

  // Ciudad no encontrada
  if (!city) {
    return <NotFound />;  // Solo si no está en cache
  }
  // ... renderiza la ciudad completa
}
```

**Comportamiento:** CityPage **no verifica** `city.status` antes de renderizar. Si la ciudad está en el cache (y está porque SupabaseTravelDataSource carga todo), se muestra.

**Riesgo:** Albarracín (`disabled`) es visible si se accede por URL directa.

---

## 6. ¿AdventurePage permite abrir un destination draft si se conoce la URL?

**Respuesta: SÍ ❌ (RIESGO)**

**Flujo:**
1. Usuario navega a `/aventura/conjunto-historico-albarracin` (URL directa)
2. `getAdventurePageData()` llama a `travelDataSource.getDestinationBySlug('conjunto-historico-albarracin')`
3. `supabaseTravelDataSource` busca en cache: `cache.destinations.get('conjunto-historico-albarracin')`
4. **Encuentra el destino** porque fue cargado sin filtrar
5. AdventurePage renderiza el destino completo

**Ubicación:** `src/pages/AdventurePage/AdventurePage.tsx` (líneas 75-95)

```typescript
export function AdventurePage() {
  const { adventureSlug } = useParams();
  const { destination, city, country } = getAdventurePageData(adventureSlug || '');

  // Destino no encontrado
  if (!destination) {
    return <NotFound />;  // Solo si no está en cache
  }
  
  // Muestra warning pero renderiza igual
  const showStatusWarning = destination.status !== 'published';
  // ...
}
```

**Nota:** AdventurePage **sí muestra un aviso** si `status !== 'published'` (líneas 182-190), pero **el contenido es visible**.

---

## 7. ¿Mock y Supabase tienen comportamiento coherente?

**Respuesta: PARCIALMENTE ⚠️**

| Aspecto | Mock | Supabase | Coherente |
|---------|------|----------|-----------|
| Carga de datos | Hardcoded | SELECT * | ❌ Diferente origen |
| Filtro cities | No aplica (solo datos publicados) | Sin filtro | ❌ Mock solo tiene activas |
| Filtro destinations | No aplica (solo published) | Sin filtro | ❌ Mock solo tiene published |

**Mock data** (`src/features/cities/data/cities.ts`, `src/features/destinations/data/destinations.ts`):
- Solo contiene ciudades `active` y destinos `published`
- No hay datos `disabled` o `draft` en mock

**Supabase:**
- Contiene datos reales con estados mixtos
- Carga todo sin filtrar

**Consecuencia:** El comportamiento es **diferente** entre mock y Supabase. En mock nunca se verá contenido no publicado; en Supabase sí.

---

## 8. ¿Qué riesgo existe de mostrar contenido interno?

**Riesgo: ALTO 🔴**

### Escenarios de riesgo identificados:

1. **URL directa a ciudad disabled:**
   - Usuario: `https://trawel.app/pais/espana/albarracin`
   - Resultado: Ve Albarracín completa aunque esté `disabled`
   - Impacto: Contenido no revisado visible públicamente

2. **URL directa a destino draft:**
   - Usuario: `https://trawel.app/aventura/conjunto-historico-albarracin`
   - Resultado: Ve el destino con warning "Borrador"
   - Impacto: Contenido en desarrollo expuesto

3. **Búsqueda/Indexación:**
   - Si se implementa búsqueda, podría indexar contenido `disabled`/`draft`
   - Impacto: SEO con contenido no publicado

4. **Inconsistencia DA-028:**
   - `comingSoon` se muestra como "en preparación" en lugar de "demanda pública"
   - Impacto: Confusión conceptual

---

## Recomendaciones

### Corrección Inmediata (Bloque recomendado)

**Archivo:** `src/features/travelData/sources/supabaseTravelData.source.ts`

**Cambio 1: Filtrar cities en la query**
```typescript
// ANTES (línea 249-252)
const { data: dbCities, error: citiesError } = await supabase
  .from('cities')
  .select('*');

// DESPUÉS
const { data: dbCities, error: citiesError } = await supabase
  .from('cities')
  .select('*')
  .eq('status', 'active');  // Solo ciudades activas para vista pública
```

**Cambio 2: Filtrar destinations en la query**
```typescript
// ANTES (línea 273-276)
const { data: dbDestinations, error: destinationsError } = await supabase
  .from('destinations')
  .select('*');

// DESPUÉS
const { data: dbDestinations, error: destinationsError } = await supabase
  .from('destinations')
  .select('*')
  .eq('status', 'published');  // Solo destinos publicados
```

### Alternativa: Doble Verificación

Si se necesita mantener todos los datos en cache para uso interno futuro, agregar verificación en las páginas:

**En CityPage.tsx:**
```typescript
// Agregar después de obtener la ciudad
if (city?.status === 'disabled') {
  return <NotFound />;  // O página de "no disponible"
}
```

**En AdventurePage.tsx:**
```typescript
// Agregar después de obtener el destino
if (destination?.status === 'draft' || destination?.status === 'disabled') {
  return <NotFound />;  // O redirección
}
```

### Nota sobre comingSoon

Según DA-028, `comingSoon` es **demanda pública** (usuarios quieren este lugar). La implementación actual muestra `comingSoon` como "Próximamente" separado. 

**Decisión pendiente:** ¿Se mantiene visible `comingSoon` como placeholder o se oculta hasta que haya contenido real?

---

## Checklist de Verificación Post-Corrección

- [ ] SupabaseTravelDataSource filtra cities por `status = 'active'`
- [ ] SupabaseTravelDataSource filtra destinations por `status = 'published'`
- [ ] Albarracín (`disabled`) no es accesible por URL directa
- [ ] Conjunto Histórico (`draft`) no es accesible por URL directa
- [ ] Morella (`active`) y Castillo (`published`) siguen funcionando
- [ ] Mock data sigue funcionando (sin cambios necesarios)
- [ ] No hay regresión en navegación normal

---

*Auditoría realizada conforme a DA-028 - comingSoon como demanda pública*