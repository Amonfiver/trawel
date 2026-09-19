import type { ScreenEditorialData } from '../../features/travelData';
import { parseEditorialMarkdown } from './editorialMarkdown.utils';
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
  const practicalTips = Array.isArray(editorial.practicalTips)
    ? editorial.practicalTips
    : editorial.practicalTips
      ? [editorial.practicalTips]
      : [];

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
        {isAdventure ? (
          <p className={styles.intro}>{editorial.intro}</p>
        ) : (
          <EditorialMarkdown content={editorial.intro} className={styles.intro} />
        )}

        {editorial.whatMakesSpecial && (
          <div className={styles.block}>
            <h3>{isAdventure ? 'Qué hace especial este lugar' : 'Qué observar en esta zona'}</h3>
            {isAdventure ? (
              <p>{editorial.whatMakesSpecial}</p>
            ) : (
              <EditorialMarkdown content={editorial.whatMakesSpecial} />
            )}
          </div>
        )}

        {editorial.highlights.length > 0 && (
          <div className={styles.block}>
            <h3>{isAdventure ? 'Ideas para explorar' : 'Claves de contexto'}</h3>
            <ul>
              {editorial.highlights.map((highlight) => (
                <li key={highlight}>
                  {isAdventure ? highlight : <InlineMarkdown value={highlight} />}
                </li>
              ))}
            </ul>
          </div>
        )}

        {editorial.suggestedRoute && (
          <div className={styles.block}>
            <h3>{isAdventure ? 'Ruta sugerida' : 'Ruta de aprendizaje'}</h3>
            {isAdventure ? (
              <p>{editorial.suggestedRoute}</p>
            ) : (
              <EditorialMarkdown content={editorial.suggestedRoute} />
            )}
          </div>
        )}

        {practicalTips.length > 0 && (
          <aside className={styles.tip}>
            <span aria-hidden="true">💡</span>
            {isAdventure ? (
              <p>{practicalTips.join(' ')}</p>
            ) : practicalTips.length === 1 ? (
              <EditorialMarkdown content={practicalTips[0]} />
            ) : (
              <ul>
                {practicalTips.map((tip) => (
                  <li key={tip}><InlineMarkdown value={tip} /></li>
                ))}
              </ul>
            )}
          </aside>
        )}

        {!isAdventure && editorial.sections.map((section) => (
          <section
            className={styles.block}
            key={`${section.position}-${section.kind}-${section.heading || 'contenido'}`}
          >
            {section.heading && <h3>{section.heading}</h3>}
            <EditorialMarkdown content={section.content} />
          </section>
        ))}
      </div>
    </section>
  );
}

function EditorialMarkdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={[styles.richText, className].filter(Boolean).join(' ')}>
      {parseEditorialMarkdown(content).map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'heading') {
          return <h4 key={key}><InlineMarkdown value={block.content} /></h4>;
        }

        if (block.type === 'unordered-list') {
          return <ul key={key}>{block.items.map((item) => <li key={item}><InlineMarkdown value={item} /></li>)}</ul>;
        }

        if (block.type === 'ordered-list') {
          return <ol key={key}>{block.items.map((item) => <li key={item}><InlineMarkdown value={item} /></li>)}</ol>;
        }

        return <p key={key}><InlineMarkdown value={block.content} /></p>;
      })}
    </div>
  );
}

function InlineMarkdown({ value }: { value: string }) {
  const normalizedValue = value.replace(/\\([\\`*{}[\]()#+\-.!_>])/g, '$1');
  const parts = normalizedValue.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g);

  return parts.map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }

    return part;
  });
}
