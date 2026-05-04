# Normativa UI de Mapas Interactivos - Trawel

> **Documento oficial de UX/UI para todos los componentes de mapa.**
>
> **Regla de oro:** Leer este documento antes de tocar `WorldMap`, `CountryInternalMap`, `HomePage` relacionada con mapa, o responsive de mapas.

---

## 1. Principios generales

Los mapas de Trawel son **mapas exploratorios limpios**:

- **No revelan visualmente** qué lugares tienen contenido disponible.
- **No hay labels permanentes** sobre los mapas.
- **No hay puntos, marcadores ni nombres fijos** sobre los mapas salvo decisión explícita futura.
- Los nombres aparecen bajo **interacción mediante tooltip**.
- En **móvil** se prioriza superficie táctil útil.
- En **escritorio** se prioriza encaje completo, elegante y sin recortes.
- Todo cambio debe conservar **responsive funcional móvil**.
- **No tocar lógica de zoom** sin checkpoint claro.
- Experimentos fuertes de zoom deben hacerse en **bloque aislado o rama experimental**.

---

## 2. Home y experiencia de mapa vivo

Home debe mantenerse como **mapa vivo**:

```
mapa mundial → país → zona → aventuras reales de viajeros
```

### Prohibido reintroducir

No volver a añadir bloques heredados de catálogo cerrado:

- ❌ "Países disponibles"
- ❌ "Próximamente"
- ❌ "Destinos disponibles"
- ❌ Tarjetas/listados de catálogo cerrado

### Footer provisional

El footer actual debe respetarse:

- © 2026 Trawel
- Frase de marca
- Mapa del sitio
- Conócenos
- Quiénes somos
- Privacidad
- Contacto

---

## 3. WorldMap

### Escritorio

| Interacción | Comportamiento |
|-------------|----------------|
| `hover` | Muestra tooltip con bandera + nombre de país |
| `click` | Navega al país |
| `wheel` (sobre el mapa) | Zoom del mapa; scroll de página fuera del mapa |

### Móvil

| Gestos | Comportamiento |
|--------|----------------|
| 1 dedo | Explora países |
| Tap simple | **No navega directamente** — muestra tooltip |
| 2 dedos | Pan/zoom |

#### Flujo táctil

1. Usuario explora con 1 dedo → país enfocado queda **amarillo**
2. Tooltip aparece **arriba del dedo** (desplazado para no taparse)
3. Tooltip **cambia de lado** si no cabe en el viewport
4. Aparece botón **"Ir a {país} →"** debajo del mapa
5. Tap en el botón navega al país

### Estado actual técnico

- El zoom táctil con dos dedos del WorldMap existe pero no está perfecto.
- **No reabrir el problema del anclaje del zoom** sin experimento aislado, checkpoint y rollback fácil.

### Excepciones de renderizado (MVP)

| País/Región | Estado | Motivo |
|-------------|--------|--------|
| **Antártida** | Oculta | No participa en navegación principal; genera confusión visual y táctil en móvil |

---

## 4. CountryInternalMap

### Escritorio

| Aspecto | Requisito |
|---------|-----------|
| Territorio | Mostrar **completo sin cortes** |
| Ajuste | Usar `margin`/`fitExtent` o criterio equivalente |
| Islas | Prestar atención cuando el asset las incluya |
| Wheel zoom | **Solo si el cursor está sobre el mapa** |
| Fuera del mapa | La rueda desplaza la página normalmente |

### Móvil

| Aspecto | Requisito |
|---------|-----------|
| Altura | Mapa más alto que en versiones antiguas |
| 1 dedo | Explora zonas y muestra tooltip |
| 2 dedos | Pan/zoom |
| Multitouch | **No recalcular tooltip ni foco de zona** |
| Post-pinch | Al terminar pinch, **no seleccionar automáticamente** una zona por el dedo restante |

#### Tooltip móvil

- Aparece **arriba del dedo**
- **Desplazado** para no taparse
- **Cambia de lado** si no cabe

### Tooltip (ambos modos)

- Muestra nombre de zona, ciudad, provincia o región según el asset
- **No hay etiquetas permanentes**

---

## 5. Responsive

| Dispositivo | Criterio |
|-------------|----------|
| Escritorio | Puede conservar aspect-ratio equilibrado |
| Móvil | Usar altura tipo `clamp(...)` o criterio equivalente |
| Ambos | Evitar mapas bajos/aplastados |
| Ambos | Mantener botones/acciones visibles bajo el mapa |
| Móvil real | El mapa debe seguir siendo usable, no solo en emulador |

---

## 6. Reglas para agentes

### Prohibiciones explícitas

- ❌ No reintroducir bloques heredados de catálogo en Home
- ❌ No añadir labels fijas sobre mapas
- ❌ No tocar WorldMap y CountryInternalMap en el mismo bloque salvo necesidad justificada

### Cambios de zoom

- Deben ser **pequeños, probables y con rollback/checkpoint**
- Cualquier experimento fuerte debe ir en **rama experimental o bloque aislado**

### Checklist obligatorio

- [ ] Ejecutar `npm run build` al terminar
- [ ] Documentar cambios en `docs/BITACORA.md`
- [ ] Si `docs/BITACORA.md` está demasiado grande, respetar política de rotación a `BITACORA_002.md` y sucesivas

---

## Referencias relacionadas

| Documento | Propósito |
|-----------|-----------|
| `AGENT_BRIEF.md` | Entrada rápida para agentes |
| `CODEMAP.md` | Mapa del código, estructura de `src/features/map/` |
| `MAP_ASSET_PLAN.md` | Plan técnico de assets cartográficos (worker, Storage, fuentes) |
| `DECISIONES.md` | Decisiones DA-027, DA-029, DA-030, DA-031 |
| `BITACORA.md` | Cambios recientes del proyecto |

---

*MAP_UI_GUIDELINES.md v1.0 - Trawel*