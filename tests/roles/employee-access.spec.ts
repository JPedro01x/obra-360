import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { localCalendarDate } from '../local-calendar';

// Synthetic records in the isolated API on 8081; never the operational database.
test('COLABORADOR: first password, personal portal, restricted access and logout', async ({ page, request }) => {
  const base = 'http://127.0.0.1:8081/api/v1';
  const adminEmail = 'super_admin@role-audit.test.invalid';
  const adminPassword = 'SenhaAuditoriaIsolada@12345';
  if ((await (await request.get(`${base}/instalacao`)).json()).necessaria) {
    const setup = await request.post(`${base}/instalacao`, { data: {
      nomeFantasia: 'Auditoria isolada', razaoSocial: 'Empresa de teste de perfis',
      cnpj: '11111111111111', nome: 'Administrador de teste', email: adminEmail,
      senha: adminPassword, ambienteDados: 'HOMOLOGACAO',
    } });
    expect(setup.status()).toBe(201);
  }
  const login = await request.post(`${base}/auth/login`, { data: { email: adminEmail, senha: adminPassword } });
  expect(login.status()).toBe(200);
  const admin = (await login.json()).token;
  const suffix = randomUUID().slice(0, 8);
  const create = async (resource: string, data: object) => {
    const response = await request.post(`${base}/workspace/rh/${resource}`, { headers: { Authorization: `Bearer ${admin}` }, data });
    expect(response.status()).toBe(200);
    return response.json();
  };
  const department = await create('estrutura', { tipo: 'DEPARTAMENTO', nome: `Depto ${suffix}`, ativo: true });
  const job = await create('estrutura', { tipo: 'CARGO', nome: `Cargo ${suffix}`, departamentoId: department.id, ativo: true });
  const email = `staff-${suffix}@role-audit.test.invalid`;
  const employee = await create('funcionarios', {
    matricula: `AUD-${suffix}`, nome: 'Funcionário sintético da auditoria', cpf: '52998224725',
    email, admissao: localCalendarDate(), vinculo: 'CLT', departamentoId: department.id,
    cargoId: job.id, salarioBase: 2500, jornadaSemanalMinutos: 2640,
  });
  expect(employee.acessoInicial.perfil).toBe('COLABORADOR');
  const initialPassword = employee.acessoInicial.senha;
  const personalPassword = 'SenhaPessoalAuditoria@12345';
  async function enter(password: string) {
    await page.locator('input[type=radio][value="COLABORADOR"]').check();
    await page.getByLabel('E-mail corporativo', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar na plataforma', exact: true }).click();
  }
  await page.goto('/');
  await enter(initialPassword);
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Primeiro acesso: defina sua senha' })).toBeVisible();
  const initialToken = await page.evaluate(() => sessionStorage.getItem('obra360_access_token'));
  expect((await request.get(`${base}/workspace/colaborador`, {
    headers: { Authorization: `Bearer ${initialToken}` },
  })).status()).toBe(403);
  await page.getByLabel('Senha atual', { exact: true }).fill(initialPassword);
  await page.getByLabel('Nova senha (mínimo de 12 caracteres)', { exact: true }).fill(personalPassword);
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByLabel('E-mail corporativo', { exact: true })).toBeVisible();
  expect((await request.get(`${base}/workspace/sessao`, {
    headers: { Authorization: `Bearer ${initialToken}` },
  })).status()).toBe(401);
  await enter(personalPassword);
  await expect(page.getByRole('heading', { name: 'Meu cadastro', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recursos humanos', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Usuários', exact: true })).toHaveCount(0);
  const token = await page.evaluate(() => sessionStorage.getItem('obra360_access_token'));
  const headers = { Authorization: `Bearer ${token}` };
  const profile = await request.get(`${base}/workspace/colaborador`, { headers });
  expect(profile.status()).toBe(200);
  expect((await profile.json()).matricula).toBe(`AUD-${suffix}`);
  for (const resource of ['rh/registros/funcionarios', 'registros/usuarios', 'registros/contratos'])
    expect((await request.get(`${base}/workspace/${resource}`, { headers })).status()).toBe(403);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Sair da plataforma', exact: true }).click();
  await expect(page.getByLabel('E-mail corporativo', { exact: true })).toBeVisible();
  expect((await request.get(`${base}/workspace/sessao`, { headers })).status()).toBe(401);
});
