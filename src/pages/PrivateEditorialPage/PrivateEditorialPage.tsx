import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import {
  getPrivateEditorialDrafts,
  type PrivateEditorialDraft,
  type PrivateEditorialMode,
  type PrivateEditorialReaderData,
} from '../../features/privateEditorial';
import styles from './PrivateEditorialPage.module.css';

const CUENCA_LOCATION_ID = 'acbe38e5-bf4a-488f-bd65-782b996ece38';

type PageState = 'checking-session' | 'signed-out' | 'loading' | 'ready' | 'forbidden' | 'error';

export function PrivateEditorialPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [pageState, setPageState] = useState<PageState>('checking-session');
  const [readerData, setReaderData] = useState<PrivateEditorialReaderData | null>(null);
  const [mode, setMode] = useState<PrivateEditorialMode>('adventure');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setPageState('error');
      return;
    }

    let isCurrent = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (isCurrent) {
        setSession(data.session);
        setPageState(data.session ? 'loading' : 'signed-out');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isCurrent) {
        return;
      }
      setSession(nextSession);
      setReaderData(null);
      setPageState(nextSession ? 'loading' : 'signed-out');
    });

    return () => {
      isCurrent = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let isCurrent = true;
    setPageState('loading');
    void getPrivateEditorialDrafts(CUENCA_LOCATION_ID)
      .then((data) => {
        if (!isCurrent) {
          return;
        }
        setReaderData(data);
        setMode(data.drafts.some((draft) => draft.mode === 'adventure') ? 'adventure' : 'student');
        setPageState('ready');
      })
      .catch(() => {
        if (isCurrent) {
          setPageState('forbidden');
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [session]);

  const selectedDraft = useMemo(
    () => readerData?.drafts.find((draft) => draft.mode === mode) ?? null,
    [mode, readerData]
  );

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    setIsSigningIn(true);
    setSignInError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSigningIn(false);

    if (error) {
      setSignInError('No se pudo iniciar sesión. Revisa tus credenciales.');
    }
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
  };

  if (!isSupabaseConfigured()) {
    return <PrivateReaderNotice title="Lector privado no configurado" detail="Falta la configuración de Supabase." />;
  }

  if (pageState === 'checking-session' || pageState === 'loading') {
    return <PrivateReaderNotice title="Comprobando acceso editorial" detail="Validando sesión y permisos privados…" />;
  }

  if (pageState === 'signed-out') {
    return (
      <section className={styles.page} aria-labelledby="private-reader-sign-in-title">
        <div className={styles.signInCard}>
          <p className={styles.eyebrow}>Área editorial privada</p>
          <h1 id="private-reader-sign-in-title">Cuenca · borradores sin publicar</h1>
          <p>Inicia sesión con una cuenta editorial autorizada para leer estos borradores.</p>
          <form className={styles.signInForm} onSubmit={handleSignIn}>
            <label>
              Correo
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {signInError && <p className={styles.formError} role="alert">{signInError}</p>}
            <button type="submit" disabled={isSigningIn}>
              {isSigningIn ? 'Entrando…' : 'Entrar al lector privado'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (pageState === 'forbidden') {
    return (
      <PrivateReaderNotice
        title="Acceso editorial no autorizado"
        detail="Esta cuenta no puede leer borradores. Solicita el rol editor o admin a quien gestione Trawel."
        onSignOut={handleSignOut}
      />
    );
  }

  if (pageState === 'error' || !readerData || !selectedDraft) {
    return <PrivateReaderNotice title="Lector privado no disponible" detail="No se pudo cargar el contenido privado." />;
  }

  return (
    <section className={styles.page} aria-labelledby="private-reader-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Área editorial privada · {readerData.role}</p>
          <h1 id="private-reader-title">{readerData.destination.name}, {readerData.destination.countrySlug === 'espana' ? 'España' : readerData.destination.countrySlug}</h1>
          {readerData.destination.region && <p className={styles.region}>{readerData.destination.region}</p>}
        </div>
        <div className={styles.headerActions}>
          <span className={styles.draftBadge}>DRAFT / UNPUBLISHED</span>
          <button type="button" className={styles.signOutButton} onClick={handleSignOut}>Salir</button>
        </div>
      </header>

      <div className={styles.modeTabs} role="tablist" aria-label="Perfil editorial">
        {(['adventure', 'student'] as const).map((candidateMode) => {
          const available = readerData.drafts.some((draft) => draft.mode === candidateMode);
          return (
            <button
              key={candidateMode}
              type="button"
              role="tab"
              aria-selected={mode === candidateMode}
              disabled={!available}
              className={mode === candidateMode ? styles.activeTab : styles.tab}
              onClick={() => setMode(candidateMode)}
            >
              {candidateMode === 'adventure' ? 'Adventure' : 'Student'}
            </button>
          );
        })}
      </div>

      <DraftArticle draft={selectedDraft} />
    </section>
  );
}

function DraftArticle({ draft }: { draft: PrivateEditorialDraft }) {
  const traceability = getTraceability(draft.metadata);

  return (
    <article className={styles.article} aria-label={`${draft.mode} draft`}>
      <div className={styles.articleStatus}>
        <span>{draft.mode === 'adventure' ? 'Adventure' : 'Student'}</span>
        <span>Estado: {draft.status}</span>
        <span>Publicación: no</span>
      </div>
      <h2>{draft.headline}</h2>
      <TextBlock value={draft.intro} />
      <ContentSection title="Lo que hace especial" value={draft.whatMakesSpecial} />
      <ListSection title="Destacados" values={draft.highlights} />
      <ContentSection title="Contenido principal" value={draft.suggestedRoute} />
      <ListSection title="Notas y límites" values={draft.practicalTips} />
      {draft.sections
        .slice()
        .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
        .map((section, index) => (
          <ContentSection
            key={`${section.heading ?? 'section'}-${index}`}
            title={section.heading ?? 'Información editorial'}
            value={section.content ?? null}
          />
        ))}
      <TraceabilityPanel draftId={draft.id} values={traceability} />
      <Sources sources={draft.sources} />
    </article>
  );
}

function ContentSection({ title, value }: { title: string; value: string | null }) {
  if (!value?.trim()) {
    return null;
  }
  return (
    <section className={styles.contentSection}>
      <h3>{title}</h3>
      <TextBlock value={value} />
    </section>
  );
}

function ListSection({ title, values }: { title: string; values: unknown[] }) {
  const textValues = values.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));
  if (textValues.length === 0) {
    return null;
  }
  return (
    <section className={styles.contentSection}>
      <h3>{title}</h3>
      <ul>
        {textValues.map((value, index) => <li key={index}>{value}</li>)}
      </ul>
    </section>
  );
}

function TextBlock({ value }: { value: string | null }) {
  if (!value?.trim()) {
    return null;
  }
  return <p className={styles.prose}>{value}</p>;
}

function TraceabilityPanel({ draftId, values }: { draftId: string; values: Array<[string, string | null]> }) {
  return (
    <details className={styles.traceability}>
      <summary>Trazabilidad editorial</summary>
      <dl>
        <div><dt>Draft</dt><dd>{draftId}</dd></div>
        {values.filter(([, value]) => value).map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
    </details>
  );
}

function Sources({ sources }: { sources: PrivateEditorialDraft['sources'] }) {
  const usableSources = sources.filter((source) => source.title || source.url);
  if (usableSources.length === 0) {
    return null;
  }
  return (
    <section className={styles.contentSection}>
      <h3>Fuentes del expediente</h3>
      <ul className={styles.sources}>
        {usableSources.map((source, index) => (
          <li key={`${source.url ?? source.title ?? 'source'}-${index}`}>
            {source.url ? (
              <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a>
            ) : source.title}
            {source.publisher ? ` · ${source.publisher}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}

function getTraceability(metadata: Record<string, unknown>): Array<[string, string | null]> {
  const ingress = objectAt(metadata, 'ingress');
  const provenance = objectAt(metadata, 'provenance');
  const approval = objectAt(metadata, 'approval');
  const profileMetadata = objectAt(metadata, 'profile_metadata');
  const investighost = objectAt(profileMetadata, 'investighost');
  const currentApproved = objectAt(investighost, 'currentApproved');

  return [
    ['Library entry', textAt(ingress, 'library_entry_id') ?? textAt(investighost, 'libraryEntryId')],
    ['Version', textAt(provenance, 'versionId') ?? textAt(currentApproved, 'versionId')],
    ['Revision', textAt(provenance, 'revisionId') ?? textAt(currentApproved, 'revisionId')],
    ['Approval decision', textAt(approval, 'decisionId') ?? textAt(currentApproved, 'approvalDecisionId')],
    ['Mapping', textAt(ingress, 'mapping_id')],
    ['Canonical destination', textAt(ingress, 'canonical_destination_id')],
  ];
}

function objectAt(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const candidate = value[key];
  return candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate as Record<string, unknown>
    : {};
}

function textAt(value: Record<string, unknown>, key: string): string | null {
  const candidate = value[key];
  return typeof candidate === 'string' && candidate.trim() ? candidate : null;
}

function PrivateReaderNotice({
  title,
  detail,
  onSignOut,
}: {
  title: string;
  detail: string;
  onSignOut?: () => Promise<void>;
}) {
  return (
    <section className={styles.page}>
      <div className={styles.notice}>
        <p className={styles.eyebrow}>Área editorial privada</p>
        <h1>{title}</h1>
        <p>{detail}</p>
        {onSignOut && <button type="button" onClick={() => void onSignOut()}>Cerrar sesión</button>}
      </div>
    </section>
  );
}
