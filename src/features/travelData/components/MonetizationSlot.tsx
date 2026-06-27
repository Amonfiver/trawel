import type { Promotion, PromotionDisclosureLabel } from '../productContent';
import styles from './MonetizationSlot.module.css';

export interface MonetizationSlotProps {
  placement: string;
  promotions?: Promotion[];
  manualAdsenseSlotId?: string;
}

const DISCLOSURE_LABELS: Record<PromotionDisclosureLabel, string> = {
  Promocion: 'Promoción',
  Patrocinado: 'Patrocinado',
  Colaborador: 'Colaborador',
};

function isValidPromotion(promotion: Promotion): boolean {
  return Boolean(
    promotion.status === 'published' &&
      promotion.title.trim() &&
      promotion.sponsorName.trim()
  );
}

function getCtaLabel(promotion: Promotion): string {
  const metadataLabel = promotion.metadata.ctaLabel;

  if (typeof metadataLabel === 'string' && metadataLabel.trim()) {
    return metadataLabel.trim();
  }

  return 'Ver propuesta';
}

export function MonetizationSlot({
  placement,
  promotions = [],
  manualAdsenseSlotId,
}: MonetizationSlotProps) {
  const promotion = promotions.find(isValidPromotion);

  if (!promotion) {
    return null;
  }

  const disclosureLabel = DISCLOSURE_LABELS[promotion.disclosureLabel];
  const sponsorUrl = promotion.sponsorUrl?.trim();

  return (
    <aside
      className={styles.slot}
      data-placement={placement}
      data-monetization-provider="trawel-promotions"
      data-manual-adsense-slot={manualAdsenseSlotId}
      aria-label={`${disclosureLabel}: ${promotion.title}`}
    >
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.disclosure}>{disclosureLabel}</span>
          <span className={styles.sponsor}>{promotion.sponsorName}</span>
        </div>

        <div className={styles.copy}>
          <h2 className={styles.title}>{promotion.title}</h2>
          {promotion.description && (
            <p className={styles.description}>{promotion.description}</p>
          )}
        </div>

        {sponsorUrl && (
          <a
            className={styles.cta}
            href={sponsorUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            {getCtaLabel(promotion)}
          </a>
        )}
      </div>
    </aside>
  );
}
