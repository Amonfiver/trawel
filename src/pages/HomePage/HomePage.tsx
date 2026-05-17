/**
 * HomePage - Trawel Atlas Premium
 *
 * Fondo cinematográfico persistente con heroimagen.png como wallpaper.
 * Overlays controlados para legibilidad.
 * Transición suave hacia el atlas.
 *
 * Decisiones técnicas:
 * - WorldMap intacto (NO modificar)
 * - Imagen wallpaper fija en desktop, normal en móvil
 * - Overlays azul (hero) y dorado (atlas)
 * - Texto siempre legible por encima de overlays
 */

import { WorldMap } from '../../features/map/components/WorldMap';
import { useExperienceMode } from '../../features/experienceMode';
import { CountryFlag } from '../../features/countries';
import heroImage from '../../assets/home/heroimagen.png';
import heroLogo from '../../assets/brand/trawelogo-transparent.png';
import styles from './HomePage.module.css';

type ImageKind = 'pais' | 'ciudad' | 'paisaje' | 'monumento' | 'aventura' | 'ruta';

interface DestinationImage {
  url?: string;
  alt: string;
  kind: ImageKind;
}

interface AdventureImage {
  url?: string;
  alt: string;
  kind: ImageKind;
}

const featuredDestinations: Array<{
  slug: string;
  name: string;
  flagCode: string;
  description: string;
  image: DestinationImage;
}> = [
  {
    slug: 'espana',
    name: 'España',
    flagCode: 'ES',
    description: 'Desde pueblos medievales hasta costas atlánticas. Historia, gastronomía y rutas para todos los gustos.',
    image: {
      alt: 'Vista panorámica de España con pueblos blancos y costa mediterránea',
      kind: 'pais',
    },
  },
  {
    slug: 'mexico',
    name: 'México',
    flagCode: 'MX',
    description: 'Cultura milenaria, pueblos mágicos y una gastronomía reconocida en todo el mundo.',
    image: {
      alt: 'Paisaje mexicano con ruinas mayas y vegetación tropical',
      kind: 'pais',
    },
  },
  {
    slug: 'italia',
    name: 'Italia',
    flagCode: 'IT',
    description: 'Arte, historia y paisajes que han inspirado a viajeros durante siglos.',
    image: {
      alt: 'Colinas de la Toscana con viñedos y cipreses al atardecer',
      kind: 'pais',
    },
  },
  {
    slug: 'india',
    name: 'India',
    flagCode: 'IN',
    description: 'Un continente de contrastes donde cada región ofrece una experiencia única.',
    image: {
      alt: 'Taj Mahal al amanecer con reflejo en el agua',
      kind: 'monumento',
    },
  },
];

const featuredAdventures: Array<{
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  comingSoon: boolean;
  image: AdventureImage;
}> = [
  {
    id: '1',
    title: 'Ruta por los pueblos medievales de Aragón',
    location: 'Albarracín, España',
    type: 'Cultura y naturaleza',
    description: 'Un recorrido por calles empedradas, casas colgadas y paisajes de montaña que parecen detenidos en el tiempo.',
    comingSoon: false,
    image: {
      alt: 'Calles empedradas de Albarracín con casas de piedra rojiza',
      kind: 'ciudad',
    },
  },
  {
    id: '2',
    title: 'Descubriendo la Costa Amalfitana',
    location: 'Italia',
    type: 'Aventura costera',
    description: 'Pueblos colgados sobre acantilados, limoneros y vistas al Mediterráneo que justifican cada curva del camino.',
    comingSoon: true,
    image: {
      alt: 'Positano con sus casas coloridas sobre el mar Mediterráneo',
      kind: 'paisaje',
    },
  },
  {
    id: '3',
    title: 'Templos y mercados de Rajasthan',
    location: 'India',
    type: 'Viaje cultural',
    description: 'Fortalezas de arena rosa, palacios flotantes y el caos organizado de los bazares indios.',
    comingSoon: true,
    image: {
      alt: 'Fuerte de Jaipur al atardecer con su fachada rosa iluminada',
      kind: 'monumento',
    },
  },
];

/**
 * Placeholder visual para imágenes futuras
 */
function ImagePlaceholder({ kind, alt }: { kind: ImageKind; alt: string }) {
  const kindLabels: Record<ImageKind, string> = {
    pais: 'Vista del país',
    ciudad: 'Vista urbana',
    paisaje: 'Paisaje destacado',
    monumento: 'Lugar emblemático',
    aventura: 'Experiencia de viaje',
    ruta: 'Ruta por descubrir',
  };

  return (
    <div
      className={styles.imagePlaceholder}
      role="img"
      aria-label={alt}
    >
      <div className={styles.placeholderGradient} data-kind={kind}>
        <span className={styles.placeholderLabel}>{kindLabels[kind]}</span>
        <span className={styles.placeholderHint}>Fotografía pendiente</span>
      </div>
    </div>
  );
}

/**
 * Componente de imagen con fallback a placeholder
 */
function CardImage({
  image,
  className
}: {
  image: { url?: string; alt: string; kind: ImageKind };
  className?: string;
}) {
  if (image.url) {
    return (
      <div className={`${styles.cardImageWrapper} ${className || ''}`}>
        <img
          src={image.url}
          alt={image.alt}
          className={styles.cardImage}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`${styles.cardImageWrapper} ${className || ''}`}>
      <ImagePlaceholder kind={image.kind} alt={image.alt} />
    </div>
  );
}

/**
 * HomePage - Página principal de Trawel
 */
export function HomePage() {
  const { mode: experienceMode } = useExperienceMode();

  const heroSubtitle =
    experienceMode === 'student'
      ? 'Descubre el mundo a través de su historia, cultura y contexto. Una forma diferente de viajar antes de emprender el camino.'
      : 'Explora países, descubre rutas y transforma cada destino en una aventura real. Historias vividas, planes detallados.';

  return (
    <div className={styles.container}>
      {/* WALLPAPER FIJO - Fondo cinematográfico */}
      <div className={styles.wallpaper} aria-hidden="true">
        <img 
          src={heroImage} 
          alt="" 
          className={styles.wallpaperImage}
        />
      </div>

      {/* HERO - Con overlay azul oscuro */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <span className={styles.heroEyebrow}>Atlas interactivo de viajes</span>
          
          {/* Logo protagonista en el hero */}
          <div className={styles.heroLogo}>
            <img 
              src={heroLogo} 
              alt="Trawel" 
              className={styles.heroLogoImage}
            />
          </div>
          
          <h1 id="hero-title" className={styles.heroTitle}>
            El mundo no empieza
            <span className={styles.heroTitleBreak}>en una lista.</span>
            <span className={styles.heroTitleAccent}>Empieza en un mapa.</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            {heroSubtitle}
          </p>

          {/* CTAs */}
          <div className={styles.heroCtas}>
            <a href="#atlas-mundial" className={styles.heroCtaPrimary}>
              <span className={styles.heroCtaIcon}>🗺️</span>
              Abrir el atlas
            </a>
            <a href="#destinos" className={styles.heroCtaSecondary}>
              Explorar destinos
            </a>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className={styles.scrollHint} aria-hidden="true">
          <div className={styles.scrollLine} />
        </div>
      </section>

      {/* SECCIÓN ATLAS - Con base dorada/amarilla */}
      <section id="atlas-mundial" className={styles.atlasSection} aria-labelledby="atlas-title">
        <div className={styles.atlasContainer}>
          <div className={styles.atlasFrame}>
            <div className={styles.atlasHeader}>
              <span className={styles.atlasEyebrow}>Explora</span>
              <h2 id="atlas-title" className={styles.atlasTitle}>Atlas Mundial</h2>
              <p className={styles.atlasSubtitle}>Haz clic en cualquier país para empezar tu aventura</p>
            </div>

            <div className={styles.mapPortal}>
              <WorldMap />
            </div>
          </div>

          {/* Tarjetas de valor */}
          <div className={styles.valueCards}>
            <article className={styles.valueCard}>
              <div className={styles.valueCardIcon} aria-hidden="true">🌍</div>
              <h3 className={styles.valueCardTitle}>Explora países desde el mapa</h3>
              <p className={styles.valueCardText}>Navega visualmente por el mundo y descubre destinos que no sabías que existían.</p>
            </article>
            <article className={styles.valueCard}>
              <div className={styles.valueCardIcon} aria-hidden="true">🗺️</div>
              <h3 className={styles.valueCardTitle}>Descubre zonas y aventuras</h3>
              <p className={styles.valueCardText}>Cada país esconde regiones únicas con rutas practicadas y experiencias reales.</p>
            </article>
            <article className={styles.valueCard}>
              <div className={styles.valueCardIcon} aria-hidden="true">📚</div>
              <h3 className={styles.valueCardTitle}>Aprende viajando</h3>
              <p className={styles.valueCardText}>Contexto histórico, datos culturales y curiosidades que enriquecen cada destino.</p>
            </article>
          </div>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <main className={styles.main}>
        {/* Destinos destacados */}
        <section id="destinos" className={styles.section} aria-labelledby="destinations-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Destinos</span>
            <h2 id="destinations-title" className={styles.sectionTitle}>
              Empieza tu exploración
            </h2>
            <p className={styles.sectionDescription}>
              Países con contenido disponible o en preparación. Selecciona uno para descubrir su mapa, zonas y aventuras.
            </p>
          </div>

          <div className={styles.destinationsGrid}>
            {featuredDestinations.map(dest => (
              <a
                key={dest.slug}
                href={`/pais/${dest.slug}`}
                className={styles.destinationCard}
              >
                <CardImage image={dest.image} className={styles.destinationImage} />
                <div className={styles.destinationContent}>
                  <div className={styles.destinationHeader}>
                    <CountryFlag
                      isoAlpha2={dest.flagCode}
                      countryName={dest.name}
                      size="medium"
                    />
                    <h3 className={styles.destinationName}>{dest.name}</h3>
                  </div>
                  <p className={styles.destinationDescription}>{dest.description}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Aventuras */}
        <section id="aventuras" className={styles.section} aria-labelledby="adventures-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Aventuras</span>
            <h2 id="adventures-title" className={styles.sectionTitle}>
              Planes destacados
            </h2>
            <p className={styles.sectionDescription}>
              Ideas de viaje que Trawel quiere destacar. Algunas ya disponibles, otras en preparación.
            </p>
          </div>

          <div className={styles.adventuresGrid}>
            {featuredAdventures.map(adventure => (
              <article key={adventure.id} className={styles.adventureCard}>
                <CardImage image={adventure.image} className={styles.adventureImage} />
                <div className={styles.adventureContent}>
                  <div className={styles.adventureMeta}>
                    <span className={styles.adventureType}>{adventure.type}</span>
                    {adventure.comingSoon && (
                      <span className={styles.comingSoonBadge}>Próximamente</span>
                    )}
                  </div>
                  <h3 className={styles.adventureTitle}>{adventure.title}</h3>
                  <p className={styles.adventureLocation}>📍 {adventure.location}</p>
                  <p className={styles.adventureDescription}>{adventure.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA compartir */}
        <section className={styles.shareSection} aria-labelledby="share-title">
          <div className={styles.shareContent}>
            <span className={styles.shareEyebrow}>Comunidad</span>
            <h2 id="share-title" className={styles.shareTitle}>
              ¿Tienes una experiencia que contar?
            </h2>
            <p className={styles.shareDescription}>
              Comparte tu aventura con la comunidad Trawel. Todas las historias se revisan antes de publicarse.
            </p>
            <a href="/compartir" className={styles.shareCta}>
              Compartir mi aventura
            </a>
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
          <hr className={styles.footerDivider} />
          <p className={styles.footerCopyright}>© 2026 Trawel</p>
        </div>
      </footer>
    </div>
  );
}