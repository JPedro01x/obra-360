import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, FileLock2, RefreshCw, Upload } from 'lucide-react';
import { requestApi } from '../services/http';
import { RhSelect } from './RhSelect';

type PrivateDocument = {
  id: number;
  funcionarioId: number;
  titulo: string;
  categoria: string;
  nomeArquivo: string;
  numeroVersao: number;
  grupo: string;
  tamanho: number;
  sha256: string;
  dataValidade: string | null;
  arquivado: boolean;
  versao: number;
  criadoEm: string;
};
type Snapshot = Record<string, string | number | null>;
type History = {
  id: number;
  funcionarioId: number;
  responsavel: string;
  tipo: string;
  motivo: string;
  dataReferencia: string;
  registradoEm: string;
  camposAlterados: string[];
  anterior: Snapshot | null;
  atual: Snapshot;
};
const categories = [
  'ADMISSAO',
  'CONTRATO',
  'ADITIVO',
  'COMPROVANTE',
  'CERTIFICADO',
  'DESLIGAMENTO',
  'OUTRO',
];
const api = <T,>(path: string, options?: RequestInit) =>
  requestApi<T>(`/v1/workspace/rh${path}`, options, 45000);
const labels: Record<string, string> = {
  nome: 'Nome',
  matricula: 'Matrícula',
  salarioBase: 'Salário / valor contratual',
  vinculo: 'Vínculo',
  situacao: 'Situação',
  admissao: 'Admissão',
  desligamento: 'Desligamento',
  departamento: 'Departamento',
  cargo: 'Cargo',
  obra: 'Obra',
  equipe: 'Equipe',
  usuarioId: 'Conta de acesso (ID)',
  jornadaSemanalMinutos: 'Jornada semanal',
};
const referenceFields: Record<string, string> = {
  departamentoId: 'departamento',
  cargoId: 'cargo',
  projetoObraId: 'obra',
  equipeId: 'equipe',
};
const date = (value: string) =>
  new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleString(
    'pt-BR',
    value.length === 10 ? { year: 'numeric', month: '2-digit', day: '2-digit' } : undefined,
  );
function fields(event: History) {
  return Array.from(
    new Set(
      (event.anterior ? event.camposAlterados : Object.keys(labels)).map(
        (key) => referenceFields[key] || key,
      ),
    ),
  ).filter((key) => labels[key]);
}
function value(snapshot: Snapshot | null, key: string) {
  const v = snapshot?.[key];
  if (v == null || v === '') return 'Não informado';
  if (key === 'salarioBase')
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (['admissao', 'desligamento'].includes(key)) return date(String(v));
  if (key === 'jornadaSemanalMinutos') return `${Math.floor(Number(v) / 60)}h ${Number(v) % 60}min`;
  return String(v).replace(/_/g, ' ');
}

export function RhDossie({ mode }: { mode: 'documentos' | 'historico' }) {
  const [employee, setEmployee] = useState('');
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(0);
  const [documents, setDocuments] = useState<PrivateDocument[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [names, setNames] = useState<{ id: number; nome: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previous, setPrevious] = useState<PrivateDocument | null>(null);
  const [uploadEmployee, setUploadEmployee] = useState('');
  const [formError, setFormError] = useState('');
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<{ items: PrivateDocument[] | History[]; total: number }>(
      `/${mode}?page=${page}&size=25${employee ? `&funcionarioId=${employee}` : ''}${mode === 'documentos' ? `&incluirArquivados=${archived}` : ''}`,
      { signal: controller.signal },
    )
      .then((result) => {
        if (!controller.signal.aborted) {
          if (mode === 'documentos') setDocuments(result.items as PrivateDocument[]);
          else setHistory(result.items as History[]);
          setTotal(result.total);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setDocuments([]);
          setHistory([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mode, employee, page, archived, revision]);
  useEffect(() => {
    const c = new AbortController();
    api<{ id: number; nome: string }[]>('/opcoes/funcionarios', { signal: c.signal })
      .then(setNames)
      .catch(() => {});
    return () => c.abort();
  }, [revision]);
  function openUpload(doc: PrivateDocument | null) {
    setPrevious(doc);
    setUploadEmployee(doc ? String(doc.funcionarioId) : employee);
    setFormError('');
    setUploading(true);
  }
  useEffect(() => {
    if (uploading) {
      form.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.current?.querySelector<HTMLElement>('input,select')?.focus();
    }
  }, [uploading, previous]);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError('');
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get('arquivo');
      if (!(file instanceof File) || !file.size || file.size > 20 * 1024 * 1024)
        throw new Error('Escolha um arquivo PDF, PNG ou JPEG de até 20 MB.');
      if (!uploadEmployee) throw new Error('Selecione o funcionário.');
      data.set('funcionarioId', uploadEmployee);
      if (!data.get('dataValidade')) data.delete('dataValidade');
      if (previous) {
        data.set('documentoAnteriorId', String(previous.id));
        data.set('titulo', previous.titulo);
        data.set('categoria', previous.categoria);
      }
      await api('/documentos', { method: 'POST', body: data });
      setUploading(false);
      setNotice('Documento privado salvo. As versões anteriores foram preservadas.');
      setPage(0);
      setRevision((v) => v + 1);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Não foi possível enviar.');
    } finally {
      setBusy(false);
    }
  }
  async function download(doc: PrivateDocument) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const blob = await requestApi<Blob>(
        `/v1/workspace/rh/documentos/${doc.id}/arquivo`,
        {},
        45000,
        'blob',
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Arquivo indisponível.');
    } finally {
      setBusy(false);
    }
  }
  async function archive(doc: PrivateDocument) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await api(`/documentos/${doc.id}/arquivo-status`, {
        method: 'PATCH',
        body: JSON.stringify({ arquivado: !doc.arquivado, versao: doc.versao }),
      });
      setNotice(
        doc.arquivado
          ? 'Documento reativado.'
          : 'Documento arquivado; arquivo e versões preservados.',
      );
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operação indisponível.');
    } finally {
      setBusy(false);
    }
  }
  const title = mode === 'documentos' ? 'Documentos privados' : 'Histórico funcional';
  return (
    <section className="rh-section" aria-labelledby="rh-dossier-title">
      <div className="ws-page-heading">
        <div>
          <h2 id="rh-dossier-title">{title}</h2>
          <p>
            {mode === 'documentos'
              ? 'Contratos, documentos admissionais e comprovantes separados dos arquivos das obras. Somente administração e RH podem consultar e baixar.'
              : 'Histórico de admissão, remuneração, cargo, vínculo, jornada, alocação e desligamento. Registros anteriores e novos são preservados, com responsável e motivo.'}
          </p>
        </div>
        {mode === 'documentos' && (
          <button className="ws-primary" disabled={busy} onClick={() => openUpload(null)}>
            <Upload size={16} />
            Enviar documento privado
          </button>
        )}
      </div>
      <div className="rh-filters">
        <label>
          <span>Funcionário do dossiê</span>
          <RhSelect
            field={{
              name: 'funcionarioId',
              label: 'Funcionário do dossiê',
              source: 'funcionarios',
              optional: true,
            }}
            value={employee}
            onChange={(v) => {
              setEmployee(v);
              setPage(0);
            }}
          />
        </label>
        {mode === 'documentos' && (
          <label className="rh-check">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => {
                setArchived(e.target.checked);
                setPage(0);
              }}
            />
            Incluir documentos arquivados
          </label>
        )}
        <button
          className="ws-secondary"
          disabled={loading}
          onClick={() => setRevision((v) => v + 1)}
        >
          <RefreshCw size={16} />
          Atualizar dossiê
        </button>
      </div>
      {error && (
        <div role="alert" className="ws-alert">
          {error}
        </div>
      )}
      {notice && (
        <p role="status" className="rh-notice">
          {notice}
        </p>
      )}
      {uploading && (
        <form className="rh-upload" onSubmit={upload} ref={form} key={previous?.id || 'new'}>
          <h3>{previous ? `Nova versão de ${previous.titulo}` : 'Enviar arquivo ao dossiê'}</h3>
          <p>
            PDF, PNG ou JPEG, até 20 MB. O arquivo será entregue como anexo, sem visualização
            pública. Não envie prontuários ou laudos clínicos.
          </p>
          {formError && (
            <div role="alert" className="ws-alert">
              {formError}
            </div>
          )}
          <div className="rh-fields">
            <label>
              <span>Funcionário do documento</span>
              <RhSelect
                field={{
                  name: 'funcionarioId',
                  label: 'Funcionário do documento',
                  source: 'funcionarios',
                }}
                value={uploadEmployee}
                onChange={setUploadEmployee}
                disabled={busy || !!previous}
              />
            </label>
            <label>
              <span>Título do documento privado</span>
              <input
                name="titulo"
                aria-label="Título do documento privado"
                required
                maxLength={150}
                defaultValue={previous?.titulo || ''}
                readOnly={!!previous}
                disabled={busy}
              />
            </label>
            <label>
              <span>Categoria do documento privado</span>
              <select
                name="categoria"
                aria-label="Categoria do documento privado"
                defaultValue={previous?.categoria || 'ADMISSAO'}
                disabled={busy || !!previous}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Validade do documento (opcional)</span>
              <input
                type="date"
                name="dataValidade"
                aria-label="Validade do documento"
                disabled={busy}
              />
            </label>
            <label className="rh-wide">
              <span>Arquivo privado</span>
              <input
                type="file"
                name="arquivo"
                aria-label="Arquivo privado"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                disabled={busy}
              />
            </label>
          </div>
          <div className="rh-actions">
            <button type="button" disabled={busy} onClick={() => setUploading(false)}>
              Cancelar envio
            </button>
            <button className="ws-primary" disabled={busy}>
              {busy ? 'Enviando…' : 'Salvar documento privado'}
            </button>
          </div>
        </form>
      )}
      {loading ? (
        <p role="status">Consultando dossiê…</p>
      ) : total === 0 ? (
        <div className="rh-empty">
          <FileLock2 size={28} />
          <h3>
            {mode === 'documentos'
              ? 'Nenhum documento privado encontrado'
              : 'Nenhum histórico funcional encontrado'}
          </h3>
          <p>
            {mode === 'documentos'
              ? 'Envie documentos reais ou ajuste os filtros.'
              : 'O histórico começa com os cadastros e alterações registrados a partir desta versão. Não há reconstrução automática de eventos antigos.'}
          </p>
        </div>
      ) : mode === 'documentos' ? (
        <div className="rh-table-scroll" tabIndex={0} role="region" aria-label="Tabela do dossiê">
          <table>
            <caption>Documentos privados de RH</caption>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Documento</th>
                <th>Versão</th>
                <th>Arquivo</th>
                <th>Validade</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    {names.find((n) => n.id === doc.funcionarioId)?.nome ||
                      `Funcionário #${doc.funcionarioId}`}
                  </td>
                  <td>
                    <strong>{doc.titulo}</strong>
                    <br />
                    {doc.categoria}
                  </td>
                  <td>{doc.numeroVersao}</td>
                  <td>
                    {doc.nomeArquivo}
                    <br />
                    <small>
                      {(doc.tamanho / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                      KB · SHA-256 verificado no download
                    </small>
                  </td>
                  <td>{doc.dataValidade ? date(doc.dataValidade) : 'Não informada'}</td>
                  <td>{doc.arquivado ? 'Arquivado' : 'Ativo'}</td>
                  <td>
                    <div className="rh-actions">
                      <button disabled={busy} onClick={() => download(doc)}>
                        Baixar privado
                      </button>
                      {!doc.arquivado && (
                        <button disabled={busy} onClick={() => openUpload(doc)}>
                          Nova versão privada
                        </button>
                      )}
                      <button disabled={busy} onClick={() => archive(doc)}>
                        {doc.arquivado ? 'Reativar documento' : 'Arquivar documento'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rh-timeline">
          {history.map((event) => (
            <article className="rh-history-event" key={event.id}>
              <header>
                <div>
                  <h3>
                    {event.tipo.replace(/_/g, ' ')} ·{' '}
                    {String(event.atual.nome || `Funcionário #${event.funcionarioId}`)}
                  </h3>
                  <p>
                    {date(event.registradoEm)} · Por {event.responsavel} · Referência{' '}
                    {date(event.dataReferencia)}
                  </p>
                </div>
                <span>#{event.id}</span>
              </header>
              <p className="rh-event-reason">{event.motivo}</p>
              <div className="rh-table-scroll" tabIndex={0} role="region" aria-label="Tabela do histórico">
                <table>
                  <caption>Dados do evento #{event.id}</caption>
                  <thead>
                    <tr>
                      <th>Informação</th>
                      {event.anterior && <th>Anterior</th>}
                      <th>{event.anterior ? 'Novo' : 'Situação registrada'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields(event).map((key) => (
                      <tr key={key}>
                        <td>{labels[key]}</td>
                        {event.anterior && <td>{value(event.anterior, key)}</td>}
                        <td>{value(event.atual, key)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="rh-pagination">
        <span>
          {total} registro(s) · página {page + 1}
        </span>
        <button
          aria-label="Página anterior do dossiê"
          disabled={page === 0 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          <ArrowLeft size={16} />
        </button>
        <button
          aria-label="Próxima página do dossiê"
          disabled={(page + 1) * 25 >= total || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          <ArrowRight size={16} />
        </button>
      </div>
      {mode === 'historico' && (
        <p className="rh-dossier-note">
          Este histórico é relacional e não oferece garantia criptográfica de imutabilidade. A data
          de registro distingue quando o sistema recebeu o evento da data de referência informada.
        </p>
      )}
    </section>
  );
}
