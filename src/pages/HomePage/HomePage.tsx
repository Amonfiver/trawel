/**
 * Página de inicio de Trawel
 * 
 * Propósito: Punto de entrada editorial con mapa protagonista
 * Alcance: Hero, mapa interactivo, modos de viaje, destinos y aventuras destacadas
 * 
 * Decisiones técnicas:
 * - WorldMap como elemento principal visual
 * - Contenido editorial hardcodeado inicialmente
 * - Estructura preparada para datos dinámicos futuros
 */

import { WorldMap } from '../../features/map/components/WorldMap';
import { useExperienceMode } from '../../features/experienceMode';
import { CountryFlag } from '../../features/countries';
import styles from './HomePage.module.css';

const featuredDestinations = [
  {
    slug: 'espana',
    name: 'España',
    flagCode: 'ES',
    description: 'Desde pueblos medievales hasta costas atlánticas. Historia, gastronomía y rutas para todos los gustos.',
  },
  {
    slug: 'mexico',
    name: 'México',
    flagCode: 'MX',
    description: 'Cultura milenaria, pueblos mágicos y una gastronomía reconocida en todo el mundo.',
  },
  {
    slug: 'italia',
    name: 'Italia',
    flagCode: 'IT',
    description: 'Arte, historia y paisajes que han inspirado a viajeros durante siglos.',
  },
  {
    slug: 'india',
    name: 'India',
    flagCode: 'IN',
    description: 'Un continente de contrastes donde cada región ofrece una experiencia única.',
  },
];

const featuredAdventures = [
  {
    id: '1',
    title: 'Ruta por los pueblos medievales de Aragón',
    location: 'Albarracín, España',
    type: 'Cultura y naturaleza',
    description: 'Un recorrido por calles empedradas, casas colgadas y paisajes de montaña que parecen detenidos en el tiempo.',
    comingSoon: false,
  },
  {
    id: '2',
    title: 'Descubriendo la Costa Amalfitana',
    location: 'Italia',
    type: 'Aventura costera',
    description: 'Pueblos colgados sobre acantilados, limoneros y vistas al Mediterráneo que justifican cada curva del camino.',
    comingSoon: true,
  },
  {
    id: '3',
    title: 'Templos y mercados de Rajasthan',
    location: 'India',
    type: 'Viaje cultural',
    description: 'Fortalezas de arena rosa, palacios flotantes y el caos organizado de los bazares indios.',
    comingSoon: true,
  },
];

/**
 * HomePage - Página principal de Trawel
 * 
 * Presenta el mapa mundial como elemento central de exploración,
 * con contenido editorial que explica la propuesta de valor.
 */
export function HomePage() {
  const { mode: experienceMode } = useExperienceMode();

  const heroSubtitle =
    experienceMode === 'student'
      ? 'Descubre destinos a través de su historia, cultura y contexto. Una forma diferente de entender el mundo antes de visitarlo.'
      : 'Inspírate con historias reales, rutas practicadas y planes detallados para tu próximo viaje.';

  return (
    <div className={styles.container}>
      {/* Hero editorial */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <h1 id="hero-title" className={styles.heroTitle}>
            Historias reales para viajes inolvidables
          </h1>
          <p className={styles.heroSubtitle}>
            {heroSubtitle}
          </p>
          <a href="#mapa-mundial" className={styles.heroCta}>
            Explora el mapa
          </a>
        </div>

        {/* Mapa mundial - Elemento principal */}
        <div id="mapa-mundial" className={styles.mapContainer}>
          <WorldMap />
          <p className={styles.mapHint}>
            Haz click en un país para empezar a explorar
          </p>
        </div>
      </section>

      {/* Contenido principal */}
      <main className={styles.main}>
        {/* Sección de modos de viaje */}
        <section className={styles.section} aria-labelledby="modes-title">
          <h2 id="modes-title" className={styles.sectionTitle}>
            Elige cómo quieres viajar
          </h2>
          <p className={styles.sectionDescription}>
            Trawel se adapta a tu forma de descubrir el mundo. Cambia de modo cuando quieras desde el selector superior.
          </p>

          <div className={styles.modesGrid}>
            <article className={styles.modeCard}>
              <div className={styles.modeIcon}>🎒</div>
              <h3 className={styles.modeTitle}>Modo Aventura</h3>
              <ul className={styles.modeFeatures}>
                <li>Rutas y planes detallados</li>
                <li>Lugares especiales fuera de lo común</li>
                <li>Experiencias vividas por otros viajeros</li>
                <li>Consejos prácticos para cada etapa</li>
              </ul>
            </article>

            <article className={styles.modeCard}>
              <div className={styles.modeIcon}>🎓</div>
              <h3 className={styles.modeTitle}>Modo Estudiante</h3>
              <ul className={styles.modeFeatures}>
                <li>Contexto histórico y cultural</li>
                <li>Datos para entender cada destino</li>
                <li>Enfoque de aprendizaje y descubrimiento</li>
                <li>Contenido estructurado por temas</li>
              </ul>
            </article>
          </div>
        </section>

        {/* Destinos destacados */}
        <section className={styles.section} aria-labelledby="destinations-title">
          <h2 id="destinations-title" className={styles.sectionTitle}>
            Destinos destacados
          </h2>
          <p className={styles.sectionDescription}>
            Empieza tu exploración por estos países con contenido disponible o en preparación.
          </p>

          <div className={styles.destinationsGrid}>
            {featuredDestinations.map(dest => (
              <a
                key={dest.slug}
                href={`/pais/${dest.slug}`}
                className={styles.destinationCard}
              >
                <div className={styles.destinationHeader}>
                  <CountryFlag
                    isoAlpha2={dest.flagCode}
                    countryName={dest.name}
                    size="medium"
                  />
                  <h3 className={styles.destinationName}>{dest.name}</h3>
                </div>
                <p className={styles.destinationDescription}>{dest.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Aventuras y planes destacados */}
        <section className={styles.section} aria-labelledby="adventures-title">
          <h2 id="adventures-title" className={styles.sectionTitle}>
            Aventuras y planes destacados
          </h2>
          <p className={styles.sectionDescription}>
            Ideas de viaje que Trawel quiere destacar. Algunas ya disponibles, otras en preparación.
          </p>

          <div className={styles.adventuresGrid}>
            {featuredAdventures.map(adventure => (
              <article key={adventure.id} className={styles.adventureCard}>
                <div className={styles.adventureMeta}>
                  <span className={styles.adventureType}>{adventure.type}</span>
                  {adventure.comingSoon && (
                    <span className={styles.comingSoonBadge}>Próximamente</span>
                  )}
                </div>
                <h3 className={styles.adventureTitle}>{adventure.title}</h3>
                <p className={styles.adventureLocation}>📍 {adventure.location}</p>
                <p className={styles.adventureDescription}>{adventure.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA para compartir */}
        <section className={styles.shareSection} aria-labelledby="share-title">
          <h2 id="share-title" className={styles.shareTitle}>
            ¿Tienes una experiencia que contar?
          </h2>
          <p className={styles.shareDescription}>
            Comparte tu aventura con la comunidad Trawel. Todas las historias se revisan antes de publicarse para mantener la calidad del contenido.
          </p>
          <a href="/compartir" className={styles.shareCta}>
            Compartir mi aventura
          </a>
        </section>

        {/* Zona de recursos futuros (AdSense-safe placeholder) */}
        <section className={styles.resourcesSection} aria-labelledby="resources-title">
          <div className={styles.resourcesHeader}>
            <span className={styles.resourcesEyebrow}>En preparación</span>
            <h2 id="resources-title" className={styles.sectionTitle}>
              Guías, recursos y recomendaciones
            </h2>
            <p className={styles.sectionDescription}>
              Pronto encontrarás aquí selecciones de recursos útiles para preparar tus viajes. Esta zona está reservada para futuro contenido editorial.
            </p>
          </div>

          <div className={styles.resourcesGrid}>
            <article className={styles.resourcePlaceholder}>
              <h3 className={styles.resourceTitle}>Preparación de viajes</h3>
              <p className={styles.resourceText}>Espacio reservado para futuras guías y checklists.</p>
            </article>
            <article className={styles.resourcePlaceholder}>
              <h3 className={styles.resourceTitle}>Recursos por destino</h3>
              <p className={styles.resourceText}>Espacio reservado para recomendaciones específicas.</p>
            </article>
            <article className={styles.resourcePlaceholder}>
              <h3 className={styles.resourceTitle}>Espacio editorial</h3>
              <p className={styles.resourceText}>Reservado para futuras colaboraciones y contenido patrocinado.</p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerTagline}>
            Descubre el mundo a través de historias reales de viajeros.
          </p>
          <nav className={styles.footerNav} aria-label="Enlaces de pie de página">
            <a href="/" className={styles.footerLink}>Inicio</a>
            <a href="/mapa" className={styles.footerLink}>Mapa del sitio</a>
            <a href="/sobre-trawel" className={styles.footerLink}>Sobre Trawel</a>
            <a href="/privacidad" className={styles.footerLink}>Privacidad</a>
            <a href="/contacto" className={styles.footerLink}>Contacto</a>
          </nav>
          <p className={styles.footerCopyright}>© 2026 Trawel</p>
        </div>
      </footer>
    </div>
  );
}