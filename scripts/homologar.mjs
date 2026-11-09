import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readCredentials, writeCredentials } from './homologacao-credentials.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)),
  base = 'http://127.0.0.1:8080/api/v1';
const credentialPath = path.join(root, 'ACESSO-HOMOLOGACAO.local');
const manifestPath = path.join(root, 'obra360-backend', 'data', 'homologacao-manifest.json');
const permission = process.argv.includes('--criar-base-homologacao');
if (!permission)
  throw new Error(
    'Use --criar-base-homologacao para criar dados de teste, nunca dados de produção.',
  );
const password = () => `${randomBytes(18).toString('base64url')}aA9!`;
let credentials;
try {
  credentials = await readCredentials(root);
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  credentials = {
    aviso: 'CONTAS DE TESTE. NAO USAR EM PRODUCAO. Dados ficticios persistidos no banco local.',
    url: 'http://localhost:3000',
    contas: [
      { perfil: 'SUPER_ADMIN', email: 'admin@obra360.test.invalid', senha: password() },
      ...[
        'ENGENHEIRO',
        'RH',
        'ALMOXARIFE',
        'FINANCEIRO',
        'AUDITOR',
        'CLIENTE',
        'CORRETOR',
        'FORNECEDOR',
        'INVESTIDOR',
      ].map((perfil) => ({
        perfil,
        email: `${perfil.toLowerCase()}@obra360.test.invalid`,
        senha: password(),
      })),
    ],
  };
}
for (const perfil of [
  'INCORPORADOR',
  'GERENTE_OBRA',
  'ARQUITETO',
  'MESTRE_OBRA',
  'LOCADOR_MAQUINAS',
]) {
  if (!credentials.contas.some((a) => a.perfil === perfil))
    credentials.contas.push({
      perfil,
      email: `${perfil.toLowerCase()}@obra360.test.invalid`,
      senha: password(),
    });
}
let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  manifest = { ambiente: 'HOMOLOGACAO', registros: {}, chaves: {}, validacoes: [] };
}
async function persist() {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 });
}
async function api(route, method = 'GET', body, token, expected) {
  const response = await fetch(base + route, {
    method,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  const text = await response.text();
  if (expected !== undefined) return { status: response.status, text };
  if (!response.ok)
    throw new Error(
      `Falha ${method} ${route}: HTTP ${response.status}. Nenhuma correção destrutiva será executada.`,
    );
  return text ? JSON.parse(text) : null;
}
const setup = await api('/instalacao');
if (!setup.ambientes?.includes('HOMOLOGACAO'))
  throw new Error('A API precisa estar atualizada para identificar explicitamente a homologação.');
await writeCredentials(root, credentials);
if (setup.necessaria) {
  await api('/instalacao', 'POST', {
    nomeFantasia: 'Obra360 — Homologação',
    razaoSocial: 'Empresa de Homologação Obra360 — Dados de Teste',
    cnpj: '00000000000000',
    nome: 'Administrador de Homologação',
    email: credentials.contas[0].email,
    senha: credentials.contas[0].senha,
    ambienteDados: 'HOMOLOGACAO',
  });
}
const login = async (account) => {
  const result = await api('/auth/login', 'POST', { email: account.email, senha: account.senha });
  return result.token;
};
const adminToken = await login(credentials.contas[0]);
const session = await api('/workspace/sessao', 'GET', undefined, adminToken);
if (session.empresa.ambienteDados !== 'HOMOLOGACAO' || session.perfil !== 'SUPER_ADMIN')
  throw new Error('Recusado: esta rotina só pode alterar uma empresa marcada como HOMOLOGACAO.');
if (manifest.empresaId && manifest.empresaId !== session.empresa.id)
  throw new Error('O manifesto pertence a outra empresa. Operação interrompida.');
manifest.empresaId = session.empresa.id;
await persist();
async function step(key, route, body, method = 'POST', token = adminToken) {
  if (manifest.registros[key]) return manifest.registros[key];
  const result = await api(route, method, body, token);
  manifest.registros[key] = result || { concluido: true };
  await persist();
  console.log(`Registrado: ${key}`);
  return manifest.registros[key];
}
const ids = {};
for (const account of credentials.contas.slice(1)) {
  ids[account.perfil] = await step(`usuario_${account.perfil}`, '/auth/cadastrar', {
    nome: `${account.perfil.replace(/_/g, ' ')} de Teste`,
    email: account.email,
    senhaHash: account.senha,
    perfil: account.perfil,
    ativo: true,
  });
}
const today = '2026-11-06',
  end = '2027-02-04';
const project = await step('obra', '/workspace/projetos', {
  nome: 'Obra de Homologação — Casa Modelo',
  engenheiroResponsavelId: ids.ENGENHEIRO.id,
  areaTotalM2: 120,
  vgvEstimado: 300000,
  dataInicio: today,
  dataPrevisaoFim: end,
});
const supplier = await step('fornecedor', '/workspace/fornecedores', {
  cnpj: '00000000000001',
  razaoSocial: 'Fornecedor de Teste — Sem Identidade Empresarial Real',
  categoriaFornecimento: 'INSUMOS',
});
const contract = await step('contrato', '/workspace/contratos', {
  projetoObraId: project.id,
  fornecedorB2bId: supplier.id,
  numeroContrato: 'HML-CT-001',
  valorTotal: 10000,
  retencaoTecnicaPct: 0,
  tempoLimiteSlaHoras: 48,
  dataInicio: today,
  dataTermino: end,
});
const team = await step('equipe', '/workspace/equipes', {
  projetoObraId: project.id,
  liderEncarregadoId: ids.ENGENHEIRO.id,
  nomeEquipe: 'Equipe de Homologação',
  especialidade: 'ALVENARIA',
  quantidadeOperarios: 1,
});
const item = await step('material', '/workspace/estoque', {
  projetoObraId: project.id,
  sku: 'HML-MAT-001',
  nome: 'Material de Teste — Unidade de Consumo',
  categoria: 'INSUMOS',
  unidadeMedida: 'UN',
  estoqueMinimo: 5,
  custoUnitarioMedio: 50,
});
for (const key of ['entrada', 'consumo'])
  if (!manifest.chaves[key]) {
    manifest.chaves[key] = randomUUID();
    await persist();
  }
await step('entrada', '/workspace/movimentacoes', {
  itemEstoqueId: item.id,
  tipoMovimentacao: 'ENTRADA',
  quantidade: 10,
  chaveOperacao: manifest.chaves.entrada,
});
const order = await step('ordem', '/workspace/ordens', {
  contratoServicoId: contract.id,
  equipeTrabalhoId: team.id,
  descricao: 'Serviço de homologação — validação de consumo e encerramento',
  prioridade: 'MEDIA',
  dataLimiteSla: new Date(Date.now() + 172800000).toISOString(),
});
await step('consumo', '/workspace/movimentacoes', {
  itemEstoqueId: item.id,
  tipoMovimentacao: 'CONSUMO_OS',
  quantidade: 4,
  ordemServicoId: order.id,
  chaveOperacao: manifest.chaves.consumo,
});
await step(
  'ordem_andamento',
  `/workspace/ordens/${order.id}/status`,
  { status: 'EM_ANDAMENTO' },
  'PATCH',
);
await step(
  'ordem_concluida',
  `/workspace/ordens/${order.id}/status`,
  { status: 'CONCLUIDO' },
  'PATCH',
);
const stage = await step('etapa', '/workspace/cronograma', {
  projetoObraId: project.id,
  nomeEtapa: 'Etapa de Teste',
  ordemExecucao: 1,
  dataInicioPrevista: today,
  dataFimPrevista: end,
});
await step(
  'etapa_progresso',
  `/workspace/cronograma/${stage.id}/progresso`,
  { percentualExecutado: 20 },
  'PATCH',
);
await step('qualidade', '/workspace/qualidade', {
  projetoObraId: project.id,
  responsavelId: ids.ENGENHEIRO.id,
  titulo: 'Ocorrência de teste — verificar fluxo',
  normaRegulamentadora: 'REGISTRO_DE_TESTE',
  grauSeveridade: 'BAIXA',
});
const unit = await step('unidade_cliente', '/workspace/unidades', {
  projetoObraId: project.id,
  codigoUnidade: 'HML-101',
  areaPrivativaM2: 60,
  valorTabela: 150000,
});
await step(
  'unidade_vendida',
  `/workspace/unidades/${unit.id}/status`,
  { situacaoEsperada: 'DISPONIVEL', status: 'VENDIDO' },
  'PATCH',
);
const available = await step('unidade_corretor', '/workspace/unidades', {
  projetoObraId: project.id,
  codigoUnidade: 'HML-102',
  areaPrivativaM2: 60,
  valorTabela: 150000,
});
for (const role of ['CLIENTE', 'CORRETOR', 'INVESTIDOR', 'FORNECEDOR'])
  await step(`vinculo_${role}`, '/workspace/acessos', {
    usuarioId: ids[role].id,
    projetoObraId: project.id,
    ...(role === 'CLIENTE' ? { unidadeImobiliariaId: unit.id } : {}),
    ...(role === 'FORNECEDOR' ? { fornecedorB2bId: supplier.id } : {}),
  });
const accounts = Object.fromEntries(credentials.contas.map((a) => [a.perfil, a]));
const clientToken = await login(accounts.CLIENTE),
  brokerToken = await login(accounts.CORRETOR),
  supplierToken = await login(accounts.FORNECEDOR),
  hrToken = await login(accounts.RH),
  engineerToken = await login(accounts.ENGENHEIRO);
await step(
  'chamado_cliente',
  '/portal/chamados',
  {
    unidadeId: unit.id,
    categoria: 'TESTE',
    descricao: 'Chamado de homologação — sem defeito real informado',
  },
  'POST',
  clientToken,
);
await step(
  'reserva_corretor',
  `/portal/unidades/${available.id}/reservar`,
  {},
  'POST',
  brokerToken,
);
const binding = manifest.registros.vinculo_FORNECEDOR;
await step(
  'proposta_fornecedor',
  '/portal/propostas',
  { acessoId: binding.id, valor: 500, prazoDias: 5 },
  'POST',
  supplierToken,
);
const department = await step('departamento', '/workspace/rh/estrutura', {
  tipo: 'DEPARTAMENTO',
  nome: 'Departamento de Teste',
  ativo: true,
});
const job = await step('cargo', '/workspace/rh/estrutura', {
  tipo: 'CARGO',
  nome: 'Cargo de Homologação',
  departamentoId: department.id,
  ativo: true,
});
const employee = await step('funcionario', '/workspace/rh/funcionarios', {
  matricula: 'HML-001',
  nome: 'Colaborador de Teste 01 — Pessoa Fictícia',
  cpf: '52998224725',
  email: 'pessoa01@obra360.test.invalid',
  admissao: today,
  vinculo: 'CLT',
  departamentoId: department.id,
  cargoId: job.id,
  projetoObraId: project.id,
  equipeId: team.id,
  usuarioId: ids.ENGENHEIRO.id,
  salarioBase: 3000,
  jornadaSemanalMinutos: 2640,
});
const point = await step('ponto', '/workspace/rh/ponto', {
  funcionarioId: employee.id,
  data: today,
  entrada: '08:00',
  saidaIntervalo: '12:00',
  retornoIntervalo: '13:00',
  saida: '17:00',
});
await step('ponto_aprovado', `/workspace/rh/ponto/${point.id}/aprovar`, { versao: 0 });
await step('beneficio', '/workspace/rh/beneficios', {
  funcionarioId: employee.id,
  nome: 'Benefício de Teste',
  valorEmpresa: 200,
  descontoFuncionario: 20,
  inicio: today,
  ativo: true,
});
await step('treinamento', '/workspace/rh/treinamentos', {
  funcionarioId: employee.id,
  tipo: 'TREINAMENTO',
  titulo: 'Capacitação de Homologação',
  realizacao: today,
  validade: '2027-11-06',
  cargaHorariaMinutos: 120,
});
const leave = await step('ferias', '/workspace/rh/afastamentos', {
  funcionarioId: employee.id,
  tipo: 'FERIAS',
  inicio: '2026-12-01',
  fim: '2026-12-10',
  observacao: 'Solicitação fictícia para homologação, sem direito trabalhista calculado',
});
await step('ferias_aprovadas', `/workspace/rh/afastamentos/${leave.id}/decisao`, {
  versao: 0,
  situacao: 'APROVADO',
});
const payroll = await step('folha', '/workspace/rh/folhas', { competencia: '2026-11' });
await step('salario', '/workspace/rh/lancamentos', {
  folhaId: payroll.id,
  funcionarioId: employee.id,
  codigo: 'HML-SALARIO',
  descricao: 'Provento fictício para teste',
  natureza: 'PROVENTO',
  valor: 3000,
});
await step('desconto', '/workspace/rh/lancamentos', {
  folhaId: payroll.id,
  funcionarioId: employee.id,
  codigo: 'HML-DESCONTO',
  descricao: 'Desconto fictício para teste',
  natureza: 'DESCONTO',
  valor: 150,
});
const currentPayroll = await api(
  `/workspace/rh/registros/folhas/${payroll.id}`,
  'GET',
  undefined,
  adminToken,
);
const closed = await step('folha_fechada', `/workspace/rh/folhas/${payroll.id}/fechar`, {
  versao: currentPayroll.versao,
});
await step('folha_paga', `/workspace/rh/folhas/${payroll.id}/pagar`, {
  versao: closed.versao,
  data: today,
});
const points = [
    [0, 0],
    [4, 0],
    [4, 3],
    [0, 3],
  ],
  nodes = points.map(([x, z], i) => ({ id: `hml-no-${i}`, pavimentoId: 'hml-terreo', x, z }));
const walls = points.map(([x, z], i) => {
  const [b, d] = points[(i + 1) % 4];
  return {
    id: `hml-parede-${i}`,
    pavimentoId: 'hml-terreo',
    tipo: 'PAREDE',
    nome: `Parede de Teste ${i + 1}`,
    x: (x + b) / 2,
    z: (z + d) / 2,
    base: 0,
    largura: Math.hypot(b - x, d - z),
    profundidade: 0.15,
    altura: 2.8,
    rotacao: (-Math.atan2(d - z, b - x) * 180) / Math.PI,
    cor: '#cbd5e1',
    paredeId: null,
    deslocamento: 0,
    noInicioId: `hml-no-${i}`,
    noFimId: `hml-no-${(i + 1) % 4}`,
  };
});
const model = await step('modelo', '/workspace/modelador/modelos', {
  projetoObraId: project.id,
  nome: 'Planta de Teste — Ambiente 4 × 3 m',
});
await step(
  'modelo_salvo',
  `/workspace/modelador/modelos/${model.id}`,
  {
    versao: 0,
    nome: model.nome,
    motivo: 'Planta de homologação — não é projeto executivo',
    documento: {
      schemaVersao: 2,
      pavimentos: [{ id: 'hml-terreo', nome: 'Térreo de Teste', cota: 0, altura: 2.8 }],
      elementos: walls,
      nos: nodes,
      cotas: [
        {
          id: 'hml-cota-1',
          pavimentoId: 'hml-terreo',
          tipo: 'ALINHADA',
          ax: 0,
          az: 0,
          bx: 4,
          bz: 0,
          afastamento: -0.4,
          noAId: 'hml-no-0',
          noBId: 'hml-no-1',
        },
      ],
      ambientes: [
        {
          id: 'hml-ambiente-1',
          pavimentoId: 'hml-terreo',
          nome: 'Sala de Teste',
          x: 2,
          z: 1.5,
          paredeIds: walls.map((w) => w.id),
        },
      ],
    },
  },
  'PUT',
);
async function verify(name, fn) {
  const ok = await fn();
  manifest.validacoes.push({ nome: name, aprovado: !!ok, em: new Date().toISOString() });
  await persist();
  if (!ok) throw new Error('Validação falhou: ' + name);
}
manifest.validacoes = [];
await verify('Saldo após entrada de 10 e consumo de 4', async () => {
  const result = await api('/workspace/registros/estoque?size=100', 'GET', undefined, adminToken);
  return Number(result.items.find((r) => r.id === item.id)?.quantidadeAtual) === 6;
});
await verify('RH autorizado e dados restritos ao engenheiro', async () => {
  await api('/workspace/rh/resumo', 'GET', undefined, hrToken);
  return (await api('/workspace/rh/resumo', 'GET', undefined, engineerToken, 403)).status === 403;
});
await verify('Cliente recebe somente a unidade vinculada', async () => {
  const portal = await api('/portal', 'GET', undefined, clientToken);
  return portal.unidades.length === 1 && portal.unidades[0].codigo === 'HML-101';
});
await verify(
  'Demonstrativo manual confere líquido 2850',
  async () =>
    Number(
      (
        await api(
          `/workspace/rh/folhas/${payroll.id}/demonstrativo/${employee.id}`,
          'GET',
          undefined,
          hrToken,
        )
      ).liquido,
    ) === 2850,
);
await verify('Modelo reabre com nós, cota e ambiente', async () => {
  const result = await api(
    `/workspace/modelador/modelos/${model.id}`,
    'GET',
    undefined,
    engineerToken,
  );
  return (
    result.documento.nos.length === 4 &&
    result.documento.cotas.length === 1 &&
    result.documento.ambientes.length === 1
  );
});
manifest.diagnostico = await api('/workspace/dados/diagnostico', 'GET', undefined, adminToken);
manifest.concluidoEm = new Date().toISOString();
await persist();
console.log(
  `Homologação concluída: ${manifest.validacoes.length} verificações aprovadas. Credenciais em ${credentialPath}. Nenhuma empresa ou pessoa real foi criada.`,
);
