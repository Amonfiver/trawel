/**
 * SpainMap v2 - Mapa interno de España con asset TopoJSON real
 *
 * Componente SpainMap - Renderiza provincias españolas desde asset geoBoundaries
 *
 * Propósito: Reemplazo del prototipo temporal (DA-027 Fase 2)
 * Alcance: Mostrar provincias de España como paths interactivos + ciudades como puntos
 *
 * Características:
 * - Carga asset TopoJSON local: /maps/countries/spain/spain-adm2.topojson
 * - Renderiza 52 provincias con D3 + proyección geográfica real
 * - Superpone puntos interactivos de ciudades publicadas
 * - Atribución visible: "Datos cartográficos: geoBoundaries (CC BY 4.0)"
 * - Fallback limpio si el asset no carga
 *
 * Datos cartográficos: geoBoundaries (CC BY 4.0)
 * Fuente: https://www.geoboundaries.org/ - gbOpen ESP ADM2
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { City } from '../../../cities/types/city.types';
import { getCityDisplayName } from '../../../cities/data/cities.utils';
import styles from './SpainMap.module.css';

interface SpainMapProps {
  cities: City[];
  countrySlug: string;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  city: City | null;
}

interface ProvinceFeature {
  type: 'Feature';
  properties: {
    shapeName: string;
    shapeISO: string;
    shapeID: string;
    [key: string]: unknown;
  };
  geometry: GeoJSON.Geometry;
}

export function SpainMap({ cities, countrySlug }: SpainMapProps) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<ProvinceFeature[]>([]);

  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    city: null,
  });

  // Cargar TopoJSON
  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/maps/countries/spain/spain-adm2.topojson');

        if (!response.ok) {
          throw new Error(`No se pudo cargar el mapa: ${response.status}`);
        }

        const topology = await response.json();

        // Convertir TopoJSON a GeoJSON
        const geojson = feature(topology, topology.objects.spain_adm2) as unknown as {
          type: 'FeatureCollection';
          features: ProvinceFeature[];
        };

        setProvinces(geojson.features);
        setLoading(false);
      } catch (err) {
        console.error('Error cargando mapa de España:', err);
        setError('No se pudo cargar el mapa. Mostrando lista de ciudades.');
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  // Renderizar D3 cuando los datos estén listos
  useEffect(() => {
    if (!svgRef.current || provinces.length === 0 || loading) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Limpiar contenido previo

    const width = 800;
    const height = 600;

    // Crear proyección (ajustada para España)
    const projection = d3
      .geoMercator()
      .fitSize([width, height], {
        type: 'FeatureCollection',
        features: provinces,
      } as GeoJSON.FeatureCollection);

    const path = d3.geoPath().projection(projection);

    // Grupo para las provincias
    const g = svg.append('g').attr('class', styles.provincesGroup);

    // Renderizar provincias
    g.selectAll('path')
      .data(provinces)
      .enter()
      .append('path')
      .attr('d', (d) => path(d as d3.GeoPermissibleObjects) || '')
      .attr('class', styles.province)
      .attr('fill', '#e2e8f0')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .on('mouseover', function () {
        d3.select(this).attr('fill', '#cbd5e1').attr('stroke', '#64748b');
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#e2e8f0').attr('stroke', '#94a3b8');
      });

    // Proyectar y renderizar ciudades
    const citiesWithCoords = cities.filter((city) => city.coordinates);

    const citiesGroup = svg.append('g').attr('class', styles.citiesGroup);

    citiesGroup
      .selectAll('circle')
      .data(citiesWithCoords)
      .enter()
      .append('circle')
      .attr('cx', (d) => {
        const coords = d.coordinates;
        return coords ? projection([coords.lng, coords.lat])?.[0] || 0 : 0;
      })
      .attr('cy', (d) => {
        const coords = d.coordinates;
        return coords ? projection([coords.lng, coords.lat])?.[1] || 0 : 0;
      })
      .attr('r', (d) => (d.featured ? 10 : 7))
      .attr('class', (d) =>
        d.featured ? `${styles.cityDot} ${styles.featured}` : styles.cityDot
      )
      .on('click', (_, d) => {
        navigate(`/pais/${countrySlug}/${d.slug}`);
      })
      .on('mouseover', (event, d) => {
        setTooltip({
          visible: true,
          x: event.clientX + 12,
          y: event.clientY - 12,
          city: d,
        });
      })
      .on('mousemove', (event) => {
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX + 12,
          y: event.clientY - 12,
        }));
      })
      .on('mouseout', () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      });

    // Labels de ciudades
    citiesGroup
      .selectAll('text')
      .data(citiesWithCoords)
      .enter()
      .append('text')
      .attr('x', (d) => {
        const coords = d.coordinates;
        return coords ? projection([coords.lng, coords.lat])?.[0] || 0 : 0;
      })
      .attr('y', (d) => {
        const coords = d.coordinates;
        const y = coords ? projection([coords.lng, coords.lat])?.[1] || 0 : 0;
        return y - (d.featured ? 18 : 14);
      })
      .attr('text-anchor', 'middle')
      .attr('class', (d) =>
        d.featured
          ? `${styles.cityLabel} ${styles.featuredLabel}`
          : styles.cityLabel
      )
      .text((d) => getCityDisplayName(d));
  }, [provinces, cities, countrySlug, navigate, loading]);

  const handleCityClick = (city: City) => {
    navigate(`/pais/${countrySlug}/${city.slug}`);
  };

  // Fallback: mostrar solo lista de ciudades si falla la carga
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.fallback}>
          <p className={styles.fallbackMessage}>🗺️ {error}</p>
          <div className={styles.fallbackCities}>
            {cities.map((city) => (
              <button
                key={city.id}
                className={styles.fallbackCity}
                onClick={() => handleCityClick(city)}
              >
                {getCityDisplayName(city)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {loading && (
        <div className={styles.loading}>
          <span className={styles.loadingSpinner}>🗺️</span>
          <span>Cargando mapa...</span>
        </div>
      )}

      <div className={styles.mapWrapper}>
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          className={styles.svg}
          role="img"
          aria-label="Mapa de España con provincias y ciudades disponibles"
        >
          <title>Mapa de España - Provincias y ciudades Trawel</title>
        </svg>
      </div>

      {/* Atribución cartográfica */}
      <div className={styles.attribution}>
        <span>Datos cartográficos: </span>
        <a
          href="https://www.geoboundaries.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.attributionLink}
        >
          geoBoundaries (CC BY 4.0)
        </a>
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendFeatured}`} />
          <span>Ciudad destacada</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} />
          <span>Ciudad disponible</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.city && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x, top: tooltip.y }}
          role="tooltip"
        >
          <div className={styles.tooltipContent}>
            <strong>{getCityDisplayName(tooltip.city)}</strong>
            {tooltip.city.shortDescription && (
              <span className={styles.tooltipDescription}>
                {typeof tooltip.city.shortDescription === 'string'
                  ? tooltip.city.shortDescription
                  : tooltip.city.shortDescription.es}
              </span>
            )}
            <span className={styles.tooltipHint}>
              {tooltip.city.destinationCount
                ? `${tooltip.city.destinationCount} aventuras`
                : 'Próximamente'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}