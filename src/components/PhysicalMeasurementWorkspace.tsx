import React, { FormEvent, useEffect, useState } from 'react';
import { requestApi } from '../services/http';

type Row = Record<string, string | number | boolean | null>;
type Page<T> = { items: T[]; total: number; page: number; size: number };
type Project = { id: number; nome: string };
type Stage = { id: number; nomeEtapa: string; percentualExecutado: number };
type Measurement = {
  id: number; projetoObraId: number; etapaCronogramaId: number; competencia: string;
  descricao: string; quantidade: number; unidade: string; percentualAnterior: number;
  percentualMedido: number; valorMedido: number; status: string;
};
type MeasurementEvent = { id: number; usuarioId: number; usuario: string; acao: string; statusAnterior: string | null; statusNovo: string; ocorridoEm: string };
type MeasurementAttachment = { id: number; nomeArquivo: string; mime: string; tamanho: number; sha256: string; usuarioId: number; criadoEm: string };

export function PhysicalMeasurementWorkspace({ role }: { role: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [stages, setStages] = useState<Stage[]>([]);
  const [rows, setRows] = useState<Measurement[]>([]);
  const [stageId, setStageId] = useState('');
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [unidade, setUnidade] = useState('un');
  const [percentual, setPercentual] = useState('0');
  const [valor, setValor] = useState('0');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [history, setHistory] = useState<MeasurementEvent[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [attachmentMeasurementId, setAttachmentMeasurementId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<MeasurementAttachment[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const canCreate = ['SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','INCORPORADOR'].includes(role);

  useEffect(() => {
    const controller = new AbortController();
    requestApi<Page<Project>>('/v1/workspace/registros/projetos?page=0&size=100', { signal: controller.signal })
      .then((result) => { setProjects(result.items); setProjectId((current) => current || String(result.items[0]?.id || '')); })
      .catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    setError('');
    Promise.all([
      requestApi<Page<Stage>>(`/v1/workspace/registros/cronograma?page=0&size=100`, { signal: controller.signal }),
      requestApi<Page<Measurement>>(`/v1/workspace/medicoes?projetoObraId=${projectId}&page=0`, { signal: controller.signal }),
    ]).then(([schedule, measured]) => {
      if (controller.signal.aborted) return;
      const scoped = schedule.items.filter((stage) => Number((stage as Row).projetoObraId) === Number(projectId));
      setStages(scoped);
      const chosen = scoped.find((stage) => String(stage.id) === stageId) || scoped[0];
      setStageId((current) => scoped.some((stage) => String(stage.id) === current) ? current : String(scoped[0]?.id || ''));
      setPercentual(String(chosen?.percentualExecutado ?? 0));
      setRows(measured.items);
    }).catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [projectId, revision]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!canCreate || !projectId || !stageId) return;
    setBusy(true); setError('');
    try {
      await requestApi(editingId === null ? '/v1/workspace/medicoes' : `/v1/workspace/medicoes/${editingId}`, { method: editingId === null ? 'POST' : 'PUT', body: JSON.stringify({
        ...(editingId === null ? { projetoObraId: Number(projectId), etapaCronogramaId: Number(stageId), competencia } : {}),
        descricao, quantidade: Number(quantidade), unidade, percentualMedido: Number(percentual), valorMedido: Number(valor),
      }) });
      setDescricao(''); setEditingId(null); setRevision((n) => n + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function transition(id: number, action: 'aprovar' | 'liberar') {
    setBusy(true); setError('');
    try { await requestApi(`/v1/workspace/medicoes/${id}/${action}`, { method: 'POST' }); setRevision((n) => n + 1); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function showHistory(id: number) {
    setError(''); setHistoryId(id); setHistory([]);
    try { setHistory(await requestApi<MeasurementEvent[]>(`/v1/workspace/medicoes/${id}/historico`)); }
    catch (e) { setError((e as Error).message); }
  }

  async function showAttachments(id: number) {
    setError(''); setAttachmentMeasurementId(id); setAttachmentFile(null);
    try { setAttachments(await requestApi<MeasurementAttachment[]>(`/v1/workspace/medicoes/${id}/anexos`)); }
    catch (e) { setError((e as Error).message); }
  }

  async function uploadAttachment(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault(); if (!attachmentFile) return;
    setBusy(true); setError('');
    try {
      const body = new FormData(); body.append('arquivo', attachmentFile);
      await requestApi<MeasurementAttachment>(`/v1/workspace/medicoes/${id}/anexos`, { method: 'POST', body });
      setAttachmentFile(null); await showAttachments(id);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function downloadAttachment(attachment: MeasurementAttachment) {
    if (attachmentMeasurementId === null) return;
    setError('');
    try {
      const file = await requestApi<Blob>(`/v1/workspace/medicoes/${attachmentMeasurementId}/anexos/${attachment.id}/arquivo`, {}, 15000, 'blob');
      const url = URL.createObjectURL(file); const link = document.createElement('a');
      link.href = url; link.download = attachment.nomeArquivo; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError((e as Error).message); }
  }

  function edit(m: Measurement) {
    setEditingId(m.id); setDescricao(m.descricao); setQuantidade(String(m.quantidade));
    setUnidade(m.unidade); setPercentual(String(m.percentualMedido)); setValor(String(m.valorMedido));
    setStageId(String(m.etapaCronogramaId)); setCompetencia(m.competencia); setError('');
  }

  return <section className="ws-service-panel" aria-labelledby="physical-measurements-title">
    <p className="ws-eyebrow">OBRAS E PROJETOS</p>
    <h1 id="physical-measurements-title">Medições físico-financeiras</h1>
    <p>Registre o avanço de uma etapa; engenharia aprova o percentual e financeiro libera o valor. Cada mudança fica no histórico.</p>
    {error && <p role="alert" className="ws-alert">{error}</p>}
    <label>Empreendimento<select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
      {projects.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
    </select></label>
    {canCreate && <form className="ws-form-grid" onSubmit={create}>
      <h2>{editingId === null ? 'Nova medição' : `Editar medição ${editingId}`}</h2>
      <label>Etapa<select value={stageId} disabled={editingId !== null} onChange={(e) => {
        const chosen = stages.find((stage) => String(stage.id) === e.target.value);
        setStageId(e.target.value); setPercentual(String(chosen?.percentualExecutado ?? 0));
      }} required>
        {stages.map((s) => <option key={s.id} value={s.id}>{s.nomeEtapa} · atual {Number(s.percentualExecutado).toFixed(1)}%</option>)}
      </select></label>
      <label>Competência<input type="date" value={competencia} disabled={editingId !== null} onChange={(e) => setCompetencia(e.target.value)} required /></label>
      <label>Descrição<input maxLength={2000} value={descricao} onChange={(e) => setDescricao(e.target.value)} required /></label>
      <label>Quantidade<input type="number" min="0.0001" step="0.0001" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required /></label>
      <label>Unidade<select value={unidade} onChange={(e) => setUnidade(e.target.value)}>{['m','m2','m3','un','kg','t','h'].map((u) => <option key={u}>{u}</option>)}</select></label>
      <label>Avanço acumulado (%)<input type="number" min="0" max="100" step="0.01" value={percentual} onChange={(e) => setPercentual(e.target.value)} required /></label>
      <label>Valor medido (R$)<input type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required /></label>
      <button className="ws-primary" disabled={busy || !stages.length}>{editingId === null ? 'Registrar medição' : 'Salvar edição'}</button>
      {editingId !== null && <button type="button" className="ws-secondary" onClick={() => { setEditingId(null); setDescricao(''); }}>Cancelar edição</button>}
    </form>}
    <div className="ws-table-wrap"><table><thead><tr><th>Competência</th><th>Etapa</th><th>Avanço</th><th>Valor</th><th>Status</th><th>Ação</th></tr></thead>
      <tbody>{rows.map((m) => <React.Fragment key={m.id}><tr><td>{m.competencia}</td><td>{stages.find((s) => s.id === m.etapaCronogramaId)?.nomeEtapa || `Etapa ${m.etapaCronogramaId}`}</td>
        <td>{Number(m.percentualAnterior).toFixed(1)}% → {Number(m.percentualMedido).toFixed(1)}%</td>
        <td>{Number(m.valorMedido).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td><td>{m.status.replace(/_/g,' ')}</td><td>
          <button className="ws-secondary" disabled={busy} onClick={() => void showHistory(m.id)}>Histórico</button>{' '}
          <button className="ws-secondary" disabled={busy} onClick={() => attachmentMeasurementId === m.id ? setAttachmentMeasurementId(null) : void showAttachments(m.id)}>Anexos</button>{' '}
          {m.status === 'EM_MEDICAO' && canCreate && <button className="ws-secondary" disabled={busy} onClick={() => edit(m)}>Editar</button>}{' '}
          {m.status === 'EM_MEDICAO' && ['SUPER_ADMIN','ENGENHEIRO'].includes(role) && <button className="ws-secondary" disabled={busy} onClick={() => void transition(m.id,'aprovar')}>Aprovar</button>}
          {m.status === 'APROVADO_ENGENHEIRO' && ['SUPER_ADMIN','FINANCEIRO'].includes(role) && <button className="ws-secondary" disabled={busy} onClick={() => void transition(m.id,'liberar')}>Liberar financeiro</button>}
        </td></tr>{historyId === m.id && <tr><td colSpan={6}><strong>Histórico</strong>{history.length ? <ul>{history.map((item) => <li key={item.id}>{item.ocorridoEm} · {item.usuario} · {item.acao.replace(/_/g,' ')} · {item.statusAnterior || 'inicial'} → {item.statusNovo.replace(/_/g,' ')}</li>)}</ul> : <p>Sem eventos disponíveis.</p>}</td></tr>}{attachmentMeasurementId === m.id && <tr><td colSpan={6}>
          <strong>Evidências da medição</strong>{attachments.length ? <ul>{attachments.map((attachment) => <li key={attachment.id}>{attachment.nomeArquivo} · {(attachment.tamanho / 1024 / 1024).toFixed(2)} MB · {new Date(attachment.criadoEm).toLocaleString('pt-BR')} <button className="ws-secondary" disabled={busy} onClick={() => void downloadAttachment(attachment)}>Baixar</button></li>)}</ul> : <p>Nenhum anexo registrado.</p>}
          {canCreate && m.status === 'EM_MEDICAO' && <form className="ws-form-grid" onSubmit={(event) => void uploadAttachment(event, m.id)}><label>Anexar PDF, PNG ou JPEG (até 20 MB)<input type="file" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} /></label><button className="ws-primary" disabled={busy || !attachmentFile}>Enviar evidência</button></form>}
        </td></tr>}</React.Fragment>)}
        {!rows.length && <tr><td colSpan={6}>Nenhuma medição registrada nesta obra.</td></tr>}</tbody></table></div>
  </section>;
}
