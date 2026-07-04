import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  submitCommunitySuggestion,
  submitContactMessage,
} from '../../features/travelData/productContent/userMessageQueue.service';
import {
  getPublicCountryOptions,
  getPublicZoneOptionsByCountrySlug,
  type PublicCountryOption,
  type PublicZoneOption,
} from '../../features/travelData/productContent/publicLocationOptions.service';
import {
  formatBytes,
  getPresetForContributionType,
  standardizeImageFile,
  type StandardizedImageResult,
} from '../../features/travelData/productContent/imageStandardization.service';
import {
  submitContentReport,
  type ContentReportInputType,
} from '../../features/travelData/productContent/contentReportQueue.service';
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
type LocationOptionsStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
type SharePhotoStatus = 'idle' | 'processing' | 'error';
type CommunityContributionType =
  | 'experiencia_aventura'
  | 'foto_encabezado'
  | 'foto_ciudad_zona'
  | 'sugerencia_destino'
  | 'correccion'
  | 'otro';

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
  countrySlug: string;
  zoneSlug: string;
  contributionType: CommunityContributionType;
  message: string;
  privacyAccepted: boolean;
}

const initialShareFormValues: ShareFormValues = {
  name: '',
  email: '',
  countrySlug: '',
  zoneSlug: '',
  contributionType: 'experiencia_aventura',
  message: '',
  privacyAccepted: false,
};

const communityContributionLabels: Record<CommunityContributionType, string> = {
  experiencia_aventura: 'Experiencia / aventura',
  foto_encabezado: 'Foto de encabezado',
  foto_ciudad_zona: 'Foto de ciudad/zona',
  sugerencia_destino: 'Sugerencia de destino',
  correccion: 'Corrección',
  otro: 'Otro',
};

interface SharePhotoItem {
  id: string;
  originalFile: File;
  previewUrl: string;
  result: StandardizedImageResult;
  presetLabel: string;
}

const MAX_SHARE_PHOTOS = 3;
const SHARE_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

interface ReportFormValues {
  name: string;
  email: string;
  reportType: ContentReportInputType;
  message: string;
}

const initialReportFormValues: ReportFormValues = {
  name: '',
  email: '',
  reportType: 'content_error',
  message: '',
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
  const [countryOptions, setCountryOptions] = useState<PublicCountryOption[]>([]);
  const [zoneOptions, setZoneOptions] = useState<PublicZoneOption[]>([]);
  const [countryOptionsStatus, setCountryOptionsStatus] = useState<LocationOptionsStatus>('idle');
  const [zoneOptionsStatus, setZoneOptionsStatus] = useState<LocationOptionsStatus>('idle');
  const [sharePhotos, setSharePhotos] = useState<SharePhotoItem[]>([]);
  const [sharePhotoStatus, setSharePhotoStatus] = useState<SharePhotoStatus>('idle');
  const [sharePhotoStatusMessage, setSharePhotoStatusMessage] = useState('');
  const sharePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const sharePhotosRef = useRef<SharePhotoItem[]>([]);
  const [reportFormValues, setReportFormValues] = useState<ReportFormValues>(initialReportFormValues);
  const [reportStatus, setReportStatus] = useState<ContactFormStatus>('idle');
  const [reportStatusMessage, setReportStatusMessage] = useState('');

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
  const selectedCountry = countryOptions.find(
    (country) => country.value === shareFormValues.countrySlug
  );
  const selectedZone = zoneOptions.find((zone) => zone.value === shareFormValues.zoneSlug);

  useEffect(() => {
    let isCurrent = true;

    if (!isSharePage) {
      return () => {
        isCurrent = false;
      };
    }

    setCountryOptionsStatus('loading');
    setCountryOptions([]);
    setZoneOptions([]);
    setZoneOptionsStatus('idle');

    getPublicCountryOptions()
      .then((options) => {
        if (!isCurrent) {
          return;
        }

        setCountryOptions(options);
        setCountryOptionsStatus(options.length > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setCountryOptions([]);
        setCountryOptionsStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [isSharePage]);

  useEffect(() => {
    let isCurrent = true;
    const countrySlug = shareFormValues.countrySlug;

    setZoneOptions([]);
    setZoneOptionsStatus(countrySlug ? 'loading' : 'idle');

    if (!isSharePage || !countrySlug) {
      return () => {
        isCurrent = false;
      };
    }

    getPublicZoneOptionsByCountrySlug(countrySlug)
      .then((options) => {
        if (!isCurrent) {
          return;
        }

        setZoneOptions(options);
        setZoneOptionsStatus(options.length > 0 ? 'ready' : 'empty');
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setZoneOptions([]);
        setZoneOptionsStatus('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [isSharePage, shareFormValues.countrySlug]);

  useEffect(() => {
    sharePhotosRef.current = sharePhotos;
  }, [sharePhotos]);

  useEffect(() => {
    return () => {
      sharePhotosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

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

  const handleShareContributionTypeChange = async (contributionType: CommunityContributionType) => {
    setShareFormValues((currentValues) => ({
      ...currentValues,
      contributionType,
    }));

    if (shareStatus !== 'submitting') {
      setShareStatus('idle');
      setShareStatusMessage('');
    }

    if (sharePhotos.length === 0) {
      return;
    }

    await restandardizeSharePhotos(contributionType);
  };

  const handleShareCountryChange = (countrySlug: string) => {
    setShareFormValues((currentValues) => ({
      ...currentValues,
      countrySlug,
      zoneSlug: '',
    }));

    if (shareStatus !== 'submitting') {
      setShareStatus('idle');
      setShareStatusMessage('');
    }
  };

  const handleSharePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (sharePhotoInputRef.current) {
      sharePhotoInputRef.current.value = '';
    }

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length + sharePhotos.length > MAX_SHARE_PHOTOS) {
      setSharePhotoStatus('error');
      setSharePhotoStatusMessage('Puedes adjuntar un máximo de 3 fotos por envío.');
      return;
    }

    setSharePhotoStatus('processing');
    setSharePhotoStatusMessage('Adaptando fotos a formato web...');

    try {
      const processedPhotos = await Promise.all(
        selectedFiles.map((file) => standardizeSharePhoto(file, shareFormValues.contributionType))
      );

      setSharePhotos((currentPhotos) => [...currentPhotos, ...processedPhotos]);
      setSharePhotoStatus('idle');
      setSharePhotoStatusMessage('');
    } catch (error) {
      setSharePhotoStatus('error');
      setSharePhotoStatusMessage(
        error instanceof Error
          ? error.message
          : 'No hemos podido adaptar una de las fotos. Prueba con JPG, PNG o WebP.'
      );
    }
  };

  const handleRemoveSharePhoto = (photoId: string) => {
    setSharePhotos((currentPhotos) => {
      const removedPhoto = currentPhotos.find((photo) => photo.id === photoId);

      if (removedPhoto) {
        URL.revokeObjectURL(removedPhoto.previewUrl);
      }

      return currentPhotos.filter((photo) => photo.id !== photoId);
    });

    if (sharePhotoStatus !== 'processing') {
      setSharePhotoStatus('idle');
      setSharePhotoStatusMessage('');
    }
  };

  const restandardizeSharePhotos = async (contributionType: CommunityContributionType) => {
    setSharePhotoStatus('processing');
    setSharePhotoStatusMessage('Actualizando el formato de las fotos...');

    try {
      const processedPhotos = await Promise.all(
        sharePhotos.map((photo) => standardizeSharePhoto(photo.originalFile, contributionType))
      );

      setSharePhotos((currentPhotos) => {
        currentPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
        return processedPhotos;
      });
      setSharePhotoStatus('idle');
      setSharePhotoStatusMessage('');
    } catch (error) {
      setSharePhotoStatus('error');
      setSharePhotoStatusMessage(
        error instanceof Error
          ? error.message
          : 'No hemos podido actualizar el formato de las fotos.'
      );
    }
  };

  const handleShareFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (shareStatus === 'submitting') {
      return;
    }

    setShareStatus('submitting');
    setShareStatusMessage('Enviando tu propuesta...');

    const countrySlug = shareFormValues.countrySlug.trim();
    const zoneSlug = shareFormValues.zoneSlug.trim();

    if (!countrySlug) {
      setShareStatus('error');
      setShareStatusMessage('Elige el país relacionado con la colaboración.');
      return;
    }

    if (!zoneSlug) {
      setShareStatus('error');
      setShareStatusMessage('Elige la zona relacionada con la colaboración.');
      return;
    }

    const contributionLabel = communityContributionLabels[shareFormValues.contributionType];
    const countryLabel = selectedCountry?.label || countrySlug;
    const zoneLabel = selectedZone?.label || zoneSlug;
    const result = await submitCommunitySuggestion({
      name: shareFormValues.name,
      email: shareFormValues.email,
      subject: `${contributionLabel}: ${countryLabel} / ${zoneLabel}`,
      message: shareFormValues.message,
      sourcePage: 'compartir',
      countrySlug,
      zoneSlug,
      entityType: 'zone',
      entitySlug: zoneSlug,
      privacyAccepted: shareFormValues.privacyAccepted,
      metadata: {
        source: 'trust_page_share_form',
        country_slug: countrySlug,
        zone_slug: zoneSlug,
        contribution_type: shareFormValues.contributionType,
        photo_count: sharePhotos.length,
        photo_standardization: sharePhotos.length > 0,
        photo_upload_pending: sharePhotos.length > 0,
      },
    });

    if (result.ok) {
      setShareFormValues(initialShareFormValues);
      setSharePhotos((currentPhotos) => {
        currentPhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
        return [];
      });
      setShareStatus('success');
      setShareStatusMessage(
        sharePhotos.length > 0
          ? 'Propuesta recibida para revisión. Tus fotos quedan marcadas como parte de la colaboración y nada se publicará automáticamente.'
          : 'Propuesta recibida para revisión. No se publicará automáticamente.'
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

  const handleReportFormChange = <Field extends keyof ReportFormValues>(
    field: Field,
    value: ReportFormValues[Field]
  ) => {
    setReportFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    if (reportStatus !== 'submitting') {
      setReportStatus('idle');
      setReportStatusMessage('');
    }
  };

  const handleReportFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (reportStatus === 'submitting') {
      return;
    }

    setReportStatus('submitting');
    setReportStatusMessage('Enviando reporte...');

    const result = await submitContentReport({
      reportType: reportFormValues.reportType,
      reporterName: reportFormValues.name,
      reporterEmail: reportFormValues.email,
      targetEntityType: 'static_page',
      targetEntitySlug: page,
      message: reportFormValues.message,
    });

    if (result.ok) {
      setReportFormValues(initialReportFormValues);
      setReportStatus('success');
      setReportStatusMessage(
        'Reporte recibido para revisión. No se publicará automáticamente.'
      );
      return;
    }

    setReportStatus('error');
    setReportStatusMessage(
      result.status === 'validation_error'
        ? result.message
        : 'No hemos podido enviar el reporte ahora mismo. Puedes intentarlo de nuevo en unos minutos.'
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
                  <span>País</span>
                  <select
                    name="shareCountry"
                    value={shareFormValues.countrySlug}
                    onChange={(event) => handleShareCountryChange(event.target.value)}
                    disabled={countryOptionsStatus === 'loading' || countryOptions.length === 0}
                    required
                  >
                    <option value="">
                      {countryOptionsStatus === 'loading' ? 'Cargando países...' : 'Elige un país'}
                    </option>
                    {countryOptions.map((country) => (
                      <option key={country.id} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.formField}>
                  <span>Zona</span>
                  <select
                    name="shareZone"
                    value={shareFormValues.zoneSlug}
                    onChange={(event) => handleShareFormChange('zoneSlug', event.target.value)}
                    disabled={
                      !shareFormValues.countrySlug ||
                      zoneOptionsStatus === 'loading' ||
                      zoneOptions.length === 0
                    }
                    required
                  >
                    <option value="">
                      {zoneOptionsStatus === 'loading' ? 'Cargando zonas...' : 'Elige una zona'}
                    </option>
                    {zoneOptions.map((zone) => (
                      <option key={zone.id} value={zone.value}>
                        {zone.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {(countryOptionsStatus === 'empty' || countryOptionsStatus === 'error') && (
                <p className={styles.formHint} role="status">
                  No hemos podido cargar la lista de países ahora mismo. Puedes intentarlo de nuevo
                  en unos minutos.
                </p>
              )}

              {shareFormValues.countrySlug &&
                (zoneOptionsStatus === 'empty' || zoneOptionsStatus === 'error') && (
                  <p className={styles.formHint} role="status">
                    No hay zonas disponibles para ese país todavía. La colaboración queda pendiente
                    hasta que exista una zona seleccionable.
                  </p>
                )}

              <label className={styles.formField}>
                <span>Tipo de colaboración</span>
                <select
                  name="contributionType"
                  value={shareFormValues.contributionType}
                  onChange={(event) =>
                    handleShareContributionTypeChange(
                      event.target.value as CommunityContributionType
                    )
                  }
                  required
                >
                  <option value="experiencia_aventura">Experiencia / aventura</option>
                  <option value="foto_encabezado">Foto de encabezado</option>
                  <option value="foto_ciudad_zona">Foto de ciudad/zona</option>
                  <option value="sugerencia_destino">Sugerencia de destino</option>
                  <option value="correccion">Corrección</option>
                  <option value="otro">Otro</option>
                </select>
              </label>

              <section className={styles.photoUploadBox} aria-labelledby="share-photo-title">
                <div className={styles.photoUploadHeader}>
                  <div>
                    <h3 id="share-photo-title">Fotos opcionales</h3>
                    <p>
                      Trawel adaptará tus fotos a formato web para que carguen rápido y mantengan
                      buena calidad.
                    </p>
                  </div>
                  <span>{sharePhotos.length}/{MAX_SHARE_PHOTOS}</span>
                </div>

                <label className={styles.photoInputLabel}>
                  <span>Seleccionar fotos</span>
                  <input
                    ref={sharePhotoInputRef}
                    type="file"
                    name="sharePhotos"
                    accept={SHARE_PHOTO_ACCEPT}
                    multiple
                    onChange={handleSharePhotoChange}
                    disabled={
                      sharePhotoStatus === 'processing' ||
                      sharePhotos.length >= MAX_SHARE_PHOTOS
                    }
                  />
                </label>

                {sharePhotoStatusMessage && (
                  <p
                    className={`${styles.formStatus} ${styles[sharePhotoStatus]}`}
                    role="status"
                  >
                    {sharePhotoStatusMessage}
                  </p>
                )}

                {sharePhotos.length > 0 && (
                  <div className={styles.photoPreviewGrid}>
                    {sharePhotos.map((photo) => (
                      <article key={photo.id} className={styles.photoPreviewCard}>
                        <img src={photo.previewUrl} alt="" />
                        <div className={styles.photoPreviewInfo}>
                          <strong>{photo.result.fileName}</strong>
                          <span>{photo.result.width} x {photo.result.height}px</span>
                          <span>
                            Original: {formatBytes(photo.result.originalSize)} · Final:{' '}
                            {formatBytes(photo.result.outputSize)}
                          </span>
                          <span>Formato final: WebP · {photo.presetLabel}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.removePhotoButton}
                          onClick={() => handleRemoveSharePhoto(photo.id)}
                          disabled={sharePhotoStatus === 'processing'}
                        >
                          Quitar
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

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
                  disabled={
                    shareStatus === 'submitting' ||
                    sharePhotoStatus === 'processing' ||
                    countryOptionsStatus !== 'ready' ||
                    zoneOptionsStatus !== 'ready'
                  }
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

        <details className={styles.reportBox}>
          <summary>Reportar contenido</summary>
          <div className={styles.reportBody}>
            <p>
              Si ves un error, una imagen problemática o información que deba revisarse, puedes
              enviarlo a una cola privada de moderación.
            </p>

            <form className={styles.reportForm} onSubmit={handleReportFormSubmit}>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>Nombre</span>
                  <input
                    type="text"
                    name="reportName"
                    autoComplete="name"
                    value={reportFormValues.name}
                    onChange={(event) => handleReportFormChange('name', event.target.value)}
                    required
                    maxLength={160}
                  />
                </label>

                <label className={styles.formField}>
                  <span>Email</span>
                  <input
                    type="email"
                    name="reportEmail"
                    autoComplete="email"
                    value={reportFormValues.email}
                    onChange={(event) => handleReportFormChange('email', event.target.value)}
                    required
                    maxLength={320}
                  />
                </label>
              </div>

              <label className={styles.formField}>
                <span>Tipo de reporte</span>
                <select
                  name="reportType"
                  value={reportFormValues.reportType}
                  onChange={(event) =>
                    handleReportFormChange('reportType', event.target.value as ContentReportInputType)
                  }
                  required
                >
                  <option value="content_error">Error de contenido</option>
                  <option value="image_rights">Derechos de imagen</option>
                  <option value="removal_request">Solicitud de retirada</option>
                  <option value="inappropriate_content">Contenido inapropiado</option>
                  <option value="outdated_information">Información desactualizada</option>
                  <option value="other">Otro</option>
                </select>
              </label>

              <label className={styles.formField}>
                <span>Mensaje</span>
                <textarea
                  name="reportMessage"
                  value={reportFormValues.message}
                  onChange={(event) => handleReportFormChange('message', event.target.value)}
                  required
                  maxLength={5000}
                  rows={5}
                />
              </label>

              <div className={styles.formFooter}>
                <button
                  type="submit"
                  className={styles.reportSubmitButton}
                  disabled={reportStatus === 'submitting'}
                >
                  {reportStatus === 'submitting' ? 'Enviando...' : 'Enviar reporte'}
                </button>

                {reportStatusMessage && (
                  <p className={`${styles.formStatus} ${styles[reportStatus]}`} role="status">
                    {reportStatusMessage}
                  </p>
                )}
              </div>
            </form>
          </div>
        </details>
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

async function standardizeSharePhoto(
  file: File,
  contributionType: CommunityContributionType
): Promise<SharePhotoItem> {
  const preset = getPresetForContributionType(contributionType);
  const result = await standardizeImageFile(file, { preset });

  return {
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    originalFile: file,
    previewUrl: URL.createObjectURL(result.blob),
    result,
    presetLabel: preset.label,
  };
}
