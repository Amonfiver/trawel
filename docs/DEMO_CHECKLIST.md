# Guion de Demo - Trawel

> **Versión:** 1.0  
> **Fecha:** 2026-05-01  
> **Audiencia objetivo:** Socios/colaboradores (ej: Vasyl)  
> **Duración estimada:** 10-15 minutos

---

## 1. Objetivo de la demo

Esta demo demuestra que **Trawel ya tiene estructura real y funcional**, no solo una maqueta:

| Punto clave | Qué mostrar |
|-------------|-------------|
| Estructura real | Flujo completo: Mundo → País → Ciudad → Destino |
| Modo dual | Selector Aventura/Estudiante que cambia el contenido |
| Datos reales | Supabase alimenta contenido real (no solo mock) |
| Editorial profesional | Filtro de estados: contenido publicado vs. interno |

**Mensaje principal:** "Trawel ya funciona. Tiene contenido real, navegación fluida y arquitectura preparada para escalar."

---

## 2. Preparación previa

### Verificar entorno

```bash
# 1. Verificar .env
cat .env | grep VITE_TRAVEL_DATA_SOURCE
# Debe decir: VITE_TRAVEL_DATA_SOURCE=supabase

# 2. Iniciar servidor
npm run dev

# 3. Verificar que carga sin errores
# Debe mostrar: "Cargando Trawel..." → Home con mapa
```

### Rutas clave que deben funcionar

| Ruta | Qué debe mostrar |
|------|------------------|
| `/` | Home con mapa mundial, España clickeable |
| `/pais/espana` | CountryPage con Morella visible |
| `/pais/espana/morella` | CityPage con 6 destinos |
| `/aventura/castillo-de-morella` | AdventurePage del castillo |
| `/pais/espana/albarracin` | Mensaje "Esta ciudad todavía no está en Trawel" |

---

## 3. Guion de demo paso a paso

### Paso 1: Home (2 minutos)

**Abrir:** `http://localhost:5173/`

**Qué decir:**
> "Este es Trawel. Es una plataforma de exploración de destinos de viaje. Ves el mapa mundial: los países azules son los que ya tenemos activos."

**Acciones:**
1. Mover el ratón sobre España → tooltip "España"
2. Clic en España → navega a `/pais/espana`

**Destacar:**
- Mapa interactivo con D3 + TopoJSON
- Países clickeables llevan a su ficha

---

### Paso 2: País - España (2 minutos)

**URL:** `/pais/espana`

**Qué decir:**
> "Aquí vemos la ficha de España. Destaca el hero con la bandera, estadísticas rápidas, y las ciudades disponibles."

**Acciones:**
1. Señalar la tarjeta de **Morella** (ciudad amurallada medieval)
2. Clic en Morella → navega a `/pais/espana/morella`

**Destacar:**
- Jerarquía visual: hero → ciudades → destinos destacados
- Morella es contenido editorial real (no placeholder)

---

### Paso 3: Ciudad - Morella (3 minutos)

**URL:** `/pais/espana/morella`

**Qué decir:**
> "Morella es una ciudad amurallada medieval en Castellón. Aquí vemos los destinos disponibles: el castillo, la basílica, el museo de dinosaurios..."

**Acciones:**
1. Scroll para mostrar los 6 destinos en grid
2. Clic en **Castillo de Morella** → navega a `/aventura/castillo-de-morella`

**Destacar:**
- 6 destinos reales con contenido editorial
- Cada destino tiene foto, tipo, y resumen

---

### Paso 4: Destino - Castillo de Morella (3 minutos)

**URL:** `/aventura/castillo-de-morella`

**Qué decir:**
> "Esta es la ficha de un destino. Ves el modo 'Aventura' activo: tono emocional, consejos prácticos. Ahora mira qué pasa si cambio a modo Estudiante."

**Acciones:**
1. Mostrar contenido en modo **Aventura** (tono explorador)
2. Cambiar a modo **Estudiante** usando el selector del header
3. Mostrar cómo cambia el contenido (tono educativo, datos históricos)
4. Volver a modo Aventura

**Destacar:**
- Contenido dual: mismo destino, dos perspectivas
- Selector global persistente (siempre visible en header)
- Información práctica: precio, horarios, duración

---

### Paso 5: Cambio de modo explicado (2 minutos)

**Qué decir:**
> "El modo Aventura está pensado para viajeros: cómo llegar, qué esperar, consejos prácticos. El modo Estudiante es más enciclopédico: historia, geografía, patrimonio. Un mismo lugar, dos formas de descubrirlo."

**Acciones:**
1. Navegar de vuelta a Morella
2. Mostrar cómo el contenido de la ciudad también cambia entre modos

---

## 4. Qué NO enseñar como error

### Albarracín - Contenido interno no publicado

**URL de prueba:** `/pais/espana/albarracin`

**Qué mostrar:**
- Mensaje: *"Esta ciudad todavía no está en Trawel"*
- Explicación del proceso editorial

**Qué decir:**
> "Albarracín no aparece porque está en estado interno. Tenemos la investigación hecha, los datos en Supabase, pero aún no está publicada. Esto es correcto: Trawel solo muestra contenido aprobado, no borradores."

**Mensaje clave:**
- No es un error técnico → Es el filtro de estados funcionando
- Contenido en desarrollo permanece oculto
- Investigación ≠ Publicación

---

## 5. Explicación estratégica

### comingSoon - Demanda pública futura

| Estado | Significado |
|--------|-------------|
| `active` / `published` | Contenido visible al público |
| `disabled` / `draft` | Contenido interno en desarrollo |
| `comingSoon` | **Futuro:** Lugares que usuarios buscan pero Trawel aún no tiene |

**Qué decir:**
> "ComingSoon no es una fase editorial. En el futuro, será para registrar qué lugares buscan los usuarios pero aún no tenemos. Eso nos dirá qué contenido priorizar."

### Investighost - Herramienta de investigación

**Qué decir:**
> "Investighost es una herramienta futura para investigar, revisar y aprobar contenido. Ahora mismo el proceso es manual: investigamos, redactamos, revisamos, y luego publicamos en Trawel. Investighost automatizará la investigación inicial."

**Distinción importante:**
- Trawel = Plataforma pública de lectura
- Investighost = Herramienta editorial de investigación (futura)

---

## 6. Checklist rápida de verificación

Antes de mostrar la demo, verificar:

- [ ] `npm run dev` inicia sin errores
- [ ] `/pais/espana/morella` carga correctamente
- [ ] `/aventura/castillo-de-morella` carga correctamente
- [ ] `/pais/espana/albarracin` muestra mensaje amable (no error)
- [ ] Selector Aventura/Estudiante funciona y persiste
- [ ] Cambio de modo actualiza contenido en tiempo real
- [ ] Navegación de vuelta funciona (breadcrumbs)

---

## 7. Riesgos o cosas a NO prometer

| No decir | Por qué | Qué decir en su lugar |
|----------|---------|----------------------|
| "Todos los países ya tienen contenido" | Solo España tiene contenido real | "España es nuestro caso de prueba. Morella demuestra el flujo completo." |
| "Investighost ya está integrado" | Es una herramienta futura | "Investighost es nuestra hoja de ruta para escalar la investigación." |
| "ComingSoon ya registra demanda" | Aún no está implementado | "En el futuro, comingSoon nos dirá qué lugares priorizar." |
| "El diseño ya es final" | Estética premium vendrá con v0 | "La estructura editorial está lista. La estética visual se refinará con v0." |

---

## Resumen para el presentador

1. **Home** → Mapa interactivo, clic en España
2. **España** → Morella visible, clic para entrar
3. **Morella** → 6 destinos reales, clic en Castillo
4. **Castillo** → Contenido dual, cambiar modo Aventura/Estudiante
5. **Albarracín** → Mostrar que contenido interno está oculto (correcto)
6. **Mensaje final:** "Trawel funciona. Tiene arquitectura real, contenido editorial, y está listo para escalar."

---

*Demo Checklist v1.0 - Trawel*