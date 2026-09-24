import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type UIEvent,
} from 'react';
import styles from './AdventureVisualExperience.module.css';

interface CarouselItem {
  id: string;
}

interface AdventureCarouselProps<T extends CarouselItem> {
  items: readonly T[];
  label: string;
  renderItem: (item: T, index: number) => ReactNode;
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

/**
 * Lightweight, native-scroll carousel shared by Adventure layers. It retains
 * touch scrolling while adding mouse drag, keyboard controls and visible state.
 */
export function AdventureCarousel<T extends CarouselItem>({ items, label, renderItem }: AdventureCarouselProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, pointerId: 0, startX: 0, startScrollLeft: 0, suppressClick: false });
  const targetIndexRef = useRef<number | null>(null);
  const targetSettleTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [dragging, setDragging] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = (event: UIEvent<HTMLDivElement>) => {
    if (targetIndexRef.current !== null) return;
    setActiveIndex(getNearestItemIndex(event.currentTarget));
  };

  const clearProgrammaticTarget = () => {
    targetIndexRef.current = null;
    if (targetSettleTimerRef.current !== null) {
      window.clearTimeout(targetSettleTimerRef.current);
      targetSettleTimerRef.current = null;
    }
  };

  const scrollToIndex = (requestedIndex: number) => {
    const track = trackRef.current;
    if (!track) return;

    const nextIndex = Math.min(items.length - 1, Math.max(0, requestedIndex));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearProgrammaticTarget();
    targetIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
    track.scrollTo({ left: getItemScrollLeft(track, nextIndex), behavior: reducedMotion ? 'auto' : 'smooth' });
    targetSettleTimerRef.current = window.setTimeout(() => {
      targetIndexRef.current = null;
      targetSettleTimerRef.current = null;
      setActiveIndex(getNearestItemIndex(track));
    }, reducedMotion ? 0 : 700);
  };

  const move = (direction: 1 | -1) => {
    if (trackRef.current) scrollToIndex((targetIndexRef.current ?? activeIndex) + direction);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    clearProgrammaticTarget();
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
          {items.map((item, index) => (
            <button
              type="button"
              className={index === activeIndex ? styles.activeIndicator : ''}
              onClick={() => scrollToIndex(index)}
              aria-label={`Ir al elemento ${index + 1} de ${items.length} en ${label}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              key={item.id}
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
