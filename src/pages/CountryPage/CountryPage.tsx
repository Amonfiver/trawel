/**
 * Página de ficha de país
 * 
 * Propósito: Mostrar información editorial completa de un país y sus ciudades/destinos
 * Alcance: Ficha funcional con breadcrumb, estadísticas, ciudades y destinos destacados
 * 
 * Decisiones técnicas:
 * - Usa getCountryPageData para obtener datos agregados desde travelData.service
 * - Breadcrumb simple: Inicio / País
 * - Estadísticas visuales de ciudades y destinos
 * - Ciudades activas navegables, comingSoon sin enlace
 * - Destinos destacados del país con enlaces directos
 * 
 * Limitaciones actuales:
 * - Sin conexión con ExperienceMode global (siempre usa adventure)
 * - Sin imágenes del país
 * - Sin mapa interno del país
 */

import { useParams, Link } from 'react-router-dom';
import { getCountryPageData } from '../../features/travelData';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getLocalizedText } from '../../app/i18n';
import type { CountryStatus } from '../../features/countries/data/countries.types';
import styles from './CountryPage.module.css';

/**
 * CountryPage - Ficha editorial de país
 * 
 * Muestra información completa de un país con navegación breadcrumb,
 * estadísticas, ciudades disponibles y destinos destacados.
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
    comingSoonDestinationsCount,
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
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Descripción del país: shortDescription con fallback
  const description = country.shortDescription || null;

  // Estado editorial
  const statusLabel = getStatusLabel(country.status);
  const showStatusWarning = country.status !== 'active';

  return (
    <div className={styles.container}>
      {/* Breadcrumb de navegación */}
      <nav className={styles.breadcrumb} aria-label="Navegación">
        <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent} aria-current="page">
          {country.displayName}
        </span>
      </nav>

      {/* Aviso editorial si no está activo */}
      {showStatusWarning && (
        <div className={`${styles.statusAlert} ${styles[country.status]}`} role="alert">
          <span className={styles.statusIcon}>📝</span>
          <div>
            <strong>{statusLabel}</strong>
            <p>Este país está en preparación y puede cambiar.</p>
          </div>
        </div>
      )}

      {/* Encabezado del país */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <span className={styles.flag} aria-hidden="true">
            {getCountryFlag(country.isoAlpha2)}
          </span>
          {country.featured && (
            <span className={styles.featuredBadge}>⭐ Destacado</span>
          )}
          {showStatusWarning && (
            <span className={styles.statusBadge}>{statusLabel}</span>
          )}
        </div>
        
        <h1 className={styles.title}>{country.displayName}</h1>
        
        <p className={styles.location}>
          📍 {country.capital || 'Capital no disponible'} · {getContinentLabel(country.continent)}
        </p>

        {description && (
          <p className={styles.summary}>{description}</p>
        )}
      </header>

      {/* Contenido principal */}
      <main className={styles.main}>
        {/* Estadísticas */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{activeCities.length}</span>
              <span className={styles.statLabel}>Ciudades disponibles</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalCitiesCount}</span>
              <span className={styles.statLabel}>Total ciudades</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{publishedDestinationsCount}</span>
              <span className={styles.statLabel}>Destinos publicados</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{comingSoonDestinationsCount}</span>
              <span className={styles.statLabel}>Próximamente</span>
            </div>
          </div>
        </section>

        {/* Información general */}
        <section className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Información general</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Capital</span>
                <span className={styles.infoValue}>{country.capital || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Continente</span>
                <span className={styles.infoValue}>{getContinentLabel(country.continent)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Código ISO</span>
                <span className={styles.infoValue}>{country.isoAlpha2} / {country.isoAlpha3}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={`${styles.infoValue} ${styles[country.status]}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Ciudades disponibles */}
        <section className={styles.citiesSection} aria-labelledby="cities-title">
          <h2 id="cities-title" className={styles.sectionTitle}>
            Ciudades y regiones
          </h2>

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
                      <div className={styles.cityHeader}>
                        {city.featured && (
                          <span className={styles.featuredBadgeSmall}>⭐ Destacada</span>
                        )}
                        <span className={styles.cityStatus} data-status="active">
                          Disponible
                        </span>
                      </div>
                      
                      <h3 className={styles.cityName}>{cityName}</h3>
                      
                      {cityDescription && (
                        <p className={styles.cityDescription}>{cityDescription}</p>
                      )}
                      
                      <div className={styles.cityMeta}>
                        {city.destinationCount !== undefined && (
                          <span className={styles.cityDestinations}>
                            {city.destinationCount} {city.destinationCount === 1 ? 'destino' : 'destinos'}
                          </span>
                        )}
                        <span aria-hidden="true" className={styles.arrow}>→</span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>🏗️ Estamos preparando información sobre las ciudades de {country.displayName}.</p>
              <p className={styles.emptyText}>
                Vuelve pronto para descubrir destinos increíbles.
              </p>
            </div>
          )}

          {/* Ciudades próximamente */}
          {comingSoonCities.length > 0 && (
            <div className={styles.comingSoonSection}>
              <h3 className={styles.comingSoonTitle}>Próximamente</h3>
              <div className={styles.comingSoonGrid} role="list">
                {comingSoonCities.map(city => {
                  const cityName = getCityDisplayName(city);
                  
                  return (
                    <div key={city.id} className={styles.comingSoonCard} role="listitem">
                      <span className={styles.comingSoonName}>{cityName}</span>
                      <span className={styles.comingSoonBadge}>Próximamente</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Destinos destacados */}
        {featuredDestinations.length > 0 && (
          <section className={styles.featuredSection} aria-labelledby="featured-title">
            <h2 id="featured-title" className={styles.sectionTitle}>
              Destinos destacados
            </h2>
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
  };
  return labels[type] || type;
}