/**
 * Página de ficha de país - Nivel País / Exploración con Mapa Interno
 * 
 * Propósito: Mostrar información de país con mapa interno como pieza principal
 * de exploración, manteniendo lista de ciudades como apoyo secundario.
 * 
 * Alcance: 
 * - Hero visual claro del país
 * - Mapa interno interactivo (pilot: España)
 * - Lista de ciudades como sección secundaria
 * - Fallback a directorio clásico para países sin mapa
 * - Destinos destacados en sección terciaria
 * 
 * Decisiones técnicas:
 * - Usa getCountryPageData para obtener datos agregados
 * - SpainMap como piloto arquitectónico (DA-027)
 * - Jerarquía visual: País → Mapa (principal) → Lista Ciudades (secundaria)
 * - Fallback automático si país no tiene mapa interno implementado
 * 
 * Cambios recientes (2026-05-01):
 * - Integración de SpainMap como mapa interno piloto
 * - Estructura progresiva: mapa para España, lista para otros
 * - Albarracín añadida al catálogo de ciudades españolas
 */

import { useParams, Link } from 'react-router-dom';
import { getCountryPageData } from '../../features/travelData';
import { SpainMap } from '../../features/map/components/SpainMap';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getLocalizedText } from '../../app/i18n';
import type { CountryStatus } from '../../features/countries/data/countries.types';
import styles from './CountryPage.module.css';

// Países con mapa interno implementado (progresivo según DA-027)
const COUNTRIES_WITH_INTERNAL_MAP = ['espana'];

/**
 * CountryPage - Nivel País / Directorio Editorial de Ciudades
 * 
 * Muestra un hero claro del país y lista sus ciudades como contenido principal.
 * Los destinos destacados aparecen en sección secundaria.
 */
export function CountryPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  
  // Usar travelData.service para obtener datos agregados
  const { 
    country, 
    activeCities, 
    comingSoonCities,
    totalCitiesCount,
    publishedDestinationsCount,
    featuredDestinations 
  } = getCountryPageData(countrySlug || '');

  // País no encontrado
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
    // Intentar obtener descripción específica del modo
    // Por ahora usamos shortDescription con fallback
    return country.shortDescription || null;
  };

  const description = getEditorialDescription();

  // Estado editorial
  const statusLabel = getStatusLabel(country.status);
  const showStatusWarning = country.status !== 'active';

  // Determinar si mostrar mapa interno
  const hasInternalMap = countrySlug ? COUNTRIES_WITH_INTERNAL_MAP.includes(countrySlug) : false;

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
            <span className={styles.flagEmoji} aria-hidden="true">
              {getCountryFlag(country.isoAlpha2)}
            </span>
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
        {/* Sección Principal: Mapa Interno (solo países con implementación) */}
        {hasInternalMap && activeCities.length > 0 && (
          <section className={styles.mapSection} aria-labelledby="map-title">
            <div className={styles.sectionHeader}>
              <h2 id="map-title" className={styles.sectionTitle}>
                Explora en el mapa
              </h2>
              <p className={styles.sectionSubtitle}>
                Haz clic en una ciudad para descubrir sus aventuras
              </p>
            </div>
            <SpainMap cities={activeCities} countrySlug={countrySlug || ''} />
          </section>
        )}

        {/* Sección Secundaria: Lista de Ciudades */}
        <section className={styles.citiesSection} aria-labelledby="cities-title">
          <div className={styles.sectionHeader}>
            <h2 id="cities-title" className={styles.sectionTitle}>
              {hasInternalMap ? 'Todas las ciudades' : 'Explora sus ciudades'}
            </h2>
            <p className={styles.sectionSubtitle}>
              Selecciona una ciudad para descubrir sus aventuras
            </p>
          </div>

          {activeCities.length > 0 ? (
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
          ) : (
            <div className={styles.emptyState}>
              <p>🏗️ Estamos preparando las ciudades de {country.displayName}.</p>
              <p className={styles.emptyText}>
                Vuelve pronto para descubrir destinos increíbles.
              </p>
            </div>
          )}

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

/** Obtiene emoji de bandera a partir de código ISO alpha-2 */
function getCountryFlag(isoAlpha2: string): string {
  // Convertir código ISO a emoji de bandera (regional indicators)
  const codePoints = isoAlpha2
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
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