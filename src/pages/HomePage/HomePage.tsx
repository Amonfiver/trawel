/**
 * Página de inicio de Trawel
 * 
 * Propósito: Punto de entrada de la aplicación con lista de países activos
 * Alcance: Muestra el sistema de países preparado y placeholder del futuro mapa
 * 
 * Decisiones técnicas:
 * - Usa utilidades de countries.utils para acceso a datos
 * - Placeholder visual para el futuro mapa D3
 * - Muestra conteos de países por estado
 * 
 * Limitaciones actuales:
 * - Sin mapa D3 real (solo placeholder)
 * - Sin imágenes de países
 */

import { Link } from 'react-router-dom';
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
            Explora el mundo y descubre aventuras increíbles
          </p>
        </section>

        <section className={styles.mapSection}>
          <div className={styles.mapPlaceholder}>
            <p>🗺️ Sistema de países preparado para el futuro mapa interactivo</p>
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
            <p className={styles.mapNote}>
              El mapa D3/TopoJSON se implementará en la siguiente fase
            </p>
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