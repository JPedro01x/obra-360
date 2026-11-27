import React, { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, RefreshCw, Send } from 'lucide-react';
import { requestApi } from '../services/http';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';

type Contact = { id: number; nome: string; perfil: string };
type Message = {
  id: number;
  remetenteId: number;
  destinatarioId: number;
  conteudo: string;
  lida: boolean;
  enviadaEm: string;
};

export function WorkspaceChat({ currentUserId }: { currentUserId: number }) {
  const workspaceRevision = useWorkspaceRefresh();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    requestApi<Contact[]>('/v1/workspace/chat/contatos', { signal: controller.signal })
      .then((rows) => {
        setContacts(rows);
        setSelected((current) => current ?? rows[0]?.id ?? null);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError((e as Error).message);
      });
    return () => controller.abort();
  }, [workspaceRevision]);

  useEffect(() => {
    if (selected === null) {
      setMessages([]);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError('');
    requestApi<Message[]>(`/v1/workspace/chat/mensagens?usuarioId=${selected}`, {
      signal: controller.signal,
    })
      .then(async (rows) => {
        if (controller.signal.aborted) return;
        setMessages(rows);
        await requestApi(`/v1/workspace/chat/conversas/${selected}/lidas`, { method: 'PATCH' });
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError((e as Error).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [selected, refresh, workspaceRevision]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (selected === null || !draft.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await requestApi<Message>('/v1/workspace/chat/mensagens', {
        method: 'POST',
        body: JSON.stringify({ destinatarioId: selected, conteudo: draft }),
      });
      setDraft('');
      setRefresh((value) => value + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const peer = contacts.find((contact) => contact.id === selected);
  return (
    <section className="ws-service-panel" aria-labelledby="workspace-chat-title">
      <div className="ws-title-row">
        <div>
          <p className="ws-eyebrow">COMUNICAÇÃO INTERNA</p>
          <h1 id="workspace-chat-title">Mensagens da equipe</h1>
          <p>Mensagens privadas entre contas ativas da sua empresa.</p>
        </div>
        <button className="ws-secondary" onClick={() => setRefresh((value) => value + 1)} disabled={busy}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>
      {error && <p className="ws-alert" role="alert">{error}</p>}
      <div className="ws-chat-layout">
        <aside className="ws-chat-contacts" aria-label="Contatos da empresa">
          {contacts.length ? contacts.map((contact) => (
            <button key={contact.id} className={contact.id === selected ? 'is-selected' : ''}
              onClick={() => setSelected(contact.id)} aria-current={contact.id === selected ? 'true' : undefined}>
              <MessageCircle size={16} />
              <span>{contact.nome}<small>{contact.perfil.replace(/_/g, ' ')}</small></span>
            </button>
          )) : <p className="ws-help">Nenhum outro usuário ativo nesta empresa.</p>}
        </aside>
        <div className="ws-chat-conversation" aria-label={peer ? `Conversa com ${peer.nome}` : 'Conversa'}>
          {peer ? <h2>{peer.nome}</h2> : <h2>Selecione uma pessoa</h2>}
          <div className="ws-chat-messages" aria-live="polite" aria-busy={busy}>
            {messages.length ? messages.map((message) => (
              <article key={message.id} className={message.remetenteId === currentUserId ? 'ws-chat-message own' : 'ws-chat-message'}>
                <p>{message.conteudo}</p>
                <small>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.enviadaEm))}</small>
              </article>
            )) : <p className="ws-empty">{busy ? 'Carregando conversa…' : 'Ainda não há mensagens nesta conversa.'}</p>}
          </div>
          <form className="ws-chat-compose" onSubmit={send}>
            <label className="sr-only" htmlFor="workspace-chat-draft">Mensagem</label>
            <textarea id="workspace-chat-draft" maxLength={4000} value={draft} onChange={(event) => setDraft(event.target.value)}
              placeholder="Escreva uma mensagem" disabled={!peer || busy} required />
            <button className="ws-primary" disabled={!peer || busy || !draft.trim()}><Send size={16} /> Enviar</button>
          </form>
        </div>
      </div>
    </section>
  );
}
