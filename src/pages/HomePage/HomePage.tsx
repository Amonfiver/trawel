import { Link } from 'react-router-dom';
import { getActiveCountries } from '../../features/countries/data/countries';
import styles from './HomePage.module.css';

export function HomePage() {
  const activeCountries = getActiveCountries();

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
            Explora el mundo y descubre aventuras increíbles
          </p>
        </section>

        <section className={styles.mapSection}>
          <div className={styles.mapPlaceholder}>
            <p>🗺️ Mapa interactivo del mundo</p>
            <p className={styles.mapNote}>
              Aquí irá el mapa D3 con todos los países
            </p>
          </div>
        </section>

        <section className={styles.countriesSection}>
          <h3 className={styles.sectionTitle}>Destinos disponibles</h3>
          <div className={styles.countriesGrid}>
            {activeCountries.map((country) => (
              <Link
                key={country.id}
                to={`/pais/${country.slug}`}
                className={styles.countryCard}
              >
                <h4 className={styles.countryName}>{country.name}</h4>
                <p className={styles.countryDescription}>
                  {country.shortDescription}
                </p>
                <span className={styles.countryMeta}>
                  {country.totalDestinations} destinos
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2026 Trawel - Todos los derechos reservados</p>
      </footer>
    </div>
  );
}