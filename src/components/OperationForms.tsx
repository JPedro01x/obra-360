import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE_URL, requestApi } from '../services/http';

type Field = {
  name: string;
  label: string;
  type?: string;
  source?: string;
  options?: [string, string][];
  min?: number;
  max?: number;
  step?: string;
  maxLength?: number;
  optional?: boolean;
  value?: string;
};
export type OperationDefinition = {
  title: string;
  path: string;
  method?: string;
  fields: Field[];
  roles: string[];
  hidden?: Record<string, unknown>;
  multipart?: boolean;
  portal?: boolean;
  success?: string;
  logout?: boolean;
};
const managers = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO'];
const commercial = ['SUPER_ADMIN', 'GERENTE_OBRA', 'FINANCEIRO', 'INCORPORADOR'];
const project: Field = { name: 'projetoObraId', label: 'Empreendimento', source: 'projetos' };
const text = (name: string, label: string, maxLength = 150): Field => ({ name, label, maxLength });
const number = (name: string, label: string, min = 0, step = '0.01', value = ''): Field => ({
  name,
  label,
  type: 'number',
  min,
  step,
  value,
});
const source = (name: string, label: string, resource: string): Field => ({
  name,
  label,
  source: resource,
});
const choice = (name: string, label: string, values: string[], value?: string): Field => ({
  name,
  label,
  options: values.map((v) => [v, v.replace(/_/g, ' ')]),
  value,
});
const date = (name: string, label: string): Field => ({ name, label, type: 'date' });

export const createOperations: Record<string, OperationDefinition> = {
  acessos: {
    title: 'Novo acesso externo',
    path: '/acessos',
    roles: ['SUPER_ADMIN'],
    fields: [
      source('usuarioId', 'Usuário externo', 'usuarios'),
      source('projetoObraId', 'Empreendimento', 'projetos'),
      {
        ...source('unidadeImobiliariaId', 'Unidade (obrigatória para cliente)', 'unidades'),
        optional: true,
      },
      {
        ...source('fornecedorB2bId', 'Fornecedor (obrigatório para parceiro)', 'fornecedores'),
        optional: true,
      },
    ],
  },
  equipes: {
    title: 'Nova equipe',
    path: '/equipes',
    roles: [...managers, 'MESTRE_OBRA'],
    fields: [
      project,
      text('nomeEquipe', 'Nome da equipe', 100),
      text('especialidade', 'Especialidade', 100),
      source('liderEncarregadoId', 'Líder da equipe', 'lideres'),
      number('quantidadeOperarios', 'Quantidade de profissionais', 1, '1', '1'),
    ],
  },
  estoque: {
    title: 'Novo material',
    path: '/estoque',
    roles: [...managers, 'ALMOXARIFE'],
    fields: [
      project,
      text('sku', 'Código do material (SKU)', 50),
      text('nome', 'Nome do material'),
      text('categoria', 'Categoria', 80),
      text('unidadeMedida', 'Unidade de medida', 20),
      number('estoqueMinimo', 'Estoque mínimo', 0, '0.0001', '0'),
      number('custoUnitarioMedio', 'Custo unitário (R$)', 0, '0.01', '0'),
    ],
    success: 'Material cadastrado. Registre uma entrada para informar o saldo recebido.',
  },
  fornecedores: {
    title: 'Novo fornecedor',
    path: '/fornecedores',
    roles: commercial,
    fields: [
      text('razaoSocial', 'Razão social', 255),
      text('cnpj', 'CNPJ (sem pontuação)', 14),
      choice('categoriaFornecimento', 'Categoria', ['INSUMOS', 'FROTAS', 'SERVICOS']),
    ],
  },
  contratos: {
    title: 'Novo contrato',
    path: '/contratos',
    roles: commercial,
    fields: [
      project,
      source('fornecedorB2bId', 'Fornecedor', 'fornecedores'),
      text('numeroContrato', 'Número do contrato', 50),
      number('valorTotal', 'Valor total (R$)'),
      number('retencaoTecnicaPct', 'Retenção técnica (%)', 0, '0.01', '0'),
      number('tempoLimiteSlaHoras', 'Prazo de atendimento (horas)', 1, '1', '48'),
      date('dataInicio', 'Início da vigência'),
      date('dataTermino', 'Término da vigência'),
    ],
  },
  ordens: {
    title: 'Nova ordem de serviço',
    path: '/ordens',
    roles: [...managers, 'MESTRE_OBRA'],
    fields: [
      source('contratoServicoId', 'Contrato', 'contratos'),
      source('equipeTrabalhoId', 'Equipe', 'equipes'),
      { name: 'descricao', label: 'Descrição do serviço', type: 'textarea', maxLength: 10000 },
      choice('prioridade', 'Prioridade', ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'], 'MEDIA'),
      { name: 'dataLimiteSla', label: 'Prazo de atendimento', type: 'datetime-local' },
    ],
  },
  movimentacoes: {
    title: 'Movimentar estoque',
    path: '/movimentacoes',
    roles: [...managers, 'ALMOXARIFE'],
    fields: [
      source('itemEstoqueId', 'Material', 'estoque'),
      choice('tipoMovimentacao', 'Tipo', ['ENTRADA', 'SAIDA']),
      number('quantidade', 'Quantidade', 0.0001, '0.0001'),
    ],
  },
  cronograma: {
    title: 'Nova etapa',
    path: '/cronograma',
    roles: managers,
    fields: [
      project,
      text('nomeEtapa', 'Nome da etapa', 200),
      number('ordemExecucao', 'Ordem de execução', 1, '1', '1'),
      date('dataInicioPrevista', 'Início previsto'),
      date('dataFimPrevista', 'Fim previsto'),
    ],
  },
  qualidade: {
    title: 'Nova ocorrência',
    path: '/qualidade',
    roles: managers,
    fields: [
      project,
      text('titulo', 'Título da ocorrência', 200),
      source('responsavelId', 'Responsável', 'usuarios'),
      text('normaRegulamentadora', 'Norma ou referência', 30),
      choice('grauSeveridade', 'Severidade', ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
    ],
  },
  unidades: {
    title: 'Nova unidade',
    path: '/unidades',
    roles: ['SUPER_ADMIN', 'GERENTE_OBRA', 'INCORPORADOR'],
    fields: [
      project,
      text('codigoUnidade', 'Código da unidade', 30),
      number('areaPrivativaM2', 'Área privativa (m²)', 0.0001, '0.0001'),
      number('valorTabela', 'Valor de tabela (R$)'),
    ],
  },
  cotacoes: {
    title: 'Nova cotação',
    path: '/cotacoes',
    roles: commercial,
    fields: [
      source('fornecedorB2bId', 'Fornecedor', 'fornecedores'),
      text('codigoCotacao', 'Código da cotação', 30),
      number('valorProposta', 'Valor da proposta (R$)'),
      number('prazoEntregaDias', 'Prazo de entrega (dias)', 0, '1', '0'),
    ],
  },
  garantias: {
    title: 'Novo chamado de garantia',
    path: '/garantias',
    roles: managers,
    fields: [
      source('unidadeImobiliariaId', 'Unidade', 'unidades'),
      source('usuarioClienteId', 'Titular do chamado', 'usuarios'),
      text('categoriaDefeito', 'Categoria do defeito', 50),
      {
        name: 'descricaoDefeito',
        label: 'Descrição do defeito',
        type: 'textarea',
        maxLength: 10000,
      },
    ],
  },
  documentos: {
    title: 'Enviar documento',
    path: '/documentos',
    roles: [...managers, 'ARQUITETO'],
    multipart: true,
    fields: [
      project,
      text('titulo', 'Título do documento', 255),
      text('tipoDocumento', 'Tipo do documento', 50),
      { name: 'arquivo', label: 'Arquivo (até 20 MB)', type: 'file' },
    ],
  },
};

export const passwordOperation: OperationDefinition = {
  title: 'Alterar minha senha',
  path: '/minha-senha',
  method: 'PUT',
  roles: [],
  logout: true,
  fields: [
    { name: 'senhaAtual', label: 'Senha atual', type: 'password' },
    {
      name: 'novaSenha',
      label: 'Nova senha (mínimo de 12 caracteres)',
      type: 'password',
      min: 12,
      maxLength: 72,
    },
  ],
};

export function rowOperations(
  resource: string,
  row: Record<string, unknown>,
  role: string,
): OperationDefinition[] {
  const id = String(row.id);
  const actions: OperationDefinition[] = [];
  const permitted = (roles: string[]) => roles.includes(role);
  if (resource === 'acessos' && role === 'SUPER_ADMIN')
    actions.push({
      title: 'Revogar acesso',
      path: `/acessos/${id}`,
      method: 'DELETE',
      roles: [],
      fields: [],
    });
  if (resource === 'projetos' && permitted(['SUPER_ADMIN', 'GERENTE_OBRA', 'INCORPORADOR']))
    actions.push({
      title: 'Editar empreendimento',
      path: `/projetos/${id}`,
      method: 'PUT',
      roles: [],
      fields: [
        { ...text('nome', 'Nome do empreendimento'), value: String(row.nome) },
        { ...source('engenheiroResponsavelId', 'Engenheiro responsável', 'engenheiros') },
        number('areaTotalM2', 'Área total (m²)', 0.01, '0.01', String(row.areaTotalM2)),
        number('vgvEstimado', 'VGV estimado (R$)', 0, '0.01', String(row.vgvEstimado)),
        { ...date('dataInicio', 'Data de início'), value: String(row.dataInicio) },
        { ...date('dataPrevisaoFim', 'Entrega prevista'), value: String(row.dataPrevisaoFim) },
      ],
    });
  if (resource === 'estoque' && permitted([...managers, 'ALMOXARIFE']))
    actions.push({
      title: 'Editar material',
      path: `/estoque/${id}`,
      method: 'PATCH',
      roles: [],
      fields: [
        { ...text('nome', 'Nome do material'), value: String(row.nome) },
        { ...text('categoria', 'Categoria', 80), value: String(row.categoria) },
        number('estoqueMinimo', 'Estoque mínimo', 0, '0.0001', String(row.estoqueMinimo)),
        number(
          'custoUnitarioMedio',
          'Custo unitário (R$)',
          0,
          '0.01',
          String(row.custoUnitarioMedio),
        ),
      ],
    });
  if (resource === 'estoque' && permitted([...managers, 'ALMOXARIFE']))
    actions.push({
      ...createOperations.movimentacoes,
      fields: createOperations.movimentacoes.fields.filter((f) => f.name !== 'itemEstoqueId'),
      hidden: { itemEstoqueId: row.id },
    });
  if (resource === 'ordens') {
    if (permitted([...managers, 'MESTRE_OBRA'])) {
      const states =
        row.statusOs === 'ABERTO'
          ? ['EM_ANDAMENTO', 'CANCELADO']
          : row.statusOs === 'EM_ANDAMENTO'
            ? ['CONCLUIDO', 'CANCELADO']
            : [];
      if (states.length)
        actions.push({
          title: 'Atualizar ordem',
          path: `/ordens/${id}/status`,
          method: 'PATCH',
          roles: [],
          fields: [choice('status', 'Nova situação', states)],
        });
    }
    if (
      ['ABERTO', 'EM_ANDAMENTO'].includes(String(row.statusOs)) &&
      permitted([...managers, 'ALMOXARIFE'])
    )
      actions.push({
        title: 'Registrar consumo',
        path: '/movimentacoes',
        roles: [],
        hidden: { ordemServicoId: row.id, tipoMovimentacao: 'CONSUMO_OS' },
        fields: [
          source('itemEstoqueId', 'Material da obra', 'estoque'),
          number('quantidade', 'Quantidade consumida', 0.001, '0.001'),
        ],
      });
  }
  if (resource === 'cronograma' && permitted(managers))
    actions.push({
      title: 'Informar avanço',
      path: `/cronograma/${id}/progresso`,
      method: 'PATCH',
      roles: [],
      fields: [
        {
          ...number(
            'percentualExecutado',
            'Execução (%)',
            0,
            '0.01',
            String(row.percentualExecutado),
          ),
          max: 100,
        },
      ],
    });
  if (resource === 'qualidade' && permitted(managers))
    actions.push({
      title: 'Atualizar ocorrência',
      path: `/qualidade/${id}/status`,
      method: 'PATCH',
      roles: [],
      fields: [
        choice(
          'status',
          'Plano de ação',
          ['PENDENTE', 'EM_ANDAMENTO', 'RESOLVIDO'],
          String(row.statusPlanoAcao),
        ),
      ],
    });
  if (resource === 'unidades' && permitted(['SUPER_ADMIN', 'GERENTE_OBRA', 'INCORPORADOR']))
    actions.push({
      title: 'Atualizar disponibilidade',
      path: `/unidades/${id}/status`,
      method: 'PATCH',
      roles: [],
      hidden: { situacaoEsperada: row.statusVenda },
      fields: [
        choice(
          'status',
          'Situação da unidade',
          ['DISPONIVEL', 'RESERVADO', 'VENDIDO'],
          String(row.statusVenda),
        ),
      ],
    });
  if (resource === 'garantias' && permitted(managers))
    actions.push({
      title: 'Atualizar chamado',
      path: `/garantias/${id}/status`,
      method: 'PATCH',
      roles: [],
      fields: [
        choice(
          'status',
          'Situação do chamado',
          ['ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO'],
          String(row.statusChamado),
        ),
      ],
    });
  if (resource === 'usuarios' && role === 'SUPER_ADMIN')
    actions.push({
      title: 'Editar usuário',
      path: `/usuarios/${id}`,
      method: 'PATCH',
      roles: [],
      fields: [
        { ...text('nome', 'Nome completo', 100), value: String(row.nome) },
        { ...text('email', 'E-mail', 120), type: 'email', value: String(row.email) },
        choice(
          'perfil',
          'Perfil de acesso',
          [
            'SUPER_ADMIN',
            'GERENTE_OBRA',
            'ENGENHEIRO',
            'ARQUITETO',
            'MESTRE_OBRA',
            'ALMOXARIFE',
            'FINANCEIRO',
            'RH',
            'AUDITOR',
            'INCORPORADOR',
            'CLIENTE',
            'FORNECEDOR',
            'CORRETOR',
            'LOCADOR_MAQUINAS',
            'INVESTIDOR',
          ],
          String(row.perfil),
        ),
        {
          name: 'ativo',
          label: 'Acesso da conta',
          options: [
            ['true', 'Ativo'],
            ['false', 'Desativado'],
          ],
          value: String(row.ativo),
        },
        {
          name: 'novaSenha',
          label: 'Redefinir senha (opcional, mínimo de 12 caracteres)',
          type: 'password',
          optional: true,
          min: 12,
          maxLength: 72,
        },
      ],
    });
  if (resource === 'documentos' && permitted([...managers, 'ARQUITETO']))
    actions.push({
      ...createOperations.documentos,
      title: 'Enviar nova versão',
      hidden: {
        projetoObraId: row.projetoObraId,
        documentoAnteriorId: row.id,
        titulo: row.titulo,
        tipoDocumento: row.tipoDocumento,
      },
      fields: [{ name: 'arquivo', label: 'Arquivo da nova versão (até 20 MB)', type: 'file' }],
    });
  return actions;
}

function Lookup({ field, disabled }: { field: Field; disabled: boolean }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{ id: number; nome: string }[]>([]);
  const [selected, setSelected] = useState<{ id: string; nome: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const id = useId();
  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(
      () =>
        requestApi<{ id: number; nome: string }[]>(
          `/v1/workspace/opcoes/${field.source}?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        )
          .then((value) => {
            if (current) {
              setOptions(value);
              setError('');
            }
          })
          .catch((e) => {
            if (current) setError(e.message);
          })
          .finally(() => {
            if (current) setLoading(false);
          }),
      200,
    );
    return () => {
      current = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [field.source, query]);
  return (
    <div className="ws-lookup">
      <label htmlFor={id}>{field.label}</label>
      <input
        aria-label={`Buscar ${field.label.toLowerCase()}`}
        placeholder="Buscar pelo nome…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
      />
      <select
        id={id}
        name={field.name}
        required={!field.optional}
        disabled={disabled}
        value={selected?.id || ''}
        onChange={(e) => {
          const found = options.find((o) => String(o.id) === e.target.value);
          setSelected(found ? { id: String(found.id), nome: found.nome } : null);
        }}
      >
        <option value="">{loading ? 'Carregando opções…' : 'Selecione uma opção'}</option>
        {selected && !options.some((o) => String(o.id) === selected.id) && (
          <option value={selected.id}>{selected.nome}</option>
        )}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome} · #{o.id}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="ws-field-error">
          {error}
        </span>
      )}
      {!loading && !error && !options.length && (
        <small>Nenhum cadastro encontrado. Cadastre o registro no módulo correspondente.</small>
      )}
      {options.length === 100 && <small>Exibindo até 100 opções. Refine a busca pelo nome.</small>}
    </div>
  );
}

export function OperationForm({
  definition,
  onClose,
  onSaved,
}: {
  definition: OperationDefinition;
  onClose: () => void;
  onSaved: (message: string, logout?: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [key] = useState(() => crypto.randomUUID());
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(form.entries());
    Object.assign(body, definition.hidden || {});
    for (const field of definition.fields) {
      if (field.type === 'datetime-local' && body[field.name])
        body[field.name] = new Date(String(body[field.name])).toISOString();
      if (field.name === 'ativo') body[field.name] = body[field.name] === 'true';
      if (field.name === 'cnpj')
        body[field.name] = String(body[field.name])
          .replace(/[.\/\-\s]/g, '')
          .toUpperCase();
      if (field.type === 'file' && (body[field.name] as File)?.size > 20 * 1024 * 1024) {
        setError('O arquivo excede o limite de 20 MB.');
        return;
      }
    }
    if (definition.path === '/movimentacoes') body.chaveOperacao = key;
    if (
      (body.dataTermino && body.dataInicio && String(body.dataTermino) < String(body.dataInicio)) ||
      (body.dataFimPrevista &&
        body.dataInicioPrevista &&
        String(body.dataFimPrevista) < String(body.dataInicioPrevista))
    ) {
      setError('A data final deve ser igual ou posterior ao início.');
      return;
    }
    let payload: BodyInit;
    if (definition.multipart) {
      const multipart = new FormData();
      for (const [name, value] of Object.entries(body))
        multipart.append(name, value instanceof File ? value : String(value));
      payload = multipart;
    } else payload = JSON.stringify(body);
    setSaving(true);
    try {
      await requestApi(`${definition.portal ? '/v1/portal' : '/v1/workspace'}${definition.path}`, {
        method: definition.method || 'POST',
        body: payload,
      });
      onSaved(definition.success || 'Operação concluída com sucesso.', definition.logout);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="ws ws-form-dialog"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      aria-labelledby="ws-operation-title"
      aria-label={definition.title}
    >
      <section className="ws-modal">
        <header>
          <h2 id="ws-operation-title">{definition.title}</h2>
          <button
            className="ws-icon-button"
            aria-label="Fechar formulário"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit}>
          {error && (
            <div className="ws-alert" role="alert">
              {error}
            </div>
          )}
          {definition.fields.map((field) =>
            field.source ? (
              <Lookup key={field.name} field={field} disabled={saving} />
            ) : (
              <label key={field.name}>
                {field.label}
                {field.options ? (
                  <select
                    aria-label={field.label}
                    name={field.name}
                    required={!field.optional}
                    defaultValue={field.value || ''}
                    disabled={saving}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {field.options.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    aria-label={field.label}
                    name={field.name}
                    required={!field.optional}
                    maxLength={field.maxLength}
                    disabled={saving}
                    rows={4}
                  />
                ) : (
                  <input
                    aria-label={field.label}
                    name={field.name}
                    type={field.type || 'text'}
                    required={!field.optional}
                    disabled={saving}
                    defaultValue={field.type === 'file' ? undefined : field.value}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    maxLength={field.maxLength}
                    minLength={field.type === 'password' ? field.min : undefined}
                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                  />
                )}
              </label>
            ),
          )}
          <footer>
            <button type="button" className="ws-secondary" disabled={saving} onClick={onClose}>
              Cancelar
            </button>
            <button className="ws-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </footer>
        </form>
      </section>
    </dialog>
  );
}

export async function downloadDocument(id: string, name: string) {
  const response = await fetch(`${API_BASE_URL}/v1/workspace/documentos/${id}/arquivo`, {
    headers: { Authorization: `Bearer ${sessionStorage.getItem('obra360_access_token') || ''}` },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(
      response.status === 404
        ? 'Arquivo indisponível nesta instalação.'
        : 'Não foi possível baixar o documento.',
    );
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function OperationalOverview({ revision }: { revision: number }) {
  const [data, setData] = useState<{
    ordensAbertas: number;
    ordensAtrasadas: number;
    materiaisAbaixoMinimo: number;
    custoConsumido: number;
  } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    requestApi<typeof data>('/v1/workspace/resumo')
      .then((d) => {
        if (current) {
          setData(d);
          setError('');
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [revision]);
  if (error)
    return (
      <div role="alert" className="ws-alert">
        Resumo operacional: {error}
      </div>
    );
  return (
    <section className="ws-operational-summary" aria-label="Acompanhamento operacional">
      {[
        ['Ordens abertas', data?.ordensAbertas],
        ['Ordens atrasadas', data?.ordensAtrasadas],
        ['Materiais abaixo do mínimo', data?.materiaisAbaixoMinimo],
        [
          'Custo de consumo',
          data
            ? data.custoConsumido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : undefined,
        ],
      ].map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value ?? '—'}</strong>
        </div>
      ))}
    </section>
  );
}
