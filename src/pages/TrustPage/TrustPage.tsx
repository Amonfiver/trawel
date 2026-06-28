import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  submitCommunitySuggestion,
  submitContactMessage,
} from '../../features/travelData/productContent/userMessageQueue.service';
import { getPublishedStaticPageBySlug } from '../../features/travelData/productContent/productContent.service';
import type { StaticPage } from '../../features/travelData/productContent/productContent.types';
import styles from './TrustPage.module.css';

type TrustPageSlug =
  | 'sobre-trawel'
  | 'contacto'
  | 'privacidad'
  | 'cookies'
  | 'terminos'
  | 'creditos-imagenes'
  | 'compartir';

interface TrustPageContent {
  kicker: string;
  title: string;
  intro: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
  cta?: {
    label: string;
    href: string;
  };
}

const trustPages: Record<TrustPageSlug, TrustPageContent> = {
  'sobre-trawel': {
    kicker: 'Sobre Trawel',
    title: 'Inspiración viajera y cultural, con calma',
    intro:
      'Trawel es una plataforma pública para explorar destinos desde dos miradas: Aventura, más viajera y sensorial, y Estudiante, más cultural e histórica.',
    sections: [
      {
        title: 'Qué estamos construyendo',
        body:
          'Trawel quiere ser un esqueleto visual y funcional que muestre contenido revisado sobre países, zonas, lugares, rutas y planes sin crear cada página a mano.',
      },
      {
        title: 'Contenido en evolución',
        body:
          'La información editorial puede crecer, corregirse y actualizarse con el tiempo. Antes de viajar conviene contrastar horarios, precios, transporte y requisitos con fuentes oficiales.',
      },
      {
        title: 'Comunidad y fotos reales',
        body:
          'Las imágenes y experiencias de la comunidad podrán incorporarse progresivamente, siempre con permisos claros, revisión y créditos visibles cuando corresponda.',
      },
    ],
  },
  contacto: {
    kicker: 'Contacto',
    title: 'Hablar con Trawel',
    intro:
      'Trawel está en fase inicial. Por ahora el contacto sirve para consultas generales, privacidad, retirada de contenido o avisos sobre información turística que deba revisarse.',
    sections: [
      {
        title: 'Correo de referencia',
        body:
          'Puedes escribir a privacidad@trawel.net para asuntos de privacidad, retirada o revisión de contenido. Este contacto es temporal y podrá cambiar cuando exista un flujo formal.',
      },
      {
        title: 'Avisos útiles',
        body:
          'Si detectas un dato desactualizado, indica el destino, la página y la fuente oficial que recomiendas revisar. Eso ayuda a priorizar futuras actualizaciones.',
      },
    ],
  },
  privacidad: {
    kicker: 'Privacidad',
    title: 'Privacidad y datos personales',
    intro:
      'Esta página resume el enfoque inicial de privacidad de Trawel. No sustituye una política legal definitiva, pero explica cómo se tratan los datos en esta fase.',
    sections: [
      {
        title: 'Aventuras enviadas por viajeros',
        body:
          'Cuando una persona comparte una aventura, Trawel puede recoger nombre visible, email de contacto, texto enviado, zona relacionada y fecha de aceptación de privacidad.',
      },
      {
        title: 'Moderación',
        body:
          'Los envíos comunitarios no se publican automáticamente. Primero pasan por revisión para evitar spam, datos sensibles, contenido inadecuado o información engañosa.',
      },
      {
        title: 'Retirada',
        body:
          'Los envíos pendientes pueden retirarse mediante un enlace o código privado. Si un contenido ya fue revisado, la retirada requerirá contacto manual.',
      },
    ],
    cta: {
      label: 'Retirar una aventura pendiente',
      href: '/retirar-aventura',
    },
  },
  cookies: {
    kicker: 'Cookies',
    title: 'Uso de cookies',
    intro:
      'Trawel debe informar de forma clara sobre cookies y tecnologías similares. Esta versión inicial mantiene el mensaje prudente mientras el producto evoluciona.',
    sections: [
      {
        title: 'Cookies técnicas',
        body:
          'La web puede usar almacenamiento técnico necesario para recordar preferencias básicas o permitir el funcionamiento correcto de la experiencia.',
      },
      {
        title: 'Analítica futura',
        body:
          'Si Trawel incorpora analítica, deberá explicarse de forma visible y ajustarse a la normativa aplicable, incluyendo opciones de consentimiento cuando correspondan.',
      },
    ],
  },
  terminos: {
    kicker: 'Términos',
    title: 'Condiciones de uso iniciales',
    intro:
      'Trawel ofrece contenido de inspiración viajera y cultural. La información se prepara con cuidado, pero no debe sustituir la consulta de fuentes oficiales antes de viajar.',
    sections: [
      {
        title: 'Información turística cambiante',
        body:
          'Horarios, precios, accesos, visados, transporte, seguridad y condiciones locales pueden cambiar. Revisa siempre organismos oficiales, operadores y fuentes locales actualizadas.',
      },
      {
        title: 'Contenido editorial',
        body:
          'Los textos de Trawel buscan orientar e inspirar. Pueden actualizarse cuando haya mejores fuentes, correcciones o nuevas decisiones editoriales.',
      },
      {
        title: 'Contenido comunitario',
        body:
          'Las historias y fotos de viajeros, cuando existan, serán aportaciones personales moderadas. Trawel podrá retirarlas si incumplen permisos, privacidad o calidad editorial.',
      },
    ],
  },
  'creditos-imagenes': {
    kicker: 'Créditos',
    title: 'Créditos de imágenes',
    intro:
      'Trawel usa imágenes como parte de su experiencia editorial. Algunas son assets locales iniciales y otras podrán venir de colaboradores, siempre con permisos y créditos cuando aplique.',
    sections: [
      {
        title: 'Imágenes actuales',
        body:
          'Las imágenes incluidas en esta fase sirven para dar contexto visual a destinos y páginas. El sistema evolucionará hacia metadatos de imagen, licencias, créditos y estado editorial.',
      },
      {
        title: 'Fotos de comunidad',
        body:
          'Las fotos reales aportadas por viajeros no deben publicarse sin permiso explícito. La intención es mostrar créditos claros y facilitar retirada o revisión cuando sea necesario.',
      },
      {
        title: 'Fallback premium',
        body:
          'Cuando no exista imagen real aprobada, Trawel puede mostrar una portada temporal cuidada para que el destino no parezca incompleto.',
      },
    ],
  },
  compartir: {
    kicker: 'Comunidad',
    title: 'Compartir experiencias con Trawel',
    intro:
      'La colaboración comunitaria crecerá de forma progresiva. La prioridad es recibir historias y fotos con permiso, revisar el contenido y publicarlo con cuidado.',
    sections: [
      {
        title: 'Cómo funcionará',
        body:
          'Las aportaciones podrán asociarse a países o zonas concretas. Antes de publicarse pasarán por moderación para confirmar permisos, tono, calidad y ausencia de datos sensibles.',
      },
      {
        title: 'Fotos y créditos',
        body:
          'Las fotos reales deberán tener permiso explícito. Cuando se publiquen, Trawel podrá mostrar el crédito indicado por la persona colaboradora.',
      },
      {
        title: 'Disponibilidad gradual',
        body:
          'En algunas zonas puede aparecer un formulario de aventura. Si aún no está disponible, esta página sirve como referencia del enfoque comunitario futuro.',
      },
    ],
    cta: {
      label: 'Explorar destinos',
      href: '/#destinos',
    },
  },
};

interface TrustPageProps {
  page: TrustPageSlug;
}

type ContactFormStatus = 'idle' | 'submitting' | 'success' | 'error';
type CommunityProposalType = 'experiencia' | 'destino' | 'colaboracion' | 'correccion' | 'otro';

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacyAccepted: boolean;
}

const initialContactFormValues: ContactFormValues = {
  name: '',
  email: '',
  subject: '',
  message: '',
  privacyAccepted: false,
};

interface ShareFormValues {
  name: string;
  email: string;
  suggestedPlace: string;
  proposalType: CommunityProposalType;
  message: string;
  privacyAccepted: boolean;
}

const initialShareFormValues: ShareFormValues = {
  name: '',
  email: '',
  suggestedPlace: '',
  proposalType: 'experiencia',
  message: '',
  privacyAccepted: false,
};

const communityProposalLabels: Record<CommunityProposalType, string> = {
  experiencia: 'Experiencia',
  destino: 'Destino',
  colaboracion: 'Colaboración',
  correccion: 'Corrección',
  otro: 'Otro',
};

export function TrustPage({ page }: TrustPageProps) {
  const fallbackContent = trustPages[page];
  const [supabaseContent, setSupabaseContent] = useState<TrustPageContent | null>(null);
  const [contactFormValues, setContactFormValues] = useState<ContactFormValues>(initialContactFormValues);
  const [contactStatus, setContactStatus] = useState<ContactFormStatus>('idle');
  const [contactStatusMessage, setContactStatusMessage] = useState('');
  const [shareFormValues, setShareFormValues] = useState<ShareFormValues>(initialShareFormValues);
  const [shareStatus, setShareStatus] = useState<ContactFormStatus>('idle');
  const [shareStatusMessage, setShareStatusMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;

    setSupabaseContent(null);

    getPublishedStaticPageBySlug(page).then((staticPage) => {
      if (!isCurrent) {
        return;
      }

      setSupabaseContent(staticPage ? mapStaticPageToTrustPageContent(staticPage, fallbackContent) : null);
    });

    return () => {
      isCurrent = false;
    };
  }, [fallbackContent, page]);

  const content = supabaseContent || fallbackContent;
  const isContactPage = page === 'contacto';
  const isSharePage = page === 'compartir';

  const handleContactFormChange = (
    field: keyof ContactFormValues,
    value: string | boolean
  ) => {
    setContactFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    if (contactStatus !== 'submitting') {
      setContactStatus('idle');
      setContactStatusMessage('');
    }
  };

  const handleContactFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (contactStatus === 'submitting') {
      return;
    }

    setContactStatus('submitting');
    setContactStatusMessage('Enviando tu mensaje...');

    const result = await submitContactMessage({
      name: contactFormValues.name,
      email: contactFormValues.email,
      subject: contactFormValues.subject,
      message: contactFormValues.message,
      sourcePage: 'contacto',
      privacyAccepted: contactFormValues.privacyAccepted,
      metadata: {
        source: 'trust_page_contact_form',
      },
    });

    if (result.ok) {
      setContactFormValues(initialContactFormValues);
      setContactStatus('success');
      setContactStatusMessage(
        'Mensaje enviado. Lo revisaremos antes de responder, sin publicarlo en la web.'
      );
      return;
    }

    setContactStatus('error');
    setContactStatusMessage(
      result.status === 'validation_error'
        ? result.message
        : 'No hemos podido enviar el mensaje ahora mismo. Puedes intentarlo de nuevo en unos minutos.'
    );
  };

  const handleShareFormChange = (
    field: keyof ShareFormValues,
    value: string | boolean
  ) => {
    setShareFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    if (shareStatus !== 'submitting') {
      setShareStatus('idle');
      setShareStatusMessage('');
    }
  };

  const handleShareFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (shareStatus === 'submitting') {
      return;
    }

    setShareStatus('submitting');
    setShareStatusMessage('Enviando tu propuesta...');

    const suggestedPlace = shareFormValues.suggestedPlace.trim();

    if (!suggestedPlace) {
      setShareStatus('error');
      setShareStatusMessage('Indica el país o destino relacionado con la propuesta.');
      return;
    }

    const proposalLabel = communityProposalLabels[shareFormValues.proposalType];
    const result = await submitCommunitySuggestion({
      name: shareFormValues.name,
      email: shareFormValues.email,
      subject: `${proposalLabel}: ${suggestedPlace}`,
      message: shareFormValues.message,
      sourcePage: 'compartir',
      privacyAccepted: shareFormValues.privacyAccepted,
      metadata: {
        source: 'trust_page_share_form',
        proposal_type: shareFormValues.proposalType,
        suggested_place: suggestedPlace,
      },
    });

    if (result.ok) {
      setShareFormValues(initialShareFormValues);
      setShareStatus('success');
      setShareStatusMessage(
        'Propuesta recibida para revisión. No se publicará automáticamente.'
      );
      return;
    }

    setShareStatus('error');
    setShareStatusMessage(
      result.status === 'validation_error'
        ? result.message
        : 'No hemos podido enviar la propuesta ahora mismo. Puedes intentarlo de nuevo en unos minutos.'
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="trust-page-title">
        <p className={styles.kicker}>{content.kicker}</p>
        <h1 id="trust-page-title" className={styles.title}>
          {content.title}
        </h1>
        <p className={styles.intro}>{content.intro}</p>
      </section>

      <section className={styles.content} aria-label="Información">
        {isContactPage && (
          <section className={styles.contactPanel} aria-labelledby="contact-form-title">
            <div className={styles.contactPanelIntro}>
              <p className={styles.contactEyebrow}>Mensaje privado</p>
              <h2 id="contact-form-title">Cuéntanos qué necesitas revisar</h2>
              <p>
                Tu mensaje entra en una cola privada de revisión. No se muestra públicamente ni
                se convierte en contenido visible de Trawel.
              </p>
            </div>

            <form className={styles.contactForm} onSubmit={handleContactFormSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={contactFormValues.name}
                    onChange={(event) => handleContactFormChange('name', event.target.value)}
                    required
                    maxLength={160}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={contactFormValues.email}
                    onChange={(event) => handleContactFormChange('email', event.target.value)}
                    required
                    maxLength={320}
                  />
                </label>
              </div>

              <label className={styles.formField}>
                <span>Asunto</span>
                <input
                  type="text"
                  name="subject"
                  value={contactFormValues.subject}
                  onChange={(event) => handleContactFormChange('subject', event.target.value)}
                  required
                  maxLength={200}
                />
              </label>

              <label className={styles.formField}>
                <span>Mensaje</span>
                <textarea
                  name="message"
                  value={contactFormValues.message}
                  onChange={(event) => handleContactFormChange('message', event.target.value)}
                  required
                  maxLength={5000}
                  rows={7}
                />
              </label>

              <label className={styles.privacyConsent}>
                <input
                  type="checkbox"
                  name="privacyAccepted"
                  checked={contactFormValues.privacyAccepted}
                  onChange={(event) => handleContactFormChange('privacyAccepted', event.target.checked)}
                  required
                />
                <span>
                  Acepto que Trawel use estos datos para revisar y responder este mensaje privado.
                </span>
              </label>

              <div className={styles.formFooter}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={contactStatus === 'submitting'}
                >
                  {contactStatus === 'submitting' ? 'Enviando...' : 'Enviar mensaje'}
                </button>

                {contactStatusMessage && (
                  <p className={`${styles.formStatus} ${styles[contactStatus]}`} role="status">
                    {contactStatusMessage}
                  </p>
                )}
              </div>
            </form>
          </section>
        )}

        {isSharePage && (
          <section className={styles.contactPanel} aria-labelledby="share-form-title">
            <div className={styles.contactPanelIntro}>
              <p className={styles.contactEyebrow}>Propuesta revisable</p>
              <h2 id="share-form-title">Comparte una idea para Trawel</h2>
              <p>
                Tu propuesta entra en una cola privada de revisión. Puede ayudarnos a priorizar
                destinos, experiencias o correcciones, pero no se publica automáticamente.
              </p>
            </div>

            <form className={styles.contactForm} onSubmit={handleShareFormSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="shareName"
                    autoComplete="name"
                    value={shareFormValues.name}
                    onChange={(event) => handleShareFormChange('name', event.target.value)}
                    required
                    maxLength={160}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Email</span>
                  <input
                    type="email"
                    name="shareEmail"
                    autoComplete="email"
                    value={shareFormValues.email}
                    onChange={(event) => handleShareFormChange('email', event.target.value)}
                    required
                    maxLength={320}
                  />
                </label>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>País o destino sugerido</span>
                  <input
                    type="text"
                    name="suggestedPlace"
                    value={shareFormValues.suggestedPlace}
                    onChange={(event) => handleShareFormChange('suggestedPlace', event.target.value)}
                    required
                    maxLength={180}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Tipo de propuesta</span>
                  <select
                    name="proposalType"
                    value={shareFormValues.proposalType}
                    onChange={(event) =>
                      handleShareFormChange('proposalType', event.target.value as CommunityProposalType)
                    }
                    required
                  >
                    <option value="experiencia">Experiencia</option>
                    <option value="destino">Destino</option>
                    <option value="colaboracion">Colaboración</option>
                    <option value="correccion">Corrección</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>
              </div>

              <label className={styles.formField}>
                <span>Mensaje</span>
                <textarea
                  name="shareMessage"
                  value={shareFormValues.message}
                  onChange={(event) => handleShareFormChange('message', event.target.value)}
                  required
                  maxLength={5000}
                  rows={7}
                />
              </label>

              <label className={styles.privacyConsent}>
                <input
                  type="checkbox"
                  name="sharePrivacyAccepted"
                  checked={shareFormValues.privacyAccepted}
                  onChange={(event) => handleShareFormChange('privacyAccepted', event.target.checked)}
                  required
                />
                <span>
                  Acepto que Trawel use estos datos para revisar esta propuesta privada.
                </span>
              </label>

              <div className={styles.formFooter}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={shareStatus === 'submitting'}
                >
                  {shareStatus === 'submitting' ? 'Enviando...' : 'Enviar propuesta'}
                </button>

                {shareStatusMessage && (
                  <p className={`${styles.formStatus} ${styles[shareStatus]}`} role="status">
                    {shareStatusMessage}
                  </p>
                )}
              </div>
            </form>
          </section>
        )}

        {content.sections.map((section) => (
          <article key={section.title} className={styles.section}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </article>
        ))}

        <div className={styles.actions}>
          {content.cta && (
            <Link to={content.cta.href} className={styles.primaryLink}>
              {content.cta.label}
            </Link>
          )}
          <Link to="/" className={styles.secondaryLink}>
            Volver a Trawel
          </Link>
        </div>
      </section>
    </main>
  );
}

function mapStaticPageToTrustPageContent(
  staticPage: StaticPage,
  fallbackContent: TrustPageContent
): TrustPageContent {
  const sections = getStaticPageSections(staticPage.body);

  return {
    ...fallbackContent,
    title: staticPage.title || fallbackContent.title,
    intro: staticPage.summary || fallbackContent.intro,
    sections: sections.length > 0 ? sections : fallbackContent.sections,
  };
}

function getStaticPageSections(body: Record<string, unknown>): TrustPageContent['sections'] {
  const sections = body.sections;

  if (!Array.isArray(sections)) {
    return [];
  }

  return sections
    .map((section) => {
      if (!section || typeof section !== 'object' || Array.isArray(section)) {
        return null;
      }

      const candidate = section as Record<string, unknown>;
      const title = asNonEmptyString(candidate.heading) || asNonEmptyString(candidate.title);
      const bodyText = asNonEmptyString(candidate.body) || asNonEmptyString(candidate.text);

      if (!title || !bodyText) {
        return null;
      }

      return {
        title,
        body: bodyText,
      };
    })
    .filter((section): section is TrustPageContent['sections'][number] => section !== null);
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
