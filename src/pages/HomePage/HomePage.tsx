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

import { useEffect, useState } from 'react';
import { WorldMap } from '../../features/map/components/WorldMap';
import { useExperienceMode } from '../../features/experienceMode';
import { CountryFlag } from '../../features/countries';
import { MonetizationSlot } from '../../features/travelData/components/MonetizationSlot';
import {
  getHomeScreenFallbackData,
  getResolvedHomeScreenData,
  type HomeScreenImage,
  type ResolvedHomeScreenData,
} from '../../features/travelData';
import styles from './HomePage.module.css';

/**
 * Placeholder visual para imágenes futuras
 */
function ImagePlaceholder({ kind, alt }: { kind: HomeScreenImage['kind']; alt: string }) {
  const kindLabels: Record<HomeScreenImage['kind'], string> = {
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
  image: HomeScreenImage;
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
  const fallbackScreenData = getHomeScreenFallbackData(experienceMode);
  const [resolvedScreenData, setResolvedScreenData] =
    useState<ResolvedHomeScreenData | null>(null);
  const screenData =
    resolvedScreenData?.hero.subtitle === fallbackScreenData.hero.subtitle
      ? resolvedScreenData
      : fallbackScreenData;

  useEffect(() => {
    let isMounted = true;

    const loadHomeScreenData = async () => {
      const nextScreenData = await getResolvedHomeScreenData(experienceMode);

      if (isMounted) {
        setResolvedScreenData(nextScreenData);
      }
    };

    loadHomeScreenData();

    return () => {
      isMounted = false;
    };
  }, [experienceMode]);

  return (
    <div className={styles.container}>
      {/* WALLPAPER FIJO - Fondo cinematográfico */}
      <div className={styles.wallpaper} aria-hidden="true">
        <img 
          src={screenData.hero.wallpaperImageUrl} 
          alt="" 
          className={styles.wallpaperImage}
        />
      </div>
      
      {/* OVERLAY FIJO - Mismo comportamiento que wallpaper */}
      <div className={styles.wallpaperOverlay} aria-hidden="true" />

      {/* HERO - Con overlay azul oscuro */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          {/* Logo protagonista en el hero */}
          <div className={styles.heroLogo}>
            <img 
              src={screenData.hero.logoImageUrl} 
              alt={screenData.hero.logoAlt} 
              className={styles.heroLogoImage}
            />
          </div>
          
          <h1 id="hero-title" className={styles.heroTitle}>
            {screenData.hero.titleLines.first}
            <span className={styles.heroTitleBreak}>{screenData.hero.titleLines.second}</span>
            <span className={styles.heroTitleAccent}>{screenData.hero.titleLines.accent}</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            {screenData.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className={styles.heroCtas}>
            <a href={screenData.hero.primaryCta.href} className={styles.heroCtaPrimary}>
              <span className={styles.heroCtaIcon}>{screenData.hero.primaryCta.icon}</span>
              {screenData.hero.primaryCta.label}
            </a>
            <a href={screenData.hero.secondaryCta.href} className={styles.heroCtaSecondary}>
              {screenData.hero.secondaryCta.label}
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

          {/* Franja de beneficios */}
          <div className={styles.benefitsStrip}>
            <article className={styles.benefitItem}>
              <span className={styles.benefitIcon} aria-hidden="true">🌍</span>
              <div className={styles.benefitContent}>
                <h3 className={styles.benefitTitle}>Explora desde el mapa</h3>
                <p className={styles.benefitText}>Recorre el mundo visualmente y descubre destinos de forma intuitiva.</p>
              </div>
            </article>
            <article className={styles.benefitItem}>
              <span className={styles.benefitIcon} aria-hidden="true">🗺️</span>
              <div className={styles.benefitContent}>
                <h3 className={styles.benefitTitle}>Encuentra zonas y planes</h3>
                <p className={styles.benefitText}>Cada país te lleva a regiones, rutas y aventuras reales.</p>
              </div>
            </article>
            <article className={styles.benefitItem}>
              <span className={styles.benefitIcon} aria-hidden="true">📚</span>
              <div className={styles.benefitContent}>
                <h3 className={styles.benefitTitle}>Aprende mientras viajas</h3>
                <p className={styles.benefitText}>Historia, cultura y curiosidades para entender mejor cada destino.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <main className={styles.main}>
        {/* Destinos destacados */}
        <section id="destinos" className={styles.section} aria-labelledby="destinations-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderPanel}>
              <span className={styles.sectionEyebrow}>Destinos</span>
              <h2 id="destinations-title" className={styles.sectionTitle}>
                Empieza tu exploración
              </h2>
              <p className={styles.sectionDescription}>
                Países con contenido disponible o en preparación. Selecciona uno para descubrir su mapa, zonas y aventuras.
              </p>
            </div>
          </div>

          <div className={styles.destinationsGrid}>
            {screenData.featuredDestinations.map(dest => (
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

        <MonetizationSlot
          placement="home-after-featured-destinations"
          promotions={screenData.homePromotions}
        />

        {/* Aventuras */}
        <section id="aventuras" className={styles.section} aria-labelledby="adventures-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderPanel}>
              <span className={styles.sectionEyebrow}>Aventuras</span>
              <h2 id="adventures-title" className={styles.sectionTitle}>
                Viajes que empiezan con una idea
              </h2>
              <p className={styles.sectionDescription}>
                Explora rutas seleccionadas para inspirarte, comparar destinos y descubrir experiencias que podrían convertirse en tu próxima aventura.
              </p>
            </div>
          </div>

          <div className={styles.adventuresGrid}>
            {screenData.featuredAdventures.map(adventure => (
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
            <span className={styles.shareEyebrow}>{screenData.communityCta.eyebrow}</span>
            <h2 id="share-title" className={styles.shareTitle}>
              {screenData.communityCta.title}
            </h2>
            <p className={styles.shareDescription}>
              {screenData.communityCta.description}
            </p>
            <a href={screenData.communityCta.href} className={styles.shareCta}>
              {screenData.communityCta.label}
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
            <a href="/#atlas-mundial" className={styles.footerLink}>Atlas</a>
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
