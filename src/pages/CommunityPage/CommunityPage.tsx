import { Link } from 'react-router-dom';
import styles from './CommunityPage.module.css';

export function CommunityPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="community-title">
        <p className={styles.kicker}>Comunidad</p>
        <h1 id="community-title" className={styles.title}>
          Viajeros que ayudan a dibujar el mapa
        </h1>
        <p className={styles.intro}>
          Este espacio reunirá experiencias, fotos y recomendaciones aprobadas por Trawel e
          Investighost. Nada enviado por usuarios se publica automáticamente.
        </p>
        <div className={styles.actions}>
          <Link to="/compartir" className={styles.primaryLink}>
            Compartir una propuesta
          </Link>
          <Link to="/#destinos" className={styles.secondaryLink}>
            Explorar destinos
          </Link>
        </div>
      </section>

      <section className={styles.emptyState} aria-labelledby="community-status-title">
        <div>
          <p className={styles.statusEyebrow}>Contenido aprobado</p>
          <h2 id="community-status-title">La selección pública se abrirá con aportes revisados</h2>
          <p>
            Las futuras cards mostrarán fotos, experiencias y sitios recomendados solo cuando
            tengan derechos claros, clasificación por país/zona y aprobación editorial.
          </p>
        </div>
        <ul className={styles.checklist}>
          <li>Experiencias aprobadas</li>
          <li>Fotos con consentimiento</li>
          <li>Recomendaciones enlazadas a su destino</li>
        </ul>
      </section>
    </main>
  );
}
