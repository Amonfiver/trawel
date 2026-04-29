/**
 * Página de ficha de destino/aventura - Ficha Editorial Publicable
 * 
 * Propósito: Mostrar información editorial completa de un destino específico
 * como ficha publicable dentro de Trawel, no como página técnica.
 * 
 * Alcance: 
 * - Hero claro del destino con nombre destacado
 * - Relación visible con ciudad y país
 * - Navegación de vuelta a la ciudad
 * - Introducción editorial principal adaptada al modo
 * - Sección "Por qué visitarlo" con contenido estructurado
 * - Información útil en sidebar
 * - Fuentes y referencias si están disponibles
 * - Estados amables si faltan datos
 * 
 * Decisiones técnicas:
 * - Usa getAdventurePageData para obtener datos agregados
 * - Contenido según modo global (adventure/student) con fallback
 * - Layout: Hero → Contenido principal + Sidebar
 * - Responsive: adaptación progresiva
 * 
 * Cambios recientes (2026-04-29):
 * - Rediseño como ficha editorial publicable con hero prominente
 * - Mejor jerarquía visual del contenido
 * - Navegación de vuelta a ciudad más visible
 * - Sección de fuentes mejorada
 */

import { useParams, Link } from 'react-router-dom';
import { getAdventurePageData } from '../../features/travelData';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getLocalizedText } from '../../app/i18n';
import { useExperienceMode } from '../../features/experienceMode';
import type { DestinationStatus } from '../../features/destinations/types/destination.types';
import type { ExperienceMode } from '../../features/experienceMode';
import styles from './AdventurePage.module.css';

/**
 * Obtiene el contenido del destino según el modo, con fallback
 */
function getDestinationContent(
  destination: { contentByMode?: { adventure?: unknown; student?: unknown }; summary?: unknown },
  mode: ExperienceMode
): string {
  // Intentar el modo activo primero
  const preferredContent = destination.contentByMode?.[mode];
  if (preferredContent) {
    return getLocalizedText(preferredContent, 'es') || '';
  }
  
  // Fallback al otro modo
  const fallbackMode = mode === 'adventure' ? 'student' : 'adventure';
  const fallbackContent = destination.contentByMode?.[fallbackMode];
  if (fallbackContent) {
    return getLocalizedText(fallbackContent, 'es') || '';
  }
  
  // Fallback final a summary
  if (destination.summary) {
    const summaryText = getLocalizedText(destination.summary, 'es');
    if (summaryText) return summaryText;
  }
  
  return '';
}

/**
 * AdventurePage - Ficha Editorial de Destino
 * 
 * Muestra contenido completo de un destino con navegación clara,
 * metadatos prácticos y trazabilidad editorial.
 */
export function AdventurePage() {
  const { adventureSlug } = useParams<{ adventureSlug: string }>();
  const { mode } = useExperienceMode();
  
  // Obtener datos agregados del destino, ciudad y país
  const { destination, city, country } = getAdventurePageData(adventureSlug || '');

  // Destino no encontrado
  if (!destination) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Aventura no encontrada</h1>
          <p>El destino "{adventureSlug}" no existe en nuestra base de datos.</p>
          <Link to="/" className={styles.backLink}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  // Datos del destino procesados
  const title = getDestinationTitle(destination);
  const summary = getDestinationSummary(destination);
  
  // Contenido según el modo global con fallback
  const content = getDestinationContent(destination, mode) || summary || '';
  
  // Relaciones
  const cityName = city ? getCityDisplayName(city) : destination.citySlug;
  const countryName = country?.displayName || destination.countrySlug;
  const countrySlug = destination.countrySlug;
  const citySlug = destination.citySlug;

  // Estado editorial
  const statusLabel = getStatusLabel(destination.status);
  const showStatusWarning = destination.status !== 'published';

  // Verificar si tenemos navegación de vuelta disponible
  const canNavigateBack = city && country;

  return (
    <div className={styles.container}>
      {/* Hero del Destino - Nivel principal */}
      <header className={styles.hero}>
        {/* Breadcrumb flotante sobre el hero */}
        <nav className={styles.breadcrumb} aria-label="Navegación">
          <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          {country ? (
            <Link to={`/pais/${countrySlug}`} className={styles.breadcrumbLink}>
              {countryName}
            </Link>
          ) : (
            <span className={styles.breadcrumbDisabled}>{countryName}</span>
          )}
          <span className={styles.breadcrumbSeparator}>/</span>
          {city ? (
            <Link to={`/pais/${countrySlug}/${citySlug}`} className={styles.breadcrumbLink}>
              {cityName}
            </Link>
          ) : (
            <span className={styles.breadcrumbDisabled}>{cityName}</span>
          )}
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">{title}</span>
        </nav>

        <div className={styles.heroContent}>
          <div className={styles.heroMeta}>
            {destination.type && (
              <span className={styles.typeBadge}>
                {getDestinationTypeLabel(destination.type)}
              </span>
            )}
            {destination.featured && (
              <span className={styles.featuredBadge}>⭐ Experiencia destacada</span>
            )}
            {showStatusWarning && (
              <span className={`${styles.statusBadge} ${styles[destination.status]}`}>
                {statusLabel}
              </span>
            )}
          </div>
          
          <h1 className={styles.heroTitle}>{title}</h1>
          
          <p className={styles.heroLocation}>
            📍 {cityName}, {countryName}
          </p>

          {summary && (
            <p className={styles.heroSummary}>{summary}</p>
          )}

          {/* Navegación de vuelta a la ciudad */}
          {canNavigateBack && (
            <div className={styles.backToCity}>
              <Link to={`/pais/${countrySlug}/${citySlug}`} className={styles.backToCityLink}>
                ← Explorar más de {cityName}
              </Link>
            </div>
          )}
        </div>

        {/* Aviso editorial si no está publicado */}
        {showStatusWarning && (
          <div className={`${styles.statusAlert} ${styles[destination.status]}`} role="alert">
            <span className={styles.statusIcon}>📝</span>
            <div>
              <strong>{statusLabel}</strong>
              <p>Este contenido está en preparación y puede cambiar.</p>
            </div>
          </div>
        )}
      </header>

      {/* Layout principal: contenido + sidebar */}
      <main className={styles.main}>
        {/* Contenido principal */}
        <article className={styles.contentSection}>
          <div className={styles.contentHeader}>
            <h2 className={styles.contentTitle}>
              {mode === 'adventure' ? 'Por qué visitarlo' : 'Descubre su historia'}
            </h2>
            <span className={styles.contentModeIndicator}>
              {mode === 'adventure' ? '🎒 Modo Aventura' : '🎓 Modo Estudiante'}
            </span>
          </div>

          <div className={styles.contentBody}>
            {content ? (
              <div className={styles.contentText}>
                {content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className={styles.paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className={styles.emptyContent}>
                <p>📝 Contenido detallado en preparación.</p>
                <p>Estamos preparando una guía completa para este destino.</p>
              </div>
            )}
          </div>

          {/* Tags si existen */}
          {destination.tags && destination.tags.length > 0 && (
            <div className={styles.tagsSection}>
              <h3 className={styles.tagsTitle}>Etiquetas</h3>
              <div className={styles.tagsList}>
                {destination.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar con metadatos */}
        <aside className={styles.sidebar}>
          {/* Información práctica */}
          <section className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Información práctica</h2>
            
            {destination.estimatedVisitTime && (
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>⏱️</span>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Duración estimada</span>
                  <span className={styles.infoValue}>{destination.estimatedVisitTime}</span>
                </div>
              </div>
            )}
            
            {destination.price && (
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>💰</span>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Precio</span>
                  <span className={styles.infoValue}>
                    {getLocalizedText(destination.price, 'es')}
                  </span>
                </div>
              </div>
            )}
            
            {destination.openingHours && (
              <div className={styles.infoItem}>
                <span className={styles.infoIcon}>🕒</span>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Horario</span>
                  <span className={styles.infoValue}>
                    {getLocalizedText(destination.openingHours, 'es')}
                  </span>
                </div>
              </div>
            )}

            {!destination.estimatedVisitTime && !destination.price && !destination.openingHours && (
              <div className={styles.infoEmpty}>
                <span className={styles.infoEmptyIcon}>📋</span>
                <p>Información práctica pendiente de añadir.</p>
              </div>
            )}
          </section>

          {/* Ubicación */}
          <section className={styles.locationCard}>
            <h2 className={styles.infoTitle}>Ubicación</h2>
            <div className={styles.locationContent}>
              <span className={styles.locationIcon}>🗺️</span>
              <div className={styles.locationText}>
                <p className={styles.locationCity}>{cityName}</p>
                <p className={styles.locationCountry}>{countryName}</p>
                {canNavigateBack && (
                  <Link to={`/pais/${countrySlug}/${citySlug}`} className={styles.locationLink}>
                    Ver más de esta ciudad →
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Fuentes y trazabilidad */}
          <section className={styles.sourcesCard}>
            <h2 className={styles.infoTitle}>Fuentes y referencias</h2>
            {destination.sources && destination.sources.length > 0 ? (
              <ul className={styles.sourcesList}>
                {destination.sources.map((source, index) => (
                  <li key={index} className={styles.sourceItem}>
                    {source.url ? (
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.sourceLink}
                        title={source.author ? `${source.title} - ${source.author}` : source.title}
                      >
                        <span className={styles.sourceTitle}>{source.title}</span>
                        {source.year && <span className={styles.sourceYear}>({source.year})</span>}
                        <span className={styles.sourceExternal}>↗</span>
                      </a>
                    ) : (
                      <span className={styles.sourceText}>
                        {source.title}
                        {source.author && ` - ${source.author}`}
                        {source.year && ` (${source.year})`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.sourcesPending}>
                <span className={styles.sourcesIcon}>📚</span>
                <p>Fuentes pendientes de añadir</p>
                <p className={styles.sourcesNote}>
                  Estamos verificando la información para garantizar precisión editorial.
                </p>
              </div>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}

/** Obtiene label legible del estado de publicación */
function getStatusLabel(status: DestinationStatus): string {
  const labels: Record<DestinationStatus, string> = {
    draft: 'Borrador',
    published: 'Publicado',
    comingSoon: 'Próximamente',
    disabled: 'No disponible',
  };
  return labels[status] || status;
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