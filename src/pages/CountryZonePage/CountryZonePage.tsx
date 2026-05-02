/**
 * Purpose: Show a friendly placeholder for a selected internal country zone.
 * Scope: Public read-only route for /pais/:countrySlug/zona/:zoneSlug while zone content is pending.
 * Decisions: Uses router state for the best zone name and falls back to a clean title from the slug.
 * Limitations: No upload, persistence, forms, or editorial tables are created in this phase.
 * Recent changes: Initial zone placeholder reached from CountryInternalMap area clicks.
 */

import { Link, useLocation, useParams } from 'react-router-dom';
import { getCountryPageData } from '../../features/travelData';
import { getWorldCountryBySlug } from '../../features/countries/data/worldCountries';
import styles from './CountryZonePage.module.css';

interface ZoneLocationState {
  zoneName?: string;
  countryName?: string;
}

export function CountryZonePage() {
  const { countrySlug, zoneSlug } = useParams<{
    countrySlug: string;
    zoneSlug: string;
  }>();
  const location = useLocation();
  const state = (location.state || {}) as ZoneLocationState;

  const { country } = getCountryPageData(countrySlug || '');
  const worldCountry = countrySlug ? getWorldCountryBySlug(countrySlug) : undefined;
  const countryName =
    cleanDisplayName(state.countryName) ||
    cleanDisplayName(country?.displayName) ||
    cleanDisplayName(worldCountry?.displayName) ||
    'este país';
  const zoneName =
    cleanDisplayName(state.zoneName) || createNameFromSlug(zoneSlug) || 'Zona por descubrir';

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <nav className={styles.breadcrumb} aria-label="Navegación">
          <Link to="/" className={styles.breadcrumbLink}>Inicio</Link>
          <span className={styles.breadcrumbSeparator}>/</span>
          {countrySlug ? (
            <Link to={`/pais/${countrySlug}`} className={styles.breadcrumbLink}>
              {countryName}
            </Link>
          ) : (
            <span className={styles.breadcrumbCurrent}>{countryName}</span>
          )}
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbCurrent} aria-current="page">
            {zoneName}
          </span>
        </nav>

        <p className={styles.kicker}>{countryName}</p>
        <h1 className={styles.title}>{zoneName}</h1>
        <p className={styles.subtitle}>Próximamente aventuras en esta zona.</p>
      </header>

      <main className={styles.main}>
        <section className={styles.panel} aria-labelledby="zone-coming-soon-title">
          <div className={styles.panelContent}>
            <h2 id="zone-coming-soon-title" className={styles.panelTitle}>
              ¿Quieres estrenar este destino publicando tu aventura?
            </h2>
            <p className={styles.panelText}>
              Pronto podrás compartir fotos, rutas, consejos y experiencias para ayudar a
              otros viajeros a descubrir {zoneName} con una mirada cercana y útil.
            </p>
            <button className={styles.placeholderButton} type="button" disabled>
              Publicar mi aventura
            </button>
            <p className={styles.note}>Función en próxima fase.</p>
          </div>
        </section>

        <Link to={countrySlug ? `/pais/${countrySlug}` : '/'} className={styles.backLink}>
          Volver al mapa de {countryName}
        </Link>
      </main>
    </div>
  );
}

function cleanDisplayName(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function createNameFromSlug(zoneSlug?: string): string | null {
  if (!zoneSlug) {
    return null;
  }

  const words = zoneSlug
    .split('-')
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return null;
  }

  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
