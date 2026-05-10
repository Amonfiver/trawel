/**
 * Página de ficha de país - Nivel País / Exploración con Mapa Interno
 * 
 * Propósito: Mostrar información de país con mapa interno como pieza principal
 * de exploración, retirando tarjetas heredadas del flujo principal.
 * 
 * Alcance: 
 * - Hero visual claro del país
 * - Mapa interno interactivo homogéneo
 * - Fallback a directorio clásico para países sin mapa
 * - Mensaje futuro orientado a aventuras publicadas por viajeros
 * 
 * Decisiones técnicas:
 * - Usa getCountryPageData para obtener datos agregados
 * - CountryInternalMap como render genérico para assets TopoJSON
 * - Jerarquía visual: País → Mapa (principal) → Zona → Aventuras futuras
 * - Las rutas/datos heredados se conservan, pero sus tarjetas no dominan CountryPage
 * 
 * Cambios recientes (2026-05-02):
 * - Integración con sistema automático de mapas internos (DA-030)
 * - Estados UI: loading, ready, missing, queued/generating, failed
 * - Polling para actualización de estado de generación
 * - Vista "Próximamente" para países sin contenido editorial
 * - España usa el mismo render genérico con asset local
 * - Click en zona del mapa navega a /pais/{countrySlug}/zona/{zoneSlug}
 * - Se retiran tarjetas heredadas de ciudades/aventuras del flujo principal
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getCountryPageData } from '../../features/travelData';
import { CountryInternalMap } from '../../features/map/components/CountryInternalMap';
import { CountryFlag } from '../../features/countries';
import { getWorldCountryBySlug, type WorldCountry } from '../../features/countries/data/worldCountries';
import type { CountryStatus } from '../../features/countries/data/countries.types';
import { getPreferredAdminLevel } from '../../features/map/config/countryMapProfiles';
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
import styles from './CountryPage.module.css';

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

/**
 * CountryPage - Nivel País / Mapa y Zonas como punto de entrada
 * 
 * Muestra un hero claro del país con el mapa como experiencia principal.
 * NO es un catálogo genérico de ciudades (eso no escala para países grandes).
 * Las ciudades/lugares concretos viven en Zona → Ciudad → Aventura.
 * 
 * Jerarquía de contenido:
 * - Mapa interno (principal): zonas/provincias para explorar
 * - Zonas de entrada: máximo 4 ciudades como puntos de acceso al mapa
 * - Aventuras destacadas: experiencias del país
 * - CTA para contribución de viajeros
 * 
 * Cambios recientes (2026-05-10):
 * - Corrección de rumbo: eliminado catálogo genérico de ciudades
 * - "Zonas de entrada" reemplaza "Ciudades destacadas" (máx 4, no listado nacional)
 * - Copy del CTA más natural, sin lenguaje provisional
 * - Integración con useExperienceMode para contenido por modo
 */
export function CountryPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const worldCountry = countrySlug ? getWorldCountryBySlug(countrySlug) : undefined;
  const { mode } = useExperienceMode();
  
  // Estado para el asset del mapa (DA-030)
  const [mapState, setMapState] = useState<MapAssetState>({ status: 'loading' });
  
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Usar travelData.service para obtener datos agregados completos
  const { 
    country,
    activeCities,
    comingSoonCities,
    featuredDestinations,
    publishedDestinationsCount,
    totalCitiesCount,
  } = getCountryPageData(countrySlug || '');
  const preferredAdminLevel = countrySlug ? getPreferredAdminLevel(countrySlug) : 'ADM1';

  const handleZoneSelect = useCallback((zone: { name: string; slug: string }) => {
    if (!countrySlug) {
      return;
    }

    navigate(`/pais/${countrySlug}/zona/${zone.slug}`, {
      state: {
        zoneName: zone.name,
        countryName: country?.displayName || worldCountry?.displayName || 'este país',
      },
    });
  }, [countrySlug, country?.displayName, navigate, worldCountry?.displayName]);

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
    'isoAlpha3' in (country || {}) ? country?.isoAlpha3 : undefined,
    worldCountry?.displayName,
    worldCountry?.isoAlpha2,
    worldCountry?.isoAlpha3,
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
  // Usa worldCountry como fallback para datos mínimos cuando no hay contenido editorial
  const handleRetryGeneration = async () => {
    if (!countrySlug || COUNTRIES_WITH_LOCAL_MAP.includes(countrySlug)) return;
    
    setMapState({ status: 'loading' });
    
    // Resolver datos del país desde worldCountries como fuente canónica de ISO.
    const countryData = worldCountry || country;
    
    if (!countryData) {
      console.error('[CountryPage] No se pudieron resolver datos del país:', countrySlug);
      setMapState({ status: 'failed', errorMessage: 'No se pudieron resolver datos del país' });
      return;
    }
    
    // Construir payload completo según especificación DA-030
    const payload = {
      countrySlug,
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
  if (!country && worldCountry) {
    return (
      <DiscoveringCountryView 
        worldCountry={worldCountry} 
        mapState={mapState}
        onRetryGeneration={handleRetryGeneration}
        onZoneSelect={handleZoneSelect}
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
  const hasLocalMap = countrySlug ? COUNTRIES_WITH_LOCAL_MAP.includes(countrySlug) : false;

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
              <h3 id="map-preparing-title">Preparando mapa</h3>
              <p>
                Estamos preparando el mapa de {country.displayName}. 
                Esto puede tardar un poco la primera vez.
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
              <h3 id="map-missing-title">Mapa no disponible</h3>
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

  return (
    <div className={styles.container}>
      {/* Hero del País - Nivel principal */}
      <header className={styles.hero}>
        {/* Breadcrumb flotante sobre el hero */}
        <nav className={styles.breadcrumb} aria-label="Navegación">
          <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">
            {country.displayName}
          </span>
        </nav>

        <div className={styles.heroContent}>
          <div className={styles.heroFlag}>
            <CountryFlag
              isoAlpha2={country.isoAlpha2}
              countryName={country.displayName}
              size="large"
            />
          </div>
          
          <div className={styles.heroText}>
            <div className={styles.heroMeta}>
              {country.featured && (
                <span className={styles.featuredBadge}>⭐ Destino destacado</span>
              )}
              {showStatusWarning && (
                <span className={`${styles.statusBadge} ${styles[country.status]}`}>
                  {statusLabel}
                </span>
              )}
              <span className={styles.modeBadge}>
                {mode === 'adventure' ? '🎒 Modo Aventura' : '🎓 Modo Estudiante'}
              </span>
              <span className={styles.continentBadge}>
                {getContinentLabel(country.continent)}
              </span>
            </div>
            
            <h1 className={styles.heroTitle}>{country.displayName}</h1>
            
            <p className={styles.heroLocation}>
              📍 Capital: {country.capital || 'Por descubrir'}
            </p>

            {description && (
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
        {/* Sección de mapa automático (para países que no son España) */}
        {!hasLocalMap && renderAutoMapStatus()}

        {/* Sección Principal: Mapa Interno Local (solo España) */}
        {renderMapSection()}

        {/* Bloque editorial: Por qué explorar */}
        <section className={styles.editorialSection} aria-labelledby="editorial-title">
          <div className={styles.sectionHeader}>
            <h2 id="editorial-title" className={styles.sectionTitle}>
              Por qué explorar {country.displayName}
            </h2>
            <p className={styles.sectionSubtitle}>
              {mode === 'adventure' 
                ? 'Vive la aventura de descubrir algo nuevo cada día' 
                : 'Aprende y conecta con la cultura y el patrimonio'}
            </p>
          </div>
          <div className={styles.editorialContent}>
            <p className={styles.editorialText}>{getCountryDescriptionByMode()}</p>
            {publishedDestinationsCount > 0 && (
              <p className={styles.editorialStats}>
                📍 {publishedDestinationsCount} {publishedDestinationsCount === 1 ? 'aventura' : 'aventuras'} disponibles en {totalCitiesCount} {totalCitiesCount === 1 ? 'ciudad' : 'ciudades'}
              </p>
            )}
          </div>
        </section>

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
 * Muestra una página amable de "descubrimiento" con estado del mapa
 */
interface DiscoveringCountryViewProps {
  worldCountry: WorldCountry;
  mapState: MapAssetState;
  onRetryGeneration: () => void;
  onZoneSelect: (zone: { name: string; slug: string }) => void;
}

function DiscoveringCountryView({
  worldCountry,
  mapState,
  onRetryGeneration,
  onZoneSelect,
}: DiscoveringCountryViewProps) {
  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <nav className={styles.breadcrumb} aria-label="Navegación">
          <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">
            {worldCountry.displayName}
          </span>
        </nav>

        <div className={styles.heroContent}>
          <div className={styles.heroFlag}>
            <CountryFlag
              isoAlpha2={worldCountry.isoAlpha2}
              countryName={worldCountry.displayName}
              size="large"
            />
          </div>
          
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>{worldCountry.displayName}</h1>
            <p className={styles.heroLocation}>
              📍 Estamos preparando este destino
            </p>
          </div>
        </div>
      </header>

      <main className={styles.main}>
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
                  Gracias, hemos registrado tu interés en {worldCountry.displayName}
                </h3>
                <p className={styles.discoveringStateText}>
                  Este destino todavía no está publicado, pero tu visita nos ayuda a darle prioridad. 
                  Nuestro equipo revisará el mapa y el contenido para prepararlo correctamente.
                </p>
                <p className={styles.discoveringStateSecondary}>
                  Vuelve pronto para descubrir {worldCountry.displayName} con rutas, 
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
                  countryName={worldCountry.displayName}
                  attribution={mapState.asset.attribution || DEFAULT_MAP_ATTRIBUTION}
                  onZoneSelect={onZoneSelect}
                />
                <MapFutureBlock countryName={worldCountry.displayName} />
              </div>
            )}

            {mapState.status === 'missing' && (
              <div className={styles.discoveringState}>
                <h3 className={styles.discoveringStateTitle}>
                  {worldCountry.displayName} todavía está en preparación
                </h3>
                <p className={styles.discoveringStateText}>
                  Tu interés nos ayuda a saber qué destinos preparar antes. 
                  Registraremos esta visita para priorizar {worldCountry.displayName} en nuestra hoja de ruta.
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
                    Quiero que se prepare {worldCountry.displayName}
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
                  {worldCountry.displayName} todavía no está listo
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
      </main>
    </div>
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
