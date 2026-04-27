import { useParams, Link } from 'react-router-dom';
import { getCountryBySlug } from '../../features/countries/data/countries';
import styles from './CountryPage.module.css';

export function CountryPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  const country = getCountryBySlug(countrySlug || '');

  if (!country) {
    return (
      <div className={styles.container}>
        <h1>País no encontrado</h1>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/" className={styles.backLink}>← Volver al mapa</Link>
        <h1 className={styles.title}>{country.name}</h1>
        <p className={styles.subtitle}>{country.shortDescription}</p>
      </header>

      <main className={styles.main}>
        <section className={styles.info}>
          <div className={styles.infoCard}>
            <h3>Información general</h3>
            <p><strong>Capital:</strong> {country.capital}</p>
            <p><strong>Continente:</strong> {country.continent}</p>
            <p><strong>Destinos:</strong> {country.totalDestinations}</p>
          </div>
        </section>

        <section className={styles.citiesSection}>
          <h2>Ciudades y regiones</h2>
          <p className={styles.soon}>Próximamente: lista de ciudades</p>
        </section>
      </main>
    </div>
  );
}