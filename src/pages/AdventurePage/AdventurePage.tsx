import { useParams, Link } from 'react-router-dom';
import styles from './AdventurePage.module.css';

export function AdventurePage() {
  const { adventureSlug } = useParams<{ adventureSlug: string }>();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Volver al inicio</Link>
        <h1 className={styles.title}>Aventura: {adventureSlug}</h1>
      </header>

      <main className={styles.main}>
        <p className={styles.soon}>Próximamente: ficha detallada de la aventura</p>
      </main>
    </div>
  );
}