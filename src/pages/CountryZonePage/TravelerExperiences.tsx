import { DestinationMedia, type ResolvedDestinationVisualAsset } from '../../features/destinationVisuals';
import {
  getTravelerExperiences,
  prioritizeTravelerExperiences,
  type TravelerExperience,
} from '../../features/travelerExperiences';
import { AdventureCarousel } from './AdventureCarousel';
import styles from './AdventureVisualExperience.module.css';

interface TravelerExperiencesProps {
  destinationSlug?: string;
  backgroundAsset?: ResolvedDestinationVisualAsset;
}

function avatarInitials(experience: TravelerExperience): string {
  return experience.avatarInitials ?? experience.displayName
    .split(/\s+/)
    .map((part) => part.at(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Adventure-only presentation layer. AI samples remain explicitly labelled and
 * future real-user content can replace them without changing editorial data.
 */
export function TravelerExperiences({ destinationSlug, backgroundAsset }: TravelerExperiencesProps) {
  const experiences = prioritizeTravelerExperiences(getTravelerExperiences(destinationSlug));
  if (experiences.length === 0) return null;

  const hasAiSamples = experiences.some((experience) => experience.type === 'AI_SAMPLE');

  return (
    <section className={styles.travelerExperiences} aria-labelledby="traveler-experiences-title" data-traveler-experiences="true">
      {backgroundAsset && (
        <DestinationMedia
          asset={backgroundAsset}
          className={styles.travelerBackground}
          sizes="(max-width: 680px) 100vw, 1200px"
        />
      )}
      <div className={styles.travelerContent}>
        <header className={styles.sectionHeader}>
          <p className={styles.eyebrow}>La dimensión humana</p>
          <h3 id="traveler-experiences-title">Experiencias de viajeros</h3>
          <p className={styles.travelerIntro}>Historias que inspiran otras formas de descubrir un destino.</p>
        </header>

        {hasAiSamples && (
          <p className={styles.aiNotice} data-ai-notice="true">
            Experiencias ilustrativas generadas con IA mientras llegan testimonios reales de viajeros.
          </p>
        )}

        <AdventureCarousel
          items={experiences}
          label="Experiencias de viajeros"
          renderItem={(experience) => {
            const isAiSample = experience.type === 'AI_SAMPLE';
            return (
              <article className={styles.experienceCard} data-experience-type={experience.type} key={experience.id}>
                <div className={styles.experienceIdentity}>
                  <span className={styles.experienceAvatar} aria-hidden="true">{avatarInitials(experience)}</span>
                  <div>
                    <p>{experience.displayName}</p>
                    {experience.location && <span>{experience.location}</span>}
                  </div>
                  {isAiSample && <span className={styles.aiBadge}>Generada con IA</span>}
                </div>
                <div className={styles.illustrativeRating} aria-label="Recurso visual ilustrativo; no es una valoración real">
                  <span aria-hidden="true">★★★★★</span>
                  <small>Recurso ilustrativo</small>
                </div>
                <blockquote>“{experience.quote}”</blockquote>
                <span className={styles.experienceChevron} aria-hidden="true">→</span>
              </article>
            );
          }}
        />

        <div className={styles.experienceCta}>
          <button type="button" disabled aria-describedby="traveler-experience-cta-status">
            Cuéntanos tu experiencia
          </button>
          <p id="traveler-experience-cta-status">Próximamente: podrás compartir una experiencia real de viaje.</p>
        </div>
      </div>
    </section>
  );
}
