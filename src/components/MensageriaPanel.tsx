import React, { useEffect, useRef, useState } from 'react';
import { requestApi } from '../services/http';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';

type Summary = { habilitada: boolean; pendentesPublicacao: number; aguardandoProcessamento: number; processados: number; falhasConsumo: number; atrasados: number; requerAtencao: boolean };
type Failure = { id: number; eventoId: string | null; criadoEm: string; tipoErro: string; resolvidoEm: string | null };
type FailurePage = { items: Failure[]; total: number; page: number; size: number };
const readers = ['SUPER_ADMIN', 'GERENTE_OBRA', 'AUDITOR'];

export function MensageriaPanel({ role }: { role: string }) {
  return readers.includes(role) ? <MessagingStatus role={role} /> : null;
}
function MessagingStatus({ role }: { role: string }) {
  const workspaceRevision = useWorkspaceRefresh();
  const [summary, setSummary] = useState<Summary>();
  const [data, setData] = useState<FailurePage>();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  const mounted = useRef(true);
  const writing = useRef(false);
  const canReplay = ['SUPER_ADMIN', 'GERENTE_OBRA'].includes(role);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const sequence = ++request.current;
    const controller = new AbortController();
    setLoading(true);
    setData(undefined);
    Promise.all([
      requestApi<Summary>('/v1/workspace/mensageria', { signal: controller.signal }),
      requestApi<FailurePage>(`/v1/workspace/mensageria/falhas?page=${page}&size=25`, { signal: controller.signal }),
    ]).then(([status, failures]) => {
      if (controller.signal.aborted || sequence !== request.current) return;
      setSummary(status);
      if (page > 0 && page * 25 >= failures.total) { setPage(Math.max(0, Math.ceil(failures.total / 25) - 1)); return; }
      setData(failures);
    }).catch((e) => {
      if (!controller.signal.aborted && sequence === request.current) setError(e.message);
    }).finally(() => {
      if (!controller.signal.aborted && sequence === request.current) setLoading(false);
    });
    return () => controller.abort();
  }, [page, revision, role, workspaceRevision]);
  async function replay(item: Failure) {
    if (!canReplay || writing.current || !item.eventoId || item.resolvidoEm) return;
    writing.current = true;
    setBusy(true); setError('');
    try {
      await requestApi(`/v1/workspace/mensageria/falhas/${item.id}/reprocessar`, { method: 'POST' });
      if (mounted.current) setRevision((value) => value + 1);
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      writing.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return <section className="ws-service-panel" aria-label="Mensageria operacional">
    <h2>Mensageria operacional</h2>
    <button disabled={loading || busy} onClick={() => { setError(''); setRevision((value) => value + 1); }}>Atualizar mensageria</button>
    {error && <p role="alert">{error}</p>}
    {loading && <p role="status">Consultando mensageria…</p>}
    {summary && <>
      <p>{summary.habilitada ? 'Mensageria habilitada' : 'Mensageria desabilitada'}</p>
      {summary.requerAtencao && <p className="ws-alert" role="alert">A mensageria requer atenção.</p>}
      <dl>
        <dt>Pendentes de publicação</dt><dd>{summary.pendentesPublicacao}</dd>
        <dt>Aguardando processamento</dt><dd>{summary.aguardandoProcessamento}</dd>
        <dt>Processados</dt><dd>{summary.processados}</dd>
        <dt>Falhas de consumo</dt><dd>{summary.falhasConsumo}</dd>
        <dt>Atrasados</dt><dd>{summary.atrasados}</dd>
      </dl>
    </>}
    <h3>Falhas em quarentena</h3>
    {data && <>
      {!data.items.length && <p>Nenhuma falha registrada.</p>}
      <ul>{data.items.map((item) => <li key={item.id}>
        <p>#{item.id} · {item.eventoId || 'Evento não identificado'} · {item.tipoErro} · {new Date(item.criadoEm).toLocaleString('pt-BR')}</p>
        <p>{item.resolvidoEm ? 'Resolvido' : 'Pendente'}</p>
        {canReplay && !item.resolvidoEm && item.eventoId && <button disabled={busy || loading} aria-label={`Reprocessar evento ${item.eventoId}`} onClick={() => replay(item)}>Reprocessar</button>}
      </li>)}</ul>
      <nav aria-label="Paginação das falhas">
        <button disabled={loading || busy || page === 0} onClick={() => setPage((value) => value - 1)}>Falhas anteriores</button>
        <span> Página {page + 1} de {Math.max(1, Math.ceil(data.total / 25))} · {data.total} falhas </span>
        <button disabled={loading || busy || (page + 1) * 25 >= data.total} onClick={() => setPage((value) => value + 1)}>Próximas falhas</button>
      </nav>
    </>}
  </section>;
}
