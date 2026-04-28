/**
 * Componente WorldMap - Mapa mundial interactivo con D3 + TopoJSON
 * 
 * Propósito: Renderizar mapa mundial con países clickeables y tooltips
 * Alcance: Visualización SVG, hover, click, responsive, accesible
 * 
 * Decisiones técnicas:
 * - Usa proyección Mercator estándar con responsive automático
 * - Carga world-atlas desde CDN (unpkg) con loading state
 * - Conecta geometrías UN M.49 con diccionario Trawel
 * - Colores desde mapTheme (sin hardcodeados)
 * - Transiciones suaves en interacciones
 * - ARIA labels para accesibilidad
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
 * - Breakpoints para ajustes de escala
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { getCountryByUnM49, isCountryClickable } from '../../../countries/data/countries.utils';
import { defaultMapTheme } from '../../config/mapTheme';
import type { Country, CountryStatus } from '../../../countries/data/countries.types';
import styles from './WorldMap.module.css';

// URL del dataset world-atlas
const WORLD_ATLAS_URL = 'https://unpkg.com/world-atlas@2/countries-110m.json';

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  country: Country | null;
  status: CountryStatus | 'unknown';
}

/**
 * Componente WorldMap - Mapa mundial interactivo
 * 
 * Renderiza un mapa mundial con países clickeables, tooltips animados
 * y estados visuales diferenciados según el contenido disponible.
 */
export function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    country: null,
    status: 'unknown',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 960;
    const height = 500;

    // Configurar proyección Mercator responsive
    const projection = d3.geoMercator()
      .scale(150)
      .translate([width / 2, height / 2 + 40]);

    const path = d3.geoPath().projection(projection);

    // Limpiar SVG previo
    svg.selectAll('*').remove();

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
        svg.selectAll('path')
          .data(geojson.features)
          .enter()
          .append('path')
          .attr('d', path as never)
          .attr('class', styles.country)
          .attr('stroke', defaultMapTheme.colors.border)
          .attr('stroke-width', defaultMapTheme.colors.borderWidth)
          .attr('role', 'button')
          .attr('tabindex', '0')
          .attr('aria-label', (d: unknown) => {
            const feat = d as { id?: string };
            const countryCode = feat.id;
            const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
            return trawelCountry 
              ? `País ${trawelCountry.displayName}${isCountryClickable(trawelCountry) ? ', disponible para navegar' : ''}`
              : 'País no disponible';
          })
          .each(function (d: unknown) {
            const feat = d as { id?: string };
            const countryCode = feat.id;
            const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
            
            // Asignar color según estado
            let fillColor = defaultMapTheme.colors.default;
            if (trawelCountry) {
              switch (trawelCountry.status) {
                case 'active':
                  fillColor = defaultMapTheme.colors.active;
                  break;
                case 'comingSoon':
                  fillColor = defaultMapTheme.colors.comingSoon;
                  break;
                case 'disabled':
                  fillColor = defaultMapTheme.colors.disabled;
                  break;
              }
            }
            
            d3.select(this).attr('fill', fillColor);
          })
          .on('mouseover', function (event: MouseEvent, d: unknown) {
            const feat = d as { id?: string };
            const countryCode = feat.id;
            const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
            const isClickable = trawelCountry ? isCountryClickable(trawelCountry) : false;
            
            // Efecto hover visual
            d3.select(this)
              .transition()
              .duration(defaultMapTheme.animation.hoverDuration || 150)
              .attr('fill', isClickable ? defaultMapTheme.colors.hover : defaultMapTheme.colors.default)
              .attr('stroke-width', 1.2)
              .style('filter', 'brightness(1.08) drop-shadow(0 3px 6px rgba(0,0,0,0.15))')
              .style('cursor', isClickable ? 'pointer' : 'default');

            // Mostrar tooltip
            setTooltip({
              visible: true,
              x: event.clientX + 12,
              y: event.clientY - 12,
              country: trawelCountry || null,
              status: trawelCountry?.status || 'unknown',
            });
          })
          .on('mousemove', function (event: MouseEvent) {
            setTooltip(prev => ({
              ...prev,
              x: event.clientX + 12,
              y: event.clientY - 12,
            }));
          })
          .on('mouseout', function (_event: MouseEvent, d: unknown) {
            const feat = d as { id?: string };
            const countryCode = feat.id;
            const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
            
            // Restaurar color según estado
            let fillColor = defaultMapTheme.colors.default;
            if (trawelCountry) {
              switch (trawelCountry.status) {
                case 'active':
                  fillColor = defaultMapTheme.colors.active;
                  break;
                case 'comingSoon':
                  fillColor = defaultMapTheme.colors.comingSoon;
                  break;
                case 'disabled':
                  fillColor = defaultMapTheme.colors.disabled;
                  break;
              }
            }
            
            d3.select(this)
              .transition()
              .duration(defaultMapTheme.animation.hoverDuration || 150)
              .attr('fill', fillColor)
              .attr('stroke-width', defaultMapTheme.colors.borderWidth)
              .style('filter', null)
              .style('cursor', 'default');

            // Ocultar tooltip
            setTooltip(prev => ({ ...prev, visible: false }));
          })
          .on('click', function (_event: MouseEvent, d: unknown) {
            const feat = d as { id?: string };
            const countryCode = feat.id;
            const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
            
            // Navegar solo si es país clickeable
            if (trawelCountry && isCountryClickable(trawelCountry)) {
              navigate(`/pais/${trawelCountry.slug}`);
            }
          })
          .on('keydown', function (event: KeyboardEvent, d: unknown) {
            // Accesibilidad: permitir navegación con teclado
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              const feat = d as { id?: string };
              const countryCode = feat.id;
              const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
              if (trawelCountry && isCountryClickable(trawelCountry)) {
                navigate(`/pais/${trawelCountry.slug}`);
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
  }, [navigate]);

  const getTooltipText = () => {
    if (!tooltip.country) {
      return {
        title: 'País no disponible',
        description: 'Próximamente',
        badge: null,
      };
    }

    const { displayName, destinationCount, status } = tooltip.country;
    
    if (status === 'active') {
      return {
        title: displayName,
        description: `${destinationCount || 0} destinos disponibles`,
        badge: { text: 'Disponible', color: '#10b981' },
      };
    } else if (status === 'comingSoon') {
      return {
        title: displayName,
        description: 'Próximamente disponible',
        badge: { text: 'Próximamente', color: '#f59e0b' },
      };
    } else {
      return {
        title: displayName,
        description: 'No disponible',
        badge: null,
      };
    }
  };

  const tooltipText = getTooltipText();

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
          viewBox="0 0 960 500"
          preserveAspectRatio="xMidYMid meet"
          className={styles.svg}
          style={{ opacity: isLoading ? 0.3 : 1 }}
          role="img"
          aria-label="Mapa mundial con países disponibles destacados"
        >
          <title>Mapa mundial de destinos Trawel</title>
          <desc>Mapa interactivo que muestra países disponibles para explorar</desc>
        </svg>
      </div>

      {/* Leyenda del mapa */}
      {!isLoading && !error && (
        <div className={styles.legend} role="complementary" aria-label="Leyenda del mapa">
          <div className={styles.legendItem}>
            <span 
              className={styles.legendDot} 
              style={{ backgroundColor: defaultMapTheme.colors.active }}
              aria-hidden="true"
            />
            <span>Destinos disponibles</span>
          </div>
          <div className={styles.legendItem}>
            <span 
              className={styles.legendDot} 
              style={{ backgroundColor: defaultMapTheme.colors.comingSoon }}
              aria-hidden="true"
            />
            <span>Próximamente</span>
          </div>
          <div className={styles.legendItem}>
            <span 
              className={styles.legendDot} 
              style={{ backgroundColor: defaultMapTheme.colors.default }}
              aria-hidden="true"
            />
            <span>No disponible</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
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
            {tooltipText.title}
          </div>
          <div 
            className={styles.tooltipDescription}
            style={{ fontSize: defaultMapTheme.tooltip.descriptionFontSize }}
          >
            {tooltipText.description}
          </div>
          {tooltipText.badge && (
            <div className={styles.tooltipBadge} style={{ color: tooltipText.badge.color }}>
              <span>●</span> {tooltipText.badge.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}