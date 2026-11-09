import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { readCredentials } from './homologacao-credentials.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const credentials = await readCredentials(root);
const checks = [];
const browser = await chromium.launch({ headless: true });
async function session(role, verify) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const account = credentials.contas.find((a) => a.perfil === role);
    assert(account);
    await page.goto('http://127.0.0.1:3000');
    await page.getByLabel('E-mail corporativo', { exact: true }).fill(account.email);
    await page.getByLabel('Senha', { exact: true }).fill(account.senha);
    await page.getByRole('button', { name: 'Entrar na plataforma', exact: true }).click();
    const logout = page.getByRole('button', { name: 'Sair da plataforma', exact: true });
    await logout.waitFor();
    try {
      await verify(page);
    } finally {
      await logout.click();
    }
    checks.push({ perfil: role, aprovado: true });
    console.log(`Interface aprovada: ${role}`);
  } finally {
    await context.close();
  }
}
try {
  await session('SUPER_ADMIN', async (page) => {
    await page.getByRole('button', { name: 'Qualidade dos dados', exact: true }).click();
    await page.getByRole('heading', { name: 'Qualidade dos dados', exact: true }).waitFor();
    await page.getByText('HOMOLOGACAO', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Empreendimentos', exact: true }).click();
    await page
      .getByRole('cell', { name: 'Obra de Homologação — Casa Modelo', exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Conta e atendimento', exact: true }).click();
    await page.getByRole('heading', { name: 'Sessões ativas', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Configurar autenticador', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Plano e utilização', exact: true }).waitFor();
    await page.screenshot({
      path: path.join(root, 'scratch', 'conta-atendimento-local.png'),
      fullPage: true,
    });
  });
  await session('ENGENHEIRO', async (page) => {
    assert.equal(
      await page.getByRole('button', { name: 'Recursos humanos', exact: true }).count(),
      0,
    );
    await page.getByRole('button', { name: 'Modelador 2D/3D', exact: true }).click();
    await page
      .getByLabel('Obra do modelo', { exact: true })
      .selectOption({ label: 'Obra de Homologação — Casa Modelo' });
    await page.getByRole('button', { name: /Planta de Teste — Ambiente 4/ }).click();
    await page.getByLabel('Nome do modelo', { exact: true }).waitFor();
  });
  await session('RH', async (page) => {
    await page.getByRole('heading', { name: 'Recursos humanos', exact: true }).waitFor();
    await page
      .getByRole('cell', { name: 'Colaborador de Teste 01 — Pessoa Fictícia', exact: true })
      .waitFor();
    assert.equal(
      await page.getByRole('button', { name: 'Qualidade dos dados', exact: true }).count(),
      0,
    );
  });
  await session('CLIENTE', async (page) => {
    await page.getByRole('heading', { name: 'HML-101', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'HML-102', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Usuários', exact: true }).count(), 0);
  });
} finally {
  await browser.close();
  await writeFile(
    path.join(root, 'obra360-backend', 'data', 'validacao-interface-homologacao.json'),
    JSON.stringify(
      {
        em: new Date().toISOString(),
        ambiente: 'HOMOLOGACAO',
        dadosFicticios: true,
        validacoes: checks,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
}
console.log(
  'Validação de interface concluída com contas de homologação e API/banco locais, sem mocks.',
);
