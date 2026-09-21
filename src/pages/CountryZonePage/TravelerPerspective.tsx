import type { TravelerRecommendation } from '../../features/travelerRecommendations';
import styles from './AdventureVisualExperience.module.css';

interface TravelerPerspectiveProps {
  themes: string[];
  recommendations?: readonly TravelerRecommendation[];
}

/**
 * Reviews are rendered only when a real, approved source is supplied. Until
 * then, the public variant transparently presents approved editorial themes.
 */
export function TravelerPerspective({ themes, recommendations = [] }: TravelerPerspectiveProps) {
  if (recommendations.length > 0) {
    return (
      <section className={styles.travelerLayer} aria-labelledby="traveler-recommendations-title" data-traveler-source="approved">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Voces de la comunidad</p>
          <h3 id="traveler-recommendations-title">Recomendaciones de viajeros</h3>
        </div>
        <div className={styles.recommendationGrid}>
          {recommendations.map((recommendation) => (
            <figure className={styles.recommendationCard} key={recommendation.id}>
              <blockquote>{recommendation.quote}</blockquote>
              {recommendation.authorName && <figcaption>{recommendation.authorName}</figcaption>}
            </figure>
          ))}
        </div>
      </section>
    );
  }

  if (themes.length === 0) return null;

  return (
    <section className={styles.travelerLayer} aria-labelledby="traveler-perspective-title" data-traveler-source="none">
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Una mirada para el viaje</p>
        <h3 id="traveler-perspective-title">Lo que hace especial a este destino</h3>
      </div>
      <div className={styles.themeGrid}>
        {themes.slice(0, 3).map((theme, index) => (
          <article className={styles.themeCard} key={theme}>
            <span aria-hidden="true">0{index + 1}</span>
            <p>{theme}</p>
          </article>
        ))}
      </div>
      <p className={styles.travelerNote}>Claves tomadas del contenido aprobado; no son testimonios atribuidos.</p>
    </section>
  );
}
