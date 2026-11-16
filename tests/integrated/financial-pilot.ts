import { expect, type Page, type APIRequestContext, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { localCalendarDate } from '../local-calendar';

/** Real UI/API journey against the isolated integrated server; no route mocking. */
export async function financialPilot(page: Page, request: APIRequestContext, info: TestInfo) {
  const token = await page.evaluate(() => sessionStorage.getItem('obra360_access_token'));
  const base = 'http://127.0.0.1:8081/api/v1';
  const headers = { Authorization: `Bearer ${token}` };
  async function get(path: string) {
    const response = await request.get(base + path, { headers });
    expect(response.status(), path).toBe(200);
    return response.json();
  }
  async function save() {
    await page.getByRole('dialog').getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  const project = (await get('/workspace/registros/projetos?size=100')).items.find(
    (p: any) => p.nome === 'Obra E2E',
  );
  const supplier = (await get('/workspace/registros/fornecedores?size=100')).items.find(
    (f: any) => f.razaoSocial === 'Fornecedor E2E',
  );
  const stock = (await get('/workspace/registros/estoque?size=100')).items.find(
    (i: any) => i.nome === 'Cimento E2E',
  );
  const originalBalance = Number(stock.quantidadeAtual);
  const second = await request.post(base + '/workspace/estoque', {
    headers,
    data: {
      projetoObraId: project.id,
      sku: 'AREIA-PILOTO',
      nome: 'Areia piloto integrado',
      categoria: 'Agregados',
      unidadeMedida: 'm3',
      estoqueMinimo: 0,
      custoUnitarioMedio: 30,
    },
  });
  expect(second.status()).toBe(201);
  const sand = await second.json();
  await page.getByRole('button', { name: 'Orçamento e financeiro', exact: true }).click();
  await page.getByLabel('Obra da gestão', { exact: true }).selectOption(String(project.id));
  await page.getByRole('button', { name: 'Novo orçamento', exact: true }).click();
  await page.getByLabel('Investimento previsto (R$)', { exact: true }).fill('25000');
  await page
    .getByLabel('Justificativa da revisão', { exact: true })
    .fill('Investimento aprovado para piloto técnico isolado');
  await save();
  await page.getByRole('button', { name: 'Aprovar orçamento', exact: true }).click();
  await save();
  expect((await get(`/workspace/gestao/resumo/${project.id}`)).investimentoAprovado).toBe(25000);

  await page.getByRole('button', { name: 'Pedidos de materiais', exact: true }).click();
  await page.getByLabel('Obra da gestão', { exact: true }).selectOption(String(project.id));
  await page.getByRole('button', { name: 'Novo pedido de materiais', exact: true }).click();
  await page.getByLabel('Fornecedor do pedido', { exact: true }).selectOption(String(supplier.id));
  await page
    .getByLabel('Referência da proposta comercial', { exact: true })
    .fill('PILOTO-SINTETICO-001');
  await page
    .getByLabel('Justificativa do pedido', { exact: true })
    .fill('Materiais do piloto técnico sem validade comercial');
  await page.getByLabel('Vencimento do compromisso', { exact: true }).fill(localCalendarDate());
  await page.getByLabel('Material 1', { exact: true }).selectOption(String(stock.id));
  await page.getByLabel('Quantidade 1', { exact: true }).fill('4');
  await page.getByLabel('Preço unitário 1 (R$)', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Adicionar material ao pedido', exact: true }).click();
  await page.getByLabel('Material 2', { exact: true }).selectOption(String(sand.id));
  await page.getByLabel('Quantidade 2', { exact: true }).fill('2');
  await page.getByLabel('Preço unitário 2 (R$)', { exact: true }).fill('30');
  await page.getByRole('button', { name: 'Enviar para aprovação', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const order = (await get(`/workspace/gestao/registros/pedidos?projetoObraId=${project.id}`))
    .items[0];
  expect(order.total).toBe(140);
  await page.getByRole('button', { name: 'Ver pedido e entregas', exact: true }).click();
  await page.getByRole('button', { name: 'Aprovar na gestão', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aprovar na gestão', exact: true })).toHaveCount(0);
  const login = await request.post(base + '/auth/login', {
    data: { email: 'finance-e2e@test.invalid', senha: 'SenhaE2eSegura@12345' },
  });
  expect(login.status()).toBe(200);
  const finance = await login.json();
  const details = await get(`/workspace/gestao/pedidos/${order.id}`);
  const approved = await request.post(base + `/workspace/gestao/pedidos/${order.id}/aprovar`, {
    headers: { Authorization: `Bearer ${finance.token}` },
    data: { versao: details.pedido.versao, alcada: 'FINANCEIRO' },
  });
  expect(approved.status()).toBe(200);
  await request.post(base + '/workspace/minhas-sessoes/sair', {
    headers: { Authorization: `Bearer ${finance.token}` },
  });
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('button', { name: 'Ver pedido e entregas', exact: true }).click();
  await page.getByRole('button', { name: 'Emitir pedido e conta a pagar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Registrar entrega', exact: true })).toBeVisible();
  async function delivery(cement: string, sandQuantity?: string) {
    await page.getByRole('button', { name: 'Registrar entrega', exact: true }).click();
    await page.getByLabel('Quantidade: Cimento E2E', { exact: true }).fill(cement);
    if (sandQuantity)
      await page
        .getByLabel('Quantidade: Areia piloto integrado', { exact: true })
        .fill(sandQuantity);
    await page
      .getByLabel('Documento e justificativa', { exact: true })
      .fill('Entrega fictícia conferida no piloto técnico');
    await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Confirmar entrega', exact: true })).toHaveCount(
      0,
    );
  }
  await delivery('2');
  await expect(page.getByRole('dialog')).toContainText('PARCIAL');
  await delivery('2', '2');
  await expect(page.getByRole('dialog')).toContainText('RECEBIDO');
  await page.getByRole('button', { name: 'Registrar devolução', exact: true }).click();
  await page.getByLabel('Quantidade: Cimento E2E', { exact: true }).fill('1');
  await page
    .getByLabel('Documento e justificativa', { exact: true })
    .fill('Devolução fictícia de um material do piloto');
  await page.getByRole('button', { name: 'Confirmar devolução', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Crédito #');
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar', exact: true }).click();
  const balances = (await get('/workspace/registros/estoque?size=100')).items;
  expect(Number(balances.find((i: any) => i.id === stock.id).quantidadeAtual)).toBe(
    originalBalance + 3,
  );
  expect(Number(balances.find((i: any) => i.id === sand.id).quantidadeAtual)).toBe(2);

  await page.getByRole('button', { name: 'Orçamento e financeiro', exact: true }).click();
  await page.getByLabel('Obra da gestão', { exact: true }).selectOption(String(project.id));
  await page.getByRole('button', { name: 'Contas a pagar e receber', exact: true }).click();
  await page
    .getByRole('row')
    .filter({ hasText: `Pedido de materiais #${order.id}` })
    .getByRole('button', { name: 'Registrar baixa', exact: true })
    .click();
  await page.getByLabel('Valor da baixa (R$)', { exact: true }).fill('40');
  await page.getByLabel('Data efetiva', { exact: true }).fill(localCalendarDate());
  await page.getByLabel('Conta bancária ou caixa', { exact: true }).fill('BANCO-PILOTO');
  await page
    .getByLabel('Comprovante ou observação', { exact: true })
    .fill('Comprovante fictício do piloto técnico');
  await save();
  const payment = (await get(`/workspace/gestao/registros/baixas?projetoObraId=${project.id}`))
    .items[0];
  await page.getByRole('button', { name: 'Conciliação bancária', exact: true }).click();
  await page.getByRole('button', { name: 'Importar extrato CSV', exact: true }).click();
  await page.getByLabel('Conta do extrato', { exact: true }).fill('BANCO-PILOTO');
  await page
    .getByLabel('Conteúdo do extrato', { exact: true })
    .fill(
      `identificador;data;descricao;valor\nPILOTO-1;${localCalendarDate()};Pagamento ficticio;-40\n`,
    );
  await page.getByRole('button', { name: 'Importar movimentos', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Conciliar', exact: true }).click();
  await page.getByLabel('ID da baixa correspondente', { exact: true }).fill(String(payment.id));
  await save();
  const bank = (await get(`/workspace/gestao/registros/extrato?projetoObraId=${project.id}`))
    .items[0];
  expect(bank.baixaId).toBe(payment.id);
  const totals = await get(`/workspace/gestao/resumo/${project.id}`);
  expect(totals.despesasComprometidas).toBe(140);
  expect(totals.creditosDevolucao).toBe(20);
  expect(totals.pagamentosRegistrados).toBe(40);
  expect(totals.saldoPagar).toBe(100);
  expect(totals.saldoReceber).toBe(20);
  expect(totals.saldoOrcamento).toBe(24880);
  await page.screenshot({
    path: info.outputPath('piloto-financeiro-conciliacao.png'),
    fullPage: true,
  });
  await writeFile(
    info.outputPath('piloto-financeiro.json'),
    JSON.stringify(
      {
        tipo: 'PILOTO_TECNICO_SINTETICO',
        aceiteHumano: false,
        projetoId: project.id,
        pedidoId: order.id,
        totais: totals,
        cenarios: [
          'orçamento aprovado',
          'pedido com dois materiais',
          'aprovação por duas pessoas',
          'entrega parcial e integral',
          'devolução e crédito',
          'baixa parcial',
          'extrato e conciliação',
          'saldos conferidos no banco via API',
        ],
      },
      null,
      2,
    ),
  );
}
