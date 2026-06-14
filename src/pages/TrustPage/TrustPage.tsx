import { Link } from 'react-router-dom';
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

export function TrustPage({ page }: TrustPageProps) {
  const content = trustPages[page];

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
