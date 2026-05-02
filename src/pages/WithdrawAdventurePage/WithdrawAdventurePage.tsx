/**
 * Purpose: Let travelers withdraw pending adventure submissions with a private token.
 * Scope: Public route that calls the withdraw-traveler-adventure Edge Function; no auth or moderation UI.
 * Decisions: Accept token from query string or manual input and show friendly status messages.
 * Limitations: Only pending adventures can be withdrawn; lost tokens require manual support later.
 * Recent changes: Initial withdrawal page for traveler adventure submissions.
 */

import { type FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { withdrawTravelerAdventure } from '../../features/adventures';
import styles from './WithdrawAdventurePage.module.css';

type WithdrawalState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function WithdrawAdventurePage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [withdrawalState, setWithdrawalState] = useState<WithdrawalState>({ status: 'idle' });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token.trim()) {
      setWithdrawalState({
        status: 'error',
        message: 'Introduce el código o usa el enlace de retirada completo.',
      });
      return;
    }

    setWithdrawalState({ status: 'submitting' });
    const result = await withdrawTravelerAdventure(token);

    if (!result.success) {
      setWithdrawalState({ status: 'error', message: result.error });
      return;
    }

    setToken('');
    setWithdrawalState({ status: 'success', message: result.message });
  };

  const isSubmitting = withdrawalState.status === 'submitting';

  return (
    <main className={styles.container}>
      <section className={styles.panel} aria-labelledby="withdraw-adventure-title">
        <p className={styles.kicker}>Aventuras de viajeros</p>
        <h1 id="withdraw-adventure-title" className={styles.title}>
          Retirar una aventura pendiente
        </h1>
        <p className={styles.intro}>
          Si enviaste una aventura y todavía está pendiente de revisión, puedes retirarla con el
          código privado que apareció tras enviarla.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Código privado de retirada</span>
            <input
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                if (withdrawalState.status !== 'submitting') {
                  setWithdrawalState({ status: 'idle' });
                }
              }}
              type="text"
              name="token"
              autoComplete="off"
              disabled={isSubmitting}
            />
          </label>

          {withdrawalState.status === 'success' && (
            <p className={styles.success} role="status">
              {withdrawalState.message}
            </p>
          )}

          {withdrawalState.status === 'error' && (
            <p className={styles.error} role="alert">
              {withdrawalState.message}
            </p>
          )}

          <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Retirando...' : 'Retirar aventura pendiente'}
          </button>
        </form>

        <p className={styles.note}>
          Este enlace solo funciona mientras la aventura siga en estado pendiente. Si ya fue
          aprobada, rechazada o retirada, hará falta contactar con Trawel.
        </p>

        <Link to="/" className={styles.backLink}>
          Volver a Trawel
        </Link>
      </section>
    </main>
  );
}
