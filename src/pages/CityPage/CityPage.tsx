/**
 * Página de ficha de ciudad - Nivel Ciudad / Editorial Local
 * 
 * Propósito: Mostrar información editorial completa de una ciudad y sus destinos
 * como página editorial dentro de Trawel, no como ficha técnica.
 * 
 * Alcance: 
 * - Hero visual de ciudad con placeholder panorámico prominente
 * - Introducción editorial según modo (adventure/student)
 * - Sección "Qué ver" con tarjetas fantasma de lugares destacados
 * - Sección "Experiencias y rutas" con cards visuales reforzadas
 * - CTA de comunidad
 * - Espacio reservado para futuras guías
 * - Estado vacío amable si no hay destinos
 * 
 * Decisiones técnicas:
 * - Usa getCityPageData para obtener datos agregados
 * - Contenido según modo global con fallback automático
 * - Placeholders visuales prominentes preparados para fotos futuras
 * - Jerarquía visual: Hero → Qué ver → Experiencias → Comunidad
 * - Responsive: adaptación progresiva de grids
 */

import { useParams, Link } from 'react-router-dom';
import { getCityPageData } from '../../features/travelData';
import { getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getDestinationTitle, getDestinationSummary } from '../../features/destinations/data/destinations.utils';
import { getLocalizedText } from '../../app/i18n';
import { useExperienceMode } from '../../features/experienceMode';
import type { CityStatus } from '../../features/cities/types/city.types';
import type { ExperienceMode } from '../../features/experienceMode';
import type { Destination } from '../../features/destinations/types/destination.types';
import styles from './CityPage.module.css';

type VisualKind = 'paisaje' | 'ciudad' | 'monumento' | 'cultura' | 'naturaleza' | 'gastronomia';

interface CityVisualProps {
  url?: string;
  alt: string;
  kind: VisualKind;
  className?: string;
  size?: 'hero' | 'card' | 'small';
}

/**
 * Placeholder visual prominente para ciudades
 * Muestra un recuadro claro de foto futura con icono y texto
 */
function CityVisual({ url, alt, kind, className, size = 'card' }: CityVisualProps) {
  const kindLabels: Record<VisualKind, { label: string; icon: string }> = {
    paisaje: { label: 'Vista panorámica', icon: '🏔️' },
    ciudad: { label: 'Foto panorámica de la ciudad', icon: '📷' },
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
 * Card de lugar fantasma para "Qué ver"
 */
function PlaceholderHighlightCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className={styles.highlightCard}>
      <div className={styles.highlightVisual}>
        <div className={styles.highlightPlaceholder}>
          <span className={styles.highlightIcon}>{icon}</span>
          <span className={styles.highlightLabel}>{title}</span>
          <span className={styles.highlightSubLabel}>Foto pendiente</span>
        </div>
      </div>
      <div className={styles.highlightContent}>
        <h4 className={styles.highlightTitle}>{title}</h4>
        <p className={styles.highlightDescription}>{description}</p>
      </div>
    </div>
  );
}

/**
 * Card visual para experiencias con placeholder reforzado
 */
function ExperienceCard({ 
  destination, 
  cityName 
}: { 
  destination: Destination;
  cityName: string;
}) {
  const title = getDestinationTitle(destination);
  const summary = getDestinationSummary(destination);
  
  // Determinar tipo visual según el tipo de destino
  const getVisualKind = (type?: string): VisualKind => {
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
  };

  return (
    <article className={styles.experienceCard}>
      <CityVisual 
        url={undefined} 
        alt={`Foto de ${title} en ${cityName}`}
        kind={getVisualKind(destination.type)}
        className={styles.experienceVisual}
        size="card"
      />
      <div className={styles.experienceContent}>
        <div className={styles.experienceMeta}>
          {destination.type && (
            <span className={styles.experienceType}>
              {getDestinationTypeLabel(destination.type)}
            </span>
          )}
          {destination.featured && (
            <span className={styles.featuredBadgeSmall}>⭐ Destacado</span>
          )}
        </div>
        
        <h3 className={styles.experienceTitle}>
          <Link to={`/aventura/${destination.slug}`} className={styles.experienceLink}>
            {title}
          </Link>
        </h3>
        
        {summary && (
          <p className={styles.experienceSummary}>{summary}</p>
        )}
        
        <div className={styles.experienceFooter}>
          {destination.estimatedVisitTime && (
            <span className={styles.experienceDuration}>
              ⏱️ {destination.estimatedVisitTime}
            </span>
          )}
          <span className={styles.experienceArrow}>→</span>
        </div>
      </div>
    </article>
  );
}

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
 * Muestra un hero visual prominente de la ciudad y organiza el contenido
 * en secciones editoriales claras con espacios de foto bien definidos.
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
          <h1>Esta ciudad todavía no está en Trawel</h1>
          <p className={styles.notFoundDescription}>
            Estamos preparando nuevos destinos poco a poco. 
            Las ciudades que añadimos las investigamos a fondo para ofrecerte guías de calidad.
          </p>
          {country ? (
            <Link to={`/pais/${countrySlug}`} className={styles.backLink}>
              ← Explorar {country.displayName}
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

  // Etiquetas según modo
  const modeLabels = {
    adventure: { icon: '🎒', title: 'Modo Aventura', subtitle: 'Experiencias y planes para vivir' },
    student: { icon: '🎓', title: 'Modo Estudiante', subtitle: 'Historia, cultura y contexto' },
  };
  const currentModeLabel = modeLabels[mode];

  return (
    <div className={styles.container}>
      {/* Hero visual de la Ciudad - Recuadro panorámico prominente */}
      <header className={styles.hero}>
        {/* Visual panorámico con altura real */}
        <CityVisual 
          url={undefined}
          alt={`Foto panorámica de ${cityName}`}
          kind="ciudad"
          className={styles.heroVisual}
          size="hero"
        />
        
        {/* Overlay con contenido */}
        <div className={styles.heroOverlay}>
          {/* Breadcrumb */}
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
            </div>
            
            <h1 className={styles.heroTitle}>{cityName}</h1>
            
            {country && (
              <p className={styles.heroLocation}>
                📍 {country.displayName}
              </p>
            )}

            {description && (
              <p className={styles.heroDescription}>{description}</p>
            )}
          </div>
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
        {/* Sección: Qué ver - Con 3 tarjetas fantasma de lugares */}
        <section className={styles.section} aria-labelledby="highlights-title">
          <div className={styles.sectionHeader}>
            <h2 id="highlights-title" className={styles.sectionTitle}>
              Qué ver en {cityName}
            </h2>
            <p className={styles.sectionSubtitle}>
              Lugares emblemáticos y rincones especiales
            </p>
          </div>

          {/* 3 Tarjetas fantasma de lugares destacados */}
          <div className={styles.highlightsGrid}>
            <PlaceholderHighlightCard 
              icon="🏛️"
              title="Lugar destacado"
              description="Estamos preparando la información de los monumentos y edificios más importantes de la ciudad."
            />
            <PlaceholderHighlightCard 
              icon="🌄"
              title="Mirador o monumento"
              description="Pronto encontrarás aquí los mejores puntos panorámicos y vistas de la ciudad."
            />
            <PlaceholderHighlightCard 
              icon="🚶"
              title="Ruta o zona especial"
              description="Estamos seleccionando las rutas más interesantes y zonas con encanto para recorrer."
            />
          </div>

          {/* Mensaje honesto */}
          <div className={styles.highlightsMessage}>
            <p className={styles.highlightsMessageText}>
              📸 Estamos preparando los lugares destacados de esta ciudad con fotos e información detallada.
            </p>
          </div>
        </section>

        {/* Espacio reservado para futuras guías (AdSense-safe placeholder) */}
        <section className={styles.guidesPlaceholder} aria-labelledby="guides-title">
          <div className={styles.guidesContent}>
            <span className={styles.guidesIcon}>🗂️</span>
            <h2 id="guides-title" className={styles.guidesTitle}>
              Próximamente: guías y recursos para preparar tu visita
            </h2>
            <p className={styles.guidesText}>
              Estamos preparando recomendaciones de alojamiento, 
              mejores épocas para visitar y consejos prácticos para {cityName}.
            </p>
          </div>
        </section>

        {/* Sección: Experiencias y rutas - Cards con bloques de foto visibles */}
        <section className={styles.section} aria-labelledby="experiences-title">
          <div className={styles.sectionHeader}>
            <div className={styles.modeIndicator}>
              <span className={styles.modeIcon}>{currentModeLabel.icon}</span>
              <div className={styles.modeText}>
                <span className={styles.modeName}>{currentModeLabel.title}</span>
                <span className={styles.modeSubtitle}>{currentModeLabel.subtitle}</span>
              </div>
            </div>
            <h2 id="experiences-title" className={styles.sectionTitle}>
              Experiencias y rutas
            </h2>
            <p className={styles.sectionSubtitle}>
              Aventuras seleccionadas en {cityName}
            </p>
          </div>

          {destinations.length > 0 ? (
            <div className={styles.experiencesGrid} role="list">
              {destinations.map(destination => (
                <ExperienceCard 
                  key={destination.id} 
                  destination={destination}
                  cityName={cityName}
                />
              ))}
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

        {/* CTA de comunidad */}
        <section className={styles.communitySection} aria-labelledby="community-title">
          <div className={styles.communityContent}>
            <h2 id="community-title" className={styles.communityTitle}>
              ¿Conoces un plan en {cityName}?
            </h2>
            <p className={styles.communityText}>
              Comparte una aventura, evento o lugar especial que hayas descubierto.
              Tu experiencia puede ayudar a otros viajeros a disfrutar la ciudad.
            </p>
            <Link to="/compartir" className={styles.communityCta}>
              Compartir una aventura
            </Link>
            <p className={styles.communityTrust}>
              ✓ Todas las propuestas se revisan antes de publicarse
            </p>
          </div>
        </section>

        {/* Sección Secundaria: Información práctica */}
        <section className={styles.infoSection} aria-labelledby="info-title">
          <div className={styles.sectionHeaderSecondary}>
            <h2 id="info-title" className={styles.sectionTitleSecondary}>
              Información práctica
            </h2>
          </div>
          
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <span className={styles.infoIcon}>🗺️</span>
              <span className={styles.infoLabel}>Experiencias</span>
              <span className={styles.infoValue}>{destinations.length}</span>
            </div>
            
            {city.coordinates && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <span className={styles.infoLabel}>Coordenadas</span>
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
                <span className={styles.infoIcon}>🌍</span>
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