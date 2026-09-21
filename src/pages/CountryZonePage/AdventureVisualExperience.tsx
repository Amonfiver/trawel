import { DestinationMedia, type ResolvedDestinationVisualAsset, type ResolvedDestinationVisuals } from '../../features/destinationVisuals';
import type { ScreenEditorialData } from '../../features/travelData';
import { AdventureCarousel } from './AdventureCarousel';
import { getAdventureExpectations } from './adventureVisuals.utils';
import { TravelerExperiences } from './TravelerExperiences';
import styles from './AdventureVisualExperience.module.css';

interface AdventureVisualExperienceProps {
  editorial: ScreenEditorialData;
  visuals: ResolvedDestinationVisuals | null;
}

/**
 * Presenta únicamente texto editorial ya publicado y assets declarados por el
 * manifest del destino. No decide ni transforma la autoridad editorial.
 */
export function AdventureVisualExperience({ editorial, visuals }: AdventureVisualExperienceProps) {
  const practicalTips = Array.isArray(editorial.practicalTips)
    ? editorial.practicalTips
    : editorial.practicalTips
      ? [editorial.practicalTips]
      : [];
  const highlights = editorial.highlights.map((highlight, index) => ({
    text: highlight,
    visual: visuals?.highlights[index % (visuals.highlights.length || 1)],
  }));
  const highlightAssets: ResolvedDestinationVisualAsset[] = highlights.map(({ visual }, index) => visual ? {
    ...visual,
    id: `highlight-${index}-${visual.id}`,
  } : ({
    id: `editorial-highlight-${index}`,
    url: '',
    path: '',
    category: 'atmosphere',
    modes: 'adventure',
    usage: ['highlight'],
    alt: '',
    caption: '',
    credit: '',
    source: '',
    rightsStatus: '',
    referenceOnly: false,
    priority: 0,
  } satisfies ResolvedDestinationVisualAsset));
  const expectations = visuals ? getAdventureExpectations(visuals.assets) : [];

  return (
    <article className={styles.experience} aria-labelledby="adventure-experience-title">
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>Modo Aventura</p>
        <h2 id="adventure-experience-title">{editorial.headline}</h2>
        {editorial.intro && <p className={styles.lead}>{editorial.intro}</p>}
      </header>

      {expectations.length > 0 && (
        <section className={styles.expectations} aria-labelledby="adventure-expectations-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Elige tu pulso</p>
            <h3 id="adventure-expectations-title">Qué te espera</h3>
          </div>
          <AdventureCarousel
            items={expectations.map(({ asset }) => asset)}
            label="Qué te espera"
            renderItem={(asset, index) => {
              const expectation = expectations[index];
              return (
              <a className={styles.expectationCard} href="#aventura-galeria" key={asset.id}>
                <DestinationMedia asset={asset} className={styles.expectationMedia} sizes="(max-width: 680px) 50vw, 25vw" />
                <span>{expectation.title}</span>
                <small aria-hidden="true">Explorar →</small>
              </a>
              );
            }}
          />
        </section>
      )}

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
            <p className={styles.eyebrow}>Detente aquí</p>
            <h3 id="adventure-highlights-title">No te pierdas</h3>
          </div>
          <AdventureCarousel
            items={highlightAssets}
            label="No te pierdas"
            renderItem={(asset, index) => {
              const highlight = highlights[index];
              return (
                <article className={styles.highlightCard} key={`${highlight.text}-${index}`}>
                  {asset.url && <DestinationMedia asset={asset} className={styles.cardMedia} sizes="(max-width: 680px) 78vw, 44vw" />}
                  <p>{highlight.text}</p>
                </article>
              );
            }}
          />
        </section>
      )}

      {visuals?.gallery.length ? (
        <section className={styles.gallery} id="aventura-galeria" aria-labelledby="adventure-gallery-title">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Mira antes de llegar</p>
            <h3 id="adventure-gallery-title">La mirada completa</h3>
          </div>
          <AdventureCarousel
            items={visuals.gallery}
            label="Galería del destino"
            renderItem={(asset) => (
              <figure className={styles.galleryCard} key={asset.id}>
                <DestinationMedia asset={asset} className={styles.cardMedia} sizes="(max-width: 680px) 85vw, 52vw" />
                {asset.caption && (
                  <figcaption>
                    {asset.caption}
                    {asset.credit && <span className="srOnly">Crédito visual: {asset.credit}</span>}
                  </figcaption>
                )}
              </figure>
            )}
          />
        </section>
      ) : null}

      <TravelerExperiences
        destinationSlug={visuals?.destinationSlug}
        backgroundAsset={visuals?.gallery[0]}
      />

      {editorial.suggestedRoute && (
        <section className={styles.dontMiss} id="aventura-no-te-pierdas" aria-labelledby="adventure-dont-miss-title">
          <p className={styles.eyebrow}>Con calma, pero sin perderlo</p>
          <h3 id="adventure-dont-miss-title">Dale forma al viaje</h3>
          <p>{editorial.suggestedRoute}</p>
          {practicalTips.length > 0 && <ul>{practicalTips.map((tip) => <li key={tip}>{tip}</li>)}</ul>}
        </section>
      )}
    </article>
  );
}
