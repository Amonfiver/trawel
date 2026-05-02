/**
 * Página de ficha de país - Nivel País / Exploración con Mapa Interno
 * 
 * Propósito: Mostrar información de país con mapa interno como pieza principal
 * de exploración, manteniendo lista de ciudades como apoyo secundario.
 * 
 * Alcance: 
 * - Hero visual claro del país
 * - Mapa interno interactivo homogéneo
 * - Lista de ciudades como sección secundaria
 * - Fallback a directorio clásico para países sin mapa
 * - Destinos destacados en sección terciaria
 * 
 * Decisiones técnicas:
 * - Usa getCountryPageData para obtener datos agregados
 * - CountryInternalMap como render genérico para assets TopoJSON
 * - Jerarquía visual: País → Mapa (principal) → Lista Ciudades (secundaria)
 * - Fallback automático si país no tiene mapa interno implementado
 * 
 * Cambios recientes (2026-05-02):
 * - Integración con sistema automático de mapas internos (DA-030)
 * - Estados UI: loading, ready, missing, queued/generating, failed
 * - Polling para actualización de estado de generación
 * - Vista "Próximamente" para países sin contenido editorial
 * - España usa el mismo render genérico con asset local
 * - Click en zona del mapa navega a /pais/{countrySlug}/zona/{zoneSlug}
 */

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getCountryPageData } from '../../features/travelData';
import { CountryInternalMap } from '../../features/map/components/CountryInternalMap';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getLocalizedText } from '../../app/i18n';
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
 * CountryPage - Nivel País / Directorio Editorial de Ciudades
 * 
 * Muestra un hero claro del país y lista sus ciudades como contenido principal.
 * Los destinos destacados aparecen en sección secundaria.
 */
export function CountryPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const navigate = useNavigate();
  const worldCountry = countrySlug ? getWorldCountryBySlug(countrySlug) : undefined;
  
  // Estado para el asset del mapa (DA-030)
  const [mapState, setMapState] = useState<MapAssetState>({ status: 'loading' });
  
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Usar travelData.service para obtener datos agregados
  const { 
    country, 
    activeCities, 
    comingSoonCities,
    totalCitiesCount,
    publishedDestinationsCount,
    featuredDestinations 
  } = getCountryPageData(countrySlug || '');
  const preferredAdminLevel = countrySlug ? getPreferredAdminLevel(countrySlug) : 'ADM2';

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
              Pasa el ratón por una zona para ver su nombre
            </p>
          </div>
          <CountryInternalMap
            assetUrl={SPAIN_LOCAL_MAP_URL}
            countryName={country.displayName}
            attribution={DEFAULT_MAP_ATTRIBUTION}
            onZoneSelect={handleZoneSelect}
          />
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

    // Si tiene contenido editorial, mostrar mapa en sección principal
    // Si no tiene contenido, mostrar vista "Próximamente"

    const hasContent = activeCities.length > 0;

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
                Pasa el ratón por una zona para ver su nombre
              </p>
            </div>
            <CountryInternalMap
              assetUrl={mapState.publicUrl}
              countryName={country.displayName}
              attribution={mapState.asset.attribution || DEFAULT_MAP_ATTRIBUTION}
              onZoneSelect={handleZoneSelect}
            />
            {!hasContent && <EditorialPendingBlock countryName={country.displayName} />}
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

  // Vista "Próximamente" para países sin contenido editorial
  const renderComingSoonView = () => {
    if (activeCities.length > 0) return null;

    return (
      <section className={styles.comingSoonViewSection}>
        <div className={styles.comingSoonViewContent}>
          <div className={styles.comingSoonFlag}>
            <CountryFlag
              isoAlpha2={country.isoAlpha2}
              countryName={country.displayName}
              size="large"
            />
          </div>
          <h2 className={styles.comingSoonViewTitle}>{country.displayName}</h2>
          <div className={styles.comingSoonViewStatus}>
            {mapState.status === 'ready' ? (
              <>
                <span className={styles.statusIconReady}>✅</span>
                <span>Mapa interno disponible</span>
              </>
            ) : (
              <>
                <span className={styles.statusIconPreparing}>🗺️</span>
                <span>Mapa en preparación</span>
              </>
            )}
          </div>
          <p className={styles.comingSoonViewText}>
            Destinos y lugares de interés próximamente
          </p>
          {mapState.status === 'ready' && (
            <p className={styles.comingSoonViewNote}>
              Los datos cartográficos están listos. 
              Estamos trabajando en el contenido editorial.
            </p>
          )}
        </div>
      </section>
    );
  };

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

        {/* Estadísticas rápidas en el hero */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNumber}>{activeCities.length}</span>
            <span className={styles.heroStatLabel}>Ciudades</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNumber}>{publishedDestinationsCount}</span>
            <span className={styles.heroStatLabel}>Aventuras</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNumber}>{totalCitiesCount}</span>
            <span className={styles.heroStatLabel}>Total</span>
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
        {/* Vista "Próximamente" para países sin contenido editorial */}
        {renderComingSoonView()}

        {/* Sección de mapa automático (para países que no son España) */}
        {!hasLocalMap && renderAutoMapStatus()}

        {/* Sección Principal: Mapa Interno Local (solo España) */}
        {renderMapSection()}

        {/* Sección Secundaria: Lista de Ciudades */}
        {activeCities.length > 0 && (
          <section className={styles.citiesSection} aria-labelledby="cities-title">
            <div className={styles.sectionHeader}>
              <h2 id="cities-title" className={styles.sectionTitle}>
                {hasLocalMap ? 'Todas las ciudades' : 'Explora sus ciudades'}
              </h2>
              <p className={styles.sectionSubtitle}>
                Selecciona una ciudad para descubrir sus aventuras
              </p>
            </div>

            <div className={styles.citiesGrid} role="list">
              {activeCities.map(city => {
                const cityName = getCityDisplayName(city);
                const cityDescription = city.shortDescription 
                  ? getLocalizedText(city.shortDescription, 'es')
                  : null;

                return (
                  <article 
                    key={city.id} 
                    className={styles.cityCard}
                    role="listitem"
                  >
                    <Link
                      to={`/pais/${countrySlug}/${city.slug}`}
                      className={styles.cityLink}
                      aria-label={`Explorar ${cityName}`}
                    >
                      <div className={styles.cityCardContent}>
                        <div className={styles.cityHeader}>
                          <h3 className={styles.cityName}>{cityName}</h3>
                          {city.featured && (
                            <span className={styles.featuredStar} aria-label="Destacada">⭐</span>
                          )}
                        </div>
                        
                        {cityDescription && (
                          <p className={styles.cityDescription}>{cityDescription}</p>
                        )}
                        
                        <div className={styles.cityMeta}>
                          {city.destinationCount !== undefined && city.destinationCount > 0 ? (
                            <span className={styles.cityDestinations}>
                              {city.destinationCount} {city.destinationCount === 1 ? 'aventura' : 'aventuras'}
                            </span>
                          ) : (
                            <span className={styles.cityDestinations}>Próximamente</span>
                          )}
                          <span aria-hidden="true" className={styles.arrow}>→</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>

            {/* Ciudades próximamente - Separación visual clara */}
            {comingSoonCities.length > 0 && (
              <div className={styles.comingSoonSection}>
                <div className={styles.comingSoonHeader}>
                  <h3 className={styles.comingSoonTitle}>Próximamente</h3>
                  <p className={styles.comingSoonSubtitle}>Ciudades en preparación</p>
                </div>
                <div className={styles.comingSoonGrid} role="list">
                  {comingSoonCities.map(city => {
                    const cityName = getCityDisplayName(city);
                    
                    return (
                      <div key={city.id} className={styles.comingSoonCard} role="listitem">
                        <span className={styles.comingSoonName}>{cityName}</span>
                        <span className={styles.comingSoonBadge}>Muy pronto</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Sección Secundaria: Destinos Destacados */}
        {featuredDestinations.length > 0 && (
          <section className={styles.featuredSection} aria-labelledby="featured-title">
            <div className={styles.sectionHeaderSecondary}>
              <h2 id="featured-title" className={styles.sectionTitleSecondary}>
                Aventuras destacadas
              </h2>
              <p className={styles.sectionSubtitleSecondary}>
                Experiencias únicas seleccionadas en {country.displayName}
              </p>
            </div>
            <div className={styles.featuredGrid} role="list">
              {featuredDestinations.map(destination => {
                const title = getDestinationTitle(destination);
                const summary = getDestinationSummary(destination);

                return (
                  <article 
                    key={destination.id} 
                    className={styles.featuredCard}
                    role="listitem"
                  >
                    <Link
                      to={`/aventura/${destination.slug}`}
                      className={styles.featuredLink}
                      aria-label={`Ver ${title}`}
                    >
                      <div className={styles.featuredCardContent}>
                        <div className={styles.featuredHeader}>
                          {destination.type && (
                            <span className={styles.featuredType}>
                              {getDestinationTypeLabel(destination.type)}
                            </span>
                          )}
                        </div>
                        
                        <h3 className={styles.featuredName}>{title}</h3>
                        
                        {summary && (
                          <p className={styles.featuredSummary}>{summary}</p>
                        )}
                        
                        <div className={styles.featuredMeta}>
                          {destination.estimatedVisitTime && (
                            <span className={styles.visitTime}>
                              ⏱️ {destination.estimatedVisitTime}
                            </span>
                          )}
                          <span aria-hidden="true" className={styles.arrow}>→</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        )}
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

/** Obtiene label legible del tipo de destino */
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
                <p>Estamos preparando el mapa de {worldCountry.displayName}.</p>
                <p>Esto puede tardar un poco la primera vez.</p>
                <div className={styles.mapProgressIndicator}>
                  <div className={styles.mapProgressBar} style={{ width: '60%' }} />
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
                <EditorialPendingBlock countryName={worldCountry.displayName} />
              </div>
            )}

            {mapState.status === 'missing' && (
              <div className={styles.discoveringState}>
                <p>
                  Aún no conocemos bien {worldCountry.displayName}, 
                  pero lo estamos preparando para ti.
                </p>
                <button 
                  onClick={onRetryGeneration}
                  className={styles.requestMapButton}
                >
                  Explorar {worldCountry.displayName}
                </button>
              </div>
            )}

            {mapState.status === 'failed' && (
              <div className={styles.discoveringState}>
                <p className={styles.discoveringError}>
                  ⚠️ Algo salió mal al preparar el mapa.
                </p>
                <p>No te preocupes, lo arreglaremos pronto.</p>
                <div className={styles.discoveringActions}>
                  <button 
                    onClick={onRetryGeneration}
                    className={styles.retryButton}
                  >
                    Reintentar
                  </button>
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

function EditorialPendingBlock({ countryName }: { countryName: string }) {
  return (
    <div className={styles.editorialPendingBlock}>
      <h3 className={styles.editorialPendingTitle}>Contenido editorial en preparación</h3>
      <p className={styles.editorialPendingText}>
        Estamos trabajando en el contenido editorial. Pronto tendrás información sobre
        destinos, ciudades y aventuras en {countryName}.
      </p>
    </div>
  );
}
