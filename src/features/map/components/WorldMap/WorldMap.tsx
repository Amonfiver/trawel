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
 const WORLD_MAP_PAN_PADDING_RATIO = 0.75;
 
 interface TooltipData {
   visible: boolean;
   x: number;
   y: number;
   country: WorldCountry | null;
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
   const suppressClickUntilRef = useRef(0);
   const navigate = useNavigate();
   
   const [tooltip, setTooltip] = useState<TooltipData>({
     visible: false,
     x: 0,
     y: 0,
     country: null,
   });
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
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

     const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
       .scaleExtent([1, 8])
       // Keep zoom gestures centered on the viewport, but allow the enlarged map
       // to move beyond the original viewBox inside the clipped map shell.
       .translateExtent(getRelaxedTranslateExtent(width, height, WORLD_MAP_PAN_PADDING_RATIO))
       .extent([[0, 0], [width, height]])
       .clickDistance(8)
       .filter((event: Event) => {
         if (event.type === 'wheel') {
           return false;
         }

         return true;
       })
       .on('start', () => {
         setTooltip(prev => ({ ...prev, visible: false }));
       })
       .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
         mapLayer.attr('transform', event.transform.toString());

         const sourceType = event.sourceEvent?.type || '';
         if (sourceType === 'mousemove' || sourceType === 'touchmove' || sourceType === 'pointermove') {
           suppressClickUntilRef.current = Date.now() + 250;
         }
       });

     svg.call(zoomBehavior);
 
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
 
         // Dibujar países
         mapLayer.selectAll('path')
           .data(geojson.features)
           .enter()
           .append('path')
           .attr('d', path as never)
           .attr('class', styles.country)
           .attr('fill', defaultMapTheme.colors.default)
           .attr('stroke', defaultMapTheme.colors.border)
           .attr('stroke-width', defaultMapTheme.colors.borderWidth)
           .attr('vector-effect', 'non-scaling-stroke')
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
       svg.on('.zoom', null);
     };
   }, [navigate]);
 
   const tooltipCountryName = tooltip.country?.displayName || 'País no disponible';
 
   return (
     <div 
       ref={containerRef}
       className={styles.container}
       role="region"
       aria-label="Mapa mundial interactivo de destinos de viaje"
     >
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
 
       {/* Wrapper del SVG para aspect ratio responsive */}
       <div className={styles.mapWrapper}>
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

       {!isLoading && !error && (
         <p className={styles.touchHint} aria-hidden="true">
           Pellizca para acercar
         </p>
       )}
 
       {/* Tooltip simplificado - DA-029: solo bandera visual + nombre */}
       <div
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
