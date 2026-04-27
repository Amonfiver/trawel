/**
 * Página de detalle de ciudad
 * 
 * Propósito: Mostrar información de una ciudad específica y sus aventuras
 * Alcance: Estructura base con navegación desde país
 * 
 * Decisiones técnicas:
 * - Obtiene country desde URL para mostrar contexto
 * - Placeholder para futura lista de aventuras
 * 
 * Limitaciones actuales:
 * - Sin datos reales de ciudades
 * - Sin lista de aventuras
 */

import { useParams, Link } from 'react-router-dom';
import { getCountryBySlug } from '../../features/countries/data/countries.utils';
import styles from './CityPage.module.css';

export function CityPage() {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  const country = getCountryBySlug(countrySlug || '');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to={`/pais/${countrySlug}`} className={styles.backLink}>
          ← Volver a {country?.displayName || 'país'}
        </Link>
        <h1 className={styles.title}>Ciudad: {citySlug}</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.soonCard}>
          <p>🏙️ Próximamente: información detallada de {citySlug}</p>
          <p className={styles.soonText}>
            Estamos preparando información sobre las mejores aventuras 
            y experiencias en {citySlug}, {country?.displayName}.
          </p>
        </div>
      </main>
    </div>
  );
}