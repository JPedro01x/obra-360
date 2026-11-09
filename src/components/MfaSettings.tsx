import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';

export function MfaSettings() {
  const [status, setStatus] = useState<{ disponivel: boolean; ativo: boolean }>();
  const [secret, setSecret] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  useEffect(() => {
    requestApi<typeof status>('/v1/workspace/mfa')
      .then(setStatus)
      .catch((e) => setMessage(e.message));
  }, []);
  const exit = () => {
    sessionStorage.removeItem('obra360_access_token');
    window.dispatchEvent(new Event('obra360:session-expired'));
  };
  return (
    <section>
      <h2>Autenticação em duas etapas</h2>
      {message && <p role="status">{message}</p>}
      {codes.length ? (
        <>
          <p>
            Proteção ativada. Guarde estes códigos em local seguro. Cada código funciona uma única
            vez e só será exibido agora. Suas sessões anteriores foram encerradas.
          </p>
          <pre style={{ userSelect: 'all' }}>{codes.join('\n')}</pre>
          <button onClick={exit}>Já guardei os códigos; entrar novamente</button>
        </>
      ) : (
        status && (
          <>
            <p>
              {status.ativo
                ? 'Ativa. Informe sua senha e um código para desativar.'
                : status.disponivel
                  ? 'Use um aplicativo compatível com TOTP. Você precisará dele para entrar após a ativação.'
                  : 'O responsável pelo servidor precisa configurar a chave de criptografia para habilitar este recurso.'}
            </p>
            {(status.disponivel || status.ativo) && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setMessage('');
                  try {
                    const path = status.ativo ? 'desativar' : secret ? 'ativar' : 'preparar';
                    const result = await requestApi<{
                      segredo?: string;
                      codigosRecuperacao?: string[];
                    }>(`/v1/workspace/mfa/${path}`, {
                      method: 'POST',
                      body: JSON.stringify({ senha: password, codigo: code }),
                    });
                    if (status.ativo) exit();
                    else if (result.segredo) {
                      setSecret(result.segredo);
                      setCode('');
                    } else if (result.codigosRecuperacao) {
                      setCodes(result.codigosRecuperacao);
                      setPassword('');
                      setSecret('');
                      setCode('');
                    }
                  } catch (e) {
                    setMessage((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Senha atual
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={200}
                  />
                </label>
                {secret && (
                  <p>
                    Adicione uma conta Obra360 no aplicativo, escolha chave manual, tempo de 30
                    segundos e 6 dígitos. Chave: <code style={{ userSelect: 'all' }}>{secret}</code>
                    . A configuração expira em 10 minutos.
                  </p>
                )}
                {(status.ativo || secret) && (
                  <label>
                    Código do autenticador ou de recuperação
                    <input
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.trim())}
                      required
                      maxLength={64}
                    />
                  </label>
                )}
                <button disabled={busy} type="submit">
                  {status.ativo
                    ? 'Desativar e sair'
                    : secret
                      ? 'Confirmar ativação'
                      : 'Configurar autenticador'}
                </button>
              </form>
            )}
          </>
        )
      )}
    </section>
  );
}
