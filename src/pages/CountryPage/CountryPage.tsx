/**
 * Página de ficha de país - Nivel País / Exploración con Mapa Interno
 * 
 * Propósito: Mostrar información de país con mapa interno como pieza principal
 * de exploración, retirando tarjetas heredadas del flujo principal.
 * 
 * Alcance: 
 * - Hero visual cinematográfico del país
 * - Mapa interno interactivo homogéneo
 * - Fallback a directorio clásico para países sin mapa
 * - Mensaje futuro orientado a aventuras publicadas por viajeros
 *
 * Decisiones técnicas importantes:
 * - Usa la fachada data-driven para datos normalizados de pantalla de país
 * - Consume getResolvedCountryScreenData como fachada de datos de pantalla
 * - CountryInternalMap es el render genérico para assets TopoJSON locales o de Storage
 * - España usa asset local; otros países consultan/generan assets en country_map_assets
 * - screenData.mapStatus define el nivel administrativo esperado para cada país
 * - La atribución cartográfica se delega al mapa y no debe ocultarse
 *
 * Jerarquía de contenido:
 * - País: hero, estado editorial y contexto principal
 * - Mapa interno: experiencia central para elegir zona/provincia
 * - Zona: destino de navegación tras seleccionar una zona del mapa
 * - Zonas de entrada: máximo 4 ciudades como accesos, no catálogo nacional
 * - Aventuras destacadas y CTA: contenido secundario y participación futura
 *
 * Limitaciones/reglas:
 * - CountryPage NO es un catálogo genérico de ciudades
 * - Las ciudades/lugares concretos viven en Zona -> Ciudad -> Aventura
 * - No tocar lógica de mapas, zoom, pan, touch, tooltips ni navegación desde variantes visuales
 * - No tocar D3, TopoJSON, Supabase, rutas ni servicios desde cambios visuales
 *
 * Cambios recientes de mapas internos:
 * - Integración con sistema automático de mapas internos (DA-030)
 * - Estados UI: loading, ready, missing, queued/generating, failed
 * - Polling para actualización de estado de generación
 * - Vista "Descubriendo" para países sin contenido editorial pero presentes en worldCountries
 * - Click en zona del mapa navega a /pais/{countrySlug}/zona/{zoneSlug}
 * 
 * Rediseño visual "Horizonte Dorado" (2026-05-14):
 * - Paleta azul cielo + dorado trigo (guiño elegante a Ucrania)
 * - Hero cinematográfico con gradiente cielo → horizonte
 * - Mapa como protagonista absoluto con marco visual premium
 * - Cards con bordes dorados sutiles y hover con luz
 * - Estados de mapa emotivos y visualmente ricos
 * - Zero overflow horizontal, mobile-first
 * 
 * Nota para agentes: la variante visual puede cambiar CSS, estructura visual y microcopy,
 * pero no debe alterar hooks, estados, servicios, rutas ni lógica funcional de mapas.
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback, type CSSProperties } from 'react';
import {
  MonetizationSlot,
  getCountryScreenFallbackData,
  getResolvedCountryScreenData,
  type Promotion,
  type ResolvedCountryScreenData,
  type ScreenCountrySummary,
  type ScreenEditorialData,
} from '../../features/travelData';
import { CountryInternalMap } from '../../features/map/components/CountryInternalMap';
import { CountryFlag } from '../../features/countries';
import type { CountryStatus } from '../../features/countries/data/countries.types';
import type { CountryMapAsset } from '../../features/map/services/countryMapAssets.service';
import { 
  getCountryMapAsset, 
  getCountryMapPublicUrl, 
  requestCountryMapGeneration 
} from '../../features/map/services/countryMapAssets.service';
import { useExperienceMode } from '../../features/experienceMode';
import type { City } from '../../features/cities/types/city.types';
import type { Destination } from '../../features/destinations/types/destination.types';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getLocalizedText } from '../../app/i18n';
import type { ExperienceMode } from '../../features/countries';
import styles from './CountryPage.module.css';

// =============================================================================
// SISTEMA DE HERO FOTOGRÁFICO POR PAÍS
// =============================================================================

/**
 * Diccionario de imágenes hero disponibles.
 * Carga automática desde src/assets/countries/hero/*.webp
 * 
 * Para añadir un nuevo país:
 * 1. Colocar imagen en: src/assets/countries/hero/[slug].webp
 * 2. El sistema la detectará automáticamente por el slug del país
 */
const heroImages = import.meta.glob<{ default: string }>(
  '../../assets/countries/hero/*.webp',
  { eager: true }
);

/**
 * Construye mapa de slug -> URL de imagen hero
 * 
 * El regex maneja:
 * - Barras normales (Unix/Mac): /mexico.webp
 * - Barras invertidas (Windows): \mexico.webp
 * - Cualquier estructura de path que termine en [nombre].webp
 */
const heroImageMap: Record<string, string> = Object.entries(heroImages).reduce(
  (acc, [path, module]) => {
    // Extrae slug del path: extrae "mexico" de ".../mexico.webp" o "...\mexico.webp"
    const match = path.match(/[\\/]([^\\/]+)\.webp$/i);
    if (match) {
      acc[match[1]] = module.default;
    }
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Diccionario de copy editorial específico para hero por país.
 * Fallback: "Estamos preparando este destino"
 */
const heroCopyBySlug: Record<string, string> = {
  mexico: 'Pirámides, cultura viva y paisajes que invitan a descubrir cada región.',
};

/**
 * Copy estable para portadas temporales sin imagen real.
 * Preparado para futura generación editorial por país desde Investighost.
 */
const heroFallbackCopyBySlug: Record<string, string> = {
  canada: 'Bosques infinitos, ciudades abiertas y paisajes que cambian con cada estación. Explora un país hecho para viajar despacio, mirar lejos y descubrir rutas memorables.',
  mexico: 'Pirámides, mercados vivos, costas luminosas y ciudades llenas de historia. Descubre México como un mosaico de regiones, sabores y caminos que invitan a volver.',
  italia: 'Ciudades de arte, pueblos lentos y paisajes que mezclan historia, cocina y luz mediterránea. Explora Italia con calma, de plaza en plaza y de región en región.',
  espana: 'Costas, montañas, ciudades históricas y pueblos con carácter propio. Descubre España como un viaje de contrastes, lenguas, caminos y tradiciones compartidas.',
  ucrania: 'Ciudades con memoria, paisajes abiertos y una identidad cultural profunda. Descubre Ucrania desde su historia, su gente y sus lugares esenciales.',
  rusia: 'Distancias inmensas, ciudades monumentales y paisajes que cambian de Europa a Asia. Explora Rusia desde su cultura, su historia y sus rutas más evocadoras.',
};

type CountryHeroFallbackPalette = {
  primary: string;
  secondary: string;
  accent: string;
  stripeStart: string;
  stripeMiddle: string;
  stripeEnd: string;
  glowStart: string;
  glowEnd: string;
};

/**
 * Paletas discretas para portadas temporales de país.
 * Solo se aplican cuando NO existe imagen hero real en assets/countries/hero.
 */
const heroFallbackPalettesBySlug: Record<string, CountryHeroFallbackPalette> = {
  canada: {
    primary: '#123a32',
    secondary: '#f8fafc',
    accent: '#9f1d2f',
    stripeStart: '#b91c1c',
    stripeMiddle: '#f8fafc',
    stripeEnd: '#b91c1c',
    glowStart: 'rgba(185, 28, 28, 0.26)',
    glowEnd: 'rgba(248, 250, 252, 0.22)',
  },
  mexico: {
    primary: '#0f3d2e',
    secondary: '#f7f3eb',
    accent: '#8f1d2c',
    stripeStart: '#1f6f43',
    stripeMiddle: '#f8fafc',
    stripeEnd: '#b91c1c',
    glowStart: 'rgba(31, 111, 67, 0.36)',
    glowEnd: 'rgba(185, 28, 28, 0.28)',
  },
  italia: {
    primary: '#11412f',
    secondary: '#f6f1e8',
    accent: '#a7282f',
    stripeStart: '#1f7a4d',
    stripeMiddle: '#fffaf0',
    stripeEnd: '#c7353d',
    glowStart: 'rgba(31, 122, 77, 0.34)',
    glowEnd: 'rgba(199, 53, 61, 0.24)',
  },
  espana: {
    primary: '#7f1d1d',
    secondary: '#d4a54a',
    accent: '#991b1b',
    stripeStart: '#9f1d22',
    stripeMiddle: '#f2c14f',
    stripeEnd: '#9f1d22',
    glowStart: 'rgba(242, 193, 79, 0.34)',
    glowEnd: 'rgba(153, 27, 27, 0.28)',
  },
  ucrania: {
    primary: '#123f73',
    secondary: '#2d6a9f',
    accent: '#d9a928',
    stripeStart: '#1f5f9f',
    stripeMiddle: '#1f5f9f',
    stripeEnd: '#e0b33f',
    glowStart: 'rgba(45, 106, 159, 0.36)',
    glowEnd: 'rgba(224, 179, 63, 0.3)',
  },
  rusia: {
    primary: '#16345c',
    secondary: '#f8fafc',
    accent: '#9f1d2f',
    stripeStart: '#f8fafc',
    stripeMiddle: '#244f9e',
    stripeEnd: '#b91c1c',
    glowStart: 'rgba(36, 79, 158, 0.3)',
    glowEnd: 'rgba(185, 28, 28, 0.24)',
  },
};

/**
 * Obtiene la imagen hero para un país
 */
function getHeroImage(slug: string): string | undefined {
  return heroImageMap[slug];
}

/**
 * Obtiene el copy editorial para el hero de un país
 */
function getHeroCopy(slug: string): string | undefined {
  return heroCopyBySlug[slug];
}

function getHeroFallbackCopy(slug?: string): string {
  if (slug && heroFallbackCopyBySlug[slug]) {
    return heroFallbackCopyBySlug[slug];
  }

  return 'Un destino en preparación para viajeros curiosos. Muy pronto reuniremos rutas, lugares y consejos para descubrirlo con calma.';
}

/**
 * Verifica si un país tiene imagen hero disponible
 */
function hasHeroImage(slug: string): boolean {
  return slug in heroImageMap;
}

function getHeroFallbackStyle(slug?: string): CSSProperties | undefined {
  if (!slug) {
    return undefined;
  }

  const palette = heroFallbackPalettesBySlug[slug];
  if (!palette) {
    return undefined;
  }

  return {
    '--country-hero-primary': palette.primary,
    '--country-hero-secondary': palette.secondary,
    '--country-hero-accent': palette.accent,
    '--country-hero-stripe-start': palette.stripeStart,
    '--country-hero-stripe-middle': palette.stripeMiddle,
    '--country-hero-stripe-end': palette.stripeEnd,
    '--country-hero-glow-start': palette.glowStart,
    '--country-hero-glow-end': palette.glowEnd,
  } as CSSProperties;
}

function getHeroContributionNote(name: string): string {
  return `¿Tienes una foto que represente ${name}? Puedes proponerla como foto de encabezado para revisión.`;
}

function getHeroPhotoShareHref(countrySlug: string): string {
  return `/compartir?tipo=hero_photo&pais=${encodeURIComponent(countrySlug)}`;
}

// Países con mapa interno local implementado
const COUNTRIES_WITH_LOCAL_MAP = ['espana'];
const SPAIN_LOCAL_MAP_URL = '/maps/countries/spain/spain-adm2.topojson';
const DEFAULT_MAP_ATTRIBUTION = 'Datos cartográficos: geoBoundaries (CC BY 4.0)';

// Estados del mapa para UI
type MapAssetState = 
  | { status: 'loading' }
  | { status: 'ready'; asset: CountryMapAsset; publicUrl: string }
  | { status: 'missing' }
  | { status: 'queued' }
  | { status: 'generating' }
  | { status: 'failed'; errorMessage?: string };

type ResolvedCountryScreenState = {
  countrySlug: string;
  mode: ExperienceMode;
  data: ResolvedCountryScreenData;
};

/**
 * CountryPage - Nivel País / Mapa y Zonas como punto de entrada
 * 
 * Muestra un hero cinematográfico del país con el mapa como experiencia principal.
 * NO es un catálogo genérico de ciudades (eso no escala para países grandes).
 * Las ciudades/lugares concretos viven en Zona → Ciudad → Aventura.
 *
 * Jerarquía operativa: País -> Mapa -> Zona -> Ciudad -> Aventura.
 * Las variantes visuales deben conservar el flujo de datos y navegación.
 */
export function CountryPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const { mode } = useExperienceMode();
  const normalizedCountrySlug = countrySlug?.trim().toLowerCase();
  const fallbackScreenData = normalizedCountrySlug
    ? getCountryScreenFallbackData(normalizedCountrySlug, mode)
    : undefined;
  const [resolvedScreenState, setResolvedScreenState] =
    useState<ResolvedCountryScreenState | null>(null);
  const screenData =
    resolvedScreenState &&
    resolvedScreenState.countrySlug === normalizedCountrySlug &&
    resolvedScreenState.mode === mode
      ? resolvedScreenState.data
      : fallbackScreenData;
  const resolvedEditorial = screenData?.editorial;
  const screenCountry = screenData?.country;
  const countryPromotions = screenData?.countryPromotions ?? [];
  
  // Estado para el asset del mapa (DA-030)
  const [mapState, setMapState] = useState<MapAssetState>({ status: 'loading' });
  
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // TAREA 1: Scroll al inicio al entrar o cambiar de país
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [countrySlug]);

  useEffect(() => {
    if (!normalizedCountrySlug) {
      setResolvedScreenState(null);
      return;
    }

    let isMounted = true;

    const loadCountryScreenData = async () => {
      const resolvedScreenData = await getResolvedCountryScreenData(normalizedCountrySlug, mode);

      if (!isMounted) {
        return;
      }

      setResolvedScreenState({
        countrySlug: normalizedCountrySlug,
        mode,
        data: resolvedScreenData,
      });
    };

    loadCountryScreenData();

    return () => {
      isMounted = false;
    };
  }, [normalizedCountrySlug, mode]);
  
  // Datos agregados heredados, servidos ahora por la fachada de pantalla.
  const { 
    country,
    activeCities,
    comingSoonCities,
    featuredDestinations,
    publishedDestinationsCount,
    totalCitiesCount,
  } = screenData?.pageData || {
    country: null,
    activeCities: [],
    comingSoonCities: [],
    featuredDestinations: [],
    publishedDestinationsCount: 0,
    totalCitiesCount: 0,
  };
  const preferredAdminLevel = screenData?.mapStatus.preferredAdminLevel || 'ADM1';
  const countryIsoAlpha3 = screenData?.isoAlpha3;

  const handleZoneSelect = useCallback((zone: { name: string; slug: string }) => {
    if (!countrySlug) {
      return;
    }

    navigate(`/pais/${countrySlug}/zona/${zone.slug}`, {
      state: {
        zoneName: zone.name,
        countryName: screenData?.countryName || 'este país',
      },
    });
  }, [countrySlug, navigate, screenData?.countryName]);

  // Efecto para consultar estado del mapa en Supabase
  useEffect(() => {
    // Solo consultar si no es España (España usa asset local)
    if (!countrySlug || COUNTRIES_WITH_LOCAL_MAP.includes(countrySlug)) {
      setMapState({ status: 'loading' }); // España no consulta Supabase para mapa
      return;
    }

    let isMounted = true;

    const checkMapAsset = async () => {
      if (!isMounted) return;
      
      setMapState({ status: 'loading' });
      
      let asset: CountryMapAsset | null;

      try {
        asset = await getCountryMapAsset(countrySlug, preferredAdminLevel);
      } catch (err) {
        if (!isMounted) return;

        const errorMsg = err instanceof Error ? err.message : 'Error desconocido consultando el mapa';
        if (import.meta.env.DEV) {
          console.error('[CountryPage] country_map_assets query error', err);
        }
        setMapState({ status: 'failed', errorMessage: errorMsg });
        return;
      }
      
      if (!isMounted) return;

      if (!asset) {
        // No existe registro: mostrar CTA para solicitar generación.
        setMapState({ status: 'missing' });
        return;
      }

      // Asset existe: verificar estado
      switch (asset.status) {
        case 'ready': {
          const publicUrl = getCountryMapPublicUrl(asset);
          if (publicUrl) {
            setMapState({ status: 'ready', asset, publicUrl });
          } else {
            setMapState({ status: 'failed', errorMessage: 'No se pudo obtener URL del mapa' });
          }
          break;
        }
        case 'queued':
        case 'generating':
          setMapState({ status: asset.status });
          break;
        case 'failed':
          setMapState({ status: 'failed', errorMessage: asset.errorMessage });
          break;
        case 'missing':
        default:
          setMapState({ status: 'missing' });
          break;
      }
    };

    checkMapAsset();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [
    countrySlug,
    country?.displayName,
    country?.isoAlpha2,
    countryIsoAlpha3,
    screenData?.countryName,
    screenData?.isoAlpha2,
    preferredAdminLevel,
  ]);

  // Polling cuando el estado es queued o generating
  useEffect(() => {
    // Limpiar intervalo anterior
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Solo hacer polling si estamos en queued o generating
    if (mapState.status !== 'queued' && mapState.status !== 'generating') {
      return;
    }

    // Configurar polling cada 8 segundos
    pollingIntervalRef.current = setInterval(async () => {
      if (!countrySlug || COUNTRIES_WITH_LOCAL_MAP.includes(countrySlug)) return;
      
      let asset: CountryMapAsset | null;

      try {
        asset = await getCountryMapAsset(countrySlug, preferredAdminLevel);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido consultando el mapa';
        if (import.meta.env.DEV) {
          console.error('[CountryPage] country_map_assets polling error', err);
        }
        setMapState({ status: 'failed', errorMessage: errorMsg });
        return;
      }
      
      if (!asset) {
        setMapState({ status: 'failed', errorMessage: 'Registro no encontrado durante polling' });
        return;
      }

      switch (asset.status) {
        case 'ready': {
          const publicUrl = getCountryMapPublicUrl(asset);
          if (publicUrl) {
            setMapState({ status: 'ready', asset, publicUrl });
          } else {
            setMapState({ status: 'failed', errorMessage: 'No se pudo obtener URL del mapa' });
          }
          break;
        }
        case 'failed':
          setMapState({ status: 'failed', errorMessage: asset.errorMessage });
          break;
        case 'queued':
        case 'generating':
          // Mantener estado actual, seguir haciendo polling
          break;
        default:
          setMapState({ status: 'missing' });
          break;
      }
    }, 8000); // 8 segundos

    // Cleanup al desmontar o cambiar estado
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [mapState.status, countrySlug, preferredAdminLevel]);

  // Handler para reintentar generación
  // Usa la fachada de pantalla como fuente de datos mínimos cuando no hay contenido editorial.
  const handleRetryGeneration = async () => {
    if (!normalizedCountrySlug || COUNTRIES_WITH_LOCAL_MAP.includes(normalizedCountrySlug)) return;
    
    setMapState({ status: 'loading' });
    
    // Resolver datos del país desde worldCountries como fuente canónica de ISO.
    const countryData = screenCountry || country;
    
    if (!countryData) {
      console.error('[CountryPage] No se pudieron resolver datos del país:', countrySlug);
      setMapState({ status: 'failed', errorMessage: 'No se pudieron resolver datos del país' });
      return;
    }
    
    // Construir payload completo según especificación DA-030
    const payload = {
      countrySlug: normalizedCountrySlug,
      countryName: countryData.displayName,
      isoAlpha2: countryData.isoAlpha2,
      isoAlpha3: 'isoAlpha3' in countryData ? countryData.isoAlpha3 : undefined,
      adminLevel: preferredAdminLevel,
      source: 'world_map'
    };
    
    if (import.meta.env.DEV) {
      console.info('[CountryPage] request-country-map payload', payload);
    }
    
    const result = await requestCountryMapGeneration(payload);
    
    if (import.meta.env.DEV) {
      console.info('[CountryPage] request-country-map response', result);
    }
    
    if (result.success) {
      setMapState({ 
        status: result.status === 'queued' || result.status === 'generating' 
          ? result.status 
          : 'queued' 
      });
    } else {
      if (import.meta.env.DEV) {
        console.error('[CountryPage] request-country-map error', result);
      }
      setMapState({ status: 'failed', errorMessage: result.error });
    }
  };
  
  // Si no hay país editorial pero existe en worldCountries, mostrar vista "Descubriendo"
  if (!country && screenCountry?.isFromWorldCatalog) {
    return (
      <DiscoveringCountryView 
        country={screenCountry} 
        mapState={mapState}
        onRetryGeneration={handleRetryGeneration}
        onZoneSelect={handleZoneSelect}
        mode={mode}
        editorial={resolvedEditorial}
        countryPromotions={countryPromotions}
      />
    );
  }
  
  // País no encontrado ni en contenido editorial ni en worldCountries
  if (!country) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>País no encontrado</h1>
          <p>El país "{countrySlug}" no existe en nuestra base de datos.</p>
          <Link to="/" className={styles.backLink}>
            ← Volver al mapa
          </Link>
        </div>
      </div>
    );
  }

  // Descripción del país según modo de experiencia
  const getEditorialDescription = () => {
    return country.shortDescription || null;
  };

  const description = getEditorialDescription();

  // Estado editorial
  const statusLabel = getStatusLabel(country.status);
  const showStatusWarning = country.status !== 'active';

  // Determinar si mostrar mapa interno local (España)
  const hasLocalMap = normalizedCountrySlug ? COUNTRIES_WITH_LOCAL_MAP.includes(normalizedCountrySlug) : false;

  // Renderizar componente de mapa según estado
  const renderMapSection = () => {
    // España usa el asset local con el mismo render genérico que Storage.
    if (hasLocalMap) {
      return (
        <section className={styles.mapSection} aria-labelledby="map-title">
          <div className={styles.sectionHeader}>
            <h2 id="map-title" className={styles.sectionTitle}>
              Explora en el mapa
            </h2>
            <p className={styles.sectionSubtitle}>
              Elige una zona para descubrir o estrenar aventuras.
            </p>
          </div>
          <CountryInternalMap
            assetUrl={SPAIN_LOCAL_MAP_URL}
            countryName={country.displayName}
            attribution={DEFAULT_MAP_ATTRIBUTION}
            onZoneSelect={handleZoneSelect}
          />
          <MapFutureBlock countryName={country.displayName} />
        </section>
      );
    }

    // No mostrar sección de mapa para países sin mapa local
    // (El sistema de mapas automáticos se muestra en una sección separada abajo)
    return null;
  };

  // Renderizar estado del mapa automático (para países que no son España)
  const renderAutoMapStatus = () => {
    // No mostrar para España (ya tiene asset local)
    if (hasLocalMap) return null;

    switch (mapState.status) {
      case 'loading':
        return (
          <section className={styles.mapSection} aria-labelledby="map-status-title">
            <div className={styles.mapLoadingState}>
              <span className={styles.mapLoadingIcon}>🗺️</span>
              <h3 id="map-status-title">Consultando disponibilidad del mapa...</h3>
              <p>Estamos verificando si tenemos el mapa de {country.displayName}</p>
            </div>
          </section>
        );

      case 'ready':
        return (
          <section className={styles.mapSection} aria-labelledby="map-ready-title">
            <div className={styles.sectionHeader}>
              <h2 id="map-ready-title" className={styles.sectionTitle}>
                Explora en el mapa
              </h2>
              <p className={styles.sectionSubtitle}>
                Elige una zona para descubrir o estrenar aventuras.
              </p>
            </div>
            <CountryInternalMap
              assetUrl={mapState.publicUrl}
              countryName={country.displayName}
              attribution={mapState.asset.attribution || DEFAULT_MAP_ATTRIBUTION}
              onZoneSelect={handleZoneSelect}
            />
            <MapFutureBlock countryName={country.displayName} />
          </section>
        );

      case 'queued':
      case 'generating':
        return (
          <section className={styles.mapSection} aria-labelledby="map-preparing-title">
            <div className={styles.mapPreparingState}>
              <span className={styles.mapPreparingIcon}>⚙️</span>
              <h3 id="map-preparing-title">Preparando tu mapa</h3>
              <p>
                Estamos preparando el mapa de {country.displayName}. 
                Esto puede tardar un momento la primera vez.
              </p>
              <div className={styles.mapProgressIndicator}>
                <div className={styles.mapProgressBar} />
              </div>
            </div>
          </section>
        );

      case 'failed':
        return (
          <section className={styles.mapSection} aria-labelledby="map-error-title">
            <div className={styles.mapErrorState}>
              <span className={styles.mapErrorIcon}>⚠️</span>
              <h3 id="map-error-title">No pudimos preparar el mapa</h3>
              <p>
                Hubo un problema al generar el mapa de {country.displayName}.
                {mapState.errorMessage && (
                  <span className={styles.errorDetail}>{mapState.errorMessage}</span>
                )}
              </p>
              <button 
                onClick={handleRetryGeneration}
                className={styles.retryButton}
              >
                Reintentar
              </button>
            </div>
          </section>
        );

      case 'missing':
      default:
        return (
          <section className={styles.mapSection} aria-labelledby="map-missing-title">
            <div className={styles.mapMissingState}>
              <span className={styles.mapMissingIcon}>🗺️</span>
              <h3 id="map-missing-title">Mapa no disponible aún</h3>
              <p>
                Solicita el mapa de {country.displayName} para explorarlo visualmente.
              </p>
              <button 
                onClick={handleRetryGeneration}
                className={styles.requestMapButton}
              >
                Explorar {country.displayName}
              </button>
            </div>
          </section>
        );
    }
  };

  // Helper para obtener descripción del país según modo
  const getCountryDescriptionByMode = (): string => {
    const baseText = country.shortDescription 
      ? (typeof country.shortDescription === 'string' 
          ? country.shortDescription 
          : getLocalizedText(country.shortDescription, 'es'))
      : null;
    
    if (mode === 'adventure') {
      return baseText || `Descubre ${country.displayName} con una mirada de aventurero. Explora sus rincones, vive experiencias únicas y conecta con la esencia de este destino.`;
    }
    return baseText || `Explora ${country.displayName} desde una perspectiva cultural y educativa. Descubre su historia, tradiciones y patrimonio.`;
  };

  // Combinar ciudades para mostrar (activas primero, luego comingSoon)
  // Máximo 4: son puntos de entrada al mapa, no catálogo nacional
  const citiesToShow = [...activeCities, ...comingSoonCities].slice(0, 4);

  // Determinar si hay imagen hero para este país
  const countryHasHeroImage = Boolean(screenData?.hero.source === 'localAsset' && screenData.hero.imageUrl);
  const heroImageUrl = screenData?.hero.imageUrl;
  const heroCopy = normalizedCountrySlug ? getHeroCopy(normalizedCountrySlug) : undefined;
  const heroFallbackCopy = getHeroFallbackCopy(normalizedCountrySlug);
  const heroStyle = countryHasHeroImage && heroImageUrl
    ? { backgroundImage: `url(${heroImageUrl})` }
    : getHeroFallbackStyle(countrySlug);

  return (
    <div className={styles.container}>
      {/* Hero del País - Cinematográfico con imagen fotográfica si existe */}
      <header 
        className={`${styles.hero} ${countryHasHeroImage ? styles.heroWithImage : styles.heroFallback}`}
        style={heroStyle}
        aria-label={
          countryHasHeroImage
            ? screenData?.hero.imageAlt || `Imagen panorámica de ${country.displayName}`
            : screenData?.hero.imageAlt || `Portada temporal del país ${country.displayName}`
        }
      >
        {/* Overlay oscuro cuando hay imagen para legibilidad */}
        {countryHasHeroImage && <div className={styles.heroOverlay} aria-hidden="true" />}
        
        {/* Breadcrumb flotante sobre el hero */}
        <nav className={`${styles.breadcrumb} ${countryHasHeroImage ? styles.breadcrumbOnImage : ''}`} aria-label="Navegación">
          <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">
            {country.displayName}
          </span>
        </nav>

        <div className={`${styles.heroContent} ${countryHasHeroImage ? styles.heroContentOnImage : styles.heroContentFallback}`}>
          <div className={`${styles.heroFlag} ${countryHasHeroImage ? styles.heroFlagOnImage : styles.heroFlagFallback}`}>
            <CountryFlag
              isoAlpha2={country.isoAlpha2}
              countryName={country.displayName}
              size="large"
            />
          </div>
          
          <div className={styles.heroText}>
            <div className={styles.heroMeta}>
              {country.featured && (
                <span className={`${styles.featuredBadge} ${countryHasHeroImage ? styles.featuredBadgeOnImage : ''}`}>⭐ Destacado</span>
              )}
              {showStatusWarning && (
                <span className={`${styles.statusBadge} ${styles[country.status]}`}>
                  {statusLabel}
                </span>
              )}
              <span className={`${styles.modeBadge} ${countryHasHeroImage ? styles.modeBadgeOnImage : ''}`}>
                {mode === 'adventure' ? '🎒 Aventura' : '🎓 Estudiante'}
              </span>
              <span className={`${styles.continentBadge} ${countryHasHeroImage ? styles.continentBadgeOnImage : ''}`}>
                {getContinentLabel(country.continent)}
              </span>
            </div>
            
            <h1 className={`${styles.heroTitle} ${countryHasHeroImage ? styles.heroTitleOnImage : styles.heroTitleFallback}`}>
              {country.displayName}
            </h1>
            
            <p className={`${styles.heroLocation} ${countryHasHeroImage ? styles.heroLocationOnImage : ''}`}>
              📍 {countryHasHeroImage
                ? heroCopy || (country.capital ? `Capital: ${country.capital}` : 'Por descubrir')
                : heroFallbackCopy}
            </p>

            {description && !heroCopy && (
              <p className={styles.heroDescription}>{description}</p>
            )}
          </div>
        </div>

        {/* Aviso editorial si no está activo */}
        {showStatusWarning && (
          <div className={`${styles.statusAlert} ${styles[country.status]}`} role="alert">
            <span className={styles.statusIcon}>📝</span>
            <div>
              <strong>{statusLabel}</strong>
              <p>Este país está en preparación. Algunas ciudades pueden no estar disponibles.</p>
            </div>
          </div>
        )}
      </header>

      <main className={styles.main}>
        {/* Bloque editorial: Por qué explorar - PRIMERO para máxima visibilidad */}
        <CountryEditorialSection 
          countryDisplayName={country.displayName}
          mode={mode}
          editorial={resolvedEditorial}
          fallbackDescription={getCountryDescriptionByMode()}
          publishedDestinationsCount={publishedDestinationsCount}
          totalCitiesCount={totalCitiesCount}
        />

        <MonetizationSlot
          placement="country-after-editorial"
          promotions={countryPromotions}
        />

        {/* Sección de mapa automático (para países que no son España) */}
        {!hasLocalMap && renderAutoMapStatus()}

        {/* Sección Principal: Mapa Interno Local (solo España) */}
        {renderMapSection()}

        {/* Sección: Zonas de entrada (antes "Ciudades destacadas") */}
        {citiesToShow.length > 0 && (
          <section className={styles.citiesSection} aria-labelledby="cities-title">
            <div className={styles.sectionHeader}>
              <h2 id="cities-title" className={styles.sectionTitle}>
                Zonas de entrada
              </h2>
              <p className={styles.sectionSubtitle}>
                Explora el mapa para descubrir más. Cada zona contiene ciudades, lugares y aventuras.
              </p>
            </div>
            <div className={styles.citiesGrid}>
              {citiesToShow.map((city) => (
                <CityCard 
                  key={city.slug} 
                  city={city} 
                  countrySlug={countrySlug || ''}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sección: Aventuras destacadas */}
        {featuredDestinations.length > 0 && (
          <section className={styles.adventuresSection} aria-labelledby="adventures-title">
            <div className={styles.sectionHeader}>
              <h2 id="adventures-title" className={styles.sectionTitle}>
                Aventuras destacadas
              </h2>
              <p className={styles.sectionSubtitle}>
                Experiencias únicas seleccionadas para ti
              </p>
            </div>
            <div className={styles.adventuresGrid}>
              {featuredDestinations.slice(0, 6).map((destination) => (
                <DestinationCard 
                  key={destination.id} 
                  destination={destination}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sección: Estado vacío si no hay contenido */}
        {citiesToShow.length === 0 && featuredDestinations.length === 0 && (
          <section className={styles.emptySection} aria-labelledby="empty-title">
            <div className={styles.emptyContent}>
              <h2 id="empty-title" className={styles.emptyTitle}>
                Explora el mapa de {country.displayName}
              </h2>
              <p className={styles.emptyText}>
                Usa el mapa para navegar por zonas y descubrir aventuras. 
                Los lugares concretos aparecen dentro de cada zona.
              </p>
            </div>
          </section>
        )}

        {/* CTA: Participación de usuarios */}
        <section className={styles.ctaSection} aria-labelledby="cta-title">
          <div className={styles.ctaContent}>
            <h2 id="cta-title" className={styles.ctaTitle}>
              ¿Conoces un plan en {country.displayName}?
            </h2>
            <p className={styles.ctaText}>
              Comparte una aventura, evento o lugar especial.
              Cada recomendación se revisa antes de publicarse.
            </p>
            <div className={styles.ctaActions}>
              <Link 
                to={countrySlug ? `/pais/${countrySlug}` : '/'} 
                className={styles.ctaButtonPrimary}
              >
                Explora una zona para compartir
              </Link>
              <span className={styles.ctaNote}>
                Muy pronto podrás enviar recomendaciones directamente desde esta página.
              </span>
            </div>
          </div>
        </section>

        <HeroContributionBlock
          countryName={country.displayName}
          shareHref={getHeroPhotoShareHref(country.slug)}
        />
      </main>
    </div>
  );
}

/** Obtiene label legible del estado del país */
function getStatusLabel(status: CountryStatus): string {
  const labels: Record<CountryStatus, string> = {
    active: 'Disponible',
    comingSoon: 'Próximamente',
    disabled: 'No disponible',
  };
  return labels[status] || status;
}

/** Obtiene label legible del continente */
function getContinentLabel(continent: string): string {
  const labels: Record<string, string> = {
    africa: 'África',
    america: 'América',
    asia: 'Asia',
    europe: 'Europa',
    oceania: 'Oceanía',
  };
  return labels[continent] || continent;
}

/**
 * Vista para países sin contenido editorial pero que existen en worldCountries
 * Muestra una página amable de "descubrimiento" con estado del mapa.
 * Si existe contenido editorial en countryEditorial.ts, se muestra también.
 */
interface DiscoveringCountryViewProps {
  country: ScreenCountrySummary;
  mapState: MapAssetState;
  onRetryGeneration: () => void;
  onZoneSelect: (zone: { name: string; slug: string }) => void;
  mode?: ExperienceMode;
  editorial?: ScreenEditorialData;
  countryPromotions?: Promotion[];
}

function DiscoveringCountryView({
  country,
  mapState,
  onRetryGeneration,
  onZoneSelect,
  mode = 'adventure',
  editorial,
  countryPromotions,
}: DiscoveringCountryViewProps) {
  // Verificar si existe contenido editorial publicado para este país (ej: México, Italia, Rusia)
  const hasEditorial = editorial?.status === 'published';
  // Aplicar hero fotográfico también en vista de descubrimiento
  const countryHasHeroImage = hasHeroImage(country.slug);
  const heroImageUrl = getHeroImage(country.slug);
  const heroCopy = getHeroCopy(country.slug);
  const heroFallbackCopy = getHeroFallbackCopy(country.slug);
  const heroStyle = countryHasHeroImage && heroImageUrl
    ? { backgroundImage: `url(${heroImageUrl})` }
    : getHeroFallbackStyle(country.slug);

  return (
    <div className={styles.container}>
      <header 
        className={`${styles.hero} ${countryHasHeroImage ? styles.heroWithImage : styles.heroFallback}`}
        style={heroStyle}
        aria-label={
          countryHasHeroImage
            ? `Imagen panorámica de ${country.displayName}`
            : `Portada temporal del país ${country.displayName}`
        }
      >
        {/* Overlay oscuro cuando hay imagen para legibilidad */}
        {countryHasHeroImage && <div className={styles.heroOverlay} aria-hidden="true" />}
        
        <nav className={`${styles.breadcrumb} ${countryHasHeroImage ? styles.breadcrumbOnImage : ''}`} aria-label="Navegación">
          <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">
            {country.displayName}
          </span>
        </nav>

        <div className={`${styles.heroContent} ${countryHasHeroImage ? styles.heroContentOnImage : styles.heroContentFallback}`}>
          <div className={`${styles.heroFlag} ${countryHasHeroImage ? styles.heroFlagOnImage : styles.heroFlagFallback}`}>
            <CountryFlag
              isoAlpha2={country.isoAlpha2}
              countryName={country.displayName}
              size="large"
            />
          </div>
          
          <div className={styles.heroText}>
            <h1 className={`${styles.heroTitle} ${countryHasHeroImage ? styles.heroTitleOnImage : styles.heroTitleFallback}`}>
              {country.displayName}
            </h1>
            <p className={`${styles.heroLocation} ${countryHasHeroImage ? styles.heroLocationOnImage : ''}`}>
              📍 {countryHasHeroImage ? heroCopy || 'Estamos preparando este destino' : heroFallbackCopy}
            </p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Bloque editorial para países en modo "Descubriendo" (ej: México, Italia, Rusia) */}
        {hasEditorial && editorial && (
          <section className={styles.editorialSection} aria-labelledby="discovering-editorial-title">
            <div className={styles.sectionHeader}>
              <h2 id="discovering-editorial-title" className={styles.sectionTitle}>
                {editorial.headline}
              </h2>
              <p className={styles.sectionSubtitle}>
                {mode === 'adventure' 
                  ? 'Vive la aventura de descubrir algo nuevo cada día' 
                  : 'Aprende y conecta con la cultura y el patrimonio'}
              </p>
            </div>
            
            <div className={styles.editorialContent}>
              <p className={styles.editorialText}>{editorial.intro}</p>
              
              <div className={styles.editorialBlock}>
                <h3 className={styles.editorialBlockTitle}>
                  {mode === 'adventure' ? 'Qué hace especial este destino' : 'Qué observar para entender este país'}
                </h3>
                <p className={styles.editorialBlockText}>{editorial.whatMakesSpecial}</p>
              </div>
              
              <div className={styles.editorialBlock}>
                <h3 className={styles.editorialBlockTitle}>
                  {mode === 'adventure' ? 'Ideas para explorar' : 'Claves de contexto'}
                </h3>
                <ul className={styles.editorialList}>
                  {editorial.highlights.map((idea, index) => (
                    <li key={index} className={styles.editorialListItem}>{idea}</li>
                  ))}
                </ul>
              </div>
              
              <div className={styles.editorialBlock}>
                <h3 className={styles.editorialBlockTitle}>
                  {mode === 'adventure' ? 'Ruta sugerida' : 'Ruta de aprendizaje'}
                </h3>
                <p className={styles.editorialBlockText}>{editorial.suggestedRoute}</p>
              </div>
              
              <div className={styles.editorialTip}>
                <span className={styles.editorialTipIcon}>💡</span>
                <p className={styles.editorialTipText}>{editorial.practicalTips}</p>
              </div>
            </div>
          </section>
        )}

        <MonetizationSlot
          placement="country-after-editorial"
          promotions={countryPromotions}
        />

        <section className={styles.discoveringSection}>
          <div className={styles.discoveringContent}>
            <h2 className={styles.discoveringTitle}>
              {mapState.status === 'ready' ? '🗺️ Mapa disponible' : '🌍 Descubriendo destino'}
            </h2>
            
            {mapState.status === 'loading' && (
              <div className={styles.discoveringState}>
                <p>Consultando disponibilidad del mapa...</p>
                <div className={styles.mapProgressIndicator}>
                  <div className={styles.mapProgressBar} style={{ width: '30%' }} />
                </div>
              </div>
            )}

            {mapState.status === 'queued' || mapState.status === 'generating' ? (
              <div className={styles.discoveringState}>
                <h3 className={styles.discoveringStateTitle}>
                  Gracias, hemos registrado tu interés en {country.displayName}
                </h3>
                <p className={styles.discoveringStateText}>
                  Este destino todavía no está publicado, pero tu visita nos ayuda a darle prioridad. 
                  Nuestro equipo revisará el mapa y el contenido para prepararlo correctamente.
                </p>
                <p className={styles.discoveringStateSecondary}>
                  Vuelve pronto para descubrir {country.displayName} con rutas, 
                  zonas recomendadas y aventuras seleccionadas.
                </p>
                <div className={styles.discoveringActions}>
                  <Link to="/" className={styles.backLink}>
                    ← Explorar otros destinos
                  </Link>
                </div>
              </div>
            ) : null}

            {mapState.status === 'ready' && (
              <div className={styles.discoveringState}>
                <CountryInternalMap
                  assetUrl={mapState.publicUrl}
                  countryName={country.displayName}
                  attribution={mapState.asset.attribution || DEFAULT_MAP_ATTRIBUTION}
                  onZoneSelect={onZoneSelect}
                />
                <MapFutureBlock countryName={country.displayName} />
              </div>
            )}

            {mapState.status === 'missing' && (
              <div className={styles.discoveringState}>
                <h3 className={styles.discoveringStateTitle}>
                  {country.displayName} todavía está en preparación
                </h3>
                <p className={styles.discoveringStateText}>
                  Tu interés nos ayuda a saber qué destinos preparar antes. 
                  Registraremos esta visita para priorizar {country.displayName} en nuestra hoja de ruta.
                </p>
                <p className={styles.discoveringStateSecondary}>
                  Mientras lo dejamos listo, puedes explorar otros destinos disponibles 
                  o volver pronto para descubrir nuevas rutas, zonas y aventuras.
                </p>
                <div className={styles.discoveringActions}>
                  <button 
                    onClick={onRetryGeneration}
                    className={styles.requestMapButton}
                  >
                    Quiero que se prepare {country.displayName}
                  </button>
                  <Link to="/" className={styles.backLink}>
                    ← Explorar otros destinos
                  </Link>
                </div>
              </div>
            )}

            {mapState.status === 'failed' && (
              <div className={styles.discoveringState}>
                <h3 className={styles.discoveringStateTitle}>
                  {country.displayName} todavía no está listo
                </h3>
                <p className={styles.discoveringStateText}>
                  Hemos detectado que este destino necesita revisión antes de publicarse. 
                  Gracias por tu interés: nos ayuda a saber qué lugares debemos preparar primero.
                </p>
                <div className={styles.discoveringActions}>
                  <Link to="/" className={styles.backLink}>
                    ← Explorar otros destinos
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <HeroContributionBlock
          countryName={country.displayName}
          shareHref={getHeroPhotoShareHref(country.slug)}
        />
      </main>
    </div>
  );
}

function HeroContributionBlock({
  countryName,
  shareHref,
}: {
  countryName: string;
  shareHref: string;
}) {
  return (
    <aside className={styles.heroContributionCard} aria-label={`Colabora con una foto de ${countryName}`}>
      <span className={styles.heroContributionIcon} aria-hidden="true">📷</span>
      <div>
        <h2 className={styles.heroContributionTitle}>¿Tienes una foto que represente este lugar?</h2>
        <p className={styles.heroContributionText}>{getHeroContributionNote(countryName)}</p>
        <div className={styles.heroContributionActions}>
          <Link to={shareHref} className={styles.heroContributionButton}>
            Proponer foto
          </Link>
          <span className={styles.heroContributionReviewText}>
            Se revisará antes de publicarse.
          </span>
        </div>
      </div>
    </aside>
  );
}

/**
 * Componente para mostrar una ciudad en la lista
 */
interface CityCardProps {
  city: City;
  countrySlug: string;
}

function CityCard({ city, countrySlug }: CityCardProps) {
  const cityName = typeof city.name === 'string' ? city.name : getLocalizedText(city.name, 'es') || city.slug;
  const isActive = city.status === 'active';
  const description = city.shortDescription 
    ? (typeof city.shortDescription === 'string' 
        ? city.shortDescription 
        : getLocalizedText(city.shortDescription, 'es'))
    : null;

  return (
    <article className={styles.cityCard}>
      {isActive ? (
        <Link to={`/pais/${countrySlug}/${city.slug}`} className={styles.cityCardLink}>
          <div className={styles.cityCardContent}>
            <div className={styles.cityCardHeader}>
              <h3 className={styles.cityCardTitle}>{cityName}</h3>
              {city.featured && <span className={styles.cityCardBadge}>⭐</span>}
            </div>
            {description && (
              <p className={styles.cityCardDescription}>{description}</p>
            )}
            <span className={styles.cityCardAction}>
              Explorar →
            </span>
          </div>
        </Link>
      ) : (
        <div className={`${styles.cityCardContent} ${styles.cityCardInactive}`}>
          <div className={styles.cityCardHeader}>
            <h3 className={styles.cityCardTitle}>{cityName}</h3>
            <span className={styles.cityCardComingSoon}>Próximamente</span>
          </div>
          {description && (
            <p className={styles.cityCardDescription}>{description}</p>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Componente para mostrar un destino/aventura destacada
 */
interface DestinationCardProps {
  destination: Destination;
}

function DestinationCard({ destination }: DestinationCardProps) {
  const title = getDestinationTitle(destination);
  const summary = getDestinationSummary(destination);

  return (
    <article className={styles.adventureCard}>
      <Link 
        to={`/aventura/${destination.slug}`} 
        className={styles.adventureCardLink}
      >
        <div className={styles.adventureCardContent}>
          <div className={styles.adventureCardHeader}>
            <h3 className={styles.adventureCardTitle}>{title}</h3>
            {destination.featured && <span className={styles.adventureCardBadge}>⭐</span>}
          </div>
          {destination.type && (
            <span className={styles.adventureCardType}>
              {getDestinationTypeLabel(destination.type)}
            </span>
          )}
          {summary && (
            <p className={styles.adventureCardSummary}>{summary}</p>
          )}
          {destination.estimatedVisitTime && (
            <span className={styles.adventureCardMeta}>
              ⏱️ {destination.estimatedVisitTime}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}

/** Helper para obtener label legible del tipo de destino */
function getDestinationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    monument: 'Monumento',
    museum: 'Museo',
    nature: 'Naturaleza',
    experience: 'Experiencia',
    food: 'Gastronomía',
    hiddenGem: 'Joya escondida',
    temple: 'Templo',
    park: 'Parque',
    landmark: 'Punto de interés',
    cultural: 'Cultural',
  };
  return labels[type] || type;
}

/**
 * Componente para renderizar el contenido editorial específico por país y modo
 */
interface CountryEditorialSectionProps {
  countryDisplayName: string;
  mode: ExperienceMode;
  editorial?: ScreenEditorialData;
  fallbackDescription: string;
  publishedDestinationsCount: number;
  totalCitiesCount: number;
}

function CountryEditorialSection({
  countryDisplayName,
  mode,
  editorial,
  fallbackDescription,
  publishedDestinationsCount,
  totalCitiesCount,
}: CountryEditorialSectionProps) {
  // Si no hay contenido editorial específico, usar el fallback
  if (editorial?.status !== 'published') {
    return (
      <section className={styles.editorialSection} aria-labelledby="editorial-title">
        <div className={styles.sectionHeader}>
          <h2 id="editorial-title" className={styles.sectionTitle}>
            Por qué explorar {countryDisplayName}
          </h2>
          <p className={styles.sectionSubtitle}>
            {mode === 'adventure' 
              ? 'Vive la aventura de descubrir algo nuevo cada día' 
              : 'Aprende y conecta con la cultura y el patrimonio'}
          </p>
        </div>
        <div className={styles.editorialContent}>
          <p className={styles.editorialText}>{fallbackDescription}</p>
          {publishedDestinationsCount > 0 && (
            <p className={styles.editorialStats}>
              📍 {publishedDestinationsCount} {publishedDestinationsCount === 1 ? 'aventura' : 'aventuras'} disponibles en {totalCitiesCount} {totalCitiesCount === 1 ? 'ciudad' : 'ciudades'}
            </p>
          )}
        </div>
      </section>
    );
  }

  // Renderizar contenido editorial enriquecido
  return (
    <section className={styles.editorialSection} aria-labelledby="editorial-title">
      <div className={styles.sectionHeader}>
        <h2 id="editorial-title" className={styles.sectionTitle}>
          {editorial.headline}
        </h2>
        <p className={styles.sectionSubtitle}>
          {mode === 'adventure' 
            ? 'Vive la aventura de descubrir algo nuevo cada día' 
            : 'Aprende y conecta con la cultura y el patrimonio'}
        </p>
      </div>
      
      <div className={styles.editorialContent}>
        {/* Intro */}
        <p className={styles.editorialText}>{editorial.intro}</p>
        
        {/* Qué hace especial */}
        <div className={styles.editorialBlock}>
          <h3 className={styles.editorialBlockTitle}>
            {mode === 'adventure' ? 'Qué hace especial este destino' : 'Qué observar para entender este país'}
          </h3>
          <p className={styles.editorialBlockText}>{editorial.whatMakesSpecial}</p>
        </div>
        
        {/* Ideas de exploración */}
        <div className={styles.editorialBlock}>
          <h3 className={styles.editorialBlockTitle}>
            {mode === 'adventure' ? 'Ideas para explorar' : 'Claves de contexto'}
          </h3>
          <ul className={styles.editorialList}>
            {editorial.highlights.map((idea, index) => (
              <li key={index} className={styles.editorialListItem}>{idea}</li>
            ))}
          </ul>
        </div>
        
        {/* Ruta sugerida */}
        <div className={styles.editorialBlock}>
          <h3 className={styles.editorialBlockTitle}>
            {mode === 'adventure' ? 'Ruta sugerida' : 'Ruta de aprendizaje'}
          </h3>
          <p className={styles.editorialBlockText}>{editorial.suggestedRoute}</p>
        </div>
        
        {/* Consejo rápido */}
        <div className={styles.editorialTip}>
          <span className={styles.editorialTipIcon}>💡</span>
          <p className={styles.editorialTipText}>{editorial.practicalTips}</p>
        </div>
        
        {/* Stats si hay contenido */}
        {publishedDestinationsCount > 0 && (
          <p className={styles.editorialStats}>
            📍 {publishedDestinationsCount} {publishedDestinationsCount === 1 ? 'aventura' : 'aventuras'} disponibles en {totalCitiesCount} {totalCitiesCount === 1 ? 'ciudad' : 'ciudades'}
          </p>
        )}
      </div>
    </section>
  );
}

function MapFutureBlock({ countryName }: { countryName: string }) {
  return (
    <div className={styles.mapFutureBlock}>
      <h3 className={styles.mapFutureTitle}>Explora el mapa y elige una zona</h3>
      <p className={styles.mapFutureText}>
        Cada zona de {countryName} podrá reunir aventuras de viajeros con fotos,
        rutas, consejos y experiencias. Por ahora puedes entrar en una zona y ver
        la pantalla de próxima fase.
      </p>
    </div>
  );
}
