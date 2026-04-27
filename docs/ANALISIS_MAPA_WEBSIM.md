# Análisis del mapa Websim original

## 1. Resumen de la funcionalidad

El mapa interactivo de Trawel es un **mapa mundial plano** que permite a los usuarios:
- Visualizar todos los países del mundo en una proyección Mercator
- Hacer **hover** sobre cualquier país para resaltarlo y ver su nombre
- Hacer **click** sobre un país (aunque actualmente solo muestra el nombre, no navega)

Es el elemento central de la landing page, ubicado bajo el título "Elije tu próximo destino". Sirve como punto de entrada visual para explorar destinos de viaje.

## 2. Tecnología usada

El mapa utiliza una **combinación de tecnologías**:

| Tecnología | Uso |
|------------|-----|
| **D3.js v7** | Biblioteca principal para visualización de datos y manipulación del SVG |
| **TopoJSON** | Formato de datos geoespaciales comprimidos (vía CDN unpkg.com) |
| **SVG** | Renderizado vectorial de los países como elementos `<path>` |
| **Proyección Mercator** | `d3.geoMercator()` para convertir coordenadas geográficas a 2D |

**Dependencias externas cargadas:**
```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="https://unpkg.com/topojson@3"></script>
```

**Fuente de datos:**
- URL: `https://unpkg.com/world-atlas@2/countries-110m.json`
- Es el dataset "world-atlas" de Mike Bostock (creador de D3)
- Resolución: 110m (baja resolución, aproximadamente 177 países)

## 3. Archivos analizados

| Archivo | Líneas relevantes | Papel en el mapa |
|---------|-------------------|------------------|
| `index.html` | 148-154, 363-365 | Contenedor SVG (`#world-map-svg`), tooltip (`#map-tooltip`), carga de librerías D3 y TopoJSON |
| `script.js` | 96-157 | Toda la lógica del mapa: inicialización D3, carga de datos, eventos, proyección |
| `styles.css` | 333-366 | Estilos del contenedor, transiciones de color, tooltip |

### Estructura HTML del mapa:
```html
<section id="mapa-interactivo" class="map-section">
    <h2 class="map-title">Elije tu próximo destino</h2>
    <div class="world-map">
        <svg id="world-map-svg" width="960" height="500"></svg>
        <div id="map-tooltip" class="tooltip"></div>
    </div>
</section>
```

## 4. Funcionamiento del hover

### Detección del país bajo el ratón:
D3 vincula los datos GeoJSON directamente a los elementos SVG mediante `.data()`:

```javascript
svg.selectAll('path')
    .data(countries.features)  // Cada path tiene sus datos GeoJSON
    .enter()
    .append('path')
    .attr('class', 'country')
    // ...
    .on('mouseover', function(event, d) {
        // d contiene toda la información del país (geometry, properties, etc.)
    });
```

### Cambio de color:
**En hover (mouseover):**
```javascript
d3.select(this).attr('fill', 'orange');
```
Cambia el fill del path a naranja.

**Al salir (mouseout):**
```javascript
d3.select(this).attr('fill', 'steelblue');
```
Restaura el color azul acero original.

### Mostrar nombre del país:
El tooltip es un `<div>` posicionado absolutamente dentro del contenedor:

```javascript
const [x, y] = d3.pointer(event, svg.node());  // Coordenadas relativas al SVG
tooltip
    .style('opacity', 1)
    .style('left', (x + 10) + 'px')   // Offset de 10px
    .style('top', (y - 30) + 'px')    // 30px arriba del cursor
    .text(d.properties.name || 'País');  // Nombre del país o fallback
```

**Seguimiento del cursor:**
```javascript
.on('mousemove', function(event) {
    const [x, y] = d3.pointer(event, svg.node());
    tooltip
        .style('left', (x + 10) + 'px')
        .style('top', (y - 30) + 'px');
});
```

## 5. Funcionamiento del click

### Comportamiento actual:
```javascript
.on('click', function(event, d) {
    const [x, y] = d3.pointer(event, svg.node());
    tooltip
        .style('opacity', 1)
        .style('left', (x + 10) + 'px')
        .style('top', (y - 30) + 'px')
        .text(d.properties.name || 'País');
});
```

**Observación:** El click hace exactamente lo mismo que el hover: muestra el nombre del país en el tooltip. **No hay navegación** a una página de detalle del país.

### Mouseout condicional:
```javascript
.on('mouseout', function(event) {
    d3.select(this).attr('fill', 'steelblue');
    if (!event.buttons) {  // Solo oculta si no hay botones del ratón pulsados
        tooltip.style('opacity', 0);
    }
});
```

Esto permite que el tooltip persista después del click.

### Qué habría que añadir para el nuevo Trawel:
1. **Navegación:** Redirigir a `/pais/[id]` o similar
2. **Datos enriquecidos:** Más información que solo `d.properties.name`
3. **Estado visual:** Mantener el país seleccionado resaltado
4. **Interactividad mejorada:** Zoom, pan, o selección múltiple

## 6. Datos de países

### Estructura de datos disponible:
Los datos vienen de **world-atlas@2/countries-110m.json**, que es un archivo TopoJSON que al convertirse a GeoJSON tiene esta estructura por país:

```javascript
{
  "type": "Feature",
  "properties": {
    "name": "Spain"  // ÚNICA propiedad disponible por defecto
  },
  "geometry": {
    "type": "Polygon" | "MultiPolygon",
    "coordinates": [...]  // Coordenadas del contorno
  },
  "id": "724"  // ID numérico (código UN M.49)
}
```

### Limitaciones importantes:
- **Solo tiene el nombre del país** en inglés
- **No tiene códigos ISO** (ISO 3166-1 alpha-2/alpha-3)
- **No tiene información adicional** (capital, población, continente, etc.)
- **IDs son numéricos UN M.49**, no los códigos de dos letras más comunes

### Para enriquecer los datos en el nuevo Trawel, se necesitaría:
- Mapear IDs UN M.49 a códigos ISO
- Agregar datos de continentes
- Incluir traducciones de nombres
- Añadir metadatos (bandera, capital, descripción, etc.)

## 7. Partes reutilizables conceptualmente

| Concepto | Valor para el nuevo Trawel |
|----------|---------------------------|
| **Proyección Mercator** | Estándar para mapas mundiales, buena elección |
| **Uso de TopoJSON** | Formato eficiente, reduce tamaño de transferencia |
| **SVG + D3** | Flexible, escalable, buen rendimiento para este caso |
| **Eventos hover/click** | Patrón de interacción correcto |
| **Tooltip posicionado** | UX probada, seguir patrón similar |
| **world-atlas** | Dataset confiable y mantenido por la comunidad D3 |

## 8. Partes que conviene rehacer

| Problema | Por qué | Solución propuesta |
|----------|---------|-------------------|
| **Datos mínimos** | Solo nombre en inglés | Enriquecer con ISO codes, continentes, traducciones |
| **Click sin acción** | No navega a ningún lado | Implementar routing a páginas de país |
| **Color hardcoded** | `steelblue`/`orange` en JS | Usar sistema de temas CSS |
| **Sin zoom/pan** | Mapa estático | Añadir controles de zoom si es necesario |
| **Tooltip simple** | Solo texto | Permitir contenido HTML enriquecido |
| **Carga síncrona de datos** | `d3.json().then()` bloqueante | Considerar estados de loading/error |
| **Sin caché** | Descarga datos en cada visita | Cachear o empaquetar datos |
| **Responsive limitado** | Tamaño fijo 960x500 | Hacer SVG responsive |

## 9. Propuesta para el nuevo Trawel

### Arquitectura limpia propuesta:

```
Mapa Mundial
    ↓ click
Página de País (/pais/[iso-code])
    ↓ click en ciudad/región
Página de Ciudad/Región (/pais/[iso]/[ciudad])
    ↓ click en punto de interés
Ficha de Destino/Aventura (/destino/[slug])
```

### Stack tecnológico recomendado:

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Framework** | Next.js 14+ | Routing, SSR, API routes |
| **Mapa** | D3.js + TopoJSON | Proven, flexible, mismo approach mejorado |
| **Estilos** | Tailwind CSS | Temas consistentes, responsive |
| **Datos** | JSON estático o CMS | Países, ciudades, destinos |
| **Estado** | React Query / Zustand | Cache, prefetch de datos |

### Mejoras sobre la versión original:

1. **Datos enriquecidos:**
   - Dataset propio con: ISO codes, nombres en múltiples idiomas, continentes, coordenadas de capitales
   - Relación: País → Ciudades → Puntos de interés

2. **Interacción mejorada:**
   - Click navega a página de país
   - Hover muestra preview con imagen + datos básicos
   - Opcional: zoom suave al hacer click

3. **Visual:**
   - Colores desde tema (CSS variables)
   - Transiciones suaves
   - Estados: default, hover, selected, disabled

4. **Accesibilidad:**
   - ARIA labels
   - Navegación por teclado
   - Contraste adecuado

5. **Performance:**
   - Datos empaquetados en build o CDN con cache
   - Lazy loading de páginas de país
   - Code splitting del componente de mapa

## 10. Recomendación de primer MVP

### Flujo mínimo viable:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mapa Mundial  │────→│  Página País   │────→│  Lista Ciudades │
│  (D3 + SVG)    │     │  (info básica)  │     │  (cards simples)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ↓
                                                ┌─────────────────┐
                                                │ Info Ciudad     │
                                                │ (texto + foto)  │
                                                └─────────────────┘
```

### Componentes del MVP:

| # | Componente | Descripción | Esfuerzo |
|---|------------|-------------|----------|
| 1 | `WorldMap` | SVG con D3, hover resalta, click navega | 2-3 días |
| 2 | `CountryPage` | Muestra info del país seleccionado | 1-2 días |
| 3 | `CityList` | Grid de ciudades del país | 1 día |
| 4 | `CityDetail` | Info básica de ciudad | 1 día |
| 5 | `Data layer` | JSON con países, ciudades, rutas | 1-2 días |

### Dataset mínimo necesario:
```json
{
  "countries": [
    {
      "iso": "ES",
      "name": { "es": "España", "en": "Spain" },
      "continent": "europe",
      "capital": "Madrid",
      "cities": [
        { "slug": "madrid", "name": "Madrid", "description": "..." },
        { "slug": "barcelona", "name": "Barcelona", "description": "..." }
      ]
    }
  ]
}
```

### Criterios de éxito del MVP:
- [ ] Mapa renderiza todos los países
- [ ] Click en país navega a `/pais/[iso]`
- [ ] Página de país muestra nombre, continente, lista de ciudades
- [ ] Click en ciudad muestra información básica
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Transiciones suaves entre estados

---

*Documento generado para el proyecto Trawel - Análisis de la versión Websim original*