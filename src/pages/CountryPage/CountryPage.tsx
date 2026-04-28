/**
 * Página de detalle de país
 * 
 * Propósito: Mostrar información de un país específico y sus ciudades/destinos
 * Alcance: Información del país con lista de ciudades navegables
 * 
 * Decisiones técnicas:
 * - Usa getCountryBySlug para obtener datos del país desde la URL
 * - Integra getCitiesByCountrySlug para mostrar ciudades reales
 * - Filtra ciudades activas vs. próximamente
 * - Enlaces a /pais/:countrySlug/:citySlug
 * 
 * Limitaciones actuales:
 * - Sin imágenes del país
 * - Sin mapa interno del país (futuro)
 */

import { useParams, Link } from 'react-router-dom';
import { getCountryPageData } from '../../features/travelData';
import { isCityClickable, getCityDisplayName } from '../../features/cities/data/cities.utils';
import { getStatusLabel } from '../../features/countries/data/countries.utils';
import styles from './CountryPage.module.css';

export function CountryPage() {
  const { countrySlug } = useParams<{ countrySlug: string }>();
  
  // Usar travelData.service para obtener datos agregados
  const { country, cities, activeCities, comingSoonCities } = getCountryPageData(countrySlug || '');

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

        <section className={styles.citiesSection} aria-labelledby="cities-title">
          <h2 id="cities-title" className={styles.sectionTitle}>
            Ciudades y regiones
          </h2>

          {/* Ciudades activas */}
          {activeCities.length > 0 && (
            <div className={styles.citiesGrid} role="list">
              {activeCities.map(city => {
                const clickable = isCityClickable(city);
                const cityName = getCityDisplayName(city);

                return (
                  <div
                    key={city.id}
                    className={`${styles.cityCard} ${!clickable ? styles.cityCardDisabled : ''}`}
                    role="listitem"
                  >
                    {clickable ? (
                      <Link
                        to={`/pais/${countrySlug}/${city.slug}`}
                        className={styles.cityLink}
                        aria-label={`Explorar ${cityName}`}
                      >
                        <h3 className={styles.cityName}>{cityName}</h3>
                        {city.shortDescription && (
                          <p className={styles.cityDescription}>
                            {getCityDisplayName(city)}
                          </p>
                        )}
                        <div className={styles.cityMeta}>
                          <span className={styles.cityBadge} data-status="active">
                            Disponible
                          </span>
                          {city.destinationCount && (
                            <span className={styles.cityDestinations}>
                              {city.destinationCount} destinos
                            </span>
                          )}
                          <span aria-hidden="true">→</span>
                        </div>
                      </Link>
                    ) : (
                      <div className={styles.cityContent}>
                        <h3 className={styles.cityName}>{cityName}</h3>
                        <span className={styles.cityBadge} data-status="comingSoon">
                          Próximamente
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ciudades próximamente */}
          {comingSoonCities.length > 0 && (
            <div className={styles.comingSoonSection}>
              <h3 className={styles.comingSoonTitle}>Próximamente</h3>
              <div className={styles.comingSoonGrid} role="list">
                {comingSoonCities.map(city => (
                  <div key={city.id} className={styles.comingSoonCard} role="listitem">
                    <span className={styles.comingSoonName}>
                      {getCityDisplayName(city)}
                    </span>
                    <span className={styles.comingSoonBadge}>Próximamente</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sin ciudades */}
          {cities.length === 0 && (
            <div className={styles.emptyState}>
              <p>🏗️ Estamos preparando información sobre las ciudades de {country.displayName}.</p>
              <p className={styles.emptyText}>
                Vuelve pronto para descubrir destinos increíbles.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}