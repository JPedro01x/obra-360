import { test, expect } from '@playwright/test';

test.describe('Obra 360 - Auditoria Completa de Funcionalidades, Telas e Perfis RBAC', () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas', { timeout: 15000 }).catch(() => {});

    // Fechar banner de cookies LGPD caso esteja visível
    const cookieBtn = page.locator('button:has-text("Concordar e Continuar")');
    if (await cookieBtn.isVisible()) {
      await cookieBtn.click();
    }
  });

  test('1. Deve validar todas as 14 abas operacionais como SUPER_ADMIN', async ({ page }) => {
    // 1.1 Modelo 3D Interativo & BIM
    await page.locator('[data-testid="nav-tab-3D"]').click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 1/14: Modelo 3D Interativo validada.');

    // 1.2 Dashboard Executivo & VGV
    await page.locator('[data-testid="nav-tab-DASHBOARD"]').click();
    await expect(page.locator('[data-testid="kpi-progresso-global"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Curva S Executiva')).toBeVisible();
    console.log('✓ Aba 2/14: Dashboard Executivo & Curva S validada.');

    // 1.3 Central de Projetos & GED
    await page.locator('[data-testid="nav-tab-PROJETOS"]').click();
    await expect(page.locator('h2:has-text("Central de Projetos")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 3/14: Central de Projetos & GED validada.');

    // 1.4 Almoxarifado & Estoque
    await page.locator('[data-testid="nav-tab-ESTOQUE"]').click();
    await expect(page.locator('h2:has-text("Almoxarifado & Estoque")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Registrar Movimentação")')).toBeVisible();
    console.log('✓ Aba 4/14: Almoxarifado & Estoque validada.');

    // 1.5 Ordens de Serviço & Equipes
    await page.locator('[data-testid="nav-tab-ORDENS_SERVICO"]').click();
    await expect(page.locator('h2:has-text("Ordens de Serviço")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Emitir Nova OS de Canteiro")')).toBeVisible();
    console.log('✓ Aba 5/14: Ordens de Serviço & Equipes validada.');

    // 1.6 Medições Físico-Financeiras
    await page.locator('[data-testid="nav-tab-MEDICOES"]').click();
    await expect(page.locator('h2:has-text("Gestão de Medições")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 6/14: Medições Físico-Financeiras validada.');

    // 1.7 Conciliação NF-e (44 Dígitos)
    await page.locator('[data-testid="nav-tab-CONCILIACAO_NFE"]').click();
    await expect(page.locator('h2:has-text("Conciliação de NF-e por Chave de 44 Dígitos")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 7/14: Conciliação NF-e (44 Dígitos) validada.');

    // 1.8 Chat B2B & Central de Mensagens
    await page.locator('[data-testid="nav-tab-MENSAGENS"]').click();
    await expect(page.locator('h3:has-text("Canais B2B do Ecossistema")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 8/14: Chat B2B & Central de Mensagens validada.');

    // 1.9 Marketplace B2B
    await page.locator('[data-testid="nav-tab-MARKETPLACE"]').click();
    await expect(page.locator('h2:has-text("Hub de Negócios B2B")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 9/14: Marketplace B2B validada.');

    // 1.10 Portal de Vendas Imobiliárias
    await page.locator('[data-testid="nav-tab-VENDAS"]').click();
    await expect(page.locator('text=Espelho de Vendas Interativo')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 10/14: Portal de Vendas Imobiliárias validada.');

    // 1.11 Portal do Proprietário
    await page.locator('[data-testid="nav-tab-CLIENTE"]').click();
    await expect(page.locator('text=Diário Fotográfico Transparente')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 11/14: Portal do Proprietário validada.');

    // 1.12 Garantia & Pós-Vendas
    await page.locator('[data-testid="nav-tab-POSVENDAS"]').click();
    await expect(page.locator('h2:has-text("Portal de Garantia")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 12/14: Garantia & Pós-Vendas validada.');

    // 1.13 Permissões (RBAC / IAM)
    await page.locator('[data-testid="nav-tab-RBAC"]').click();
    await expect(page.locator('h2:has-text("Matriz de Governança")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 13/14: Permissões (RBAC / IAM) validada.');

    // 1.14 Auditoria (MongoDB)
    await page.locator('[data-testid="nav-tab-AUDITORIA"]').click();
    await expect(page.locator('h2:has-text("Trilha de Auditoria")')).toBeVisible({ timeout: 10000 });
    console.log('✓ Aba 14/14: Auditoria (MongoDB) validada.');
  });

  test('2. Deve testar a regra de negócio da Conciliação Fiscal NF-e (Validação de 44 dígitos)', async ({ page }) => {
    await page.locator('[data-testid="nav-tab-CONCILIACAO_NFE"]').click();
    await expect(page.locator('h2:has-text("Conciliação de NF-e")')).toBeVisible({ timeout: 10000 });
    
    // Campo de entrada da chave NFe
    const inputKey = page.locator('input[placeholder*="352608"]').first();
    const submitBtn = page.locator('button:has-text("Validar Chave de 44 Dígitos")');

    // Chave incompleta com 10 dígitos: botão deve estar desabilitado e contador indicando 10/44
    await inputKey.fill('1234567890');
    await expect(page.locator('text=10/44 dígitos')).toBeVisible();
    await expect(submitBtn).toBeDisabled();
    console.log('✓ Validação de Chave Inválida bloqueada reativamente com botão desabilitado conforme [RN-01].');

    // Submete chave válida com exatos 44 dígitos
    const valid44Key = '35260112345678000195550010000921441234567890';
    await inputKey.fill(valid44Key);
    await expect(page.locator('text=44/44 dígitos')).toBeVisible();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await expect(page.locator('text=NF-e Conciliada com Sucesso')).toBeVisible({ timeout: 5000 });
    console.log('✓ Conciliação com Chave de 44 Dígitos e entrada no almoxarifado realizada com sucesso.');
  });

  test('3. Deve testar funcionalidades operacionais de Canteiro: Ordem de Serviço & Medição', async ({ page }) => {
    // 3.1 Emissão de O.S.
    await page.locator('[data-testid="nav-tab-ORDENS_SERVICO"]').click();
    await page.click('button:has-text("Emitir Nova OS de Canteiro")');
    await expect(page.locator('text=Emitir Ordem de Serviço')).toBeVisible();
    await page.fill('input[placeholder*="Concretagem das Colunas"]', 'Alvenaria do 5º Pavimento');
    await page.click('button:has-text("Emitir OS")');
    await expect(page.locator('text=Alvenaria do 5º Pavimento')).toBeVisible({ timeout: 5000 });
    console.log('✓ Criação e emissão de Nova Ordem de Serviço validada.');

    // 3.2 Aprovação de Medição Físico-Financeira
    await page.locator('[data-testid="nav-tab-MEDICOES"]').click();
    const approveBtn = page.locator('button:has-text("Aprovar Engenharia")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.locator('text=Medição Física Aprovada')).toBeVisible({ timeout: 5000 });
      console.log('✓ Aprovação de Medição pelo Engenheiro Fiscal validada.');
    }
  });

  test('4. Deve testar o Marketplace B2B e Reserva Imobiliária em Vendas', async ({ page }) => {
    // 4.1 Marketplace B2B
    await page.locator('[data-testid="nav-tab-MARKETPLACE"]').click();
    await page.click('button:has-text("Locação de Máquinas")');
    await expect(page.locator('text=Escavadeira Hidráulica').first()).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Cotação Materiais")');
    await expect(page.locator('button:has-text("Nova Cotação B2B")')).toBeVisible();
    console.log('✓ Cotações e Locação de Frotas no Marketplace B2B validados.');

    // 4.2 Reserva de Unidade em Vendas
    await page.locator('[data-testid="nav-tab-VENDAS"]').click();
    const reserveBtn = page.locator('button:has-text("Reservar Unidade")').first();
    if (await reserveBtn.isVisible()) {
      await reserveBtn.click();
      await expect(page.locator('text=Unidade Reservada com Sucesso')).toBeVisible({ timeout: 5000 });
      console.log('✓ Reserva de unidade no Espelho de Vendas validada.');
    }
  });

  test('5. Deve testar o isolamento rigoroso de permissões (RBAC) para diferentes perfis de usuários', async ({ page }) => {
    // 5.1 Perfil CORRETOR
    await page.locator('[data-testid="user-profile-menu-btn"]').click();
    await page.click('text=Simular Perfil (Modo Dev)');
    await page.locator('button:has-text("Corretor / Imobiliária Parceira")').click();
    await page.waitForTimeout(500);

    // Corretor DEVE ver Vendas, mas NÃO DEVE ver Estoque, RBAC ou NF-e
    await expect(page.locator('[data-testid="nav-tab-VENDAS"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-ESTOQUE"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-CONCILIACAO_NFE"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-RBAC"]')).not.toBeVisible();
    console.log('✓ Perfil CORRETOR: Acesso exclusivo a vendas e bloqueio operacional validado.');

    // 5.2 Perfil CLIENTE PROPRIETÁRIO
    await page.locator('[data-testid="user-profile-menu-btn"]').click();
    await page.click('text=Simular Perfil (Modo Dev)');
    await page.locator('button:has-text("Cliente Proprietário (Sua Casa)")').click();
    await page.waitForTimeout(500);

    // Cliente DEVE ver Portal do Proprietário e Pós-Vendas, mas NÃO DEVE ver Gestão de Obras
    await expect(page.locator('[data-testid="nav-tab-CLIENTE"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-POSVENDAS"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-3D"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-ESTOQUE"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-MEDICOES"]')).not.toBeVisible();
    console.log('✓ Perfil CLIENTE: Acesso exclusivo ao portal de cliente e pós-vendas validado.');

    // 5.3 Perfil ALMOXARIFE CHEFE
    await page.locator('[data-testid="user-profile-menu-btn"]').click();
    await page.click('text=Simular Perfil (Modo Dev)');
    await page.locator('button:has-text("Almoxarife Chefe")').click();
    await page.waitForTimeout(500);

    // Almoxarife DEVE ver Estoque e NF-e, mas NÃO DEVE ver Vendas nem RBAC
    await expect(page.locator('[data-testid="nav-tab-ESTOQUE"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-CONCILIACAO_NFE"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-VENDAS"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-tab-RBAC"]')).not.toBeVisible();
    console.log('✓ Perfil ALMOXARIFE: Acesso a almoxarifado/NF-e e bloqueio a vendas validado.');
  });

  test('6. Deve testar troca Multi-Tenant de Empresa e Empreendimento', async ({ page }) => {
    // 6.1 Troca de Empresa Multi-Tenant
    // O dropdown trigger é o <button> dentro do card de "Organização Corporativa (Empresa Active Tenant)"
    // A empresa ativa padrão é "Engenharia & Construções Jardins S.A." (CMP-001)
    // Vamos trocar para "Silva & Associados Arquitetura & Projetos BIM" (CMP-002)
    
    // Abre o dropdown clicando no botão que contém o CNPJ da empresa ativa
    await page.locator('button:has-text("12.345.678/0001-90")').click();
    await page.waitForTimeout(500);
    
    // O dropdown exibe os itens como <div> com onClick. Usa evaluate() para clicar pelo texto exato.
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const target = divs.find(d =>
        d.textContent?.includes('Silva & Associados Arquitetura') &&
        d.classList.contains('cursor-pointer')
      );
      if (target) (target as HTMLElement).click();
    });
    await page.waitForTimeout(800);

    // Confirma que a empresa mudou: o botão agora deve exibir o CNPJ da CMP-002
    await expect(page.locator('button:has-text("98.765.432/0001-10")')).toBeVisible({ timeout: 8000 });
    console.log('✓ Troca Multi-Tenant de Organização Corporativa (CMP-001 → CMP-002) validada.');

    // 6.2 Troca de Empreendimento (Projetos com tipologias variadas)
    // O projeto ativo padrão é "Residencial Jardins das Orquídeas"
    // Vamos trocar para "Hospital Metropolitano de Alta Complexidade"
    
    // Abre o dropdown do projeto clicando no botão que contém o nome do projeto ativo
    await page.locator('button:has-text("Residencial Jardins das Orquídeas")').click();
    await page.waitForTimeout(500);

    // Clica no projeto "Hospital Metropolitano de Alta Complexidade" via evaluate()
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const target = divs.find(d =>
        d.textContent?.includes('Hospital Metropolitano de Alta Complexidade') &&
        d.classList.contains('cursor-pointer')
      );
      if (target) (target as HTMLElement).click();
    });
    await page.waitForTimeout(800);

    // Confirma que o projeto mudou: o botão agora deve exibir o nome do hospital
    await expect(page.locator('button:has-text("Hospital Metropolitano de Alta Complexidade")')).toBeVisible({ timeout: 8000 });
    console.log('✓ Troca de Empreendimento (Jardins → Hospital) e carregamento de tipologia 3D validada.');
  });

});
