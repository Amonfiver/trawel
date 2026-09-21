import { useRef, useState, type ReactNode, type UIEvent } from 'react';
import type { ResolvedDestinationVisualAsset, ResolvedDestinationVisuals } from '../../features/destinationVisuals';
import type { ScreenEditorialData } from '../../features/travelData';
import { getAdventureExpectations } from './adventureVisuals.utils';
import styles from './AdventureVisualExperience.module.css';

interface AdventureVisualExperienceProps {
  editorial: ScreenEditorialData;
  visuals: ResolvedDestinationVisuals | null;
}

interface SnapCarouselProps {
  assets: ResolvedDestinationVisualAsset[];
  label: string;
  renderItem: (asset: ResolvedDestinationVisualAsset, index: number) => ReactNode;
}

function SnapCarousel({ assets, label, renderItem }: SnapCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = (event: UIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    const firstCard = track.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth ?? track.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
    setActiveIndex(Math.min(assets.length - 1, Math.max(0, Math.round(track.scrollLeft / (cardWidth + gap)))));
  };

  const move = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const firstCard = track.firstElementChild as HTMLElement | null;
    const distance = (firstCard?.offsetWidth ?? track.clientWidth) + (Number.parseFloat(getComputedStyle(track).gap) || 0);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setActiveIndex((currentIndex) => Math.min(assets.length - 1, Math.max(0, currentIndex + direction)));
    track.scrollBy({ left: distance * direction, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselControls} aria-label={`Controles de ${label}`}>
        <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label={`Anterior en ${label}`}>
          <span aria-hidden="true">←</span>
        </button>
        <div className={styles.indicators} aria-hidden="true">
          {assets.map((asset, index) => <span className={index === activeIndex ? styles.activeIndicator : ''} key={asset.id} />)}
        </div>
        <button type="button" onClick={() => move(1)} disabled={activeIndex === assets.length - 1} aria-label={`Siguiente en ${label}`}>
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="srOnly" aria-live="polite">{activeIndex + 1} de {assets.length}: {label}</p>
      <div className={styles.carouselTrack} ref={trackRef} onScroll={updateActiveIndex}>
        {assets.map(renderItem)}
      </div>
    </div>
  );
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
          <div className={styles.expectationGrid}>
            {expectations.map(({ asset, title }) => (
              <a className={styles.expectationCard} href="#aventura-galeria" key={asset.id}>
                <img src={asset.url} alt={asset.alt} loading="lazy" />
                <span>{title}</span>
                <small aria-hidden="true">Explorar →</small>
              </a>
            ))}
          </div>
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
          <SnapCarousel
            assets={highlightAssets}
            label="No te pierdas"
            renderItem={(asset, index) => {
              const highlight = highlights[index];
              return (
                <article className={styles.highlightCard} key={`${highlight.text}-${index}`}>
                  {asset.url && <img src={asset.url} alt={asset.alt} loading="lazy" />}
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
          <SnapCarousel
            assets={visuals.gallery}
            label="Galería del destino"
            renderItem={(asset) => (
              <figure className={styles.galleryCard} key={asset.id}>
                <img src={asset.url} alt={asset.alt} loading="lazy" />
                {asset.caption && <figcaption>{asset.caption}</figcaption>}
              </figure>
            )}
          />
        </section>
      ) : null}

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
