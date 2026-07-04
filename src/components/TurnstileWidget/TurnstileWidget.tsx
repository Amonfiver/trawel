import { useEffect, useRef, useState } from 'react';
import styles from './TurnstileWidget.module.css';

interface TurnstileWidgetProps {
  siteKey: string;
  resetSignal: number;
  onTokenChange: (token: string) => void;
  onError?: () => void;
}

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback': () => void;
      'error-callback': () => void;
    }
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

export function TurnstileWidget({
  siteKey,
  resetSignal,
  onTokenChange,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isCurrent = true;

    if (!siteKey) {
      setStatus('error');
      onTokenChange('');
      return;
    }

    setStatus('loading');

    loadTurnstileScript()
      .then(() => {
        if (!isCurrent || !containerRef.current || !window.turnstile) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            onTokenChange(token);
            setStatus('ready');
          },
          'expired-callback': () => {
            onTokenChange('');
            setStatus('ready');
          },
          'error-callback': () => {
            onTokenChange('');
            setStatus('error');
            onError?.();
          },
        });

        setStatus('ready');
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        onTokenChange('');
        setStatus('error');
        onError?.();
      });

    return () => {
      isCurrent = false;

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onError, onTokenChange, siteKey]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChange('');
      setStatus('ready');
    }
  }, [onTokenChange, resetSignal]);

  return (
    <div className={styles.turnstileBox}>
      <div ref={containerRef} className={styles.turnstileWidget} />
      {status === 'loading' && (
        <p className={styles.turnstileStatus}>Cargando verificación antiabuso...</p>
      )}
      {status === 'error' && (
        <p className={styles.turnstileError}>
          No hemos podido cargar la verificación antiabuso. Recarga la página antes de enviar.
        </p>
      )}
    </div>
  );
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}
