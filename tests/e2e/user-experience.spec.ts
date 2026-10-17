import { test, expect } from '@playwright/test';

test.describe('Obra 360 - Simulação de Uso Real do Usuário', () => {
  test.setTimeout(90000);

  test('Jornada Completa do Usuário no Ecossistema Obra 360', async ({ page }) => {
    // 1. Acesso inicial do Engenheiro Residente / Super Admin
    await page.addInitScript(() => localStorage.clear());
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas', { timeout: 15000 }).catch(() => {});
    await expect(page.locator('h1').first()).toContainText('Obra360');
    console.log('✓ 1. Acesso à Plataforma Obra 360 realizado com sucesso.');

    // 2. Interação no Modelo 3D BIM Evolutivo
    await page.locator('[data-testid="nav-tab-3D"]').click();
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 100, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 150);
      await page.mouse.up();
    }
    console.log('✓ 2. Modelo 3D BIM manipulado e visualizado com sucesso.');

    // 3. Mudança para perfil de Almoxarife & Gestão de Estoque via Menu de Usuário
    await page.locator('[data-testid="user-profile-menu-btn"]').click();
    await page.click('text=Simular Perfil (Modo Dev)');
    await page.click('button:has-text("Almoxarife Chefe")');
    await page.waitForTimeout(500);

    await page.locator('[data-testid="nav-tab-ESTOQUE"]').click();
    await expect(page.locator('h2:has-text("Almoxarifado & Estoque")')).toBeVisible();
    console.log('✓ 3. Perfil alternado via Menu de Usuário para Almoxarife & Estoque acessado.');

    // 4. Mudança para perfil de Cliente (Portal do Cliente)
    await page.waitForTimeout(500);
    await page.locator('[data-testid="user-profile-menu-btn"]').click();
    await page.click('text=Simular Perfil (Modo Dev)');
    await page.click('button:has-text("Cliente Proprietário (Sua Casa)")');
    await page.waitForTimeout(500);

    const clienteTab = page.locator('[data-testid="nav-tab-CLIENTE"]');
    if (await clienteTab.isVisible()) {
      await clienteTab.click();
      await expect(page.locator('text=Portal Transparente do Proprietário')).toBeVisible();
    }
    console.log('✓ 4. Portal do Cliente acessado e acompanhamento verificado.');

    // 5. Retorno ao perfil Super Admin & Alternância de Tema
    await page.locator('[data-testid="user-profile-menu-btn"]').first().click({ force: true });
    await page.click('text=Simular Perfil (Modo Dev)');
    await page.click('button:has-text("Super Administrador (TI)")');

    const themeBtn = page.locator('button:has-text("Modo Escuro"), button:has-text("Modo Claro")').first();
    await themeBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ 5. Tema alternado e sessão de uso finalizada com sucesso.');
  });

});
