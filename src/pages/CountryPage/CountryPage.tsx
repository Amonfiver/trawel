/**
 * Página de detalle de país
 * 
 * Propósito: Mostrar información de un país específico y sus ciudades
 * Alcance: Información básica del país con navegación de retorno
 * 
 * Decisiones técnicas:
 * - Usa getCountryBySlug para obtener datos del país desde la URL
 * - Muestra estado del país y metadatos
 * - Placeholder para futura lista de ciudades
 * 
 * Limitaciones actuales:
 * - Sin lista real de ciudades
 * - Sin imágenes del país
 */

import { useParams, Link } from 'react-router-dom';
import { getCountryBySlug, getStatusLabel } from '../../features/countries/data/countries.utils';
import styles from './CountryPage.module.css';

export function CountryPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const country = getCountryBySlug(countrySlug || '');

  if (!country) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>País no encontrado</h1>
          <p>El país "{countrySlug}" no existe en nuestra base de datos.</p>
          <Link to="/" className={styles.backLink}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Volver al mapa</Link>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{country.displayName}</h1>
          <p className={styles.subtitle}>{country.shortDescription}</p>
          <span className={`${styles.status} ${styles[country.status]}`}>
            {getStatusLabel(country.status)}
          </span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.info}>
          <div className={styles.infoCard}>
            <h3>Información general</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Capital</span>
                <span className={styles.infoValue}>{country.capital || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Continente</span>
                <span className={styles.infoValue}>{country.continent}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Código ISO</span>
                <span className={styles.infoValue}>{country.isoAlpha2} / {country.isoAlpha3}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Destinos</span>
                <span className={styles.infoValue}>{country.destinationCount || 0}</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.citiesSection}>
          <h2>Ciudades y regiones</h2>
          <div className={styles.soonCard}>
            <p>🗺️ Próximamente: mapa interactivo de {country.displayName}</p>
            <p className={styles.soonText}>
              Estamos preparando información detallada sobre las ciudades 
              y aventuras disponibles en {country.displayName}.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}