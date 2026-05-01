/**
 * Componente SpainMap - Mapa interno de España con ciudades clickeables
 * 
 * Propósito: Piloto arquitectónico para mapas internos de país (DA-027)
 * Alcance: Mostrar ciudades de España como puntos interactivos sobre mapa simplificado
 * 
 * Decisiones técnicas:
 * - SVG estático con representación simplificada de España
 * - Proyección manual de coordenadas lat/lng a SVG
 * - Puntos clickeables para cada ciudad con tooltip
 * - Diseño placeholder hasta versión definitiva con v0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Bounding box de España peninsular
const SPAIN_BOUNDS = {
  minLat: 36.0,
  maxLat: 43.8,
  minLng: -9.3,
  maxLng: 3.3,
};

const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;

/**
 * Proyecta coordenadas lat/lng a coordenadas SVG
 */
function projectCoordinates(lat: number, lng: number): { x: number; y: number } | null {
  if (lat < SPAIN_BOUNDS.minLat - 1 || lat > SPAIN_BOUNDS.maxLat + 1 ||
      lng < SPAIN_BOUNDS.minLng - 1 || lng > SPAIN_BOUNDS.maxLng + 1) {
    return null;
  }

  const x = ((lng - SPAIN_BOUNDS.minLng) / (SPAIN_BOUNDS.maxLng - SPAIN_BOUNDS.minLng)) * SVG_WIDTH;
  const y = SVG_HEIGHT - ((lat - SPAIN_BOUNDS.minLat) / (SPAIN_BOUNDS.maxLat - SPAIN_BOUNDS.minLat)) * SVG_HEIGHT;
  
  return { x, y };
}

export function SpainMap({ cities, countrySlug }: SpainMapProps) {
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    city: null,
  });

  const citiesWithCoords = cities.filter(city => city.coordinates);
  
  const projectedCities = citiesWithCoords.map(city => {
    const projected = city.coordinates 
      ? projectCoordinates(city.coordinates.lat, city.coordinates.lng)
      : null;
    return { city, projected };
  }).filter(item => item.projected !== null) as Array<{
    city: City;
    projected: { x: number; y: number };
  }>;

  const handleCityClick = (city: City) => {
    navigate(`/pais/${countrySlug}/${city.slug}`);
  };

  const handleMouseEnter = (event: React.MouseEvent, city: City) => {
    setTooltip({
      visible: true,
      x: event.clientX + 12,
      y: event.clientY - 12,
      city,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltip(prev => ({
      ...prev,
      x: event.clientX + 12,
      y: event.clientY - 12,
    }));
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.mapWrapper}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label="Mapa de España con ciudades disponibles"
        >
          <title>Mapa de España - Ciudades Trawel</title>
          
          {/* Fondo del mapa */}
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#f8fafc" rx="12" />
          
          {/* Silueta simplificada de España - placeholder */}
          <g className={styles.countryOutline}>
            {/* Península - forma aproximada con path simple */}
            <path
              d="M 50,200 
                 C 50,150 100,100 200,80 
                 C 300,60 500,60 600,100 
                 C 700,140 750,200 750,280 
                 C 750,360 650,420 550,450 
                 C 450,480 300,480 200,420 
                 C 120,380 50,300 50,200 Z"
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth="2"
            />
            
            {/* Islas Baleares */}
            <ellipse cx="680" cy="180" rx="25" ry="15" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Islas Canarias - representación simplificada en recuadro */}
            <g transform="translate(80, 380)">
              <rect width="100" height="60" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" rx="4" />
              <text x="50" y="35" textAnchor="middle" fontSize="10" fill="#64748b">Islas Canarias</text>
              {/* Gran Canaria */}
              <ellipse cx="35" cy="25" rx="12" ry="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              {/* Tenerife */}
              <ellipse cx="65" cy="30" rx="15" ry="10" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
            </g>
          </g>

          {/* Ciudades como puntos interactivos */}
          <g className={styles.cities}>
            {projectedCities.map(({ city, projected }) => (
              <g key={city.id} className={styles.cityGroup}>
                {/* Círculo de la ciudad */}
                <circle
                  cx={projected.x}
                  cy={projected.y}
                  r={city.featured ? 10 : 7}
                  className={`${styles.cityDot} ${city.featured ? styles.featured : ''}`}
                  onClick={() => handleCityClick(city)}
                  onMouseEnter={(e) => handleMouseEnter(e, city)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  role="button"
                  tabIndex={0}
                  aria-label={`Explorar ${getCityDisplayName(city)}`}
                />
                
                {/* Label de la ciudad */}
                <text
                  x={projected.x}
                  y={projected.y - (city.featured ? 18 : 14)}
                  textAnchor="middle"
                  className={`${styles.cityLabel} ${city.featured ? styles.featuredLabel : ''}`}
                >
                  {getCityDisplayName(city)}
                </text>
              </g>
            ))}
          </g>
        </svg>
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