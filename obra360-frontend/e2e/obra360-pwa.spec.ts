import { test, expect } from '@playwright/test';

test.describe('Obra 360 - Playwright E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Deve carregar a página inicial do Obra 360 PWA com título correto', async ({ page }) => {
    await expect(page).toHaveTitle(/Obra 360/i);
    await expect(page.locator('.brand-title')).toHaveText('Obra 360');
  });

  test('Deve navegar entre todos os 8 módulos do sistema', async ({ page }) => {
    // 1. Dashboard
    await page.click('text=📊 Dashboard & Curva S');
    await expect(page.locator('#sec-dashboard')).toBeVisible();

    // 2. Diário Transparente
    await page.click('text=📝 Diário Transparente');
    await expect(page.locator('#sec-diario')).toBeVisible();

    // 3. Ordens de Serviço
    await page.click('text=🛠️ Ordens de Serviço');
    await expect(page.locator('#sec-os')).toBeVisible();

    // 4. Almoxarifado & Cm2
    await page.click('text=📦 Almoxarifado & Cm²');
    await expect(page.locator('#sec-estoque')).toBeVisible();

    // 5. Conciliação NFe
    await page.click('text=📜 Conciliação NF-e (44d)');
    await expect(page.locator('#sec-nfe')).toBeVisible();

    // 6. NR-18 / ISO 9001
    await page.click('text=⚠️ NR-18 / ISO 9001');
    await expect(page.locator('#sec-ocorrencias')).toBeVisible();

    // 7. Pós-Venda
    await page.click('text=🏡 Pós-Venda & Garantia');
    await expect(page.locator('#sec-posvenda')).toBeVisible();

    // 8. Sincronização
    await page.click('text=🔄 Sincronização');
    await expect(page.locator('#sec-sync')).toBeVisible();
  });

  test('Deve submeter registro de Diário de Obra no modo PWA Offline e salvar no IndexedDB', async ({ page }) => {
    await page.click('text=📝 Diário Transparente');
    await page.fill('#diario-etapa', 'Concretagem de Laje 5º Pavimento');
    await page.fill('#diario-percentual', '90');
    await page.selectOption('#diario-clima', 'Ensolarado / Bom');
    await page.fill('#diario-obs', 'Serviço executado com conformidade e sem interrupções.');
    
    // Escuta o alert de confirmação
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('salvo localmente');
      await dialog.accept();
    });

    await page.click('#form-diario button[type="submit"]');
    await expect(page.locator('#diario-list')).toContainText('Concretagem de Laje 5º Pavimento');
  });

  test('Deve validar a obrigatoriedade dos 44 dígitos na chave de acesso da NF-e', async ({ page }) => {
    await page.click('text=📜 Conciliação NF-e (44d)');
    await page.fill('#nfe-chave', '12345'); // Chave inválida com 5 dígitos

    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('44 dígitos numéricos');
      await dialog.accept();
    });

    await page.click('#form-nfe button[type="submit"]');
  });

  test('Deve alternar entre os temas Claro e Escuro (Design System)', async ({ page }) => {
    const themeBtn = page.locator('#theme-toggle');
    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await themeBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
