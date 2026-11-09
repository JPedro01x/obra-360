import { test, expect, APIRequestContext, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { localCalendarDate } from '../local-calendar';

// Isolated API/database provided by integrated-server.mjs; never localhost:8080.
const base = 'http://127.0.0.1:8081/api/v1';
const roles = [
  'SUPER_ADMIN',
  'INCORPORADOR',
  'GERENTE_OBRA',
  'ARQUITETO',
  'ENGENHEIRO',
  'FINANCEIRO',
  'RH',
  'MESTRE_OBRA',
  'ALMOXARIFE',
  'AUDITOR',
  'FORNECEDOR',
  'LOCADOR_MAQUINAS',
  'CORRETOR',
  'INVESTIDOR',
  'CLIENTE',
];
const external = ['FORNECEDOR', 'LOCADOR_MAQUINAS', 'CORRETOR', 'INVESTIDOR', 'CLIENTE'];
const password = 'SenhaAuditoriaIsolada@12345';
const email = (role: string) => `${role.toLowerCase()}@role-audit.test.invalid`;
let ids: Record<string, number> = {},
  project: number,
  supplier: number,
  unit: number,
  team: number,
  contract: number,
  documentId: number,
  token: string;
const documentReaders = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO', 'ARQUITETO', 'AUDITOR'];
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF');
const today = localCalendarDate(),
  future = localCalendarDate(new Date(Date.now() + 30 * 86400000));
async function api(
  request: APIRequestContext,
  path: string,
  data?: unknown,
  auth = token,
  method = 'POST',
) {
  const response = await request.fetch(base + path, {
    method,
    headers: auth ? { Authorization: `Bearer ${auth}` } : {},
    data,
  });
  expect(response.ok(), `${method} ${path}: HTTP ${response.status()}`).toBeTruthy();
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
async function loginApi(request: APIRequestContext, role: string) {
  return (
    await api(request, '/auth/login', { email: email(role), senha: password, perfil: role }, '')
  ).token as string;
}
test.beforeAll(async ({ request }) => {
  const setup = await api(request, '/instalacao', undefined, '', 'GET');
  if (setup.necessaria) {
    await api(
      request,
      '/instalacao',
      {
        nomeFantasia: 'Auditoria isolada',
        razaoSocial: 'Empresa de teste de perfis',
        cnpj: '11111111111111',
        nome: 'Administrador de teste',
        email: email('SUPER_ADMIN'),
        senha: password,
        ambienteDados: 'HOMOLOGACAO',
      },
      '',
    );
    token = await loginApi(request, 'SUPER_ADMIN');
    const session = await api(request, '/workspace/sessao', undefined, token, 'GET');
    expect(session.empresa.ambienteDados).toBe('HOMOLOGACAO');
    for (const role of roles.filter((r) => r !== 'SUPER_ADMIN'))
      ids[role] = (
        await api(request, '/auth/cadastrar', {
          nome: `Conta de teste ${role}`,
          email: email(role),
          senhaHash: password,
          perfil: role,
          ativo: true,
        })
      ).id;
    ids.SUPER_ADMIN = (
      await api(request, '/workspace/registros/usuarios?size=100', undefined, token, 'GET')
    ).items.find((u: any) => u.perfil === 'SUPER_ADMIN').id;
    project = (
      await api(request, '/workspace/projetos', {
        nome: 'Obra auditada',
        engenheiroResponsavelId: ids.ENGENHEIRO,
        areaTotalM2: 100,
        vgvEstimado: 100000,
        dataInicio: today,
        dataPrevisaoFim: future,
      })
    ).id;
    supplier = (
      await api(request, '/workspace/fornecedores', {
        cnpj: '22222222222222',
        razaoSocial: 'Fornecedor auditado',
        categoriaFornecimento: 'INSUMOS',
      })
    ).id;
    contract = (
      await api(request, '/workspace/contratos', {
        projetoObraId: project,
        fornecedorB2bId: supplier,
        numeroContrato: 'CT-AUDIT',
        valorTotal: 1000,
        retencaoTecnicaPct: 0,
        tempoLimiteSlaHoras: 48,
        dataInicio: today,
        dataTermino: future,
      })
    ).id;
    team = (
      await api(request, '/workspace/equipes', {
        projetoObraId: project,
        liderEncarregadoId: ids.ENGENHEIRO,
        nomeEquipe: 'Equipe auditada',
        especialidade: 'Alvenaria',
        quantidadeOperarios: 3,
      })
    ).id;
    const stock = (
      await api(request, '/workspace/estoque', {
        projetoObraId: project,
        sku: 'MAT-AUDIT',
        nome: 'Material auditado',
        categoria: 'Insumo',
        unidadeMedida: 'UN',
        estoqueMinimo: 1,
        custoUnitarioMedio: 10,
      })
    ).id;
    await api(request, '/workspace/movimentacoes', {
      itemEstoqueId: stock,
      tipoMovimentacao: 'ENTRADA',
      quantidade: 100,
      chaveOperacao: randomUUID(),
    });
    await api(request, '/workspace/ordens', {
      contratoServicoId: contract,
      equipeTrabalhoId: team,
      descricao: 'Ordem auditada',
      prioridade: 'MEDIA',
      dataLimiteSla: new Date(Date.now() + 86400000).toISOString(),
    });
    await api(request, '/workspace/cronograma', {
      projetoObraId: project,
      nomeEtapa: 'Etapa auditada',
      ordemExecucao: 1,
      dataInicioPrevista: today,
      dataFimPrevista: future,
    });
    await api(request, '/workspace/qualidade', {
      projetoObraId: project,
      responsavelId: ids.ENGENHEIRO,
      titulo: 'Ocorrência auditada',
      normaRegulamentadora: 'Referência de teste',
      grauSeveridade: 'BAIXA',
    });
    unit = (
      await api(request, '/workspace/unidades', {
        projetoObraId: project,
        codigoUnidade: 'AUD-101',
        areaPrivativaM2: 50,
        valorTabela: 1000,
      })
    ).id;
    for (const role of external)
      await api(request, '/workspace/acessos', {
        usuarioId: ids[role],
        projetoObraId: project,
        ...(role === 'CLIENTE' ? { unidadeImobiliariaId: unit } : {}),
        ...(['FORNECEDOR', 'LOCADOR_MAQUINAS'].includes(role) ? { fornecedorB2bId: supplier } : {}),
      });
    await api(request, '/workspace/cotacoes', {
      fornecedorB2bId: supplier,
      codigoCotacao: 'COT-AUDIT',
      valorProposta: 100,
      prazoEntregaDias: 2,
    });
    await api(request, '/workspace/garantias', {
      unidadeImobiliariaId: unit,
      usuarioClienteId: ids.CLIENTE,
      descricaoDefeito: 'Chamado auditado',
      categoriaDefeito: 'Teste',
    });
    await api(request, '/workspace/modelador/modelos', {
      projetoObraId: project,
      nome: 'Modelo auditado',
    });
    const uploaded = await request.post(`${base}/workspace/documentos`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        projetoObraId: String(project),
        titulo: 'Documento auditado',
        tipoDocumento: 'PDF',
        arquivo: { name: 'auditado.pdf', mimeType: 'application/pdf', buffer: pdf },
      },
    });
    expect(uploaded.status()).toBe(201);
    documentId = (await uploaded.json()).id;
  } else {
    token = await loginApi(request, 'SUPER_ADMIN');
    team = (await api(request, '/workspace/registros/equipes?size=100', undefined, token, 'GET'))
      .items[0]?.id;
    contract = (
      await api(request, '/workspace/registros/contratos?size=100', undefined, token, 'GET')
    ).items[0]?.id;
    const users = await api(
      request,
      '/workspace/registros/usuarios?size=100',
      undefined,
      token,
      'GET',
    );
    for (const u of users.items) ids[u.perfil] = u.id;
    project = (
      await api(request, '/workspace/registros/projetos?size=100', undefined, token, 'GET')
    ).items[0].id;
    supplier = (
      await api(request, '/workspace/registros/fornecedores?size=100', undefined, token, 'GET')
    ).items[0].id;
    unit = (await api(request, '/workspace/registros/unidades?size=100', undefined, token, 'GET'))
      .items[0].id;
    documentId = (
      await api(request, '/workspace/registros/documentos?size=100', undefined, token, 'GET')
    ).items[0]?.id;
  }
});

async function inspectForms(page: Page, log: string[]) {
  const buttons = page.locator('main button').filter({
    hasText:
      /^(Novo|Nova|Enviar documento$|Movimentar estoque$|Cadastrar |Editar |Informar avanço$|Atualizar ocorrência$|Atualizar ordem$|Atualizar chamado$|Registrar consumo$)/,
  });
  const names = [...new Set((await buttons.allTextContents()).map((s) => s.trim()))];
  for (const name of names) {
    const button = page.locator('main').getByRole('button', { name, exact: true }).first();
    if (!(await button.isVisible()) || !(await button.isEnabled())) continue;
    await button.click();
    await page.waitForLoadState('networkidle');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('alert')).toHaveCount(0);
    for (const field of await dialog.locator('select[required]').all())
      expect(await field.locator('option').count(), `Opções de ${name}`).toBeGreaterThan(0);
    const close = dialog.getByRole('button', { name: /Fechar|Cancelar/ }).first();
    await close.click();
    await expect(dialog).toHaveCount(0);
    log.push(`formulário: ${name}`);
  }
}
async function responsiveThemes(page: Page, label: string) {
  for (const theme of ['light', 'dark']) {
    const toggle = page.getByRole('button', { name: 'Tema escuro', exact: true });
    if ((await toggle.getAttribute('aria-pressed')) !== String(theme === 'dark')) {
      await toggle.click();
    }
    await expect(page.locator('html')).toHaveAttribute('data-obra-theme', theme);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      const layout = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        viewport: innerWidth,
      }));
      expect(layout.page, `${label} / ${theme} / ${width}px`).toBeLessThanOrEqual(
        layout.viewport + 1,
      );
    }
  }
  await page.setViewportSize({ width: 1280, height: 720 });
}

for (const role of roles)
  test(`${role}: páginas, formulários, conta, atendimento e logout`, async ({ page }, testInfo) => {
    const issues: string[] = [],
      visited: string[] = [];
    page.on('pageerror', (e) => issues.push(e.message));
    page.on('response', (r) => {
      if (r.url().includes('/api/') && r.status() >= 400)
        issues.push(`${r.request().method()} ${new URL(r.url()).pathname}: ${r.status()}`);
    });
    await page.goto('/');
    await page.locator(`input[type=radio][value="${role}"]`).check();
    await page.getByLabel('E-mail corporativo', { exact: true }).fill(email(role));
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar na plataforma', exact: true }).click();
    await expect(page.getByLabel('Sair da plataforma')).toBeVisible();
    const background = await page
      .locator('.ws-shell')
      .evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(background).toBe('rgb(17, 17, 19)');
    const navigation = page.locator('.ws-sidebar nav button');
    const names = (await navigation.allTextContents()).map((s) => s.trim());
    for (const name of names) {
      await page.locator('.ws-sidebar nav').getByRole('button', { name, exact: true }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main h1').first()).toBeVisible();
      await expect(page.locator('main [role=alert]')).toHaveCount(0);
      visited.push(name);
      if (name === 'Recursos humanos') {
        const tabs = (
          await page
            .getByRole('navigation', { name: 'Seções de RH' })
            .getByRole('button')
            .allTextContents()
        ).map((s) => s.trim());
        for (const tab of tabs) {
          await page
            .getByRole('navigation', { name: 'Seções de RH' })
            .getByRole('button', { name: tab, exact: true })
            .click();
          await page.waitForLoadState('networkidle');
          await expect(page.locator('main [role=alert]')).toHaveCount(0);
          visited.push(`RH / ${tab}`);
          await inspectForms(page, visited);
          await responsiveThemes(page, `${role} RH / ${tab}`);
        }
      } else if (name === 'Modelador 2D/3D') {
        await page.getByLabel('Obra do modelo', { exact: true }).selectOption(String(project));
        await page.getByRole('button', { name: /Modelo auditado/ }).click();
        await expect(page.getByLabel('Nome do modelo', { exact: true })).toBeVisible();
        for (const mode of ['2d', '3d', 'split'])
          await page
            .getByLabel('Modo de visualização do modelo', { exact: true })
            .selectOption(mode);
        await page.getByLabel('Modo de visualização do modelo', { exact: true }).selectOption('2d');
      } else if (name === 'Leitor IFC') {
        await page
          .getByLabel('Selecionar arquivo IFC')
          .setInputFiles('tests/fixtures/quantities.ifc');
        await expect(
          page.getByRole('row').filter({ hasText: 'Parede com quantidade declarada' }),
        ).toBeVisible({ timeout: 30000 });
      } else await inspectForms(page, visited);
      if (name === 'Empreendimentos') {
        await page.getByLabel('Buscar nesta página').fill('sem-correspondencia-auditoria');
        await expect(
          page.getByRole('heading', { name: 'Nenhum resultado nesta página' }),
        ).toBeVisible();
        await page.getByLabel('Buscar nesta página').fill('');
        await page.getByRole('button', { name: 'Atualizar registros' }).click();
      }
      await responsiveThemes(page, `${role} / ${name}`);
      if (name === 'Documentos') {
        const download = page.getByRole('button', { name: 'Baixar arquivo', exact: true });
        if (documentReaders.includes(role)) {
          const pending = page.waitForEvent('download');
          await download.first().click();
          const file = await pending;
          expect(file.suggestedFilename()).toBe('auditado.pdf');
        } else await expect(download).toHaveCount(0);
      }
      if (
        role === 'SUPER_ADMIN' &&
        ['Empreendimentos', 'Modelador 2D/3D', 'Recursos humanos', 'Integrações'].includes(name)
      )
        await page.screenshot({
          path: testInfo.outputPath(`pagina-${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`),
          fullPage: true,
        });
    }
    if (external.includes(role)) {
      await expect(page.getByRole('heading', { name: 'Portal de relacionamento' })).toBeVisible();
      visited.push('Portal de relacionamento');
      await responsiveThemes(page, `${role} / portal`);
      if (['FORNECEDOR', 'LOCADOR_MAQUINAS'].includes(role)) {
        await page.getByRole('button', { name: 'Enviar proposta', exact: true }).click();
        await page.getByLabel('Vínculo com a obra', { exact: true }).selectOption({ index: 1 });
        await page.getByLabel('Valor da proposta (R$)', { exact: true }).fill('123');
        await page.getByLabel('Prazo de entrega (dias)', { exact: true }).fill('3');
        await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      if (role === 'CLIENTE') {
        await page.getByRole('button', { name: 'Abrir chamado', exact: true }).click();
        await page.getByLabel('Categoria do problema').fill('Teste');
        await page.getByLabel('Descreva o problema').fill('Chamado de teste do perfil cliente.');
        await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      if (role === 'CORRETOR') {
        await page.getByRole('button', { name: 'Reservar unidade', exact: true }).click();
        await expect(
          page.getByText('Unidade reservada com sucesso.', { exact: true }),
        ).toBeVisible();
      }
    }
    await page.getByRole('button', { name: 'Minha senha', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('button', { name: 'Conta e atendimento', exact: true }).click();
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Assunto', { exact: true }).fill(`Teste de atendimento ${role}`);
    await page
      .getByLabel('Descrição', { exact: true })
      .fill('Teste isolado de gravação por perfil.');
    await page.getByRole('button', { name: 'Registrar solicitação', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: new RegExp(`Teste de atendimento ${role}$`) }),
    ).toBeVisible();
    visited.push('Conta e atendimento / gravar solicitação');
    await responsiveThemes(page, `${role} / conta`);
    await page.screenshot({ path: testInfo.outputPath(`${role}.png`), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await page.getByLabel('Sair da plataforma').click();
    await expect(
      page.getByRole('heading', { name: 'Acessar Plataforma', exact: true }),
    ).toBeVisible();
    await testInfo.attach('cobertura', {
      body: JSON.stringify({ perfil: role, verificacoes: visited, erros: issues }, null, 2),
      contentType: 'application/json',
    });
    expect(issues).toEqual([]);
  });

test('matriz de gravação e permissões dos quinze perfis', async ({ request }, testInfo) => {
  const managers = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO'];
  const commercial = ['SUPER_ADMIN', 'GERENTE_OBRA', 'FINANCEIRO', 'INCORPORADOR'];
  const builders = ['SUPER_ADMIN', 'GERENTE_OBRA', 'INCORPORADOR'];
  const reports: unknown[] = [];
  for (const [index, role] of roles.entries()) {
    const auth = await loginApi(request, role);
    const created: Record<string, any> = {};
    const operations = [
      {
        path: '/projetos',
        allowed: builders,
        data: {
          nome: `Obra de ${role}`,
          engenheiroResponsavelId: ids.ENGENHEIRO,
          areaTotalM2: 10,
          vgvEstimado: 100,
          dataInicio: today,
          dataPrevisaoFim: future,
        },
      },
      {
        path: '/fornecedores',
        allowed: commercial,
        data: {
          cnpj: String(33000000000000 + index),
          razaoSocial: `Fornecedor de ${role}`,
          categoriaFornecimento: 'INSUMOS',
        },
      },
      {
        path: '/contratos',
        allowed: commercial,
        data: {
          projetoObraId: project,
          fornecedorB2bId: supplier,
          numeroContrato: `CT-${role}`,
          valorTotal: 100,
          retencaoTecnicaPct: 0,
          tempoLimiteSlaHoras: 48,
          dataInicio: today,
          dataTermino: future,
        },
      },
      {
        path: '/equipes',
        allowed: [...managers, 'MESTRE_OBRA'],
        data: {
          projetoObraId: project,
          liderEncarregadoId: ids.ENGENHEIRO,
          nomeEquipe: `Equipe ${role}`,
          especialidade: 'Teste',
          quantidadeOperarios: 1,
        },
      },
      {
        path: '/estoque',
        allowed: [...managers, 'ALMOXARIFE'],
        data: {
          projetoObraId: project,
          sku: `SKU-${role}`,
          nome: `Material ${role}`,
          categoria: 'Teste',
          unidadeMedida: 'UN',
          estoqueMinimo: 0,
          custoUnitarioMedio: 1,
        },
      },
      {
        path: '/ordens',
        allowed: [...managers, 'MESTRE_OBRA'],
        data: {
          contratoServicoId: contract,
          equipeTrabalhoId: team,
          descricao: `Ordem ${role}`,
          prioridade: 'MEDIA',
          dataLimiteSla: new Date(Date.now() + 86400000).toISOString(),
        },
      },
      {
        path: '/cronograma',
        allowed: managers,
        data: {
          projetoObraId: project,
          nomeEtapa: `Etapa ${role}`,
          ordemExecucao: index + 2,
          dataInicioPrevista: today,
          dataFimPrevista: future,
        },
      },
      {
        path: '/qualidade',
        allowed: managers,
        data: {
          projetoObraId: project,
          responsavelId: ids.ENGENHEIRO,
          titulo: `Ocorrência ${role}`,
          normaRegulamentadora: 'Teste',
          grauSeveridade: 'BAIXA',
        },
      },
      {
        path: '/unidades',
        allowed: builders,
        data: {
          projetoObraId: project,
          codigoUnidade: `UN-${role}`,
          areaPrivativaM2: 20,
          valorTabela: 100,
        },
      },
      {
        path: '/cotacoes',
        allowed: commercial,
        data: {
          fornecedorB2bId: supplier,
          codigoCotacao: `COT-${role}`,
          valorProposta: 10,
          prazoEntregaDias: 1,
        },
      },
      {
        path: '/garantias',
        allowed: managers,
        data: {
          unidadeImobiliariaId: unit,
          usuarioClienteId: ids.CLIENTE,
          descricaoDefeito: `Chamado ${role}`,
          categoriaDefeito: 'Teste',
        },
      },
      {
        path: '/modelador/modelos',
        allowed: [...managers, 'ARQUITETO'],
        data: { projetoObraId: project, nome: `Modelo ${role}` },
      },
      {
        path: '/rh/estrutura',
        allowed: ['SUPER_ADMIN', 'RH'],
        data: { tipo: 'DEPARTAMENTO', nome: `Departamento ${role}`, ativo: true },
      },
    ];
    for (const op of operations) {
      const response = await request.post(`${base}/workspace${op.path}`, {
        headers: { Authorization: `Bearer ${auth}` },
        data: op.data,
      });
      expect(response.status(), `${role} POST ${op.path}`).toBe(
        op.allowed.includes(role) ? (op.path.startsWith('/rh/') ? 200 : 201) : 403,
      );
      if (response.ok()) created[op.path] = await response.json();
      reports.push({ perfil: role, metodo: 'POST', rota: op.path, status: response.status() });
    }
    const edits = [
      {
        key: '/estoque',
        suffix: '',
        method: 'PATCH',
        allowed: [...managers, 'ALMOXARIFE'],
        data: {
          nome: `Material revisado ${role}`,
          categoria: 'Revisado',
          estoqueMinimo: 1,
          custoUnitarioMedio: 2,
        },
      },
      {
        key: '/ordens',
        suffix: '/status',
        method: 'PATCH',
        allowed: [...managers, 'MESTRE_OBRA'],
        data: { status: 'EM_ANDAMENTO' },
      },
      {
        key: '/cronograma',
        suffix: '/progresso',
        method: 'PATCH',
        allowed: managers,
        data: { percentualExecutado: 50 },
      },
      {
        key: '/qualidade',
        suffix: '/status',
        method: 'PATCH',
        allowed: managers,
        data: { status: 'EM_ANDAMENTO' },
      },
      {
        key: '/unidades',
        suffix: '/status',
        method: 'PATCH',
        allowed: builders,
        data: { status: 'RESERVADO', situacaoEsperada: 'DISPONIVEL' },
      },
      {
        key: '/garantias',
        suffix: '/status',
        method: 'PATCH',
        allowed: managers,
        data: { status: 'EM_ATENDIMENTO' },
      },
    ];
    for (const op of edits) {
      const id = created[op.key]?.id || 1;
      const response = await request.fetch(`${base}/workspace${op.key}/${id}${op.suffix}`, {
        method: op.method,
        headers: { Authorization: `Bearer ${auth}` },
        data: op.data,
      });
      expect(response.status(), `${role} ${op.method} ${op.key}`).toBe(
        op.allowed.includes(role) ? 200 : 403,
      );
      reports.push({
        perfil: role,
        metodo: op.method,
        rota: op.key + op.suffix,
        status: response.status(),
      });
    }
    const upload = await request.post(`${base}/workspace/documentos`, {
      headers: { Authorization: `Bearer ${auth}` },
      multipart: {
        projetoObraId: String(project),
        titulo: `Documento de ${role}`,
        tipoDocumento: 'PDF',
        arquivo: { name: `${role}.pdf`, mimeType: 'application/pdf', buffer: pdf },
      },
    });
    expect(upload.status(), `${role} enviar documento`).toBe(
      [...managers, 'ARQUITETO'].includes(role) ? 201 : 403,
    );
    reports.push({ perfil: role, metodo: 'POST', rota: '/documentos', status: upload.status() });
    const download = await request.get(`${base}/workspace/documentos/${documentId}/arquivo`, {
      headers: { Authorization: `Bearer ${auth}` },
    });
    expect(download.status(), `${role} baixar documento`).toBe(
      documentReaders.includes(role) ? 200 : 403,
    );
    if (download.ok()) expect(await download.body()).toEqual(pdf);
    reports.push({
      perfil: role,
      metodo: 'GET',
      rota: '/documentos/arquivo',
      status: download.status(),
    });
    await api(request, '/workspace/minhas-sessoes/sair', undefined, auth);
  }
  await testInfo.attach('matriz-metodos', {
    body: JSON.stringify(reports, null, 2),
    contentType: 'application/json',
  });
});
