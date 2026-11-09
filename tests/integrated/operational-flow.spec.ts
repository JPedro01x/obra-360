import { test, expect, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { localCalendarDate } from '../local-calendar';

// No HTTP mocks. This journey uses a separate API on 8081, an in-memory test
// database and files under target/e2e-documents, never the operational database.
async function navigate(page: Page, name: string) {
  await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}
async function select(page: Page, label: string, name: string) {
  const field = page.getByLabel(label, { exact: true });
  const option = field.locator('option').filter({ hasText: name });
  await expect(option).toHaveCount(1);
  await field.selectOption(await option.getAttribute('value'));
}
async function save(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('complete operation through browser, API and database', async ({
  page,
  request,
}, testInfo) => {
  const password = 'SenhaE2eSegura@12345';
  const changed = 'NovaSenhaE2eSegura@12345';
  const today = localCalendarDate();
  const future = localCalendarDate(new Date(Date.now() + 7 * 86400000));
  const [installation] = await Promise.all([
    page.waitForResponse((r) => new URL(r.url()).pathname === '/api/v1/instalacao', {
      timeout: 45000,
    }),
    page.goto('/'),
  ]);
  expect(installation.status()).toBe(200);
  expect((await installation.json()).necessaria).toBe(true);
  await expect(page.getByRole('heading', { name: 'Configure sua empresa' })).toBeVisible();
  await page.getByLabel('Nome fantasia').fill('Empresa E2E');
  await page.getByLabel('Razão social').fill('Empresa de teste integrado');
  await page.getByLabel('CNPJ').fill('12345678000190');
  await page.getByLabel('Seu nome').fill('Administrador E2E');
  await page.getByLabel('E-mail', { exact: true }).fill('admin-e2e@test.invalid');
  await page.getByLabel('Senha (mínimo de 12 caracteres)').fill(password);
  await page.getByLabel('Confirme a senha').fill(password);
  await page.getByRole('button', { name: 'Criar empresa e administrador' }).click();
  async function login(secret: string, email = 'admin-e2e@test.invalid', external = false) {
    await page.getByLabel('E-mail corporativo').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(secret);
    await page.getByRole('button', { name: 'Entrar na plataforma' }).click();
    if (external)
      await expect(page.getByRole('heading', { name: 'Portal de relacionamento' })).toBeVisible();
    else await expect(page.getByRole('navigation', { name: 'Módulos da empresa' })).toBeVisible();
  }
  await login(password);
  await navigate(page, 'Usuários');
  await page.getByRole('button', { name: 'Novo usuário', exact: true }).click();
  await page.getByLabel('Nome completo').fill('Engenheiro E2E');
  await page.getByLabel('E-mail do usuário').fill('engineer-e2e@test.invalid');
  await page.getByLabel('Perfil de acesso').selectOption('ENGENHEIRO');
  await page.getByLabel('Senha inicial (mínimo de 12 caracteres)').fill(password);
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navigate(page, 'Empreendimentos');
  await page.getByRole('button', { name: 'Novo empreendimento', exact: true }).click();
  await page.getByLabel('Nome do empreendimento').fill('Obra E2E');
  await page.getByLabel('Engenheiro responsável').selectOption({ label: 'Engenheiro E2E' });
  await page.getByLabel('Área total (m²)').fill('100');
  await page.getByLabel('VGV estimado (R$)').fill('100000');
  await page.getByLabel('Data de início').fill(today);
  await page.getByLabel('Entrega prevista').fill(future);
  await page.getByRole('button', { name: 'Cadastrar empreendimento', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Obra E2E', exact: true })).toBeVisible();
  await navigate(page, 'Fornecedores');
  await page.getByRole('button', { name: 'Novo fornecedor', exact: true }).click();
  await page.getByLabel('Razão social', { exact: true }).fill('Fornecedor E2E');
  await page.getByLabel('CNPJ (sem pontuação)').fill('98765432000190');
  await page.getByLabel('Categoria', { exact: true }).selectOption('INSUMOS');
  await save(page);
  await navigate(page, 'Contratos');
  await page.getByRole('button', { name: 'Novo contrato', exact: true }).click();
  await select(page, 'Empreendimento', 'Obra E2E');
  await select(page, 'Fornecedor', 'Fornecedor E2E');
  await page.getByLabel('Número do contrato').fill('CT-E2E');
  await page.getByLabel('Valor total (R$)').fill('10000');
  await page.getByLabel('Início da vigência').fill(today);
  await page.getByLabel('Término da vigência').fill(future);
  await save(page);
  await navigate(page, 'Equipes');
  await page.getByRole('button', { name: 'Nova equipe', exact: true }).click();
  await select(page, 'Empreendimento', 'Obra E2E');
  await page.getByLabel('Nome da equipe').fill('Equipe E2E');
  await page.getByLabel('Especialidade').fill('Alvenaria');
  await select(page, 'Líder da equipe', 'Engenheiro E2E');
  await page.getByLabel('Quantidade de profissionais').fill('3');
  await save(page);
  await navigate(page, 'Almoxarifado');
  await page.getByRole('button', { name: 'Novo material', exact: true }).click();
  await select(page, 'Empreendimento', 'Obra E2E');
  await page.getByLabel('Código do material (SKU)').fill('CIMENTO-E2E');
  await page.getByLabel('Nome do material').fill('Cimento E2E');
  await page.getByLabel('Categoria', { exact: true }).fill('Cimento');
  await page.getByLabel('Unidade de medida').fill('saco');
  await page.getByLabel('Estoque mínimo').fill('3');
  await page.getByLabel('Custo unitário (R$)').fill('50');
  await save(page);
  await page
    .getByRole('row')
    .filter({ hasText: 'Cimento E2E' })
    .getByRole('button', { name: 'Movimentar estoque' })
    .click();
  await page.getByLabel('Tipo', { exact: true }).selectOption('ENTRADA');
  await page.getByLabel('Quantidade', { exact: true }).fill('10');
  await save(page);
  await navigate(page, 'Ordens de serviço');
  await page.getByRole('button', { name: 'Nova ordem de serviço', exact: true }).click();
  await select(page, 'Contrato', 'CT-E2E');
  await select(page, 'Equipe', 'Equipe E2E');
  await page.getByLabel('Descrição do serviço').fill('Executar alvenaria E2E');
  await page.getByLabel('Prazo de atendimento', { exact: true }).fill(future + 'T18:00');
  await save(page);
  const order = () => page.getByRole('row').filter({ hasText: 'Executar alvenaria E2E' });
  await order().getByRole('button', { name: 'Registrar consumo' }).click();
  await select(page, 'Material da obra', 'Cimento E2E');
  await page.getByLabel('Quantidade consumida').fill('4');
  await save(page);
  await expect(page.getByLabel('Acompanhamento operacional')).toContainText('200,00');
  for (const state of ['EM_ANDAMENTO', 'CONCLUIDO']) {
    await order().getByRole('button', { name: 'Atualizar ordem' }).click();
    await page.getByLabel('Nova situação').selectOption(state);
    await save(page);
  }
  await expect(order()).toContainText('CONCLUIDO');
  await expect(order().getByRole('button', { name: 'Registrar consumo' })).toHaveCount(0);
  await navigate(page, 'Almoxarifado');
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: 'Cimento E2E' })
      .getByRole('cell', { name: '6', exact: true }),
  ).toBeVisible();
  await navigate(page, 'Documentos');
  await page.getByRole('button', { name: 'Enviar documento', exact: true }).click();
  await select(page, 'Empreendimento', 'Obra E2E');
  await page.getByLabel('Título do documento').fill('Documento E2E');
  await page.getByLabel('Tipo do documento').fill('PDF');
  const contents = Buffer.from('%PDF-1.7\nE2E document');
  await page
    .getByLabel('Arquivo (até 20 MB)')
    .setInputFiles({ name: 'teste.pdf', mimeType: 'application/pdf', buffer: contents });
  await save(page);
  const document = () => page.getByRole('row').filter({ hasText: 'Documento E2E' }).first();
  const download = page.waitForEvent('download');
  await document().getByRole('button', { name: 'Baixar arquivo' }).click();
  const downloaded = await download;
  const filename = testInfo.outputPath('documento.pdf');
  await downloaded.saveAs(filename);
  expect(await readFile(filename)).toEqual(contents);
  await page.getByRole('button', { name: 'Minha senha', exact: true }).click();
  await page.getByLabel('Senha atual', { exact: true }).fill(password);
  await page.getByLabel('Nova senha (mínimo de 12 caracteres)').fill(changed);
  await save(page);
  await expect(page.getByRole('heading', { name: 'Acessar Plataforma' })).toBeVisible();
  await login(changed);
  await expect(page.getByRole('cell', { name: 'Obra E2E', exact: true })).toBeVisible();
  await page.getByLabel('Sair da plataforma').click();
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
  await page.getByLabel('E-mail cadastrado').fill('admin-e2e@test.invalid');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('status')).toContainText('Se existir uma conta ativa');
  await expect
    .poll(
      async () => {
        const response = await request.get('http://127.0.0.1:8025/messages');
        return (await response.json()).length;
      },
      { timeout: 10000 },
    )
    .toBeGreaterThan(0);
  const mails = await (await request.get('http://127.0.0.1:8025/messages')).json();
  const link = mails[0].text.match(/http:\/\/127\.0\.0\.1:4175\/#recuperar=[A-Za-z0-9_-]{43}/)?.[0];
  expect(link).toBeTruthy();
  await page.goto(link);
  await page
    .getByLabel('Nova senha (mínimo de 12 caracteres)', { exact: true })
    .fill('SenhaRecuperadaE2e@12345');
  await page.getByLabel('Confirme a nova senha').fill('SenhaRecuperadaE2e@12345');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('status')).toContainText('Senha redefinida');
  await page.getByRole('button', { name: 'Voltar ao acesso' }).click();
  await login('SenhaRecuperadaE2e@12345');
  await navigate(page, 'Unidades imobiliárias');
  await page.getByRole('button', { name: 'Nova unidade', exact: true }).click();
  await select(page, 'Empreendimento', 'Obra E2E');
  await page.getByLabel('Código da unidade').fill('AP-E2E');
  await page.getByLabel('Área privativa (m²)').fill('50');
  await page.getByLabel('Valor de tabela (R$)').fill('100000');
  await save(page);
  await navigate(page, 'Usuários');
  await page.getByRole('button', { name: 'Novo usuário', exact: true }).click();
  await page.getByLabel('Nome completo').fill('Cliente E2E');
  await page.getByLabel('E-mail do usuário').fill('client-e2e@test.invalid');
  await page.getByLabel('Perfil de acesso').selectOption('CLIENTE');
  await page.getByLabel('Senha inicial (mínimo de 12 caracteres)').fill(password);
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await navigate(page, 'Acessos externos');
  await page.getByRole('button', { name: 'Novo acesso externo', exact: true }).click();
  await select(page, 'Usuário externo', 'Cliente E2E');
  await select(page, 'Empreendimento', 'Obra E2E');
  await select(page, 'Unidade (obrigatória para cliente)', 'AP-E2E');
  await save(page);
  await page.getByLabel('Sair da plataforma').click();
  await login(password, 'client-e2e@test.invalid', true);
  await expect(page.getByRole('heading', { name: 'AP-E2E' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir chamado' }).click();
  await page.getByLabel('Categoria do problema').fill('Hidráulica');
  await page.getByLabel('Descreva o problema').fill('Chamado do cliente E2E');
  await save(page);
  await expect(page.getByText('Chamado do cliente E2E', { exact: true })).toBeVisible();

  // HR uses the same real API/database and its own restricted endpoints.
  await page.getByLabel('Sair da plataforma').click();
  await login('SenhaRecuperadaE2e@12345');
  await page.getByRole('button', { name: 'Recursos humanos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recursos humanos', exact: true })).toBeVisible();
  async function rhSection(name: string) {
    await page
      .getByRole('navigation', { name: 'Seções de RH' })
      .getByRole('button', { name, exact: true })
      .click();
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  }
  async function rhSave() {
    await page.getByRole('button', { name: 'Salvar RH', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await rhSection('Departamentos e cargos');
  await page.getByRole('button', { name: 'Cadastrar estrutura', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Operações E2E');
  await rhSave();
  await expect(page.getByRole('cell', { name: 'Operações E2E', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cadastrar estrutura', exact: true }).click();
  await page.getByLabel('Tipo', { exact: true }).selectOption('CARGO');
  await page.getByLabel('Nome', { exact: true }).fill('Técnico E2E');
  await select(page, 'Departamento', 'Operações E2E');
  await rhSave();
  await rhSection('Funcionários');
  await page.getByRole('button', { name: 'Cadastrar funcionário', exact: true }).click();
  await page.getByLabel('Matrícula', { exact: true }).fill('RH-E2E-001');
  await page.getByLabel('Nome completo', { exact: true }).fill('Funcionário E2E');
  await page.getByLabel('CPF (somente dígitos)', { exact: true }).fill('52998224725');
  await page.getByLabel('Data de admissão', { exact: true }).fill(today);
  await select(page, 'Departamento', 'Operações E2E');
  await select(page, 'Cargo', 'Técnico E2E');
  await page.getByLabel('Salário base / valor contratual (R$)', { exact: true }).fill('3000');
  await rhSave();
  await expect(page.getByRole('cell', { name: 'Funcionário E2E', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '***.***.247-**', exact: true })).toBeVisible();
  await page
    .getByRole('row')
    .filter({ hasText: 'RH-E2E-001' })
    .getByRole('button', { name: 'Editar', exact: true })
    .click();
  await expect(page.getByLabel('CPF (somente dígitos)', { exact: true })).toHaveValue(
    '52998224725',
  );
  await page.getByLabel('Telefone', { exact: true }).fill('11999999999');
  await rhSave();
  await rhSection('Jornada e ponto');
  await page.getByRole('button', { name: 'Cadastrar ponto', exact: true }).click();
  await select(page, 'Funcionário', 'Funcionário E2E');
  await page.getByLabel('Data da jornada', { exact: true }).fill(today);
  await page.getByLabel('Entrada', { exact: true }).fill('08:00');
  await page.getByLabel('Saída para intervalo', { exact: true }).fill('12:00');
  await page.getByLabel('Retorno do intervalo', { exact: true }).fill('13:00');
  await page.getByLabel('Saída', { exact: true }).fill('17:00');
  await rhSave();
  await expect(page.getByRole('cell', { name: '8h 0min', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Aprovar', exact: true }).click();
  await rhSave();
  await expect(page.getByRole('cell', { name: 'APROVADO', exact: true })).toBeVisible();
  await rhSection('Folha e pagamentos');
  await page.getByRole('button', { name: 'Cadastrar folha', exact: true }).click();
  await page.getByLabel('Competência', { exact: true }).fill(today.slice(0, 7));
  await rhSave();
  await page.getByRole('button', { name: 'Ver lançamentos', exact: true }).click();
  await page.getByRole('button', { name: 'Cadastrar lançamento', exact: true }).click();
  await select(page, 'Funcionário', 'Funcionário E2E');
  await page.getByLabel('Código da rubrica', { exact: true }).fill('SALARIO');
  await page.getByLabel('Descrição da rubrica', { exact: true }).fill('Valor conferido E2E');
  await page.getByLabel('Valor (R$)', { exact: true }).fill('3000');
  await rhSave();
  await rhSection('Folha e pagamentos');
  await expect(page.getByRole('cell', { name: /3.000,00/ })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar folha', exact: true }).click();
  await rhSave();
  await expect(page.getByRole('cell', { name: 'FECHADA', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar pagamento', exact: true }).click();
  await page.getByLabel('Data do pagamento', { exact: true }).fill(today);
  await rhSave();
  await expect(page.getByRole('cell', { name: 'PAGA', exact: true })).toBeVisible();
  await select(page, 'Competência do demonstrativo', today.slice(0, 7));
  await select(page, 'Funcionário do demonstrativo', 'Funcionário E2E');
  await page.getByRole('button', { name: 'Consultar demonstrativo', exact: true }).click();
  await expect(page.getByText(/Líquido informado:/)).toContainText('3.000,00');

  // Private HR dossier, salary history and versioned real files.
  await rhSection('Funcionários');
  await page
    .getByRole('row')
    .filter({ hasText: 'RH-E2E-001' })
    .getByRole('button', { name: 'Editar', exact: true })
    .click();
  await page.getByLabel('Salário base / valor contratual (R$)', { exact: true }).fill('3500');
  await page.getByRole('button', { name: 'Salvar RH', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Informe o motivo');
  await page
    .getByLabel('Motivo da alteração funcional', { exact: true })
    .fill('Revisão salarial E2E aprovada');
  await rhSave();
  await rhSection('Histórico funcional');
  await expect(page.getByText('Revisão salarial E2E aprovada', { exact: true })).toBeVisible();
  const change = page
    .locator('.rh-history-event')
    .filter({ hasText: 'Revisão salarial E2E aprovada' });
  await expect(change.getByRole('cell', { name: /3.000,00/ })).toBeVisible();
  await expect(change.getByRole('cell', { name: /3.500,00/ })).toBeVisible();
  await rhSection('Documentos privados');
  await page.getByRole('button', { name: 'Enviar documento privado', exact: true }).click();
  await select(page, 'Funcionário do documento', 'Funcionário E2E');
  await page.getByLabel('Título do documento privado', { exact: true }).fill('Contrato RH E2E');
  await page.getByLabel('Categoria do documento privado', { exact: true }).selectOption('CONTRATO');
  const privateOriginal = Buffer.from('%PDF-1.7\nContrato privado E2E');
  await page.getByLabel('Arquivo privado', { exact: true }).setInputFiles({
    name: 'contrato-rh.pdf',
    mimeType: 'application/pdf',
    buffer: privateOriginal,
  });
  await page.getByRole('button', { name: 'Salvar documento privado', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Contrato RH E2E CONTRATO' })).toBeVisible();
  const privateDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar privado', exact: true }).click();
  const savedPrivate = await privateDownload;
  const privatePath = testInfo.outputPath('contrato-privado.pdf');
  await savedPrivate.saveAs(privatePath);
  expect(await readFile(privatePath)).toEqual(privateOriginal);
  await page.getByRole('button', { name: 'Nova versão privada', exact: true }).click();
  await page.getByLabel('Arquivo privado', { exact: true }).setInputFiles({
    name: 'contrato-rh-v2.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\nNova versão E2E'),
  });
  await page.getByRole('button', { name: 'Salvar documento privado', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Baixar privado', exact: true })).toHaveCount(2);
  const oldPrivate = page.getByRole('row').filter({ hasText: 'contrato-rh.pdf' });
  await oldPrivate.getByRole('button', { name: 'Arquivar documento', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Baixar privado', exact: true })).toHaveCount(1);
  await page.getByLabel('Incluir documentos arquivados').check();
  await expect(page.getByRole('button', { name: 'Baixar privado', exact: true })).toHaveCount(2);
  await oldPrivate.getByRole('button', { name: 'Reativar documento', exact: true }).click();
  await expect(oldPrivate.getByRole('cell', { name: 'Ativo', exact: true })).toBeVisible();

  // Real model editor: dimensions, openings, multiple floors, revisions and copies.
  await page.getByRole('button', { name: 'Modelador 2D/3D', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Modelador 2D/3D', exact: true })).toBeVisible();
  await select(page, 'Obra do modelo', 'Obra E2E');
  await page.getByRole('button', { name: 'Novo modelo', exact: true }).click();
  await page.getByLabel('Nome do novo modelo', { exact: true }).fill('Projeto arquitetônico E2E');
  await page.getByRole('button', { name: 'Criar modelo vazio', exact: true }).click();
  await expect(page.getByLabel('Nome do modelo', { exact: true })).toHaveValue(
    'Projeto arquitetônico E2E',
  );
  const referencePage = await page.context().newPage();
  let referencePdf: Buffer;
  let referenceImage: Buffer;
  try {
    await referencePage.setContent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect x="80" y="60" width="160" height="120" fill="white" stroke="black" stroke-width="4"/></svg>');
    referenceImage = await referencePage.locator('svg').screenshot();
    referencePdf = await referencePage.pdf({ width: '340px', height: '260px' });
  } finally {
    await referencePage.close();
  }
  await page.getByText('Usar planta PDF ou imagem como referência', { exact: true }).click();
  const referenceInput = page.getByLabel('Arquivo da planta', { exact: true });
  const referencePlan = page.getByRole('img', { name: 'Planta 2D editável em metros', exact: true });
  const referenceGraphic = referencePlan.locator('image');
  await referenceInput.setInputFiles({ name: 'planta.pdf', mimeType: 'application/pdf', buffer: referencePdf });
  await expect(referenceGraphic).toHaveCount(1);
  await page.getByRole('button', { name: 'Remover referência', exact: true }).click();
  await expect(referenceGraphic).toHaveCount(0);
  await referenceInput.setInputFiles({ name: 'planta.png', mimeType: 'image/png', buffer: referenceImage });
  await expect(referenceGraphic).toHaveCount(1);
  await page.getByLabel('Distância real (m)', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Calibrar escala', exact: true }).click();
  await referencePlan.scrollIntoViewIfNeeded();
  const endpoints = () => referenceGraphic.evaluate((node) => {
    const image = node as SVGImageElement;
    const y = image.y.baseVal.value + image.height.baseVal.value / 4;
    return [0.25, 0.75].map((ratio) => {
      const point = new DOMPoint(image.x.baseVal.value + image.width.baseVal.value * ratio, y)
        .matrixTransform(image.getScreenCTM()!);
      return { x: point.x, y: point.y };
    });
  });
  const [scaleStart, scaleEnd] = await endpoints();
  await page.mouse.click(scaleStart.x, scaleStart.y);
  await page.mouse.click(scaleEnd.x, scaleEnd.y);
  await expect(page.getByText('Escala calibrada. A planta está pronta para traçar.')).toBeVisible();
  await referencePlan.scrollIntoViewIfNeeded();
  const [wallStart, wallEnd] = await endpoints();
  await page.mouse.move(wallStart.x, wallStart.y);
  await page.mouse.down();
  await page.mouse.move(wallEnd.x, wallEnd.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  await expect(page.getByLabel('Largura (m)', { exact: true })).toHaveValue('6');
  await page.getByRole('button', { name: 'Remover referência', exact: true }).click();
  await page.getByLabel('Rotação Y (graus)', { exact: true }).fill('30');
  await page.getByRole('button', { name: 'Aplicar propriedades', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar porta', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar janela', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar laje', exact: true }).click();
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Refazer', exact: true }).click();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(4);
  await page.getByText('Pavimento e estrutura', { exact: true }).click();
  await page.getByRole('button', { name: 'Duplicar pavimento', exact: true }).click();
  await expect(page.getByLabel('Pavimento ativo', { exact: true }).locator('option')).toHaveCount(
    2,
  );
  await page.getByLabel('Todos os pavimentos em 3D').check();
  await expect(page.getByRole('img', { name: 'Vista 3D do modelo', exact: true })).toBeVisible();
  await page.getByLabel('Motivo da revisão 3D', { exact: true }).fill('Planta e pavimentos E2E');
  await page.getByText('Rascunho privado no servidor', { exact: true }).click();
  await page.getByRole('button', { name: 'Guardar rascunho no servidor', exact: true }).click();
  await expect(page.getByText('Rascunho guardado no servidor para esta conta.', { exact: true })).toBeVisible();
  const secondDevice = await page.context().browser()!.newContext();
  try {
    const remotePage = await secondDevice.newPage();
    await remotePage.goto(new URL('/', page.url()).toString());
    await remotePage.getByLabel('E-mail corporativo').fill('admin-e2e@test.invalid');
    await remotePage.getByLabel('Senha', { exact: true }).fill('SenhaRecuperadaE2e@12345');
    await remotePage.getByRole('button', { name: 'Entrar na plataforma' }).click();
    await remotePage.getByRole('button', { name: 'Modelador 2D/3D', exact: true }).click();
    await select(remotePage, 'Obra do modelo', 'Obra E2E');
    await remotePage.getByRole('button', { name: /Projeto arquitetônico E2E/ }).click();
    await remotePage.getByText('Rascunho privado no servidor · disponível', { exact: true }).click();
    await remotePage.getByRole('button', { name: 'Recuperar rascunho do servidor', exact: true }).click();
    await expect(remotePage.locator('.model-element-list').getByRole('button')).toHaveCount(4);
    await expect(remotePage.getByText('Alterações não salvas', { exact: true })).toBeVisible();
  } finally {
    await secondDevice.close();
  }
  const removedDraft = page.waitForResponse((response) =>
    response.url().endsWith('/rascunho') && response.request().method() === 'GET' && response.status() === 204,
  );
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click();
  await removedDraft;
  await expect(page.getByText('Salvo · revisão 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recarregar', exact: true }).click();
  await expect(page.getByLabel('Pavimento ativo', { exact: true }).locator('option')).toHaveCount(
    2,
  );
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath('modelador-2d-3d.png'), fullPage: true });
  const exportEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar projeto JSON', exact: true }).click();
  const modelExport = await exportEvent;
  const modelPath = testInfo.outputPath('modelo.json');
  await modelExport.saveAs(modelPath);
  const modelJson = JSON.parse(await readFile(modelPath, 'utf8'));
  expect(modelJson.documento.elementos).toHaveLength(8);
  expect(modelJson.documento.elementos.find((e: any) => e.tipo === 'PAREDE')).toMatchObject({
    largura: 6,
    rotacao: 30,
  });
  await page.getByText('Compartilhar planta com o cliente', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Unidade para publicar', exact: true })
    .selectOption({ label: 'AP-E2E' });
  await page.getByRole('spinbutton', { name: 'Revisão para publicar' }).fill('2');
  await page.getByRole('button', { name: 'Aplicar publicação', exact: true }).click();
  await expect(page.getByText('Planta disponível aos clientes vinculados à unidade.')).toBeVisible();
  await page.getByRole('button', { name: 'Duplicar modelo salvo', exact: true }).click();
  await page
    .getByLabel('Nome do novo modelo', { exact: true })
    .fill('Alternativa arquitetônica E2E');
  await page.getByRole('button', { name: 'Criar cópia do modelo salvo', exact: true }).click();
  await expect(page.getByLabel('Nome do modelo', { exact: true })).toHaveValue(
    'Alternativa arquitetônica E2E',
  );
  await page.getByLabel('Modo de visualização do modelo', { exact: true }).selectOption('2d');
  await page
    .locator('.model-element-list')
    .getByRole('button')
    .filter({ hasText: 'Parede' })
    .click();
  await page.getByLabel('Posição X (m)', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Aplicar propriedades', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click();
  await expect(page.getByText('Salvo · revisão 2', { exact: true })).toBeVisible();
  await page.getByText('Revisões salvas · 2', { exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Restaurar revisão 1', exact: true }).click();
  await expect(page.getByText('Salvo · revisão 3', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Arquivar modelo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reativar modelo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reativar modelo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Arquivar modelo', exact: true })).toBeVisible();

  const elementButtons = page.locator('.model-element-list').getByRole('button');
  const originalElements = await elementButtons.count();
  await page.getByRole('button', { name: 'Adicionar pilar', exact: true }).click();
  await expect(elementButtons).toHaveCount(originalElements + 1);
  await page.getByRole('button', { name: 'Duplicar seleção', exact: true }).click();
  await expect(elementButtons).toHaveCount(originalElements + 2);
  await page.getByRole('button', { name: 'Excluir seleção', exact: true }).click();
  await expect(elementButtons).toHaveCount(originalElements + 1);
  await elementButtons.filter({ hasText: 'Pilar' }).click();
  await page.getByRole('button', { name: 'Excluir seleção', exact: true }).click();
  await expect(elementButtons).toHaveCount(originalElements);
  const floorDetails = page.locator('.model-inspector details').first();
  if ((await floorDetails.getAttribute('open')) === null)
    await floorDetails.locator('summary').click();
  await page.getByRole('button', { name: 'Adicionar pavimento', exact: true }).click();
  await expect(page.getByLabel('Pavimento ativo', { exact: true }).locator('option')).toHaveCount(
    3,
  );
  await page.getByLabel('Nome do pavimento', { exact: true }).fill('Pavimento vazio de teste');
  await page.getByRole('button', { name: 'Aplicar pavimento', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir pavimento vazio', exact: true }).click();
  await expect(page.getByLabel('Pavimento ativo', { exact: true }).locator('option')).toHaveCount(
    2,
  );
  const importChooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Importar projeto JSON', exact: true }).click();
  await (await importChooser).setFiles(modelPath);
  await expect(page.getByLabel('Nome do modelo', { exact: true })).toHaveValue(
    'Projeto arquitetônico E2E',
  );
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Já existe um modelo com esse nome');
  await expect(page.getByLabel('Nome do modelo', { exact: true })).toHaveValue(
    'Projeto arquitetônico E2E',
  );
  await page.getByLabel('Nome do modelo', { exact: true }).fill('Alternativa importada E2E');
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click();
  await expect(page.getByText('Salvo · revisão 4', { exact: true })).toBeVisible();

  // Architectural plan: connected rectangle, room name, associative dimensions and scaled sheet.
  await page.getByRole('button', { name: 'Novo modelo', exact: true }).click();
  await page.getByLabel('Nome do novo modelo', { exact: true }).fill('Planta anotada E2E');
  await page.getByRole('button', { name: 'Criar modelo vazio', exact: true }).click();
  const specs = [
    { x: 2, z: 0, width: 4, angle: 0 },
    { x: 4, z: 1.5, width: 3, angle: -90 },
    { x: 2, z: 3, width: 4, angle: 180 },
    { x: 0, z: 1.5, width: 3, angle: 90 },
  ];
  for (const spec of specs) {
    await page.getByRole('button', { name: 'Adicionar parede', exact: true }).click();
    await page.getByLabel('Posição X (m)', { exact: true }).fill(String(spec.x));
    await page.getByLabel('Posição Z (m)', { exact: true }).fill(String(spec.z));
    await page.getByLabel('Largura (m)', { exact: true }).fill(String(spec.width));
    await page.getByLabel('Rotação Y (graus)', { exact: true }).fill(String(spec.angle));
    await page.getByRole('button', { name: 'Aplicar propriedades', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Conectar paredes do pavimento', exact: true }).click();
  await page.getByRole('button', { name: 'Identificar ambientes', exact: true }).click();
  await page.getByText('Ambientes identificados · 1', { exact: true }).click();
  await expect(
    page.getByText('12.00 m² pelo eixo · perímetro 14.00 m', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Nome do ambiente 1', { exact: true }).fill('Sala de projeto');
  await page.getByRole('button', { name: 'Renomear ambiente', exact: true }).click();
  await page
    .locator('.model-element-list')
    .getByRole('button', { name: 'Parede · Parede 1', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cotar parede selecionada', exact: true }).click();
  await page.getByText('Cotas do pavimento · 1', { exact: true }).click();
  await page.getByText('Cota 1 · 4.00 m · alinhada', { exact: true }).click();
  await page.getByLabel('Afastamento da cota 1', { exact: true }).fill('-0.4');
  await page.getByRole('button', { name: 'Aplicar cota', exact: true }).click();
  const plan = page.getByRole('img', { name: 'Planta 2D editável em metros', exact: true });
  await plan.scrollIntoViewIfNeeded();
  const positions = await plan.evaluate((svg: any) => {
    const matrix = svg.getScreenCTM();
    const a = new DOMPoint(4, 0).matrixTransform(matrix),
      b = new DOMPoint(5, 0).matrixTransform(matrix);
    return { ax: a.x, ay: a.y, bx: b.x, by: b.y };
  });
  await page.mouse.move(positions.ax, positions.ay);
  await page.mouse.down();
  await page.mouse.move(positions.bx, positions.by, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByText('13.50 m² (eixo)', { exact: true })).toBeVisible();
  await expect(
    page.locator('.plan-dimension-mark').getByText('5.00 m', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click();
  await expect(page.getByText('Salvo · revisão 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recarregar', exact: true }).click();
  await expect(page.getByText('Sala de projeto', { exact: true })).toBeVisible();
  await expect(page.getByText('13.50 m² (eixo)', { exact: true })).toBeVisible();
  await page.getByText('Preparar impressão em escala', { exact: true }).click();
  await page.getByLabel('Escala da planta', { exact: true }).selectOption('50');
  const sheetEvent = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir planta para impressão', exact: true }).click();
  const sheet = await sheetEvent;
  await expect(sheet.getByText('ESCALA 1:50', { exact: true })).toBeVisible();
  await expect(sheet.getByText('Sala de projeto', { exact: true })).toBeVisible();
  await sheet.screenshot({ path: testInfo.outputPath('planta-em-escala.png'), fullPage: true });
  await sheet.emulateMedia({ media: 'print' });
  await sheet.pdf({
    path: testInfo.outputPath('planta-em-escala.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  await sheet.close();
  const revisions = page.getByText('Revisões salvas · 2', { exact: true });
  if (!(await revisions.evaluate((summary) => summary.closest('details')?.open)))
    await revisions.click();
  await page.getByRole('button', { name: 'Abrir timelapse', exact: true }).click();
  const timeline = page.getByRole('region', { name: 'Timelapse das revisões' });
  await expect(timeline.getByText(/Revisão exibida: 1/)).toBeVisible();
  await timeline.getByRole('button', { name: 'Reproduzir timelapse', exact: true }).click();
  await expect(timeline.getByText(/Revisão exibida: 2/)).toBeVisible();
  await page.getByRole('button', { name: 'Fechar timelapse', exact: true }).click();
  await page.getByText('Compartilhar planta com o cliente', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Unidade para publicar', exact: true }).selectOption({ label: 'AP-E2E' });
  await page.getByRole('spinbutton', { name: 'Revisão para publicar' }).fill('1');
  await page.getByRole('button', { name: 'Ver prévia da revisão', exact: true }).click();
  const preview = page.getByRole('region', { name: 'Prévia da revisão', exact: true });
  await expect(preview.getByRole('heading', { name: 'Planta anotada E2E · revisão 1' })).toBeVisible();
  await expect(preview.getByRole('img', { name: 'Vista 3D do modelo', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar prévia', exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar publicação', exact: true }).click();
  await expect(page.getByText('Planta disponível aos clientes vinculados à unidade.')).toBeVisible();
  await page.getByRole('button', { name: 'Ver histórico de publicação', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Histórico de publicação', exact: true }))
    .toContainText('publicada · revisão 1 · AP-E2E · Administrador E2E');
  await page.getByRole('button', { name: 'Conta e atendimento', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Conta e atendimento', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Esta sessão', { exact: false })).toBeVisible();
  await page.getByLabel('Assunto', { exact: true }).fill('Dúvida operacional E2E');
  await page.getByLabel('Descrição', { exact: true }).fill('Validar atendimento persistido.');
  await page.getByRole('button', { name: 'Registrar solicitação', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Dúvida operacional E2E/ })).toBeVisible();
  await page.getByLabel('Resposta', { exact: true }).fill('Solicitação recebida e conferida.');
  await page.getByLabel('Situação', { exact: true }).selectOption('EM_ANALISE');
  await page.getByRole('button', { name: 'Salvar resposta', exact: true }).click();
  await expect(page.getByText('SUPORTE · EM_ANALISE', { exact: true })).toBeVisible();
  await page.getByLabel('Confirme sua senha', { exact: true }).fill('SenhaRecuperadaE2e@12345');
  const companyExportEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar exportação privada', exact: true }).click();
  const exported = await companyExportEvent;
  expect((await readFile((await exported.path())!)).subarray(0, 2).toString()).toBe('PK');
  await page.getByLabel('E-mail do convidado', { exact: true }).fill('invited-e2e@test.invalid');
  await page.getByLabel('Perfil', { exact: true }).selectOption('AUDITOR');
  await page.getByRole('button', { name: 'Gerar convite', exact: true }).click();
  const invitation = await page
    .getByLabel('Link privado (exibido apenas agora)', { exact: true })
    .inputValue();
  const guest = await page.context().browser()!.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto(invitation);
  await guestPage.getByLabel('Seu nome', { exact: true }).fill('Auditor convidado E2E');
  await guestPage.getByLabel('Nova senha', { exact: true }).fill(password);
  await guestPage.getByLabel('Confirmar senha', { exact: true }).fill(password);
  await guestPage.getByRole('button', { name: 'Criar meu acesso', exact: true }).click();
  await expect(guestPage.getByLabel('E-mail corporativo')).toBeVisible();
  await guest.close();
  await page.getByLabel('Senha atual', { exact: true }).fill('SenhaRecuperadaE2e@12345');
  await page.getByRole('button', { name: 'Configurar autenticador', exact: true }).click();
  await expect(page.getByText(/A configuração expira em 10 minutos/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('conta-atendimento.png'), fullPage: true });
  const oldToken = await page.evaluate(() => sessionStorage.getItem('obra360_access_token'));
  await page.getByRole('button', { name: 'Sair da plataforma', exact: true }).click();
  await expect(page.getByLabel('E-mail corporativo')).toBeVisible();
  const revoked = await request.get('http://127.0.0.1:8081/api/v1/workspace/sessao', {
    headers: { Authorization: `Bearer ${oldToken}` },
  });
  expect(revoked.status()).toBe(401);
  await login(password, 'client-e2e@test.invalid', true);
  await page.getByRole('button', { name: 'Ver plantas da unidade', exact: true }).click();
  const publishedPlans = page.getByRole('combobox', { name: 'Planta da unidade', exact: true });
  await publishedPlans.selectOption({ label: 'Projeto arquitetônico E2E' });
  await expect(page.getByRole('heading', { name: 'Projeto arquitetônico E2E · revisão 2' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Planta 2D em metros', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Vista 3D do modelo', exact: true })).toBeVisible();
  await publishedPlans.selectOption({ label: 'Planta anotada E2E' });
  await expect(page.getByRole('heading', { name: 'Planta anotada E2E · revisão 1' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Planta 2D em metros', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Vista 3D do modelo', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar modelo', exact: true })).toHaveCount(0);
});
