import React, { useEffect, useRef, useState } from 'react';
import { requestApi } from '../services/http';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';
import { OperationForm, type OperationDefinition } from './OperationForms';
import { localCalendarDate } from '../utils/planningDates';
import './recordDetails.css';
import './businessManagement.css';
import { parseBankCsv } from '../services/bankCsv';
type Row = Record<string, string | number | boolean | null>;
type Option = { id: number; nome: string };
type Page = { items: Row[]; total: number; page: number };
type View = 'orcamentos' | 'titulos' | 'baixas' | 'extrato' | 'pedidos';
const financial = ['SUPER_ADMIN', 'FINANCEIRO'];
const managers = ['SUPER_ADMIN', 'GERENTE_OBRA', 'INCORPORADOR'];
const columns: Record<View, [string, string, string?][]> = {
  orcamentos: [
    ['revisao', 'Revisão'],
    ['valorAprovado', 'Investimento', 'money'],
    ['situacao', 'Situação'],
    ['justificativa', 'Justificativa'],
    ['aprovadorId', 'Aprovador (ID)'],
  ],
  titulos: [
    ['descricao', 'Descrição'],
    ['tipo', 'Tipo'],
    ['contraparte', 'Contraparte'],
    ['categoria', 'Categoria'],
    ['valor', 'Valor', 'money'],
    ['baixado', 'Baixado', 'money'],
    ['vencimento', 'Vencimento', 'date'],
    ['situacao', 'Situação'],
    ['origem', 'Origem'],
  ],
  baixas: [
    ['tituloId', 'Título (ID)'],
    ['valor', 'Valor', 'money'],
    ['dataEfetiva', 'Data', 'date'],
    ['conta', 'Conta'],
    ['observacao', 'Observação'],
    ['estornado', 'Estornado'],
    ['estornoDe', 'Estorno de (ID)'],
  ],
  extrato: [
    ['identificador', 'Identificador'],
    ['conta', 'Conta'],
    ['data', 'Data', 'date'],
    ['descricao', 'Descrição'],
    ['valor', 'Valor com sinal', 'money'],
    ['baixaId', 'Baixa conciliada (ID)'],
  ],
  pedidos: [
    ['fornecedorB2bId', 'Fornecedor (ID)'],
    ['total', 'Total', 'money'],
    ['situacao', 'Situação'],
    ['referenciaProposta', 'Proposta de origem'],
    ['vencimento', 'Vencimento', 'date'],
    ['tituloId', 'Conta a pagar (ID)'],
  ],
};
const labels: Record<View, string> = {
  orcamentos: 'Orçamentos da obra',
  titulos: 'Contas a pagar e receber',
  baixas: 'Baixas e estornos',
  extrato: 'Conciliação bancária',
  pedidos: 'Pedidos de materiais',
};
const money = (value: unknown) =>
  value === null || value === undefined
    ? 'Não informado'
    : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
function display(value: unknown, type?: string) {
  if (value === null || value === undefined || value === '') return 'Não informado';
  if (type === 'money') return money(value);
  if (type === 'date') return String(value).slice(0, 10).split('-').reverse().join('/');
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value).replace(/_/g, ' ');
}
const amountField = (name: string, label: string) => ({
  name,
  label,
  type: 'number',
  min: 0.01,
  step: '0.01',
});
export function BusinessManagement({
  role,
  ordersOnly = false,
}: {
  role: string;
  ordersOnly?: boolean;
}) {
  const workspaceRevision = useWorkspaceRefresh();
  const [view, setView] = useState<View>(ordersOnly ? 'pedidos' : 'orcamentos');
  const [project, setProject] = useState('');
  const [revision, setRevision] = useState(0),
    [page, setPage] = useState(0);
  const [data, setData] = useState<Page | null>(null),
    [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState<OperationDefinition | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false),
    [importing, setImporting] = useState(false),
    [order, setOrder] = useState<string | null>(null);
  const readFinance = role !== 'ALMOXARIFE';
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setSummary(null);
    setError('');
    if (!project) return () => controller.abort();
    setLoading(true);
    Promise.all([
      requestApi<Page>(
        `/v1/workspace/gestao/registros/${view}?projetoObraId=${project}&page=${page}`,
        { signal: controller.signal },
      ),
      readFinance
        ? requestApi<Record<string, unknown>>(`/v1/workspace/gestao/resumo/${project}`, {
            signal: controller.signal,
          })
        : Promise.resolve(null),
    ])
      .then(([rows, metrics]) => {
        if (!controller.signal.aborted) {
          setData(rows);
          setSummary(metrics);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [project, view, page, revision, readFinance, workspaceRevision]);
  function saved() {
    setOperation(null);
    setCreatingOrder(false);
    setImporting(false);
    setNotice('Operação registrada com sucesso.');
    setRevision((n) => n + 1);
  }
  function action(
    title: string,
    path: string,
    row: Row,
    fields: OperationDefinition['fields'] = [],
    extra: Record<string, unknown> = {},
    warning?: string,
  ) {
    setOperation({
      title,
      path: `/gestao/${path}`,
      method: 'POST',
      fields,
      roles: [],
      hidden: { versao: row.versao, ...extra },
      warning,
    });
  }
  function create() {
    if (view === 'pedidos') {
      setCreatingOrder(true);
      return;
    }
    if (view === 'extrato') {
      setImporting(true);
      return;
    }
    const fields: OperationDefinition['fields'] =
      view === 'orcamentos'
        ? [
            amountField('valorAprovado', 'Investimento previsto (R$)'),
            {
              name: 'justificativa',
              label: 'Justificativa da revisão',
              type: 'textarea',
              maxLength: 1000,
            },
          ]
        : [
            {
              name: 'tipo',
              label: 'Tipo',
              options: [
                ['PAGAR', 'Pagar'],
                ['RECEBER', 'Receber'],
              ],
            },
            {
              name: 'categoria',
              label: 'Categoria',
              options: ['MATERIAIS', 'MAO_DE_OBRA', 'SERVICOS', 'TAXAS', 'VENDAS', 'OUTROS'].map(
                (v) => [v, v.replace(/_/g, ' ')],
              ),
            },
            { name: 'descricao', label: 'Descrição', maxLength: 250 },
            { name: 'contraparte', label: 'Fornecedor, cliente ou beneficiário', maxLength: 150 },
            amountField('valor', 'Valor do título (R$)'),
            { name: 'vencimento', label: 'Vencimento', type: 'date', futureOnly: true },
          ];
    setOperation({
      title: view === 'orcamentos' ? 'Nova revisão de orçamento' : 'Novo título financeiro',
      path: `/gestao/${view}`,
      fields,
      roles: [],
      hidden: { projetoObraId: Number(project) },
    });
  }
  const canCreate =
    view === 'orcamentos'
      ? managers.includes(role)
      : view === 'titulos' || view === 'extrato'
        ? financial.includes(role)
        : view === 'pedidos' &&
          ['SUPER_ADMIN', 'GERENTE_OBRA', 'FINANCEIRO', 'INCORPORADOR'].includes(role);
  return (
    <section
      className="business-management"
      aria-label={ordersOnly ? 'Gestão de pedidos de materiais' : 'Gestão financeira'}
    >
      <header className="ws-page-heading">
        <div>
          <p className="ws-eyebrow">GESTÃO DA OBRA</p>
          <h1>{ordersOnly ? 'Pedidos de materiais' : 'Orçamento e financeiro'}</h1>
        </div>
      </header>
      <p className="ws-help">
        Registros internos por obra. Baixas não executam transferências bancárias. Conciliação exige
        extrato e conferência do responsável.
      </p>
      <div className="ws-detail-tools">
        <RemoteSelect
          label="Obra da gestão"
          source="projetos"
          value={project}
          onChange={(value) => {
            setProject(value);
            setPage(0);
            setOrder(null);
          }}
        />
        <button
          className="ws-secondary"
          disabled={!project || loading}
          onClick={() => setRevision((n) => n + 1)}
        >
          Atualizar gestão
        </button>
      </div>
      {!ordersOnly && (
        <nav className="business-tabs" aria-label="Áreas financeiras">
          {(['orcamentos', 'titulos', 'baixas', 'extrato'] as View[]).map((v) => (
            <button
              key={v}
              className="ws-secondary"
              aria-current={view === v ? 'page' : undefined}
              onClick={() => {
                setView(v);
                setPage(0);
                setNotice('');
              }}
            >
              {labels[v]}
            </button>
          ))}
        </nav>
      )}
      {summary && (
        <section className="ws-detail-metrics" aria-label="Orçamento e custos da obra">
          {[
            ['investimentoAprovado', 'Investimento aprovado'],
            ['despesasComprometidas', 'Despesas comprometidas'],
            ['creditosDevolucao', 'Créditos por devolução'],
            ['despesasLiquidasComprometidas', 'Compromissos menos devoluções'],
            ['pagamentosRegistrados', 'Pagamentos registrados'],
            ['saldoPagar', 'Saldo a pagar'],
            ['receitasPrevistas', 'Receitas previstas'],
            ['recebimentosRegistrados', 'Recebimentos registrados'],
            ['saldoReceber', 'Saldo a receber'],
            ['saldoOrcamento', 'Orçamento menos compromissos'],
          ].map(([key, label]) => (
            <article key={key}>
              <h3>{label}</h3>
              <strong>{money(summary[key])}</strong>
            </article>
          ))}
        </section>
      )}
      {notice && (
        <p className="ws-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {!project ? (
        <p>Selecione uma obra para consultar os registros.</p>
      ) : (
        <>
          <div className="ws-detail-tools">
            <h2>{labels[view]}</h2>
            {canCreate && (
              <button className="ws-primary" onClick={create}>
                {view === 'orcamentos'
                  ? 'Novo orçamento'
                  : view === 'titulos'
                    ? 'Novo título'
                    : view === 'extrato'
                      ? 'Importar extrato CSV'
                      : 'Novo pedido de materiais'}
              </button>
            )}
          </div>
          {loading ? (
            <p role="status">Consultando gestão…</p>
          ) : (
            data && (
              <>
                {data.items.length ? (
                  <div
                    className="ws-detail-table"
                    role="region"
                    aria-label={labels[view]}
                    tabIndex={0}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          {columns[view].map(([key, label]) => (
                            <th scope="col" key={key}>
                              {label}
                            </th>
                          ))}
                          <th scope="col">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((row) => (
                          <tr key={String(row.id)}>
                            <td>{row.id}</td>
                            {columns[view].map(([key, , type]) => (
                              <td key={key}>{display(row[key], type)}</td>
                            ))}
                            <td>
                              <div className="ws-row-actions">
                                {view === 'orcamentos' &&
                                  row.situacao === 'RASCUNHO' &&
                                  managers.includes(role) && (
                                    <button
                                      className="ws-secondary"
                                      onClick={() =>
                                        action(
                                          'Aprovar orçamento',
                                          `orcamentos/${row.id}/aprovar`,
                                          row,
                                          [],
                                          {},
                                          'Esta revisão substituirá o orçamento aprovado anterior, que continuará no histórico.',
                                        )
                                      }
                                    >
                                      Aprovar orçamento
                                    </button>
                                  )}
                                {view === 'titulos' && financial.includes(role) && (
                                  <>
                                    {['ABERTO', 'PARCIAL'].includes(String(row.situacao)) && (
                                      <button
                                        className="ws-secondary"
                                        onClick={() =>
                                          action(
                                            'Registrar baixa financeira',
                                            `titulos/${row.id}/baixar`,
                                            row,
                                            [
                                              amountField('valor', 'Valor da baixa (R$)'),
                                              {
                                                name: 'data',
                                                label: 'Data efetiva',
                                                type: 'date',
                                                maxToday: true,
                                              },
                                              {
                                                name: 'conta',
                                                label: 'Conta bancária ou caixa',
                                                maxLength: 80,
                                              },
                                              {
                                                name: 'observacao',
                                                label: 'Comprovante ou observação',
                                                maxLength: 500,
                                              },
                                            ],
                                            { chave: crypto.randomUUID() },
                                            'Registre somente pagamento ou recebimento já ocorrido e comprovado. Esta ação não movimenta dinheiro no banco.',
                                          )
                                        }
                                      >
                                        Registrar baixa
                                      </button>
                                    )}
                                    {row.situacao === 'ABERTO' && !row.origem && (
                                      <button
                                        className="ws-secondary"
                                        onClick={() =>
                                          action(
                                            'Cancelar título financeiro',
                                            `titulos/${row.id}/cancelar`,
                                            row,
                                            [],
                                            {},
                                            'O título permanecerá no histórico como cancelado.',
                                          )
                                        }
                                      >
                                        Cancelar título
                                      </button>
                                    )}
                                  </>
                                )}
                                {view === 'baixas' &&
                                  financial.includes(role) &&
                                  !row.estornado &&
                                  !row.estornoDe && (
                                    <button
                                      className="ws-secondary"
                                      onClick={() =>
                                        action(
                                          'Estornar baixa',
                                          `baixas/${row.id}/estornar`,
                                          row,
                                          [
                                            {
                                              name: 'justificativa',
                                              label: 'Justificativa do estorno',
                                              maxLength: 500,
                                            },
                                          ],
                                          {},
                                          'O estorno corrige os registros internos; não devolve dinheiro automaticamente.',
                                        )
                                      }
                                    >
                                      Estornar baixa
                                    </button>
                                  )}
                                {view === 'extrato' && financial.includes(role) && (
                                  <button
                                    className="ws-secondary"
                                    onClick={() =>
                                      action(
                                        row.baixaId
                                          ? 'Desfazer conciliação'
                                          : 'Conciliar movimento',
                                        `extrato/${row.id}/conciliar`,
                                        row,
                                        row.baixaId
                                          ? []
                                          : [
                                              {
                                                name: 'baixaId',
                                                label: 'ID da baixa correspondente',
                                                type: 'number',
                                                min: 1,
                                                step: '1',
                                              },
                                            ],
                                        row.baixaId ? { baixaId: null } : {},
                                        'Confira conta, obra, sinal e valor. Consulte o ID em Baixas e estornos.',
                                      )
                                    }
                                  >
                                    {row.baixaId ? 'Desfazer conciliação' : 'Conciliar'}
                                  </button>
                                )}
                                {view === 'pedidos' && (
                                  <button
                                    className="ws-secondary"
                                    onClick={() => setOrder(String(row.id))}
                                  >
                                    Ver pedido e entregas
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>Nenhum registro cadastrado nesta consulta.</p>
                )}
                {data.total > 25 && (
                  <nav className="ws-detail-pages" aria-label="Paginação da gestão">
                    <button
                      className="ws-secondary"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Anterior
                    </button>
                    <span>
                      Página {page + 1} de {Math.ceil(data.total / 25)}
                    </span>
                    <button
                      className="ws-secondary"
                      disabled={(page + 1) * 25 >= data.total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Próxima
                    </button>
                  </nav>
                )}
              </>
            )
          )}
        </>
      )}
      {operation && (
        <OperationForm definition={operation} onClose={() => setOperation(null)} onSaved={saved} />
      )}
      {creatingOrder && (
        <OrderForm project={project} onClose={() => setCreatingOrder(false)} onSaved={saved} />
      )}
      {importing && (
        <BankImport project={project} onClose={() => setImporting(false)} onSaved={saved} />
      )}
      {order && (
        <OrderDetails
          id={order}
          role={role}
          onClose={() => {
            setOrder(null);
            setRevision((n) => n + 1);
          }}
        />
      )}
    </section>
  );
}
function RemoteSelect({
  label,
  source,
  value,
  onChange,
  project,
  required = false,
}: {
  label: string;
  source: string;
  value: string;
  onChange: (value: string) => void;
  project?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState(''),
    [rows, setRows] = useState<Option[]>([]),
    [selected, setSelected] = useState<Option | null>(null),
    [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => {
    const token = ++request.current;
    const c = new AbortController();
    const timer = setTimeout(() => {
      requestApi<Option[]>(
        `/v1/workspace/opcoes/${source}?q=${encodeURIComponent(query)}${project ? `&projetoObraId=${project}` : ''}`,
        { signal: c.signal },
      )
        .then((result) => {
          if (token === request.current) {
            setRows(result);
            setError('');
          }
        })
        .catch((e) => {
          if (!c.signal.aborted) setError(e.message);
        });
    }, 160);
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [query, source, project]);
  const options =
    selected && selected.id === Number(value) && !rows.some((r) => r.id === selected.id)
      ? [selected, ...rows]
      : rows;
  return (
    <label style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span>{label}</span>
      <input
        aria-label={`Buscar: ${label}`}
        placeholder="Buscar pelo nome…"
        maxLength={100}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label={label}
        required={required}
        value={value}
        onChange={(e) => {
          setSelected(options.find((r) => String(r.id) === e.target.value) || null);
          onChange(e.target.value);
        }}
      >
        <option value="">Selecione…</option>
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nome} · #{r.id}
          </option>
        ))}
      </select>
      {error && <small role="alert">{error}</small>}
    </label>
  );
}
function Modal({
  title,
  onClose,
  children,
  busy,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  busy: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="ws ws-form-dialog ws-detail-dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <section className="ws-modal ws-detail-panel">
        <header>
          <h2>{title}</h2>
          <button type="button" className="ws-secondary" disabled={busy} onClick={onClose}>
            Fechar
          </button>
        </header>
        {children}
      </section>
    </dialog>
  );
}
type OrderData = {
  pedido: Row;
  fornecedor: string;
  itens: [number, number, string, string, number, number, number, number][];
  eventos: Row[];
};
function OrderForm({
  project,
  onClose,
  onSaved,
}: {
  project: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [supplier, setSupplier] = useState(''),
    [items, setItems] = useState([
      { key: crypto.randomUUID(), stock: '', quantity: '', price: '' },
    ]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  function edit(key: string, field: 'stock' | 'quantity' | 'price', value: string) {
    setItems((all) => all.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await requestApi('/v1/workspace/gestao/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          projetoObraId: Number(project),
          fornecedorB2bId: Number(supplier),
          justificativa: form.get('justificativa'),
          referenciaProposta: form.get('referenciaProposta'),
          vencimento: form.get('vencimento'),
          itens: items.map((i) => ({
            itemEstoqueId: Number(i.stock),
            quantidade: Number(i.quantity),
            valorUnitario: Number(i.price),
          })),
        }),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Novo pedido de materiais" onClose={onClose} busy={busy}>
      <form onSubmit={submit}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
          <RemoteSelect
            label="Fornecedor do pedido"
            source="fornecedores"
            value={supplier}
            onChange={setSupplier}
            required
          />
          <label>
            Referência da proposta comercial
            <input name="referenciaProposta" required maxLength={150} />
          </label>
          <label>
            Justificativa do pedido
            <textarea name="justificativa" required minLength={10} maxLength={1000} />
          </label>
          <label>
            Vencimento do compromisso
            <input name="vencimento" type="date" min={localCalendarDate()} required />
          </label>
          {items.map((i, index) => (
            <fieldset
              key={i.key}
              style={{
                marginTop: 14,
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: 14,
                minWidth: 0,
              }}
            >
              <legend>Material {index + 1}</legend>
              <RemoteSelect
                label={`Material ${index + 1}`}
                source="estoque"
                project={project}
                value={i.stock}
                onChange={(v) => edit(i.key, 'stock', v)}
                required
              />
              <label>
                Quantidade {index + 1}
                <input
                  type="number"
                  min="0.0001"
                  max="99999999.9999"
                  step="0.0001"
                  required
                  value={i.quantity}
                  onChange={(e) => edit(i.key, 'quantity', e.target.value)}
                />
              </label>
              <label>
                Preço unitário {index + 1} (R$)
                <input
                  type="number"
                  min="0.01"
                  max="9999999999.99"
                  step="0.01"
                  required
                  value={i.price}
                  onChange={(e) => edit(i.key, 'price', e.target.value)}
                />
              </label>
              {items.length > 1 && (
                <button
                  type="button"
                  className="ws-secondary"
                  onClick={() => setItems((all) => all.filter((row) => row.key !== i.key))}
                >
                  Remover material {index + 1}
                </button>
              )}
            </fieldset>
          ))}
          <button
            type="button"
            className="ws-secondary"
            disabled={items.length >= 100}
            onClick={() =>
              setItems((all) => [
                ...all,
                { key: crypto.randomUUID(), stock: '', quantity: '', price: '' },
              ])
            }
          >
            Adicionar material ao pedido
          </button>
          <p className="ws-help">
            Os preços serão conferidos por gestão e financeiro antes da emissão. Emitir gera uma
            conta a pagar, sem alterar o estoque.
          </p>
          {error && (
            <p role="alert" className="ws-alert">
              {error}
            </p>
          )}
          <button className="ws-primary" type="submit">
            {busy ? 'Salvando…' : 'Enviar para aprovação'}
          </button>
        </fieldset>
      </form>
    </Modal>
  );
}
function OrderDetails({ id, role, onClose }: { id: string; role: string; onClose: () => void }) {
  const [data, setData] = useState<OrderData | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0);
  const [kind, setKind] = useState<'receber' | 'devolver' | null>(null),
    [values, setValues] = useState<Record<number, string>>({}),
    [note, setNote] = useState(''),
    [key, setKey] = useState(() => crypto.randomUUID());
  useEffect(() => {
    const c = new AbortController();
    requestApi<OrderData>(`/v1/workspace/gestao/pedidos/${id}`, { signal: c.signal })
      .then(setData)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [id, revision]);
  async function post(path: string, extra: Record<string, unknown> = {}) {
    if (!data || busy) return;
    setBusy(true);
    setError('');
    try {
      await requestApi(`/v1/workspace/gestao/pedidos/${id}/${path}`, {
        method: 'POST',
        body: JSON.stringify({ versao: data.pedido.versao, ...extra }),
      });
      setKind(null);
      setValues({});
      setNote('');
      setKey(crypto.randomUUID());
      setRevision((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const p = data?.pedido;
  return (
    <Modal title={`Pedido de materiais #${id}`} onClose={onClose} busy={busy}>
      {error && (
        <p role="alert" className="ws-alert">
          {error}
        </p>
      )}
      {!data ? (
        <p role="status">Consultando pedido…</p>
      ) : (
        <>
          <p>
            <strong>{data.fornecedor}</strong> · {display(p?.situacao)} · {money(p?.total)}
          </p>
          <p>{p?.justificativa}</p>
          <p>
            Conta a pagar: {p?.tituloId || 'Gerada após emissão'} · Proposta:{' '}
            {p?.referenciaProposta}
          </p>
          <div
            className="ws-detail-table"
            tabIndex={0}
            role="region"
            aria-label="Materiais do pedido"
          >
            <table>
              <thead>
                <tr>
                  {['Material', 'Unidade', 'Pedido', 'Preço unitário', 'Recebido', 'Devolvido'].map(
                    (label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.itens.map((i) => (
                  <tr key={i[0]}>
                    <td>{i[2]}</td>
                    <td>{i[3]}</td>
                    <td>{i[4]}</td>
                    <td>{money(i[5])}</td>
                    <td>{i[6]}</td>
                    <td>{i[7]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ws-detail-tools">
            {p?.situacao === 'APROVACAO' && (
              <>
                {managers.includes(role) && !p.aprovadorGestaoId && (
                  <button
                    className="ws-secondary"
                    disabled={busy}
                    onClick={() => void post('aprovar', { alcada: 'GESTAO' })}
                  >
                    Aprovar na gestão
                  </button>
                )}
                {financial.includes(role) && !p.aprovadorFinanceiroId && (
                  <button
                    className="ws-secondary"
                    disabled={busy}
                    onClick={() => void post('aprovar', { alcada: 'FINANCEIRO' })}
                  >
                    Aprovar no financeiro
                  </button>
                )}
              </>
            )}
            {p?.situacao === 'APROVADO' &&
              ['SUPER_ADMIN', 'GERENTE_OBRA', 'FINANCEIRO', 'INCORPORADOR'].includes(role) && (
                <button className="ws-primary" disabled={busy} onClick={() => void post('emitir')}>
                  Emitir pedido e conta a pagar
                </button>
              )}
            {p &&
              ['PEDIDO', 'PARCIAL', 'RECEBIDO', 'DEVOLUCAO'].includes(String(p.situacao)) &&
              ['SUPER_ADMIN', 'GERENTE_OBRA', 'ALMOXARIFE'].includes(role) && (
                <>
                  {data.itens.some((i) => i[6] < i[4]) && (
                    <button
                      className="ws-secondary"
                      disabled={busy}
                      onClick={() => {
                        setKind('receber');
                        setValues({});
                      }}
                    >
                      Registrar entrega
                    </button>
                  )}
                  {data.itens.some((i) => i[6] > i[7]) && (
                    <button
                      className="ws-secondary"
                      disabled={busy}
                      onClick={() => {
                        setKind('devolver');
                        setValues({});
                      }}
                    >
                      Registrar devolução
                    </button>
                  )}
                </>
              )}
            {p &&
              ['APROVACAO', 'APROVADO', 'PEDIDO'].includes(String(p.situacao)) &&
              ['SUPER_ADMIN', 'GERENTE_OBRA', 'FINANCEIRO', 'INCORPORADOR'].includes(role) && (
                <button
                  className="ws-secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Cancelar este pedido? O histórico será mantido e a conta sem baixas será cancelada.',
                      )
                    )
                      void post('cancelar');
                  }}
                >
                  Cancelar pedido
                </button>
              )}
          </div>
          {kind && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const itens = Object.entries(values)
                  .filter(([, v]) => Number(v) > 0)
                  .map(([itemId, quantidade]) => ({
                    itemId: Number(itemId),
                    quantidade: Number(quantidade),
                  }));
                if (!itens.length) {
                  setError('Informe a quantidade de pelo menos um material.');
                  return;
                }
                void post(kind, { itens, observacao: note, chave: key });
              }}
            >
              <fieldset disabled={busy} style={{ minWidth: 0 }}>
                <legend>
                  {kind === 'receber' ? 'Entrega parcial ou integral' : 'Devolução ao fornecedor'}
                </legend>
                {data.itens
                  .filter((i) => (kind === 'receber' ? i[4] - i[6] : i[6] - i[7]) > 0)
                  .map((i) => (
                    <label key={i[0]}>
                      {i[2]} — saldo {kind === 'receber' ? i[4] - i[6] : i[6] - i[7]} {i[3]}
                      <input
                        aria-label={`Quantidade: ${i[2]}`}
                        type="number"
                        min="0"
                        step="0.0001"
                        max={kind === 'receber' ? i[4] - i[6] : i[6] - i[7]}
                        value={values[i[0]] || ''}
                        onChange={(e) => setValues((all) => ({ ...all, [i[0]]: e.target.value }))}
                      />
                    </label>
                  ))}
                <label>
                  Documento e justificativa
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                {kind === 'devolver' && (
                  <p className="ws-help">
                    Gera saída de estoque e crédito a receber do fornecedor. Não cancela o
                    compromisso original nem devolve dinheiro automaticamente. Reposição exige novo
                    pedido.
                  </p>
                )}
                <button type="submit" className="ws-primary">
                  Confirmar {kind === 'receber' ? 'entrega' : 'devolução'}
                </button>
              </fieldset>
            </form>
          )}
          <h3>Últimas movimentações (até 50)</h3>
          {data.eventos.length ? (
            <ul>
              {data.eventos.map((e) => (
                <li key={String(e.id)}>
                  {display(e.tipo)} · {display(e.criadoEm, 'date')} · {e.observacao}
                  {e.creditoId ? ` · Crédito #${e.creditoId}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma entrega ou devolução registrada.</p>
          )}
        </>
      )}
    </Modal>
  );
}
function BankImport({
  project,
  onClose,
  onSaved,
}: {
  project: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState('identificador;data;descricao;valor\n'),
    [account, setAccount] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Modal title="Importar extrato CSV" onClose={onClose} busy={busy}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setError('');
          try {
            const linhas = parseBankCsv(text);
            setBusy(true);
            await requestApi('/v1/workspace/gestao/extrato/importar', {
              method: 'POST',
              body: JSON.stringify({ projetoObraId: Number(project), conta: account, linhas }),
            });
            onSaved();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
          <label>
            Conta do extrato
            <input
              required
              maxLength={80}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </label>
          <p className="ws-help">
            Use identificadores estáveis do banco, datas AAAA-MM-DD, ponto e vírgula entre colunas e
            valores negativos para saídas. Até 500 linhas. Reimportar o mesmo identificador e
            conteúdo não duplica o movimento.
          </p>
          <label>
            Arquivo CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 1024 * 1024) {
                  setError('O CSV deve ter até 1 MB.');
                  return;
                }
                setText(await file.text());
              }}
            />
          </label>
          <label>
            Conteúdo do extrato
            <textarea
              required
              aria-label="Conteúdo do extrato"
              rows={9}
              maxLength={1024 * 1024}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          {error && (
            <p className="ws-alert" role="alert">
              {error}
            </p>
          )}
          <button className="ws-primary" type="submit">
            Importar movimentos
          </button>
        </fieldset>
      </form>
    </Modal>
  );
}
