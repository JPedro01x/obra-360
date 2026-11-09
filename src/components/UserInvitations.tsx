import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
type Invitation = {
  id: string;
  email: string;
  perfil: string;
  expiraEm: string;
  usado: boolean;
  revogado: boolean;
};
const roles = [
  'ENGENHEIRO',
  'ARQUITETO',
  'RH',
  'GERENTE_OBRA',
  'MESTRE_OBRA',
  'ALMOXARIFE',
  'FINANCEIRO',
  'AUDITOR',
  'INCORPORADOR',
  'CLIENTE',
  'FORNECEDOR',
  'CORRETOR',
  'LOCADOR_MAQUINAS',
  'INVESTIDOR',
  'SUPER_ADMIN',
];
export function UserInvitations() {
  const [items, setItems] = useState<Invitation[]>([]),
    [link, setLink] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const load = () => requestApi<Invitation[]>('/v1/workspace/convites').then(setItems);
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  return (
    <section>
      <h2>Convidar usuários</h2>
      <p>
        O convidado define a própria senha. O convite vale por 48 horas, é de uso único e deve ser
        compartilhado por um canal privado.
      </p>
      {message && <p role="status">{message}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const values = new FormData(form);
          setBusy(true);
          setMessage('');
          setLink('');
          try {
            const result = await requestApi<{ token: string }>('/v1/workspace/convites', {
              method: 'POST',
              body: JSON.stringify(Object.fromEntries(values)),
            });
            setLink(`${location.origin}${location.pathname}#convite=${result.token}`);
            form.reset();
            await load();
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          E-mail do convidado
          <input type="email" name="email" maxLength={120} required />
        </label>
        <label>
          Perfil
          <select aria-label="Perfil" name="perfil">
            {roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <button disabled={busy}>Gerar convite</button>
      </form>
      {link && (
        <label>
          Link privado (exibido apenas agora)
          <input
            aria-label="Link privado (exibido apenas agora)"
            readOnly
            value={link}
            onFocus={(e) => e.target.select()}
          />
          <button onClick={() => setLink('')}>Ocultar link</button>
        </label>
      )}
      <ul>
        {items.map((i) => (
          <li key={i.id}>
            {i.email} · {i.perfil} ·{' '}
            {i.usado
              ? 'Aceito'
              : i.revogado
                ? 'Revogado'
                : new Date(i.expiraEm).getTime() < Date.now()
                  ? 'Expirado'
                  : 'Pendente'}{' '}
            {!i.usado && !i.revogado && (
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await requestApi(`/v1/workspace/convites/${i.id}`, { method: 'DELETE' });
                    await load();
                  } catch (e) {
                    setMessage((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Revogar convite
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
export function AcceptInvitation({ token, onDone }: { token: string; onDone: () => void }) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    history.replaceState(null, '', location.pathname + location.search);
  }, []);
  return (
    <main className="ws ws-setup">
      <section className="ws-setup-card">
        <h1>Aceitar convite Obra360</h1>
        <p>O perfil e a empresa foram definidos pelo administrador que emitiu o convite.</p>
        {message && <p role="alert">{message}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            if (data.get('senha') !== data.get('confirmacao')) {
              setMessage('As senhas não coincidem.');
              return;
            }
            setBusy(true);
            try {
              await requestApi('/v1/auth/aceitar-convite', {
                method: 'POST',
                body: JSON.stringify({ token, nome: data.get('nome'), senha: data.get('senha') }),
              });
              onDone();
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Seu nome
            <input name="nome" required maxLength={100} autoComplete="name" />
          </label>
          <label>
            Nova senha
            <input
              name="senha"
              type="password"
              required
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmar senha
            <input
              name="confirmacao"
              type="password"
              required
              minLength={12}
              maxLength={72}
              autoComplete="new-password"
            />
          </label>
          <button disabled={busy}>Criar meu acesso</button>
        </form>
        <button onClick={onDone}>Voltar ao acesso</button>
      </section>
    </main>
  );
}
