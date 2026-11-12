import React, { useEffect, useRef, useState } from 'react';
import { requestApi } from '../services/http';
import './recordDetails.css';

type Value = string | number | boolean | null;
type Section = {
  key: string;
  title: string;
  resource: string;
  columns: { label: string; type: string }[];
  rows: Value[][];
  total: number;
  page: number;
};
type Detail = {
  registro: Record<string, Value>;
  indicadores: { label: string; value: Value; type: string; note: string }[];
  secoes: Section[];
};
type Definition = { title: string; columns: [string, string, ('money' | 'date' | 'number')?][] };
export type DetailTarget = { resource: string; id: string };
function display(value: Value | undefined, type = 'text'): string {
  if (value === null || value === undefined || value === '') return 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (type === 'money')
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (type === 'percent')
    return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
  if (type === 'date') {
    const parsed = new Date(String(value).length === 10 ? `${value}T12:00:00` : String(value));
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString('pt-BR');
  }
  return String(value);
}
export function RecordDetails({
  target,
  definition,
  onClose,
  onModel,
  onDocument,
  canDownload,
}: {
  target: DetailTarget;
  definition: (resource: string) => Definition | undefined;
  onClose: () => void;
  onModel: (project: string, model: number) => void;
  onDocument: (id: string, filename: string) => Promise<void>;
  canDownload: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [history, setHistory] = useState<DetailTarget[]>([target]);
  const current = history[history.length - 1];
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const generation = useRef(0);
  const title = definition(current.resource)?.title || 'Cadastro';
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const token = ++generation.current;
    setData(null);
    setError('');
    setLoading(true);
    requestApi<Detail>(`/v1/workspace/detalhes/${current.resource}/${current.id}`, {
      signal: controller.signal,
    })
      .then((value) => {
        if (generation.current === token) setData(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    heading.current?.focus();
    return () => controller.abort();
  }, [current.resource, current.id, reload]);
  async function changePage(section: Section, page: number) {
    const token = generation.current;
    setBusy(true);
    setError('');
    try {
      const result = await requestApi<Detail>(
        `/v1/workspace/detalhes/${current.resource}/${current.id}?secao=${encodeURIComponent(section.key)}&page=${page}`,
      );
      if (generation.current === token)
        setData(
          (previous) =>
            previous && {
              ...previous,
              secoes: previous.secoes.map((s) =>
                s.key === section.key ? result.secoes.find((n) => n.key === s.key) || s : s,
              ),
            },
        );
    } catch (e) {
      if (generation.current === token) setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function download(id: string, filename: string) {
    setBusy(true);
    setError('');
    try {
      await onDocument(id, filename);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="ws ws-form-dialog ws-detail-dialog"
      aria-label={`Detalhes: ${title}`}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <section className="ws-modal ws-detail-panel">
        <header>
          <div>
            <p className="ws-eyebrow">VISÃO DO CADASTRO</p>
            <h2 ref={heading} tabIndex={-1}>
              {title} · #{current.id}
            </h2>
          </div>
          <button
            className="ws-secondary"
            aria-label="Fechar detalhes"
            disabled={busy}
            onClick={onClose}
          >
            Fechar
          </button>
        </header>
        <div className="ws-detail-tools">
          {history.length > 1 && (
            <button
              className="ws-secondary"
              disabled={busy || loading}
              onClick={() => setHistory((h) => h.slice(0, -1))}
            >
              Voltar ao cadastro anterior
            </button>
          )}
          <button
            className="ws-secondary"
            disabled={busy || loading}
            onClick={() => setReload((n) => n + 1)}
          >
            Atualizar detalhes
          </button>
        </div>
        {loading && <p role="status">Consultando cadastro e vínculos…</p>}
        {error && (
          <p role="alert" className="ws-alert">
            {error}
          </p>
        )}
        {data && (
          <>
            <dl className="ws-detail-fields">
              {[['id', 'Código'], ...(definition(current.resource)?.columns || [])].map(
                ([key, label, type]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{display(data.registro[key], type)}</dd>
                  </div>
                ),
              )}
            </dl>
            {data.indicadores.length > 0 && (
              <section className="ws-detail-metrics" aria-label="Indicadores da obra">
                {data.indicadores.map((metric) => (
                  <article key={metric.label}>
                    <h3>{metric.label}</h3>
                    <strong>{display(metric.value, metric.type)}</strong>
                    <p>{metric.note}</p>
                    {metric.type === 'percent' && metric.value !== null && (
                      <progress aria-label={metric.label} value={Number(metric.value)} max={100} />
                    )}
                  </article>
                ))}
              </section>
            )}
            <p className="ws-help">
              Dados e vínculos cadastrados no banco, conforme seu perfil. Ausência de vínculo não
              significa ausência de atividade. Os valores exibidos não substituem a apuração
              financeira completa.
            </p>
            {data.secoes.map((section) => (
              <section className="ws-detail-section" key={section.key} aria-label={section.title}>
                <h3>
                  {section.title} <span>({section.total.toLocaleString('pt-BR')})</span>
                </h3>
                {section.rows.length === 0 ? (
                  <p className="ws-help">Nenhum vínculo cadastrado.</p>
                ) : (
                  <div
                    className="ws-detail-table"
                    tabIndex={0}
                    role="region"
                    aria-label={`Tabela: ${section.title}`}
                  >
                    <table>
                      <caption className="sr-only">{section.title}</caption>
                      <thead>
                        <tr>
                          {section.columns.map((c, i) => (
                            <th key={i} scope="col">
                              {c.label}
                            </th>
                          ))}
                          {(section.resource ||
                            ['plantas', 'documentos'].includes(section.key)) && (
                            <th scope="col">Ações</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row) => (
                          <tr key={String(row[0])}>
                            {row.map((value, i) => (
                              <td key={i}>{display(value, section.columns[i]?.type)}</td>
                            ))}
                            {(section.resource ||
                              ['plantas', 'documentos'].includes(section.key)) && (
                              <td>
                                <div className="ws-row-actions">
                                  {section.resource && (
                                    <button
                                      className="ws-secondary"
                                      disabled={busy}
                                      onClick={() =>
                                        setHistory((h) => [
                                          ...h,
                                          { resource: section.resource, id: String(row[0]) },
                                        ])
                                      }
                                    >
                                      Ver detalhes
                                    </button>
                                  )}
                                  {section.key === 'plantas' && (
                                    <button
                                      className="ws-secondary"
                                      disabled={busy}
                                      onClick={() => onModel(current.id, Number(row[0]))}
                                    >
                                      Abrir planta
                                    </button>
                                  )}
                                  {section.key === 'documentos' && canDownload && (
                                    <button
                                      className="ws-secondary"
                                      disabled={busy}
                                      onClick={() =>
                                        void download(String(row[0]), String(row[3] || 'documento'))
                                      }
                                    >
                                      Baixar arquivo
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.total > 10 && (
                  <nav className="ws-detail-pages" aria-label={`Paginação: ${section.title}`}>
                    <button
                      className="ws-secondary"
                      disabled={busy || section.page === 0}
                      onClick={() => void changePage(section, section.page - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {section.page + 1} de {Math.ceil(section.total / 10)}
                    </span>
                    <button
                      className="ws-secondary"
                      disabled={busy || (section.page + 1) * 10 >= section.total}
                      onClick={() => void changePage(section, section.page + 1)}
                    >
                      Próxima
                    </button>
                  </nav>
                )}
              </section>
            ))}
          </>
        )}
      </section>
    </dialog>
  );
}
