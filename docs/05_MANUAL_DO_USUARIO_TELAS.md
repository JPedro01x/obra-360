# 🖥️ MANUAL DO USUÁRIO - TELAS E MÓDULOS DO OBRA360

Este manual fornece o passo a passo detalhado para navegação e utilização de todas as **10 Telas Principais** da plataforma **Obra360 Enterprise**.

---

## 🔐 TELA 1: LOGIN & AUTENTICAÇÃO (`LoginView.tsx`)

### 📌 Objetivo
Permitir a autenticação segura de usuários cadastrados no ecossistema corporativo via e-mail/senha ou **Google OAuth 2.0 Identity Services**.

### 📱 Elementos da Tela:
1. **Logotipo & Seletor de Perfis Rápidos (Lado Esquerdo):**
   - Lista todas as contas de demonstração do ecossistema divididas pelos 13 perfis RBAC.
   - Botão **Modo Claro / Modo Escuro** no canto superior direito.
2. **Formulário de Acesso Corporativo (Lado Direito):**
   - Campo **E-mail Cadastrado** (validação estrita contra a base de usuários).
   - Campo **Senha Corporativa** com ícone de olho para visualizar/ocultar senha.
   - Checkbox **Lembrar meus dados** para salvar preferências no `localStorage`.
   - Botão **`Fazer login com o Google`** que abre o modal oficial de contas do Google.

### 💡 Como Usar:
1. Digite seu e-mail e senha corporativa registrados ou clique em **`Fazer login com o Google`**.
2. Selecione sua conta no modal do Google.
3. Se sua conta for válida e estiver ativa, você será direcionado instantaneamente para a tela correspondente ao seu perfil de acesso.

---

## 📊 TELA 2: DASHBOARD EXECUTIVO GLOBAL (`ExecutiveDashboard.tsx`)

### 📌 Objetivo
Apresentar a visão consolidada de performance física e financeira para a Diretoria, Incorporadores e Engenheiros Chefes.

### 📱 Elementos da Tela:
1. **Cards de Indicadores de Produção (KPIs Topo):**
   - **VGV Total Gerenciado:** Valor Geral de Vendas em R$.
   - **Avanço Físico Médio:** Percentual global de evolução das obras (ex: 68%).
   - **ROI Projetado:** Retorno estimado sobre o investimento.
   - **Membros Ativos:** Quantidade de colaboradores conectados no Tenant.
2. **Gráficos da Curva S (Físico-Financeiro):**
   - Comparativo visual em tempo real entre o **Orçado** e o **Realizado**.
3. **Seletor de Organização Multi-Tenant (`CompanySelectorHeader.tsx`):**
   - Permite alternar a visualização entre diferentes construtoras do grupo corporativo.

### 💡 Como Usar:
1. Utilize o seletor no topo para filtrar por empreendimento específico.
2. Analise os desvios da Curva S para identificar fases com atraso físico ou estouro financeiro.
3. Exporte o relatório em PDF para reuniões de diretoria.

---

## 📦 TELA 3: ALMOXARIFADO & GESTÃO DE ESTOQUE (`InventoryManager.tsx`)

### 📌 Objetivo
Controlar a entrada e saída física de insumos no canteiro com validação de Nota Fiscal Eletrônica (NFe).

### 📱 Elementos da Tela:
1. **Barra de Entrada Fiscal com Chave NFe (44 Dígitos):**
   - Campo para bipar ou digitar a **Chave de Acesso NFe de 44 dígitos**.
   - Botão de validação SEFAZ automática.
2. **Calculadora Inteligente de Materiais $m^2$:**
   - Seleção da etapa construtiva (Alvenaria, Estrutura, Pintura) e digitação da área em $m^2$.
   - O sistema calcula automaticamente a quantidade exata de sacos de cimento, tijolos ou tinta necessários baseando-se nas estratégias do padrão GoF Strategy.
3. **Tabela de Saldos & Alerta de Estoque Mínimo:**
   - Lista todos os insumos (ex: *Cimento Votoran Fck 30MPa*, *Vergalhão Gerdau CA-50*).
   - Destaque em **vermelho/amarelo** para itens que atingiram o limite crítico mínimo.

### 💡 Como Usar:
1. **Dar Entrada:** Cole a chave NFe de 44 dígitos, selecione o produto e quantidade e clique em **`Dar Entrada Fiscal`**.
2. **Dar Baixa (Saída para Obra):** Selecione o item, informe a quantidade retirada pelo mestre de obras e confirme a baixa.
3. **Calcular Insumo:** Insira a metragem quadrada da laje ou parede para gerar a lista de materiais ideal.

---

## 🛡️ TELA 4: SEGURANÇA NR-18 & QUALIDADE ISO 9001 (`SafetyManager.tsx`)

### 📌 Objetivo
Fiscalizar a segurança do trabalho no canteiro e auditoria de conformidade técnica das normas ABNT.

### 📱 Elementos da Tela:
1. **Formulário de Abertura de Ocorrências:**
   - Campos: Título, Categoria (Segurança NR-18, Qualidade ISO 9001, Meio Ambiente), Severidade (ALTA, MÉDIA, BAIXA).
   - Upload de foto tirada no canteiro e atribuição ao responsável.
2. **Painel de Ocorrências em Aberto / Em Correção:**
   - Cards com o status atualizado de cada não-conformidade.

### 💡 Como Usar:
1. O Técnico de Segurança ou Engenheiro clica em **`+ Abrir Ocorrência`**.
2. Registra o problema (ex: *"Trabalhador sem cinto de paraquedista no 4º andar"*).
3. Após a equipe corrigir no canteiro, o responsável clica em **`Concluir Correção`** para anexar a foto da solução.

---

## 🛒 TELA 5: MARKETPLACE B2B DE SUPRIMENTOS (`MarketplaceB2B.tsx`)

### 📌 Objetivo
Conectar os analistas de compras das construtoras diretamente com fornecedores homologados para cotações em lote (RFQ).

### 📱 Elementos da Tela:
1. **Criador de Cotações RFQ:**
   - Formulário para solicitar insumos estruturais, materiais elétricos ou locação de frotas.
2. **Painel de Respostas e Mapa Comparativo de Preços:**
   - Exibe as propostas enviadas por fornecedores homologados (Votoran, Gerdau, Caterpillar).
   - Destaca automaticamente a proposta de **menor preço e menor prazo**.

### 💡 Como Usar:
1. O Comprador clica em **`+ Nova Cotação B2B`**, informa os materiais necessários e envia.
2. Os fornecedores recebem a notificação e inserem seus preços e prazos.
3. O comprador analisa o mapa comparativo e clica em **`Aprovar Ordem de Compra`**.

---

## 🏛️ TELA 6: VISUALIZADOR 3D BIM (`Floorplan3DViewer.tsx`)

### 📌 Objetivo
Permitir a navegação tridimensional no modelo arquitetônico e engenharia do prédio.

### 📱 Elementos da Tela:
1. **Canvas 3D Interativo (Three.js / WebGL):**
   - Renderização dos pilares, lajes, paredes e esquadrias do edifício.
2. **Controles de Órbita & Camadas:**
   - Botões para isolar disciplinas (Arquitetura, Estrutura, Elétrica).

### 💡 Como Usar:
1. Arraste o mouse para rotacionar o prédio em 360 graus.
2. Utilize o scroll para dar zoom nos detalhes de cada pavimento.
3. Clique em um elemento (ex: laje do 3º andar) para ver as especificações de resistência do concreto.

---

## 🏠 TELA 7: PORTAL DO CLIENTE (`RealEstateStorefrontView.tsx`)

### 📌 Objetivo
Proporcionar transparência total ao cliente comprador da unidade sobre o andamento e materiais usados no seu imóvel.

### 📱 Elementos da Tela:
1. **Indicador de Progresso da Unidade:**
   - Gráfico circular mostrando o percentual concluído do apartamento (ex: 68%).
2. **Linha do Tempo de Rastreabilidade de Materiais:**
   - Lista exata dos fornecedores e notas fiscais dos materiais aplicados no seu andar.
3. **Galeria de Fotos do Diário de Obra (RDO):**
   - Fotos semanais atualizadas pelo engenheiro.

### 💡 Como Usar:
1. O cliente entra com o convite exclusivo.
2. Acompanha a evolução das etapas (Estrutura -> Alvenaria -> Acabamento).
3. Clica nos detalhes dos materiais para conferir marcas e garantias.

---

## 📄 TELA 8: GESTÃO DE DOCUMENTOS TÉCNICOS (`DocumentManagerView.tsx`)

### 📌 Objetivo
Centralizar o repositório de pranchas de projeto, laudos de ART e licenças ambientais.

---

## 🔍 TELA 9: MATRIZ DE PERMISSÕES RBAC (`RbacMatrixView.tsx`)

### 📌 Objetivo
Visualizar e auditar a matriz de permissões dos 13 perfis de usuários do sistema.

---

## 📜 TELA 10: AUDITORIA & LOGS DO SISTEMA (`AuditLogViewer.tsx`)

### 📌 Objetivo
Registrar com imutabilidade todas as ações executadas no sistema (quem fez, o que fez e em qual data/hora).
