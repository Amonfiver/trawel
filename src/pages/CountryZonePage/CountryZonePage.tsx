/**
 * Purpose: Show a friendly placeholder for a selected internal country zone.
 * Scope: Public read-only route for /pais/:countrySlug/zona/:zoneSlug and approved traveler adventures.
 * Decisions: Uses router state for the best zone name and falls back to a clean title from the slug.
 * Limitations: No upload, moderation UI, auth, or private photo rendering in this phase.
 * Recent changes: Shows withdrawal link/code after a pending adventure submission.
 */

import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getCountryPageData } from '../../features/travelData';
import { getWorldCountryBySlug } from '../../features/countries/data/worldCountries';
import {
  createTravelerAdventure,
  getApprovedAdventuresByZone,
  type TravelerAdventurePublic,
} from '../../features/adventures';
import styles from './CountryZonePage.module.css';

interface ZoneLocationState {
  zoneName?: string;
  countryName?: string;
}

type AdventuresState =
  | { status: 'loading' }
  | { status: 'ready'; adventures: TravelerAdventurePublic[] }
  | { status: 'error'; message: string };

interface AdventureFormValues {
  title: string;
  story: string;
  practicalTips: string;
  authorName: string;
  authorEmail: string;
  privacyAccepted: boolean;
  marketingConsent: boolean;
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string; withdrawalToken: string; withdrawalUrl: string }
  | { status: 'error'; message: string };

const EMPTY_FORM_VALUES: AdventureFormValues = {
  title: '',
  story: '',
  practicalTips: '',
  authorName: '',
  authorEmail: '',
  privacyAccepted: false,
  marketingConsent: false,
};

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
  const [adventuresState, setAdventuresState] = useState<AdventuresState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    const loadAdventures = async () => {
      if (!countrySlug || !zoneSlug) {
        setAdventuresState({ status: 'ready', adventures: [] });
        return;
      }

      setAdventuresState({ status: 'loading' });

      try {
        const adventures = await getApprovedAdventuresByZone(countrySlug, zoneSlug);
        if (isMounted) {
          setAdventuresState({ status: 'ready', adventures });
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar las aventuras de esta zona';
        setAdventuresState({ status: 'error', message });
      }
    };

    loadAdventures();

    return () => {
      isMounted = false;
    };
  }, [countrySlug, zoneSlug]);

  const approvedAdventures =
    adventuresState.status === 'ready' ? adventuresState.adventures : [];
  const hasApprovedAdventures = approvedAdventures.length > 0;

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
        <p className={styles.subtitle}>
          {hasApprovedAdventures
            ? 'Aventuras reales compartidas por viajeros.'
            : 'Próximamente aventuras en esta zona.'}
        </p>
      </header>

      <main className={styles.main}>
        {adventuresState.status === 'loading' && (
          <section className={styles.panel} aria-live="polite" aria-busy="true">
            <div className={styles.panelContent}>
              <h2 className={styles.panelTitle}>Cargando aventuras...</h2>
              <p className={styles.panelText}>
                Estamos buscando experiencias aprobadas en {zoneName}.
              </p>
            </div>
          </section>
        )}

        {adventuresState.status === 'error' && (
          <section className={styles.panel} role="alert">
            <div className={styles.panelContent}>
              <h2 className={styles.panelTitle}>No pudimos cargar las aventuras</h2>
              <p className={styles.panelText}>
                {adventuresState.message}. Puedes volver al mapa y seguir explorando otras zonas.
              </p>
            </div>
          </section>
        )}

        {adventuresState.status === 'ready' && hasApprovedAdventures && (
          <section className={styles.adventuresSection} aria-labelledby="approved-adventures-title">
            <div className={styles.sectionHeader}>
              <h2 id="approved-adventures-title" className={styles.sectionTitle}>
                Aventuras en {zoneName}
              </h2>
              <p className={styles.sectionSubtitle}>
                Historias aprobadas de viajeros que ya estrenaron esta zona.
              </p>
            </div>

            <div className={styles.adventuresList}>
              {approvedAdventures.map((adventure) => (
                <article key={adventure.id} className={styles.adventureCard}>
                  <h3 className={styles.adventureTitle}>{adventure.title}</h3>
                  <p className={styles.adventureStory}>{adventure.story}</p>

                  {cleanDisplayName(adventure.practical_tips) && (
                    <div className={styles.tipsBlock}>
                      <h4 className={styles.tipsTitle}>Consejos prácticos</h4>
                      <p className={styles.tipsText}>{adventure.practical_tips}</p>
                    </div>
                  )}

                  {adventure.photo_path && (
                    <p className={styles.photoNote}>
                      Esta aventura tiene foto aprobada, pero las imágenes privadas se servirán en
                      una próxima fase segura.
                    </p>
                  )}

                  <footer className={styles.adventureMeta}>
                    <span>Por {adventure.author_name}</span>
                    <span>{formatAdventureDate(adventure.approved_at || adventure.created_at)}</span>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {adventuresState.status === 'ready' && hasApprovedAdventures && (
          <AdventureSubmissionForm
            countrySlug={countrySlug}
            zoneSlug={zoneSlug}
            zoneName={zoneName}
            title="Comparte tu aventura"
          />
        )}

        {adventuresState.status === 'ready' && !hasApprovedAdventures && (
          <section className={styles.panel} aria-labelledby="zone-coming-soon-title">
            <div className={styles.panelContent}>
              <h2 id="zone-coming-soon-title" className={styles.panelTitle}>
                ¿Quieres estrenar este destino publicando tu aventura?
              </h2>
              <p className={styles.panelText}>
                Pronto podrás compartir fotos, rutas, consejos y experiencias para ayudar a
                otros viajeros a descubrir {zoneName} con una mirada cercana y útil.
              </p>
              <AdventureSubmissionForm
                countrySlug={countrySlug}
                zoneSlug={zoneSlug}
                zoneName={zoneName}
                title="Sé el primero en compartir tu aventura"
              />
            </div>
          </section>
        )}

        <Link to={countrySlug ? `/pais/${countrySlug}` : '/'} className={styles.backLink}>
          Volver al mapa de {countryName}
        </Link>
      </main>
    </div>
  );
}

function AdventureSubmissionForm({
  countrySlug,
  zoneSlug,
  zoneName,
  title,
}: {
  countrySlug?: string;
  zoneSlug?: string;
  zoneName: string;
  title: string;
}) {
  const [values, setValues] = useState<AdventureFormValues>(EMPTY_FORM_VALUES);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handleChange = (field: keyof AdventureFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));

    if (submitState.status !== 'submitting') {
      setSubmitState({ status: 'idle' });
    }
  };

  const handleConsentChange = (
    field: 'privacyAccepted' | 'marketingConsent',
    value: boolean
  ) => {
    setValues((current) => ({ ...current, [field]: value }));

    if (submitState.status !== 'submitting') {
      setSubmitState({ status: 'idle' });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateAdventureForm(values, countrySlug, zoneSlug);
    if (validationError) {
      setSubmitState({ status: 'error', message: validationError });
      return;
    }

    setSubmitState({ status: 'submitting' });

    const result = await createTravelerAdventure({
      countrySlug: countrySlug!,
      zoneSlug: zoneSlug!,
      zoneName,
      title: values.title,
      story: values.story,
      practicalTips: values.practicalTips,
      authorName: values.authorName,
      authorEmail: values.authorEmail,
      privacyAccepted: values.privacyAccepted,
      marketingConsent: values.marketingConsent,
    });

    if (!result.success) {
      setSubmitState({ status: 'error', message: result.error });
      return;
    }

    setValues(EMPTY_FORM_VALUES);
    setSubmitState({
      status: 'success',
      message: 'Hemos recibido tu aventura. La revisaremos antes de publicarla.',
      withdrawalToken: result.withdrawalToken,
      withdrawalUrl: result.withdrawalUrl,
    });
  };

  const isSubmitting = submitState.status === 'submitting';

  return (
    <form className={styles.adventureForm} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h3 className={styles.formTitle}>{title}</h3>
        <p className={styles.formIntro}>
          Por seguridad, revisamos las aventuras antes de publicarlas. No necesitas iniciar sesión.
        </p>
      </div>

      <label className={styles.formField}>
        <span>Título de la aventura</span>
        <input
          value={values.title}
          onChange={(event) => handleChange('title', event.target.value)}
          type="text"
          name="title"
          required
          maxLength={140}
          disabled={isSubmitting}
        />
      </label>

      <label className={styles.formField}>
        <span>Historia / experiencia</span>
        <textarea
          value={values.story}
          onChange={(event) => handleChange('story', event.target.value)}
          name="story"
          required
          rows={6}
          disabled={isSubmitting}
        />
      </label>

      <label className={styles.formField}>
        <span>Consejos prácticos</span>
        <textarea
          value={values.practicalTips}
          onChange={(event) => handleChange('practicalTips', event.target.value)}
          name="practicalTips"
          rows={4}
          disabled={isSubmitting}
        />
      </label>

      <div className={styles.formGrid}>
        <label className={styles.formField}>
          <span>Tu nombre</span>
          <input
            value={values.authorName}
            onChange={(event) => handleChange('authorName', event.target.value)}
            type="text"
            name="authorName"
            required
            maxLength={120}
            disabled={isSubmitting}
          />
        </label>

        <label className={styles.formField}>
          <span>Tu email</span>
          <input
            value={values.authorEmail}
            onChange={(event) => handleChange('authorEmail', event.target.value)}
            type="email"
            name="authorEmail"
            required
            maxLength={180}
            disabled={isSubmitting}
          />
        </label>
      </div>

      <div className={styles.consentGroup}>
        <label className={styles.checkboxField}>
          <input
            checked={values.privacyAccepted}
            onChange={(event) => handleConsentChange('privacyAccepted', event.target.checked)}
            type="checkbox"
            name="privacyAccepted"
            required
            disabled={isSubmitting}
          />
          <span>He leído y acepto la política de privacidad.</span>
        </label>

        <button
          className={styles.privacyToggle}
          type="button"
          onClick={() => setIsPrivacyOpen((current) => !current)}
          aria-expanded={isPrivacyOpen}
        >
          Ver política de privacidad
        </button>

        {isPrivacyOpen && (
          <div className={styles.privacyPanel}>
            <p><strong>Responsable:</strong> Trawel.</p>
            <p>
              <strong>Finalidad:</strong> revisar, moderar y publicar aventuras enviadas por
              viajeros.
            </p>
            <p>
              <strong>Datos tratados:</strong> nombre, email, contenido enviado y, en fases
              futuras, fotos.
            </p>
            <p>
              <strong>Publicación:</strong> si se aprueba la aventura, se publicarán el título,
              historia, consejos, zona y nombre visible. El email no será público.
            </p>
            <p>
              <strong>Comunicaciones/promociones:</strong> solo se enviarán si aceptas el
              consentimiento opcional separado.
            </p>
            <p>
              <strong>Cesiones:</strong> Trawel no venderá datos personales a terceros.
            </p>
            <p>
              <strong>Conservación:</strong> los datos se conservarán mientras sea necesario para
              gestionar la aventura, moderación, publicación y posibles responsabilidades.
            </p>
            <p>
              <strong>Derechos:</strong> puedes solicitar acceso, rectificación, supresión,
              oposición, limitación y retirada del consentimiento.
            </p>
            <p>
              <strong>Contacto:</strong> privacidad@trawel.net. Este contacto es temporal y debe
              reemplazarse por el email real definitivo antes de producción pública.
            </p>
            <p className={styles.privacyReviewNote}>
              Este texto es informativo y debe revisarse por asesoría/legal antes de producción
              pública.
            </p>
          </div>
        )}

        <label className={styles.checkboxField}>
          <input
            checked={values.marketingConsent}
            onChange={(event) => handleConsentChange('marketingConsent', event.target.checked)}
            type="checkbox"
            name="marketingConsent"
            disabled={isSubmitting}
          />
          <span>
            Acepto recibir comunicaciones de Trawel con novedades, promociones, ofertas de viaje o
            lugares de interés.
          </span>
        </label>
      </div>

      {submitState.status === 'success' && (
        <div className={styles.formSuccess} role="status">
          <p>{submitState.message}</p>
          <div className={styles.withdrawalSummary}>
            <p>
              Guarda este enlace o código privado. Te permite retirar la aventura mientras siga
              pendiente de revisión.
            </p>
            <a href={submitState.withdrawalUrl} className={styles.withdrawalLink}>
              Abrir enlace de retirada
            </a>
            <code className={styles.withdrawalCode}>{submitState.withdrawalToken}</code>
          </div>
        </div>
      )}

      {submitState.status === 'error' && (
        <p className={styles.formError} role="alert">
          {submitState.message}
        </p>
      )}

      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar aventura para revisión'}
      </button>
    </form>
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

function validateAdventureForm(
  values: AdventureFormValues,
  countrySlug?: string,
  zoneSlug?: string
): string | null {
  if (!countrySlug || !zoneSlug) {
    return 'No pudimos identificar esta zona. Vuelve al mapa e inténtalo de nuevo.';
  }

  if (!values.title.trim()) {
    return 'Escribe un título para tu aventura.';
  }

  if (!values.story.trim()) {
    return 'Cuéntanos la historia o experiencia principal.';
  }

  if (!values.authorName.trim()) {
    return 'Indica tu nombre.';
  }

  if (!isBasicEmail(values.authorEmail)) {
    return 'Escribe un email válido.';
  }

  if (!values.privacyAccepted) {
    return 'Debes leer y aceptar la política de privacidad para enviar tu aventura.';
  }

  return null;
}

function isBasicEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

function formatAdventureDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Aprobada recientemente';
  }

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
