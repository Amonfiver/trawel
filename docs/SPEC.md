# Especificación de Trawel

## Qué es Trawel

Trawel es un portal de descubrimiento de destinos de viaje. Permite a los usuarios explorar el mundo de forma visual e intuitiva, navegando desde una vista global hasta fichas detalladas de aventuras específicas.

## Qué problema resuelve

Los sitios de viajes tradicionales presentan destinos como listas interminables o búsquedas agotadoras. Trawel ofrece:

- **Descubrimiento visual**: Explorar el mundo geográficamente, no mediante listas.
- **Jerarquía clara**: Mundial → País → Ciudad → Aventura.
- **Curación de contenido**: Solo destinos seleccionados con información de calidad.
- **Experiencia inspiradora**: Diseño enfocado en la exploración, no solo en la reserva.

## Experiencia que ofrece

1. **Exploración libre**: El usuario puede hacer clic en cualquier país del mapa.
2. **Progresión guiada**: Cada nivel ofrece información más específica.
3. **Feedback visual inmediato**: Hover, colores, transiciones que indican qué es interactivo.
4. **Contenido enriquecido**: Descripciones, fotos, datos prácticos.

## Flujo principal de navegación

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAPA MUNDIAL                               │
│         (todos los países visibles, algunos activos)            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ click en país activo
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PÁGINA DE PAÍS                             │
│  - Información general del país                                 │
│  - Lista de ciudades/regiones con contenido                     │
│  - Mapa del país (futuro)                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ click en ciudad
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CIUDAD/REGIÓN                                 │
│  - Descripción de la ciudad                                     │
│  - Lista de aventuras/destinos disponibles                      │
│  - Información práctica                                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ click en aventura
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FICHA DE AVENTURA                              │
│  - Descripción detallada                                        │
│  - Fotos y media                                                │
│  - Tips y recomendaciones                                       │
│  - Cómo llegar / dónde alojarse                                 │
└─────────────────────────────────────────────────────────────────┘
```

## MVP Inicial

El MVP debe demostrar el concepto con una experiencia completa pero limitada en alcance:

### Incluye:
- [ ] Mapa mundial interactivo con D3/TopoJSON
- [ ] 3-5 países activos con contenido completo (ej: España, Japón, Perú)
- [ ] Página de país con información básica
- [ ] 2-3 ciudades por país activo
- [ ] Página de ciudad con información básica
- [ ] 1-2 aventuras por ciudad
- [ ] Navegación fluida entre niveles
- [ ] Diseño responsive (desktop, tablet, móvil)

### Países inactivos:
- Visibles en el mapa
- Al hacer hover: muestra "Próximamente"
- No navegan a página de detalle
- Visualmente diferenciados (opacidad, color)

## Qué queda fuera del MVP

| Feature | Motivo | Prioridad futura |
|---------|--------|------------------|
| Buscador global | Complejidad de indexación | Alta |
| Filtros avanzados | Necesita más datos | Media |
| Mapas internos de país | Complejidad de datos geoespaciales | Alta |
| Sistema de usuarios | No es core del descubrimiento | Baja |
| Reviews/comentarios | Contenido generado por usuarios | Media |
| Integración de reservas | Enfoque en inspiración, no transacción | Baja |
| Base de datos | Datos estáticos suficientes para MVP | Media |
| i18n completo | Empezamos con español | Media |

## Criterios de éxito del MVP

1. **Funcionales**:
   - Usuario puede navegar Mapa → País → Ciudad → Aventura sin errores
   - El mapa responde a hover y click en menos de 100ms
   - La navegación funciona en desktop y móvil

2. **De contenido**:
   - Mínimo 3 países con contenido completo y de calidad
   - Información útil en cada nivel (no placeholders)
   - Fotos relevantes en cada ficha

3. **De experiencia**:
   - Usuario entiende inmediatamente que puede hacer clic en países
   - Transiciones suaves entre páginas
   - Diseño visualmente atractivo y coherente

## Sistema visual de exploración configurable

Trawel no es "un mapa", es un **sistema de exploración visual** compuesto por:

### Componentes del sistema:
1. **WorldMap**: Vista global, punto de entrada
2. **CountryMap** (futuro): Vista de país con regiones/ciudades
3. **CityMap** (futuro): Vista local con puntos de interés
4. **Theme System**: Configuración visual compartida

### Configurabilidad:
Todos los mapas comparten:
- Paleta de colores configurable
- Estados visuales definidos (activo, hover, seleccionado, desactivado, próximamente)
- Sistema de tooltips consistente
- Datos propios de Trawel (no solo nombres de world-atlas)

### Ventajas de esta aproximación:
- **Escalabilidad**: Nuevos tipos de mapa siguen las mismas reglas
- **Mantenibilidad**: Cambios de diseño en un solo lugar
- **Flexibilidad**: Diferentes temas para temporadas o marcas
- **Testabilidad**: Componentes aislados con comportamiento predecible

---

*Versión 1.0 - MVP Trawel*