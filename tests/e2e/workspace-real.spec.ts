import { test, expect } from '@playwright/test';
import { wallCells, type ModelElement } from '../../src/services/modelGeometry';
import * as topology from '../../src/services/planTopology';
import * as rooms from '../../src/services/planRooms';

// API fixtures exercise browser states; database/auth behavior is covered by the
// Spring integration suite, using isolated H2 records, never operational data.
const session = {
  nome: 'Usuário de teste',
  email: 'usuario@test.invalid',
  perfil: 'SUPER_ADMIN',
  empresa: {
    nomeFantasia: 'Empresa de teste',
    razaoSocial: 'Empresa de teste',
    cnpj: '00000000000000',
  },
};
test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/configuracao', (route) =>
    route.fulfill({ json: { googleClientId: '', emailRecovery: false } }),
  );
  await page.route('**/api/v1/workspace/minhas-sessoes/sair', (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route('**/api/v1/instalacao', (route) =>
    route.fulfill({ json: { necessaria: false } }),
  );
});
async function authenticated(page: import('@playwright/test').Page) {
  await page.addInitScript(() => sessionStorage.setItem('obra360_access_token', 'test-token'));
  await page.route('**/api/v1/workspace/sessao', (route) => route.fulfill({ json: session }));
}

test('the AI assistant requires authorization for each question', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/integracoes', (route) =>
    route.fulfill({ json: { iaConfigurada: true, armazenamento: 'local' } }),
  );
  let requests = 0;
  await page.route('**/api/v1/workspace/integracoes/ia', (route) => {
    requests++;
    expect(route.request().postDataJSON()).toEqual({
      pergunta: 'Prepare uma lista de vistoria.',
      autorizaEnvio: true,
    });
    return route.fulfill({ json: { resposta: 'Confira as instalações.' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Integrações', exact: true }).click();
  await expect(page.getByText('Chave e modelo configurados')).toBeVisible();
  const question = page.getByRole('textbox', { name: 'Sua pergunta' });
  const consent = page.getByRole('checkbox', { name: /Autorizo enviar/ });
  const send = page.getByRole('button', { name: 'Enviar pergunta' });
  await question.fill('Pergunta anterior.');
  await consent.check();
  await expect(send).toBeEnabled();
  await question.fill('Prepare uma lista de vistoria.');
  await expect(consent).not.toBeChecked();
  await expect(send).toBeDisabled();
  await consent.check();
  await send.click();
  await expect(page.getByText('Confira as instalações.')).toBeVisible();
  await expect(consent).not.toBeChecked();
  await expect(send).toBeDisabled();
  expect(requests).toBe(1);
});

test('HR role opens its restricted workspace and fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => sessionStorage.setItem('obra360_access_token', 'test-token'));
  await page.route('**/api/v1/workspace/sessao', (route) =>
    route.fulfill({ json: { ...session, perfil: 'RH' } }),
  );
  await page.route('**/api/v1/workspace/rh/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: path.includes('/opcoes/')
        ? []
        : path.endsWith('/resumo')
          ? {
              funcionariosAtivos: 0,
              solicitacoesPendentes: 0,
              validadesAte30Dias: 0,
              vagasAbertas: 0,
            }
          : { items: [], total: 0, page: 0, size: 25 },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Recursos humanos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Novo usuário', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Integrações', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nenhum registro encontrado' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page
    .getByRole('navigation', { name: 'Seções de RH' })
    .getByRole('button', { name: 'Férias e afastamentos', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Férias e afastamentos', exact: true }),
  ).toBeVisible();
});

test('engineering account does not expose HR navigation', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/sessao', (route) =>
    route.fulfill({ json: { ...session, perfil: 'ENGENHEIRO' } }),
  );
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Empreendimentos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recursos humanos', exact: true })).toHaveCount(0);
});

test('real mode requires login and never shows demonstration records', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Acessar Plataforma' })).toBeVisible();
  await expect(page.getByLabel('E-mail corporativo')).toHaveValue('');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await expect(page.getByText('Carlos Silva')).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(0);
});
test('one-click appearance toggle persists and keeps login fields', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Tema escuro', exact: true });
  await expect(toggle).toHaveAttribute('title', 'Ativar tema claro');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-obra-theme', 'light');
  await expect(toggle).toHaveAttribute('title', 'Ativar tema escuro');
  await page.getByLabel('E-mail corporativo').fill('theme@test.invalid');
  await toggle.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-obra-theme', 'dark');
  await expect(page.getByLabel('E-mail corporativo')).toHaveValue('theme@test.invalid');
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(
    await page
      .locator('.access-card')
      .first()
      .evaluate((e) => getComputedStyle(e).backgroundColor),
  ).toBe('rgb(255, 255, 255)');
});
test('a previously saved system preference can be overridden with one click', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    if (!localStorage.getItem('obra360_appearance'))
      localStorage.setItem('obra360_appearance', 'system');
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-obra-theme', 'light');
  await page.getByRole('button', { name: 'Tema escuro', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-obra-theme', 'dark');
});
test('appearance remains usable when local storage is blocked', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem() {
          throw new Error('blocked');
        },
        setItem() {
          throw new Error('blocked');
        },
      },
    }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Tema escuro', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Acessar Plataforma', exact: true }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-obra-theme', 'light');
});
test('error recovery follows the chosen palette without exposing technical details', async ({
  page,
}) => {
  await authenticated(page);
  await page.addInitScript(() => localStorage.setItem('obra360_appearance', 'light'));
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [null], total: 1, page: 0, size: 25 } }),
  );
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Não foi possível abrir esta tela' }),
  ).toBeVisible();
  expect(
    await page.locator('.error-card').evaluate((e) => getComputedStyle(e).backgroundColor),
  ).toBe('rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Recarregar Aplicação' })).toBeVisible();
});
test('Google control adapts to the theme and available width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => {
    (window as any).google = {
      accounts: {
        id: {
          initialize() {},
          renderButton(target: HTMLElement, settings: any) {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = 'Google de teste';
            b.dataset.googleTheme = settings.theme;
            b.style.width = settings.width + 'px';
            target.appendChild(b);
          },
          cancel() {},
        },
      },
    };
  });
  await page.route('**/api/v1/auth/configuracao', (route) =>
    route.fulfill({ json: { googleClientId: 'test-client', emailRecovery: false } }),
  );
  await page.route('**/api/v1/auth/google/nonce', (route) =>
    route.fulfill({ json: { nonce: 'A'.repeat(43) } }),
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Google de teste' })).toHaveAttribute(
    'data-google-theme',
    'filled_black',
  );
  await page.getByRole('button', { name: 'Tema escuro', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Google de teste' })).toHaveAttribute(
    'data-google-theme',
    'outline',
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
test('touch phone can choose a role and change appearance', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4174',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.route('**/api/v1/instalacao', (route) =>
      route.fulfill({ json: { necessaria: false } }),
    );
    await page.goto('/');
    await page.getByText('Engenheiro Residente (Campo)', { exact: true }).tap();
    await expect(page.locator('input[type=radio][value=ENGENHEIRO]')).toBeChecked();
    await page.getByRole('button', { name: 'Tema escuro', exact: true }).tap();
    await expect(page.locator('html')).toHaveAttribute('data-obra-theme', 'light');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  } finally {
    await context.close();
  }
});
test('compact navigation opens, restores focus and closes on selection', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  const navigation = page.getByRole('navigation', { name: 'Módulos da empresa' });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();
  await menu.click();
  await expect(navigation.getByText('Obras e projetos', { exact: true })).toBeVisible();
  const users = navigation.getByRole('button', { name: 'Usuários', exact: true });
  await expect(users).toBeVisible();
  await users.focus();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(navigation).toBeHidden();
  await menu.click();
  await users.click();
  await expect(page.getByRole('heading', { name: 'Usuários', exact: true })).toBeVisible();
  await expect(page.locator('.ws-current-page')).toHaveText('Usuários');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(menu).toBeHidden();
  await expect(users).toHaveAttribute('aria-current', 'page');
});

for (const viewport of [
  { width: 280, height: 650 },
  { width: 320, height: 740 },
  { width: 360, height: 800 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 667, height: 320 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
]) {
  test(`themes and project dialog fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await authenticated(page);
    await page.route('**/api/v1/workspace/registros/**', (route) =>
      route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
    );
    await page.route('**/api/v1/workspace/engenheiros', (route) => route.fulfill({ json: [] }));
    await page.goto('/');
    for (const mode of ['light', 'dark']) {
      await page.getByRole('button', { name: 'Tema escuro', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-obra-theme', mode);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width + 1,
      );
      await page.getByRole('button', { name: 'Novo empreendimento', exact: true }).click();
      const bounds = await page.getByRole('dialog').boundingBox();
      expect(bounds).toBeTruthy();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
      await page.getByLabel('Nome do empreendimento').fill('Projeto responsivo');
      const dialog = page.getByRole('dialog');
      if (viewport.height <= 390) {
        const cancel = dialog.getByRole('button', { name: 'Cancelar', exact: true });
        await cancel.scrollIntoViewIfNeeded();
        await expect(cancel).toBeInViewport({ ratio: 0.95 });
        await cancel.click();
      } else {
        await dialog.getByRole('button', { name: /Fechar/ }).click();
      }
      await expect(dialog).toHaveCount(0);
    }
  });
}
test('connected pages and their dialogs share the login dark palette', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.route('**/api/v1/workspace/resumo', (route) =>
    route.fulfill({
      json: { ordensAbertas: 0, ordensAtrasadas: 0, materiaisAbaixoMinimo: 0, custoConsumido: 0 },
    }),
  );
  await page.route('**/api/v1/workspace/engenheiros', (route) => route.fulfill({ json: [] }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Empreendimentos', exact: true })).toBeVisible();
  expect(await page.locator('.ws-shell').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
    'rgb(17, 17, 19)',
  );
  expect(
    await page.locator('.ws-table-card').evaluate((e) => getComputedStyle(e).backgroundColor),
  ).toBe('rgb(25, 25, 28)');
  await page.getByRole('button', { name: 'Novo empreendimento', exact: true }).click();
  expect(await page.getByRole('dialog').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(
    'rgb(25, 25, 28)',
  );
  expect(
    await page.getByLabel('Nome do empreendimento').evaluate((e) => getComputedStyle(e).color),
  ).toBe('rgb(250, 250, 250)');
});
test('login keeps the dark profile picker without inventing account credentials', async ({
  page,
}) => {
  await page.goto('/');
  const engineer = page.getByRole('radio', { name: /Engenheiro Residente/ });
  await engineer.check();
  await expect(engineer).toBeChecked();
  await expect(page.locator('.access-selected')).toContainText('Nível 2');
  await expect(page.locator('.access-selected')).toContainText('Engenharia de Campo');
  await expect(page.getByLabel('E-mail corporativo')).toHaveValue('');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Fazer login com o Google' })).toBeVisible();
  await page.route('**/api/v1/auth/login', async (route) => {
    expect(route.request().postDataJSON().perfil).toBe('ENGENHEIRO');
    await route.fulfill({ status: 401, json: { detail: 'Credenciais inválidas.' } });
  });
  await page.getByLabel('E-mail corporativo').fill('test@test.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('SenhaDeTeste@12345');
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
test('rejected credentials display an error without logging in', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 401, json: { detail: 'Credenciais inválidas' } }),
  );
  await page.goto('/');
  await page.getByLabel('E-mail corporativo').fill('usuario@test.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('errada');
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click();
  await expect(page.getByRole('alert')).toContainText('inválidos');
  await expect(page.getByLabel('Código de duas etapas')).toHaveCount(0);
  await expect(page.getByRole('navigation')).toHaveCount(0);
});
test('login can reveal the password and only shows the code after an MFA challenge', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      json: { code: route.request().postDataJSON().codigo ? 'MFA_INVALID' : 'MFA_REQUIRED' },
    }),
  );
  await page.goto('/');
  const password = page.getByLabel('Senha', { exact: true });
  const code = page.getByLabel('Código de duas etapas', { exact: true });
  await page.getByLabel('E-mail corporativo').fill('usuario@test.invalid');
  await password.fill('SenhaDeTeste@12345');
  await expect(code).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('SenhaDeTeste@12345');
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(password).toHaveAttribute('type', 'password');
  const login = page.getByRole('button', { name: 'Entrar na plataforma' });
  await login.click();
  await expect(code).toBeVisible();
  await code.fill('123456');
  await login.click();
  await expect(page.getByRole('alert')).toContainText('Código inválido');
  await password.fill('OutraSenha@12345');
  await expect(code).toHaveCount(0);
});
test('database errors are visible and never replaced with fictional works', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Serviço indisponível');
  await expect(page.getByText('Residencial Jardins das Orquídeas')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Consulta indisponível' })).toBeVisible();
});
test('empty database has an honest empty state', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Nenhum registro cadastrado' })).toBeVisible();
  await expect(page.getByText('0 registro(s)', { exact: false })).toBeVisible();
});
test('records support page search, pagination and logout', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) => {
    const second = new URL(route.request().url()).searchParams.get('page') === '1';
    return route.fulfill({
      json: {
        items: [
          {
            id: second ? 2 : 1,
            nome: second ? 'Obra página 2' : 'Obra registrada',
            areaTotalM2: 123.45,
            vgvEstimado: 12000,
            dataInicio: '2026-01-01',
            dataPrevisaoFim: '2026-12-31',
          },
        ],
        total: 26,
        page: second ? 1 : 0,
        size: 25,
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('cell', { name: 'Obra registrada', exact: true })).toBeVisible();
  await page.getByLabel('Buscar nesta página').fill('ausente');
  await expect(page.getByRole('heading', { name: 'Nenhum resultado nesta página' })).toBeVisible();
  await page.getByLabel('Buscar nesta página').fill('');
  await page.getByLabel('Próxima página').click();
  await expect(page.getByRole('cell', { name: 'Obra página 2' })).toBeVisible();
  await page.getByLabel('Sair da plataforma').click();
  await expect(page.getByRole('heading', { name: 'Acessar Plataforma' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('obra360_access_token'))).toBeNull();
});
test('project form saves through API and reports validation errors', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.route('**/api/v1/workspace/engenheiros', (route) =>
    route.fulfill({ json: [{ id: 7, nome: 'Engenheiro de teste' }] }),
  );
  await page.route('**/api/v1/workspace/projetos', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON().nome).toBe('Obra cadastrada');
    await route.fulfill({ status: 201, json: { id: 1 } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Novo empreendimento' }).click();
  await page.getByLabel('Nome do empreendimento').fill('Obra cadastrada');
  await page.getByLabel('Engenheiro responsável').selectOption('7');
  await page.getByLabel('Área total (m²)').fill('100');
  await page.getByLabel('VGV estimado (R$)').fill('10000');
  await page.getByLabel('Data de início').fill('2026-12-01');
  await page.getByLabel('Entrega prevista').fill('2026-01-01');
  await page.getByRole('button', { name: 'Cadastrar empreendimento', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('posterior ao início');
  await page.getByLabel('Entrega prevista').fill('2027-01-01');
  await page.getByRole('button', { name: 'Cadastrar empreendimento', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page.getByText('Empreendimento cadastrado com sucesso.', { exact: true }),
  ).toBeVisible();
});
test('mobile workspace fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Empreendimentos', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('first installation collects real company details and creates no demo accounts', async ({
  page,
}) => {
  await page.route('**/api/v1/instalacao', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { necessaria: true } });
    const body = route.request().postDataJSON();
    expect(body.nomeFantasia).toBe('Empresa informada');
    expect(body.cnpj).toBe('12345678000190');
    expect(body.perfil).toBeUndefined();
    return route.fulfill({ status: 201, body: '' });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Configure sua empresa' })).toBeVisible();
  await page.getByLabel('Nome fantasia').fill('Empresa informada');
  await page.getByLabel('Razão social').fill('Empresa informada LTDA');
  await page.getByLabel('CNPJ').fill('12.345.678/0001-90');
  await page.getByLabel('Seu nome').fill('Administrador teste');
  await page.getByLabel('E-mail', { exact: true }).fill('admin@test.invalid');
  await page.getByLabel('Senha (mínimo de 12 caracteres)').fill('SenhaDeTeste@12345');
  await page.getByLabel('Confirme a senha').fill('SenhaDeTeste@12345');
  await page.getByRole('button', { name: 'Criar empresa e administrador' }).click();
  await expect(page.getByRole('heading', { name: 'Acessar Plataforma' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Empresa configurada');
});

test('administrator creates an engineer through the real registration contract', async ({
  page,
}) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.route('**/api/v1/auth/cadastrar', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.perfil).toBe('ENGENHEIRO');
    expect(body.nome).toBe('Engenheiro informado');
    expect(body.empresaId).toBeUndefined();
    return route.fulfill({ status: 201, json: { id: 7, nome: body.nome } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Usuários', exact: true }).click();
  await page.getByRole('button', { name: 'Novo usuário', exact: true }).click();
  await page.getByLabel('Nome completo').fill('Engenheiro informado');
  await page.getByLabel('E-mail do usuário').fill('engenheiro@test.invalid');
  await page.getByLabel('Perfil de acesso').selectOption('ENGENHEIRO');
  await page.getByLabel('Senha inicial (mínimo de 12 caracteres)').fill('SenhaDeTeste@12345');
  await page.getByRole('button', { name: 'Cadastrar usuário', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Usuário cadastrado com sucesso.', { exact: true })).toBeVisible();
});

test('IFC reader extracts declared quantities and preserves missing values', async ({ page }) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Leitor IFC', exact: true }).click();
  await page.getByLabel('Selecionar arquivo IFC').setInputFiles('tests/fixtures/quantities.ifc');
  const wall = page.getByRole('row').filter({ hasText: 'Parede com quantidade declarada' });
  await expect(wall).toBeVisible({ timeout: 30000 });
  await expect(wall.getByRole('cell', { name: '2,5', exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: 'Parede sem quantitativos' })
      .getByRole('cell', { name: 'Não informado', exact: true }),
  ).toHaveCount(3);
});

test('customer portal shows linked records and excludes internal modules', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('obra360_access_token', 'test-token'));
  await page.route('**/api/v1/workspace/sessao', (route) =>
    route.fulfill({ json: { ...session, perfil: 'CLIENTE' } }),
  );
  await page.route('**/api/v1/portal', (route) =>
    route.fulfill({
      json: {
        perfil: 'CLIENTE',
        acessos: [{ id: 1 }],
        projetos: [{ id: 1, nome: 'Obra vinculada', entrega: '2027-01-01', progresso: null }],
        unidades: [
          {
            id: 1,
            codigo: 'AP-101',
            situacao: 'VENDIDO',
            area: 50,
            valorTabela: 100000,
            reservadaPorVoce: false,
          },
        ],
        contratos: [],
        cotacoes: [],
        chamados: [],
      },
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Portal de relacionamento' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'AP-101', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Auditoria', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abrir chamado', exact: true })).toBeVisible();
  await page.route('**/api/v1/portal/unidades/1/plantas', (route) =>
    route.fulfill({ json: [{ id: modelFixture.id, nome: modelFixture.nome, revisao: 1 }] }),
  );
  await page.route('**/api/v1/portal/unidades/1/plantas/1', (route) =>
    route.fulfill({ json: modelFixture }),
  );
  await page.setViewportSize({ width: 320, height: 568 });
  await page.getByRole('button', { name: 'Ver plantas da unidade' }).click();
  await page.getByRole('combobox', { name: 'Planta da unidade' }).selectOption('1');
  await page.getByRole('combobox', { name: 'Visualização da planta' }).selectOption('2d');
  await expect(page.getByRole('img', { name: 'Planta 2D em metros', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aumentar zoom da planta' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('password recovery uses a generic response and resets through the API', async ({ page }) => {
  await page.route('**/api/v1/auth/configuracao', (route) =>
    route.fulfill({ json: { googleClientId: '', emailRecovery: true } }),
  );
  await page.route('**/api/v1/auth/recuperar', (route) => route.fulfill({ status: 202, body: '' }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click();
  await page.getByLabel('E-mail cadastrado').fill('usuario@test.invalid');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('status')).toContainText('Se existir uma conta ativa');
  await page.route('**/api/v1/auth/redefinir', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/#recuperar=' + 'A'.repeat(43));
  await page
    .getByLabel('Nova senha (mínimo de 12 caracteres)', { exact: true })
    .fill('SenhaNovaSegura@12345');
  await page.getByLabel('Confirme a nova senha').fill('SenhaNovaSegura@12345');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('status')).toContainText('Senha redefinida');
});

test('HR dossier renders salary changes on mobile without showing personal identifiers', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => sessionStorage.setItem('obra360_access_token', 'test-token'));
  await page.route('**/api/v1/workspace/sessao', (route) =>
    route.fulfill({ json: { ...session, perfil: 'RH' } }),
  );
  await page.route('**/api/v1/workspace/rh/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const event = {
      id: 1,
      funcionarioId: 7,
      responsavel: 'Responsável de teste',
      tipo: 'ALTERACAO',
      motivo: 'Revisão de teste',
      dataReferencia: '2026-11-06',
      registradoEm: '2026-11-06T12:00:00-03:00',
      camposAlterados: ['salarioBase'],
      anterior: { salarioBase: '3000.00' },
      atual: { nome: 'Pessoa de teste', salarioBase: '3500.00' },
    };
    return route.fulfill({
      json: path.endsWith('/historico')
        ? { items: [event], total: 1 }
        : path.includes('/opcoes/')
          ? []
          : path.endsWith('/resumo')
            ? {}
            : { items: [], total: 0 },
    });
  });
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Seções de RH' })
    .getByRole('button', { name: 'Histórico funcional', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Histórico funcional', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('cell', { name: /3.500,00/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page
    .getByRole('navigation', { name: 'Seções de RH' })
    .getByRole('button', { name: 'Documentos privados', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Nenhum documento privado encontrado' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Enviar documento privado', exact: true }).click();
  await expect(page.getByLabel('Arquivo privado', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

const modelFixture = {
  id: 1,
  projetoObraId: 1,
  nome: 'Modelo de teste',
  versao: 0,
  revisao: 1,
  arquivado: false,
  atualizadoEm: '2026-11-06T12:00:00Z',
  documento: {
    schemaVersao: 1,
    pavimentos: [{ id: 'floor-a', nome: 'Térreo', cota: 0, altura: 2.8 }],
    elementos: [],
  },
};
async function mockModelEditor(
  page: import('@playwright/test').Page,
  role = 'SUPER_ADMIN',
  model: unknown = modelFixture,
  other?: typeof modelFixture,
) {
  await authenticated(page);
  await page.route('**/api/v1/workspace/sessao', (route) =>
    route.fulfill({ json: { ...session, perfil: role } }),
  );
  await page.route('**/api/v1/workspace/opcoes/projetos**', (route) =>
    route.fulfill({ json: [{ id: 1, nome: 'Obra de teste' }] }),
  );
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.route('**/api/v1/workspace/modelador/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/rascunho')) return route.fulfill({ status: 204 });
    if (route.request().method() === 'PUT')
      return route.fulfill({ status: 409, json: { detail: 'Outra sessão salvou este modelo.' } });
    return route.fulfill({
      json: path.endsWith('/revisoes')
        ? { items: [], total: 0 }
        : path.endsWith('/modelos/1')
          ? model
          : other && path.endsWith(`/modelos/${other.id}`)
            ? other
            : { items: other ? [model, other] : [model], total: other ? 2 : 1 },
    });
  });
  await page.goto('/');
  await openModelFixture(page);
}
async function openModelFixture(page: import('@playwright/test').Page) {
  await expect(page.getByLabel('Sair da plataforma')).toBeVisible();
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: 'Modelador 2D/3D', exact: true }).click();
  await page.getByLabel('Obra do modelo', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: /Modelo de teste/ }).click();
  await expect(page.getByLabel('Nome do modelo', { exact: true })).toHaveValue('Modelo de teste');
}
test('model draft survives reload and is cleared only after the official save', async ({ page }) => {
  await mockModelEditor(page);
  await page.getByRole('button', { name: 'Adicionar parede', exact: true }).click();
  await expect(page.getByText('Rascunho guardado neste navegador.', { exact: true })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.reload();
  await openModelFixture(page);
  await expect(page.getByRole('button', { name: 'Adicionar parede', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Recuperar rascunho', exact: true }).click();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  await page.route('**/api/v1/workspace/modelador/modelos/1', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    const body = route.request().postDataJSON();
    expect(body.documento.elementos).toHaveLength(1);
    await route.fulfill({ json: { ...modelFixture, ...body, versao: 1, revisao: 2 } });
  });
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click();
  await expect(page.getByText('Salvo · revisão 2', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('obra360:model-draft:')))).toEqual([]);
});

test('a draft from an older model version can be exported without replacing the newer version', async ({ page }) => {
  await mockModelEditor(page);
  await page.getByRole('button', { name: 'Adicionar parede', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar parede', exact: true }).click();
  await expect(page.getByText('Rascunho guardado neste navegador.', { exact: true })).toBeVisible();
  const [changedWall, addedWall] = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((item) => item.startsWith('obra360:model-draft:'))!;
    return JSON.parse(localStorage.getItem(key)!).draft.documento.elementos;
  });
  await page.route('**/api/v1/workspace/modelador/modelos/1', (route) =>
    route.fulfill({ json: { ...modelFixture, versao: 1, revisao: 2, documento: {
      ...modelFixture.documento, elementos: [
        { ...changedWall, nome: 'Parede antes da edição' },
        { ...addedWall, id: 'parede-removida', nome: 'Parede removida' },
      ],
    } } }),
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page.reload();
  await openModelFixture(page);
  await expect(page.getByText(/O modelo mudou no banco/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recuperar rascunho', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Comparar com o banco', exact: true }).click();
  const comparison = page.getByRole('region', { name: 'Comparação de plantas' });
  const server = comparison.getByRole('region', { name: 'Planta do banco' });
  const local = comparison.getByRole('region', { name: 'Planta do rascunho' });
  await expect(server.getByRole('heading', { name: 'Banco · revisão 2' })).toBeVisible();
  await expect(local.locator('[data-element-id][data-change=added]')).toHaveCount(1);
  await expect(comparison.getByText('Adicionado: 1', { exact: true })).toBeVisible();
  await expect(server.locator('[data-element-id][data-change=removed]')).toHaveCount(1);
  await expect(server.locator('[data-element-id][data-change=modified]')).toHaveCount(1);
  await expect(local.locator('[data-element-id][data-change=modified]')).toHaveCount(1);
  expect(await local.locator('svg[role=img]').getAttribute('viewBox')).toEqual(
    await server.locator('svg[role=img]').getAttribute('viewBox'),
  );
  await comparison.getByRole('button', { name: 'Fechar comparação' }).click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar rascunho JSON', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/\.json$/);
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(2);
});
test('a delayed JSON import cannot land in a different model', async ({ page }) => {
  await page.addInitScript(() => {
    const read = File.prototype.text;
    File.prototype.text = function () {
      if (this.name !== 'importacao-lenta.json') return read.call(this);
      return new Promise<string>((resolve, reject) => {
        (window as any).releaseModelImport = () => read.call(this).then(resolve, reject);
      });
    };
  });
  await mockModelEditor(page, 'SUPER_ADMIN', modelFixture, { ...modelFixture, id: 2, nome: 'Segundo modelo' });
  await page.getByLabel('Arquivo de projeto JSON').setInputFiles({
    name: 'importacao-lenta.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ formato: 'obra360-modelador', versaoFormato: 1,
      nome: 'Importação para o primeiro modelo', documento: modelFixture.documento })),
  });
  await page.waitForFunction(() => !!(window as any).releaseModelImport);
  await page.getByRole('button', { name: /Segundo modelo/ }).click();
  const name = page.getByLabel('Nome do modelo', { exact: true });
  await expect(name).toHaveValue('Segundo modelo');
  await page.evaluate(async () => {
    await (window as any).releaseModelImport();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await expect(name).toHaveValue('Segundo modelo');
  await expect(page.getByText('Alterações não salvas', { exact: true })).toHaveCount(0);
});
test('changing appearance preserves the model draft and the WebGL canvas', async ({ page }) => {
  await mockModelEditor(page);
  await page.getByRole('button', { name: 'Adicionar parede', exact: true }).click();
  const canvas = page.getByRole('img', { name: 'Vista 3D do modelo', exact: true });
  await expect(canvas).toBeVisible();
  await canvas.evaluate((node) => node.setAttribute('data-same-canvas', 'yes'));
  await page.getByRole('button', { name: 'Tema escuro', exact: true }).click();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-same-canvas', 'yes');
  await expect(page.getByText('Alterações não salvas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tema escuro', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-same-canvas', 'yes');
});

test('model editor draws a wall on the snapped plan and preserves draft after conflict', async ({
  page,
}) => {
  await mockModelEditor(page);
  await page.getByLabel('Modo de visualização do modelo', { exact: true }).selectOption('2d');
  await page.getByRole('button', { name: 'Desenhar parede', exact: true }).click();
  const plan = page.getByRole('img', { name: 'Planta 2D editável em metros', exact: true });
  await plan.scrollIntoViewIfNeeded();
  const rect = await plan.boundingBox();
  expect(rect).toBeTruthy();
  await page.mouse.move(rect!.x + rect!.width * 0.4, rect!.y + rect!.height * 0.4);
  await page.mouse.down();
  // Simulate the gesture ending before the browser delivered a final move event.
  await plan.dispatchEvent('pointerup', {
    bubbles: true,
    pointerId: 1,
    clientX: rect!.x + rect!.width * 0.65,
    clientY: rect!.y + rect!.height * 0.4,
  });
  await page.mouse.up();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  const width = Number(await page.getByLabel('Largura (m)', { exact: true }).inputValue());
  expect(width).toBeGreaterThan(0.1);
  await page.getByRole('button', { name: 'Salvar modelo', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Outra sessão salvou');
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  await expect(page.getByText('Alterações não salvas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(0);
});

test('model viewer is read only for auditor and fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockModelEditor(page, 'AUDITOR');
  await expect(page.getByRole('button', { name: 'Novo modelo', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Adicionar parede', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Nome do modelo', { exact: true })).toBeDisabled();
  const plan = page.getByRole('img', { name: 'Planta 2D em metros', exact: true });
  const beforeZoom = await plan.getAttribute('viewBox');
  await page.getByRole('button', { name: 'Aumentar zoom da planta' }).click();
  await expect(plan).not.toHaveAttribute('viewBox', beforeZoom!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

function referencePdf() {
  const stream = '2 w 20 50 m 180 50 l S';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] /Contents 4 0 R /Resources << >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const table = pdf.length;
  pdf += 'xref\n0 5\n0000000000 65535 f \n';
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Root 1 0 R /Size 5 >>\nstartxref\n${table}\n%%EOF\n`;
  return Buffer.from(pdf);
}

test('PDF and image references calibrate a real measurement and produce a 3D wall', async ({ page }) => {
  await mockModelEditor(page);
  await page.getByText('Usar planta PDF ou imagem como referência', { exact: true }).click();
  const input = page.getByLabel('Arquivo da planta', { exact: true });
  const plan = page.getByRole('img', { name: 'Planta 2D editável em metros', exact: true });
  await input.setInputFiles({ name: 'planta.pdf', mimeType: 'application/pdf', buffer: referencePdf() });
  await expect(plan.locator('image')).toHaveCount(1, { timeout: 15000 });
  await page.getByLabel('Distância real (m)', { exact: true }).fill('6');
  await page.getByRole('button', { name: 'Calibrar escala', exact: true }).click();
  await plan.scrollIntoViewIfNeeded();
  async function points() {
    return plan.locator('image').evaluate((node) => {
      const image = node as SVGImageElement;
      const box = image.getBBox();
      return [0.25, 0.75].map((fraction) => {
        const point = new DOMPoint(box.x + box.width * fraction, box.y + box.height / 2)
          .matrixTransform(image.getScreenCTM()!);
        return { x: point.x, y: point.y };
      });
    });
  }
  for (const point of await points()) await page.mouse.click(point.x, point.y);
  await expect(page.getByText('Escala calibrada.', { exact: false })).toBeVisible();
  const [start, end] = await points();
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  await expect(page.getByLabel('Largura (m)', { exact: true })).toHaveValue('6');
  await expect(page.getByRole('img', { name: 'Vista 3D do modelo' })).toBeVisible();
  await page.getByRole('button', { name: 'Remover referência' }).click();
  await expect(plan.locator('image')).toHaveCount(0);
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 100;
    canvas.getContext('2d')!.fillRect(20, 49, 160, 2);
    return canvas.toDataURL().split(',')[1];
  });
  await input.setInputFiles({ name: 'planta.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(plan.locator('image')).toHaveCount(1);
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('timelapse plays saved revisions without replacing an unsaved model draft', async ({ page }) => {
  await mockModelEditor(page, 'SUPER_ADMIN', { ...modelFixture, revisao: 2 });
  await page.route(/\/revisoes\/[12]$/, (route) => {
    const numero = Number(route.request().url().split('/').at(-1));
    return route.fulfill({ json: { ...modelFixture, numero, motivo: 'Quadro salvo', criadoEm: modelFixture.atualizadoEm } });
  });
  await page.getByRole('button', { name: 'Adicionar parede', exact: true }).click();
  await page.getByText(/Revisões salvas/).click();
  await page.getByRole('button', { name: 'Abrir timelapse' }).click();
  const timeline = page.getByRole('region', { name: 'Timelapse das revisões' });
  await expect(timeline.getByText(/Revisão exibida: 1/)).toBeVisible();
  await timeline.getByRole('button', { name: 'Reproduzir timelapse' }).click();
  await expect(timeline.getByText(/Revisão exibida: 2/)).toBeVisible();
  await page.getByRole('button', { name: 'Fechar timelapse' }).click();
  await expect(page.locator('.model-element-list').getByRole('button')).toHaveCount(1);
  await expect(page.getByText('Alterações não salvas', { exact: true })).toBeVisible();
});

test('wall geometry subtracts the real area of doors and windows', () => {
  const wall: ModelElement = {
    id: 'w',
    pavimentoId: 'f',
    tipo: 'PAREDE',
    nome: 'Parede',
    x: 0,
    z: 0,
    base: 0,
    largura: 5,
    profundidade: 0.15,
    altura: 2.8,
    rotacao: 0,
    cor: '#cccccc',
    paredeId: null,
    deslocamento: 0,
  };
  const door: ModelElement = { ...wall, id: 'd', tipo: 'PORTA', paredeId: 'w', largura: 0.9, altura: 2.1 };
  const window: ModelElement = {
    ...wall,
    id: 'j',
    tipo: 'JANELA',
    paredeId: 'w',
    largura: 1,
    altura: 1,
    base: 1.2,
    deslocamento: 1.8,
  };
  const area = wallCells(wall, [wall, door, window])
    .reduce((sum, cell) => sum + cell.width * cell.height, 0);
  expect(area).toBeCloseTo(5 * 2.8 - 0.9 * 2.1 - 1, 6);
});

test('plan topology keeps shared corners and dimensions consistent while finding real rooms', () => {
  const wall = (id: string, a: number, b: number, c: number, d: number) => ({
    id,
    pavimentoId: 'f',
    tipo: 'PAREDE',
    nome: id,
    x: (a + c) / 2,
    z: (b + d) / 2,
    base: 0,
    largura: Math.hypot(c - a, d - b),
    profundidade: 0.15,
    altura: 2.8,
    rotacao: (-Math.atan2(d - b, c - a) * 180) / Math.PI,
    cor: '#cccccc',
    paredeId: null,
    deslocamento: 0,
  });
  const rectangle = {
    schemaVersao: 1,
    pavimentos: [{ id: 'f', nome: 'Térreo', cota: 0, altura: 2.8 }],
    elementos: [
      wall('a', 0, 0, 4, 0),
      wall('b', 4, 0, 4, 3),
      wall('c', 4, 3, 0, 3),
      wall('d', 0, 3, 0, 0),
    ],
  };
  const doc: any = JSON.parse(JSON.stringify(rectangle));
  topology.connectWalls(doc, 'f');
  rooms.refreshRoomLabels(doc, 'f');
  doc.ambientes[0].nome = 'Sala';
  const original = rooms.detectRooms(doc, 'f')[0];
  const a = doc.elementos[0];
  doc.cotas = [
    {
      id: 'cota',
      pavimentoId: 'f',
      tipo: 'ALINHADA',
      ax: 0,
      az: 0,
      bx: 4,
      bz: 0,
      afastamento: -0.4,
      noAId: a.noInicioId,
      noBId: a.noFimId,
    },
  ];
  doc.nos.find((n: any) => n.id === a.noFimId).x = 5;
  topology.syncTopology(doc);
  const moved = rooms.detectRooms(doc, 'f');
  const divider: any = JSON.parse(JSON.stringify(rectangle));
  divider.elementos.push(wall('middle', 2, 0, 2, 3));
  const dangling: any = JSON.parse(JSON.stringify(rectangle));
  dangling.elementos.push(wall('spur', 2, 0, 2, 1.5));
  const nested: any = {
    schemaVersao: 1,
    pavimentos: rectangle.pavimentos,
    elementos: [
      wall('o1', 0, 0, 6, 0),
      wall('o2', 6, 0, 6, 6),
      wall('o3', 6, 6, 0, 6),
      wall('o4', 0, 6, 0, 0),
      wall('i1', 2, 2, 4, 2),
      wall('i2', 4, 2, 4, 4),
      wall('i3', 4, 4, 2, 4),
      wall('i4', 2, 4, 2, 2),
    ],
  };
  const result = {
    nodes: doc.nos.length,
    area: original.area,
    perimeter: original.perimetro,
    movedArea: moved[0].area,
    dimension: topology.dimensionGeometry(doc.cotas[0]).comprimento,
    name: rooms.matchRoom(doc.ambientes[0], moved) ? doc.ambientes[0].nome : null,
    split: rooms.detectRooms(divider, 'f').map((r: any) => r.area),
    spur: rooms.detectRooms(dangling, 'f').map((r: any) => r.area),
    nested: rooms
      .detectRooms(nested, 'f')
      .map((r: any) => r.area)
      .sort((a: number, b: number) => a - b),
  };
  expect(result.nodes).toBe(4);
  expect(result.area).toBeCloseTo(12, 5);
  expect(result.perimeter).toBeCloseTo(14, 5);
  expect(result.movedArea).toBeCloseTo(13.5, 5);
  expect(result.dimension).toBeCloseTo(5, 5);
  expect(result.name).toBe('Sala');
  expect(result.split).toEqual([6, 6]);
  expect(result.spur).toEqual([12]);
  expect(result.nested).toEqual([4, 32]);
});

function annotatedFixture() {
  const points = [
    [0, 0],
    [4, 0],
    [4, 3],
    [0, 3],
  ];
  const nodes = points.map(([x, z], i) => ({ id: `n${i}`, pavimentoId: 'f', x, z }));
  const elements = points.map(([x, z], i) => {
    const [b, d] = points[(i + 1) % 4];
    return {
      id: `w${i}`,
      pavimentoId: 'f',
      tipo: 'PAREDE',
      nome: `Parede ${i + 1}`,
      x: (x + b) / 2,
      z: (z + d) / 2,
      base: 0,
      largura: Math.hypot(b - x, d - z),
      profundidade: 0.15,
      altura: 2.8,
      rotacao: (-Math.atan2(d - z, b - x) * 180) / Math.PI,
      cor: '#cccccc',
      paredeId: null,
      deslocamento: 0,
      noInicioId: `n${i}`,
      noFimId: `n${(i + 1) % 4}`,
    };
  });
  return {
    ...modelFixture,
    documento: {
      schemaVersao: 2,
      pavimentos: [{ id: 'f', nome: 'Térreo', cota: 0, altura: 2.8 }],
      elementos: elements,
      nos: nodes,
      cotas: [
        {
          id: 'dim',
          pavimentoId: 'f',
          tipo: 'ALINHADA',
          ax: 0,
          az: 0,
          bx: 4,
          bz: 0,
          afastamento: -0.4,
          noAId: 'n0',
          noBId: 'n1',
        },
      ],
      ambientes: [
        {
          id: 'room',
          pavimentoId: 'f',
          nome: 'Sala',
          x: 2,
          z: 1.5,
          paredeIds: elements.map((e) => e.id),
        },
      ],
    },
  };
}

test('annotated plan prints at a physical scale and blocks automatic shrinking', async ({
  page,
}) => {
  await mockModelEditor(page, 'SUPER_ADMIN', annotatedFixture());
  await page.getByText('Preparar impressão em escala', { exact: true }).click();
  await page.getByLabel('Escala da planta', { exact: true }).selectOption('20');
  await expect(
    page.getByRole('button', { name: 'Abrir planta para impressão', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Escala da planta', { exact: true }).selectOption('50');
  const popupEvent = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Abrir planta para impressão', exact: true }).click();
  const popup = await popupEvent;
  await expect(popup.getByRole('heading', { name: 'PLANTA ARQUITETÔNICA' })).toBeVisible();
  await expect(popup.getByText('ESCALA 1:50', { exact: true })).toBeVisible();
  const millimeters = await popup
    .getByRole('img', { name: 'Planta para impressão em escala' })
    .evaluate((svg: any) => (svg.getScreenCTM().a * 4 * 25.4) / 96);
  expect(millimeters).toBeCloseTo(80, 1);
  await expect(popup.getByText('12.00 m² (eixo)', { exact: true })).toBeVisible();
  await popup.close();
});

test('homologation details are available in data quality without a dashboard banner', async ({
  page,
}) => {
  await authenticated(page);
  await page.route('**/api/v1/workspace/sessao', (route) =>
    route.fulfill({
      json: { ...session, empresa: { ...session.empresa, ambienteDados: 'HOMOLOGACAO' } },
    }),
  );
  await page.route('**/api/v1/workspace/registros/**', (route) =>
    route.fulfill({ json: { items: [], total: 0, page: 0, size: 25 } }),
  );
  await page.route('**/api/v1/workspace/dados/diagnostico', (route) =>
    route.fulfill({
      json: {
        geradoEm: '2026-11-06T12:00:00Z',
        ambienteDados: 'HOMOLOGACAO',
        contagens: { usuarios: 10, obras: 1 },
        perfisAtivos: { SUPER_ADMIN: 1, RH: 1 },
        alertas: [
          {
            codigo: 'BASE_DE_TESTE',
            quantidade: 1,
            mensagem: 'Dados de teste, sem comprovação factual.',
          },
        ],
        escopo: 'Não comprova identidade cadastral ou aceite humano.',
      },
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Empreendimentos', exact: true })).toBeVisible();
  await expect(page.getByText('AMBIENTE DE HOMOLOGAÇÃO', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Qualidade dos dados', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Qualidade dos dados', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('BASE DE TESTE', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Não comprova identidade cadastral ou aceite humano.', { exact: true }),
  ).toBeVisible();
});
