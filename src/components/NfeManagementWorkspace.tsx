import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FilePlus2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { requestApi } from '../services/http';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';
import { localCalendarDate } from '../utils/planningDates';

type Option = { id: number; nome: string };
type DraftLine = { draftId: string; itemEstoqueId: string; quantidade: string; valorUnitario: string };
type Invoice = {
  id: number; chaveNfe: string; numero: string; fornecedor: string; dataEmissao: string;
  valorTotal: number; status: 'PENDENTE_CONFERENCIA' | 'ENTRADA_REGISTRADA' | 'CANCELADA';
  quantidadeItens: number; criadoEm: string;
};
type InvoiceDetail = {
  documento: Invoice;
  itens: { itemEstoqueId: number; sku: string; nome: string; unidadeMedida: string; quantidade: number; valorUnitario: number; valorTotal: number }[];
  eventos: { tipo: string; observacao: string; usuario: string; criadoEm: string }[];
};
type Page = { items: Invoice[]; total: number; page: number; size: number };

const endpoint = '/v1/workspace/notas-fiscais';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const newDraftLine = (): DraftLine => ({ draftId: crypto.randomUUID(), itemEstoqueId: '', quantidade: '1', valorUnitario: '0' });

export function NfeManagementWorkspace({ role }: { role: string }) {
  const workspaceRevision = useWorkspaceRefresh();
  const [page, setPage] = useState<Page | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<InvoiceDetail | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [nfeKey, setNfeKey] = useState('');
  const [number, setNumber] = useState('');
  const [issueDate, setIssueDate] = useState(localCalendarDate());
  const [declaredTotal, setDeclaredTotal] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newDraftLine()]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const mayRegister = ['SUPER_ADMIN', 'GERENTE_OBRA', 'FINANCEIRO', 'ALMOXARIFE'].includes(role);
  const mayMoveStock = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ALMOXARIFE'].includes(role);
  const invoiceTotal = useMemo(() => lines.reduce((sum, line) => {
    const quantity = Number(line.quantidade);
    const unit = Number(line.valorUnitario);
    return sum + (Number.isFinite(quantity) && Number.isFinite(unit) ? Math.round(quantity * unit * 100) / 100 : 0);
  }, 0), [lines]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const data = await requestApi<Page>(`${endpoint}?page=${pageNumber}&size=25&q=${encodeURIComponent(query.trim())}`, { signal });
      setPage(data);
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Não foi possível carregar as notas.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [pageNumber, query, workspaceRevision]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function updateLine(draftId: string, field: keyof Omit<DraftLine, 'draftId'>, value: string) {
    setLines((current) => current.map((line) => line.draftId === draftId ? { ...line, [field]: value } : line));
  }

  async function createInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError('');
    setNotice('');
    const cleanKey = nfeKey.replace(/\D/g, '');
    if (cleanKey.length !== 44) { setError('A chave da NF-e deve conter 44 dígitos.'); return; }
    if (lines.some((line) => !line.itemEstoqueId || Number(line.quantidade) <= 0 || Number(line.valorUnitario) < 0)) {
      setError('Complete cada linha com material, quantidade positiva e preço unitário válido.'); return;
    }
    const ids = lines.map((line) => line.itemEstoqueId);
    if (new Set(ids).size !== ids.length) { setError('O mesmo material não pode aparecer em duas linhas. Some as quantidades em uma linha.'); return; }
    setSaving(true);
    try {
      await requestApi<Invoice>(endpoint, { method: 'POST', body: JSON.stringify({
        chaveNfe: cleanKey, fornecedorId: Number(supplierId), numero: number.trim(), dataEmissao: issueDate,
        valorTotal: declaredTotal, itens: lines.map((line) => ({
          itemEstoqueId: Number(line.itemEstoqueId), quantidade: line.quantidade, valorUnitario: line.valorUnitario,
        })),
      }) });
      setOpen(false); setNfeKey(''); setNumber(''); setSupplierId(''); setDeclaredTotal('');
      setLines([newDraftLine()]); setPageNumber(0);
      setNotice('NF-e registrada no banco como pendente de conferência. Nenhum saldo de estoque foi alterado.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível registrar a NF-e.'); }
    finally { setSaving(false); }
  }

  async function showDetails(id: number) {
    setError('');
    try { setDetails(await requestApi<InvoiceDetail>(`${endpoint}/${id}`)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível consultar os detalhes.'); }
  }

  async function registerStock(id: number) {
    if (!window.confirm('Registrar a entrada dos itens no estoque da empresa? Esta ação atualiza os saldos e não pode ser repetida.')) return;
    setError(''); setNotice(''); setSaving(true);
    try {
      await requestApi<Invoice>(`${endpoint}/${id}/registrar-entrada`, { method: 'POST' });
      setNotice('Entrada de estoque registrada e auditada. Isso não confirma autorização fiscal da NF-e.');
      if (details?.documento.id === id) await showDetails(id);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível registrar a entrada.'); }
    finally { setSaving(false); }
  }

  async function cancelPending(id: number) {
    const reason = window.prompt('Justificativa para cancelar esta NF-e pendente (mínimo 10 caracteres):');
    if (reason === null) return;
    setError(''); setNotice(''); setSaving(true);
    try {
      await requestApi<Invoice>(`${endpoint}/${id}/cancelar`, { method: 'POST', body: JSON.stringify({ justificativa: reason }) });
      setNotice('NF-e pendente cancelada com justificativa; o registro e seu histórico foram preservados.');
      if (details?.documento.id === id) await showDetails(id);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível cancelar a NF-e.'); }
    finally { setSaving(false); }
  }

  return <section className="ws-service-panel nfe-workspace" aria-labelledby="nfe-heading">
    <div className="ws-breadcrumb">Sua empresa <span aria-hidden="true">›</span> Estoque e compras</div>
    <div className="ws-title-row">
      <div><p className="ws-eyebrow">DOCUMENTOS FISCAIS</p><h1 id="nfe-heading">Notas fiscais de materiais</h1>
        <p>Registro local da chave, fornecedor e itens; a autorização fiscal é uma consulta separada.</p></div>
      {mayRegister && <button className="ws-primary" onClick={() => { setOpen((value) => !value); setError(''); }}><FilePlus2 size={18} />{open ? 'Fechar cadastro' : 'Registrar NF-e'}</button>}
    </div>
    <div className="ws-alert" role="note">O cadastro é manual e não importa XML nem consulta a SEFAZ. O saldo só muda quando um usuário autorizado registra a entrada. “Entrada registrada” não significa NF-e autorizada.</div>
    {notice && <div className="ws-notice" role="status"><CheckCircle2 size={18} />{notice}</div>}
    {error && <div className="ws-alert" role="alert"><AlertCircle size={18} />{error}</div>}
    {open && mayRegister && <form className="ws-service-panel nfe-form" onSubmit={createInvoice}>
      <h2>Dados informados manualmente</h2>
      <div className="ws-form-grid">
        <OptionPicker label="Fornecedor cadastrado" resource="fornecedores" value={supplierId} onChange={setSupplierId} />
        <label>Número da NF-e<input required maxLength={30} value={number} onChange={(e) => setNumber(e.target.value)} /></label>
        <label>Data de emissão<input type="date" required max={localCalendarDate()} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></label>
        <label>Valor total informado na NF-e (R$)<input type="number" min="0.01" step="0.01" required value={declaredTotal} onChange={(e) => setDeclaredTotal(e.target.value)} /></label>
        <label className="nfe-full">Chave de acesso (44 dígitos)<input required inputMode="numeric" maxLength={54} value={nfeKey} onChange={(e) => setNfeKey(e.target.value)} placeholder="Somente números ou chave formatada" /></label>
      </div>
      <h3>Itens informados</h3>
      {lines.map((line) => <div className="ws-form-grid nfe-line" key={line.draftId}>
        <OptionPicker label="Material" resource="estoque" value={line.itemEstoqueId} onChange={(id) => updateLine(line.draftId, 'itemEstoqueId', id)} />
        <label>Quantidade<input type="number" min="0.0001" step="0.0001" required value={line.quantidade} onChange={(e) => updateLine(line.draftId, 'quantidade', e.target.value)} /></label>
        <label>Preço unitário (R$)<input type="number" min="0" step="0.01" required value={line.valorUnitario} onChange={(e) => updateLine(line.draftId, 'valorUnitario', e.target.value)} /></label>
        <button type="button" className="ws-icon-button" aria-label="Remover item" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((item) => item.draftId !== line.draftId))}><Trash2 size={17} /></button>
      </div>)}
      <div className="nfe-form-footer"><button type="button" className="ws-secondary" disabled={lines.length >= 100} onClick={() => setLines((current) => [...current, newDraftLine()])}><Plus size={16} />Adicionar item</button><div><strong>Soma dos itens: {currency(invoiceTotal)}</strong><small className="nfe-total-check">O total informado será conferido no servidor; divergências impedem o cadastro.</small></div><button className="ws-primary" disabled={saving || !supplierId || invoiceTotal <= 0 || Number(declaredTotal) <= 0}>{saving ? 'Salvando…' : 'Salvar como pendente'}</button></div>
    </form>}
    <div className="ws-table-card nfe-table">
      <div className="ws-table-toolbar"><h2>Notas registradas</h2><div><label className="ws-search"><Search size={17} /><input value={query} placeholder="Buscar chave, número ou fornecedor" onChange={(e) => { setQuery(e.target.value); setPageNumber(0); }} /></label><button className="ws-icon-button" aria-label="Atualizar notas" disabled={loading} onClick={() => void load()}><RefreshCw size={18} /></button></div></div>
      {loading ? <div className="ws-empty" role="status">Carregando notas fiscais…</div> : page?.items.length ? <div className="ws-table-scroll"><table><thead><tr><th>Número</th><th>Fornecedor</th><th>Emissão</th><th>Total</th><th>Itens</th><th>Status local</th><th>Ações</th></tr></thead><tbody>{page.items.map((invoice) => <tr key={invoice.id}><td>{invoice.numero}<small className="nfe-key">{invoice.chaveNfe}</small></td><td>{invoice.fornecedor}</td><td>{invoice.dataEmissao}</td><td>{currency(invoice.valorTotal)}</td><td>{invoice.quantidadeItens}</td><td>{invoice.status === 'PENDENTE_CONFERENCIA' ? 'Pendente de conferência' : invoice.status === 'ENTRADA_REGISTRADA' ? 'Entrada registrada' : 'Cancelada'}</td><td><div className="ws-row-actions"><button className="ws-secondary" onClick={() => void showDetails(invoice.id)}>Detalhes</button>{invoice.status === 'PENDENTE_CONFERENCIA' && mayMoveStock && <button className="ws-primary" disabled={saving} onClick={() => void registerStock(invoice.id)}>Registrar entrada</button>}{invoice.status === 'PENDENTE_CONFERENCIA' && mayRegister && <button className="ws-secondary" disabled={saving} onClick={() => void cancelPending(invoice.id)}>Cancelar pendente</button>}</div></td></tr>)}</tbody></table></div> : <div className="ws-empty"><FilePlus2 size={28} /><h3>{page ? 'Nenhuma nota registrada' : 'Consulta indisponível'}</h3><p>Notas cadastradas nesta empresa aparecerão aqui.</p></div>}
      <footer className="ws-table-footer"><span>{page ? `${page.total} registro(s) · Página ${pageNumber + 1} de ${Math.max(1, Math.ceil(page.total / 25))}` : 'Sem consulta concluída'}</span><div><button aria-label="Página anterior" disabled={pageNumber === 0 || loading} onClick={() => setPageNumber((n) => n - 1)}>‹</button><button aria-label="Próxima página" disabled={!page || (pageNumber + 1) * 25 >= page.total || loading} onClick={() => setPageNumber((n) => n + 1)}>›</button></div></footer>
    </div>
    {details && <div className="ws-service-panel nfe-detail"><div className="ws-title-row"><div><h2>NF-e {details.documento.numero}</h2><p>Chave: {details.documento.chaveNfe}</p></div><button className="ws-secondary" onClick={() => setDetails(null)}>Fechar detalhes</button></div><h3>Itens</h3><ul>{details.itens.map((line) => <li key={line.itemEstoqueId}>{line.sku} — {line.nome}: {line.quantidade} {line.unidadeMedida} × {currency(line.valorUnitario)} = {currency(line.valorTotal)}</li>)}</ul><h3>Histórico</h3><ol>{details.eventos.map((event, i) => <li key={`${event.tipo}-${i}`}><strong>{event.tipo.replace(/_/g, ' ')}</strong> · {new Date(event.criadoEm).toLocaleString('pt-BR')} · {event.usuario}<p>{event.observacao}</p></li>)}</ol></div>}
  </section>;
}

function OptionPicker({ label, resource, value, onChange }: {
  label: string; resource: 'fornecedores' | 'estoque'; value: string; onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true); setError('');
      requestApi<Option[]>(`/v1/workspace/opcoes/${resource}?q=${encodeURIComponent(search.trim())}`, { signal: controller.signal })
        .then(setOptions)
        .catch((e) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Busca indisponível.'); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [resource, search]);
  return <label>{label}<input type="search" value={search}
    onChange={(event) => { setSearch(event.target.value); onChange(''); }}
    placeholder={loading ? 'Buscando…' : 'Digite para pesquisar na empresa'} autoComplete="off" />
    <select aria-label={`Selecionar ${label.toLowerCase()}`} value={value} required onChange={(event) => {
      const option = options.find((item) => String(item.id) === event.target.value);
      onChange(event.target.value);
      if (option) setSearch(option.nome);
    }}><option value="">{options.length ? 'Selecione um resultado' : loading ? 'Carregando…' : 'Digite para buscar'}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.nome} · #{option.id}</option>)}</select>
    {error && <small role="status">{error}</small>}
  </label>;
}
