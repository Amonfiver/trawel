/**
 * Página de inicio de Trawel
 * 
 * Propósito: Punto de entrada de la aplicación con mapa mundial protagonista
 * Alcance: Hero, mapa interactivo, flujo de exploración y espacio futuro de servicios
 * 
 * Decisiones técnicas:
 * - WorldMap como elemento principal visual
 * - Usa modo de experiencia global desde Context (no selector propio)
 * - Contenido dinámico según modo seleccionado globalmente
 * - Diseño responsive que prioriza el mapa
 * 
 * Cambios recientes (2026-04-29):
 * - Eliminado selector de modo duplicado (ya existe en App.tsx global)
 * - Ahora usa useExperienceMode del contexto global
 */

import { WorldMap } from '../../features/map/components/WorldMap';
import { useExperienceMode } from '../../features/experienceMode';
import styles from './HomePage.module.css';

const flowSteps = [
  {
    title: 'Elige un país',
    text: 'Empieza en el mapa mundial y entra en el destino que despierte tu curiosidad.',
  },
  {
    title: 'Explora sus zonas',
    text: 'Avanza dentro de cada país para descubrir regiones y lugares con más precisión.',
  },
  {
    title: 'Lee aventuras reales',
    text: 'Encuentra experiencias compartidas por viajeros y publicadas tras revisión.',
  },
  {
    title: 'Comparte la tuya',
    text: 'Envía tu historia desde una zona del mapa; aparecerá públicamente cuando sea aprobada.',
  },
];

const servicePlaceholders = [
  'Hoteles recomendados',
  'Vuelos y transporte',
  'Seguros de viaje',
  'Actividades y tours',
  'eSIM y conexión',
  'Alquiler de coche',
];

/**
 * HomePage - Página principal de Trawel
 * 
 * Presenta el mapa mundial como elemento central de exploración,
 * con contenido dinámico según el modo global de experiencia.
 */
export function HomePage() {
  const { mode: experienceMode } = useExperienceMode();
  const heroSubtitle =
    experienceMode === 'student'
      ? 'Recorre países y zonas desde el mapa para entender lugares a través de experiencias reales de viajeros, siempre revisadas antes de publicarse.'
      : 'Entra en países y zonas para descubrir aventuras reales de viajeros. También puedes compartir tu propia experiencia: se revisa antes de aparecer públicamente.';

  return (
    <div className={styles.container}>
      {/* Hero con el mapa como protagonista */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroContent}>
          <h1 id="hero-title" className={styles.heroTitle}>
            Explora el mundo desde el mapa
          </h1>
          <p className={styles.heroSubtitle}>
            {heroSubtitle}
          </p>
        </div>

        {/* Mapa mundial - Elemento principal */}
        <div className={styles.mapContainer}>
          <WorldMap />
        </div>
      </section>

      {/* Información contextual */}
      <main className={styles.main}>
        <section className={styles.section} aria-labelledby="live-map-title">
          <h2 id="live-map-title" className={styles.sectionTitle}>
            Un mapa vivo de aventuras
          </h2>
          <p className={styles.sectionDescription}>
            Trawel no funciona como un catálogo cerrado: el viaje empieza en el mapa, baja a países y zonas, y crece con historias reales enviadas por viajeros.
          </p>

          <div className={styles.flowGrid}>
            {flowSteps.map(step => (
              <article key={step.title} className={styles.flowCard}>
                <h3 className={styles.flowTitle}>{step.title}</h3>
                <p className={styles.flowText}>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.services} aria-labelledby="services-title">
          <div className={styles.servicesHeader}>
            <span className={styles.servicesEyebrow}>Espacio futuro</span>
            <h2 id="services-title" className={styles.sectionTitle}>
              Servicios útiles para tu viaje
            </h2>
            <p className={styles.sectionDescription}>
              Más adelante reuniremos aquí recursos para preparar mejor tu aventura. Esta zona es provisional y no tiene integraciones activas.
            </p>
          </div>

          <div className={styles.servicesGrid} aria-label="Servicios previstos">
            {servicePlaceholders.map(service => (
              <article key={service} className={styles.serviceCard}>
                <h3 className={styles.serviceTitle}>{service}</h3>
                <p className={styles.serviceText}>Reservado para una futura selección de recursos.</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.note} aria-labelledby="review-title">
          <h2 id="review-title" className={styles.noteTitle}>
            Historias revisadas antes de publicarse
          </h2>
          <p className={styles.noteText}>
            Las aventuras enviadas por viajeros entran en revisión y solo aparecen públicamente cuando están aprobadas.
          </p>
        </section>
      </main>
    </div>
  );
}
