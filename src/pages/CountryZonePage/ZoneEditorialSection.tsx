import type { ScreenEditorialData } from '../../features/travelData';
import styles from './ZoneEditorialSection.module.css';

interface ZoneEditorialSectionProps {
  editorial: ScreenEditorialData;
  zoneName: string;
}

/** Presenta editorial ya validado; no accede a datos ni conoce estados internos. */
export function ZoneEditorialSection({
  editorial,
  zoneName,
}: ZoneEditorialSectionProps) {
  const isAdventure = editorial.mode === 'adventure';

  return (
    <section className={styles.section} aria-labelledby="zone-editorial-title">
      <div className={styles.header}>
        <p className={styles.eyebrow}>{zoneName}</p>
        <h2 id="zone-editorial-title" className={styles.title}>
          {editorial.headline}
        </h2>
        <p className={styles.subtitle}>
          {isAdventure
            ? 'Ideas y claves para explorar esta zona con calma.'
            : 'Claves para recorrer y comprender esta zona con más contexto.'}
        </p>
      </div>

      <div className={styles.content}>
        <p className={styles.intro}>{editorial.intro}</p>

        {editorial.whatMakesSpecial && (
          <div className={styles.block}>
            <h3>{isAdventure ? 'Qué hace especial este lugar' : 'Qué observar en esta zona'}</h3>
            <p>{editorial.whatMakesSpecial}</p>
          </div>
        )}

        {editorial.highlights.length > 0 && (
          <div className={styles.block}>
            <h3>{isAdventure ? 'Ideas para explorar' : 'Claves de contexto'}</h3>
            <ul>
              {editorial.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        {editorial.suggestedRoute && (
          <div className={styles.block}>
            <h3>{isAdventure ? 'Ruta sugerida' : 'Ruta de aprendizaje'}</h3>
            <p>{editorial.suggestedRoute}</p>
          </div>
        )}

        {editorial.practicalTips && (
          <aside className={styles.tip}>
            <span aria-hidden="true">💡</span>
            <p>{editorial.practicalTips}</p>
          </aside>
        )}
      </div>
    </section>
  );
}
