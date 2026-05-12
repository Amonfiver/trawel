/**
 * Página de ficha de destino/aventura - Ficha Editorial Publicable
 * 
 * Propósito: Mostrar información editorial completa de un destino específico
 * como ficha publicable dentro de Trawel, no como página técnica.
 * 
 * Alcance: 
 * - Hero visual prominente con recuadro claro para foto futura
 * - Relación visible con ciudad y país
 * - Navegación de vuelta a la ciudad
 * - Introducción editorial principal adaptada al modo
 * - Sección "Qué verás" con placeholders visuales honestos
 * - Información útil en sidebar
 * - CTA de comunidad
 * - Fuentes y referencias si están disponibles
 * - Estados amables si faltan datos
 * 
 * Decisiones técnicas:
 * - Usa getAdventurePageData para obtener datos agregados
 * - Contenido según modo global (adventure/student) con fallback
 * - Layout: Hero → Contenido principal + Sidebar
 * - Responsive: adaptación progresiva
 * 
 * Cambios recientes (2026-05-12):
 * - Hero visual con recuadro prominente para foto futura
 * - Sección "Qué verás" con tarjetas fantasma honestas
 * - CTA de comunidad añadido
 * - Navegación relacionada mejorada
 * - Bloque de recursos futuros preparado
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

type VisualKind = 'paisaje' | 'ciudad' | 'monumento' | 'cultura' | 'naturaleza' | 'gastronomia';

interface AdventureVisualProps {
  url?: string;
  alt: string;
  kind: VisualKind;
  className?: string;
  size?: 'hero' | 'card' | 'small';
}

/**
 * Helper interno: Placeholder visual para aventuras
 * Similar al patrón usado en CityPage
 */
function AdventureVisual({ url, alt, kind, className, size = 'card' }: AdventureVisualProps) {
  const kindLabels: Record<VisualKind, { label: string; icon: string }> = {
    paisaje: { label: 'Vista panorámica', icon: '🏔️' },
    ciudad: { label: 'Foto de la ciudad', icon: '📷' },
    monumento: { label: 'Lugar emblemático', icon: '🏛️' },
    cultura: { label: 'Experiencia cultural', icon: '🎭' },
    naturaleza: { label: 'Entorno natural', icon: '🌿' },
    gastronomia: { label: 'Gastronomía local', icon: '🍽️' },
  };

  const config = kindLabels[kind];

  if (url) {
    return (
      <div className={`${styles.visualWrapper} ${styles[size]} ${className || ''}`}>
        <img 
          src={url} 
          alt={alt}
          className={styles.visualImage}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.visualWrapper} ${styles[size]} ${className || ''}`}
      role="img"
      aria-label={alt}
    >
      <div className={styles.visualPlaceholder} data-kind={kind} data-size={size}>
        <span className={styles.placeholderIcon}>{config.icon}</span>
        <span className={styles.placeholderLabel}>{config.label}</span>
        <span className={styles.placeholderSubLabel}>Imagen editorial pendiente</span>
      </div>
    </div>
  );
}

/**
 * Card fantasma para "Qué verás"
 */
function PlaceholderHighlightCard({ 
  title, 
  description,
  kind
}: { 
  title: string; 
  description: string;
  kind: VisualKind;
}) {
  return (
    <div className={styles.highlightCard}>
      <AdventureVisual
        url={undefined}
        alt={`Foto de ${title}`}
        kind={kind}
        className={styles.highlightVisual}
        size="card"
      />
      <div className={styles.highlightContent}>
        <h4 className={styles.highlightTitle}>{title}</h4>
        <p className={styles.highlightDescription}>{description}</p>
      </div>
    </div>
  );
}

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
 * Determina el tipo visual según el tipo de destino
 */
function getVisualKindFromType(type?: string): VisualKind {
  const map: Record<string, VisualKind> = {
    monument: 'monumento',
    museum: 'cultura',
    nature: 'naturaleza',
    experience: 'cultura',
    food: 'gastronomia',
    hiddenGem: 'paisaje',
    temple: 'monumento',
    park: 'naturaleza',
    landmark: 'monumento',
    cultural: 'cultura',
  };
  return map[type || ''] || 'paisaje';
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
          <h1>Esta aventura todavía no está publicada</h1>
          <p className={styles.notFoundDescription}>
            Estamos preparando guías de calidad para nuevos destinos. 
            Las aventuras que publicamos las investigamos a fondo antes de compartirlas.
          </p>
          {city && country ? (
            <Link to={`/pais/${country.slug}/${city.slug}`} className={styles.backLink}>
              ← Explorar más destinos
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

  // Determinar tipo visual
  const visualKind = getVisualKindFromType(destination.type);

  return (
    <div className={styles.container}>
      {/* Hero visual de la Aventura - Con recuadro prominente para foto */}
      <header className={styles.hero}>
        {/* Visual panorámico prominente */}
        <AdventureVisual 
          url={destination.image}
          alt={`Foto principal de ${title}`}
          kind={visualKind}
          className={styles.heroVisual}
          size="hero"
        />
        
        {/* Overlay con contenido */}
        <div className={styles.heroOverlay}>
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

            {destination.estimatedVisitTime && (
              <p className={styles.heroDuration}>
                ⏱️ Duración: {destination.estimatedVisitTime}
              </p>
            )}

            {summary && (
              <p className={styles.heroSummary}>{summary}</p>
            )}
          </div>
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
        <div className={styles.contentColumn}>
          {/* Sección: Qué verás - Con tarjetas fantasma honestas */}
          <section className={styles.highlightsSection} aria-labelledby="highlights-title">
            <div className={styles.sectionHeader}>
              <h2 id="highlights-title" className={styles.sectionTitle}>
                Qué verás
              </h2>
              <p className={styles.sectionSubtitle}>
                Puntos destacados de esta experiencia
              </p>
            </div>

            {/* 3 Tarjetas fantasma de lugares destacados */}
            <div className={styles.highlightsGrid}>
              <PlaceholderHighlightCard 
                title="Punto destacado"
                description="Estamos preparando la información de los elementos más importantes de esta aventura."
                kind="monumento"
              />
              <PlaceholderHighlightCard 
                title="Vista o rincón especial"
                description="Pronto encontrarás aquí los mejores momentos y vistas de esta experiencia."
                kind="paisaje"
              />
              <PlaceholderHighlightCard 
                title="Detalle cultural"
                description="Estamos seleccionando los aspectos culturales y curiosidades más interesantes."
                kind="cultura"
              />
            </div>

            {/* Mensaje honesto */}
            <div className={styles.highlightsMessage}>
              <p className={styles.highlightsMessageText}>
                📸 Estamos preparando los puntos destacados de esta aventura con fotos e información detallada.
              </p>
            </div>
          </section>

          {/* Contenido editorial principal */}
          <article className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>
                {mode === 'adventure' ? 'Qué vivirás en esta aventura' : 'Descubre su historia'}
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

          {/* Espacio reservado para futuras guías */}
          <section className={styles.guidesPlaceholder} aria-labelledby="guides-title">
            <div className={styles.guidesContent}>
              <span className={styles.guidesIcon}>🗂️</span>
              <h2 id="guides-title" className={styles.guidesTitle}>
                Próximamente: guías y recursos para preparar esta experiencia
              </h2>
              <p className={styles.guidesText}>
                Estamos preparando recomendaciones de alojamiento cercano, 
                mejores épocas para visitar y consejos prácticos específicos para esta aventura.
              </p>
            </div>
          </section>

          {/* CTA de comunidad */}
          <section className={styles.communitySection} aria-labelledby="community-title">
            <div className={styles.communityContent}>
              <h2 id="community-title" className={styles.communityTitle}>
                ¿Has vivido esta aventura?
              </h2>
              <p className={styles.communityText}>
                Comparte una mejora, una foto o una experiencia.
                Tu conocimiento puede ayudar a otros viajeros a disfrutar este destino.
              </p>
              <Link to="/compartir" className={styles.communityCta}>
                Compartir una aventura
              </Link>
              <p className={styles.communityTrust}>
                ✓ Todas las propuestas se revisan antes de publicarse
              </p>
            </div>
          </section>
        </div>

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

          {/* Navegación relacionada */}
          {canNavigateBack && (
            <section className={styles.navigationCard}>
              <h2 className={styles.infoTitle}>Explorar</h2>
              <div className={styles.navigationLinks}>
                <Link to={`/pais/${countrySlug}/${citySlug}`} className={styles.navigationLink}>
                  ← Volver a {cityName}
                </Link>
                <Link to={`/pais/${countrySlug}`} className={styles.navigationLink}>
                  🌍 Explorar {countryName}
                </Link>
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