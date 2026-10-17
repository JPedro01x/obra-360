import { test, expect } from '@playwright/test';

test.describe('Obra 360 - Definitive React Frontend E2E Suite', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas', { timeout: 15000 }).catch(() => {});
  });

  test('1. Deve carregar o título e a marca da plataforma Obra 360', async ({ page }) => {
    await expect(page).toHaveTitle(/Obra 360/i);
    await expect(page.locator('h1').first()).toContainText('Obra360');
  });

  test('2. Deve navegar entre todas as abas principais do sistema', async ({ page }) => {
    // Aba Dashboard
    await page.locator('[data-testid="nav-tab-DASHBOARD"]').click();
    await expect(page.locator('[data-testid="kpi-progresso-global"]')).toBeVisible({ timeout: 15000 });

    // Aba Modelo 3D Interativo & BIM
    await page.locator('[data-testid="nav-tab-3D"]').click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });

    // Aba Central de Projetos
    await page.locator('[data-testid="nav-tab-PROJETOS"]').click();
    await expect(page.locator('h2:has-text("Central de Projetos")')).toBeVisible({ timeout: 15000 });
  });

  test('3. Deve alternar entre perfis de acesso RBAC através do menu de perfil', async ({ page }) => {
    await page.locator('[data-testid="user-profile-menu-btn"]').click();
    await page.click('text=Simular Perfil (Modo Dev)');
    await page.click('button:has-text("Engenheiro Residente")');
    await expect(page.locator('text=SaaS Enterprise')).toBeVisible();
  });

  test('4. Deve alternar entre o Modo Escuro e Modo Claro', async ({ page }) => {
    const themeBtn = page.locator('[data-testid="theme-toggle-btn"]').first();
    await themeBtn.click();
    await page.waitForTimeout(500);
    await themeBtn.click();
  });

  test('5. Deve validar o funcionamento do mapa 3D com canvas Three.js', async ({ page }) => {
    await page.click('button:has-text("Modelo 3D Interativo & BIM")');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Interação no modelo Three.js
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
  });

  test('6. Deve abrir o gerenciador de modelos 3D e gerenciar maquetes por projeto', async ({ page }) => {
    await page.click('button:has-text("Modelo 3D Interativo & BIM")');
    await page.click('button:has-text("Gerenciar / Novo Modelo 3D")');
    await expect(page.locator('text=Gerenciar Modelo 3D do Empreendimento')).toBeVisible();
    await expect(page.locator('text=Template da Tipologia')).toBeVisible();
    await expect(page.locator('text=Upload Arquivo IFC / BIM')).toBeVisible();
    await page.click('button:has-text("Fechar")');
    await expect(page.locator('text=Gerenciar Modelo 3D do Empreendimento')).not.toBeVisible();
  });

});

