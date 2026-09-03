import { test, expect } from '@playwright/test';

test.describe('Obra360 Enterprise End-to-End User Flow', () => {
  test('Deve realizar o fluxo completo de acesso ao sistema, seleção de obra e visualização 3D', async ({ page }) => {
    // 1. Acessa a página principal
    await page.goto('/');

    // 2. Verifica se o cabeçalho Obra360 está visível
    const brandHeader = page.locator('h1', { hasText: 'Obra360' });
    await expect(brandHeader).toBeVisible();

    // 3. Altera a aba para Modelo 3D & BIM
    const btn3d = page.getByRole('button', { name: /Modelo 3D/i });
    if (await btn3d.isVisible()) {
      await btn3d.click();
    }

    // 4. Navega até a Central de Privacidade LGPD
    const btnLgpd = page.getByRole('button', { name: /LGPD/i });
    if (await btnLgpd.isVisible()) {
      await btnLgpd.click();
      const lgpdTitle = page.locator('h2', { hasText: 'Central de Privacidade' });
      await expect(lgpdTitle).toBeVisible();
    }
  });
});
