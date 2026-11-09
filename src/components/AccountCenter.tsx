import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
import { MfaSettings } from './MfaSettings';
import { UserInvitations } from './UserInvitations';
import { LicenseUsage } from './LicenseUsage';
import { CompanyExport } from './CompanyExport';

type Session = { id: string; criadoEm: string; expiraEm: string; atual: boolean };
type Ticket = {
  id: number;
  categoria: string;
  assunto: string;
  descricao: string;
  status: string;
  resposta?: string;
  versao: number;
};

export function AccountCenter({ admin }: { admin: boolean }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const [s, t] = await Promise.all([
      requestApi<Session[]>('/v1/workspace/minhas-sessoes'),
      requestApi<Ticket[]>('/v1/workspace/atendimento'),
    ]);
    setSessions(s);
    setTickets(t);
  };
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try {
      await action();
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="ws-service-panel ws-account-center">
      <h1>Conta e atendimento</h1>
      {message && <p role="status">{message}</p>}
      <MfaSettings />
      {admin && <UserInvitations />}
      {admin && <LicenseUsage />}
      {admin && <CompanyExport />}
      <h2>Sessões ativas</h2>
      <p>Ao encerrar uma sessão, seu token deixa de funcionar imediatamente no servidor.</p>
      <ul>
        {sessions.map((s) => (
          <li key={s.id}>
            {s.atual ? 'Esta sessão' : 'Outra sessão'} · início{' '}
            {new Date(s.criadoEm).toLocaleString('pt-BR')} · expira{' '}
            {new Date(s.expiraEm).toLocaleString('pt-BR')}{' '}
            {!s.atual && (
              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await requestApi(`/v1/workspace/minhas-sessoes/${s.id}`, { method: 'DELETE' });
                  })
                }
              >
                Encerrar sessão
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        disabled={busy}
        onClick={() =>
          run(async () => {
            await requestApi('/v1/workspace/minhas-sessoes', { method: 'DELETE' });
            sessionStorage.removeItem('obra360_access_token');
            window.dispatchEvent(new Event('obra360:session-expired'));
          })
        }
      >
        Encerrar todas as sessões e sair
      </button>
      <h2>Suporte e privacidade</h2>
      <p>
        As solicitações são encaminhadas ao administrador da empresa neste sistema. Exclusão e
        cancelamento exigem análise; abrir um pedido não apaga registros nem cancela contratos
        automaticamente. Não informe senhas ou chaves.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const values = new FormData(form);
          run(async () => {
            await requestApi('/v1/workspace/atendimento', {
              method: 'POST',
              body: JSON.stringify(Object.fromEntries(values)),
            });
            form.reset();
            setMessage('Solicitação registrada. Acompanhe abaixo.');
          });
        }}
      >
        <label>
          Tipo
          <select name="categoria" required>
            <option value="SUPORTE">Suporte</option>
            <option value="PRIVACIDADE">Privacidade</option>
            <option value="EXPORTACAO">Exportação de dados</option>
            <option value="EXCLUSAO">Exclusão de dados</option>
            <option value="CANCELAMENTO">Cancelamento</option>
          </select>
        </label>
        <label>
          Assunto
          <input name="assunto" required maxLength={150} />
        </label>
        <label>
          Descrição
          <textarea name="descricao" required maxLength={4000} rows={4} />
        </label>
        <button disabled={busy} type="submit">
          Registrar solicitação
        </button>
      </form>
      <h2>{admin ? 'Solicitações da empresa' : 'Minhas solicitações'}</h2>
      {!tickets.length && <p>Nenhuma solicitação registrada.</p>}
      {tickets.map((t) => (
        <article key={t.id} className="ws-service-panel">
          <h3>
            #{t.id} · {t.assunto}
          </h3>
          <p>
            {t.categoria} · {t.status}
          </p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{t.descricao}</p>
          {t.resposta && (
            <p style={{ whiteSpace: 'pre-wrap' }}>
              <strong>Resposta:</strong> {t.resposta}
            </p>
          )}
          {admin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const values = new FormData(e.currentTarget);
                run(async () => {
                  await requestApi(`/v1/workspace/atendimento/${t.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ ...Object.fromEntries(values), versao: t.versao }),
                  });
                });
              }}
            >
              <label>
                Situação
                <select aria-label="Situação" name="status" defaultValue={t.status}>
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ANALISE">Em análise</option>
                  <option value="CONCLUIDO">Concluído</option>
                </select>
              </label>
              <label>
                Resposta
                <textarea
                  name="resposta"
                  defaultValue={t.resposta || ''}
                  required
                  maxLength={4000}
                />
              </label>
              <button disabled={busy} type="submit">
                Salvar resposta
              </button>
            </form>
          )}
        </article>
      ))}
    </div>
  );
}
