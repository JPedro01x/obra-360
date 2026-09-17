# DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE)

**Nome do Projeto:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário  
**Instituição de Ensino:** AESA-CESA (2026) — Projeto Interdisciplinar de Engenharia de Software  
**Autores (Desenvolvedores):** João Pedro e Marcos Henrique  
**Professor Orientador:** Prof. Dennys Carvalho  
**Versão:** 2.0 (Versão Acadêmica Expandida e Consolidada)  
**Data de Emissão:** 17/09/2026  

---

## 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO DO PROBLEMA

### 1.1 Introdução
O setor da construção civil e do mercado imobiliário representa uma das engrenagens mais vitais da economia mundial e nacional, impactando diretamente o Produto Interno Bruto (PIB), a geração de empregos e o desenvolvimento de infraestrutura urbana. Entretanto, historicamente, a indústria da construção caracteriza-se por uma forte fragmentação operacional, baixa taxa de digitalização e desarticulação na comunicação entre os múltiplos agentes que integram a cadeia de valor — tais como construtoras, incorporadoras, escritórios de arquitetura e engenharia, fornecedores de insumos, prestadores de serviços de locação de frotas, corretores imobiliários, investidores e compradores finais.

O **Obra360** surge como uma resposta tecnológica robusta a essa problemática. Concebido como uma **Plataforma Corporativa Web e Ecossistema Digital Integrado (SaaS Multi-Tenant B2B/B2C)**, a solução tem por finalidade centralizar, automatizar e conferir rastreabilidade total a todas as fases do ciclo de vida de um empreendimento imobiliário ou de infraestrutura — abrangendo desde a concepção da oportunidade e estudo de viabilidade do terreno, passando pelo planejamento físico-financeiro, modelagem espacial 2D/3D (BIM), cotações B2B automatizadas por Nota Fiscal Eletrônica (NFe), diário de obra inteligente com auxílio de Inteligência Artificial, fiscalização de segurança NR-18 e ISO 9001, até a comercialização de unidades, entrega das chaves e gestão de garantias pós-obra (ABNT NBR 15575).

---

### 1.2 A "Dor" Central e a Problematização no Canteiro de Obras
A execução de obras civis de qualquer porte envolve a convergência de dezenas de organizações terceirizadas, centenas de insumos heterogêneos e múltiplos perfis profissionais atuando simultaneamente sob prazos rígidos e orçamentos elevados. No cenário tradicional, as informações estratégicas e operacionais encontram-se pulverizadas em canais informais de mensagens instantâneas, planilhas eletrônicas locais descentralizadas, pranchas impressas desatualizadas e sistemas legados isolados que não se comunicam.

Essa assimetria de informações gera desdobramentos críticos para a gestão:
1. **Perda de Controle Financeiro e de Materiais:** A ausência de sincronização em tempo real entre a frente de trabalho (canteiro) e o almoxarifado impede a apuração exata do consumo de insumos por metro quadrado ($m^2$), culminando em compras duplicadas, desvio de materiais e estouro orçamentário.
2. **Uso de Versões Obsoletas de Projetos:** A falta de versionamento centralizado de arquivos arquitetônicos e estruturais conduz a erros graves de execução no canteiro, demandando demolições e retrabalhos dispendiosos.
3. **Falhas na Comunicação e Opacidade com o Cliente Final:** O comprador de uma unidade imobiliária ou investidor permanece privado de informações claras e confiáveis sobre o avanço físico real da construção, gerando desconfiança, chamados constantes de suporte e insegurança jurídica.
4. **Ausência de Rastreabilidade e Não Conformidades:** O descumprimento de normas técnicas de segurança do trabalho (NR-18) e critérios de qualidade (ISO 9001 e ABNT NBR 15575) decorre da falta de processos padronizados de fiscalização e registro imutável de ocorrências técnicas.

---

### 1.3 A Solução Proposta: Obra360 (Plataforma Integrada B2B/B2C)
O **Obra360** foi projetado para atuar como o **núcleo operacional e estratégico** de empreendimentos de variadas tipologias — incluindo casas residenciais, condomínios horizontais fechados, edifícios e prédios residenciais/comerciais, complexos hospitalares, galpões logísticos, usinas de energia fotovoltaica, túneis e obras de infraestrutura pesada.

A plataforma unifica em um único ambiente web responsivo os fluxos de trabalho B2B (entre empresas, fornecedores e locadoras de frotas pesadas) e B2C (entre construtoras, corretores, investidores e proprietários finais). Através de uma arquitetura limpa em camadas (*Clean Architecture*) e orientada a eventos (*Domain-Driven Design / PubSub*), o sistema garante que cada alteração realizada em um projeto, movimentação de estoque ou diário de obra seja refletida de forma imediata e transparente para os perfis autorizados.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                ECOSSISTEMA INTEGRADO OBRA360                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘
    │                │                │                │                │                │
    ▼                ▼                ▼                ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Planejamento│ │ Projetos 2D/ │ │ Almoxarifado │ │ Fiscalização │ │ Comercial &  │ │ Pós-Vendas & │
│  & Viabilidade│ │ 3D BIM & AI  │ │  & NFe B2B   │ │ NR-18 / ISO  │ │  Vendas 360  │ │ NBR 15575    │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

### 1.4 Visão Geral do Documento
Este Documento de Definição de Escopo (DDE) estabelece as balizas formais, técnicas e funcionais do projeto Obra360. Nas seções subsequentes, apresentam-se a fundamentação mercadológica amparada em dados estatísticos do setor, o mapeamento detalhado dos stakeholders e matriz de permissões (RBAC/IAM), a declaração do objetivo geral e objetivos específicos, a discriminação minuciosa dos módulos funcionais e entregáveis, a catalogação dos Requisitos Funcionais (RF) e Não Funcionais (RNF) priorizados, as premissas, restrições e exclusões deliberadas de escopo, os critérios objetivos de aceitação e a matriz de gerenciamento de riscos iniciais.

---

## 2. JUSTIFICATIVA E FUNDAMENTAÇÃO TEÓRICA / MERCADOLÓGICA

### 2.1 Cenário do Setor da Construção Civil no Brasil e no Mundo
A construção civil assume papel estratégico no desenvolvimento socioeconômico global, sendo responsável por aproximadamente 13% do PIB mundial, conforme dados da consultoria internacional McKinsey & Company. No cenário nacional, segundo dados do Instituto Brasileiro de Geografia e Estatística (IBGE, 2023) e da Câmara Brasileira da Indústria da Construção (CBIC, 2023), o setor responde por mais de 6% do PIB brasileiro e emprega diretamente mais de 2,7 milhões de trabalhadores formais.

A despeito da sua magnitude econômica, o setor da construção civil permanece classificado, de acordo com o *McKinsey Global Institute Digitization Index*, como o **segundo setor menos digitalizado do planeta**, situando-se apenas acima da agricultura e da caça. Essa estagnação tecnológica reflete-se em baixos índices de produtividade e elevados níveis de ineficiência operacional.

---

### 2.2 Evidências Empíricas e Dados Estatísticos do Setor

Para fundamentar a necessidade impreterível da plataforma Obra360, compilaram-se dados e estatísticas provenientes de órgãos governamentais, institutos de pesquisa e associações profissionais de renome no setor:

1. **Baixo Crescimento da Produtividade Global (McKinsey & Company, 2020/2023):**  
   Estudos da McKinsey demonstram que a produtividade na construção civil mundial cresceu a uma taxa média de apenas **1% ao ano nas últimas duas décadas**, enquanto a manufatura global avançou 2,8% ao ano no mesmo período. O estudo aponta que a adoção de plataformas digitais integradas e metodologias BIM possui o potencial de **elevar a produtividade do setor entre 14% e 15%** e reduzir os custos totais do projeto em até 6%.

2. **Perdas por Desperdício e Retrabalho (CBIC, 2023 / Escola Politécnica da USP):**  
   Segundo levantamentos da CBIC e pesquisas do Departamento de Engenharia de Construção Civil da USP, estima-se que **entre 5% e 8% do custo total de uma obra no Brasil é perdido devido a retrabalhos**, erros de interpretação de projetos e descontrole no recebimento e armazenamento de materiais no canteiro. Além disso, a perda física de materiais (cimento, aço, areia, blocos) chega a atingir **15% a 20% do volume total adquirido**.

3. **Impacto dos Prazos e Custos no Orçamento (FGV-IBRE / INCC, 2024):**  
   Dados do Instituto Brasileiro de Economia da Fundação Getulio Vargas (FGV-IBRE) apontam que mais de **72% das grandes obras residenciais e comerciais no Brasil sofrem atrasos superiores a 90 dias** em relação ao cronograma inicial planejado. A principal causa relatada pelos gestores é a falha no fluxo de suprimentos, desarticulação com fornecedores B2B e falta de visibilidade em tempo real do avanço físico das etapas.

4. **Exigência de Qualidade e Garantias (ABNT NBR 15575 / CBIC, 2023):**  
   Com a consolidação da Norma de Desempenho de Edificações Habitacionais (ABNT NBR 15575), construtoras e incorporadoras passaram a responder juridicamente pela vida útil e desempenho de subsistemas (estrutura, vedações, instalações hidráulicas e elétricas). A falta de um histórico auditável de fiscalização técnica e gestão de chamados pós-obra gera um volume significativo de litígios judiciais e custos não previstos de assistência técnica.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│              EVIDÊNCIAS EMPÍRICAS DO SETOR DA CONSTRUÇÃO CIVIL (FONTES OFICIAIS)         │
├──────────────────────────────────────────┬───────────────────────────────────────────────┤
│ Métrica / Indicador                      │ Fonte e Valor Apurado                         │
├──────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Crescimento anual de produtividade       │ McKinsey & Company: 1,0% a.a. (Manufatura: 2,8%)│
│ Custo perdido com retrabalho no Brasil   │ CBIC / USP: 5,0% a 8,0% do custo total        │
│ Perda física de materiais no canteiro    │ CBIC / USP: 15,0% a 20,0% dos insumos         │
│ Obras residenciais com atraso > 90 dias  │ FGV-IBRE (2024): 72,0% dos empreendimentos    │
│ Potencial de ganho com digitalização     │ McKinsey (2023): +14% a 15% na produtividade  │
└──────────────────────────────────────────┴───────────────────────────────────────────────┘
```

A partir dessas evidências, justifica-se plenamente a concepção do Obra360. A plataforma elimina a opacidade e a fragmentação ao integrar, em tempo real, a cadeia de suprimentos, o planejamento de engenharia, a fiscalização de campo e o relacionamento com clientes e investidores.

---

### 2.3 Justificativa Tecnológica e Acadêmica (Clean Architecture, DDD e Multi-Tenancy)
Do ponto de vista da Engenharia de Software, o desenvolvimento do Obra360 justifica-se pela oportunidade de aplicar e consolidar os padrões arquiteturais mais avançados do mercado corporativo moderno:
- **Clean Architecture em 4 Camadas:** Separação estrita das regras de negócio puras (Domain) em relação a Use Cases, Adapters e Frameworks de UI (React/Spring Boot), garantindo testabilidade, desacoplamento e longevidade do código-fonte.
- **Domain-Driven Design (DDD):** Modelagem do sistema orientada pela Linguagem Ubíqua do domínio da construção civil (Canteiro, Diário de Obra, Insumo SKU, NFe, Terreno, Unidade Imobiliária, RDO, VBS/WBS).
- **Arquitetura Orientada a Eventos (Event-Driven / PubSub):** Processamento não-bloqueante de movimentações de estoque, alertas de almoxarifado e atualizações de cronograma em tempo real.
- **Multi-Tenancy SaaS B2B/B2C:** Suporte a múltiplas organizações corporativas concorrentes no mesmo banco de dados com isolamento lógico absoluto por CNPJ/Tenant ID.

---

## 3. IDENTIFICAÇÃO DO PROJETO E STAKEHOLDERS

### 3.1 Identificação do Projeto
- **Nome Oficial do Projeto:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário
- **Instituição:** Faculdade AESA-CESA (Arcoverde/PE) — Projeto Interdisciplinar 2026
- **Equipe de Desenvolvimento (Autores):** João Pedro e Marcos Henrique
- **Professor Orientador:** Prof. Dennys Carvalho
- **Público-Alvo / Clientes-Alvo:** Construtoras, incorporadoras, escritórios de engenharia e arquitetura, fornecedores de insumos da construção, empresas de locação de frotas e máquinas pesadas, imobiliárias, corretores autônomos, investidores imobiliários e clientes compradores finais.
- **Tipologias de Empreendimentos Suportadas:** Casas residenciais, condomínios horizontais fechados, edifícios e prédios residenciais/comerciais, complexos hospitalares, galpões logísticos, projetos de energia fotovoltaica, túneis, obras rodoviárias e de infraestrutura urbana.

---

### 3.2 Mapeamento de Stakeholders (Partes Interessadas)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                MAPEAMENTO DE STAKEHOLDERS                                │
├──────────────────────────┬───────────────────────────────────────────────────────────────┤
│ Stakeholder              │ Papel e Interesse no Projeto                                  │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ João Pedro e Marcos H.   │ Alunos Desenvolvedores: Concepção, arquitetura e codificação. │
│ Prof. Dennys Carvalho    │ Professor Orientador: Orientação acadêmica e avaliação.       │
│ Administrador do Sistema │ Gestão de tenants corporativos, usuários e segurança IAM.     │
│ Gerente de Empreendimento│ Gestão de custos, prazos, orçamentos e viabilidade da obra.   │
│ Engenheiro Residente     │ Aprovação técnica de projetos 2D/3D, medições e medições RDO.  │
│ Arquiteto                │ Versionamento de desenhos técnicos, pranchas e modelos BIM.   │
│ Mestre de Obras          │ Apontamento diário de campo, contingente e laudos NR-18.      │
│ Almoxarife Chefe         │ Recebimento de notas fiscais NFe e baixa de insumos por SKU.  │
│ Analista Financeiro      │ Acompanhamento de fluxo de caixa, pagamentos e orçado x real. │
│ Fornecedor de Insumos B2B│ Envio de propostas de cotação (RFQ) e recebimento de pedidos. │
│ Empresa de Locação       │ Oferta e gestão de locação de máquinas e frotas pesadas.      │
│ Imobiliária / Corretor   │ Comercialização de unidades, espelho de vendas e simulações.  │
│ Investidor Imobiliário   │ Acompanhamento do VGV, rentabilidade e progresso global.      │
│ Cliente Final (Comprador)│ Acompanhamento visual da própria unidade e diário transparente.│
│ Auditor de Qualidade     │ Rastreabilidade imutável de logs e conformidade ISO 9001.     │
└──────────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

### 3.3 Perfis de Usuários e Matriz de Direitos/Restrições (SoD - Segregation of Duties)

Para cumprir as diretrizes de controle interno, governança corporativa e segregação de funções (Segregation of Duties - SoD), o Obra360 estabelece **11 perfis de acesso granulares (Role-Based Access Control - RBAC / IAM)**. Cada perfil possui limites claros quanto ao que pode e não pode realizar no sistema:

```
                  ┌─────────────────────────────────────────────────┐
                  │          AUTENTICAÇÃO & CONTROLE IAM            │
                  └────────────────────────┬────────────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌────────────────────────────────┐                         ┌────────────────────────────────┐
│   PERFIS OPERACIONAIS / CAMPO  │                         │  PERFIS COMERCIAIS & CLIENTES  │
├────────────────────────────────┤                         ├────────────────────────────────┤
│ • Super Admin (Soberano)       │                         │ • Financeiro (Custos/NFe)      │
│ • Gerente de Empreendimento    │                         │ • Fornecedor B2B (Cotações)    │
│ • Engenheiro Residente         │                         │ • Imobiliária / Corretor       │
│ • Arquiteto                    │                         │ • Investidor Imobiliário       │
│ • Mestre de Obras              │                         │ • Cliente Final (Proprietário) │
│ • Almoxarife Chefe             │                         │ • Auditor Interno (ISO 9001)   │
└────────────────────────────────┘                         └────────────────────────────────┘
```

#### Detalhamento das Capacidades e Restrições por Perfil:

1. **SUPER_ADMIN (Administrador Geral / Soberano):**
   - **O que faz:** Acesso irrestrito a todas as funcionalidades do sistema; cadastra organizações (Tenants), gerencia contas de usuários, altera perfis IAM, visualiza logs imutáveis de auditoria e parametriza o sistema.
   - **O que NÃO faz:** Não realiza operações simuladas de cliente final sem registrar rastreabilidade.

2. **GERENTE_OBRA (Gerente de Empreendimento):**
   - **O que faz:** Cria e edita dados de empreendimentos; aprova cronogramas físico-financeiros; visualiza relatórios de viabilidade e VGV; aprova grandes compras do almoxarifado.
   - **O que NÃO faz:** Não pode alterar logs imutáveis de auditoria nem excluir registros de notas fiscais já processadas.

3. **ENGENHEIRO (Engenheiro Residente):**
   - **O que faz:** Mede e atualiza o progresso das etapas no modelo 3D BIM; aprova pranchas e documentos técnicos; registra medições de campo; responde a laudos de fiscalização.
   - **O que NÃO faz:** Não pode alterar permissões de outros usuários nem efetuar lançamentos financeiros diretos sem aprovação.

4. **ARQUITETO (Arquiteto / Projetista):**
   - **O que faz:** Realiza upload e versionamento de projetos arquitetônicos 2D/3D (DWG, IFC, PDF); solicita revisões técnicas; manipula visualmente os componentes espaciais da obra.
   - **O que NÃO faz:** Não pode dar baixa em estoque nem alterar tabelas de preços de vendas imobiliárias.

5. **MESTRE_OBRA (Mestre de Obras / Encarregado de Campo):**
   - **O que faz:** Preenche o Diário de Obra (RDO) por texto ou voz (Gemini IA); registra a presença da equipe de campo; lança ocorrências de não conformidade e laudos de segurança NR-18.
   - **O que NÃO faz:** Não pode alterar orçamentos globais da obra, aprovar contratos B2B ou cadastrar novas unidades imobiliárias.

6. **ALMOXARIFE (Almoxarife Chefe):**
   - **O que faz:** Dá entrada de materiais via chave de 44 dígitos da NFe SEFAZ; registra saídas de insumos por SKU para frentes de trabalho; monitora estoque mínimo.
   - **O que NÃO faz:** Não pode alterar projetos arquitetônicos, aprovar medições de engenharia nem modificar valores de vendas.

7. **FINANCEIRO (Analista Financeiro / Suprimentos):**
   - **O que faz:** Controla o orçamento orçado x realizado; acompanha pagamentos de compras B2B; analisa relatórios de conciliação fiscal e custos por metro quadrado.
   - **O que NÃO faz:** Não pode alterar o status físico de conclusão de etapas no canteiro nem editar modelos 3D.

8. **FORNECEDOR (Fornecedor de Materiais / Locador de Frotas B2B):**
   - **O que faz:** Recebe Solicitações de Cotação (RFQ); envia propostas de preços e prazos; cadastra disponibilidade de frotas e máquinas pesadas no marketplace.
   - **O que NÃO faz:** Não possui acesso aos dados internos da construtora, cronogramas de outras obras ou dados de clientes finais.

9. **CORRETOR (Imobiliária / Corretor de Imóveis):**
   - **O que faz:** Visualiza o espelho de vendas em tempo real; realiza reservas de unidades para clientes; efetua simulações de financiamento em até 360 meses.
   - **O que NÃO faz:** Não pode alterar o status de execução do canteiro de obras, movimentar estoque nem acessar documentos técnicos confidenciais de engenharia.

10. **INVESTIDOR (Investidor Imobiliário):**
    - **O que faz:** Acompanha o progresso global do empreendimento, curva S financeiro, índice de VGV vendido e cronograma macro de entregas.
    - **O que NÃO faz:** Não possui permissão para editar dados operacionais, cadastrar ocorrências ou alterar preços de unidades.

11. **CLIENTE (Cliente Comprador Final):**
    - **O que faz:** Acompanha exclusivamente o avanço físico e galeria de fotos da sua própria unidade/obra; consulta o Diário Transparente de Obra; abre chamados de garantia pós-obra (NBR 15575).
    - **O que NÃO faz:** Não visualiza dados de outras unidades, informações de custos internos da construtora ou dados de fornecedores B2B.

---

## 4. OBJETIVOS DO PROJETO

### 4.1 Objetivo Geral
Desenvolver e implementar uma plataforma corporativa web integrada baseada nos padrões de Clean Architecture e Domain-Driven Design (DDD) para centralizar a gestão, a execução e a comercialização de empreendimentos imobiliários e de infraestrutura, conectando todos os atores do ecossistema da construção civil em um ambiente Multi-Tenant unificado com sincronização assíncrona em tempo real.

---

### 4.2 Objetivos Específicos

Para alcançar o objetivo geral proposto, estabeleceram-se os seguintes objetivos específicos mensuráveis:

1. **Levantar e Mapear Requisitos:** Realizar o levantamento abrangente de requisitos funcionais e não funcionais junto aos 11 perfis operacionais do ecossistema da construção civil.
2. **Projetar Arquitetura Limpa em 4 Camadas:** Estruturar a arquitetura da aplicação desacoplada nas camadas de *Domain*, *Use Cases*, *Adapters/Presenters* e *Frameworks/UI*, garantindo testabilidade e independência de tecnologias externas.
3. **Implementar Barramento de Mensageria Assíncrona:** Construir barramento de eventos *PubSub* (*EventBus*) para disparo e consumo não-bloqueante de eventos de movimentação de estoque, atualizações de cronograma e alertas de canteiro.
4. **Desenvolver Módulo 3D/BIM Evolutivo e Extrusão 2D:** Implementar motor gráfico espacial baseado em WebGL/Three.js e IA CAD Parser para conversão e extrusão de plantas 2D em estruturas 3D interativas por obra.
5. **Construir Controle de Almoxarifado com Conciliação NFe:** Desenvolver módulo logístico com suporte à consulta automática de Notas Fiscais Eletrônicas (chave de 44 dígitos SEFAZ), controle por SKU e alertas de estoque mínimo.
6. **Integrar Marketplace B2B e Módulo de Frotas Pesadas:** Criar ambiente de cotações de materiais (RFQ) com comparativo de fornecedores e contratação de locação de máquinas pesadas.
7. **Implementar Assistente de Canteiro por Voz (Gemini IA):** Incorporar suporte a ditado por voz via Web Speech API e inteligência artificial para estruturação automática do Diário de Obra (RDO).
8. **Desenvolver Módulo de Fiscalização ISO 9001 e Laudos NR-18:** Criar sistema de registro de ocorrências técnicas com foto, severidade, responsável e laudos de segurança do trabalho.
9. **Construir Portal do Proprietário e Módulo de Vendas:** Disponibilizar canal transparente de acompanhamento para o cliente final e espelho de vendas com simulador financeiro de 360 meses.
10. **Implementar Central de Garantias Pós-Obra (NBR 15575):** Estruturar sistema de gestão de chamados de assistência técnica com SLA de 24 horas categorizado por subsistemas da edificação.
11. **Desenvolver Central de Privacidade e Governança LGPD:** Implementar funcionalidades de exportação de dados em JSON (Art. 18 LGPD) e processo de anonimização/esquecimento de dados pessoais.
12. **Validar a Solução por Testes Automatizados:** Garantir a qualidade do software por meio de testes unitários/integração no backend (JUnit 5 / Mockito) e testes E2E automatizados no frontend (Playwright).

---

## 5. ESCOPO DO PRODUTO E FUNCIONALIDADES PREVISTAS

### 5.1 Módulos e Capacidades do Sistema (Detalhamento dos Fluxos de Negócio)

O sistema Obra360 é composto por **12 módulos funcionais integrados**, cujos fluxos de trabalho são descritos a seguir:

#### 5.1.1 Módulo 1: Gestão Multi-Empresas (Multi-Tenant SaaS B2B/B2C) e Controle IAM/RBAC
- **Descrição:** Permite o cadastro e a alternância instantânea de organizações corporativas (Construtoras, Projetistas, Fornecedores, Imobiliárias) com validação formal de CNPJ.
- **Regra de Negócio:** Garantir o isolamento lógico absoluto dos dados entre empresas (*Tenant Isolation*). O usuário logado visualiza exclusivamente as informações vinculadas à organização ativa.

#### 5.1.2 Módulo 2: Gestão de Empreendimentos e Categorias de Obras
- **Descrição:** Cadastro completo de empreendimentos com suporte a múltiplas categorias (Casas, Condomínio Fechados, Prédios, Hospitais, Galpões, Túneis, Infraestrutura e Energia Solar).
- **Regra de Negócio:** Cada obra possui indicadores próprios de progresso físico, orçamento aprovado, valor gasto, VGV, prazo planejado e engenheiro/arquiteto responsável.

#### 5.1.3 Módulo 3: Modelagem 3D Evolutiva (BIM) e Extrusão de Plantas 2D (AI CAD Parser)
- **Descrição:** Visualizador gráfico 3D interativo baseado em Three.js/WebGL com ferramenta de extrusão de plantas 2D (presets ou arquivos CAD) para geração tridimensional de sapatas, pilares, vigas, paredes, lajes e telhados.
- **Regra de Negócio:** Cada obra possui seu modelo 3D isolado. Apenas perfis autorizados (Engenheiro, Arquiteto, Gerente, Admin) podem inserir, posicionar ou editar elementos estruturais. O sistema disponibiliza slider de linha do tempo (Semanas 1 a 8) para simulação evolutiva.

#### 5.1.4 Módulo 4: Central de Projetos e Gerenciamento Documental Versionado (IFC / DWG / PDF)
- **Descrição:** Repositório central de arquivos técnicos com controle rígido de versões (ex: `v1.0`, `v2.4`), status de aprovação (Em Elaboração, Aguardando Aprovação, Aprovado, Rejeitado) e suporte ao padrão aberto OpenBIM (IFC4).
- **Regra de Negócio:** A substituição de um documento gera histórico imutável contendo autor, data, tamanho e notas de revisão, impedindo o uso de pranchas obsoletas no canteiro.

#### 5.1.5 Módulo 5: Almoxarifado, Controle de Estoque por SKU e Conciliação NFe (44 dígitos)
- **Descrição:** Gestão operacional de insumos do canteiro de obras com suporte a consulta de chave de 44 dígitos da Nota Fiscal Eletrônica (NFe SEFAZ), movimentações de Entrada/Saída por SKU e alertas automáticos de estoque mínimo.
- **Regra de Negócio:** A baixa por chave NFe valida o dígito verificador de módulo 11 e preenche automaticamente o fornecedor, quantidade e preço unitário dos materiais.

#### 5.1.6 Módulo 6: Marketplace B2B (Cotações RFQ & Frotas Pesadas)
- **Descrição:** Módulo de negociação B2B para emissão de Solicitações de Cotação (RFQ) de insumos com quadro comparativo de fornecedores e contratação de locação de frotas/máquinas pesadas (escavadeiras, guindastes, caminhões).
- **Regra de Negócio:** O fornecedor responde diretamente no portal B2B, permitindo ao gestor escolher a proposta mais vantajosa por menor preço ou menor prazo de entrega.

#### 5.1.7 Módulo 7: Execução, Diário de Obra (RDO por Voz/Gemini IA) e Fiscalização ISO 9001 / NR-18
- **Descrição:** Registro do Diário de Obra (RDO) por texto ou ditado de voz via Web Speech API e inteligência artificial (Gemini IA) para extração de insumos aplicados. Cadastro de não-conformidades técnicas com foto, severidade (Alta, Média, Baixa) e laudos de segurança NR-18.
- **Regra de Negócio:** Ocorrências classificadas com severidade "Alta" disparam notificações de emergência via barramento de eventos para o Engenheiro Residente e Gerente.

#### 5.1.8 Módulo 8: Comercialização Imobiliária (Espelho de Vendas, Unidades & Simulador Financeiro)
- **Descrição:** Gestão do inventário de unidades imobiliárias com espelho de vendas interativo (Disponível, Reservado, Vendido), ficha detalhada da unidade e simulador de financiamento em até 360 meses.
- **Regra de Negócio:** A reserva de uma unidade por um corretor altera seu status no espelho de vendas em tempo real para toda a rede imobiliária conectada ao tenant.

#### 5.1.9 Módulo 9: Portal do Proprietário / Investidor e Diário Transparente de Obra
- **Descrição:** Interface simplificada e transparente para o comprador final ou investidor acompanhar a porcentagem de avanço físico da obra, cronograma de entregas e galeria de fotos atualizada do canteiro.
- **Regra de Negócio:** O cliente final visualiza apenas os dados públicos autorizados pela construtora, sem acesso a custos internos ou margens comerciais.

#### 5.1.10 Módulo 10: Gestão de Garantias Pós-Obra e Assistência Técnica (ABNT NBR 15575 / SLA 24h)
- **Descrição:** Central de atendimento de chamados de assistência técnica pós-entrega de chaves, com categorização por subsistemas da edificação (Estrutura, Hidráulica, Elétrica, Vedações) conforme a norma ABNT NBR 15575 e controle de SLA de 24 horas.
- **Regra de Negócio:** Chamados não atendidos no prazo de 24 horas são automaticamente escalados para a gerência de pós-vendas com alerta visual prioritário.

#### 5.1.11 Módulo 11: Chat Corporativo B2B e Central de Mensagens Instantâneas
- **Descrição:** Canal interno de comunicação segura via mensagens instantâneas entre engenheiros, almoxarifado, fornecedores, corretoras e equipe financeira.
- **Regra de Negócio:** As conversas são armazenadas com timestamp e vinculadas ao projeto correspondente, servindo como histórico de alinhamento operacional.

#### 5.1.12 Módulo 12: Trilha Imutável de Auditoria (Audit Trail / ISO 9001) e Governança LGPD (Art. 18)
- **Descrição:** Registro imutável de todas as ações sensíveis realizadas no sistema (quem alterou, o que alterou, quando e endereço IP). Central de privacidade com opção de exportação de dados em JSON (Portabilidade Art. 18 LGPD) e fluxo de solicitação de esquecimento/anonimização.
- **Regra de Negócio:** Logs de auditoria não podem ser alterados ou apagados por nenhum perfil de usuário, garantindo auditabilidade para certificações ISO 9001.

---

### 5.2 Entregáveis Tangíveis do Projeto

O projeto resultará nos seguintes entregáveis formais ao final do período de desenvolvimento:

1. **Código-Fonte Completo da Aplicação:** Repositório Git público/privado no GitHub contendo o código-fonte do Frontend (React 18 + TypeScript + Vite + Tailwind CSS), Backend (Java 21 + Spring Boot 3.2 + Spring Security) e scripts de migração de banco de dados (Flyway SQL).
2. **Documentação Arquitetural e de Requisitos:**
   - Documento de Definição de Escopo (DDE) consolidado;
   - Documentação de Requisitos Funcionais e Não Funcionais com Matriz de Rastreabilidade;
   - Registros de Decisão Arquitetural (ADRs - *Architecture Decision Records*);
   - Diagramas UML (Diagrama de Casos de Uso, Diagrama de Classes e Visão Geral da Arquitetura Hexagonal).
3. **Infraestrutura como Código (IaC) e Scripts DevOps:**
   - Scripts Terraform (`main.tf`, `variables.tf`, `outputs.tf`) para provisionamento de VPC, AWS EKS, Amazon RDS PostgreSQL e S3;
   - Pipeline de Integração e Entrega Contínua `Jenkinsfile` automatizado em 6 estágios.
4. **Base de Dados Estruturada:** Scripts SQL DDL de criação de tabelas e relacionamentos do PostgreSQL.
5. **Suíte de Testes Automatizados:** Suíte de testes unitários e de integração no backend (JUnit 5) e testes E2E no frontend (Playwright).
6. **Manuais do Usuário e Manuais Operacionais:**
   - Manual do Usuário detalhado por tela (`05_MANUAL_DO_USUARIO_TELAS.md`);
   - Guia de Integração Jenkins CI/CD (`06_INTEGRACAO_JENKINS_CICD.md`);
   - Guia de Sistema de Logs e Auditoria (`07_SISTEMA_DE_LOGS_E_AUDITORIA.md`).

---

## 6. REQUISITOS DO SISTEMA (RASTREABILIDADE)

### 6.1 Convenção de Identificação e Classificação de Prioridades
Os requisitos utilizam os prefixos **RF** (Requisito Funcional) e **RNF** (Requisito Não Funcional), acompanhados da classificação de prioridade conforme a convenção acadêmica:
- **Essencial:** Indispensável para a operação. O sistema não funciona sem ele.
- **Importante:** Agrega alto valor e qualidade operacional. Recomendado para a versão atual.
- **Desejável:** Funcionalidade complementar que pode ser estendida em versões futuras sem prejuízo do núcleo.

---

### 6.2 Requisitos Funcionais (RF-01 a RF-20)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                REQUISITOS FUNCIONAIS (RF)                                │
├───────┬──────────────────────────────────────────────┬──────────────┬────────────────────┤
│ ID    │ Descrição Detalhada                          │ Prioridade   │ Módulo Relacionado │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-01 │ Autenticação e Gestão de Usuários (IAM/RBAC):│ Essencial    │ Módulo 1           │
│       │ Permite login por e-mail/senha com suporte a │              │                    │
│       │ 11 perfis de acesso granulares (SoD).        │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-02 │ Gestão Multi-Tenant (Empresas):              │ Essencial    │ Módulo 1           │
│       │ Permite cadastrar e alternar organizações    │              │                    │
│       │ com validação de CNPJ e isolamento de dados. │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-03 │ Cadastro de Empreendimentos e Categorias:    │ Essencial    │ Módulo 2           │
│       │ Permite criar obras especificando categoria  │              │                    │
│       │ (Casas, Prédios, Hospitais, Infraestrutura). │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-04 │ Visualização 3D BIM Interativa:              │ Essencial    │ Módulo 3           │
│       │ Renderiza modelo espacial 3D em Three.js     │              │                    │
│       │ isolado por obra com inspeção de elementos.  │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-05 │ Edição Estrutural 3D (Construtor BIM):       │ Importante   │ Módulo 3           │
│       │ Permite que engenheiros/arquitetos insiram   │              │                    │
│       │ e posicionem pilares, vigas e paredes em 3D. │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-06 │ Extrusão de Plantas 2D (AI CAD Parser):      │ Importante   │ Módulo 3           │
│       │ Converte automaticamente plantas 2D em       │              │                    │
│       │ estruturas tridimensionais extrudadas.       │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-07 │ Linha do Tempo Evolutiva da Obra (Slider):   │ Importante   │ Módulo 3           │
│       │ Simula o avanço físico semanal (Semanas 1-8) │              │                    │
│       │ com atualização da geometria 3D.             │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-08 │ Repositório de Documentos Versionado:        │ Essencial    │ Módulo 4           │
│       │ Armazena pranchas e arquivos IFC/DWG/PDF     │              │                    │
│       │ com controle estrito de revisão e aprovação. │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-09 │ Conciliação de Estoque via NFe (44 dígitos): │ Essencial    │ Módulo 5           │
│       │ Consulta chave SEFAZ, valida dígito Mod11    │              │                    │
│       │ e dá entrada automática de produtos por SKU. │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-10 │ Controle de Movimentações de Estoque:        │ Essencial    │ Módulo 5           │
│       │ Registra saídas de insumos para frentes de   │              │                    │
│       │ trabalho e emite alertas de estoque mínimo.  │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-11 │ Marketplace B2B e Cotações (RFQ):            │ Importante   │ Módulo 6           │
│       │ Permite emitir cotações de insumos e analisar│              │                    │
│       │ propostas comparativas de fornecedores.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-12 │ Contratação de Frotas e Máquinas Pesadas:    │ Importante   │ Módulo 6           │
│       │ Módulo de reserva e locação de escavadeiras, │              │                    │
│       │ guindastes e caminhões por hora/dia.         │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-13 │ Diário de Obra (RDO) por Voz (Gemini IA):    │ Importante   │ Módulo 7           │
│       │ Permite ditar relatórios diários por áudio   │              │                    │
│       │ com extração automática de insumos via IA.   │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-14 │ Fiscalização ISO 9001 e Laudos NR-18:        │ Essencial    │ Módulo 7           │
│       │ Registra ocorrências técnicas com fotos,     │              │                    │
│       │ severidade (Alta/Média/Baixa) e responsáveis.│              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-15 │ Espelho de Vendas Imobiliárias em Tempo Real:│ Importante   │ Módulo 8           │
│       │ Exibe grid de unidades (Disponível, Reservado│              │                    │
│       │ e Vendido) para gestão da rede corretora.    │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-16 │ Simulador Financeiro de Financiamento:       │ Desejável    │ Módulo 8           │
│       │ Simula parcelas de financiamento imobiliário │              │                    │
│       │ em até 360 meses com tabelas SAC/PRICE.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-17 │ Portal do Proprietário / Diário Transparente:│ Essencial    │ Módulo 9           │
│       │ Disponibiliza progresso físico (%) e galeria │              │                    │
│       │ de fotos para acompanhamento do cliente.     │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-18 │ Garantia Pós-Obra e Chamados NBR 15575:      │ Importante   │ Módulo 10          │
│       │ Gestão de assistência técnica com SLA 24h    │              │                    │
│       │ categorizada por subsistema construtivo.     │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-19 │ Chat Corporativo B2B Instantâneo:            │ Desejável    │ Módulo 11          │
│       │ Central de mensagens entre engenharia,       │              │                    │
│       │ almoxarifado, fornecedores e corretores.     │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RF-20 │ Auditoria Imutável e Portabilidade LGPD:     │ Essencial    │ Módulo 12          │
│       │ Gera log imutável de ações e permite exportar│              │                    │
│       │ dados pessoais em JSON (Art. 18 LGPD).       │              │                    │
└───────┴──────────────────────────────────────────────┴──────────────┴────────────────────┘
```

---

### 6.3 Requisitos Não Funcionais (RNF-01 a RNF-10)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             REQUISITOS NÃO FUNCIONAIS (RNF)                              │
├───────┬──────────────────────────────────────────────┬──────────────┬────────────────────┤
│ ID    │ Descrição Detalhada                          │ Prioridade   │ Categoria          │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-01│ Desempenho de Renderização WebGL:            │ Essencial    │ Desempenho         │
│       │ O visualizador 3D deve manter taxa mínima de │              │                    │
│       │ 30 FPS na navegação de modelos até 10 mil    │              │                    │
│       │ polígonos em navegadores convencionais.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-02│ Tempo de Resposta da API REST:               │ Essencial    │ Desempenho         │
│       │ 95% das requisições REST da API backend devem│              │                    │
│       │ ser respondidas em menos de 500 milissegundos│              │                    │
│       │ em condições normais de carga.               │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-03│ Arquitetura Limpa em 4 Camadas:              │ Essencial    │ Arquitetura        │
│       │ O código Java deve respeitar estritamente o  │              │                    │
│       │ desacoplamento de Domain, Use Cases, Adapters│              │                    │
│       │ e Frameworks sem dependências circulares.    │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-04│ Segurança Spring Security 6 & Stateless JWT: │ Essencial    │ Segurança          │
│       │ Comunicação REST protegida contra CSRF com   │              │                    │
│       │ sessões Stateless baseadas em tokens JWT.    │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-05│ Conformidade com a LGPD (Lei 13.709/2018):   │ Essencial    │ Segurança/Legal    │
│       │ Mascaramento de PII (e-mail, CNPJ, telefone) │              │                    │
│       │ e suporte ao Direito de Portabilidade/Esque- │              │                    │
│       │ cimento (Art. 18).                           │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-06│ Responsividade Mobile-First (Tailwind CSS):  │ Essencial    │ Usabilidade        │
│       │ A interface web deve adaptar-se perfeitamente│              │                    │
│       │ a telas mobile (320px), tablets e desktops.  │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-07│ Suporte a Temas (Dark / Light Mode):         │ Importante   │ Usabilidade        │
│       │ Alternância instantânea e persistida em      │              │                    │
│       │ localStorage entre Modo Escuro e Claro.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-08│ Suporte Progressive Web App (PWA):           │ Importante   │ Portabilidade      │
│       │ Funcionamento como PWA instalável com cache  │              │                    │
│       │ offline para uso em canteiros de obras.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-09│ Disponibilidade e Resiliência (99,5% Uptime):│ Importante   │ Confiabilidade     │
│       │ A infraestrutura Cloud deve assegurar dispo- │              │                    │
│       │ nibilidade mínima de 99,5% do serviço.       │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-10│ Compatibilidade Multi-Navegador:             │ Essencial    │ Compatibilidade    │
│       │ Execução homologada no Google Chrome,        │              │                    │
│       │ Microsoft Edge, Mozilla Firefox e Safari.    │              │                    │
└───────┴──────────────────────────────────────────────┴──────────────┴────────────────────┘
```

---

## 7. PREMISSAS, RESTRIÇÕES E EXCLUSÕES DO ESCOPO

### 7.1 Premissas do Projeto
1. **Disponibilidade de Dispositivos e Navegadores Modernos:** Assume-se que os usuários de campo e escritório dispõem de dispositivos (computadores ou smartphones) com navegadores atualizados e suporte à aceleração gráfica WebGL.
2. **Adesão de Parceiros B2B:** Assume-se que fornecedores de insumos e empresas de locação de máquinas aceitarão cadastrar-se na plataforma para responder cotações (RFQ).
3. **Conectividade Intermitente no Canteiro:** Assume-se que dados inseridos offline no PWA serão mantidos em cache seguro e sincronizados assincronamente ao restabelecer a conexão com a internet.

---

### 7.2 Restrições do Projeto
1. **Prazo Rígido de Entrega Acadêmica:** O sistema deve ser finalizado, testado e apresentado dentro do limite de tempo estabelecido no calendário acadêmico do semestre.
2. **Arquitetura Obrigatória:** O backend deve ser desenvolvido estritamente em Java 21 com Spring Boot 3.2 seguindo Clean Architecture e DDD.
3. **Restrição Orçamentária:** O projeto utilizará exclusivamente ferramentas de código aberto (Open Source) e planos gratuitos de infraestrutura cloud, sem custos de licenciamento comercial proprietário.

---

### 7.3 Exclusões Deliberadas do Escopo (Fronteiras do Projeto)
Para evitar a expansão descontrolada de escopo (*Scope Creep*) durante o semestre, estabeleceram-se as seguintes exclusões formais:

1. **Processamento Real de Gateways de Pagamento:** Não haverá integração com adquirentes financeiras (Stripe, Mercado Pago) ou emissão automática de boletos bancários reais; as vendas imobiliárias funcionam como simulador e reserva comercial.
2. **Parsing Nativo de Arquivos Proprietários do Revit (.RVT):** O sistema não processará arquivos proprietários fechados `.rvt` sem conversão prévia; a modelagem 3D opera exclusivamente com o padrão aberto OpenBIM `.ifc`, pranchas `.dwg` e `.pdf`.
3. **Desenvolvimento de Aplicativos Nativos para Lojas (iOS/Android):** Não serão desenvolvidos apps em Swift ou Kotlin para publicação na App Store ou Google Play Store; a mobilidade é atendida via Progressive Web App (PWA).
4. **Assinatura Digital com Certificado ICP-Brasil (A1/A3):** A aprovação de projetos utiliza carimbo digital interno com auditoria imutável por e-mail, IP e timestamp, sem integração com cartórios virtuais externos.
5. **Fornecimento e Instalação de Hardware IoT no Canteiro:** O escopo limita-se ao software, excluindo o fornecimento de sensores físicos de concreto ou tags RFID.
6. **Renderização de Nuvens de Pontos (Point Cloud):** O motor gráfico 3D não processará arquivos de escaneamento a laser com milhões de pontos; a visualização foca em malhas poligonais procedimentos BIM.
7. **Suporte Multilíngue e Internacionalização (i18n):** A plataforma será disponibilizada e suportada exclusivamente no idioma Português do Brasil (pt-BR).

---

## 8. CRITÉRIOS DE ACEITAÇÃO DO PROJETO

O projeto será considerado aceito e concluído com sucesso mediante o cumprimento comprovado das seguintes condições objetivas e testáveis:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                CRITÉRIOS DE ACEITAÇÃO                                    │
├──────────────────────────┬───────────────────────────────────────────────────────────────┤
│ Critério                 │ Condição Objetiva de Verificação                              │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 1. Compilação Limpa      │ O backend Java deve compilar via 'mvn test' com BUILD SUCCESS │
│                          │ e 0 falhas nos 11 testes unitários/integração.                │
│ 2. Build Frontend Limpo  │ O frontend React deve compilar via 'npm run build' com 0 erros│
│                          │ de TypeScript ou bundling Vite.                               │
│ 3. Ausência de Erros Console| A navegação por todas as 13 telas do sistema não deve emitir│
│                          │ exceções não tratadas no console do navegador (0 Unhandled).  │
│ 4. Isolamento Multi-Tenant| 100% dos dados exibidos devem corresponder estritamente à     │
│                          │ empresa (CNPJ) selecionada no cabeçalho corporativo.          │
│ 5. Fidelidade RBAC/IAM   │ A alternância entre os 11 perfis deve ocultar ou exibir as    │
│                          │ abas e ações permitidas com 100% de precisão funcional.       │
│ 6. Desempenho 3D WebGL   │ O modelo 3D deve renderizar com taxa >= 30 FPS e responder    │
│                          │ ao clique para inspeção de atributos e movimentação X,Y,Z.    │
│ 7. Conciliação NFe SEFAZ │ A digitação da chave de 44 dígitos deve validar o módulo 11 e │
│                          │ preencher automaticamente o fornecedor e itens de estoque.    │
│ 8. Portabilidade LGPD    │ O botão 'Exportar Dados' na aba LGPD deve baixar o arquivo    │
│                          │ JSON estruturado contendo o histórico do titular.             │
│ 9. Testes E2E Playwright │ A suíte de testes E2E em Playwright deve executar o fluxo     │
│                          │ completo de login, navegação e 3D em Chromium e Mobile.       │
│ 10. Documentação GitHub  │ Repositório GitHub contendo código-fonte atualizado, README   │
│                          │ com instruções de execução e pasta /docs documentada.         │
└──────────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

## 9. GERENCIAMENTO DE RISCOS INICIAIS E PLANO DE MITIGAÇÃO

Identificaram-se os principais riscos que poderiam impactar a execução do projeto, acompanhados das respectivas estratégias de prevenção e mitigação:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MATRIZ DE RISCOS DO PROJETO                              │
├───────┬───────────────────────────────┬─────────────┬───────────┬────────────────────────┤
│ ID    │ Descrição do Risco            │ Probabilidade│ Impacto   │ Plano de Mitigação     │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-01  │ Expansão excessiva de escopo  │ Média       │ Alto      │ Adotar estritamente as │
│       │ (Scope Creep) durante o semestre│           │           │ exclusões do item 7.3. │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-02  │ Dificuldade na curva de aprendi-│ Média     │ Médio     │ Utilizar abstrações    │
│       │ zado do Three.js e WebGL 3D   │             │           │ procedurais simples.   │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-03  │ Indisponibilidade de serviços │ Baixa       │ Médio     │ Implementar fallbacks  │
│       │ externos (SEFAZ / AWS S3)     │             │           │ locais em dados mock.  │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-04  │ Incompatibilidade de layout   │ Média       │ Médio     │ Aplicar Design System  │
│       │ em telas mobile pequenas      │             │           │ Tailwind Mobile-First. │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-05  │ Atraso na entrega dos relatórios│ Baixa     │ Alto      │ Manter versionamento  │
│       │ e documentações técnicas      │             │           │ contínuo em Markdown.  │
└───────┴───────────────────────────────┴─────────────┴───────────┴────────────────────────┘
```

---

**Arcoverde/PE, 17 de Setembro de 2026.**

________________________________________  
**João Pedro**  
*Desenvolvedor / Aluno*

________________________________________  
**Marcos Henrique**  
*Desenvolvedor / Aluno*

________________________________________  
**Prof. Dennys Carvalho**  
*Professor Orientador*
