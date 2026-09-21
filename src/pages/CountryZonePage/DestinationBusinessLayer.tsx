import { DestinationMedia, type ResolvedDestinationVisualAsset } from '../../features/destinationVisuals';
import {
  getDestinationBusinessPlacements,
  type BusinessCategory,
  type BusinessPlacement,
} from '../../features/destinationBusiness';
import { AdventureCarousel } from './AdventureCarousel';
import styles from './AdventureVisualExperience.module.css';

interface DestinationBusinessLayerProps {
  destinationSlug?: string;
  destinationName?: string;
  visualAssets?: readonly ResolvedDestinationVisualAsset[];
}

const categoryLabels: Record<BusinessCategory, string> = {
  STAY: 'Dónde alojarte',
  EAT: 'Dónde comer',
  LOCAL_EXPERIENCE: 'Experiencias locales',
};

function placementLabel(placement: BusinessPlacement): string | undefined {
  if (placement.sponsored) return 'Patrocinado';
  if (placement.status === 'PLACEHOLDER') return placement.badge ?? 'Espacio disponible';
  return placement.badge;
}

function placementVisual(
  placement: BusinessPlacement,
  visualAssets: readonly ResolvedDestinationVisualAsset[],
  index: number,
): ResolvedDestinationVisualAsset | undefined {
  if (placement.imageAssetId) {
    return visualAssets.find((asset) => asset.id === placement.imageAssetId);
  }

  return visualAssets.length > 0 ? visualAssets[index % visualAssets.length] : undefined;
}

/**
 * Adventure-only commercial presentation. It consumes only local placement
 * configuration and manifest-resolved destination imagery, never editorial text.
 */
export function DestinationBusinessLayer({
  destinationSlug,
  destinationName,
  visualAssets = [],
}: DestinationBusinessLayerProps) {
  const placements = getDestinationBusinessPlacements(destinationSlug).filter((placement) => placement.active !== false);
  const isEmpty = placements.length === 0;
  const resolvedName = destinationName ?? 'este destino';

  return (
    <section className={styles.businessLayer} aria-labelledby="destination-business-title" data-destination-business="true">
      <header className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Cuando el viaje toma forma</p>
        <h3 id="destination-business-title">Un lugar para quedarte, comer y descubrir</h3>
        <p className={styles.businessIntro}>Propuestas locales que aparecerán aquí cuando aporten algo al viaje.</p>
      </header>

      {isEmpty ? (
        <p className={styles.businessEmpty}>Estamos preparando una selección local para este destino.</p>
      ) : (
        <AdventureCarousel
          items={placements}
          label="Propuestas locales"
          renderItem={(placement, index) => {
            const visual = placementVisual(placement, visualAssets, index);
            const label = placementLabel(placement);
            return (
              <article className={styles.businessCard} data-business-status={placement.status} data-business-category={placement.category} key={placement.id}>
                {visual && <DestinationMedia asset={visual} className={styles.businessMedia} sizes="(max-width: 680px) 84vw, 34vw" />}
                <div className={styles.businessCardContent}>
                  <h4 className={styles.businessCategory}>{categoryLabels[placement.category]}</h4>
                  {label && <span className={styles.businessBadge}>{label}</span>}
                  <p className={styles.businessName}>{placement.name}</p>
                  <p className={styles.businessDescription}>{placement.shortDescription}</p>
                  <button type="button" disabled aria-label={`Próximamente: ${placement.name}`}>
                    Quiero aparecer aquí
                  </button>
                </div>
              </article>
            );
          }}
        />
      )}

      <div className={styles.advertiserCta}>
        <div>
          <p>¿Tienes un negocio en {resolvedName}?</p>
          <span>Haz que te descubran viajeros interesados en este destino.</span>
        </div>
        <button type="button" disabled aria-describedby="advertiser-cta-status">Quiero aparecer en Trawel</button>
        <p id="advertiser-cta-status">Próximamente: contacta con Trawel para valorar una colaboración local.</p>
      </div>
    </section>
  );
}
