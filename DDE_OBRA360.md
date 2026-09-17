# DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE)

**Nome do Projeto:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário  
**Instituição de Ensino:** AESA-CESA (2026) — Projeto Interdisciplinar de Engenharia de Software  
**Autores (Desenvolvedores):** João Pedro e Marcos Henrique  
**Professor Orientador:** Prof. Dennys Carvalho  
**Versão:** 2.1 (Mapeamento Modular Consolidado com RFs, RNs e RBAC por Módulo)  
**Data de Emissão:** 17/09/2026  

---

## 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO DO PROBLEMA

### 1.1 Introdução
O setor da construção civil e do mercado imobiliário representa uma das engrenagens mais vitais da economia mundial e nacional, impactando diretamente o Produto Interno Bruto (PIB), a geração de empregos e o desenvolvimento de infraestrutura urbana. Entretanto, historicamente, a indústria da construção caracteriza-se por uma forte fragmentação operacional, baixa taxa de digitalização e desarticulação na comunicação entre os múltiplos agentes que integram a cadeia de valor — tais como construtoras, incorporadoras, escritórios de arquitetura e engenharia, fornecedores de insumos, prestadores de serviços de locação de frotas, corretores imobiliários, investidores e compradores finais.

O **Obra360** surge como uma resposta tecnológica robusta a essa problemática. Concebido como uma **Plataforma Corporativa Web e Ecossistema Digital Integrado (SaaS Multi-Tenant B2B/B2C)**, a solução tem por finalidade centralizar, automatizar e conferir rastreabilidade total a todas as fases do ciclo de vida de um empreendimento imobiliário ou de infraestrutura — abrangendo desde a concepção da oportunidade e estudo de viabilidade do terreno, passando pelo planejamento físico-financeiro, modelagem espacial 2D/3D (BIM), cotações B2B automatizadas por Nota Fiscal Eletrônica (NFe), diário de obra inteligente com auxílio de Inteligência Artificial, fiscalização de segurança NR-18 e ISO 9001, até a comercialização de unidades, entrega das chaves e gestão de garantias pós-obra (ABNT NBR 15575).

---

### 1.2 A "Dor" Central e a Problematização no Canteiro de Obras
A execução de obras civis de qualquer porte envolve a convergência de dezenas de organizações terceirizadas, centenas de insumos heterogêneos e múltiplos perfis profissionais atuando simultaneamente sob prazos rígidos e orçamentos elevados. No cenário tradicional, as informações estratégicas e operacionais encontram-se pulverizadas em canais informais de mensagens instantâneas, planilhas eletrônicas locais descentralizadas, pranchas impressas desatualizadas e sistemas legados isolados que não se communicam.

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
Este Documento de Definição de Escopo (DDE v2.1) estabelece as balizas formais, técnicas e funcionais do projeto Obra360. Nas seções subsequentes, apresentam-se a fundamentação mercadológica amparada em dados estatísticos do setor, o mapeamento detalhado dos stakeholders e matriz de permissões (RBAC/IAM), a declaração dos objetivos do sistema, a discriminação minuciosa dos **12 módulos funcionais (agrupando Requisitos Funcionais - RFs, Regras de Negócio - RNs e Permissões por perfil)**, os Requisitos Não Funcionais (RNFs), as premissas, restrições e exclusões deliberadas de escopo, os critérios objetivos de aceitação e a matriz de gerenciamento de riscos.

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

## 5. DETALHAMENTO DO ESCOPO POR MÓDULOS DO PROJETO

Nesta seção, o escopo do Obra360 é fatiado e apresentado individualmente por módulo funcional (**Módulos 1 a 12**). Cada módulo especifica seu fluxo operacional, **Regras de Negócio (RNs)**, **Requisitos Funcionais (RFs)**, nível de prioridade e os **Perfis Autorizados (RBAC/IAM)**.

---

### 5.1 Módulo 1: Gestão Multi-Empresas (Multi-Tenant SaaS B2B/B2C) e Controle IAM/RBAC

#### 5.1.1 Descrição e Fluxo Operacional
Responsável pelo gerenciamento do cadastro corporativo de empresas (Construtoras, Projetistas, Fornecedores, Imobiliárias) e controle centralizado de autenticação de usuários. O módulo realiza o comutamento (*tenant switching*) instantâneo e assegura a segregação lógica absoluta dos dados em nível de banco de dados.

#### 5.1.2 Regras de Negócio (RN) do Módulo 1
- **RN-01 (Isolamento Lógico do Tenant):** Nenhuma consulta, relatório ou operação pode cruzar dados entre empresas (Tenants) distintas sem permissão explícita de plataforma (`SUPER_ADMIN`).
- **RN-02 (Validação de Registro CNPJ/CPF):** O cadastro de organizações exige validação do algoritmo do CNPJ (14 dígitos), e usuários individuais exigem validação de CPF (11 dígitos).
- **RN-03 (Segregação de Funções - SoD):** Um mesmo usuário não pode acumular papéis operacionais conflitantes no mesmo tenant (ex: Almoxarife e Analista Financeiro de Compras).

#### 5.1.3 Requisitos Funcionais (RF) do Módulo 1
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-01** | Autenticação e Gestão IAM/RBAC | Autenticação por e-mail/senha com tokens JWT Stateless, suporte a MFA e controle granular dos 11 perfis SoD. | Essencial | **Todos os Perfis** (login) / `SUPER_ADMIN` (gestão) |
| **RF-02** | Gestão Multi-Tenant (Empresas) | Cadastro, edição e alternância de organizações corporativas com isolamento de dados por Tenant ID. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA` |

---

### 5.2 Módulo 2: Gestão de Empreendimentos e Categorias de Obras

#### 5.2.1 Descrição e Fluxo Operacional
Permite o cadastro e a parametrização de obras e projetos imobiliários de diferentes tipologias construtivas (Casas, Condomínios Fechados, Edifícios, Hospitais, Galpões Logísticos, Obras de Infraestrutura, Túneis e Energia Solar Fotovoltaica).

#### 5.2.2 Regras de Negócio (RN) do Módulo 2
- **RN-04 (Indicadores Exclusivos por Obra):** Cada empreendimento possui seu próprio cronograma físico-financeiro, centro de custos, orçamento aprovado, VGV e equipe técnica vinculada.
- **RN-05 (Responsabilidade Técnica Obrigatória):** Toda obra cadastrada deve possuir obrigatoriamente pelo menos um Engenheiro Residente e/ou Arquiteto responsável vinculado à ART/RRT.

#### 5.2.3 Requisitos Funcionais (RF) do Módulo 2
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-03** | Cadastro de Empreendimentos e Categorias | Permite criar e parametrizar obras especificando localização, área total, categoria construtiva, prazos e orçamento macro. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO` |

---

### 5.3 Módulo 3: Modelagem 3D Evolutiva (BIM) e Extrusão de Plantas 2D (AI CAD Parser)

#### 5.3.1 Descrição e Fluxo Operacional
Motor gráfico tridimensional WebGL/Three.js integrado a uma ferramenta procedural de extrusão de plantas 2D (presets ou arquivos CAD). Permite a visualização, montagem e simulação do avanço físico da estrutura da obra ao longo do tempo.

#### 5.3.2 Regras de Negócio (RN) do Módulo 3
- **RN-06 (Modelo 3D Exclusivo por Obra):** Cada empreendimento possui seu próprio modelo tridimensional isolado e parametrizável.
- **RN-07 (Autoria de Modificação Estrutural):** Apenas perfis técnicos credenciados (`ENGENHEIRO`, `ARQUITETO`, `GERENTE_OBRA`, `SUPER_ADMIN`) têm permissão para inserir, posicionar, encaixar ou excluir elementos 3D (vigas, pilares, lajes, telhados, paredes).
- **RN-08 (Linha do Tempo Evolutiva):** A movimentação do slider de tempo (Semanas 1 a 8) deve recalcular e destacar volumetricamente as etapas executadas (cor verde/azul) versus pendentes (cor cinza/transparente).

#### 5.3.3 Requisitos Funcionais (RF) do Módulo 3
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-04** | Visualização 3D BIM Interativa | Renderiza modelo espacial 3D em Three.js/WebGL com navegação (órbita, pan, zoom) e inspeção de propriedades de elementos. | Essencial | **Todos os Perfis** (visibilidade conforme regra de domínio) |
| **RF-05** | Edição Estrutural 3D (Construtor BIM) | Permite que engenheiros e arquitetos insiram e encaixem sapatas, pilares, vigas, paredes, lajes, telhados e portas no espaço 3D. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-06** | Extrusão de Plantas 2D (AI CAD Parser) | Converte proceduralmente plantas baixas 2D em estruturas tridimensionais extrudadas com pés-direitos configuráveis. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-07** | Linha do Tempo Evolutiva (Slider) | Simula visualmente o avanço físico semanal da obra (Semanas 1 a 8) com atualização da geometria 3D. | Importante | **Todos os Perfis** |

---

### 5.4 Módulo 4: Central de Projetos e Gerenciamento Documental Versionado (IFC / DWG / PDF)

#### 5.4.1 Descrição e Fluxo Operacional
Repositório centralizado de arquivos técnicos de engenharia e arquitetura com suporte aos padrões OpenBIM (IFC4), desenhos cad (DWG) e documentos executivos (PDF).

#### 5.4.2 Regras de Negócio (RN) do Módulo 4
- **RN-09 (Imutabilidade de Revisões Documentais):** O envio de uma nova versão de projeto não sobrescreve o arquivo anterior; gera uma nova revisão (`v1.1`, `v2.0`) com autor, timestamp e notas de alteração.
- **RN-10 (Bloqueio de Download Obsoleto no Canteiro):** Documentos com status "Rejeitado" ou "Obsoleto" ficam indisponíveis para visualização na frente de trabalho para evitar erros de execução.

#### 5.4.3 Requisitos Funcionais (RF) do Módulo 4
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-08** | Repositório Documental Versionado | Armazena pranchas e arquivos IFC/DWG/PDF com controle de revisão, histórico de aprovação e fluxo de assinatura técnica. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |

---

### 5.5 Módulo 5: Almoxarifado, Controle de Estoque por SKU e Conciliação NFe (44 dígitos)

#### 5.5.1 Descrição e Fluxo Operacional
Gestão logística do canteiro de obras, englobando a recepção de materiais por Nota Fiscal Eletrônica (NFe SEFAZ), controle de movimentações de Entrada/Saída por código SKU e monitoramento de estoque de segurança.

#### 5.5.2 Regras de Negócio (RN) do Módulo 5
- **RN-11 (Validação SEFAZ Módulo 11):** A consulta e importação por chave de NFe exige a validação do algoritmo do dígito verificador de 44 dígitos da SEFAZ.
- **RN-12 (Alerta de Estoque Mínimo):** Insumos cujo saldo em estoque atingir o limite crítico cadastrado disparam automaticamente notificações de compra para os setores financeiro e de suprimentos.

#### 5.5.3 Requisitos Funcionais (RF) do Módulo 5
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-09** | Conciliação de Estoque via NFe | Leitura/digitação da chave de 44 dígitos, validação de módulo 11 e preenchimento automático de insumos, quantidades e preços. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ALMOXARIFE`, `FINANCEIRO` |
| **RF-10** | Controle de Movimentações por SKU | Registro de entradas, saídas para frentes de trabalho, saldo em tempo real e alerta visual de estoque mínimo. | Essencial | `SUPER_ADMIN`, `ENGENHEIRO`, `MESTRE_OBRA`, `ALMOXARIFE` |

---

### 5.6 Módulo 6: Marketplace B2B (Cotações RFQ & Frotas Pesadas)

#### 5.6.1 Descrição e Fluxo Operacional
Portal de negociações B2B para abertura de editas de Solicitação de Cotação (RFQ - *Request for Quotation*) de insumos e contratação/reserva de frotas e máquinas pesadas (escavadeiras, guindastes, betoneiras, caminhões).

#### 5.6.2 Regras de Negócio (RN) do Módulo 6
- **RN-13 (Isonomia e Cotação Cega B2B):** Os fornecedores B2B cadastrados não enxergam os valores das propostas concorrentes durante o período aberto da cotação.
- **RN-14 (Vinculação de Frotas ao Projeto):** A reserva de máquinas e frotas pesadas exige a indicação prévia do empreendimento pagador e o período contratado (horas ou diárias).

#### 5.6.3 Requisitos Funcionais (RF) do Módulo 6
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-11** | Marketplace B2B e Cotações (RFQ) | Emissão de solicitações de cotação de materiais, envio de propostas por fornecedores e geração de quadro comparativo. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `FORNECEDOR` |
| **RF-12** | Contratação de Frotas Pesadas | Módulo de reserva e contratação de locação de escavadeiras, guindastes e caminhões por período com cálculo de custos. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `FORNECEDOR` |

---

### 5.7 Módulo 7: Execução, Diário de Obra (RDO por Voz/Gemini IA) e Fiscalização ISO 9001 / NR-18

#### 5.7.1 Descrição e Fluxo Operacional
Ferramenta de campo para preenchimento do Diário de Obra (RDO) assistido por voz e IA (Gemini), acompanhada do registro de auditorias de qualidade ISO 9001 e ocorrências de segurança do trabalho conforme a norma NR-18.

#### 5.7.2 Regras de Negócio (RN) do Módulo 7
- **RN-15 (Fechamento Diário de RDO):** O RDO deve ser preenchido até as 23h59 do dia corrente. Alterações retroativas exigem justificativa formal aceita pelo Engenheiro Residente.
- **RN-16 (Paralisação por Severidade Alta NR-18):** Ocorrências de segurança classificadas com severidade "Alta" emitem alerta imediato via barramento PubSub para a gerência e paralisam a etapa afetada.

#### 5.7.3 Requisitos Funcionais (RF) do Módulo 7
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-13** | Diário de Obra (RDO) por Voz / Gemini IA | Ditado de relatórios diários via Web Speech API e estruturação automática de efetivo, clima e insumos via IA. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA` |
| **RF-14** | Fiscalização ISO 9001 e Laudos NR-18 | Cadastro de não-conformidades técnicas com foto, severidade (Alta/Média/Baixa), responsável e laudos de segurança. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA`, `AUDITOR` |

---

### 5.8 Módulo 8: Comercialização Imobiliária (Espelho de Vendas, Unidades & Simulador Financeiro)

#### 5.8.1 Descrição e Fluxo Operacional
Módulo voltado à gestão de vendas do inventário de unidades imobiliárias (apartamentos, lotes, salas comerciais), exibindo espelho de vendas em tempo real e simulador de parcelamento.

#### 5.8.2 Regras de Negócio (RN) do Módulo 8
- **RN-17 (Bloqueio de Reserva Concorrente):** Ao selecionar uma unidade para reserva, o sistema altera seu status para "Reservado" por até 48 horas, impedindo reservas duplicadas por outros corretores.
- **RN-18 (Tabelas e Reajustes Financeiros):** As simulações de parcelamento devem aplicar rigorosamente os parâmetros de juros e índices de reajuste (INCC/IGP-M) cadastrados pela incorporadora.

#### 5.8.3 Requisitos Funcionais (RF) do Módulo 8
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-15** | Espelho de Vendas Imobiliárias em Tempo Real | Grid interativo de unidades (Disponível, Reservado e Vendido) atualizado em tempo real para a rede de corretores. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `CORRETOR`, `INVESTIDOR` |
| **RF-16** | Simulador Financeiro de Financiamento | Simulação de parcelas e financiamento em até 360 meses utilizando tabelas SAC e PRICE com índices de correção. | Desejável | `SUPER_ADMIN`, `CORRETOR`, `CLIENTE`, `INVESTIDOR` |

---

### 5.9 Módulo 9: Portal do Proprietário / Investidor e Diário Transparente de Obra

#### 5.9.1 Descrição e Fluxo Operacional
Canal B2C de relacionamento e transparência, permitindo que o cliente comprador ou investidor acompanhe o progresso físico da construção, relatórios fotográficos e comunicados oficiais.

#### 5.9.2 Regras de Negócio (RN) do Módulo 9
- **RN-19 (Privacidade das Informações B2C):** O comprador final visualiza apenas os dados públicos autorizados do empreendimento e a evolução específica do seu bloco/unidade.
- **RN-20 (Curadoria de Conteúdo Público):** Fotos e relatórios publicados no Diário Transparente devem passar por aprovação prévia do Engenheiro Residente ou Gerente.

#### 5.9.3 Requisitos Funcionais (RF) do Módulo 9
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-17** | Portal do Proprietário / Diário Transparente | Painel de acompanhamento com percentual de avanço físico (%/m²), galeria de imagens e atualizações de cronograma. | Essencial | `SUPER_ADMIN`, `CLIENTE`, `INVESTIDOR` |

---

### 5.10 Módulo 10: Gestão de Garantias Pós-Obra e Assistência Técnica (ABNT NBR 15575 / SLA 24h)

#### 5.10.1 Descrição e Fluxo Operacional
Central de pós-venda para abertura e triagem de chamados de manutenção e garantia pós-entrega das chaves, estruturada conforme os prazos de garantia dos subsistemas previstos na ABNT NBR 15575.

#### 5.10.2 Regras de Negócio (RN) do Módulo 10
- **RN-21 (Vigência por Subsistema Habitacional):** O sistema valida a data de entrega das chaves e a tabela de garantia legal de cada subsistema (ex: 5 anos para estrutura e hidráulica embutida).
- **RN-22 (Escalonamento por Estouro de SLA 24h):** Chamados abertos que não receberem primeiro atendimento técnico em até 24 horas são escalados automaticamente para a diretoria de pós-vendas.

#### 5.10.3 Requisitos Funcionais (RF) do Módulo 10
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-18** | Garantia Pós-Obra e Chamados NBR 15575 | Abertura e gestão de chamados de assistência técnica com fotos, categorização NBR 15575 e controle de SLA de 24h. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `CLIENTE` |

---

### 5.11 Módulo 11: Chat Corporativo B2B e Central de Mensagens Instantâneas

#### 5.11.1 Descrição e Fluxo Operacional
Canal de comunicação instantânea em tempo real para alinhamento entre equipes operacionais do canteiro, almoxarifado, engenheiros, fornecedores B2B e corretores imobiliários.

#### 5.11.2 Regras de Negócio (RN) do Módulo 11
- **RN-23 (Vinculação Contextual de Conversas):** Os tópicos de chat devem ser associados ao empreendimento, cotação RFQ ou chamado de garantia correspondente, preservando o histórico auditável.

#### 5.11.3 Requisitos Funcionais (RF) do Módulo 11
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-19** | Chat Corporativo B2B Instantâneo | Mensageria em tempo real para comunicação interna e externa entre os perfis cadastrados no tenant. | Desejável | **Todos os Perfis Cadastrados** |

---

### 5.12 Módulo 12: Trilha Imutável de Auditoria (Audit Trail / ISO 9001) e Governança LGPD (Art. 18)

#### 5.12.1 Descrição e Fluxo Operacional
Módulo de governança corporativa e segurança da informação. Mantém registro imutável de todas as transações do sistema (para auditorias de qualidade ISO 9001) e atende aos direitos dos titulares de dados (LGPD).

#### 5.12.2 Regras de Negócio (RN) do Módulo 12
- **RN-24 (Imutabilidade Absoluta da Auditoria):** Os registros de log (autor, ação, data/hora, IP, payload) são gravados em regime *append-only* e jamais podem ser alterados ou apagados por qualquer perfil.
- **RN-25 (Direito ao Esquecimento e Anonimização LGPD):** A solicitação de exclusão de dados pessoais (Art. 18 LGPD) executa o mascaramento irreversível de PII, preservando os registros fiscais e operacionais históricos.

#### 5.12.3 Requisitos Funcionais (RF) do Módulo 12
| ID | Nome do Requisito | Descrição Detalhada | Prioridade | Perfis Autorizados (IAM/RBAC) |
|---|---|---|---|---|
| **RF-20** | Auditoria Imutável e Portabilidade LGPD | Registro imutável de logs de ações e central de privacidade com exportação de dados do titular em formato JSON estruturado. | Essencial | `SUPER_ADMIN`, `AUDITOR`, `CLIENTE` (dados próprios) |

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
2. **Documentação Arquitetural e de Requisitos:** DDE v2.1 consolidado, especificação de requisitos, registros de decisão arquitetural (ADRs) e diagramas UML.
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
