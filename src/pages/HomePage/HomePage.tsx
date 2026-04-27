/**
 * Página de inicio de Trawel
 * 
 * Propósito: Punto de entrada de la aplicación con mapa mundial y lista de países
 * Alcance: Muestra mapa D3 interactivo y lista de países disponibles
 * 
 * Decisiones técnicas:
 * - Usa WorldMap component para visualización geográfica
 * - Usa utilidades de countries.utils para acceso a datos
 * - Mantiene lista de países como fallback/acceso rápido
 * 
 * Limitaciones actuales:
 * - WorldMap sin zoom/pan
 * - Sin imágenes de países
 */

import { Link } from 'react-router-dom';
import { WorldMap } from '../../features/map/components/WorldMap';
import { getActiveCountries, getComingSoonCountries, getCountryCounts } from '../../features/countries/data/countries.utils';
import styles from './HomePage.module.css';

export function HomePage() {
  const activeCountries = getActiveCountries();
  const comingSoonCountries = getComingSoonCountries();
  const counts = getCountryCounts();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Trawel</h1>
        <p className={styles.subtitle}>Tu portal de descubrimiento de viajes</p>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>Elije tu próximo destino</h2>
          <p className={styles.heroText}>
            Explora el mundo y descubre aventuras increíbles. 
            Haz clic en un país para descubrir destinos.
          </p>
        </section>

        <section className={styles.mapSection}>
          <WorldMap />
          <div className={styles.mapStats}>
            <span className={styles.stat}>
              <strong>{counts.active}</strong> países activos
            </span>
            <span className={styles.stat}>
              <strong>{counts.comingSoon}</strong> próximamente
            </span>
            <span className={styles.stat}>
              <strong>{counts.total}</strong> total
            </span>
          </div>
        </section>

        <section className={styles.countriesSection}>
          <h3 className={styles.sectionTitle}>Destinos disponibles</h3>
          <div className={styles.countriesGrid}>
            {activeCountries.map((country) => (
              <Link
                key={country.isoAlpha2}
                to={`/pais/${country.slug}`}
                className={styles.countryCard}
              >
                <h4 className={styles.countryName}>{country.displayName}</h4>
                <p className={styles.countryDescription}>
                  {country.shortDescription}
                </p>
                <span className={styles.countryMeta}>
                  {country.destinationCount} destinos
                </span>
              </Link>
            ))}
          </div>
        </section>

        {comingSoonCountries.length > 0 && (
          <section className={styles.comingSoonSection}>
            <h3 className={styles.sectionTitle}>Próximamente</h3>
            <div className={styles.comingSoonGrid}>
              {comingSoonCountries.map((country) => (
                <div
                  key={country.isoAlpha2}
                  className={styles.comingSoonCard}
                >
                  <h4 className={styles.comingSoonName}>{country.displayName}</h4>
                  <span className={styles.comingSoonBadge}>Próximamente</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2026 Trawel - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}