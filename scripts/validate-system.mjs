import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdtemp, mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { cpus, totalmem } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import EmbeddedPostgres from 'embedded-postgres';

// No target URL or operational database can be supplied to this harness.
const stress = process.argv.length === 3 && process.argv[2] === '--stress';
assert(
  process.argv.length === 2 || stress,
  'Use sem argumentos ou --stress. Não aceita servidor ou banco externo.',
);
const root = fileURLToPath(new URL('../', import.meta.url));
const jar = path.join(root, 'obra360-backend/target/obra360-backend-1.0.0-SNAPSHOT.jar');
const jarBytes = await readFile(jar);
await mkdir(path.join(root, 'test-results'), { recursive: true });
const lab = await mkdtemp(path.join(root, 'test-results/system-lab-'));
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}
const databasePort = await freePort(),
  appPort = await freePort();
const databasePassword = randomBytes(24).toString('hex');
const password = `Lab!${randomBytes(18).toString('hex')}`;
const server = new EmbeddedPostgres({
  databaseDir: path.join(lab, 'postgres'),
  user: 'obra360_lab',
  password: databasePassword,
  port: databasePort,
  persistent: true,
  autoRehydrateSymlinks: true,
  postgresFlags: ['-h', '127.0.0.1'],
  initdbFlags: [
    process.platform === 'win32' ? '--encoding=WIN1252' : '--encoding=UTF8',
    '--locale=C',
  ],
  onLog: () => {},
});
let app,
  database,
  serverStarted = false;
const report = {
  data: new Date().toISOString(),
  modo: stress ? 'SOBRECARGA_CONTROLADA' : 'CARGA_NOMINAL',
  jarSha256: createHash('sha256').update(jarBytes).digest('hex'),
  ambiente: {
    banco: 'PostgreSQL isolado',
    acesso: 'HTTP em loopback',
    cpuLogicas: cpus().length,
    memoriaHostGB: Math.round(totalmem() / 1024 ** 3),
    heapMaximoJavaMB: 768,
    poolConexoes: 10,
    threadsHttp: 50,
    registrosEstoque: 1001,
    limitadorNoLaboratorio: 100000,
    limitadorCompartilhado: true,
  },
  seguranca: [],
  integridade: [],
  capacidade: [],
  limites: [
    'Carga sintética local; não certifica capacidade de produção.',
    'As conexões simultâneas representam requisições em voo, não usuários humanos.',
    'Provedores externos e auditoria completa OWASP não fazem parte deste teste.',
  ],
};
let token;
async function api(
  route,
  { method = 'GET', body, auth = token, expected = 200, headers = {} } = {},
) {
  const response = await fetch(`http://127.0.0.1:${appPort}/api/v1${route}`, {
    method,
    headers: {
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  assert.equal(
    response.status,
    expected,
    `${method} ${route}: HTTP ${response.status}, esperado ${expected}`,
  );
  return {
    value: text && response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text,
    headers: response.headers,
  };
}
async function create(route, body) {
  return (await api(`/workspace${route}`, { method: 'POST', body, expected: 201 })).value;
}
async function pool(count, concurrency, action) {
  let cursor = 0;
  return Promise.all(
    Array.from({ length: concurrency }, async () => {
      const results = [];
      while (cursor < count) results.push(await action(cursor++));
      return results;
    }),
  ).then((results) => results.flat());
}
function percentile(sorted, p) {
  return Number(sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)].toFixed(2));
}
try {
  await server.initialise();
  await server.start();
  serverStarted = true;
  const administrator = server.getPgClient('postgres', '127.0.0.1');
  await administrator.connect();
  try {
    await administrator.query(
      "CREATE DATABASE obra360_lab WITH ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'",
    );
  } finally {
    await administrator.end();
  }
  database = server.getPgClient('obra360_lab', '127.0.0.1');
  await database.connect();
  const log = await open(path.join(lab, 'app.log'), 'w');
  const java = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
    : 'java';
  try {
    app = spawn(
      java,
      [
        '-Xms128m',
        '-Xmx768m',
        '-jar',
        jar,
        '--logging.level.br.com.obra360.infrastructure.security.RequestLoggingFilter=WARN',
      ],
      {
        cwd: lab,
        windowsHide: true,
        stdio: ['ignore', log.fd, log.fd],
        env: {
          ...process.env,
          SPRING_PROFILES_ACTIVE: 'dev',
          SPRING_MAIN_WEB_APPLICATION_TYPE: 'servlet',
          SERVER_SSL_ENABLED: 'false',
          SERVER_ADDRESS: '127.0.0.1',
          SERVER_PORT: String(appPort),
          SPRING_DATASOURCE_URL: `jdbc:postgresql://127.0.0.1:${databasePort}/obra360_lab?ApplicationName=obra360-capacity`,
          SPRING_DATASOURCE_USERNAME: 'obra360_lab',
          SPRING_DATASOURCE_PASSWORD: databasePassword,
          SPRING_DATASOURCE_DRIVER_CLASS_NAME: 'org.postgresql.Driver',
          SPRING_JPA_HIBERNATE_DDL_AUTO: 'validate',
          SPRING_JPA_DATABASE_PLATFORM: 'org.hibernate.dialect.PostgreSQLDialect',
          SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT: 'org.hibernate.dialect.PostgreSQLDialect',
          SPRING_FLYWAY_ENABLED: 'true',
          SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE: '10',
          SERVER_TOMCAT_THREADS_MAX: '50',
          JWT_SECRET: randomBytes(48).toString('hex'),
          OBRA360_SETUP_ENABLED: 'true',
          OBRA360_SECURITY_REQUESTS_PER_MINUTE: '100000',
          SHARED_USAGE_LIMITS_ENABLED: 'true',
          SHARED_USAGE_LIMITS_SECRET: randomBytes(48).toString('hex'),
          OBRA360_STORAGE_DIRECTORY: path.join(lab, 'documentos'),

          AI_ENABLED: 'false',
          EMAIL_ENABLED: 'false',
          SEFAZ_ENABLED: 'false',
          GOOGLE_CLIENT_ID: '',
        },
      },
    );
    await new Promise((resolve, reject) => {
      app.once('spawn', resolve);
      app.once('error', reject);
    });
  } finally {
    await log.close();
  }
  let ready = false;
  for (let attempt = 0; attempt < 120 && app.exitCode === null; attempt++) {
    try {
      const status = await api('/instalacao', { auth: '' });
      if (status.value.necessaria === true) {
        ready = true;
        break;
      }
    } catch {}
    await sleep(500);
  }
  assert(ready, 'A aplicação isolada não iniciou; consulte app.log no laboratório.');
  await api('/instalacao', {
    method: 'POST',
    auth: '',
    expected: 201,
    body: {
      nomeFantasia: 'Laboratório isolado',
      razaoSocial: 'Fixture de capacidade',
      cnpj: '12345678000190',
      nome: 'Administrador do laboratório',
      email: 'admin@lab.test.invalid',
      senha: password,
      ambienteDados: 'HOMOLOGACAO',
    },
  });
  const login = (
    await api('/auth/login', {
      method: 'POST',
      auth: '',
      body: { email: 'admin@lab.test.invalid', senha: password },
    })
  ).value;
  token = login.token;
  const engineer = (
    await api('/auth/cadastrar', {
      method: 'POST',
      expected: 201,
      body: {
        nome: 'Engenheiro do laboratório',
        email: 'engineer@lab.test.invalid',
        perfil: 'ENGENHEIRO',
        senhaHash: password,
      },
    })
  ).value;
  const financial = (
    await api('/auth/cadastrar', {
      method: 'POST',
      expected: 201,
      body: {
        nome: 'Financeiro do laboratório',
        email: 'finance@lab.test.invalid',
        perfil: 'FINANCEIRO',
        senhaHash: password,
      },
    })
  ).value;
  const project = await create('/projetos', {
    nome: 'Obra laboratório',
    engenheiroResponsavelId: engineer.id,
    areaTotalM2: 100,
    vgvEstimado: 1000,
    dataInicio: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
      new Date(),
    ),
    dataPrevisaoFim: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
      new Date(Date.now() + 30 * 86400000),
    ),
  });
  const item = await create('/estoque', {
    projetoObraId: project.id,
    sku: 'RACE',
    nome: 'Material de teste',
    categoria: 'Teste',
    unidadeMedida: 'un',
    estoqueMinimo: 1,
    custoUnitarioMedio: 5,
  });
  await create('/movimentacoes', {
    itemEstoqueId: item.id,
    tipoMovimentacao: 'ENTRADA',
    quantidade: 10,
    chaveOperacao: randomUUID(),
  });
  const foreignCompany = (
    await database.query(
      "INSERT INTO empresa(cnpj,razao_social,nome_fantasia,ambiente_dados) VALUES('99999999000199','Fixture B','Fixture B','HOMOLOGACAO') RETURNING id",
    )
  ).rows[0].id;
  await database.query(
    "INSERT INTO usuario(empresa_id,email,nome,perfil,senha_hash) SELECT $1,'outside@lab.test.invalid','Fixture externa','ENGENHEIRO',senha_hash FROM usuario WHERE id=$2",
    [foreignCompany, engineer.id],
  );
  const outside = (
    await api('/auth/login', {
      method: 'POST',
      auth: '',
      body: { email: 'outside@lab.test.invalid', senha: password },
    })
  ).value.token;
  await api('/workspace/registros/estoque', { auth: '', expected: 401 });
  await api('/workspace/registros/estoque', {
    auth: `${token.slice(0, -8)}invalid`,
    expected: 401,
  });
  await api('/workspace/registros/estoque', {
    headers: { 'X-Tenant-ID': String(foreignCompany) },
    expected: 403,
  });
  const foreignRows = await api('/workspace/registros/estoque', { auth: outside });
  assert.equal(foreignRows.value.total, 0);
  await api('/workspace/movimentacoes', {
    method: 'POST',
    auth: outside,
    expected: 404,
    body: {
      itemEstoqueId: item.id,
      tipoMovimentacao: 'SAIDA',
      quantidade: 1,
      chaveOperacao: randomUUID(),
    },
  });
  const financialToken = (
    await api('/auth/login', {
      method: 'POST',
      auth: '',
      body: { email: financial.email, senha: password },
    })
  ).value.token;
  await api('/auth/cadastrar', {
    method: 'POST',
    auth: financialToken,
    expected: 403,
    body: {
      nome: 'Tentativa',
      email: 'blocked@lab.test.invalid',
      perfil: 'SUPER_ADMIN',
      senhaHash: password,
    },
  });
  await api('/workspace/registros/estoque?page=-1', { expected: 400 });
  await api('/workspace/registros/estoque?size=100000', { expected: 400 });
  await api('/workspace/movimentacoes', {
    method: 'POST',
    expected: 400,
    body: {
      itemEstoqueId: item.id,
      tipoMovimentacao: 'ENTRADA',
      quantidade: -1,
      chaveOperacao: randomUUID(),
    },
  });
  const headers = (await api('/workspace/sessao')).headers;
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('x-frame-options'), 'DENY');
  assert(headers.get('content-security-policy')?.includes("object-src 'none'"));
  report.seguranca.push(
    'Autenticação obrigatória',
    'JWT adulterado rejeitado',
    'Cabeçalho de empresa não altera tenant',
    'Isolamento entre empresas',
    'RBAC impede criação de administrador por financeiro',
    'Paginação e quantidades inválidas rejeitadas',
    'Cabeçalhos CSP, nosniff e proteção contra enquadramento',
  );

  const results = await pool(40, 20, async () => {
    const response = await fetch(`http://127.0.0.1:${appPort}/api/v1/workspace/movimentacoes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemEstoqueId: item.id,
        tipoMovimentacao: 'SAIDA',
        quantidade: 1,
        chaveOperacao: randomUUID(),
      }),
      signal: AbortSignal.timeout(20000),
    });
    await response.arrayBuffer();
    return response.status;
  });
  assert.equal(results.filter((status) => status === 201).length, 10);
  assert.equal(results.filter((status) => status === 409).length, 30);
  const stock = (
    await database.query('SELECT quantidade_atual FROM item_estoque WHERE id=$1', [item.id])
  ).rows[0];
  assert.equal(Number(stock.quantidade_atual), 0);
  const movements = (
    await database.query(
      "SELECT count(*)::int AS total,sum(quantidade) AS total_saida FROM movimentacao_estoque WHERE item_estoque_id=$1 AND tipo_movimentacao='SAIDA'",
      [item.id],
    )
  ).rows[0];
  assert.equal(movements.total, 10);
  assert.equal(Number(movements.total_saida), 10);
  const key = randomUUID(),
    movement = {
      itemEstoqueId: item.id,
      tipoMovimentacao: 'ENTRADA',
      quantidade: 2,
      chaveOperacao: key,
    };
  const first = await create('/movimentacoes', movement),
    repeated = await create('/movimentacoes', movement);
  assert.equal(first.id, repeated.id);
  assert.equal(
    Number(
      (await database.query('SELECT quantidade_atual FROM item_estoque WHERE id=$1', [item.id]))
        .rows[0].quantidade_atual,
    ),
    2,
  );
  const supplier = await create('/fornecedores', {
    cnpj: '98765432000190',
    razaoSocial: 'Fixture fornecedor',
    categoriaFornecimento: 'INSUMOS',
  });
  const purchase = await create('/compras', {
    itemEstoqueId: item.id,
    quantidade: 8,
    justificativa: 'Reposição no laboratório isolado',
  });
  const quote = await create(`/compras/${purchase.id}/propostas`, {
    fornecedorB2bId: supplier.id,
    valorProposta: 80,
    prazoEntregaDias: 1,
  });
  await api(`/workspace/compras/${purchase.id}/selecionar`, {
    method: 'POST',
    body: { cotacaoId: quote.id },
  });
  await api(`/workspace/compras/${purchase.id}/aprovar`, {
    method: 'POST',
    body: { alcada: 'GESTAO' },
  });
  await api(`/workspace/compras/${purchase.id}/aprovar`, {
    method: 'POST',
    auth: financialToken,
    body: { alcada: 'FINANCEIRO' },
  });
  await api(`/workspace/compras/${purchase.id}/pedido`, { method: 'POST' });
  await pool(12, 12, () => api(`/workspace/compras/${purchase.id}/receber`, { method: 'POST' }));
  const received = (
    await database.query(
      'SELECT quantidade_atual,custo_unitario_medio FROM item_estoque WHERE id=$1',
      [item.id],
    )
  ).rows[0];
  assert.equal(Number(received.quantidade_atual), 10);
  assert.equal(Number(received.custo_unitario_medio), 9);
  assert.equal(
    (
      await database.query(
        "SELECT count(*)::int AS count FROM movimentacao_estoque WHERE item_estoque_id=$1 AND tipo_movimentacao='ENTRADA'",
        [item.id],
      )
    ).rows[0].count,
    3,
  );
  const inventoryValue = await database.query(
    "SELECT sum(case when tipo_movimentacao='ENTRADA' then valor_total else -valor_total end) AS value FROM movimentacao_estoque WHERE item_estoque_id=$1",
    [item.id],
  );
  assert.equal(Number(inventoryValue.rows[0].value), 90);
  assert.equal(Number(received.quantidade_atual) * Number(received.custo_unitario_medio), 90);
  report.integridade.push(
    {
      teste: '40 saídas concorrentes para 10 unidades',
      aprovadas: 10,
      conflitosEsperados: 30,
      saldoFinal: 0,
    },
    { teste: 'Repetição idempotente de movimentação', mesmoRegistro: true },
    {
      teste: '12 recebimentos simultâneos do mesmo pedido',
      entradasGeradas: 1,
      saldoFinal: 10,
      custoMedio: 9,
    },
  );

  const budget = await create('/gestao/orcamentos', {
    projetoObraId: project.id,
    valorAprovado: 1000,
    justificativa: 'Orçamento do laboratório de carga isolado',
  });
  await api(`/workspace/gestao/orcamentos/${budget.id}/aprovar`, {
    method: 'POST',
    body: { versao: budget.versao },
  });
  const title = await create('/gestao/titulos', {
    projetoObraId: project.id,
    empresaId: foreignCompany,
    tipo: 'PAGAR',
    categoria: 'SERVICOS',
    descricao: 'Título sintético para concorrência',
    contraparte: 'Fixture do laboratório',
    valor: 100,
    vencimento: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
      new Date(),
    ),
  });
  assert.equal(
    title.empresaId,
    login.empresaId,
    'Empresa enviada pelo cliente não pode substituir a identidade autenticada.',
  );
  const paymentKey = randomUUID(),
    payment = {
      versao: title.versao,
      valor: 1,
      data: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()),
      conta: 'LAB-ISOLADO',
      observacao: 'Comprovante sintético de concorrência',
      chave: paymentKey,
    };
  const same = await pool(30, 15, () =>
    api(`/workspace/gestao/titulos/${title.id}/baixar`, { method: 'POST', body: payment }),
  );
  assert.equal(new Set(same.map((r) => r.value.id)).size, 1);
  const current = (
    await api(`/workspace/gestao/registros/titulos?projetoObraId=${project.id}`)
  ).value.items.find((t) => t.id === title.id);
  const settlements = await pool(30, 15, async () => {
    const response = await fetch(
      `http://127.0.0.1:${appPort}/api/v1/workspace/gestao/titulos/${title.id}/baixar`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payment, versao: current.versao, chave: randomUUID() }),
        signal: AbortSignal.timeout(20000),
      },
    );
    await response.arrayBuffer();
    return response.status;
  });
  assert.equal(settlements.filter((s) => s === 200).length, 1);
  assert.equal(settlements.filter((s) => s === 409).length, 29);
  const ledger = (
    await database.query(
      'select t.baixado,coalesce(sum(b.valor),0) as soma,count(b.id)::int as baixas from titulo_financeiro t left join baixa_financeira b on b.titulo_id=t.id where t.id=$1 group by t.id',
      [title.id],
    )
  ).rows[0];
  assert.equal(Number(ledger.baixado), 2);
  assert.equal(Number(ledger.soma), 2);
  assert.equal(ledger.baixas, 2);
  await api(`/workspace/gestao/titulos/${title.id}/baixar`, {
    method: 'POST',
    body: { ...payment, valor: 2 },
    expected: 409,
  });
  await api(`/workspace/detalhes/projetos/${project.id}`, { auth: outside, expected: 404 });
  report.integridade.push(
    { teste: '30 baixas simultâneas com mesma chave', registrosGerados: 1 },
    {
      teste: '30 baixas com mesma versão e chaves distintas',
      aprovadas: 1,
      conflitosEsperados: 29,
      valorBaixado: 2,
      somaLancamentos: 2,
    },
  );
  report.seguranca.push(
    'Mass assignment não altera empresa do título',
    'Detalhes da obra não acessíveis por outra empresa',
  );

  await database.query(
    "INSERT INTO item_estoque(empresa_id,projeto_obra_id,sku,nome,categoria,unidade_medida) SELECT $1,$2,'LOAD-'||n,'Material '||n,'Fixture','un' FROM generate_series(1,1000) n",
    [login.empresaId, project.id],
  );
  await pool(20, 5, () => api('/workspace/resumo'));
  const stages = [
    [5, 150],
    [15, 300],
    [30, 450],
  ];
  if (stress) stages.push([60, 600], [100, 900], [200, 1200]);
  const routes = stress
    ? [
        '/workspace/resumo',
        `/workspace/registros/estoque?page=0&size=25`,
        `/workspace/gestao/resumo/${project.id}`,
        `/workspace/detalhes/projetos/${project.id}`,
        `/workspace/gestao/registros/titulos?projetoObraId=${project.id}`,
      ]
    : null;
  report.rotasCarga = routes || ['/workspace/resumo', '/workspace/registros/estoque'];
  for (const [concurrency, count] of stages) {
    const started = performance.now();
    const responses = await pool(count, concurrency, async (index) => {
      const before = performance.now();
      try {
        await api(
          routes
            ? routes[index % routes.length]
            : index % 2
              ? `/workspace/registros/estoque?page=${index % 20}&size=25`
              : '/workspace/resumo',
        );
        return { ms: performance.now() - before, error: false };
      } catch (error) {
        return { ms: performance.now() - before, error: true, status: error.actual || error.name };
      }
    });
    const elapsed = performance.now() - started,
      sorted = responses.map((response) => response.ms).sort((a, b) => a - b);
    const stage = {
      concorrencia: concurrency,
      requisicoes: count,
      erros: responses.filter((response) => response.error).length,
      falhasPorTipo: responses
        .filter((r) => r.error)
        .reduce((counts, r) => {
          counts[r.status] = (counts[r.status] || 0) + 1;
          return counts;
        }, {}),
      p50Ms: percentile(sorted, 0.5),
      p95Ms: percentile(sorted, 0.95),
      p99Ms: percentile(sorted, 0.99),
      maxMs: Number(sorted.at(-1).toFixed(2)),
      requisicoesSegundo: Number((count / (elapsed / 1000)).toFixed(2)),
    };
    report.capacidade.push(stage);
    console.log(JSON.stringify(stage));
    if (stage.erros > count * 0.05 || stage.p95Ms > 5000) break;
  }
  const recovered = await pool(25, 5, async () => {
    const start = performance.now();
    await api('/workspace/resumo');
    return performance.now() - start;
  });
  const after = Number(
    (await database.query('select baixado from titulo_financeiro where id=$1', [title.id])).rows[0]
      .baixado,
  );
  assert.equal(after, 2);
  report.recuperacaoAposCarga = {
    consultas: recovered.length,
    erros: 0,
    p95Ms: percentile(
      recovered.sort((a, b) => a - b),
      0.95,
    ),
    saldoFinanceiroPreservado: true,
  };
  report.migracoes = Number(
    (await database.query('SELECT count(*) FROM flyway_schema_history WHERE success=true')).rows[0]
      .count,
  );
  report.conexoesAplicacaoAposCarga = Number(
    (
      await database.query(
        "SELECT count(*) FROM pg_stat_activity WHERE application_name='obra360-capacity'",
      )
    ).rows[0].count,
  );
  report.cargaNominalAprovada =
    report.capacidade.length >= 3 &&
    report.capacidade.slice(0, 3).every((stage) => stage.erros === 0 && stage.p95Ms <= 2000);
  report.aprovado =
    report.cargaNominalAprovada &&
    report.capacidade.length === stages.length &&
    report.capacidade.every((stage) => stage.erros === 0);
  report.maiorConcorrenciaDentroDaMeta =
    report.capacidade.filter((s) => s.erros === 0 && s.p95Ms <= 2000).at(-1)?.concorrencia || 0;
  report.sobrecargaCaracterizada = stress;
  if (!report.aprovado) process.exitCode = 1;
} catch (error) {
  report.aprovado = false;
  report.falha = error.message;
  process.exitCode = 1;
} finally {
  await writeFile(path.join(lab, 'resultado.json'), JSON.stringify(report, null, 2));
  if (app && app.exitCode === null) {
    if (process.platform === 'win32') {
      try {
        execFileSync('taskkill', ['/pid', String(app.pid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        });
      } catch {}
    } else app.kill('SIGTERM');
  }
  if (database) await database.end().catch(() => {});
  if (serverStarted) await server.stop();
  console.log(
    `Relatório de segurança, capacidade e integridade: ${path.join(lab, 'resultado.json')}`,
  );
}
