import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { requestApi } from '../services/http';
import './rh.css';
import { RhSelect } from './RhSelect';
import { RhDossie } from './RhDossie';
import { localCalendarDate, planningError, planningMinimum } from '../utils/planningDates';

type RecordData = Record<string, string | number | boolean | null>;
type Option = { id: number; nome: string };
type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  source?: string;
  optional?: boolean;
  min?: number;
  max?: number;
  step?: string;
  value?: string;
  maxLength?: number;
  readonly?: boolean;
};
type Section = {
  id: string;
  title: string;
  singular: string;
  description: string;
  fields: Field[];
  columns: [string, string, string?][];
  employee?: boolean;
};
const f = (name: string, label: string, rest: Partial<Field> = {}): Field => ({
  name,
  label,
  ...rest,
});
const money = (name: string, label: string): Field =>
  f(name, label, { type: 'number', min: 0, step: '0.01' });
const employee = f('funcionarioId', 'Funcionário', { source: 'funcionarios' });
const department = f('departamentoId', 'Departamento', { source: 'departamentos' });
const job = f('cargoId', 'Cargo', { source: 'cargos' });
const date = (name: string, label: string, optional = false): Field =>
  f(name, label, { type: 'date', optional });
const note = f('observacao', 'Observações (sem dados médicos sensíveis)', {
  type: 'textarea',
  optional: true,
  maxLength: 500,
});
const active = f('ativo', 'Ativo', { options: ['true', 'false'], value: 'true' });
const sections: Section[] = [
  {
    id: 'funcionarios',
    title: 'Funcionários',
    singular: 'funcionário',
    description:
      'Admissão, vínculo, remuneração e alocação. Novos cadastros criam login pelo e-mail e senha inicial, com acesso de Colaborador.',
    fields: [
      f('matricula', 'Matrícula', { maxLength: 30 }),
      f('nome', 'Nome completo', { maxLength: 150 }),
      f('cpf', 'CPF (somente dígitos)', { maxLength: 11, readonly: true }),
      f('email', 'E-mail', { type: 'email', optional: true, maxLength: 120 }),
      f('telefone', 'Telefone', { optional: true, maxLength: 30 }),
      date('nascimento', 'Nascimento', true),
      { ...date('admissao', 'Data de admissão'), readonly: true },
      f('vinculo', 'Tipo de vínculo', {
        options: ['CLT', 'PJ', 'ESTAGIO', 'APRENDIZ', 'TEMPORARIO', 'AUTONOMO'],
      }),
      department,
      job,
      f('projetoObraId', 'Obra de alocação', { source: 'projetos', optional: true }),
      f('equipeId', 'Equipe de alocação', { source: 'equipes', optional: true }),
      f('usuarioId', 'Conta de acesso vinculada', { source: 'usuarios', optional: true }),
      money('salarioBase', 'Salário base / valor contratual (R$)'),
      f('jornadaSemanalMinutos', 'Jornada semanal em minutos', {
        type: 'number',
        min: 1,
        max: 10080,
        step: '1',
        value: '2640',
      }),
    ],
    columns: [
      ['matricula', 'Matrícula'],
      ['nome', 'Funcionário'],
      ['cpf', 'CPF protegido'],
      ['departamentoId', 'Departamento', 'departamentos'],
      ['cargoId', 'Cargo', 'cargos'],
      ['admissao', 'Admissão', 'date'],
      ['situacao', 'Situação'],
    ],
  },
  {
    id: 'estrutura',
    title: 'Departamentos e cargos',
    singular: 'estrutura',
    description:
      'Cadastre primeiro o departamento e depois os cargos vinculados. Estruturas em uso são preservadas.',
    fields: [
      f('tipo', 'Tipo', { options: ['DEPARTAMENTO', 'CARGO'], readonly: true }),
      f('nome', 'Nome', { maxLength: 150 }),
      { ...department, optional: true },
      active,
    ],
    columns: [
      ['tipo', 'Tipo'],
      ['nome', 'Nome'],
      ['departamentoId', 'Departamento', 'departamentos'],
      ['ativo', 'Ativo'],
    ],
  },
  {
    id: 'ponto',
    title: 'Jornada e ponto',
    singular: 'ponto',
    employee: true,
    description:
      'Lançamentos administrativos de jornada no mesmo dia, com intervalo e aprovação. Não substitui um registrador eletrônico de ponto certificado.',
    fields: [
      employee,
      date('data', 'Data da jornada'),
      f('entrada', 'Entrada', { type: 'time' }),
      f('saidaIntervalo', 'Saída para intervalo', { type: 'time', optional: true }),
      f('retornoIntervalo', 'Retorno do intervalo', { type: 'time', optional: true }),
      f('saida', 'Saída', { type: 'time' }),
      note,
    ],
    columns: [
      ['funcionarioId', 'Funcionário', 'funcionarios'],
      ['data', 'Data', 'date'],
      ['entrada', 'Entrada'],
      ['saida', 'Saída'],
      ['minutosTrabalhados', 'Tempo registrado', 'minutes'],
      ['situacao', 'Situação'],
    ],
  },
  {
    id: 'afastamentos',
    title: 'Férias e afastamentos',
    singular: 'solicitação',
    employee: true,
    description:
      'Solicitações, decisão e calendário por funcionário. Períodos aprovados não podem se sobrepor. Não calcula direito adquirido ou verbas de férias.',
    fields: [
      employee,
      f('tipo', 'Tipo de ausência', {
        options: ['FERIAS', 'LICENCA', 'ATESTADO', 'FALTA', 'FOLGA'],
      }),
      date('inicio', 'Início'),
      date('fim', 'Fim'),
      note,
    ],
    columns: [
      ['funcionarioId', 'Funcionário', 'funcionarios'],
      ['tipo', 'Tipo'],
      ['inicio', 'Início', 'date'],
      ['fim', 'Fim', 'date'],
      ['situacao', 'Situação'],
    ],
  },
  {
    id: 'beneficios',
    title: 'Benefícios',
    singular: 'benefício',
    employee: true,
    description:
      'Benefícios individuais com vigência, custo da empresa e participação do funcionário. Os valores não são lançados automaticamente na folha.',
    fields: [
      employee,
      f('nome', 'Benefício', { maxLength: 100 }),
      money('valorEmpresa', 'Custo da empresa (R$)'),
      money('descontoFuncionario', 'Participação do funcionário (R$)'),
      date('inicio', 'Início da vigência'),
      date('fim', 'Fim da vigência', true),
      active,
    ],
    columns: [
      ['funcionarioId', 'Funcionário', 'funcionarios'],
      ['nome', 'Benefício'],
      ['valorEmpresa', 'Custo empresa', 'money'],
      ['descontoFuncionario', 'Participação', 'money'],
      ['inicio', 'Início', 'date'],
      ['fim', 'Fim', 'date'],
      ['ativo', 'Ativo'],
    ],
  },
  {
    id: 'folhas',
    title: 'Folha e pagamentos',
    singular: 'folha',
    description:
      'Conferência de lançamentos manuais por competência. Fechar bloqueia alterações; registrar pagamento não realiza transferência bancária. Tributos, encargos, férias, 13º e rescisão não são calculados automaticamente.',
    fields: [f('competencia', 'Competência', { type: 'month' })],
    columns: [
      ['competencia', 'Competência'],
      ['situacao', 'Situação'],
      ['totalProventos', 'Proventos', 'money'],
      ['totalDescontos', 'Descontos', 'money'],
      ['dataPagamento', 'Pagamento', 'date'],
    ],
  },
  {
    id: 'lancamentos',
    title: 'Lançamentos da folha',
    singular: 'lançamento',
    employee: true,
    description:
      'Informe valores conferidos pelo responsável pela folha. Cada código pode aparecer uma vez por funcionário e competência.',
    fields: [
      f('folhaId', 'Folha', { source: 'folhas' }),
      employee,
      f('codigo', 'Código da rubrica', { maxLength: 40 }),
      f('descricao', 'Descrição da rubrica', { maxLength: 150 }),
      f('natureza', 'Natureza', { options: ['PROVENTO', 'DESCONTO'] }),
      { ...money('valor', 'Valor (R$)'), min: 0.01 },
    ],
    columns: [
      ['folhaId', 'Competência', 'folhas'],
      ['funcionarioId', 'Funcionário', 'funcionarios'],
      ['codigo', 'Rubrica'],
      ['descricao', 'Descrição'],
      ['natureza', 'Natureza'],
      ['valor', 'Valor', 'money'],
    ],
  },
  {
    id: 'treinamentos',
    title: 'Treinamentos e exames',
    singular: 'registro',
    employee: true,
    description:
      'Treinamentos, certificações e datas de exames com controle de validade. Registre apenas informações administrativas, sem diagnósticos ou laudos médicos.',
    fields: [
      employee,
      f('tipo', 'Tipo de registro', { options: ['TREINAMENTO', 'CERTIFICACAO', 'EXAME'] }),
      f('titulo', 'Título', { maxLength: 150 }),
      date('realizacao', 'Data de realização'),
      date('validade', 'Válido até', true),
      f('cargaHorariaMinutos', 'Carga horária em minutos', {
        type: 'number',
        min: 0,
        max: 100000,
        step: '1',
        value: '0',
      }),
      f('instituicao', 'Instituição / responsável', { optional: true, maxLength: 150 }),
      note,
    ],
    columns: [
      ['funcionarioId', 'Funcionário', 'funcionarios'],
      ['tipo', 'Tipo'],
      ['titulo', 'Título'],
      ['realizacao', 'Realização', 'date'],
      ['validade', 'Validade', 'date'],
      ['cargaHorariaMinutos', 'Carga horária', 'minutes'],
    ],
  },
  {
    id: 'vagas',
    title: 'Vagas',
    singular: 'vaga',
    description: 'Abertura e acompanhamento de vagas por departamento e cargo.',
    fields: [
      f('titulo', 'Título da vaga', { maxLength: 150 }),
      department,
      job,
      f('quantidade', 'Quantidade de vagas', {
        type: 'number',
        min: 1,
        max: 10000,
        step: '1',
        value: '1',
      }),
      f('descricao', 'Descrição e requisitos', { type: 'textarea', maxLength: 2000 }),
      date('abertura', 'Data de abertura'),
      f('situacao', 'Situação da vaga', { options: ['ABERTA', 'PAUSADA', 'ENCERRADA'] }),
    ],
    columns: [
      ['titulo', 'Vaga'],
      ['departamentoId', 'Departamento', 'departamentos'],
      ['cargoId', 'Cargo', 'cargos'],
      ['quantidade', 'Posições'],
      ['abertura', 'Abertura', 'date'],
      ['situacao', 'Situação'],
    ],
  },
  {
    id: 'candidatos',
    title: 'Recrutamento',
    singular: 'candidato',
    description:
      'Triagem e acompanhamento dos candidatos. Aprovação não cria vínculo de funcionário automaticamente. Exclua dados quando não houver mais finalidade de retenção.',
    fields: [
      f('vagaId', 'Vaga', { source: 'vagas' }),
      f('nome', 'Nome do candidato', { maxLength: 150 }),
      f('email', 'E-mail do candidato', { type: 'email', maxLength: 120 }),
      f('telefone', 'Telefone', { optional: true, maxLength: 30 }),
      f('etapa', 'Etapa da seleção', {
        options: ['INSCRITO', 'TRIAGEM', 'ENTREVISTA', 'APROVADO', 'REPROVADO', 'DESISTENTE'],
      }),
      { ...note, label: 'Observações da seleção', maxLength: 1000 },
    ],
    columns: [
      ['nome', 'Candidato'],
      ['vagaId', 'Vaga', 'vagas'],
      ['email', 'E-mail'],
      ['etapa', 'Etapa'],
    ],
  },
];
const api = <T,>(path: string, options?: RequestInit) =>
  requestApi<T>(`/v1/workspace/rh${path}`, options);
const currency = (value: unknown) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const label = (value: string) =>
  value === 'true' ? 'Sim' : value === 'false' ? 'Não' : value.replace(/_/g, ' ');

function RhModal({
  resource,
  title,
  warning,
  fields,
  initial,
  editing,
  onSave,
  onClose,
  busy,
}: {
  resource: string;
  title: string;
  warning?: string;
  fields: Field[];
  initial: RecordData;
  editing?: boolean;
  onSave: (body: RecordData) => Promise<void>;
  onClose: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((field) => [
        field.name,
        initial[field.name] == null
          ? field.value || (field.options ? field.options[0] : '')
          : String(initial[field.name]),
      ]),
    ),
  );
  const [error, setError] = useState('');
  const planningFields = fields.map((field) => ({
    ...field,
    futureOnly:
      (resource === 'afastamentos' &&
        values.tipo === 'FERIAS' &&
        ['inicio', 'fim'].includes(field.name)) ||
      (resource === 'vagas' && values.situacao === 'ABERTA' && field.name === 'abertura'),
  }));
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>('input,select,button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)',
        ) || [],
      );
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, [busy]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const body: RecordData = {};
    for (const field of fields) {
      let value: string | number | boolean | null = values[field.name]?.trim() || null;
      if (field.name === 'departamentoId' && values.tipo === 'DEPARTAMENTO') value = null;
      if (value != null && (field.source || field.type === 'number')) value = Number(value);
      if (field.name === 'ativo') value = value === 'true';
      body[field.name] = value;
    }
    const dateError = planningError(planningFields, body, initial);
    if (dateError) {
      setError(dateError);
      return;
    }
    try {
      await onSave(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    }
  }
  return (
    <div className="ws-modal-backdrop">
      <div
        className="ws-modal rh-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rh-modal-title"
        ref={ref}
      >
        <header>
          <h2 id="rh-modal-title">{title}</h2>
          <button
            type="button"
            aria-label="Fechar formulário de RH"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        {warning && (
          <p className="ws-help" role="note">
            {warning}
          </p>
        )}
        <form onSubmit={submit}>
          {error && (
            <div className="ws-alert" role="alert">
              {error}
            </div>
          )}
          <div className="rh-fields">
            {fields
              .filter(
                (field) => !(field.name === 'departamentoId' && values.tipo === 'DEPARTAMENTO'),
              )
              .map((field) => (
                <label key={field.name} className={field.type === 'textarea' ? 'rh-wide' : ''}>
                  <span>
                    {field.label}
                    {field.optional ? ' (opcional)' : ''}
                  </span>
                  {field.source ? (
                    <RhSelect
                      field={field}
                      value={values[field.name]}
                      context={
                        field.source === 'cargos'
                          ? {
                              param: 'departamentoId',
                              value: values.departamentoId,
                              label: 'departamento',
                            }
                          : field.source === 'equipes'
                            ? {
                                param: 'projetoObraId',
                                value: values.projetoObraId,
                                label: 'obra de alocação',
                              }
                            : undefined
                      }
                      onChange={(value) =>
                        setValues((v) => ({
                          ...v,
                          [field.name]: value,
                          ...(field.name === 'departamentoId' ? { cargoId: '' } : {}),
                          ...(field.name === 'projetoObraId' ? { equipeId: '' } : {}),
                        }))
                      }
                      disabled={busy}
                    />
                  ) : field.options ? (
                    <select
                      name={field.name}
                      aria-label={field.label}
                      value={values[field.name]}
                      disabled={busy || (editing && field.readonly)}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    >
                      {field.options.map((o) => (
                        <option value={o} key={o}>
                          {label(o)}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      aria-label={field.label}
                      name={field.name}
                      required={!field.optional}
                      maxLength={field.maxLength}
                      value={values[field.name]}
                      disabled={busy}
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    />
                  ) : (
                    <input
                      aria-label={field.label}
                      name={field.name}
                      type={field.type || 'text'}
                      required={!field.optional}
                      min={
                        planningMinimum(
                          planningFields.find((item) => item.name === field.name)!,
                          values,
                          initial,
                        ) ?? field.min
                      }
                      max={
                        field.name === 'nascimento' ||
                        ((resource === 'ponto' || title.startsWith('Registrar desligamento')) &&
                          field.name === 'data')
                          ? localCalendarDate()
                          : field.max
                      }
                      step={field.step}
                      maxLength={field.maxLength}
                      readOnly={editing && field.readonly}
                      disabled={busy}
                      value={values[field.name]}
                      autoComplete="off"
                      onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                    />
                  )}
                </label>
              ))}
          </div>
          <footer>
            <button type="button" className="ws-secondary" disabled={busy} onClick={onClose}>
              Cancelar
            </button>
            <button className="ws-primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar RH'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

type Action = {
  title: string;
  warning?: string;
  path: string;
  method?: string;
  fields: Field[];
  initial: RecordData;
  editing?: boolean;
  hidden?: RecordData;
};
type Statement = {
  funcionario: string;
  matricula: string;
  competencia: string;
  situacao: string;
  lancamentos: RecordData[];
  proventos: number;
  descontos: number;
  liquido: number;
};
export function HumanResources() {
  const [initialAccess, setInitialAccess] = useState<InitialAccess | null>(null);
  const [sectionId, setSectionId] = useState('funcionarios');
  const section = sections.find((s) => s.id === sectionId) || sections[0];
  const dossierMode = sectionId === 'documentos-rh' || sectionId === 'historico';
  const [rows, setRows] = useState<RecordData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [payrollFilter, setPayrollFilter] = useState('');
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [names, setNames] = useState<Record<string, Option[]>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [revision, setRevision] = useState(0);
  const [statement, setStatement] = useState<Statement | null>(null);
  const [statementEmployee, setStatementEmployee] = useState('');
  const [statementPayroll, setStatementPayroll] = useState('');
  useEffect(() => {
    if (dossierMode) return;
    const c = new AbortController();
    setLoading(true);
    setError('');
    const timer = setTimeout(
      async () => {
        try {
          const result = await api<{ items: RecordData[]; total: number }>(
            `/registros/${sectionId}?page=${page}&size=25&q=${encodeURIComponent(query)}${section.employee && employeeFilter ? `&funcionarioId=${employeeFilter}` : ''}${sectionId === 'lancamentos' && payrollFilter ? `&folhaId=${payrollFilter}` : ''}`,
            { signal: c.signal },
          );
          if (!c.signal.aborted) {
            setRows(result.items);
            setTotal(result.total);
          }
        } catch (e) {
          if (!c.signal.aborted) {
            setRows([]);
            setError(e instanceof Error ? e.message : 'Falha na consulta.');
          }
        } finally {
          if (!c.signal.aborted) setLoading(false);
        }
      },
      query ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [sectionId, page, query, employeeFilter, payrollFilter, revision]);
  useEffect(() => {
    const c = new AbortController();
    api<Record<string, number>>('/resumo', { signal: c.signal })
      .then(setSummary)
      .catch(() => {});
    for (const source of ['funcionarios', 'departamentos', 'cargos', 'folhas', 'vagas'])
      api<Option[]>(`/opcoes/${source}`, { signal: c.signal })
        .then((value) => {
          if (!c.signal.aborted) setNames((n) => ({ ...n, [source]: value }));
        })
        .catch(() => {});
    return () => c.abort();
  }, [revision]);
  function change(id: string) {
    setSectionId(id);
    setPage(0);
    setQuery('');
    setError('');
    setNotice('');
    setStatement(null);
  }
  const refresh = () => setRevision((r) => r + 1);
  async function edit(row: RecordData) {
    setBusy(true);
    setError('');
    try {
      const detail = await api<RecordData>(`/registros/${sectionId}/${row.id}`);
      setAction({
        title: `Editar ${section.singular}`,
        path: `/${sectionId}/${row.id}?versao=${detail.versao}`,
        method: 'PUT',
        fields:
          sectionId === 'funcionarios'
            ? [
                ...section.fields,
                f('motivoAlteracao', 'Motivo da alteração funcional', {
                  type: 'textarea',
                  optional: true,
                  maxLength: 500,
                }),
              ]
            : section.fields,
        initial: detail,
        editing: true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao abrir cadastro.');
    } finally {
      setBusy(false);
    }
  }
  async function save(body: RecordData) {
    if (!action || busy) return;
    setBusy(true);
    try {
      const result = await api<{ acessoInicial?: InitialAccess }>(action.path, {
        method: action.method || 'POST',
        ...(action.method === 'DELETE'
          ? {}
          : { body: JSON.stringify({ ...body, ...action.hidden }) }),
      });
      setAction(null);
      if (result?.acessoInicial) setInitialAccess(result.acessoInicial);
      setNotice('Operação de RH registrada.');
      refresh();
    } finally {
      setBusy(false);
    }
  }
  const versionAction = (
    row: RecordData,
    title: string,
    suffix: string,
    fields: Field[] = [],
    hidden: RecordData = {},
    warning?: string,
  ) =>
    setAction({
      title,
      warning,
      path: `/${sectionId}/${row.id}/${suffix}`,
      fields,
      initial: {},
      hidden: { versao: row.versao, ...hidden },
    });
  function renderValue(row: RecordData, field: string, type?: string) {
    const value = row[field];
    if (value == null || value === '') return 'Não informado';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (type === 'money') return currency(value);
    if (type === 'minutes') return `${Math.floor(Number(value) / 60)}h ${Number(value) % 60}min`;
    if (type === 'date') return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
    if (type) return names[type]?.find((o) => o.id === Number(value))?.nome || `Registro #${value}`;
    return label(String(value));
  }
  const editable = (row: RecordData) =>
    !['folhas', 'lancamentos'].includes(sectionId) &&
    (sectionId !== 'ponto' || row.situacao === 'PENDENTE') &&
    (sectionId !== 'afastamentos' || row.situacao === 'SOLICITADO');
  return (
    <div className="rh-module">
      <div className="ws-page-heading">
        <div>
          <p className="ws-eyebrow">GESTÃO DE PESSOAS</p>
          <h1>Recursos humanos</h1>
          <p>Dados da sua empresa. Acesso restrito à administração e ao perfil RH.</p>
        </div>
        <Users size={32} />
      </div>
      <div className="rh-metrics" aria-label="Resumo de RH">
        {[
          ['funcionariosAtivos', 'Funcionários ativos'],
          ['solicitacoesPendentes', 'Ausências pendentes'],
          ['validadesAte30Dias', 'Validades até 30 dias ou vencidas'],
          ['vagasAbertas', 'Vagas abertas'],
        ].map(([key, title]) => (
          <div key={key}>
            <span>{title}</span>
            <strong>{summary[key] ?? '—'}</strong>
          </div>
        ))}
      </div>
      <nav className="rh-tabs" aria-label="Seções de RH">
        {[
          ...sections,
          { id: 'documentos-rh', title: 'Documentos privados' },
          { id: 'historico', title: 'Histórico funcional' },
        ].map((s) => (
          <button
            key={s.id}
            aria-current={sectionId === s.id ? 'page' : undefined}
            className={sectionId === s.id ? 'is-active' : ''}
            onClick={() => change(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>
      {dossierMode ? (
        <RhDossie key={sectionId} mode={sectionId === 'historico' ? 'historico' : 'documentos'} />
      ) : (
        <section className="rh-section" aria-labelledby="rh-section-title">
          <div className="ws-page-heading">
            <div>
              <h2 id="rh-section-title">{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <button
              className="ws-primary"
              disabled={busy}
              onClick={() =>
                setAction({
                  title: `Cadastrar ${section.singular}`,
                  path: `/${sectionId}`,
                  fields: section.fields,
                  initial:
                    sectionId === 'lancamentos'
                      ? { folhaId: payrollFilter || null, funcionarioId: employeeFilter || null }
                      : {},
                })
              }
            >
              <Plus size={16} />
              Cadastrar {section.singular}
            </button>
          </div>
          {error && (
            <div className="ws-alert" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <p role="status" className="rh-notice">
              {notice}
            </p>
          )}
          <div className="rh-filters">
            {['funcionarios', 'estrutura', 'vagas', 'candidatos'].includes(sectionId) && (
              <label>
                <span>
                  <Search size={14} />
                  Buscar por nome
                </span>
                <input
                  aria-label="Buscar registros de RH"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
            )}
            {section.employee && (
              <label>
                <span>Filtrar funcionário</span>
                <RhSelect
                  field={{ ...employee, label: 'Filtrar funcionário', optional: true }}
                  value={employeeFilter}
                  onChange={(v) => {
                    setEmployeeFilter(v);
                    setPage(0);
                  }}
                />
              </label>
            )}
            {sectionId === 'lancamentos' && (
              <label>
                <span>Filtrar competência</span>
                <RhSelect
                  field={f('folhaId', 'Filtrar competência', { source: 'folhas', optional: true })}
                  value={payrollFilter}
                  onChange={(v) => {
                    setPayrollFilter(v);
                    setPage(0);
                  }}
                />
              </label>
            )}
            <button className="ws-secondary" disabled={loading} onClick={refresh}>
              <RefreshCw size={16} />
              Atualizar RH
            </button>
          </div>
          {loading ? (
            <p role="status">Consultando registros…</p>
          ) : rows.length === 0 ? (
            <div className="rh-empty">
              <Users size={28} />
              <h3>Nenhum registro encontrado</h3>
              <p>
                Cadastre os dados reais da empresa ou ajuste os filtros. Para começar, crie
                departamentos e cargos.
              </p>
            </div>
          ) : (
            <div className="rh-table-scroll" tabIndex={0} role="region" aria-label="Tabela de RH">
              <table>
                <caption>{section.title} da empresa</caption>
                <thead>
                  <tr>
                    {section.columns.map(([field, title]) => (
                      <th key={field}>{title}</th>
                    ))}
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={String(row.id)}>
                      {section.columns.map(([field, , type]) => (
                        <td key={field}>{renderValue(row, field, type)}</td>
                      ))}
                      <td>
                        <div className="rh-actions">
                          {editable(row) && (
                            <button disabled={busy} onClick={() => edit(row)}>
                              Editar
                            </button>
                          )}
                          {sectionId === 'funcionarios' && row.situacao === 'ATIVO' && (
                            <button
                              onClick={() =>
                                versionAction(
                                  row,
                                  `Registrar desligamento de ${row.nome}`,
                                  'desligar',
                                  [date('data', 'Data de desligamento')],
                                  {},
                                  'O vínculo ficará como desligado e a conta de acesso será desativada. O histórico será preservado. Esta ação não calcula nem paga uma rescisão.',
                                )
                              }
                            >
                              Desligar
                            </button>
                          )}
                          {sectionId === 'ponto' && row.situacao === 'PENDENTE' && (
                            <button
                              onClick={() =>
                                versionAction(row, 'Aprovar jornada conferida', 'aprovar')
                              }
                            >
                              Aprovar
                            </button>
                          )}
                          {sectionId === 'afastamentos' &&
                            row.situacao === 'SOLICITADO' &&
                            ['APROVADO', 'REJEITADO'].map((state) => (
                              <button
                                key={state}
                                onClick={() =>
                                  versionAction(
                                    row,
                                    `${state === 'APROVADO' ? 'Aprovar' : 'Rejeitar'} solicitação`,
                                    'decisao',
                                    [],
                                    { situacao: state },
                                  )
                                }
                              >
                                {state === 'APROVADO' ? 'Aprovar' : 'Rejeitar'}
                              </button>
                            ))}
                          {sectionId === 'afastamentos' && row.situacao === 'APROVADO' && (
                            <button
                              onClick={() =>
                                versionAction(row, 'Cancelar ausência aprovada', 'decisao', [], {
                                  situacao: 'CANCELADO',
                                })
                              }
                            >
                              Cancelar ausência
                            </button>
                          )}
                          {sectionId === 'folhas' && (
                            <button
                              onClick={() => {
                                setPayrollFilter(String(row.id));
                                change('lancamentos');
                              }}
                            >
                              Ver lançamentos
                            </button>
                          )}
                          {sectionId === 'folhas' && row.situacao === 'ABERTA' && (
                            <button
                              onClick={() =>
                                versionAction(row, 'Fechar folha após conferência', 'fechar')
                              }
                            >
                              Fechar folha
                            </button>
                          )}
                          {sectionId === 'folhas' && row.situacao === 'FECHADA' && (
                            <button
                              onClick={() =>
                                versionAction(row, 'Registrar pagamento já realizado', 'pagar', [
                                  date('data', 'Data do pagamento'),
                                ])
                              }
                            >
                              Registrar pagamento
                            </button>
                          )}
                          {['candidatos', 'lancamentos'].includes(sectionId) && (
                            <button
                              onClick={() =>
                                setAction({
                                  title: `Excluir ${section.singular}? Esta operação remove o registro.`,
                                  path: `/${sectionId}/${row.id}?versao=${row.versao}`,
                                  method: 'DELETE',
                                  fields: [],
                                  initial: {},
                                })
                              }
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="rh-pagination">
            <span>
              {total} registro(s) · página {page + 1}
            </span>
            <button
              aria-label="Página anterior RH"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              aria-label="Próxima página RH"
              disabled={(page + 1) * 25 >= total || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}
      {sectionId === 'folhas' && (
        <section className="rh-section">
          <h2>Demonstrativo individual</h2>
          <p>
            Espelho administrativo dos lançamentos informados; não é recibo fiscal ou comprovante de
            transferência.
          </p>
          <div className="rh-filters">
            <label>
              <span>Competência do demonstrativo</span>
              <RhSelect
                field={f('folhaId', 'Competência do demonstrativo', { source: 'folhas' })}
                value={statementPayroll}
                onChange={setStatementPayroll}
              />
            </label>
            <label>
              <span>Funcionário do demonstrativo</span>
              <RhSelect
                field={{ ...employee, label: 'Funcionário do demonstrativo' }}
                value={statementEmployee}
                onChange={setStatementEmployee}
              />
            </label>
            <button
              className="ws-secondary"
              disabled={!statementEmployee || !statementPayroll || busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  setStatement(
                    await api<Statement>(
                      `/folhas/${statementPayroll}/demonstrativo/${statementEmployee}`,
                    ),
                  );
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Erro no demonstrativo.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Consultar demonstrativo
            </button>
          </div>
          {statement && (
            <article className="rh-statement">
              <h3>
                {statement.funcionario} · {statement.matricula}
              </h3>
              <p>
                Competência {statement.competencia} · {statement.situacao}
              </p>
              <ul>
                {statement.lancamentos.map((row) => (
                  <li key={String(row.id)}>
                    {row.codigo} · {row.descricao} · {row.natureza}:{' '}
                    <strong>{currency(row.valor)}</strong>
                  </li>
                ))}
              </ul>
              <p>
                Proventos: {currency(statement.proventos)} · Descontos:{' '}
                {currency(statement.descontos)}
              </p>
              <strong>Líquido informado: {currency(statement.liquido)}</strong>
            </article>
          )}
        </section>
      )}
      {action && (
        <RhModal
          resource={action.path.split('/')[1]}
          key={action.path}
          title={action.title}
          warning={action.warning}
          fields={action.fields.map((field) =>
            action.path === '/funcionarios' && field.name === 'email'
              ? { ...field, optional: false }
              : field,
          )}
          initial={action.initial}
          editing={action.editing}
          onSave={save}
          onClose={() => setAction(null)}
          busy={busy}
        />
      )}
      {initialAccess && (
        <InitialAccessDialog access={initialAccess} onClose={() => setInitialAccess(null)} />
      )}
    </div>
  );
}

type InitialAccess = { usuarioId: number; email: string; senha: string; perfil: string };
function InitialAccessDialog({ access, onClose }: { access: InitialAccess; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="ws ws-form-dialog"
      aria-labelledby="rh-initial-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <section className="ws-modal">
        <h2 id="rh-initial-title">Acesso do funcionário criado</h2>
        <p>
          Compartilhe estes dados com o funcionário por um canal privado. A senha aparece somente
          agora e deverá ser trocada no primeiro acesso.
        </p>
        <label>
          Login (e-mail)
          <input readOnly value={access.email} onFocus={(event) => event.currentTarget.select()} />
        </label>
        <label>
          Senha inicial
          <input
            readOnly
            autoComplete="off"
            type={visible ? 'text' : 'password'}
            value={access.senha}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
        <button
          className="ws-secondary"
          aria-label={visible ? 'Ocultar senha inicial' : 'Visualizar senha inicial'}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}{' '}
          {visible ? 'Ocultar senha' : 'Visualizar senha'}
        </button>
        <p>
          Perfil inicial: Colaborador. Permissões de gestão são concedidas separadamente pelo
          administrador.
        </p>
        <footer>
          <button className="ws-primary" onClick={onClose}>
            Concluir e fechar
          </button>
        </footer>
      </section>
    </dialog>
  );
}
