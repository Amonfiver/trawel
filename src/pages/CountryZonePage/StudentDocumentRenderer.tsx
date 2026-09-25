import type { StudentBlock, StudentDocumentMediaAsset, StudentDocumentV1 } from '../../features/studentDocument';
import styles from './StudentDocumentRenderer.module.css';

interface Props { document: StudentDocumentV1; assets: Record<string, StudentDocumentMediaAsset>; }

/** Deliberately renders the supplied sequence without editorial regrouping or sorting. */
export function StudentDocumentRenderer({ document, assets }: Props) {
  const toc = document.blocks.filter((block): block is Extract<StudentBlock, { type: 'heading' }> => block.type === 'heading' && block.level === 2);
  return <article className={styles.document} data-student-document={document.version}>
    <header className={styles.header}>
      <p className={styles.demo}>SMOKE / DEMO / NON EDITORIAL CONTENT</p>
      <h1>{document.headline}</h1>
      <div className={styles.lead}>{document.lead.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    </header>
    <nav className={styles.toc} aria-label="Índice del documento">
      <span className={styles.tocTitle}>En esta página</span>
      <ol>{toc.map((heading, index) => <li key={heading.id || `${heading.text}-${index}`}><a href={`#${heading.id || slugify(heading.text)}`}>{heading.text}</a></li>)}</ol>
    </nav>
    <div className={styles.blocks}>{document.blocks.map((block, index) => <StudentDocumentBlock key={`${block.type}-${index}`} block={block} asset={block.type === 'figure' ? assets[block.assetId] : undefined} />)}</div>
  </article>;
}

function StudentDocumentBlock({ block, asset }: { block: StudentBlock; asset?: StudentDocumentMediaAsset }) {
  if (block.type === 'paragraph') return <p className={styles.paragraph}>{block.text}</p>;
  if (block.type === 'heading') {
    const id = block.id || slugify(block.text);
    return block.level === 2 ? <h2 id={id} className={styles.h2}>{block.text}</h2> : <h3 id={id} className={styles.h3}>{block.text}</h3>;
  }
  if (block.type === 'figure') return <figure className={`${styles.figure} ${block.placement === 'WIDE' ? styles.wide : styles.inline}`}>
    {asset ? <img src={asset.url} alt={block.alt || asset.alt} loading="lazy" decoding="async" /> : <div className={styles.missingFigure} role="img" aria-label={block.alt}>Media editorial no disponible</div>}
    {(block.caption || asset?.credit || asset?.source) && <figcaption>{block.caption && <span>{block.caption}</span>}{(asset?.credit || asset?.source) && <small>{[asset.credit, asset.source, asset.license].filter(Boolean).join(' · ')}</small>}</figcaption>}
  </figure>;
  if (block.type === 'list') {
    const List = block.style === 'ordered' ? 'ol' : 'ul';
    return <List className={styles.list}>{block.items.map((item, index) => <li key={index}>{item}</li>)}</List>;
  }
  if (block.type === 'key_facts') return <section className={styles.keyFacts} aria-label={block.title || 'Datos clave'}>{block.title && <h3>{block.title}</h3>}<dl>{block.items.map((item, index) => <div key={`${item.label}-${index}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>;
  if (block.type === 'callout') return <aside className={`${styles.callout} ${styles[block.tone.toLowerCase()]}`} aria-label={block.title || block.tone}><span>{block.tone === 'DEFINITION' ? 'Definición' : block.tone === 'CONTEXT' ? 'Contexto' : 'Nota'}</span>{block.title && <h3>{block.title}</h3>}<p>{block.text}</p></aside>;
  if (block.type === 'timeline') return <section className={styles.timeline} aria-label={block.title || 'Cronología'}>{block.title && <h3>{block.title}</h3>}<ol>{block.items.map((item, index) => <li key={`${item.label}-${index}`}><strong>{item.label}</strong><span>{item.text}</span></li>)}</ol></section>;
  return <section className={styles.references} aria-label="Referencias"><h2>Referencias</h2><ol>{block.items.map((item, index) => <li key={`${item.title}-${index}`}>{item.label && <strong>{item.label}. </strong>}{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}{item.source && <span> — {item.source}</span>}</li>)}</ol></section>;
}

function slugify(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
