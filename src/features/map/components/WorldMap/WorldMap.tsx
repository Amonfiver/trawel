/**
 * Componente WorldMap - Mapa mundial interactivo con D3 + TopoJSON
 *
 * Propósito: Renderizar mapa mundial exploratorio con tooltips de bandera + nombre
 * Alcance: Visualización SVG, hover, click, responsive, accesible
 *
 * Decisiones técnicas (DA-029):
 * - Estilo neutro para todos los países (sin revelar disponibilidad visualmente)
 * - Hover cambia a color amarillo/dorado del tema
 * - Tooltip muestra bandera + nombre del país (desde worldCountries)
 * - Click navega a /pais/{slug} para cualquier país resoluble
 * - Sin contadores de destinos ni badges de disponibilidad en tooltip
 * - CountryPage decide qué mostrar según disponibilidad de contenido
 *
 * Accesibilidad:
 * - role="img" y aria-label en SVG
 * - aria-live para estados de carga/error
 * - focus visible en elementos interactivos
 * - tooltip semántico
 *
 * Responsive:
 * - Aspect ratio preservado con padding-bottom technique
 * - ViewBox adaptativo
 */

 import { useEffect, useRef, useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 import * as d3 from 'd3';
 import { feature } from 'topojson-client';
 import type { Topology } from 'topojson-specification';
 import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
 import { CountryFlag } from '../../../countries';
 import { getWorldCountryByUnM49, type WorldCountry } from '../../../countries/data/worldCountries';
 import { defaultMapTheme } from '../../config/mapTheme';
 import styles from './WorldMap.module.css';

 // URL del dataset world-atlas
 const WORLD_ATLAS_URL = 'https://unpkg.com/world-atlas@2/countries-110m.json';
 const WORLD_MAP_WIDTH = 960;
 const WORLD_MAP_HEIGHT = 500;
 const WORLD_MAP_MAX_ZOOM = 40;
 const WORLD_MAP_PAN_PADDING_RATIO = 4;
 const TOUCH_LONG_PRESS_MS = 700;
 const TOUCH_MOVE_CANCEL_PX = 12;
 const MIN_PINCH_DISTANCE_PX = 1;
 const MOUSE_DRAG_CANCEL_PX = 4;

 interface TooltipData {
   visible: boolean;
   x: number;
   y: number;
   country: WorldCountry | null;
 }

 interface TouchPoint {
   clientX: number;
   clientY: number;
 }

 interface PinchGesture {
   startDistance: number;
   startScale: number;
   anchorMapPoint: [number, number];
 }

 /**
  * Componente WorldMap - Mapa mundial exploratorio
  *
  * Renderiza un mapa mundial con estilo neutro donde todos los países
  * se ven igual. Hover muestra tooltip con bandera + nombre.
  * Click navega a la página del país para cualquier país resoluble.
  */
 export function WorldMap() {
   const svgRef = useRef<SVGSVGElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const tooltipRef = useRef<HTMLDivElement>(null);
   const suppressClickUntilRef = useRef(0);
   const longPressTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
   const activeTouchPointersRef = useRef(new Set<number>());
   const touchPointerPositionsRef = useRef(new Map<number, TouchPoint>());
   const activeTouchCountryRef = useRef<WorldCountry | null>(null);
   const activeTouchElementRef = useRef<SVGPathElement | null>(null);
   const touchStartPointRef = useRef<{ x: number; y: number } | null>(null);
   const hasTouchMovedRef = useRef(false);
   const pinchGestureRef = useRef<PinchGesture | null>(null);
   const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
   const isMousePanningRef = useRef(false);
   const mousePanStartClientRef = useRef<{ x: number; y: number } | null>(null);
   const mousePanStartSvgRef = useRef<{ x: number; y: number } | null>(null);
   const mousePanStartTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
   const hasMouseDraggedRef = useRef(false);
   const navigate = useNavigate();

   const [tooltip, setTooltip] = useState<TooltipData>({
     visible: false,
     x: 0,
     y: 0,
     country: null,
   });
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [focusedTouchCountry, setFocusedTouchCountry] = useState<WorldCountry | null>(null);
   const [hasTouchInteraction, setHasTouchInteraction] = useState(false);

   useEffect(() => {
     if (!svgRef.current) return;

     const svg = d3.select(svgRef.current);
     const width = WORLD_MAP_WIDTH;
     const height = WORLD_MAP_HEIGHT;

     // Configurar proyección Mercator responsive
     const projection = d3.geoMercator()
       .scale(150)
       .translate([width / 2, height / 2 + 40]);

     const path = d3.geoPath().projection(projection);

     // Limpiar SVG previo
     svg.selectAll('*').remove();

     const mapLayer = svg.append('g')
       .attr('class', styles.zoomLayer);

     const applyMapTransform = (transform: d3.ZoomTransform) => {
       const constrainedTransform = constrainWorldMapTransform(
         transform,
         width,
         height,
         WORLD_MAP_PAN_PADDING_RATIO
       );

       currentTransformRef.current = constrainedTransform;
       mapLayer.attr('transform', constrainedTransform.toString());
     };

     const getSvgPointFromClient = (clientX: number, clientY: number) => {
       const svgNode = svgRef.current;

       if (!svgNode) {
         return null;
       }

       const rect = svgNode.getBoundingClientRect();
       if (rect.width <= 0 || rect.height <= 0) {
         return null;
       }

       const scale = Math.min(rect.width / width, rect.height / height);
       const renderedWidth = width * scale;
       const renderedHeight = height * scale;
       const offsetX = (rect.width - renderedWidth) / 2;
       const offsetY = (rect.height - renderedHeight) / 2;

       return {
         x: (clientX - rect.left - offsetX) / scale,
         y: (clientY - rect.top - offsetY) / scale,
       };
     };

     const getTouchTooltipPosition = (event: PointerEvent) => {
       const margin = 8;
       const gap = 14;
       const tooltipRect = tooltipRef.current?.getBoundingClientRect();
       const tooltipWidth = tooltipRect?.width || 180;
       const tooltipHeight = tooltipRect?.height || 44;
       const viewportWidth = window.innerWidth;
       const viewportHeight = window.innerHeight;

       let x = event.clientX - tooltipWidth - gap;
       let y = event.clientY - tooltipHeight - gap;

       if (x < margin) {
         x = event.clientX + gap;
       }

       if (x + tooltipWidth > viewportWidth - margin) {
         x = viewportWidth - tooltipWidth - margin;
       }

       if (y < margin) {
         y = event.clientY + gap;
       }

       if (y + tooltipHeight > viewportHeight - margin) {
         y = viewportHeight - tooltipHeight - margin;
       }

       return {
         x: Math.max(margin, x),
         y: Math.max(margin, y),
       };
     };

     const getTwoTouchPoints = () => {
       const points = Array.from(touchPointerPositionsRef.current.values());
       return points.length >= 2 ? ([points[0], points[1]] as const) : null;
     };

     const getTouchDistance = (a: TouchPoint, b: TouchPoint) =>
       Math.max(MIN_PINCH_DISTANCE_PX, Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY));

     const getTouchMidpoint = (a: TouchPoint, b: TouchPoint) => ({
       clientX: (a.clientX + b.clientX) / 2,
       clientY: (a.clientY + b.clientY) / 2,
     });

     const startPinchGesture = () => {
       const points = getTwoTouchPoints();
       if (!points) {
         pinchGestureRef.current = null;
         return;
       }

       const midpoint = getTouchMidpoint(points[0], points[1]);
       const svgMidpoint = getSvgPointFromClient(midpoint.clientX, midpoint.clientY);

       if (!svgMidpoint) {
         pinchGestureRef.current = null;
         return;
       }

       const startTransform = currentTransformRef.current;
       pinchGestureRef.current = {
         startDistance: getTouchDistance(points[0], points[1]),
         startScale: startTransform.k,
         anchorMapPoint: startTransform.invert([svgMidpoint.x, svgMidpoint.y]),
       };
     };

     const updatePinchGesture = () => {
       const points = getTwoTouchPoints();
       if (!points) {
         return;
       }

       if (!pinchGestureRef.current) {
         startPinchGesture();
       }

       const gesture = pinchGestureRef.current;
       if (!gesture) {
         return;
       }

       const midpoint = getTouchMidpoint(points[0], points[1]);
       const svgMidpoint = getSvgPointFromClient(midpoint.clientX, midpoint.clientY);

       if (!svgMidpoint) {
         return;
       }

       const nextScale = clamp(
         gesture.startScale * (getTouchDistance(points[0], points[1]) / gesture.startDistance),
         1,
         WORLD_MAP_MAX_ZOOM
       );
       const nextTransform = d3.zoomIdentity
         .translate(
           svgMidpoint.x - gesture.anchorMapPoint[0] * nextScale,
           svgMidpoint.y - gesture.anchorMapPoint[1] * nextScale
         )
         .scale(nextScale);

       applyMapTransform(nextTransform);
     };

     const clearLongPressTimer = () => {
       if (longPressTimerRef.current) {
         window.clearTimeout(longPressTimerRef.current);
         longPressTimerRef.current = null;
       }
     };

     const clearTouchHighlight = () => {
       if (!activeTouchElementRef.current) {
         return;
       }

       d3.select(activeTouchElementRef.current)
         .transition()
         .duration(defaultMapTheme.animation.hoverDuration || 150)
         .attr('fill', defaultMapTheme.colors.default)
         .attr('stroke-width', defaultMapTheme.colors.borderWidth)
         .style('filter', null)
         .style('cursor', 'default');

       activeTouchElementRef.current = null;
     };

     const cancelTouchIntent = ({ hideTooltip = true } = {}) => {
       clearLongPressTimer();
       activeTouchCountryRef.current = null;
       touchStartPointRef.current = null;

       if (hideTooltip) {
         setTooltip(prev => ({ ...prev, visible: false }));
       }
     };

     const getTouchedCountry = (event: PointerEvent) => {
       const element = document.elementFromPoint(event.clientX, event.clientY);
       const area = element?.closest?.('[data-world-country-code]') as SVGPathElement | null;
       const countryCode = area?.dataset.worldCountryCode;
       const worldCountry = countryCode ? getWorldCountryByUnM49(countryCode) : undefined;

       return area && worldCountry ? { area, worldCountry } : null;
     };

     const highlightTouchedCountry = (area: SVGPathElement, worldCountry: WorldCountry, event: PointerEvent) => {
       if (activeTouchElementRef.current !== area) {
         clearTouchHighlight();
         activeTouchElementRef.current = area;

         d3.select(area)
           .transition()
           .duration(defaultMapTheme.animation.hoverDuration || 150)
           .attr('fill', defaultMapTheme.colors.hover)
           .attr('stroke-width', 1.2)
           .style('filter', 'brightness(1.08) drop-shadow(0 3px 6px rgba(0,0,0,0.15))')
           .style('cursor', 'pointer');
       }

       activeTouchCountryRef.current = worldCountry;
       setFocusedTouchCountry(worldCountry);
       const tooltipPosition = getTouchTooltipPosition(event);
       setTooltip({
         visible: true,
         x: tooltipPosition.x,
         y: tooltipPosition.y,
         country: worldCountry,
       });
     };

     const scheduleLongPressNavigation = (worldCountry: WorldCountry) => {
       clearLongPressTimer();
       longPressTimerRef.current = window.setTimeout(() => {
         if (
           activeTouchPointersRef.current.size === 1 &&
           !hasTouchMovedRef.current &&
           activeTouchCountryRef.current?.slug === worldCountry.slug
         ) {
           suppressClickUntilRef.current = Date.now() + 1000;
           navigate(`/pais/${worldCountry.slug}`);
         }
       }, TOUCH_LONG_PRESS_MS);
     };

     const handlePointerDown = (event: PointerEvent) => {
       if (event.pointerType === 'mouse') {
         if (event.button !== 0 || currentTransformRef.current.k <= 1) {
           return;
         }

         const svgPoint = getSvgPointFromClient(event.clientX, event.clientY);
         if (!svgPoint) {
           return;
         }

         isMousePanningRef.current = true;
         hasMouseDraggedRef.current = false;
         mousePanStartClientRef.current = { x: event.clientX, y: event.clientY };
         mousePanStartSvgRef.current = svgPoint;
         mousePanStartTransformRef.current = currentTransformRef.current;
         try {
           svgRef.current?.setPointerCapture?.(event.pointerId);
         } catch {
           // Pointer capture is best-effort; mouseleave also closes the pan gesture.
         }
         return;
       }

       suppressClickUntilRef.current = Date.now() + 1000;
       activeTouchPointersRef.current.add(event.pointerId);
       touchPointerPositionsRef.current.set(event.pointerId, {
         clientX: event.clientX,
         clientY: event.clientY,
       });
       setHasTouchInteraction(true);
       try {
         svgRef.current?.setPointerCapture?.(event.pointerId);
       } catch {
         // Pointer capture is best-effort; zoom still works if the browser declines it.
       }

       if (activeTouchPointersRef.current.size > 1) {
         cancelTouchIntent();
         startPinchGesture();
         return;
       }

       const touchedCountry = getTouchedCountry(event);
       if (!touchedCountry) {
         cancelTouchIntent();
         return;
       }

       touchStartPointRef.current = { x: event.clientX, y: event.clientY };
       hasTouchMovedRef.current = false;
       highlightTouchedCountry(touchedCountry.area, touchedCountry.worldCountry, event);
       scheduleLongPressNavigation(touchedCountry.worldCountry);
     };

     const handlePointerMove = (event: PointerEvent) => {
       if (event.pointerType === 'mouse') {
         if (!isMousePanningRef.current) {
           return;
         }

         const startSvg = mousePanStartSvgRef.current;
         const currentSvg = getSvgPointFromClient(event.clientX, event.clientY);
         if (!startSvg || !currentSvg) {
           return;
         }

         const startClient = mousePanStartClientRef.current;
         if (startClient) {
           const distance = Math.hypot(event.clientX - startClient.x, event.clientY - startClient.y);
           if (distance > MOUSE_DRAG_CANCEL_PX) {
             hasMouseDraggedRef.current = true;
             suppressClickUntilRef.current = Date.now() + 500;
           }

           if (!hasMouseDraggedRef.current) {
             return;
           }
         }

         const startTransform = mousePanStartTransformRef.current;
         applyMapTransform(
           d3.zoomIdentity
             .translate(
               startTransform.x + currentSvg.x - startSvg.x,
               startTransform.y + currentSvg.y - startSvg.y
             )
             .scale(startTransform.k)
         );
         event.preventDefault();
         return;
       }

       if (!activeTouchPointersRef.current.has(event.pointerId)) {
         return;
       }

       touchPointerPositionsRef.current.set(event.pointerId, {
         clientX: event.clientX,
         clientY: event.clientY,
       });
       suppressClickUntilRef.current = Date.now() + 1000;

       if (activeTouchPointersRef.current.size > 1) {
         cancelTouchIntent();
         updatePinchGesture();
         return;
       }

       const startPoint = touchStartPointRef.current;
       if (startPoint) {
         const distance = Math.hypot(event.clientX - startPoint.x, event.clientY - startPoint.y);
         if (distance > TOUCH_MOVE_CANCEL_PX) {
           hasTouchMovedRef.current = true;
           clearLongPressTimer();
         }
       }

       const touchedCountry = getTouchedCountry(event);
       if (!touchedCountry) {
         clearLongPressTimer();
         activeTouchCountryRef.current = null;
         clearTouchHighlight();
         setTooltip(prev => ({ ...prev, visible: false }));
         return;
       }

       const previousCountrySlug = activeTouchCountryRef.current?.slug;
       highlightTouchedCountry(touchedCountry.area, touchedCountry.worldCountry, event);

       if (previousCountrySlug !== touchedCountry.worldCountry.slug) {
         touchStartPointRef.current = { x: event.clientX, y: event.clientY };
         if (!hasTouchMovedRef.current) {
           scheduleLongPressNavigation(touchedCountry.worldCountry);
         }
       }
     };

     const handlePointerEnd = (event: PointerEvent) => {
       if (event.pointerType === 'mouse') {
         if (isMousePanningRef.current && hasMouseDraggedRef.current) {
           suppressClickUntilRef.current = Date.now() + 500;
         }

         isMousePanningRef.current = false;
         mousePanStartClientRef.current = null;
         mousePanStartSvgRef.current = null;
         hasMouseDraggedRef.current = false;
         try {
           svgRef.current?.releasePointerCapture?.(event.pointerId);
         } catch {
           // Some browsers release capture automatically on pointer cancel/end.
         }
         return;
       }

       suppressClickUntilRef.current = Date.now() + 1000;
       activeTouchPointersRef.current.delete(event.pointerId);
       touchPointerPositionsRef.current.delete(event.pointerId);
       try {
         svgRef.current?.releasePointerCapture?.(event.pointerId);
       } catch {
         // Some browsers release capture automatically on pointer cancel/end.
       }
       hasTouchMovedRef.current = false;
       pinchGestureRef.current = null;

       if (activeTouchPointersRef.current.size > 1) {
         startPinchGesture();
       }

       cancelTouchIntent({ hideTooltip: false });
      };

      const handlePointerLeave = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' || !isMousePanningRef.current) {
          return;
        }

        if (hasMouseDraggedRef.current) {
          suppressClickUntilRef.current = Date.now() + 500;
        }

        isMousePanningRef.current = false;
        mousePanStartClientRef.current = null;
        mousePanStartSvgRef.current = null;
        hasMouseDraggedRef.current = false;
        try {
          svgRef.current?.releasePointerCapture?.(event.pointerId);
        } catch {
          // Some browsers release capture automatically on pointer leave.
        }
      };

      const handleWheel = (event: WheelEvent) => {
        // Solo zoom con rueda cuando el cursor está sobre el mapa
        // Evitar scroll de página cuando se hace zoom sobre el mapa
        event.preventDefault();

        const centerPoint: [number, number] = [width / 2, height / 2];
        const currentTransform = currentTransformRef.current;
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const nextScale = clamp(currentTransform.k * zoomFactor, 1, WORLD_MAP_MAX_ZOOM);
        const anchorMapPoint = currentTransform.invert(centerPoint);

        // Mantener estable el centro visual; el usuario recoloca el mapa con drag.
        const nextTransform = d3.zoomIdentity
          .translate(
            centerPoint[0] - anchorMapPoint[0] * nextScale,
            centerPoint[1] - anchorMapPoint[1] * nextScale
          )
          .scale(nextScale);

        applyMapTransform(nextTransform);
      };

      svgRef.current.addEventListener('pointerdown', handlePointerDown);
      svgRef.current.addEventListener('pointermove', handlePointerMove);
      svgRef.current.addEventListener('pointerup', handlePointerEnd);
      svgRef.current.addEventListener('pointercancel', handlePointerEnd);
      svgRef.current.addEventListener('pointerleave', handlePointerLeave);
      svgRef.current.addEventListener('wheel', handleWheel, { passive: false });

      // Cargar datos world-atlas
     fetch(WORLD_ATLAS_URL)
       .then(response => {
         if (!response.ok) throw new Error('Error cargando world-atlas');
         return response.json();
       })
        .then((topology: Topology) => {
          // Convertir TopoJSON a GeoJSON
          const countriesObject = topology.objects.countries;
          const geojson = feature(topology, countriesObject) as FeatureCollection<Geometry, GeoJsonProperties>;

          // Filtrar Antártida (código UN M.49 '010') para evitar confusión visual en móvil
          // Decisión de producto: MVP sin navegación a Antártida
          const filteredFeatures = geojson.features.filter((feat) => {
            const countryCode = (feat as { id?: string }).id;
            return countryCode !== '010';
          });

          // Dibujar países
          mapLayer.selectAll('path')
            .data(filteredFeatures)
            .enter()
           .append('path')
           .attr('d', path as never)
           .attr('class', styles.country)
           .attr('fill', defaultMapTheme.colors.default)
           .attr('stroke', defaultMapTheme.colors.border)
           .attr('stroke-width', defaultMapTheme.colors.borderWidth)
           .attr('vector-effect', 'non-scaling-stroke')
           .attr('data-world-country-code', (d: unknown) => {
             const feat = d as { id?: string };
             return feat.id || null;
           })
           .attr('role', 'button')
           .attr('tabindex', '0')
           .attr('aria-label', (d: unknown) => {
             const feat = d as { id?: string };
             const countryCode = feat.id;
             const worldCountry = countryCode ? getWorldCountryByUnM49(countryCode) : undefined;
             return worldCountry
               ? `País ${worldCountry.displayName}`
               : 'País no disponible';
           })
           .on('mouseover', function (event: MouseEvent, d: unknown) {
             const feat = d as { id?: string };
             const countryCode = feat.id;
             const worldCountry = countryCode ? getWorldCountryByUnM49(countryCode) : undefined;
             const isResolvable = !!worldCountry;

             // Efecto hover: siempre amarillo/dorado (DA-029)
             d3.select(this)
               .transition()
               .duration(defaultMapTheme.animation.hoverDuration || 150)
               .attr('fill', defaultMapTheme.colors.hover)
               .attr('stroke-width', 1.2)
               .style('filter', 'brightness(1.08) drop-shadow(0 3px 6px rgba(0,0,0,0.15))')
               .style('cursor', isResolvable ? 'pointer' : 'default');

             // Mostrar tooltip
             setTooltip({
               visible: true,
               x: event.clientX + 12,
               y: event.clientY - 12,
               country: worldCountry || null,
             });
           })
           .on('mousemove', function (event: MouseEvent) {
             setTooltip(prev => ({
               ...prev,
               x: event.clientX + 12,
               y: event.clientY - 12,
             }));
           })
           .on('mouseout', function () {
             // Restaurar color base neutro (sin diferenciar por estado)
             d3.select(this)
               .transition()
               .duration(defaultMapTheme.animation.hoverDuration || 150)
               .attr('fill', defaultMapTheme.colors.default)
               .attr('stroke-width', defaultMapTheme.colors.borderWidth)
               .style('filter', null)
               .style('cursor', 'default');

             // Ocultar tooltip
             setTooltip(prev => ({ ...prev, visible: false }));
           })
           .on('click', function (_event: MouseEvent, d: unknown) {
             if (Date.now() < suppressClickUntilRef.current) {
               return;
             }

             const feat = d as { id?: string };
             const countryCode = feat.id;
             const worldCountry = countryCode ? getWorldCountryByUnM49(countryCode) : undefined;

             // Navegar a cualquier país resoluble
             // CountryPage decidirá qué mostrar según disponibilidad de contenido
             if (worldCountry) {
               navigate(`/pais/${worldCountry.slug}`);
             }
           })
           .on('keydown', function (event: KeyboardEvent, d: unknown) {
             // Accesibilidad: permitir navegación con teclado
             if (event.key === 'Enter' || event.key === ' ') {
               event.preventDefault();
               const feat = d as { id?: string };
               const countryCode = feat.id;
               const worldCountry = countryCode ? getWorldCountryByUnM49(countryCode) : undefined;
               if (worldCountry) {
                 navigate(`/pais/${worldCountry.slug}`);
               }
             }
           });

         setIsLoading(false);
       })
       .catch(err => {
         console.error('Error cargando mapa:', err);
         setError('No se pudo cargar el mapa. Por favor, verifica tu conexión e inténtalo de nuevo.');
         setIsLoading(false);
       });

     return () => {
       clearLongPressTimer();
       activeTouchPointersRef.current.clear();
       touchPointerPositionsRef.current.clear();
       pinchGestureRef.current = null;
       svgRef.current?.removeEventListener('pointerdown', handlePointerDown);
       svgRef.current?.removeEventListener('pointermove', handlePointerMove);
       svgRef.current?.removeEventListener('pointerup', handlePointerEnd);
       svgRef.current?.removeEventListener('pointercancel', handlePointerEnd);
       svgRef.current?.removeEventListener('pointerleave', handlePointerLeave);
       svgRef.current?.removeEventListener('wheel', handleWheel);
     };
   }, [navigate]);

   const tooltipCountryName = tooltip.country?.displayName || 'País no disponible';
   const showTouchCountryButton = hasTouchInteraction && focusedTouchCountry && !isLoading && !error;

   return (
     <div
       ref={containerRef}
       className={styles.container}
       role="region"
       aria-label="Mapa mundial interactivo de destinos de viaje"
     >
       {/* Wrapper del SVG para aspect ratio responsive */}
       <div className={styles.mapWrapper}>
         {/* Estado de carga */}
         {isLoading && (
           <div className={styles.loading} role="status" aria-live="polite">
             <div className={styles.loadingContent}>
               <div className={styles.spinner} aria-hidden="true" />
               <span className={styles.loadingText}>Cargando mapa del mundo...</span>
             </div>
           </div>
         )}

         {/* Estado de error */}
         {error && (
           <div className={styles.error} role="alert" aria-live="assertive">
             <div className={styles.errorContent}>
               <div className={styles.errorIcon} aria-hidden="true">🗺️</div>
               <h3 className={styles.errorTitle}>Error al cargar el mapa</h3>
               <p className={styles.errorText}>{error}</p>
             </div>
           </div>
         )}

         <svg
           ref={svgRef}
           viewBox={`0 0 ${WORLD_MAP_WIDTH} ${WORLD_MAP_HEIGHT}`}
           preserveAspectRatio="xMidYMid meet"
           className={styles.svg}
           style={{ opacity: isLoading ? 0.3 : 1 }}
           role="img"
           aria-label="Mapa mundial para explorar destinos de viaje"
         >
           <title>Mapa mundial de destinos Trawel</title>
           <desc>Mapa exploratorio para descubrir países del mundo</desc>
         </svg>
       </div>

       {showTouchCountryButton && (
         <button
           type="button"
           className={styles.touchCountryButton}
           onClick={() => {
             suppressClickUntilRef.current = Date.now() + 1000;
           navigate(`/pais/${focusedTouchCountry.slug}`);
         }}
         aria-label={`Ir a ${focusedTouchCountry.displayName}`}
       >
         Ir a {focusedTouchCountry.displayName} →
       </button>
     )}

       {!isLoading && !error && (
         <p className={styles.touchHint} aria-hidden="true">
           1 dedo explora · 2 dedos mueven · Ir para entrar
         </p>
       )}

       {/* Tooltip simplificado - DA-029: solo bandera visual + nombre */}
       <div
         ref={tooltipRef}
         className={`${styles.tooltip} ${tooltip.visible ? styles.tooltipVisible : ''}`}
         style={{
           left: tooltip.x,
           top: tooltip.y,
           backgroundColor: defaultMapTheme.tooltip.background,
           color: defaultMapTheme.tooltip.textColor,
           borderRadius: defaultMapTheme.tooltip.borderRadius,
           padding: defaultMapTheme.tooltip.padding,
           maxWidth: defaultMapTheme.tooltip.maxWidth,
           boxShadow: defaultMapTheme.tooltip.shadow,
           border: defaultMapTheme.tooltip.border,
         }}
         role="tooltip"
         aria-hidden={!tooltip.visible}
       >
         <div className={styles.tooltipContent}>
           <div
             className={styles.tooltipTitle}
             style={{ fontSize: defaultMapTheme.tooltip.titleFontSize }}
           >
             {tooltip.country && (
               <CountryFlag
                 isoAlpha2={tooltip.country.isoAlpha2}
                 countryName={tooltip.country.displayName}
                 size="small"
               />
             )}
             <span>{tooltipCountryName}</span>
           </div>
         </div>
       </div>
     </div>
   );
 }

 function getRelaxedTranslateExtent(
   width: number,
   height: number,
   paddingRatio: number
 ): [[number, number], [number, number]] {
   const paddingX = width * paddingRatio;
   const paddingY = height * paddingRatio;

   return [
     [-paddingX, -paddingY],
     [width + paddingX, height + paddingY],
   ];
 }

 function constrainWorldMapTransform(
   transform: d3.ZoomTransform,
   width: number,
   height: number,
   paddingRatio: number
 ) {
   const [[minX, minY], [maxX, maxY]] = getRelaxedTranslateExtent(width, height, paddingRatio);
   const minTranslateX = width - maxX * transform.k;
   const maxTranslateX = -minX * transform.k;
   const minTranslateY = height - maxY * transform.k;
   const maxTranslateY = -minY * transform.k;

   return d3.zoomIdentity
     .translate(
       clamp(transform.x, minTranslateX, maxTranslateX),
       clamp(transform.y, minTranslateY, maxTranslateY)
     )
     .scale(transform.k);
 }

 function clamp(value: number, min: number, max: number) {
   return Math.min(max, Math.max(min, value));
 }
