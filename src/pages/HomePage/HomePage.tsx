/**
 * Página de inicio de Trawel
 * 
 * Propósito: Punto de entrada de la aplicación con mapa mundial protagonista
 * Alcance: Hero, mapa interactivo, información de países disponibles
 * 
 * Decisiones técnicas:
 * - WorldMap como elemento principal visual
 * - Información complementaria sin saturar
 * - Diseño responsive que prioriza el mapa
 * - Carga lazy de componentes secundarios (futuro)
 */

import { WorldMap } from '../../features/map/components/WorldMap';
import { getActiveCountries, getComingSoonCountries, getCountryCounts } from '../../features/countries/data/countries.utils';
import styles from './HomePage.module.css';

/**
 * HomePage - Página principal de Trawel
 * 
 * Presenta el mapa mundial como elemento central de exploración,
 * con información contextual sobre destinos disponibles.
 */
export function HomePage() {
  const activeCountries = getActiveCountries();
  const comingSoonCountries = getComingSoonCountries();
  const counts = getCountryCounts();

  return (
    <div className={styles.container}>
      {/* Hero con el mapa como protagonista */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <h1 id="hero-title" className={styles.heroTitle}>
            Explora el mundo con Trawel
          </h1>
          <p className={styles.heroSubtitle}>
            Descubre destinos únicos seleccionados para viajeros curiosos
          </p>
          
          {/* Estadísticas rápidas */}
          <div className={styles.heroStats} role="region" aria-label="Estadísticas de destinos">
            <div className={styles.stat}>
              <span className={styles.statNumber}>{counts.active}</span>
              <span className={styles.statLabel}>Países disponibles</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{counts.comingSoon}</span>
              <span className={styles.statLabel}>Próximamente</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>15+</span>
              <span className={styles.statLabel}>Destinos</span>
            </div>
          </div>
        </div>

        {/* Mapa mundial - Elemento principal */}
        <div className={styles.mapContainer}>
          <WorldMap />
        </div>
      </section>

      {/* Información contextual */}
      <main className={styles.main}>
        {/* Sección de países activos */}
        <section className={styles.section} aria-labelledby="active-countries-title">
          <h2 id="active-countries-title" className={styles.sectionTitle}>
            Destinos disponibles
          </h2>
          <p className={styles.sectionDescription}>
            Haz clic en cualquier país destacado en el mapa o selecciona uno de nuestros destinos curados:
          </p>
          
          <div className={styles.countriesGrid} role="list">
            {activeCountries.map(country => (
              <a
                key={country.isoAlpha2}
                href={`/pais/${country.slug}`}
                className={styles.countryCard}
                role="listitem"
                aria-label={`Explorar ${country.displayName}, ${country.destinationCount || 0} destinos disponibles`}
              >
                <div className={styles.countryCardHeader}>
                  <span className={styles.countryFlag} aria-hidden="true">
                    {getCountryFlag(country.isoAlpha2)}
                  </span>
                  <span className={styles.countryStatus} data-status="active">
                    Disponible
                  </span>
                </div>
                <h3 className={styles.countryName}>{country.displayName}</h3>
                <p className={styles.countryDescription}>{country.shortDescription}</p>
                <div className={styles.countryMeta}>
                  <span>{country.destinationCount || 0} destinos</span>
                  <span aria-hidden="true">→</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Sección de próximos países */}
        {comingSoonCountries.length > 0 && (
          <section className={styles.section} aria-labelledby="coming-soon-title">
            <h2 id="coming-soon-title" className={styles.sectionTitle}>
              Próximamente
            </h2>
            <p className={styles.sectionDescription}>
              Estamos preparando contenido para estos destinos:
            </p>
            
            <div className={styles.comingSoonGrid} role="list">
              {comingSoonCountries.map(country => (
                <div
                  key={country.isoAlpha2}
                  className={styles.comingSoonCard}
                  role="listitem"
                >
                  <span className={styles.countryFlag} aria-hidden="true">
                    {getCountryFlag(country.isoAlpha2)}
                  </span>
                  <div>
                    <h3 className={styles.comingSoonName}>{country.displayName}</h3>
                    <span className={styles.comingSoonBadge}>Próximamente</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA final */}
        <section className={styles.cta} aria-labelledby="cta-title">
          <h2 id="cta-title" className={styles.ctaTitle}>
            ¿Listo para tu próxima aventura?
          </h2>
          <p className={styles.ctaText}>
            Explora nuestros destinos disponibles y descubre experiencias únicas.
          </p>
        </section>
      </main>
    </div>
  );
}

/**
 * Helper para obtener emoji de bandera según código ISO
 */
function getCountryFlag(isoAlpha2: string): string {
  const flags: Record<string, string> = {
    ES: '🇪🇸',
    JP: '🇯🇵',
    PE: '🇵🇪',
    FR: '🇫🇷',
    IT: '🇮🇹',
  };
  return flags[isoAlpha2] || '🌍';
}