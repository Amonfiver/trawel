import { useParams, Link } from 'react-router-dom';
import { getCountryBySlug } from '../../features/countries/data/countries';
import styles from './CityPage.module.css';

export function CityPage() {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  const country = getCountryBySlug(countrySlug || '');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to={`/pais/${countrySlug}`} className={styles.backLink}>
          ← Volver a {country?.name || 'país'}
        </Link>
        <h1 className={styles.title}>Ciudad: {citySlug}</h1>
      </header>

      <main className={styles.main}>
        <p className={styles.soon}>Próximamente: información detallada de la ciudad</p>
      </main>
    </div>
  );
}