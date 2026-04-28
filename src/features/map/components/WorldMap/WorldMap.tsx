/**
 * Componente WorldMap - Mapa mundial interactivo con D3 + TopoJSON
 * 
 * Propósito: Renderizar mapa mundial con países clickeables y tooltips
 * Alcance: Visualización SVG, hover, click, sin zoom/pan por ahora
 * 
 * Decisiones técnicas:
 * - Usa proyección Mercator estándar
 * - Carga world-atlas desde CDN (unpkg)
 * - Conecta geometrías UN M.49 con diccionario Trawel
 * - Colores desde mapTheme (no hardcodeados)
 * - Responsive con viewBox y max-width
 * 
 * Limitaciones actuales:
 * - Sin zoom/pan
 * - Sin transiciones suaves entre estados
 * - Sin cache de datos geoespaciales
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

export function WorldMap() {
  const svgRef = useRef<SVGSVGElement>(null);
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

    // Configurar proyección Mercator
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
          .each(function (d: unknown) {
            const feature = d as { id?: string };
            const countryCode = feature.id;
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
            const feature = d as { id?: string };
            const countryCode = feature.id;
            const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
            
            // Cambiar color a hover
            d3.select(this)
              .attr('fill', defaultMapTheme.colors.hover)
              .attr('stroke-width', 1.5)
              .style('cursor', trawelCountry && isCountryClickable(trawelCountry) ? 'pointer' : 'default');

            // Mostrar tooltip
            setTooltip({
              visible: true,
              x: event.clientX + 10,
              y: event.clientY - 10,
              country: trawelCountry || null,
              status: trawelCountry?.status || 'unknown',
            });
          })
          .on('mousemove', function (event: MouseEvent) {
            setTooltip(prev => ({
              ...prev,
              x: event.clientX + 10,
              y: event.clientY - 10,
            }));
          })
          .on('mouseout', function (_event: MouseEvent, d: unknown) {
            const feature = d as { id?: string };
            const countryCode = feature.id;
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
              .attr('fill', fillColor)
              .attr('stroke-width', defaultMapTheme.colors.borderWidth);

            // Ocultar tooltip
            setTooltip(prev => ({ ...prev, visible: false }));
          })
          .on('click', function (_event: MouseEvent, d: unknown) {
            const feature = d as { id?: string };
            const countryCode = feature.id;
            const trawelCountry = countryCode ? getCountryByUnM49(countryCode) : undefined;
            
            // Navegar solo si es país clickeable
            if (trawelCountry && isCountryClickable(trawelCountry)) {
              navigate(`/pais/${trawelCountry.slug}`);
            }
          });

        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error cargando mapa:', err);
        setError('Error cargando el mapa. Por favor, recarga la página.');
        setIsLoading(false);
      });
  }, [navigate]);

  const getTooltipText = () => {
    if (!tooltip.country) {
      return {
        title: 'País no disponible',
        description: 'Próximamente',
      };
    }

    const { displayName, destinationCount, status } = tooltip.country;
    
    if (status === 'active') {
      return {
        title: displayName,
        description: `${destinationCount || 0} destinos disponibles`,
      };
    } else if (status === 'comingSoon') {
      return {
        title: displayName,
        description: 'Próximamente',
      };
    } else {
      return {
        title: displayName,
        description: 'No disponible',
      };
    }
  };

  const tooltipText = getTooltipText();

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className={styles.loading}>
          <span>Cargando mapa...</span>
        </div>
      )}
      
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 960 500"
        className={styles.svg}
        style={{ opacity: isLoading ? 0.5 : 1 }}
      />

      {tooltip.visible && (
        <div
          className={styles.tooltip}
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: defaultMapTheme.tooltip.background,
            color: defaultMapTheme.tooltip.textColor,
            borderRadius: defaultMapTheme.tooltip.borderRadius,
            padding: defaultMapTheme.tooltip.padding,
          }}
        >
          <div className={styles.tooltipTitle}>{tooltipText.title}</div>
          <div className={styles.tooltipDescription}>{tooltipText.description}</div>
        </div>
      )}
    </div>
  );
}