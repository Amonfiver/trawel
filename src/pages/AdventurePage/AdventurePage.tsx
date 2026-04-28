/**
 * Página de ficha de destino/aventura
 * 
 * Propósito: Mostrar información editorial completa de un destino específico
 * Alcance: Ficha funcional con breadcrumb, contenido, metadatos y fuentes
 * 
 * Decisiones técnicas:
 * - Usa contenido adventure por defecto (modo global no conectado todavía)
 * - Breadcrumb simple: Inicio / País / Ciudad / Destino
 * - Avisos editoriales claros para estados no publicados
 * - Sección de fuentes con manejo de "fuentes pendientes"
 * 
 * Limitaciones actuales:
 * - Sin conexión con ExperienceMode global (siempre usa adventure)
 * - Sin imágenes de galería
 * - Sin mapa del destino
 */

import { useParams, Link } from 'react-router-dom';
import { getAdventurePageData } from '../../features/travelData';
import { getDestinationContentByMode, getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getLocalizedText } from '../../app/i18n';
import type { DestinationStatus } from '../../features/destinations/types/destination.types';
import styles from './AdventurePage.module.css';

/**
 * AdventurePage - Ficha editorial de destino
 * 
 * Muestra contenido completo de un destino con navegación breadcrumb,
 * metadatos prácticos y trazabilidad editorial.
 */
export function AdventurePage() {
  const { adventureSlug } = useParams<{ adventureSlug: string }>();
  
  // Obtener datos agregados del destino, ciudad y país
  const { destination, city, country } = getAdventurePageData(adventureSlug || '');

  // Destino no encontrado
  if (!destination) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Destino no encontrado</h1>
          <p>La aventura "{adventureSlug}" no existe en nuestra base de datos.</p>
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
  
  // Contenido: adventure por defecto, fallback a summary si no existe
  const content = getDestinationContentByMode(destination, 'adventure') || summary || '';
  
  // Relaciones
  const cityName = city ? getCityDisplayName(city) : destination.citySlug;
  const countryName = country?.displayName || destination.countrySlug;
  const countrySlug = destination.countrySlug;
  const citySlug = destination.citySlug;

  // Estado editorial
  const statusLabel = getStatusLabel(destination.status);
  const showStatusWarning = destination.status !== 'published';

  return (
    <div className={styles.container}>
      {/* Breadcrumb de navegación */}
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

      {/* Encabezado del destino */}
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          {destination.type && (
            <span className={styles.typeBadge}>
              {getDestinationTypeLabel(destination.type)}
            </span>
          )}
          {destination.featured && (
            <span className={styles.featuredBadge}>⭐ Destacado</span>
          )}
        </div>
        
        <h1 className={styles.title}>{title}</h1>
        
        <p className={styles.location}>
          📍 {cityName}, {countryName}
        </p>

        {summary && (
          <p className={styles.summary}>{summary}</p>
        )}
      </header>

      {/* Contenido principal */}
      <main className={styles.main}>
        <article className={styles.content}>
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
        </article>

        {/* Sidebar con metadatos */}
        <aside className={styles.sidebar}>
          {/* Información práctica */}
          <section className={styles.infoCard}>
            <h2 className={styles.infoTitle}>Información práctica</h2>
            
            {destination.estimatedVisitTime && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>⏱️ Duración</span>
                <span className={styles.infoValue}>{destination.estimatedVisitTime}</span>
              </div>
            )}
            
            {destination.price && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>💰 Precio</span>
                <span className={styles.infoValue}>
                  {getLocalizedText(destination.price, 'es')}
                </span>
              </div>
            )}
            
            {destination.openingHours && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>🕒 Horario</span>
                <span className={styles.infoValue}>
                  {getLocalizedText(destination.openingHours, 'es')}
                </span>
              </div>
            )}

            {!destination.estimatedVisitTime && !destination.price && !destination.openingHours && (
              <p className={styles.infoEmpty}>Información práctica pendiente de añadir.</p>
            )}
          </section>

          {/* Tags */}
          {destination.tags && destination.tags.length > 0 && (
            <section className={styles.tagsCard}>
              <h2 className={styles.infoTitle}>Etiquetas</h2>
              <div className={styles.tagsList}>
                {destination.tags.map(tag => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </section>
          )}

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
                        {source.title}
                        {source.year && ` (${source.year})`}
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
                <p>📚 Fuentes pendientes de añadir</p>
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
  };
  return labels[type] || type;
}