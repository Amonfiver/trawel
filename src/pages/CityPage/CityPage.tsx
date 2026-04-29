/**
 * Página de ficha de ciudad - Nivel Ciudad / Editorial Local
 * 
 * Propósito: Mostrar información editorial completa de una ciudad y sus destinos
 * como página editorial dentro de Trawel, no como ficha técnica.
 * 
 * Alcance: 
 * - Hero claro de ciudad con relación visible al país
 * - Introducción editorial según modo (adventure/student)
 * - Sección principal de destinos/aventuras con protagonismo
 * - Estado vacío amable si no hay destinos
 * - Información útil en sección secundaria
 * 
 * Decisiones técnicas:
 * - Usa getCityPageData para obtener datos agregados
 * - Contenido según modo global con fallback automático
 * - Jerarquía visual: Ciudad → Destinos (principal) → Info útil (secundaria)
 * - Responsive: adaptación progresiva de grids
 * 
 * Cambios recientes (2026-04-29):
 * - Rediseño como página editorial con hero prominente
 * - Destinos con mayor protagonismo visual
 * - Info útil movida a sección secundaria
 * - Mejor integración con modo Aventura/Estudiante
 */

import { useParams, Link } from 'react-router-dom';
import { getCityPageData } from '../../features/travelData';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getLocalizedText } from '../../app/i18n';
import { useExperienceMode } from '../../features/experienceMode';
import type { CityStatus } from '../../features/cities/types/city.types';
import type { ExperienceMode } from '../../features/experienceMode';
import styles from './CityPage.module.css';

/**
 * Obtiene el contenido de la ciudad según el modo, con fallback
 */
function getCityDescription(
  city: { contentByMode?: { adventure?: unknown; student?: unknown }; shortDescription?: unknown },
  mode: ExperienceMode
): string | null {
  // Intentar el modo activo primero
  const preferredContent = city.contentByMode?.[mode];
  if (preferredContent) {
    return getLocalizedText(preferredContent, 'es');
  }
  
  // Fallback al otro modo
  const fallbackMode = mode === 'adventure' ? 'student' : 'adventure';
  const fallbackContent = city.contentByMode?.[fallbackMode];
  if (fallbackContent) {
    return getLocalizedText(fallbackContent, 'es');
  }
  
  // Fallback final a shortDescription
  if (city.shortDescription) {
    return getLocalizedText(city.shortDescription, 'es');
  }
  
  return null;
}

/**
 * CityPage - Página Editorial de Ciudad
 * 
 * Muestra un hero claro de la ciudad y lista sus destinos como contenido principal.
 * La información útil aparece en sección secundaria.
 */
export function CityPage() {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  const { mode } = useExperienceMode();
  
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
  
  // Descripción según el modo global con fallback
  const description = getCityDescription(city, mode);

  // Estado editorial
  const statusLabel = getStatusLabel(city.status);
  const showStatusWarning = city.status !== 'active';

  return (
    <div className={styles.container}>
      {/* Hero de la Ciudad - Nivel principal */}
      <header className={styles.hero}>
        {/* Breadcrumb flotante sobre el hero */}
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

        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            {city.featured && (
              <span className={styles.featuredBadge}>⭐ Ciudad destacada</span>
            )}
            {showStatusWarning && (
              <span className={`${styles.statusBadge} ${styles[city.status]}`}>
                {statusLabel}
              </span>
            )}
            {country && (
              <span className={styles.countryBadge}>
                🇪🇸 {country.displayName}
              </span>
            )}
          </div>
          
          <h1 className={styles.heroTitle}>{cityName}</h1>
          
          {country && (
            <p className={styles.heroLocation}>
              📍 En el corazón de {country.displayName}
            </p>
          )}

          {description && (
            <p className={styles.heroDescription}>{description}</p>
          )}
        </div>

        {/* Estadísticas rápidas en el hero */}
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNumber}>{destinations.length}</span>
            <span className={styles.heroStatLabel}>
              {destinations.length === 1 ? 'Aventura' : 'Aventuras'}
            </span>
          </div>
          {city.coordinates && (
            <>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNumber}>📍</span>
                <span className={styles.heroStatLabel}>Explorable</span>
              </div>
            </>
          )}
        </div>

        {/* Aviso editorial si no está activa */}
        {showStatusWarning && (
          <div className={`${styles.statusAlert} ${styles[city.status]}`} role="alert">
            <span className={styles.statusIcon}>📝</span>
            <div>
              <strong>{statusLabel}</strong>
              <p>Esta ciudad está en preparación. Algunos destinos pueden no estar disponibles.</p>
            </div>
          </div>
        )}
      </header>

      <main className={styles.main}>
        {/* Sección Principal: Destinos y Aventuras */}
        <section className={styles.destinationsSection} aria-labelledby="destinations-title">
          <div className={styles.sectionHeader}>
            <h2 id="destinations-title" className={styles.sectionTitle}>
              Descubre sus aventuras
            </h2>
            <p className={styles.sectionSubtitle}>
              Experiencias únicas seleccionadas en {cityName}
            </p>
          </div>

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
                      <div className={styles.destinationCardContent}>
                        <div className={styles.destinationHeader}>
                          <h3 className={styles.destinationTitle}>{title}</h3>
                          {destination.featured && (
                            <span className={styles.featuredStar} aria-label="Destacado">⭐</span>
                          )}
                        </div>

                        <div className={styles.destinationMetaTop}>
                          {destination.type && (
                            <span className={styles.destinationType}>
                              {getDestinationTypeLabel(destination.type)}
                            </span>
                          )}
                        </div>
                        
                        {summary && (
                          <p className={styles.destinationSummary}>{summary}</p>
                        )}
                        
                        <div className={styles.destinationMeta}>
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
          ) : (
            <div className={styles.emptyState}>
              <p>🗺️ Todavía estamos preparando aventuras para {cityName}.</p>
              <p className={styles.emptyText}>
                Vuelve pronto para descubrir experiencias increíbles en esta ciudad.
              </p>
            </div>
          )}
        </section>

        {/* Sección Secundaria: Información útil */}
        <section className={styles.infoSection} aria-labelledby="info-title">
          <div className={styles.sectionHeaderSecondary}>
            <h2 id="info-title" className={styles.sectionTitleSecondary}>
              Información práctica
            </h2>
          </div>
          
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>🗺️</span>
              <span className={styles.infoLabel}>Destinos</span>
              <span className={styles.infoValue}>{destinations.length}</span>
            </div>
            
            {city.coordinates && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <span className={styles.infoLabel}>Ubicación</span>
                <span className={styles.infoValueCoords}>
                  {city.coordinates.lat.toFixed(2)}, {city.coordinates.lng.toFixed(2)}
                </span>
              </div>
            )}
            
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>✨</span>
              <span className={styles.infoLabel}>Estado</span>
              <span className={`${styles.infoValue} ${styles[city.status]}`}>
                {statusLabel}
              </span>
            </div>

            {country && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🇪🇸</span>
                <span className={styles.infoLabel}>País</span>
                <Link to={`/pais/${countrySlug}`} className={styles.infoLink}>
                  {country.displayName}
                </Link>
              </div>
            )}
          </div>
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
    temple: 'Templo',
    park: 'Parque',
    landmark: 'Punto de interés',
    cultural: 'Cultural',
  };
  return labels[type] || type;
}