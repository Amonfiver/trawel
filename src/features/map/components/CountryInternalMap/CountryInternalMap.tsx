/**
 * Purpose: Render an internal country map from local or Storage TopoJSON.
 * Scope: Loads generic TopoJSON, renders areas, exposes hover tooltips and optional zone selection.
 * Decisions: Keeps map visual-neutral with no fixed labels, points, or city markers.
 * Limitations: Zone identity depends on available TopoJSON properties; fallback names stay user-friendly.
 * Recent changes: Added stable zone selection payload for navigation to country zone placeholders.
 */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { defaultMapTheme } from '../../config/mapTheme';
import styles from './CountryInternalMap.module.css';

interface CountryInternalMapProps {
  assetUrl: string;
  countryName: string;
  attribution?: string;
  onZoneSelect?: (zone: CountryInternalMapZone) => void;
}

export interface CountryInternalMapZone {
  name: string;
  slug: string;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  title: string;
}

type TopologyLike = {
  type?: string;
  objects?: Record<string, unknown>;
};

const WIDTH = 900;
const HEIGHT = 560;
const PAN_PADDING_RATIO = 0.75;

export function CountryInternalMap({
  assetUrl,
  countryName,
  attribution,
  onZoneSelect,
}: CountryInternalMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const suppressClickUntilRef = useRef(0);
  const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadMap = async () => {
      setIsLoading(true);
      setError(null);
      setFeatures([]);

      try {
        const response = await fetch(assetUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const topology = (await response.json()) as TopologyLike;
        const objectKey = getFirstTopologyObjectKey(topology);

        if (!objectKey || !topology.objects) {
          throw new Error('No se encontró una capa cartográfica válida en el TopoJSON');
        }

        const converted = feature(topology as never, topology.objects[objectKey] as never) as
          | GeoJSON.Feature
          | GeoJSON.FeatureCollection;

        const nextFeatures =
          converted.type === 'FeatureCollection' ? converted.features : [converted];

        const validFeatures = nextFeatures.filter((item) => Boolean(item.geometry));

        if (validFeatures.length === 0) {
          throw new Error('El mapa no contiene geometrías válidas');
        }

        if (isMounted) {
          setFeatures(validFeatures);
          setIsLoading(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        if (import.meta.env.DEV) {
          console.error('[CountryInternalMap] Error cargando asset', { assetUrl, error: err });
        }
        if (isMounted) {
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    loadMap();

    return () => {
      isMounted = false;
    };
  }, [assetUrl]);

  useEffect(() => {
    if (!svgRef.current || features.length === 0 || isLoading) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    const projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], featureCollection);
    const path = d3.geoPath().projection(projection);

    svg
      .append('rect')
      .attr('width', WIDTH)
      .attr('height', HEIGHT)
      .attr('fill', defaultMapTheme.colors.background);

    const mapLayer = svg.append('g')
      .attr('class', styles.zoomLayer);

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      // Keep zoom gestures centered on the viewport, but allow the enlarged map
      // to move beyond the original viewBox inside the clipped map shell.
      .translateExtent(getRelaxedTranslateExtent(WIDTH, HEIGHT, PAN_PADDING_RATIO))
      .extent([[0, 0], [WIDTH, HEIGHT]])
      .clickDistance(8)
      .filter((event: Event) => {
        if (event.type === 'wheel') {
          return false;
        }

        return true;
      })
      .on('start', () => {
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        mapLayer.attr('transform', event.transform.toString());

        const sourceType = event.sourceEvent?.type || '';
        if (sourceType === 'mousemove' || sourceType === 'touchmove' || sourceType === 'pointermove') {
          suppressClickUntilRef.current = Date.now() + 250;
        }
      });

    svg.call(zoomBehavior);

    mapLayer
      .selectAll('path')
      .data(features)
      .enter()
      .append('path')
      .attr('class', styles.area)
      .attr('d', (item) => path(item) || '')
      .attr('fill', defaultMapTheme.colors.default)
      .attr('stroke', defaultMapTheme.colors.border)
      .attr('stroke-width', defaultMapTheme.colors.borderWidth)
      .attr('stroke-linejoin', 'round')
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('tabindex', '0')
      .attr('aria-label', (item) => getAreaName(item.properties))
      .attr('role', onZoneSelect ? 'link' : 'img')
      .on('mouseover', function (event: MouseEvent, item) {
        d3.select(this)
          .transition()
          .duration(defaultMapTheme.animation.hoverDuration || 150)
          .attr('fill', defaultMapTheme.colors.hover)
          .attr('stroke-width', 1.2)
          .style('filter', 'brightness(1.08) drop-shadow(0 3px 6px rgba(0,0,0,0.15))');

        setTooltip({
          visible: true,
          x: event.clientX + 12,
          y: event.clientY - 12,
          title: getAreaName(item.properties),
        });
      })
      .on('mousemove', (event: MouseEvent) => {
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX + 12,
          y: event.clientY - 12,
        }));
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(defaultMapTheme.animation.hoverDuration || 150)
          .attr('fill', defaultMapTheme.colors.default)
          .attr('stroke-width', defaultMapTheme.colors.borderWidth)
          .style('filter', null);

        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('focus', (_event, item) => {
        setTooltip({
          visible: true,
          x: 24,
          y: 24,
          title: getAreaName(item.properties),
        });
      })
      .on('blur', function () {
        d3.select(this)
          .transition()
          .duration(defaultMapTheme.animation.hoverDuration || 150)
          .attr('fill', defaultMapTheme.colors.default)
          .attr('stroke-width', defaultMapTheme.colors.borderWidth)
          .style('filter', null);

        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('click', (_event, item) => {
        if (!onZoneSelect) {
          return;
        }

        if (Date.now() < suppressClickUntilRef.current) {
          return;
        }

        const zoneName = getAreaName(item.properties);
        onZoneSelect({
          name: zoneName,
          slug: createZoneSlug(zoneName),
        });
      })
      .on('keydown', (event: KeyboardEvent, item) => {
        if (!onZoneSelect || (event.key !== 'Enter' && event.key !== ' ')) {
          return;
        }

        event.preventDefault();
        const zoneName = getAreaName(item.properties);
        onZoneSelect({
          name: zoneName,
          slug: createZoneSlug(zoneName),
        });
      });

    return () => {
      svg.on('.zoom', null);
    };
  }, [features, isLoading, onZoneSelect]);

  if (isLoading) {
    return (
      <div className={styles.container} role="status" aria-live="polite">
        <div className={styles.loading}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner} aria-hidden="true" />
            <span>Cargando mapa de {countryName}...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container} role="alert">
        <div className={styles.error}>
          <div className={styles.errorContent}>
            <h3 className={styles.errorTitle}>No pudimos cargar el mapa</h3>
            <p className={styles.errorText}>
              El mapa de {countryName} está disponible, pero no se pudo preparar la vista.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const attributionText = attribution || 'Datos cartográficos: geoBoundaries';

  return (
    <div className={styles.container}>
      <div className={styles.mapWrapper}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className={styles.svg}
          role="img"
          aria-label={`Mapa interno de ${countryName}`}
        >
          <title>Mapa interno de {countryName}</title>
          <desc>Mapa exploratorio con subdivisiones internas. Los nombres aparecen al pasar el ratón.</desc>
        </svg>
      </div>

      <p className={styles.touchHint} aria-hidden="true">
        Pellizca para acercar
      </p>

      <div className={styles.attribution}>{attributionText}</div>

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
        <p
          className={styles.tooltipTitle}
          style={{ fontSize: defaultMapTheme.tooltip.titleFontSize }}
        >
          {tooltip.title}
        </p>
      </div>
    </div>
  );
}

function getFirstTopologyObjectKey(topology: TopologyLike): string | null {
  if (!topology.objects || typeof topology.objects !== 'object') {
    return null;
  }

  return (
    Object.entries(topology.objects).find(([, value]) => {
      if (!value || typeof value !== 'object') {
        return false;
      }

      const object = value as { type?: string; geometries?: unknown[]; coordinates?: unknown };
      return (
        object.type === 'GeometryCollection' ||
        object.type === 'Polygon' ||
        object.type === 'MultiPolygon' ||
        Array.isArray(object.geometries) ||
        Boolean(object.coordinates)
      );
    })?.[0] || null
  );
}

function getAreaName(properties: GeoJSON.GeoJsonProperties): string {
  if (!properties) {
    return 'Área';
  }

  const candidates = [
    properties.shapeName,
    properties.name,
    properties.NAME,
    properties.NAME_1,
    properties.NAME_2,
    properties.NAME_ES,
    properties.nom,
    properties.nombre,
  ];

  const name = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return typeof name === 'string' ? name.trim() : 'Zona por descubrir';
}

function createZoneSlug(zoneName: string): string {
  const normalized = zoneName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'zona-por-descubrir';
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
