import React, { useEffect, useRef, useState } from 'react';
import { requestApi } from '../services/http';
import { useAppearance } from './Appearance';
let scriptPromise: Promise<void> | null = null;
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (settings: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, settings: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}
function loadGoogle() {
  if (window.google) return Promise.resolve();
  if (!scriptPromise)
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Não foi possível carregar o login Google.'));
      };
      document.head.appendChild(script);
    });
  return scriptPromise;
}
export function GoogleSignIn({
  clientId,
  link,
  onSuccess,
}: {
  clientId: string;
  link?: boolean;
  onSuccess: (token: string) => void;
}) {
  const { resolved } = useAppearance();
  const target = useRef<HTMLDivElement>(null),
    [error, setError] = useState('');
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  useEffect(() => {
    let current = true;
    let observer: ResizeObserver | undefined;
    loadGoogle()
      .then(async () => {
        if (!current) return;
        const { nonce } = await requestApi<{ nonce: string }>('/v1/auth/google/nonce');
        if (!current || !target.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce,
          auto_select: false,
          callback: async (result: { credential?: string }) => {
            if (!current || !result.credential) return;
            try {
              const value = await requestApi<{ token: string } | undefined>(
                link ? '/v1/workspace/google/vincular' : '/v1/auth/google',
                { method: 'POST', body: JSON.stringify({ credential: result.credential }) },
              );
              if (current) onSuccessRef.current(value?.token || '');
            } catch (e) {
              if (current) setError((e as Error).message);
            }
          },
        });
        const render = () => {
          if (!current || !target.current || !window.google) return;
          const width = Math.max(200, Math.min(360, Math.floor(target.current.clientWidth) || 300));
          target.current.replaceChildren();
          window.google.accounts.id.renderButton(target.current, {
            theme: resolved === 'light' ? 'outline' : 'filled_black',
            size: 'large',
            width,
          });
        };
        let width = -1;
        observer = new ResizeObserver(() => {
          const next = Math.floor(target.current?.clientWidth || 0);
          if (next !== width) {
            width = next;
            render();
          }
        });
        observer.observe(target.current);
        render();
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
      observer?.disconnect();
    };
  }, [clientId, link, resolved]);
  return (
    <div>
      <div ref={target} />
      {error && (
        <p className="ws-field-error" role="alert">
          {error}
        </p>
      )}
      {link && (
        <p className="ws-help">
          Use a conta Google com o mesmo e-mail do seu cadastro. A vinculação não altera seu perfil.
        </p>
      )}
    </div>
  );
}
export function PasswordRecoveryPanel({ token, onBack }: { token?: string; onBack: () => void }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [finished, setFinished] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (token && password !== confirm) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    try {
      await requestApi(token ? '/v1/auth/redefinir' : '/v1/auth/recuperar', {
        method: 'POST',
        body: JSON.stringify(token ? { token, senha: password } : { email: email.trim() }),
      });
      setMessage(
        token
          ? 'Senha redefinida. Entre com sua nova senha.'
          : 'Se existir uma conta ativa com esse e-mail, enviaremos um link de recuperação.',
      );
      setFinished(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="ws ws-setup">
      <section className="ws-setup-card">
        <h1>{token ? 'Redefinir senha' : 'Recuperar acesso'}</h1>
        {error && (
          <div className="ws-alert" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="ws-notice" role="status">
            {message}
          </div>
        )}
        {!finished && (
          <form onSubmit={submit}>
            {token ? (
              <>
                <label>
                  Nova senha (mínimo de 12 caracteres)
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  Confirme a nova senha
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                  />
                </label>
              </>
            ) : (
              <label>
                E-mail cadastrado
                <input
                  type="email"
                  required
                  value={email}
                  maxLength={120}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
            )}
            <button className="ws-primary" disabled={busy}>
              {busy ? 'Enviando…' : token ? 'Salvar nova senha' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}
        <button className="ws-secondary" onClick={onBack}>
          Voltar ao acesso
        </button>
      </section>
    </main>
  );
}
