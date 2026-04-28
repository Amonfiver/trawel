/**
 * Página de detalle de ciudad
 * 
 * Propósito: Mostrar información de una ciudad específica y sus destinos/aventuras
 * Alcance: Información de la ciudad con lista de destinos navegables
 * 
 * Decisiones técnicas:
 * - Usa getCityBySlug para obtener datos reales de la ciudad
 * - Usa getPublishedDestinationsByCity para mostrar destinos disponibles
 * - Enlaces a /aventura/:destinationSlug para destinos publicados
 * - Fallback amigable cuando no hay destinos
 * 
 * Limitaciones actuales:
 * - Sin imágenes de ciudades
 * - Sin mapa de la ciudad
 */

import { useParams, Link } from 'react-router-dom';
import { getCountryBySlug } from '../../features/countries/data/countries.utils';
import { getCityBySlug, getCityDisplayName, isCityClickable } from '../../features/cities/data/cities.utils';
import { getPublishedDestinationsByCity, getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import styles from './CityPage.module.css';

export function CityPage() {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  
  const country = getCountryBySlug(countrySlug || '');
  const city = getCityBySlug(countrySlug || '', citySlug || '');
  
  // Obtener destinos publicados de esta ciudad
  const destinations = getPublishedDestinationsByCity(countrySlug || '', citySlug || '');

  // Ciudad no encontrada
  if (!city) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Ciudad no encontrada</h1>
          <p>La ciudad "{citySlug}" no existe en {country?.displayName || 'este país'}.</p>
          <Link to={`/pais/${countrySlug}`} className={styles.backLink}>
            Volver al país
          </Link>
        </div>
      </div>
    );
  }

  const cityName = getCityDisplayName(city);
  const isActive = isCityClickable(city);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to={`/pais/${countrySlug}`} className={styles.backLink}>
          ← Volver a {country?.displayName || 'país'}
        </Link>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{cityName}</h1>
          {city.shortDescription && (
            <p className={styles.subtitle}>
              {getCityDisplayName(city)}
            </p>
          )}
          {!isActive && (
            <span className={styles.comingSoonBadge}>Próximamente</span>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {/* Descripción de la ciudad */}
        {city.contentByMode && (
          <section className={styles.descriptionSection}>
            <p className={styles.description}>
              {getCityDisplayName(city)}
            </p>
          </section>
        )}

        {/* Destinos disponibles */}
        <section className={styles.destinationsSection} aria-labelledby="destinations-title">
          <h2 id="destinations-title" className={styles.sectionTitle}>
            Destinos y experiencias
          </h2>

          {destinations.length > 0 ? (
            <div className={styles.destinationsGrid} role="list">
              {destinations.map(destination => {
                const title = getDestinationTitle(destination);
                const summary = getDestinationSummary(destination);

                return (
                  <article 
                    key={destination.id} 
                    className={styles.destinationCard}
                    role="listitem"
                  >
                    <Link
                      to={`/aventura/${destination.slug}`}
                      className={styles.destinationLink}
                      aria-label={`Ver ${title}`}
                    >
                      <div className={styles.destinationHeader}>
                        {destination.type && (
                          <span className={styles.destinationType}>
                            {getDestinationTypeLabel(destination.type)}
                          </span>
                        )}
                        {destination.featured && (
                          <span className={styles.featuredBadge}>Destacado</span>
                        )}
                      </div>
                      
                      <h3 className={styles.destinationTitle}>{title}</h3>
                      
                      {summary && (
                        <p className={styles.destinationSummary}>{summary}</p>
                      )}
                      
                      <div className={styles.destinationMeta}>
                        {destination.estimatedVisitTime && (
                          <span className={styles.visitTime}>
                            ⏱️ {destination.estimatedVisitTime}
                          </span>
                        )}
                        {destination.tags && destination.tags.length > 0 && (
                          <div className={styles.tags}>
                            {destination.tags.slice(0, 3).map(tag => (
                              <span key={tag} className={styles.tag}>{tag}</span>
                            ))}
                          </div>
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
              <p>🗺️ Estamos preparando los mejores destinos de {cityName}.</p>
              <p className={styles.emptyText}>
                Vuelve pronto para descubrir aventuras increíbles en esta ciudad.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
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
    hiddenGem: 'Joyas escondidas',
  };
  return labels[type] || type;
}