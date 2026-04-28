/**
 * Página de detalle de aventura/destino
 * 
 * Propósito: Mostrar información detallada de un destino específico
 * Alcance: Contenido editorial completo del destino
 * 
 * Decisiones técnicas:
 * - Usa getDestinationBySlug para obtener datos reales del destino
 * - Muestra contenido en modo adventure por defecto
 * - Muestra metadatos: tags, tiempo de visita, fuentes
 * - Enlace de retorno a la ciudad si está disponible
 * 
 * Limitaciones actuales:
 * - Sin selector de modo de experiencia (siempre adventure)
 * - Sin galería de imágenes
 * - Sin mapa del destino
 */

import { useParams, Link } from 'react-router-dom';
import { getAdventurePageData } from '../../features/travelData';
import { getDestinationContentByMode, getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import styles from './AdventurePage.module.css';

export function AdventurePage() {
  const { adventureSlug } = useParams<{ adventureSlug: string }>();
  
  // Usar travelData.service para obtener datos agregados
  const { destination, city, country } = getAdventurePageData(adventureSlug || '');

  // Destino no encontrado
  if (!destination) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Destino no encontrado</h1>
          <p>La aventura "{adventureSlug}" no existe en nuestra base de datos.</p>
          <Link to="/" className={styles.backLink}>
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const title = getDestinationTitle(destination);
  const summary = getDestinationSummary(destination);
  const content = getDestinationContentByMode(destination, 'adventure');
  const cityName = city ? getCityDisplayName(city) : destination.citySlug;
  const countryName = country?.displayName || destination.countrySlug;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.breadcrumbs}>
          <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
          <span className={styles.breadcrumbSeparator}>›</span>
          {country && (
            <>
              <Link to={`/pais/${destination.countrySlug}`} className={styles.breadcrumbLink}>
                {countryName}
              </Link>
              <span className={styles.breadcrumbSeparator}>›</span>
            </>
          )}
          {city && (
            <>
              <Link to={`/pais/${destination.countrySlug}/${destination.citySlug}`} className={styles.breadcrumbLink}>
                {cityName}
              </Link>
              <span className={styles.breadcrumbSeparator}>›</span>
            </>
          )}
          <span className={styles.breadcrumbCurrent}>{title}</span>
        </div>
        
        <div className={styles.headerContent}>
          {destination.type && (
            <span className={styles.destinationType}>
              {getDestinationTypeLabel(destination.type)}
            </span>
          )}
          {destination.featured && (
            <span className={styles.featuredBadge}>⭐ Destacado</span>
          )}
          
          <h1 className={styles.title}>{title}</h1>
          
          {summary && (
            <p className={styles.summary}>{summary}</p>
          )}
          
          <div className={styles.headerMeta}>
            <span className={styles.location}>
              📍 {cityName}, {countryName}
            </span>
            {destination.estimatedVisitTime && (
              <span className={styles.visitTime}>
                ⏱️ {destination.estimatedVisitTime}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Tags */}
        {destination.tags && destination.tags.length > 0 && (
          <div className={styles.tagsSection}>
            {destination.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        {/* Contenido principal */}
        <article className={styles.content}>
          {content ? (
            <div className={styles.contentText}>
              {content.split('\n\n').map((paragraph, index) => (
                <p key={index} className={styles.paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className={styles.noContent}>
              Contenido detallado próximamente...
            </p>
          )}
        </article>

        {/* Información práctica */}
        <aside className={styles.sidebar}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Información práctica</h3>
            
            {destination.price && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Precio</span>
                <span className={styles.infoValue}>
                  {getLocalizedTextStatic(destination.price)}
                </span>
              </div>
            )}
            
            {destination.openingHours && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Horario</span>
                <span className={styles.infoValue}>
                  {getLocalizedTextStatic(destination.openingHours)}
                </span>
              </div>
            )}
            
            {destination.estimatedVisitTime && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Duración recomendada</span>
                <span className={styles.infoValue}>{destination.estimatedVisitTime}</span>
              </div>
            )}
          </div>

          {/* Fuentes */}
          {destination.sources && destination.sources.length > 0 && (
            <div className={styles.sourcesCard}>
              <h3 className={styles.infoTitle}>Fuentes y referencias</h3>
              <ul className={styles.sourcesList}>
                {destination.sources.map((source, index) => (
                  <li key={index} className={styles.sourceItem}>
                    {source.type === 'website' && source.url ? (
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.sourceLink}
                      >
                        {source.title}
                        {source.author && ` - ${source.author}`}
                        {source.year && ` (${source.year})`}
                      </a>
                    ) : (
                      <span>
                        {source.title}
                        {source.author && ` - ${source.author}`}
                        {source.year && ` (${source.year})`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
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

/** Helper simple para obtener texto localizado (fallback a español) */
function getLocalizedTextStatic(text: { es?: string } | undefined): string {
  return text?.es || '';
}