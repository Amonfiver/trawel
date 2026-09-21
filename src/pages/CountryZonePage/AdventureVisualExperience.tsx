import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type UIEvent,
} from 'react';
import { DestinationMedia, type ResolvedDestinationVisualAsset, type ResolvedDestinationVisuals } from '../../features/destinationVisuals';
import type { ScreenEditorialData } from '../../features/travelData';
import { getAdventureExpectations } from './adventureVisuals.utils';
import { TravelerPerspective } from './TravelerPerspective';
import styles from './AdventureVisualExperience.module.css';

interface AdventureVisualExperienceProps {
  editorial: ScreenEditorialData;
  visuals: ResolvedDestinationVisuals | null;
}

interface AdventureCarouselProps {
  items: ResolvedDestinationVisualAsset[];
  label: string;
  renderItem: (asset: ResolvedDestinationVisualAsset, index: number) => ReactNode;
}

function getItemScrollLeft(track: HTMLDivElement, index: number): number {
  const item = track.children.item(index) as HTMLElement | null;
  if (!item) return track.scrollLeft;

  return item.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
}

function getNearestItemIndex(track: HTMLDivElement): number {
  return Array.from(track.children).reduce((nearestIndex, _, index) => {
    const currentDistance = Math.abs(track.scrollLeft - getItemScrollLeft(track, index));
    const nearestDistance = Math.abs(track.scrollLeft - getItemScrollLeft(track, nearestIndex));
    return currentDistance < nearestDistance ? index : nearestIndex;
  }, 0);
}

function AdventureCarousel({ items, label, renderItem }: AdventureCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, pointerId: 0, startX: 0, startScrollLeft: 0, suppressClick: false });
  const [dragging, setDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = (event: UIEvent<HTMLDivElement>) => {
    setActiveIndex(getNearestItemIndex(event.currentTarget));
  };

  const scrollToIndex = (requestedIndex: number) => {
    const track = trackRef.current;
    if (!track) return;

    const nextIndex = Math.min(items.length - 1, Math.max(0, requestedIndex));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setActiveIndex(nextIndex);
    track.scrollTo({ left: getItemScrollLeft(track, nextIndex), behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const move = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) scrollToIndex(getNearestItemIndex(track) + direction);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      suppressClick: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4) {
      drag.suppressClick = true;
      event.preventDefault();
    }
    event.currentTarget.scrollLeft = drag.startScrollLeft - delta;
  };

  const finishPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.active = false;
    setDragging(false);
    window.setTimeout(() => { drag.suppressClick = false; }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselControls} aria-label={`Controles de ${label}`}>
        <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0} aria-label={`Anterior en ${label}`}>
          <span aria-hidden="true">←</span>
        </button>
        <div className={styles.indicators} aria-label={`Posición en ${label}`}>
          {items.map((asset, index) => (
            <button
              type="button"
              className={index === activeIndex ? styles.activeIndicator : ''}
              onClick={() => scrollToIndex(index)}
              aria-label={`Ir al elemento ${index + 1} de ${items.length} en ${label}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              key={asset.id}
            />
          ))}
        </div>
        <button type="button" onClick={() => move(1)} disabled={activeIndex === items.length - 1} aria-label={`Siguiente en ${label}`}>
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="srOnly" aria-live="polite">{activeIndex + 1} de {items.length}: {label}</p>
      <div
        className={styles.carouselTrack}
        ref={trackRef}
        tabIndex={0}
        aria-label={label}
        data-carousel-track={label}
        data-dragging={dragging ? 'true' : 'false'}
        onScroll={updateActiveIndex}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onClickCapture={(event) => {
          if (dragRef.current.suppressClick) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {items.map(renderItem)}
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

      <TravelerPerspective themes={editorial.highlights} />

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
