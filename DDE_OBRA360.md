# DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE)

**Nome do Projeto:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário  
**Instituição de Ensino:** AESA-CESA (2026) — Projeto Interdisciplinar de Engenharia de Software  
**Autores (Desenvolvedores):** João Pedro e Marcos Henrique  
**Professor Orientador:** Prof. Dennys Carvalho  
**Versão:** 2.2 (Versão Corporativa e Acadêmica Expandida — Detalhamento Exaustivo dos Módulos, Requisitos, Regras de Negócio e Permissões)  
**Data de Emissão:** 17/09/2026  

---

## 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO DO PROBLEMA

### 1.1 Introdução
O setor da construção civil e do mercado imobiliário representa uma das engrenagens mais vitais da economia mundial e nacional, impactando diretamente o Produto Interno Bruto (PIB), a geração de empregos formais e informais, a arrecadação tributária e o desenvolvimento da infraestrutura urbana e social. Segundo dados consolidados da consultoria internacional McKinsey & Company e da Câmara Brasileira da Indústria da Construção (CBIC), a cadeia global da construção movimenta anualmente mais de 12 trilhões de dólares, sendo responsável pela estruturação do ambiente construído das cidades modernas.

Entretanto, historicamente, a indústria da construção caracteriza-se por uma forte fragmentação operacional, baixa taxa de digitalização de processos de campo e desarticulação crônica na comunicação entre os múltiplos agentes que integram sua vasta cadeia de valor. Em um único empreendimento, convergem rotineiramente incorporadoras imobiliárias, construtoras principais, empresas subcontratadas especializadas, escritórios de arquitetura e calculistas estruturais, fornecedores de insumos básicos e acabamentos, prestadores de serviços de locação de frotas pesadas, corretoras de imóveis, instituições financeiras concedentes de crédito, órgãos de fiscalização pública, investidores e compradores finais (proprietários).

O **Obra360** surge como uma resposta tecnológica abrangente, moderna e cientificamente amparada a essa problemática. Concebido como uma **Plataforma Corporativa Web e Ecossistema Digital Integrado (SaaS Multi-Tenant B2B/B2C)**, a solução tem por finalidade centralizar, automatizar, desburocratizar e conferir rastreabilidade auditável total a todas as fases do ciclo de vida de um empreendimento imobiliário ou de infraestrutura urbana. A plataforma abrange desde a concepção inicial da oportunidade e estudo de viabilidade técnica e financeira do terreno, passando pelo planejamento físico-financeiro detalhado, modelagem espacial 2D/3D BIM (Building Information Modeling), cotações B2B automatizadas por integração com Nota Fiscal Eletrônica (NFe SEFAZ), diário de obra inteligente com auxílio de Inteligência Artificial Generativa, fiscalização rigorosa de segurança do trabalho (NR-18) e qualidade (ISO 9001), até a comercialização de unidades, entrega formal das chaves e gestão contínua de garantias pós-obra (ABNT NBR 15575).

---

### 1.2 A "Dor" Central e a Problematização no Canteiro de Obras
A execução de obras civis de qualquer porte — desde residências unifamiliares até grandes complexos prediais ou obras de infraestrutura pesada — envolve a convergência de dezenas de organizações terceirizadas, centenas de insumos heterogêneos e múltiplos perfis profissionais atuando simultaneamente sob prazos rígidos, orçamentos elevados e margens de lucro cada vez mais estreitas. No cenário tradicional brasileiro e internacional, as informações estratégicas e operacionais encontram-se pulverizadas em canais informais de mensagens instantâneas (sem registro formal), planilhas eletrônicas locais descentralizadas (sujeitas a erros manuais e corrupção de dados), pranchas de projeto impressas desatualizadas no canteiro e sistemas legados isolados que não se comunicam.

Essa profunda assimetria de informações gera desdobramentos altamente críticos para a gestão corporativa e financeira do empreendimento:

1. **Descontrole Financeiro e Logístico de Materiais:** A ausência de sincronização em tempo real entre a frente de trabalho no canteiro de obras e o almoxarifado impede a apuração exata do consumo de insumos por metro quadrado ($m^2$) executado. Esse cenário culmina em compras duplicadas, faltas de insumos críticos que paralisam a mão de obra, desvio indevido de materiais e estouro recorrente do orçamento base planejado.
2. **Uso de Versões Obsoletas de Projetos Executivos:** A falta de versionamento centralizado e homologado de arquivos arquitetônicos, estruturais e de instalações hidráulicas/elétricas conduz a erros graves de execução no canteiro de obras. É frequente a identificação de interferências espaciais apenas no momento da montagem no canteiro, demandando demolições não planejadas, atrasos severos e retrabalhos extremamente dispendiosos.
3. **Falhas na Comunicação e Opacidade com o Cliente Final:** O comprador de uma unidade imobiliária em construção ou o investidor do empreendimento permanece privado de informações claras, didáticas e confiáveis sobre o avanço físico real da edificação. A falta de transparência gera desconfiança, volume excessivo de chamados repetitivos nas centrais de atendimento de pós-venda e insegurança jurídica na relação de consumo.
4. **Ausência de Rastreabilidade e Não Conformidades Regulatórias:** O descumprimento não detectado de normas técnicas obrigatórias de segurança do trabalho (NR-18) e critérios de qualidade habitacional (ISO 9001 e ABNT NBR 15575) decorre da falta de processos padronizados de fiscalização de campo e do registro imutável de ocorrências técnicas. Isso expõe a construtora a multas dos órgãos fiscalizadores, interdições de canteiro e futuros litígios judiciais indenizatórios por vícios oculta na construção.

---

### 1.3 A Solução Proposta: Obra360 (Plataforma Integrada B2B/B2C)
O **Obra360** foi projetado para atuar como o **núcleo operacional e estratégico** de empreendimentos de variadas tipologias construtivas — incluindo casas residenciais unifamiliares, condomínios horizontais fechados, edifícios e prédios residenciais/comerciais de múltiplos pavimentos, complexos hospitalares, galpões logísticos industriais, usinas de geração de energia fotovoltaica, túneis, pontes e obras de infraestrutura urbana.

A plataforma unifica em um único ambiente web responsivo e acessível por dispositivos móveis os fluxos de trabalho B2B (negociações entre construtoras, fornecedores de materiais, prestadores de serviços e locadoras de frotas pesadas) e B2C (relacionamento entre construtoras, imobiliárias, corretores, investidores e proprietários finais). 

Amparado por uma arquitetura limpa desacoplada em 4 camadas (*Clean Architecture*) e orientada ao domínio do negócio (*Domain-Driven Design - DDD / Event-Driven PubSub*), o sistema garante que cada alteração realizada em uma prancha de projeto, movimentação de entrada/saída de estoque ou registro de diário de obra seja propagada de forma imediata, assíncrona e transparente para todos os perfis autorizados da organização.

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
Este Documento de Definição de Escopo (DDE v2.2) estabelece os limites formais, técnicos, operacionais e funcionais do projeto Obra360. Nas seções subsequentes, apresentam-se:
- A fundamentação mercadológica amparada em dados e estatísticas oficiais do setor (McKinsey, CBIC, IBGE, FGV, ABNT);
- O mapeamento detalhado de stakeholders e a matriz de governança/permissões de acesso (RBAC/IAM) com segregação de funções (SoD);
- A declaração formal do objetivo geral e dos objetivos específicos da aplicação;
- A discriminação exaustiva e minuciosa dos **12 Módulos Funcionais**, detalhando individualmente a **Descrição e Fluxo Operacional**, as **Regras de Negócio (RN-01 a RN-34)** e os **Requisitos Funcionais (RF-01 a RF-20)** com a indicação precisa das prioridades e perfis autorizados;
- A especificação dos Requisitos Não Funcionais (RNF-01 a RNF-10);
- As premissas, restrições e exclusões deliberadas de escopo;
- Os critérios objetivos de aceitação do software e a matriz de gerenciamento de riscos com planos de mitigação.

---

## 2. JUSTIFICATIVA E FUNDAMENTAÇÃO TEÓRICA / MERCADOLÓGICA

### 2.1 Cenário do Setor da Construção Civil no Brasil e no Mundo
A construção civil assume papel de destaque absoluto no desenvolvimento socioeconômico global, sendo responsável por aproximadamente 13% do Produto Interno Bruto (PIB) mundial, conforme relatórios da consultoria internacional McKinsey & Company. No cenário nacional, segundo dados do Instituto Brasileiro de Geografia e Estatística (IBGE, 2023) e da Câmara Brasileira da Indústria da Construção (CBIC, 2023), o setor responde por mais de 6% do PIB brasileiro e emprega diretamente mais de 2,7 milhões de trabalhadores formais, além de movimentar uma extensa cadeia produtiva composta por mais de 60 setores industriais e de serviços derivados.

A despeito da sua gigantesca magnitude econômica, o setor da construção civil permanece classificado, de acordo com o *McKinsey Global Institute Digitization Index*, como o **segundo setor menos digitalizado do planeta**, situando-se apenas acima da agricultura e da caça. Essa estagnação tecnológica histórica reflete-se diretamente em baixos índices de evolução da produtividade do trabalho e elevados níveis de ineficiência operacional no canteiro de obras.

---

### 2.2 Evidências Empíricas e Dados Estatísticos do Setor

Para fundamentar rigorosamente a necessidade impreterível da plataforma Obra360, compilaram-se dados empíricos e estatísticas provenientes de órgãos governamentais, institutos de pesquisa econômica e associações profissionais de renome no setor:

1. **Baixo Crescimento da Produtividade Global (McKinsey & Company, 2020/2023):**  
   Estudos longitudinais da McKinsey demonstram que a produtividade na construção civil mundial cresceu a uma taxa média de apenas **1% ao ano nas últimas duas décadas**, enquanto a manufatura global avançou 2,8% ao ano no mesmo período. O estudo aponta que a adoção de plataformas digitais integradas e metodologias BIM possui o potencial de **elevar a produtividade do setor entre 14% e 15%** e reduzir os custos totais do projeto em até 6%.

2. **Perdas por Desperdício e Retrabalho (CBIC, 2023 / Escola Politécnica da USP):**  
   Segundo levantamentos formais da CBIC e pesquisas do Departamento de Engenharia de Construção Civil da USP, estima-se que **entre 5% e 8% do custo total de uma obra no Brasil é perdido devido a retrabalhos**, erros de interpretação de projetos e descontrole no recebimento e armazenamento de materiais no canteiro. Além disso, a perda física de materiais básicos (cimento, aço, areia, blocos cerâmicos) chega a atingir **15% a 20% do volume total adquirido**.

3. **Impacto dos Prazos e Custos no Orçamento (FGV-IBRE / INCC, 2024):**  
   Dados do Instituto Brasileiro de Economia da Fundação Getulio Vargas (FGV-IBRE) apontam que mais de **72% das grandes obras residenciais e comerciais no Brasil sofrem atrasos superiores a 90 dias** em relação ao cronograma inicial planejado. A principal causa relatada pelos gestores é a falha no fluxo de suprimentos, desarticulação na negociação B2B com fornecedores e falta de visibilidade em tempo real do avanço físico das etapas.

4. **Exigência de Qualidade e Garantias (ABNT NBR 15575 / CBIC, 2023):**  
   Com a consolidação e obrigatoriedade da Norma de Desempenho de Edificações Habitacionais (ABNT NBR 15575), construtoras e incorporadoras passaram a responder juridicamente pela vida útil e desempenho de subsistemas (estrutura, vedações, instalações hidráulicas e elétricas). A falta de um histórico auditável de fiscalização técnica e gestão de chamados pós-obra gera um volume significativo de litígios judiciais e custos não previstos de assistência técnica.

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

A partir dessas evidências empíricas, justifica-se plenamente a concepção do Obra360. A plataforma elimina a opacidade e a fragmentação ao integrar, em tempo real, a cadeia de suprimentos, o planejamento de engenharia, a fiscalização de campo e o relacionamento com clientes e investidores.

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
- **Instituição de Ensino:** Faculdade AESA-CESA (Arcoverde/PE) — Projeto Interdisciplinar de Engenharia de Software (2026)
- **Equipe de Desenvolvimento (Autores):** João Pedro e Marcos Henrique
- **Professor Orientador:** Prof. Dennys Carvalho
- **Público-Alvo / Clientes-Alvo:** Construtoras, incorporadoras, escritórios de engenharia e arquitetura, fornecedores de insumos da construção, empresas de locação de frotas e máquinas pesadas, imobiliárias, corretores autônomos, investidores imobiliários e clientes compradores finais.
- **Tipologias de Empreendimentos Suportadas:** Casas residenciais unifamiliares, condomínios horizontais fechados, edifícios e prédios residenciais/comerciais de múltiplos pavimentos, complexos hospitalares, galpões logísticos industriais, projetos de energia fotovoltaica, túneis, obras rodoviárias e de infraestrutura urbana.

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

Para cumprir as diretrizes de controle interno, governança corporativa e segregação de funções (Segregation of Duties - SoD), o Obra360 estabelece **11 perfis de acesso granulares (Role-Based Access Control - RBAC / IAM)**:

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

#### Detalhamento Exaustivo das Capacidades e Restrições por Perfil:

1. **SUPER_ADMIN (Administrador Geral / Soberano):**
   - **O que faz:** Possui acesso global irrestrito a todas as funcionalidades do sistema; cadastra organizações (Tenants), gerencia contas de usuários, altera perfis IAM, visualiza logs imutáveis de auditoria e parametriza o sistema.
   - **O que NÃO faz:** Não realiza operações simuladas de cliente final sem registrar rastreabilidade imutável de log.

2. **GERENTE_OBRA (Gerente de Empreendimento):**
   - **O que faz:** Cria e edita dados de empreendimentos; aprova cronogramas físico-financeiros; visualiza relatórios de viabilidade e VGV; aprova grandes compras do almoxarifado.
   - **O que NÃO faz:** Não pode alterar logs imutáveis de auditoria nem excluir registros de notas fiscais já processadas no banco de dados.

3. **ENGENHEIRO (Engenheiro Residente):**
   - **O que faz:** Mede e atualiza o progresso das etapas no modelo 3D BIM; aprova pranchas e documentos técnicos; registra medições de campo; responde a laudos de fiscalização técnica.
   - **O que NÃO faz:** Não pode alterar permissões de outros usuários nem efetuar lançamentos financeiros diretos sem aprovação superior.

4. **ARQUITETO (Arquiteto / Projetista):**
   - **O que faz:** Realiza upload e versionamento de projetos arquitetônicos 2D/3D (DWG, IFC, PDF); solicita revisões técnicas; manipula visualmente os componentes espaciais da obra.
   - **O que NÃO faz:** Não pode dar baixa em estoque de almoxarifado nem alterar tabelas de preços de vendas imobiliárias.

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
1. **Levantar e Mapear Requisitos:** Realizar o levantamento abrangente de requisitos funcionais e não funcionais junto aos 11 perfis operacionais.
2. **Projetar Arquitetura Limpa em 4 Camadas:** Estruturar a aplicação nas camadas de *Domain*, *Use Cases*, *Adapters/Presenters* e *Frameworks/UI*.
3. **Implementar Barramento de Mensageria Assíncrona:** Construir barramento de eventos *PubSub* (*EventBus*) para notificações em tempo real.
4. **Desenvolver Módulo 3D/BIM Evolutivo e Extrusão 2D:** Implementar motor gráfico espacial baseado em WebGL/Three.js e IA CAD Parser.
5. **Construir Controle de Almoxarifado com Conciliação NFe:** Desenvolver módulo logístico com suporte à consulta automática de NFe (44 dígitos SEFAZ) e controle por SKU.
6. **Integrar Marketplace B2B e Módulo de Frotas Pesadas:** Criar ambiente de cotações de materiais (RFQ) e locação de máquinas pesadas.
7. **Implementar Assistente de Canteiro por Voz (Gemini IA):** Incorporar suporte a ditado por voz e inteligência artificial para o Diário de Obra (RDO).
8. **Desenvolver Módulo de Fiscalização ISO 9001 e NR-18:** Criar sistema de registro de não-conformidades técnicas e laudos de segurança.
9. **Construir Portal do Proprietário e Módulo de Vendas:** Disponibilizar canal transparente de acompanhamento para o cliente final e espelho de vendas com simulador financeiro.
10. **Implementar Central de Garantias Pós-Obra (NBR 15575):** Estruturar sistema de gestão de chamados de assistência técnica com SLA de 24 horas.
11. **Desenvolver Central de Privacidade e Governança LGPD:** Implementar funcionalidades de exportação em JSON (Art. 18 LGPD) e esquecimento de dados.
12. **Validar a Solução por Testes Automatizados:** Garantir a qualidade do software via testes unitários/integração (JUnit 5) e E2E (Playwright).

---

## 5. DETALHAMENTO EXAUSTIVO DO ESCOPO POR MÓDULOS DO PROJETO

Nesta seção, o escopo do Obra360 é fatiado e detalhado individualmente por módulo funcional (**Módulos 1 a 12**). Cada módulo especifica seu fluxo operacional completo, **Regras de Negócio (RN-01 a RN-34)**, **Requisitos Funcionais (RF-01 a RF-20)**, prioridade e os **Perfis Autorizados (RBAC/IAM)**.

---

### 5.1 Módulo 1: Gestão Multi-Empresas (Multi-Tenant SaaS B2B/B2C) e Controle IAM/RBAC

#### 5.1.1 Descrição e Fluxo Operacional Detalhado
Este módulo é a espinha dorsal de governança corporativa da plataforma. Ele permite o cadastro completo de organizações empresariais (Construtoras, Incorporadoras, Escritórios de Arquitetura, Fornecedores B2B, Locadoras de Frotas e Imobiliárias) com suporte a domínios personalizados e gerenciamento de filiais. O sistema realiza o controle de autenticação de usuários via tokens stateless JWT com suporte a autenticação de dois fatores (MFA). Ao efetuar login, o usuário visualiza apenas a organização à qual pertence, podendo realizar o comutamento (*tenant switching*) instantâneo caso possua vínculo homologado com múltiplas empresas. Todas as queries de banco de dados injetam automaticamente a chave `tenant_id` no contexto da sessão, garantindo isolamento lógico absoluto dos dados.

#### 5.1.2 Regras de Negócio (RN) do Módulo 1
- **RN-01 (Isolamento Lógico Absoluto de Tenant):** Nenhuma instrução SQL/ORM ou relatório pode cruzar ou expor dados entre empresas (Tenants) distintas no banco de dados sem permissão explícita e auditada de plataforma (`SUPER_ADMIN`).
- **RN-02 (Validação e Verificação Algorítmica de Registro):** O cadastro de empresas exige a verificação dos 14 dígitos do CNPJ com validação de módulo 11, e usuários individuais exigem validação dos 11 dígitos do CPF.
- **RN-03 (Segregação de Funções - SoD):** Um mesmo usuário não pode acumular papéis operacionais conflitantes no mesmo tenant (ex: aprovação de requisições no Almoxarife e liberação de pagamento no Financeiro).

#### 5.1.3 Requisitos Funcionais (RF) do Módulo 1
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-01** | Autenticação e Gestão IAM/RBAC | Autenticação segura por e-mail e senha hash (Bcrypt), emissão de tokens JWT Stateless, suporte a MFA e controle granular dos 11 perfis SoD. | Essencial | **Todos os Perfis** (login) / `SUPER_ADMIN` (gestão) |
| **RF-02** | Gestão Multi-Tenant (Empresas) | Cadastro, parametrização, upload de logotipo e alternância fluida entre organizações corporativas com isolamento de banco de dados por Tenant ID. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA` |

---

### 5.2 Módulo 2: Gestão de Empreendimentos e Categorias de Obras

#### 5.2.1 Descrição e Fluxo Operacional Detalhado
Responsável pela estruturação do inventário de obras e projetos imobiliários do tenant. Permite cadastrar e gerenciar obras em 8 categorias construtivas distintas (Casas, Condomínio Fechados, Edifícios Residenciais/Comerciais, Hospitais, Galpões Logísticos, Obras de Infraestrutura, Túneis e Energia Solar Fotovoltaica). O fluxo exige a definição do centro de custos, área construída total ($m^2$), endereço geolocalizado, indicação de responsabilidade técnica (ART do CREA ou RRT do CAU), prazo inicial/final e orçamento global aprovado.

#### 5.2.2 Regras de Negócio (RN) do Módulo 2
- **RN-04 (Autonomia de Indicadores por Empreendimento):** Cada empreendimento possui seu próprio centro de custo isolado, índice VGV, orçamento aprovado, curva S físico-financeira e equipe técnica vinculada.
- **RN-05 (Vínculo de Responsabilidade Técnica ART/RRT):** Toda obra cadastrada deve possuir obrigatoriamente pelo menos um Engenheiro Residente ou Arquiteto responsável registrado com número de conselho de classe válido.
- **RN-06 (Definição de Tipologia e Parâmetros Específicos):** Tipologias industriais ou de infraestrutura habilitam parâmetros adicionais (ex: potência em MWp para usinas solares, extensão em quilômetros para túneis/rodovias).

#### 5.2.3 Requisitos Funcionais (RF) do Módulo 2
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-03** | Cadastro de Empreendimentos e Categorias | Permite criar, editar, parametrizar e consultar obras especificando localização, área total, categoria construtiva, prazos e orçamento macro. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO` |

---

### 5.3 Módulo 3: Modelagem 3D Evolutiva (BIM) e Extrusão de Plantas 2D (AI CAD Parser)

#### 5.3.1 Descrição e Fluxo Operacional Detalhado
Motor gráfico tridimensional de alta performance executado diretamente no navegador web via WebGL e Three.js. Permite a importação de plantas baixas 2D (DXF, DWG, PDF, SVG ou imagens) e a utilização de ferramentas procedurais de extrusão automatizada (AI CAD Parser) para elevação instantânea de paredes com pés-direitos configuráveis. Na aba de edição espacial (Construtor BIM), engenheiros e arquitetos posicionam e encaixam elementos estruturais procedurais (sapatas, pilares, vigas, paredes, lajes, telhados, portas e janelas). O sistema oferece um slider de linha do tempo evolutiva que simula o avanço físico da obra ao longo de 8 semanas, alterando a coloração dos objetos 3D conforme o status de execução (Cinza = Planejado; Amarelo = Em Execução; Azul/Verde = Concluído).

#### 5.3.2 Regras de Negócio (RN) do Módulo 3
- **RN-07 (Isolamento do Modelo Tridimensional por Obra):** O modelo 3D é estritamente associado ao ID da obra, não sendo permitida a importação de elementos entre empreendimentos distintos.
- **RN-08 (Privilégio de Autoria e Modificação Espacial):** Apenas perfis técnicos credenciados (`ENGENHEIRO`, `ARQUITETO`, `GERENTE_OBRA`, `SUPER_ADMIN`) possuem permissão para adicionar, posicionar, encaixar ou excluir elementos 3D no modelo.
- **RN-09 (Cálculo Dinâmico da Linha do Tempo Evolutiva):** Ao deslizar a linha do tempo (Semanas 1 a 8), o sistema consulta a data de conclusão de cada elemento e atualiza volumetricamente sua cor e transparência no canvas WebGL.

#### 5.3.3 Requisitos Funcionais (RF) do Módulo 3
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-04** | Visualização 3D BIM Interativa | Renderiza modelo espacial 3D em Three.js/WebGL com navegação fluida (órbita, pan, zoom, corte) e inspeção de propriedades de elementos. | Essencial | **Todos os Perfis** (visibilidade conforme regra de domínio) |
| **RF-05** | Edição Estrutural 3D (Construtor BIM) | Permite que engenheiros e arquitetos insiram e encaixem sapatas, pilares, vigas, paredes, lajes, telhados e esquadrias no espaço 3D. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-06** | Extrusão de Plantas 2D (AI CAD Parser) | Converte proceduralmente plantas baixas 2D em estruturas tridimensionais extrudadas com pés-direitos configuráveis. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-07** | Linha do Tempo Evolutiva (Slider) | Simula visualmente o avanço físico semanal da obra (Semanas 1 a 8) com atualização dinâmica da geometria 3D. | Importante | **Todos os Perfis** |

---

### 5.4 Módulo 4: Central de Projetos e Gerenciamento Documental Versionado (IFC / DWG / PDF)

#### 5.4.1 Descrição e Fluxo Operacional Detalhado
Repositório documental corporativo (EDMS - Enterprise Document Management System) projetado para gerenciar o ciclo de vida de arquivos técnicos de engenharia e arquitetura. Oferece suporte nativo ao padrão OpenBIM (IFC4), pranchas CAD (DWG) e memoriais descritivos/desenhos executivos em PDF. O fluxo permite realizar upload com versionamento automático (`v1.0`, `v1.1`, `v2.0`), registrar notas de revisão, solicitar compatibilização de disciplinas e submeter documentos à aprovação formal.

#### 5.4.2 Regras de Negócio (RN) do Módulo 4
- **RN-10 (Imutabilidade do Histórico de Revisões):** O upload de uma nova versão de projeto cria um registro histórico imutável mantendo as versões anteriores acessíveis para fins de auditoria técnica.
- **RN-11 (Bloqueio de Download de Documentos Obsoletos no Canteiro):** Pranchas marcadas com status "Em Revisão", "Rejeitado" ou "Obsoleto" são bloqueadas no aplicativo de canteiro, impedindo a execução com projetos desatualizados.
- **RN-12 (Trilha de Aprovação Técnica):** Projetos executivos exigem carimbo de aprovação digital do Engenheiro Residente antes de serem liberados para a equipe de campo.

#### 5.4.3 Requisitos Funcionais (RF) do Módulo 4
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-08** | Repositório Documental Versionado | Armazena pranchas e arquivos IFC/DWG/PDF com controle de revisão, histórico de aprovação e fluxo de assinatura técnica. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |

---

### 5.5 Módulo 5: Almoxarifado, Controle de Estoque por SKU e Conciliação NFe (44 dígitos)

#### 5.5.1 Descrição e Fluxo Operacional Detalhado
Módulo responsável pela gestão logística e financeira do almoxarifado do canteiro de obras. Permite a recepção de materiais por Nota Fiscal Eletrônica (NFe SEFAZ) mediante a digitação ou leitura óptica da chave de 44 dígitos. O sistema valida algorítmicamente o módulo 11 do dígito verificador e realiza o desmembramento automático dos itens da nota fiscal por código SKU, quantidade e preço unitário. O módulo controla as saídas de estoque para as frentes de trabalho vinculando o insumo ao responsável e à etapa da obra, emitindo alertas visuais imediatos quando o saldo atinge o ponto de pedido/estoque mínimo.

#### 5.5.2 Regras de Negócio (RN) do Módulo 5
- **RN-13 (Validação da Chave de NFe SEFAZ Módulo 11):** O sistema rejeita o processamento de chaves de acesso com tamanho diferente de 44 dígitos ou com dígito verificador inválido no cálculo do módulo 11.
- **RN-14 (Rastreabilidade de Saída por Frente de Trabalho):** Toda saída de material do almoxarifado exige a indicação do recebedor (Mestre de Obras/Operário) e da etapa construtiva atendida.
- **RN-15 (Alerta de Ponto de Pedido e Estoque Mínimo):** Quando o saldo físico de um SKU atinge a quantidade mínima de segurança, o sistema envia automaticamente alertas para os setores financeiro e de compras.

#### 5.5.3 Requisitos Funcionais (RF) do Módulo 5
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-09** | Conciliação de Estoque via NFe de 44 dígitos | Leitura/digitação da chave de 44 dígitos, validação de módulo 11 e preenchimento automático de insumos, quantidades e preços da SEFAZ. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ALMOXARIFE`, `FINANCEIRO` |
| **RF-10** | Controle de Movimentações por SKU | Registro de entradas, saídas para frentes de trabalho, saldo em tempo real e alerta visual de estoque mínimo. | Essencial | `SUPER_ADMIN`, `ENGENHEIRO`, `MESTRE_OBRA`, `ALMOXARIFE` |

---

### 5.6 Módulo 6: Marketplace B2B (Cotações RFQ & Frotas Pesadas)

#### 5.6.1 Descrição e Fluxo Operacional Detalhado
Portal de comércio eletrônico e serviços B2B integrado que conecta construtoras a fornecedores cadastrados de materiais de construção e locadoras de máquinas e frotas pesadas (escavadeiras, guindastes, caminhões, betoneiras). O fluxo inicia com a emissão de uma Solicitação de Cotação (RFQ - Request for Quotation). Fornecedores enviam propostas comerciais com valores unitários, impostos, prazos de entrega e frete (FOB/CIF). O sistema gera automaticamente um quadro comparativo de propostas e permite o fechamento do pedido de compra ou a contratação de diárias de máquinas pesadas.

#### 5.6.2 Regras de Negócio (RN) do Módulo 6
- **RN-16 (Cotação Cega e Isonomia B2B):** Fornecedores B2B concorrentes não visualizam os valores das propostas alheias durante a vigência do edital de RFQ.
- **RN-17 (Vínculo Orçamentário e Aprovação Financeira):** Pedidos de compra gerados no marketplace que ultrapassarem a alçada orçamentária do projeto exigem aprovação prévia do Gerente de Empreendimento.
- **RN-18 (Gestão de Contratos de Frotas e Máquinas):** A contratação de frotas pesadas exige o registro de horímetro/quilometragem inicial, valor da diária/hora e contrato digital assinado.

#### 5.6.3 Requisitos Funcionais (RF) do Módulo 6
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-11** | Marketplace B2B e Cotações (RFQ) | Emissão de solicitações de cotação de materiais, envio de propostas por fornecedores e geração automática de mapa comparativo. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `FORNECEDOR` |
| **RF-12** | Contratação de Frotas Pesadas | Módulo de reserva e contratação de locação de escavadeiras, guindastes e caminhões por período com cálculo automático de custos. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `FORNECEDOR` |

---

### 5.7 Módulo 7: Execução, Diário de Obra (RDO por Voz/Gemini IA) e Fiscalização ISO 9001 / NR-18

#### 5.7.1 Descrição e Fluxo Operacional Detalhado
Ferramenta móvel de canteiro projetada para simplificar o preenchimento diário das atividades de obra. Permite ao Mestre de Obras e Engenheiros realizarem o ditado de voz sobre as condições do tempo (Claro, Chuvoso, Impracticável), efetivo presente (proprio e terceirizado), equipamentos utilizados e atividades executadas. A inteligência artificial (Gemini API / Web Speech API) transcreve e estrutura automaticamente o Relatório Diário de Obra (RDO). O módulo gerencia também inspeções de qualidade ISO 9001 e auditorias de segurança NR-18, permitindo fotografar ocorrências, definir severidade (Baixa, Média, Alta), indicar o responsável pela ação corretiva e emitir laudos técnicos.

#### 5.7.2 Regras de Negócio (RN) do Módulo 7
- **RN-19 (Prazo Limite para Fechamento do RDO):** O RDO do dia deve ser finalizado até às 23h59. Registros retroativos exigem justificativa formal submetida à aprovação do Engenheiro Residente.
- **RN-20 (Escalonamento Crítico de Não-Conformidade NR-18):** Ocorrências classificadas com severidade "Alta" (risco iminente de acidente ou embargo) paralisam a etapa e geram alerta urgente via PubSub/Push para a diretoria.
- **RN-21 (Exigência de Evidência Fotográfica e Localização):** Todo registro de não-conformidade técnica ou de segurança exige o anexo de pelo menos uma fotografia do local afetado.

#### 5.7.3 Requisitos Funcionais (RF) do Módulo 7
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-13** | Diário de Obra (RDO) por Voz / Gemini IA | Ditado de relatórios diários via Web Speech API e estruturação automática de efetivo, clima e insumos via inteligência artificial. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA` |
| **RF-14** | Fiscalização ISO 9001 e Laudos NR-18 | Cadastro de não-conformidades técnicas com foto, severidade (Alta/Média/Baixa), responsável e emissão de laudos de segurança. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA`, `AUDITOR` |

---

### 5.8 Módulo 8: Comercialização Imobiliária (Espelho de Vendas, Unidades & Simulador Financeiro)

#### 5.8.1 Descrição e Fluxo Operacional Detalhado
Módulo comercial dedicado à gestão do inventário de unidades imobiliárias (apartamentos, lotes, salas comerciais, casas em condomínio). Exibe o espelho de vendas interativo em tempo real com matriz de cores indicando o status das unidades (Disponível = Verde; Reservada = Amarelo; Vendida = Vermelho; Bloqueada = Cinza). Corretores consultam fichas técnicas com metragem, planta e posição solar, realizando reservas comerciais temporárias. Inclui simulador de financiamento imobiliário em até 360 meses, calculando parcelas de sinal, intermediárias e saldo devedor nas tabelas SAC e PRICE com correção por índices oficiais da construção civil (INCC/IGP-M).

#### 5.8.2 Regras de Negócio (RN) do Módulo 8
- **RN-22 (Bloqueio Automático por Reserva Comercial):** A reserva de uma unidade por um corretor altera seu status para "Reservada" temporariamente por até 48 horas no espelho de vendas em tempo real.
- **RN-23 (Integridade da Tabela de Vendas Vigente):** As simulações financeiras devem utilizar estritamente os coeficientes, juros e tabela de preços vigentes aprovados pela incorporadora.
- **RN-24 (Proibição de Venda Duplicada):** O sistema bloqueia fisicamente a efetivação de venda para unidades que já possuam contrato ativo assinado no sistema.

#### 5.8.3 Requisitos Funcionais (RF) do Módulo 8
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-15** | Espelho de Vendas Imobiliárias em Tempo Real | Grid interativo de unidades (Disponível, Reservado e Vendido) atualizado em tempo real para toda a rede de corretores. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `CORRETOR`, `INVESTIDOR` |
| **RF-16** | Simulador Financeiro de Financiamento | Simulação de parcelas e financiamento em até 360 meses utilizando tabelas SAC e PRICE com índices de correção da construção civil. | Desejável | `SUPER_ADMIN`, `CORRETOR`, `CLIENTE`, `INVESTIDOR` |

---

### 5.9 Módulo 9: Portal do Proprietário / Investidor e Diário Transparente de Obra

#### 5.9.1 Descrição e Fluxo Operacional Detalhado
Canal B2C de transparência e relacionamento com o cliente comprador final ou investidor imobiliário. Disponibiliza uma interface intuitiva e responsiva onde o cliente acompanha a porcentagem de avanço físico global do empreendimento e da sua unidade individual ($m^2$ concluídos). Apresenta galeria de fotos periódicas da construção em alta resolução, comunicados oficiais da construtora, cronograma de marcos de entrega e diário transparente com linguagem acessível, fortalecendo a confiança na marca.

#### 5.9.2 Regras de Negócio (RN) do Módulo 9
- **RN-25 (Segregação de Visibilidade B2C):** O cliente comprador final visualiza exclusivamente os dados públicos do empreendimento e a evolução específica do seu bloco/unidade.
- **RN-26 (Curadoria de Conteúdo e Publicação):** Fotos e relatórios publicados no Portal do Proprietário dependem de aprovação prévia do Engenheiro Residente ou Gerente de Comunicação.

#### 5.9.3 Requisitos Funcionais (RF) do Módulo 9
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-17** | Portal do Proprietário / Diário Transparente | Painel B2C de acompanhamento com percentual de avanço físico (%/m²), galeria de imagens e atualizações formais de cronograma. | Essencial | `SUPER_ADMIN`, `CLIENTE`, `INVESTIDOR` |

---

### 5.10 Módulo 10: Gestão de Garantias Pós-Obra e Assistência Técnica (ABNT NBR 15575 / SLA 24h)

#### 5.10.1 Descrição e Fluxo Operacional Detalhado
Central de suporte pós-venda estruturada em estrita conformidade com a Norma de Desempenho Habitacional ABNT NBR 15575. Permite ao cliente comprador abrir chamados de assistência técnica selecionando o subsistema afetado (Estrutura, Vedações, Instalações Hidráulicas, Elétricas, Impermeabilização, Esquadrias e Revestimentos), anexando fotos e descrição da ocorrência. O sistema aplica controle rígido de SLA com triagem e primeiro atendimento técnico em até 24 horas, agendamento de vistoria e emissão de Ordem de Serviço (OS) para a equipe de manutenção.

#### 5.10.2 Regras de Negócio (RN) do Módulo 10
- **RN-27 (Validação de Prazos de Garantia por Subsistema):** O sistema valida a data do Termo de Recebimento da Chave e verifica se o chamado foi aberto dentro do prazo legal de garantia da NBR 15575 para aquele subsistema.
- **RN-28 (Escalonamento por Estouro de SLA 24h):** Chamados abertos sem triagem ou interação técnica nas primeiras 24 horas são notificados automaticamente para a diretoria de pós-vendas.
- **RN-29 (Termo de Encerramento com Assinatura do Cliente):** A conclusão do chamado de assistência técnica exige a validação e assinatura digital de aceite do proprietário.

#### 5.10.3 Requisitos Funcionais (RF) do Módulo 10
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-18** | Garantia Pós-Obra e Chamados NBR 15575 | Abertura e gestão de chamados de assistência técnica com fotos, categorização NBR 15575, controle de SLA 24h e emissão de OS. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `CLIENTE` |

---

### 5.11 Módulo 11: Chat Corporativo B2B e Central de Mensagens Instantâneas

#### 5.11.1 Descrição e Fluxo Operacional Detalhado
Canal interno de mensageria instantânea e comunicação corporativa integrado à plataforma web. Permite a comunicação direta entre engenheiros de campo, mestre de obras, almoxarife, equipe financeira, fornecedores de insumos B2B e corretores de imóveis. As conversas são organizadas em salas públicas ou privadas vinculadas a um contexto operacional específico (uma obra, uma cotação RFQ, um pedido de estoque ou um chamado de assistência técnica), garantindo centralização e rastreabilidade total das tratativas.

#### 5.11.2 Regras de Negócio (RN) do Módulo 11
- **RN-30 (Vinculação Contextual de Conversas):** As salas de bate-papo devem ser obrigatoriamente associadas a um empreendimento, cotação RFQ, pedido de estoque ou chamado de garantia.
- **RN-31 (Histórico Auditável e Não Exclusão de Mensagens):** Mensagens enviadas no chat corporativo não podem ser apagadas pelos usuários para preservar o histórico das alinhamentos operacionais.

#### 5.11.3 Requisitos Funcionais (RF) do Módulo 11
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-19** | Chat Corporativo B2B Instantâneo | Mensageria em tempo real para comunicação interna e externa entre perfis cadastrados, com suporte a anexos e vinculo com a obra. | Desejável | **Todos os Perfis Cadastrados** |

---

### 5.12 Módulo 12: Trilha Imutável de Auditoria (Audit Trail / ISO 9001) e Governança LGPD (Art. 18)

#### 5.12.1 Descrição e Fluxo Operacional Detalhado
Módulo de governança corporativa, auditoria técnica e conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). Mantém um registro imutável (*Audit Trail*) em regime *append-only* de todas as operações sensíveis realizadas na plataforma (autenticações, criação/edição/exclusão de registros, alterações de permissões, downloads de arquivos e movimentações financeiras), registrando autor, IP, timestamp e payload. Na Central de Privacidade LGPD, o titular dos dados pode solicitar o relatório de portabilidade em arquivo JSON estruturado (Art. 18 LGPD) ou requerer o esquecimento/anonimização dos seus dados pessoais PII.

#### 5.12.2 Regras de Negócio (RN) do Módulo 12
- **RN-32 (Imutabilidade Absoluta da Auditoria):** Os registros de log de auditoria são armazenados em tabelas *append-only* no banco de dados e jamais podem ser modificados ou deletados por qualquer usuário ou administrador.
- **RN-33 (Anonimização Irreversível de PII na LGPD):** A solicitação de esquecimento LGPD substitui dados pessoais por hashes de mascaramento, preservando a integridade dos registros fiscais e operacionais agregados.
- **RN-34 (Disponibilização de Exportação JSON em até 48h):** O relatório de portabilidade de dados pessoais em formato JSON estruturado deve ser disponibilizado para download em menos de 48 horas.

#### 5.12.3 Requisitos Funcionais (RF) do Módulo 12
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-20** | Auditoria Imutável e Portabilidade LGPD | Motor de log imutável de transações e central de privacidade LGPD com exportação de dados do titular em formato JSON estruturado. | Essencial | `SUPER_ADMIN`, `AUDITOR`, `CLIENTE` (dados próprios) |

---

## 6. REQUISITOS NÃO FUNCIONAIS (RNF-01 a RNF-10)

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
1. **Disponibilidade de Dispositivos e Navegadores Modernos:** Assume-se que os usuários de campo e escritório dispõem de dispositivos com navegadores atualizados e suporte à aceleração gráfica WebGL.
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
6. **Renderização de Nuvens de Pontos (Point Cloud):** O motor gráfico 3D não processará arquivos de escaneamento a laser com milhões de pontos; a visualização foca em malhas poligonais procedurais BIM.
7. **Suporte Multilíngue e Internacionalização (i18n):** A plataforma será disponibilizada e suportada exclusivamente no idioma Português do Brasil (pt-BR).

---

## 8. CRITÉRIOS DE ACEITAÇÃO DO PROJETO

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

## 10. ENTREGÁVEIS TANGÍVEIS E ENCERRAMENTO

### 10.1 Entregáveis Tangíveis
1. **Código-Fonte Completo da Aplicação:** Repositório Git contendo o Frontend (React 18 + TypeScript + Vite + Tailwind CSS), Backend (Java 21 + Spring Boot 3.2 + Spring Security) e scripts de banco de dados (Flyway SQL).
2. **Documentação Arquitetural e de Requisitos:** DDE v2.2 consolidado, especificação de requisitos, registros de decisão arquitetural (ADRs) e diagramas UML.
3. **Infraestrutura como Código (IaC) e DevOps:** Scripts Terraform (`main.tf`, `variables.tf`) para AWS EKS / PostgreSQL e pipeline de CI/CD `Jenkinsfile` automatizado.
4. **Suíte de Testes Automatizados:** Suíte de testes unitários/integração no backend (JUnit 5) e testes E2E no frontend (Playwright).
5. **Manuais do Usuário e Manuais Operacionais:** Manual do usuário por tela (`05_MANUAL_DO_USUARIO_TELAS.md`), guia de integração Jenkins (`06_INTEGRACAO_JENKINS_CICD.md`) e guia de auditoria (`07_SISTEMA_DE_LOGS_E_AUDITORIA.md`).

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
