/**
 * Purpose: Show a friendly placeholder for a selected internal country zone.
 * Scope: Public read-only route for a country destination.
 * Decisions: Uses router state for the best zone name and falls back to a clean title from the slug.
 * Limitations: No upload, moderation UI, auth, or private photo rendering in this phase.
 * Recent changes (2026-05-12):
 * - Hero visual with prominent placeholder for future zone photo
 * - Future resources block added
 * - Visual coherence with CityPage/AdventurePage
 */

import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  MonetizationSlot,
  getResolvedZoneScreenData,
  getZoneScreenFallbackData,
  type ResolvedZoneScreenData,
} from '../../features/travelData';
import {
  loadDestinationVisualManifest,
  resolveDestinationVisuals,
  DestinationMedia,
  type DestinationVisualManifest,
  type ResolvedDestinationVisualAsset,
} from '../../features/destinationVisuals';
import { CountryFlag } from '../../features/countries';
import { useExperienceMode } from '../../features/experienceMode';
import { AdventureVisualExperience } from './AdventureVisualExperience';
import { ZoneEditorialSection } from './ZoneEditorialSection';
import styles from './CountryZonePage.module.css';

interface ZoneLocationState {
  zoneName?: string;
  countryName?: string;
}

type ResolvedZoneScreenState = {
  countrySlug: string;
  zoneSlug: string;
  mode: ReturnType<typeof useExperienceMode>['mode'];
  data: ResolvedZoneScreenData;
};

function ZoneHeroVisual({
  zoneName,
  countryName,
  isoAlpha2,
  asset,
  imageUrl,
  imageAlt,
}: {
  zoneName: string;
  countryName: string;
  isoAlpha2?: string;
  asset?: ResolvedDestinationVisualAsset;
  imageUrl?: string;
  imageAlt?: string;
}) {
  if (asset) {
    return (
      <div className={`${styles.zoneVisual} ${styles.zoneVisualWithImage}`}>
        <DestinationMedia
          asset={asset}
          className={styles.zoneVisualImage}
          sizes="100vw"
          priority
        />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className={`${styles.zoneVisual} ${styles.zoneVisualWithImage}`}>
        <img
          className={styles.zoneVisualImage}
          src={imageUrl}
          alt={imageAlt || `Imagen panorámica de ${zoneName}`}
          sizes="100vw"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.zoneVisual} ${styles.zoneVisualFallback}`}
      role="img"
      aria-label={`Portada temporal de la zona ${zoneName}`}
    >
      <div className={styles.zoneVisualFallbackInner} aria-hidden="true">
        {isoAlpha2 && (
          <div className={styles.zoneVisualFlag}>
            <CountryFlag isoAlpha2={isoAlpha2} countryName={countryName} size="large" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Future resources block - placeholder for editorial content
 */
function FutureResourcesBlock({ zoneName }: { zoneName: string }) {
  return (
    <div className={styles.futureBlock}>
      <div className={styles.futureBlockContent}>
        <span className={styles.futureBlockIcon}>🗺️</span>
        <h3 className={styles.futureBlockTitle}>Próximamente: guías y recursos para explorar esta zona</h3>
        <p className={styles.futureBlockText}>
          Estamos preparando recomendaciones de rutas, mejores épocas para visitar {zoneName} 
          y consejos prácticos específicos para esta zona.
        </p>
      </div>
    </div>
  );
}

function HeroContributionBlock({
  zoneName,
  title,
  text,
  shareHref,
}: {
  zoneName: string;
  title: string;
  text: string;
  shareHref: string;
}) {
  return (
    <aside className={styles.heroContributionCard} aria-label={`Colabora con una foto de ${zoneName}`}>
      <span className={styles.heroContributionIcon} aria-hidden="true">📷</span>
      <div>
        <h2 className={styles.heroContributionTitle}>{title}</h2>
        <p className={styles.heroContributionText}>{text}</p>
        <div className={styles.heroContributionActions}>
          <Link to={shareHref} className={styles.heroContributionButton}>
            Proponer foto
          </Link>
          <span className={styles.heroContributionReviewText}>
            Se revisará antes de publicarse.
          </span>
        </div>
      </div>
    </aside>
  );
}

function getZoneHeroPhotoShareHref(countrySlug?: string, zoneSlug?: string): string {
  const params = new URLSearchParams({ tipo: 'hero_photo' });

  if (countrySlug) {
    params.set('pais', countrySlug);
  }

  if (zoneSlug) {
    params.set('zona', zoneSlug);
  }

  return `/compartir?${params.toString()}`;
}

export function CountryZonePage() {
  const { countrySlug, zoneSlug } = useParams<{
    countrySlug: string;
    zoneSlug: string;
  }>();
  const location = useLocation();
  const state = (location.state || {}) as ZoneLocationState;
  const { mode } = useExperienceMode();
  const normalizedCountrySlug = countrySlug?.trim().toLowerCase();
  const normalizedZoneSlug = zoneSlug?.trim().toLowerCase();

  // Scroll al inicio al entrar o cambiar de país/zona
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [countrySlug, zoneSlug]);

  const fallbackScreenData =
    normalizedCountrySlug && normalizedZoneSlug
      ? getZoneScreenFallbackData(normalizedCountrySlug, normalizedZoneSlug, mode)
      : undefined;
  const [resolvedScreenState, setResolvedScreenState] =
    useState<ResolvedZoneScreenState | null>(null);
  const [visualManifest, setVisualManifest] = useState<DestinationVisualManifest | null>(null);
  const screenData =
    resolvedScreenState &&
    resolvedScreenState.countrySlug === normalizedCountrySlug &&
    resolvedScreenState.zoneSlug === normalizedZoneSlug &&
    resolvedScreenState.mode === mode
      ? resolvedScreenState.data
      : fallbackScreenData;
  const countryName =
    cleanDisplayName(state.countryName) ||
    cleanDisplayName(screenData?.countryName) ||
    'este país';
  const zoneName =
    cleanDisplayName(state.zoneName) ||
    cleanDisplayName(screenData?.zoneName) ||
    createNameFromSlug(zoneSlug) ||
    'Zona por descubrir';
  const destinationVisuals = visualManifest ? resolveDestinationVisuals(visualManifest, mode) : null;
  const zoneHeroAsset = destinationVisuals?.hero;
  const zoneHeroImageUrl = zoneHeroAsset?.url || screenData?.hero.imageUrl;
  const zoneHeroImageAlt = zoneHeroAsset?.alt || screenData?.hero.imageAlt;
  const hasZoneHeroImage = Boolean(zoneHeroAsset || zoneHeroImageUrl);
  const zoneFallbackCopy =
    cleanDisplayName(screenData?.hero.subtitle) ||
    'Un lugar en preparación para viajeros curiosos. Muy pronto reuniremos rutas, planes y consejos para descubrirlo con calma.';
  const countryIsoAlpha2 = screenData?.country?.isoAlpha2;
  const communityCtaText =
    screenData?.communityCta.text ||
    `¿Tienes una foto de ${zoneName}? Puedes colaborar con Trawel y aparecer en nuestros créditos de agradecimiento.`;
  const promotions = screenData?.promotions || [];
  const remoteEditorial =
    screenData?.metadata.hasRemoteEditorial && screenData.editorial.status === 'published'
      ? screenData.editorial
      : null;

  useEffect(() => {
    if (!normalizedZoneSlug) {
      setVisualManifest(null);
      return;
    }

    let isMounted = true;

    loadDestinationVisualManifest(normalizedZoneSlug).then((manifest) => {
      if (isMounted) {
        setVisualManifest(manifest);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [normalizedZoneSlug]);

  useEffect(() => {
    if (!normalizedCountrySlug || !normalizedZoneSlug) {
      setResolvedScreenState(null);
      return;
    }

    let isMounted = true;

    const loadZoneScreenData = async () => {
      const resolvedScreenData = await getResolvedZoneScreenData(
        normalizedCountrySlug,
        normalizedZoneSlug,
        mode
      );

      if (!isMounted) {
        return;
      }

      setResolvedScreenState({
        countrySlug: normalizedCountrySlug,
        zoneSlug: normalizedZoneSlug,
        mode,
        data: resolvedScreenData,
      });
    };

    loadZoneScreenData();

    return () => {
      isMounted = false;
    };
  }, [mode, normalizedCountrySlug, normalizedZoneSlug]);

  return (
    <div
      className={`${styles.container} ${mode === 'adventure' ? styles.adventureMode : styles.studentMode}`}
      data-experience-mode={mode}
    >
      {/* Hero visual de la Zona - Con recuadro prominente para foto */}
      <header
        className={`${styles.hero} ${mode === 'adventure' ? styles.adventureHero : styles.studentHero}`}
        aria-label={
          hasZoneHeroImage
            ? `Imagen panorámica de ${zoneName}`
            : `Portada temporal de la zona ${zoneName}`
        }
      >
        {/* Visual panorámico de la zona */}
        <ZoneHeroVisual
          zoneName={zoneName}
          countryName={countryName}
          isoAlpha2={countryIsoAlpha2}
          asset={zoneHeroAsset}
          imageUrl={zoneHeroImageUrl}
          imageAlt={zoneHeroImageAlt}
        />

        {/* Overlay con contenido */}
        <div className={styles.heroOverlay}>
          {/* Breadcrumb flotante */}
          <nav className={styles.breadcrumb} aria-label="Navegación">
            <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            {countrySlug ? (
              <Link to={`/pais/${countrySlug}`} className={styles.breadcrumbLink}>
                {countryName}
              </Link>
            ) : (
              <span className={styles.breadcrumbCurrent}>{countryName}</span>
            )}
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent} aria-current="page">
              {zoneName}
            </span>
          </nav>

          <div className={styles.heroContent}>
            <p className={styles.kicker}>{mode === 'adventure' ? 'Aventura' : countryName}</p>
            <h1 className={styles.title}>{zoneName}</h1>
            <p className={styles.subtitle}>
              {remoteEditorial?.headline || (!hasZoneHeroImage ? zoneFallbackCopy : 'Contenido disponible para explorar.')}
            </p>
            {mode === 'adventure' && remoteEditorial && (
              <div className={styles.adventureHeroActions}>
                <a className={styles.adventureHeroPrimary} href="#aventura-no-te-pierdas">
                  Descubrir {zoneName}<span aria-hidden="true">↓</span>
                </a>
                {destinationVisuals?.gallery.length ? (
                  <a className={styles.adventureHeroSecondary} href="#aventura-galeria">Ver paisajes</a>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </header>

      <MonetizationSlot
        placement="zone-after-intro"
        promotions={promotions}
      />

      <main className={`${styles.main} ${mode === 'adventure' ? styles.adventureMain : styles.studentMain}`}>
        {remoteEditorial ? (
          mode === 'adventure' ? (
            <AdventureVisualExperience editorial={remoteEditorial} visuals={destinationVisuals} />
          ) : (
            <ZoneEditorialSection editorial={remoteEditorial} zoneName={zoneName} />
          )
        ) : (
          <FutureResourcesBlock zoneName={zoneName} />
        )}

        <HeroContributionBlock
          zoneName={zoneName}
          title="¿Tienes una foto que represente este lugar?"
          text={communityCtaText}
          shareHref={getZoneHeroPhotoShareHref(normalizedCountrySlug, normalizedZoneSlug)}
        />

        <Link to={countrySlug ? `/pais/${countrySlug}` : '/'} className={styles.backLink}>
          Volver al mapa de {countryName}
        </Link>
      </main>
    </div>
  );
}

function cleanDisplayName(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function createNameFromSlug(zoneSlug?: string): string | null {
  if (!zoneSlug) {
    return null;
  }

  const words = zoneSlug
    .split('-')
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return null;
  }

  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
