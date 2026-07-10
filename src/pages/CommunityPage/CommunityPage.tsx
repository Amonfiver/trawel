import { Link } from 'react-router-dom';
import albarracinImage from '../../assets/home/plans/albarracin.png';
import mexicoImage from '../../assets/countries/hero/mexico.webp';
import spainImage from '../../assets/countries/hero/espana.webp';
import styles from './CommunityPage.module.css';

interface CommunityPreviewCard {
  id: string;
  title: string;
  countryName: string;
  zoneName?: string;
  contributionType: string;
  summary: string;
  credit: string;
  image: string;
  countrySlug: string;
  zoneSlug?: string;
}

const communityPreviewCards: CommunityPreviewCard[] = [
  {
    id: 'albarracin-miradores',
    title: 'Un paseo lento por los miradores de Albarracín',
    countryName: 'España',
    zoneName: 'Albarracín',
    contributionType: 'Experiencia',
    summary:
      'Una ruta tranquila para mirar la muralla desde varios ángulos y entender por qué el pueblo cambia con la luz.',
    credit: 'Ejemplo editorial Trawel',
    image: albarracinImage,
    countrySlug: 'espana',
    zoneSlug: 'albarracin',
  },
  {
    id: 'mexico-mercados',
    title: 'Mercados, colores y primeras pistas de México',
    countryName: 'México',
    contributionType: 'Recomendación de sitio',
    summary:
      'Una invitación a empezar por los mercados locales para leer aromas, ritmos y pequeñas historias cotidianas.',
    credit: 'Ejemplo editorial Trawel',
    image: mexicoImage,
    countrySlug: 'mexico',
  },
  {
    id: 'espana-encabezado',
    title: 'Una imagen para abrir una historia de viaje',
    countryName: 'España',
    contributionType: 'Foto aprobada',
    summary:
      'Las futuras fotos de comunidad se mostrarán solo cuando tengan derechos claros y revisión editorial.',
    credit: 'Ejemplo editorial Trawel',
    image: spainImage,
    countrySlug: 'espana',
  },
];

export function CommunityPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="community-title">
        <p className={styles.kicker}>Comunidad</p>
        <h1 id="community-title" className={styles.title}>
          Viajeros que ayudan a dibujar el mapa
        </h1>
        <p className={styles.intro}>
          Este espacio reunirá experiencias, fotos y recomendaciones aprobadas por Trawel e
          Investighost. Nada enviado por usuarios se publica automáticamente.
        </p>
        <div className={styles.actions}>
          <Link to="/compartir" className={styles.primaryLink}>
            Compartir una propuesta
          </Link>
          <Link to="/#destinos" className={styles.secondaryLink}>
            Explorar destinos
          </Link>
        </div>
      </section>

      <section className={styles.cardsSection} aria-labelledby="community-cards-title">
        <div className={styles.sectionHeader}>
          <p className={styles.statusEyebrow}>Selección editorial inicial</p>
          <h2 id="community-cards-title">Cards visuales para aportes aprobados</h2>
          <p>
            Mientras abrimos las primeras aportaciones reales, mostramos ejemplos editoriales del
            tipo de historias que formarán parte de la comunidad. La versión pública definitiva
            leerá solo contenido aprobado por Trawel e Investighost.
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {communityPreviewCards.map((card) => (
            <Link
              key={card.id}
              to={getCommunityCardHref(card)}
              className={styles.communityCard}
            >
              <div className={styles.cardImageWrap}>
                <img src={card.image} alt="" className={styles.cardImage} />
                <span className={styles.cardType}>{card.contributionType}</span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardLocation}>
                  {card.countryName}
                  {card.zoneName ? ` · ${card.zoneName}` : ''}
                </p>
                <h3>{card.title}</h3>
                <p>{card.summary}</p>
                <span className={styles.cardCredit}>Crédito: {card.credit}</span>
                <span className={styles.cardAction}>Ver destino</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.emptyState} aria-labelledby="community-status-title">
        <div>
          <p className={styles.statusEyebrow}>Contenido aprobado</p>
          <h2 id="community-status-title">La selección pública se abrirá con aportes revisados</h2>
          <p>
            Las futuras cards mostrarán fotos, experiencias y sitios recomendados solo cuando
            tengan derechos claros, clasificación por país/zona y aprobación editorial. Investighost
            revisará, clasificará y aprobará cada aportación antes de que pueda aparecer.
          </p>
        </div>
        <ul className={styles.checklist}>
          <li>Experiencias aprobadas</li>
          <li>Fotos con consentimiento</li>
          <li>Recomendaciones enlazadas a su destino</li>
        </ul>
      </section>
    </main>
  );
}

function getCommunityCardHref(card: CommunityPreviewCard): string {
  if (card.zoneSlug) {
    return `/pais/${card.countrySlug}/zona/${card.zoneSlug}`;
  }

  return `/pais/${card.countrySlug}`;
}
