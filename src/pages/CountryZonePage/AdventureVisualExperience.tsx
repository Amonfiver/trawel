import type { ScreenEditorialData } from '../../features/travelData';
import type { ResolvedDestinationVisuals } from '../../features/destinationVisuals';
import styles from './AdventureVisualExperience.module.css';

interface AdventureVisualExperienceProps {
  editorial: ScreenEditorialData;
  visuals: ResolvedDestinationVisuals | null;
}

/**
 * Presenta únicamente texto editorial ya publicado y assets declarados por el
 * manifest del destino. No decide ni transforma la autoridad editorial.
 */
export function AdventureVisualExperience({
  editorial,
  visuals,
}: AdventureVisualExperienceProps) {
  const practicalTips = Array.isArray(editorial.practicalTips)
    ? editorial.practicalTips
    : editorial.practicalTips
      ? [editorial.practicalTips]
      : [];
  const highlights = editorial.highlights.map((highlight, index) => ({
    text: highlight,
    visual: visuals?.highlights[index % (visuals.highlights.length || 1)],
  }));

  return (
    <article className={styles.experience} aria-labelledby="adventure-experience-title">
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>Modo Aventura</p>
        <h2 id="adventure-experience-title">{editorial.headline}</h2>
        {editorial.intro && <p className={styles.lead}>{editorial.intro}</p>}
        <div className={styles.actions}>
          {editorial.suggestedRoute && <a href="#aventura-no-te-pierdas">Explorar el recorrido</a>}
          {visuals?.gallery.length ? <a href="#aventura-galeria">Ver paisajes</a> : null}
        </div>
      </header>

      {editorial.whatMakesSpecial && (
        <section className={styles.whyGo} aria-labelledby="adventure-why-go-title">
          <div>
            <p className={styles.eyebrow}>La primera impresión</p>
            <h3 id="adventure-why-go-title">Por qué ir</h3>
          </div>
          <p>{editorial.whatMakesSpecial}</p>
        </section>
      )}

      {highlights.length > 0 && (
        <section className={styles.highlights} aria-labelledby="adventure-highlights-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Elige tu pulso</p>
            <h3 id="adventure-highlights-title">Momentos que definen el destino</h3>
          </div>
          <div className={styles.highlightGrid}>
            {highlights.map(({ text, visual }, index) => (
              <article className={styles.highlightCard} key={`${text}-${index}`}>
                {visual && <img src={visual.url} alt={visual.alt} />}
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {visuals?.gallery.length ? (
        <section className={styles.gallery} id="aventura-galeria" aria-labelledby="adventure-gallery-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Mira antes de llegar</p>
            <h3 id="adventure-gallery-title">Cuenca en varias escalas</h3>
          </div>
          <div className={styles.galleryGrid}>
            {visuals.gallery.map((asset) => (
              <figure key={asset.id}>
                <img src={asset.url} alt={asset.alt} loading="lazy" />
                <figcaption>{asset.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {editorial.suggestedRoute && (
        <section className={styles.dontMiss} id="aventura-no-te-pierdas" aria-labelledby="adventure-dont-miss-title">
          <p className={styles.eyebrow}>Con calma, pero sin perderlo</p>
          <h3 id="adventure-dont-miss-title">No te pierdas</h3>
          <p>{editorial.suggestedRoute}</p>
          {practicalTips.length > 0 && (
            <ul>
              {practicalTips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
