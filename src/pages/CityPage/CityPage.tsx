/**
 * Página de ficha de ciudad
 * 
 * Propósito: Mostrar información editorial completa de una ciudad y sus destinos
 * Alcance: Ficha funcional con breadcrumb, descripción, metadatos y lista de destinos
 * 
 * Decisiones técnicas:
 * - Usa contenido adventure por defecto para descripción principal
 * - Breadcrumb simple: Inicio / País / Ciudad
 * - Avisos editoriales claros para estados no activos
 * - Lista de destinos con metadatos visibles
 * 
 * Limitaciones actuales:
 * - Sin conexión con ExperienceMode global (siempre usa adventure)
 * - Sin imágenes de la ciudad
 * - Sin mapa de la ciudad
 */

import { useParams, Link } from 'react-router-dom';
import { getCityPageData } from '../../features/travelData';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getLocalizedText } from '../../app/i18n';
import type { CityStatus } from '../../features/cities/types/city.types';
import styles from './CityPage.module.css';

/**
 * CityPage - Ficha editorial de ciudad
 * 
 * Muestra información completa de una ciudad con navegación breadcrumb,
 * descripción, metadatos y lista de destinos disponibles.
 */
export function CityPage() {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  
  // Usar travelData.service para obtener datos agregados
  const { country, city, publishedDestinations: destinations } = getCityPageData(
    countrySlug || '',
    citySlug || ''
  );

  // Ciudad no encontrada
  if (!city) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Ciudad no encontrada</h1>
          <p>La ciudad "{citySlug}" no existe en {country?.displayName || 'este país'}.</p>
          {country ? (
            <Link to={`/pais/${countrySlug}`} className={styles.backLink}>
              ← Volver a {country.displayName}
            </Link>
          ) : (
            <Link to="/" className={styles.backLink}>
              ← Volver al inicio
            </Link>
          )}
        </div>
      </div>
    );
  }

  const cityName = getCityDisplayName(city);
  
  // Descripción: adventure por defecto, fallback a shortDescription
  const description = city.contentByMode?.adventure 
    ? getLocalizedText(city.contentByMode.adventure, 'es')
    : city.shortDescription 
    ? getLocalizedText(city.shortDescription, 'es')
    : null;

  // Estado editorial
  const statusLabel = getStatusLabel(city.status);
  const showStatusWarning = city.status !== 'active';

  return (
    <div className={styles.container}>
      {/* Breadcrumb de navegación */}
      <nav className={styles.breadcrumb} aria-label="Navegación">
        <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        {country ? (
          <Link to={`/pais/${countrySlug}`} className={styles.breadcrumbLink}>
            {country.displayName}
          </Link>
        ) : (
          <span className={styles.breadcrumbDisabled}>{countrySlug}</span>
        )}
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent} aria-current="page">{cityName}</span>
      </nav>

      {/* Aviso editorial si no está activa */}
      {showStatusWarning && (
        <div className={`${styles.statusAlert} ${styles[city.status]}`} role="alert">
          <span className={styles.statusIcon}>📝</span>
          <div>
            <strong>{statusLabel}</strong>
            <p>Esta ciudad está en preparación y puede cambiar.</p>
          </div>
        </div>
      )}

      {/* Encabezado de la ciudad */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          {city.featured && (
            <span className={styles.featuredBadge}>⭐ Destacada</span>
          )}
          {showStatusWarning && (
            <span className={styles.statusBadge}>{statusLabel}</span>
          )}
        </div>
        
        <h1 className={styles.title}>{cityName}</h1>
        
        <p className={styles.location}>
          📍 {country?.displayName || 'País no disponible'}
        </p>

        {description && (
          <p className={styles.summary}>{description}</p>
        )}
      </header>

      {/* Contenido principal */}
      <main className={styles.main}>
        {/* Información y metadatos */}
        <section className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Información general</h2>
            
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Destinos disponibles</span>
                <span className={styles.infoValue}>{destinations.length}</span>
              </div>
              
              {city.coordinates && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Coordenadas</span>
                  <span className={styles.infoValueCoords}>
                    {city.coordinates.lat.toFixed(4)}, {city.coordinates.lng.toFixed(4)}
                  </span>
                </div>
              )}
              
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estado</span>
                <span className={`${styles.infoValue} ${styles[city.status]}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </section>

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
                          <span className={styles.featuredBadgeSmall}>⭐ Destacado</span>
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
              <p>🗺️ Todavía estamos preparando destinos para esta ciudad.</p>
              <p className={styles.emptyText}>
                Vuelve pronto para descubrir aventuras increíbles en {cityName}.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/** Obtiene label legible del estado de la ciudad */
function getStatusLabel(status: CityStatus): string {
  const labels: Record<CityStatus, string> = {
    active: 'Activa',
    comingSoon: 'Próximamente',
    disabled: 'No disponible',
  };
  return labels[status] || status;
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
  };
  return labels[type] || type;
}