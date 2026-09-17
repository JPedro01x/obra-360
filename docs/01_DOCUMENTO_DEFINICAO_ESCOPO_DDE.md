# DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE) — VERSÃO 3.1 EXPANDIDA

**Nome do Projeto:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário  
**Instituição de Ensino:** AESA-CESA (2026) — Projeto Interdisciplinar de Engenharia de Software  
**Autores (Desenvolvedores):** João Pedro e Marcos Henrique  
**Professor Orientador:** Prof. Dennys Carvalho  
**Versão:** 3.1 (Versão Acadêmica e Corporativa de Alta Maturidade — Seções de Metodologia, Justificativa e Evidências Empíricas Exaustivamente Expandidas com Modelos Matemáticos)  
**Data de Emissão:** 17/09/2026  

---

## 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO DO PROBLEMA

### 1.1 Introdução e Visão de Futuro
O setor da construção civil e do mercado imobiliário representa uma das engrenagens mais vitais da economia mundial e nacional, impactando diretamente o Produto Interno Bruto (PIB), a geração de empregos formais e informais, a arrecadação tributária e o desenvolvimento da infraestrutura urbana e social. Segundo dados consolidados da consultoria internacional McKinsey & Company e da Câmara Brasileira da Indústria da Construção (CBIC), a cadeia global da construção movimenta anualmente mais de 12 trilhões de dólares, sendo responsável pela estruturação do ambiente construído das cidades modernas.

No entanto, à medida que os conceitos de *Smart Cities* (Cidades Inteligentes), Construção 4.0, industrialização de componentes pré-moldados e a metodologia BIM (*Building Information Modeling*) ganham tração mundial, a indústria da construção civil enfrenta a urgência de superar seus gargalos históricos de gestão. O ecossistema moderno da construção exige que a informação navegue de forma transparente e instantânea entre o canteiro de obras, os escritórios de projetos, os centros de distribuição de suprimentos e os clientes compradores das unidades.

O **Obra360** surge como uma solução tecnológica de vanguarda, projetada sob os rigorosos preceitos da Engenharia de Software Corporativa. Concebido como uma **Plataforma Corporativa Web e Ecossistema Digital Integrado (SaaS Multi-Tenant B2B/B2C)**, a solução tem por finalidade centralizar, automatizar, desburocratizar e conferir rastreabilidade auditável total a todas as fases do ciclo de vida de um empreendimento imobiliário ou de infraestrutura urbana. A plataforma abrange desde a concepção inicial da oportunidade e estudo de viabilidade técnica e financeira do terreno, passando pelo planejamento físico-financeiro detalhado, modelagem espacial 2D/3D BIM, cotações B2B automatizadas por integração com Nota Fiscal Eletrônica (NFe SEFAZ), diário de obra inteligente com auxílio de Inteligência Artificial Generativa (Gemini IA), fiscalização de segurança do trabalho (NR-18) e qualidade (ISO 9001), até a comercialização de unidades, entrega formal das chaves e gestão contínua de garantias pós-obra (ABNT NBR 15575).

---

### 1.2 A "Dor" Central e a Problematização Detalhada no Canteiro de Obras
A execução de obras civis de qualquer porte — desde residências unifamiliares até grandes complexos prediais ou obras de infraestrutura pesada — envolve a convergência de dezenas de organizações terceirizadas, centenas de insumos heterogêneos e múltiplos perfis profissionais atuando simultaneamente sob prazos rígidos, orçamentos elevados e margens de lucro cada vez mais estreitas. No cenário tradicional brasileiro e internacional, as informações estratégicas e operacionais encontram-se pulverizadas em canais informais de mensagens instantâneas (sem registro formal), planilhas eletrônicas locais descentralizadas (sujeitas a erros manuais e corrupção de dados), pranchas de projeto impressas desatualizadas no canteiro e sistemas legados isolados que não se comunicam.

Essa profunda assimetria de informações gera desdobramentos altamente críticos para a gestão corporativa e financeira do empreendimento:

1. **Descontrole Financeiro e Logístico de Materiais:** A ausência de sincronização em tempo real entre a frente de trabalho no canteiro de obras e o almoxarifado impede a apuração exata do consumo de insumos por metro quadrado ($m^2$) executado. Esse cenário culmina em compras duplicadas, faltas de insumos críticos que paralisam a mão de obra, desvio indevido de materiais e estouro recorrente do orçamento base planejado.
2. **Uso de Versões Obsoletas de Projetos Executivos:** A falta de versionamento centralizado e homologado de arquivos arquitetônicos, estruturais e de instalações hidráulicas/elétricas conduz a erros graves de execução no canteiro de obras. É frequente a identificação de interferências espaciais apenas no momento da montagem no canteiro, demandando demolições não planejadas, atrasos severos e retrabalhos extremamente dispendiosos.
3. **Falhas na Comunicação e Opacidade com o Cliente Final:** O comprador de uma unidade imobiliária em construção ou o investidor do empreendimento permanece privado de informações claras, didáticas e confiáveis sobre o avanço físico real da edificação. A falta de transparência gera desconfiança, volume excessivo de chamados repetitivos nas centrais de atendimento de pós-venda e insegurança jurídica na relação de consumo.
4. **Ausência de Rastreabilidade e Não Conformidades Regulatórias:** O descumprimento não detectado de normas técnicas obrigatórias de segurança do trabalho (NR-18) e critérios de qualidade habitacional (ISO 9001 e ABNT NBR 15575) decorre da falta de processos padronizados de fiscalização de campo e do registro imutável de ocorrências técnicas. Isso expõe a construtora a multas dos órgãos fiscalizadores, interdições de canteiro e futuros litígios judiciais indenizatórios por vícios ocultos na construção.

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

### 1.4 Estrutura do Documento e Metodologia da Engenharia de Software (EXPANDIDO)

#### 1.4.1 Abordagem Metodológica Normativa (IEEE Std 830 / ISO/IEC/IEEE 29148)
A elaboração deste Documento de Definição de Escopo (DDE v3.1) e o desenvolvimento da plataforma Obra360 orientam-se rigorosamente pelas diretrizes internacionais de Engenharia de Requisitos estipuladas pela norma **IEEE Std 830-1998** (*Recommended Practice for Software Requirements Specifications*) e pela norma internacional de sistemas e engenharia de software **ISO/IEC/IEEE 29148:2018** (*Requirements engineering*).

A abordagem adota um ciclo de vida de requisitos iterativo e incremental, subdividido em 4 etapas fundamentais:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                     CICLO DE VIDA DA ENGENHARIA DE REQUISITOS (IEEE 29148)                │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐            │
│  │ 1. Elicitação &    ├────►│ 2. Análise &       ├────►│ 3. Especificação   │            │
│  │    Descoberta      │     │    Categorização   │     │    Formal (DDE)    │            │
│  └────────────────────┘     └────────────────────┘     └─────────┬──────────┘            │
│                                                                  │                       │
│                                                                  ▼                       │
│                                                        ┌────────────────────┐            │
│                                                        │ 4. Validação &     │            │
│                                                        │    Rastreabilidade │            │
│                                                        └────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Elicitação e Descoberta junto aos Stakeholders:** Realização de levantamentos de campo, entrevistas com profissionais do setor (Engenheiros Residentes, Mestres de Obras, Almoxarifes, Corretores Imobiliários e Gestores de Pós-Venda) e análise comparativa de soluções de mercado para identificação dos gargalos reais da construção civil.
2. **Análise, Categorização e Modelagem de Requisitos:** Classificação sistemática das necessidades levantadas em Requisitos Funcionais (RF), Requisitos Não Funcionais (RNF), Regras de Negócio (RN), Premissas e Restrições Arquiteturais, aplicando os princípios de Segregação de Funções (SoD - *Segregation of Duties*).
3. **Especificação Formal e Modelagem Arquitetural:** Documentação detalhada em linguagem clara, objetiva e acadêmica, acompanhada da construção de modelos conceituais Entidade-Relacionamento (DER), visualização de contêineres C4 Model e formulagem de equações matemáticas determinísticas.
4. **Validação, Homologação e Matriz de Rastreabilidade:** Estabelecimento de Critérios Objetivos de Aceite (*Definition of Done - DoD*), mapeamento de suítes de testes automatizados (JUnit 5 e Playwright E2E) e estruturação da Matriz Geral de Rastreabilidade Requisito x Código x Teste.

#### 1.4.2 Governança Ágil de Desenvolvimento (Scrum/Kanban, TDD e CI/CD)
O processo de construção do software Obra360 adota a metodologia ágil **Scrum** combinada ao fluxo contínuo **Kanban**. O ciclo de desenvolvimento organiza-se em *Sprints* quinzenais de entrega com revisões e demonstrações funcionais executáveis.

A governança de desenvolvimento de software sustenta-se sobre três pilares de qualidade:
- **Desenvolvimento Orientado a Testes (TDD - Test-Driven Development):** Escrita prévia de testes unitários e de integração no backend Java (JUnit 5 / Mockito) para assegurar o funcionamento estrito das Regras de Negócio de domínio antes da implementação dos casos de uso.
- **Registros de Decisão Arquitetural (ADRs - Architecture Decision Records):** Documentação técnica formal de cada escolha tecnológica relevante (ex: escolha do framework Three.js para WebGL 3D, adoção de Spring Security 6 stateless JWT e banco de dados PostgreSQL Multi-Tenant).
- **Integração e Entrega Contínua (CI/CD via Jenkins/GitHub Actions):** Automação completa do pipeline de build, execução de testes unitários, análise estática de código (SonarQube) e geração de artefatos de implantação em cada *Push* ou *Pull Request*.

#### 1.4.3 Estruturação Sistêmica do Documento
Este documento organiza-se em **12 Seções encadeadas**, projetadas para oferecer uma leitura progressiva e exaustiva do produto:
- **Seções 1 a 3:** Contextualização socioeconômica, fundamentação empírica/estatística, justificativa teórica e mapeamento de partes interessadas/perfis IAM.
- **Seções 4 e 5:** Declaração de objetivos gerais e específicos, modelagem arquitetural C4 Model e diagrama de entidade-relacionamento (DER).
- **Seção 6:** Detalhamento exaustivo dos **12 Módulos Funcionais**, especificando individualmente as **50 Regras de Negócio (RN-01 a RN-50)** e os **30 Requisitos Funcionais (RF-01 a RF-30)** com prioridades e perfis autorizados.
- **Seções 7 a 12:** Requisitos Não Funcionais (RNFs), premissas, restrições, exclusões de escopo, matriz de rastreabilidade, critérios de aceite, matriz de riscos e entregáveis tangíveis.

---

## 2. JUSTIFICATIVA E FUNDAMENTAÇÃO TEÓRICA / MERCADOLÓGICA (EXPANDIDO)

### 2.1 Cenário Global e Nacional da Construção Civil
A construção civil assume papel de destaque absoluto no desenvolvimento socioeconômico global, sendo responsável por aproximadamente 13% do Produto Interno Bruto (PIB) mundial, conforme relatórios da consultoria internacional McKinsey & Company. No Brasil, segundo dados do Instituto Brasileiro de Geografia e Estatística (IBGE, 2023) e da Câmara Brasileira da Indústria da Construção (CBIC, 2023), o setor responde por mais de 6% do PIB nacional e emprega diretamente mais de 2,7 milhões de trabalhadores formais, além de movimentar uma extensa cadeia produtiva composta por mais de 60 setores industriais e de serviços derivados (siderurgia, cimento, cerâmica, vidros, transporte, finanças e engenharia consultiva).

A despeito da sua gigantesca magnitude econômica, o setor da construção civil permanece classificado, de acordo com o *McKinsey Global Institute Digitization Index*, como o **segundo setor menos digitalizado do planeta**, situando-se apenas acima da agricultura e da caça. Essa estagnação tecnológica histórica reflete-se diretamente em baixos índices de evolução da produtividade do trabalho e elevados níveis de ineficiência operacional no canteiro de obras.

### 2.1.1 A Revolução da Construção 4.0 e a Tríplice Transição Tecnológica
Para responder a essa ineficiência histórica, a indústria da construção civil vive atualmente o advento da **Construção 4.0**, impulsionada pela convergência de três vetores tecnológicos:
1. **Modelagem da Informação da Edificação (BIM - Building Information Modeling):** Transição dos desenhos 2D bidimensionais estáticos para modelos virtuais 3D paramétricos ricos em dados (OpenBIM IFC4), permitindo a simulação geométrica e a detecção de interferências (*Clash Detection*) antes do início da execução física.
2. **Computação Móvel e em Nuvem (Cloud & Mobile First):** Acesso instantâneo a dados do projeto por equipes de canteiro através de dispositivos móveis responsivos e Progressive Web Apps (PWA), eliminando o uso de pranchas de papel obsoletas.
3. **Inteligência Artificial Generativa e Automação Fiscal:** Emprego de IA (como a API Gemini) para transcrição de voz no diário de obra (RDO) e integração automatizada com órgãos fiscais (SEFAZ NFe) para conciliação logística de suprimentos sem digitação manual.

---

### 2.2 Evidências Empíricas e Modelos Matemáticos do Setor (EXAUSTIVAMENTE EXPANDIDO)

Para fundamentar cientificamente a necessidade impreterível da plataforma Obra360, compilaram-se evidências empíricas, relatórios estatísticos oficiais e formularam-se modelos matemáticos determinísticos que sustentam as Regras de Negócio do sistema.

#### 2.2.1 Análise Empírica Detalhada dos 4 Gargalos Críticos do Setor

1. **Estagnação Crônica da Produtividade (McKinsey & Company, 2020/2023):**  
   Estudos longitudinais do *McKinsey Global Institute* acompanhando o desempenho da indústria mundial demonstraram que a produtividade na construção civil cresceu a uma taxa média de apenas **1,0% ao ano nas últimas duas décadas**, enquanto a manufatura global avançou 2,8% ao ano no mesmo período. A pesquisa comprova que a adoção de ecossistemas digitais integrados e BIM possui o potencial de **elevar a produtividade do setor entre 14% e 15%** e reduzir os custos totais do empreendimento em até 6%.

2. **Perdas Físicas e Financeiras por Desperdício e Retrabalho (CBIC / USP / IPT):**  
   Segundo pesquisas do Departamento de Engenharia de Construção Civil da Escola Politécnica da USP e relatórios da CBIC, estima-se que **entre 5,0% e 8,0% do custo total de uma obra no Brasil é perdido em retrabalhos** causados por falhas de projeto e comunicação. Além disso, a perda física de materiais básicos no canteiro atinge índices alarmantes:
   - **Argamassa e Cimento:** 15,0% a 20,0% de perda em relação ao volume adquirido;
   - **Aço Estrutural (Armações):** 8,0% a 12,0% de perda devido a cortes e sobras não aproveitadas;
   - **Blocos Cerâmicos e Tijolos:** 10,0% a 15,0% de quebra por manuseio e transporte inadequados.

3. **Descumprimento de Prazos e Estouro Orçamentário (FGV-IBRE / INCC-M 2024):**  
   Dados consolidados do Instituto Brasileiro de Economia da Fundação Getulio Vargas (FGV-IBRE) revelam que **mais de 72% das obras residenciais e comerciais de médio e grande porte no Brasil sofrem atrasos superiores a 90 dias** em relação ao cronograma inicial. A decomposição das causas primárias aponta:
   - **38%:** Falhas e atrasos na entrega da cadeia de suprimentos B2B;
   - **26%:** Retrabalhos decorrentes de erros de compatibilização entre arquitetura e estrutura;
   - **20%:** Gestão ineficiente da mão de obra e ausência de apontamento diário (RDO);
   - **16%:** Condições climáticas desfavoráveis não registradas adequadamente.

4. **Litígios e Custos de Pós-Venda por Desempenho Habitacional (ABNT NBR 15575 / CBIC):**  
   Com a entrada em vigor da norma ABNT NBR 15575 (Norma de Desempenho de Edificações), o Poder Judiciário brasileiro passou a responsabilizar severamente construtoras por vícios construtivos ocultos em subsistemas. Pesquisas do setor indicam que o **custo da não-qualidade no pós-venda consome entre 2,0% e 4,0% do Valor Geral de Vendas (VGV)** das incorporadoras devido à falta de rastreabilidade de campo durante a fase de execução.

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
│ Custo de assistência técnica sem gestão │ CBIC (2023): 2,0% a 4,0% do VGV do projeto    │
└──────────────────────────────────────────┴───────────────────────────────────────────────┘
```

#### 2.2.2 Formulagem Matemática e Algoritmos Computacionais do Obra360

Para garantir precisão analítica e automatizar a tomada de decisão, o Obra360 incorpora quatro modelos matemáticos determinísticos em seu núcleo de negócios:

##### 1. Taxa de Consumo Real de Insumo por Metro Quadrado Executado ($C_{m^2}$):
Permite identificar desvios de materiais comparando o volume retirado do almoxarifado com a área fisicamente executada no canteiro:
$$C_{m^2} = \frac{\sum_{i=1}^{n} Qty_{SKU_i}}{\text{Área Executada } (m^2)}$$
*Regra de Tolerância:* Se $C_{m^2} > C_{previsto} \times (1 + \delta)$, onde $\delta = 0{,}03$ (3% de tolerância), o sistema dispara um alerta de auditoria de desvio para o Engenheiro Residente.

##### 2. Modelo da Curva S Sigmoidal Físico-Financeira Apropriada ($S(t)$):
Modelagem contínua do avanço financeiro acumulado do empreendimento ao longo do tempo $t$:
$$S(t) = \frac{\text{Orçamento\_Total}}{1 + e^{-k(t - t_0)}}$$
Onde:
- $k$: Coeficiente de aceleração do ritmo da obra;
- $t_0$: Ponto de inflexão (momento de pico de desembolso no meio do cronograma).

##### 3. Algoritmo SEFAZ Módulo 11 para Validação da Chave de NFe de 44 Dígitos:
Dada a chave de 43 dígitos $d_1, d_2, \dots, d_{43}$, aplicam-se os pesos $w_i \in [2, 9]$ da direita para a esquerda:
$$Suma = \sum_{i=1}^{43} (d_i \times w_i) \implies Resto = Suma \bmod 11$$
$$DV = \begin{cases} 0 & \text{se } Resto = 0 \text{ ou } Resto = 1 \\ 11 - Resto & \text{se } Resto \ge 2 \end{cases}$$
O sistema compara o $DV$ calculado com o 44º dígito da chave da NFe. Se divergente, a nota fiscal é rejeitada instantaneamente.

##### 4. Modelo de Cálculo das Tabelas SAC e PRICE para Financiamento Imobiliário em 360 Meses ($P_t$):
- **Tabela SAC (Sistema de Amortização Constante):**
  $$A = \frac{SD_0}{N}, \quad J_t = SD_{t-1} \times i, \quad P_t = A + J_t$$
- **Tabela PRICE (Prestação Constante):**
  $$P = SD_0 \times \left[ \frac{i (1+i)^N}{(1+i)^N - 1} \right]$$
  Com reajuste anual do saldo devedor pelo índice acumulado: $SD_{t} = SD_{t-1} \times (1 + \text{INCC}_{\text{acumulado}})$.

---

### 2.3 Justificativa Tecnológica e Padrões Arquiteturais
Do ponto de vista da Engenharia de Software Corporativa, a escolha da pilha tecnológica do Obra360 ampara-se nos padrões de mercado mais recomendados para sistemas SaaS Multi-Tenant resilientes:
- **Clean Architecture em 4 Camadas (Robert C. Martin):** Desacoplamento absoluto entre o *Domain* (entidades de engenharia), *Use Cases* (regras de aplicação), *Adapters* (controladores REST e repositórios) e *Frameworks* (Spring Boot 3.2, React 18, PostgreSQL).
- **Domain-Driven Design (DDD - Eric Evans):** Mapeamento do software amparado na Linguagem Ubíqua da construção civil (Canteiro, Diário de Obra, Insumo SKU, NFe, Terreno, Unidade Imobiliária, RDO, VBS/WBS).
- **Arquitetura Orientada a Eventos (Event-Driven PubSub):** Processamento não-bloqueante de movimentações de estoque, alertas de almoxarifado e atualizações de cronograma em tempo real via barramento interno.
- **Multi-Tenancy SaaS B2B/B2C:** Suporte a múltiplas organizações corporativas concorrentes no mesmo banco de dados com isolamento lógico absoluto por CNPJ/Tenant ID.

---

## 3. IDENTIFICAÇÃO DO PROJETO, STAKEHOLDERS E PERFIS IAM/SoD

### 3.1 Ficha Técnica do Projeto
- **Nome Oficial:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário
- **Instituição:** Faculdade AESA-CESA (Arcoverde/PE) — Projeto Interdisciplinar de Engenharia de Software (2026)
- **Autores:** João Pedro e Marcos Henrique | **Orientador:** Prof. Dennys Carvalho
- **Público-Alvo:** Construtoras, incorporadoras, escritórios de engenharia/arquitetura, fornecedores B2B, locadoras de frotas, imobiliárias, corretores, investidores e compradores finais.
- **Tipologias Suportadas:** Casas, Condomínios Fechados, Edifícios, Hospitais, Galpões, Infraestrutura, Túneis e Usinas Fotovoltaicas.

---

### 3.2 Mapeamento de Stakeholders

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

### 3.3 Perfis de Usuários e Matriz SoD (11 Perfis Granulares)

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
1. `SUPER_ADMIN`: Gestão global de tenants, permissões e auditoria. Vedação: Operação simulada sem log.
2. `GERENTE_OBRA`: Aprovação orçamentária, cronograma e viabilidade. Vedação: Alterar logs imutáveis.
3. `ENGENHEIRO`: Medições 3D BIM, laudos técnicos e aprovação RDO. Vedação: Alteração de permissões IAM.
4. `ARQUITETO`: Versionamento de projetos IFC/DWG e design espacial 3D. Vedação: Baixa em almoxarifado.
5. `MESTRE_OBRA`: Lançamento diário de RDO por voz e laudos NR-18. Vedação: Alteração de valores de vendas.
6. `ALMOXARIFE`: Conciliação NFe 44 dígitos e controle SKU. Vedação: Aprovação de medições de engenharia.
7. `FINANCEIRO`: Orçado x realizado e fluxo de pagamentos B2B. Vedação: Alterar status de execução física.
8. `FORNECEDOR`: Resposta a RFQs e cadastro de frotas pesadas. Vedação: Acesso a dados internos de custos.
9. `CORRETOR`: Espelho de vendas em tempo real e simulações. Vedação: Alterar cronograma do canteiro.
10. `INVESTIDOR`: Acompanhamento de curva S e índice VGV. Vedação: Alterar dados operacionais de campo.
11. `CLIENTE`: Diário Transparente e chamados NBR 15575. Vedação: Acesso a custos e dados de outras unidades.

---

## 4. OBJETIVOS DO PROJETO

### 4.1 Objetivo Geral
Desenvolver e implementar uma plataforma corporativa web integrada baseada nos padrões de Clean Architecture e Domain-Driven Design (DDD) para centralizar a gestão, a execução e a comercialização de empreendimentos imobiliários e de infraestrutura, conectando todos os atores do ecossistema da construção civil em um ambiente Multi-Tenant unificado com sincronização assíncrona em tempo real.

---

### 4.2 Objetivos Específicos
1. **Levantar Requisitos:** Mapear necessidades junto aos 11 perfis IAM.
2. **Projetar Clean Architecture:** Estruturar backend Java em 4 camadas.
3. **Implementar PubSub:** Barramento de eventos assíncronos para atualizações em tempo real.
4. **Motor 3D/BIM e Extrusão 2D:** Visualizador WebGL Three.js com AI CAD Parser.
5. **Conciliação NFe SEFAZ:** Importação e validação de chaves de 44 dígitos.
6. **Marketplace B2B e Frotas:** Emissão de RFQs e locação de máquinas pesadas.
7. **Assistente RDO por Voz:** Transcrição e inteligência artificial (Gemini IA).
8. **Fiscalização ISO 9001 e NR-18:** Registro de ocorrências com fotos e severidade.
9. **Portal do Proprietário e Vendas:** Espelho de vendas e simulador em 360 meses.
10. **Central NBR 15575:** Chamados de garantia pós-obra com SLA 24h.
11. **Governança LGPD:** Exportação em JSON (Art. 18) e esquecimento de dados.
12. **Testes Automatizados:** Cobertura via JUnit 5 e Playwright E2E.

---

## 5. ARQUITETURA DE SOFTWARE E VISÃO C4 MODEL

### 5.1 Visão Geral da Arquitetura C4 Model

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                C4 MODEL - VISÃO DE CONTÊINERES                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌───────────────────────┐         HTTPS / JWT         ┌──────────────────────────────┐  │
│  │   Frontend Web App    ├────────────────────────────►│     Backend API REST Java    │  │
│  │ React 18 + Three.js   │                             │  Spring Boot 3.2 / Clean Arch│  │
│  └───────────────────────┘                             └──────────────┬───────────────┘  │
│                                                                       │                  │
│                                                ┌──────────────────────┼────────────────┐ │
│                                                ▼                      ▼                ▼ │
│                                       ┌────────────────┐    ┌──────────────────┐ ┌─────┴┐│
│                                       │ PostgreSQL 16  │    │ EventBus PubSub  │ │SEFAZ││
│                                       │ (Multi-Tenant) │    │  (In-Memory/MQ)  │ │ NFe ││
│                                       └────────────────┘    └──────────────────┘ └─────┘│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Modelo Conceitual Entidade-Relacionamento (DER)

```
┌──────────────┐ 1    * ┌──────────────────────┐ 1    * ┌─────────────────────┐
│    Tenant    ├───────►│    Empreendimento    ├───────►│    Modelo3DElemento │
└──────┬───────┘        └──────────┬───────────┘        └─────────────────────┘
       │ 1                         │ 1
       │                           │
       ▼ *                         ▼ *
┌──────────────┐        ┌──────────────────────┐
│   Usuario    │        │  DocumentoProjeto    │
└──────────────┘        └──────────────────────┘
```

---

## 6. DETALHAMENTO EXAUSTIVO DOS 12 MÓDULOS DO SISTEMA

Nesta seção, o escopo do Obra360 é fatiado individualmente em **12 Módulos Funcionais**, detalhando **50 Regras de Negócio (RN-01 a RN-50)** e **30 Requisitos Funcionais (RF-01 a RF-30)**.

---

### 6.1 Módulo 1: Gestão Multi-Empresas (Multi-Tenant SaaS B2B/B2C) e Controle IAM/RBAC

#### 6.1.1 Descrição e Fluxo Operacional Detalhado
Gerenciamento de organizações corporativas (Construtoras, Projetistas, Fornecedores, Imobiliárias) e autenticação de usuários via tokens JWT Stateless com MFA. Todas as requisições injetam a chave `tenant_id` garantindo isolamento de banco de dados.

#### 6.1.2 Regras de Negócio (RN) do Módulo 1
- **RN-01 (Isolamento Lógico Absoluto de Tenant):** Filtro obrigatório de `tenant_id` em todas as consultas SQL/ORM.
- **RN-02 (Validação de CNPJ/CPF):** Verificação algorítmica de 14 dígitos (CNPJ) e 11 dígitos (CPF).
- **RN-03 (Segregação SoD):** Impedimento de acúmulo de papéis operacionais conflitantes.
- **RN-04 (Bloqueio por Inadimplência ou Suspensão do Tenant):** Tenants suspensos têm acesso bloqueado imediatamente.

#### 6.1.3 Requisitos Funcionais (RF) do Módulo 1
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-01** | Autenticação IAM/RBAC | Login JWT, MFA e controle dos 11 perfis SoD. | Essencial | Todos / `SUPER_ADMIN` |
| **RF-02** | Gestão Multi-Tenant | Cadastro e alternância de organizações corporativas. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA` |
| **RF-03** | Gestão de Colaboradores | Convite e vinculação de usuários a perfis no tenant. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA` |

---

### 6.2 Módulo 2: Gestão de Empreendimentos e Categorias de Obras

#### 6.2.1 Descrição e Fluxo Operacional Detalhado
Cadastro e parametrização de obras em 8 categorias construtivas (Casas, Condomínios, Edifícios, Hospitais, Galpões, Infraestrutura, Túneis e Energia Solar Fotovoltaica) com definição de centro de custos, área construída, ART/RRT e orçamento.

#### 6.2.2 Regras de Negócio (RN) do Módulo 2
- **RN-05 (Indicadores Únicos por Obra):** Centro de custos, orçamento, VGV e curva S isolados por obra.
- **RN-06 (Vínculo ART/RRT Obrigatório):** Obrigatoriedade de indicação de responsável técnico registrado no CREA/CAU.
- **RN-07 (Parametrização por Tipologia):** Habilitação de métricas específicas (MWp para energia solar, km para rodovias).
- **RN-08 (Travamento de Encerramento de Obra):** Obras só podem ser encerradas se não houver chamados pendentes.

#### 6.2.3 Requisitos Funcionais (RF) do Módulo 2
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-04** | Cadastro de Empreendimentos | Inclusão, edição e parametrização por categoria construtiva. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO` |
| **RF-05** | Painel de Indicadores de Obra | Dashboard com curva S, orçamento gasto e avanço físico %. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `INVESTIDOR` |

---

### 6.3 Módulo 3: Modelagem 3D Evolutiva (BIM) e Extrusão de Plantas 2D (AI CAD Parser)

#### 6.3.1 Descrição e Fluxo Operacional Detalhado
Motor gráfico Three.js/WebGL com ferramenta procedural de extrusão de plantas 2D (AI CAD Parser) para elevação de paredes e posicionamento de elementos 3D (sapatas, pilares, vigas, lajes, telhados, esquadrias). Slider de linha do tempo evolutiva (Semanas 1 a 8).

#### 6.3.2 Regras de Negócio (RN) do Módulo 3
- **RN-09 (Modelo 3D Exclusivo por Obra):** Vinculação estrita da geometria 3D ao ID do empreendimento.
- **RN-10 (Autoria de Modificação Espacial):** Alterações reservadas aos perfis técnicos credenciados.
- **RN-11 (Linha do Tempo Evolutiva):** Atualização dinâmica da cor/transparência do modelo conforme status semanal.
- **RN-12 (Cálculo de Volume e Insumos 3D):** Extração automática de volume ($m^3$) de concreto e $m^2$ de alvenaria.

#### 6.3.3 Requisitos Funcionais (RF) do Módulo 3
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-06** | Visualização 3D BIM WebGL | Renderização tridimensional com navegação e inspeção de propriedades. | Essencial | Todos os Perfis |
| **RF-07** | Construtor BIM 3D | Inserção e edição de elementos estruturais procedurais. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-08** | Extrusão 2D AI CAD Parser | Elevação automática de plantas 2D em paredes tridimensionais. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-09** | Slider de Linha do Tempo | Simulação do avanço físico semanal (Semanas 1 a 8). | Importante | Todos os Perfis |

---

### 6.4 Módulo 4: Central de Projetos e Gerenciamento Documental Versionado (IFC / DWG / PDF)

#### 6.4.1 Descrição e Fluxo Operacional Detalhado
Repositório EDMS para arquivos OpenBIM (IFC4), desenhos CAD (DWG) e memoriais executivos (PDF) com controle de revisão (`v1.0`, `v2.0`) e status de aprovação.

#### 6.4.2 Regras de Negócio (RN) do Módulo 4
- **RN-13 (Imutabilidade de Revisões):** O upload de nova versão preserva as anteriores para auditoria.
- **RN-14 (Bloqueio de Downloads Obsoletos):** Bloqueio de pranchas rejeitadas ou obsoletas no canteiro.
- **RN-15 (Aprovação Técnica Obrigatória):** Liberação para o canteiro mediante carimbo digital do Engenheiro.
- **RN-16 (Verificação de Compatibilidade BIM):** Registro de interferências técnicas (Clash Detection).

#### 6.4.3 Requisitos Funcionais (RF) do Módulo 4
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-10** | Repositório Documental Versionado | Upload, versionamento e aprovação de arquivos IFC/DWG/PDF. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-11** | Visualizador de Projetos PDF/CAD | Exibição de desenhos técnicos e marcação de revisões na web. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `ARQUITETO`, `MESTRE_OBRA` |

---

### 6.5 Módulo 5: Almoxarifado, Controle de Estoque por SKU e Conciliação NFe (44 dígitos)

#### 6.5.1 Descrição e Fluxo Operacional Detalhado
Gestão logística de materiais por código SKU e conciliação automática de Notas Fiscais Eletrônicas via chave de 44 dígitos da SEFAZ (validação módulo 11).

#### 6.5.2 Regras de Negócio (RN) do Módulo 5
- **RN-17 (Validação NFe Módulo 11):** Validação algorítmica estrita da chave de 44 dígitos SEFAZ.
- **RN-18 (Rastreabilidade de Saída por Frente de Trabalho):** Vínculo obrigatório da saída de material ao recebedor e etapa da obra.
- **RN-19 (Alerta de Estoque Mínimo):** Disparo automático de alerta de compra ao atingir a reserva crítica.
- **RN-20 (Bloqueio de Saldo Negativo):** O sistema impede saídas de estoque superiores ao saldo físico disponível.
- **RN-21 (Inventário e Ajuste Auditado):** Ajustes manuais de estoque exigem justificativa e aprovação do Gerente.

#### 6.5.3 Requisitos Funcionais (RF) do Módulo 5
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-12** | Conciliação NFe 44 Dígitos | Importação de notas fiscais SEFAZ com validação de chave. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ALMOXARIFE`, `FINANCEIRO` |
| **RF-13** | Controle de Estoque por SKU | Gestão de saídas, entradas, saldos e alertas de estoque mínimo. | Essencial | `SUPER_ADMIN`, `ENGENHEIRO`, `MESTRE_OBRA`, `ALMOXARIFE` |
| **RF-14** | Relatório de Consumo por $m^2$ | Apuração exata do consumo de materiais por área executada. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `FINANCEIRO` |

---

### 6.6 Módulo 6: Marketplace B2B (Cotações RFQ & Frotas Pesadas)

#### 6.6.1 Descrição e Fluxo Operacional Detalhado
Portal de negociação B2B para abertura de cotações de insumos (RFQ - Request for Quotation) com quadro comparativo de propostas e contratação de locação de frotas/máquinas pesadas.

#### 6.6.2 Regras de Negócio (RN) do Módulo 6
- **RN-22 (Cotação Cega B2B):** Fornecedores não enxergam valores concorrentes durante o edital aberto.
- **RN-23 (Aprovação por Alçada Orçamentária):** Cotações acima do orçamento aprovado exigem aprovação do Gerente.
- **RN-24 (Gestão de Contratos de Frotas):** Exigência de horímetro/km inicial e contrato assinado para locação.
- **RN-25 (Avaliação de Fornecedores B2B):** Avaliação de pontualidade e qualidade dos fornecedores no marketplace.

#### 6.6.3 Requisitos Funcionais (RF) do Módulo 6
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-15** | Cotações B2B (RFQ) | Emissão de edital de cotação e geração de mapa comparativo. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `FORNECEDOR` |
| **RF-16** | Locação de Frotas Pesadas | Reserva e gestão de contratos de escavadeiras, guindastes e caminhões. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `FORNECEDOR` |

---

### 6.7 Módulo 7: Execução, Diário de Obra (RDO por Voz/Gemini IA) e Fiscalização ISO 9001 / NR-18

#### 6.7.1 Descrição e Fluxo Operacional Detalhado
Lançamento móvel de campo do Diário de Obra (RDO) assistido por voz e inteligência artificial (Gemini IA), acompanhado do registro de não-conformidades técnicas ISO 9001 e laudos NR-18.

#### 6.7.2 Regras de Negócio (RN) do Módulo 7
- **RN-26 (Fechamento Diário do RDO):** RDO do dia deve ser finalizado até às 23h59.
- **RN-27 (Escalonamento Crítico NR-18):** Ocorrências de severidade "Alta" paralisam a etapa e notificam a diretoria.
- **RN-28 (Evidência Fotográfica Obrigatória):** Exigência de anexo de foto para registrar não-conformidades.
- **RN-29 (Verificação de Condições Climáticas):** Registro obrigatório do clima (Claro, Chuvoso, Impracticável).
- **RN-30 (Baixa em Ação Corretiva):** Baixa em não-conformidade exige nova foto do reparo e aceite do Engenheiro.

#### 6.7.3 Requisitos Funcionais (RF) do Módulo 7
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-17** | Diário de Obra RDO por Voz | Ditado por voz com estruturação de efetivo e clima via Gemini IA. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA` |
| **RF-18** | Fiscalização NR-18 / ISO 9001 | Registro de inspeções, fotos, severidade e laudos de segurança. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA`, `AUDITOR` |
| **RF-19** | Registro de Apontamento de Efetivo | Controle de presença da equipe própria e terceirizada no canteiro. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `MESTRE_OBRA` |

---

### 6.8 Módulo 8: Comercialização Imobiliária (Espelho de Vendas, Unidades & Simulador Financeiro)

#### 6.8.1 Descrição e Fluxo Operacional Detalhado
Gestão comercial do inventário de unidades imobiliárias com espelho de vendas interativo em tempo real e simulador de parcelamento em até 360 meses nas tabelas SAC e PRICE.

#### 6.8.2 Regras de Negócio (RN) do Módulo 8
- **RN-31 (Bloqueio por Reserva Comercial):** Reserva altera status para "Reservada" por até 48h.
- **RN-32 (Integridade da Tabela de Vendas):** Aplicação estrita das tabelas e índices vigentes (INCC/IGP-M).
- **RN-33 (Bloqueio de Venda Duplicada):** Impedimento físico de venda para unidades com contrato assinado.
- **RN-34 (Aprovação de Proposta Comercial):** Propostas com desconto exigem aprovação da diretoria comercial.

#### 6.8.3 Requisitos Funcionais (RF) do Módulo 8
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-20** | Espelho de Vendas em Tempo Real | Grid interativo de status de unidades (Disponível, Reservado, Vendido). | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `CORRETOR`, `INVESTIDOR` |
| **RF-21** | Simulador Financeiro (360 Meses) | Calculadora de financiamento SAC/PRICE com reajuste por índices oficiais. | Desejável | `SUPER_ADMIN`, `CORRETOR`, `CLIENTE`, `INVESTIDOR` |
| **RF-22** | Gestão de Reservas e Contratos | Emissão de propostas e controle do prazo de validade da reserva. | Importante | `SUPER_ADMIN`, `FINANCEIRO`, `CORRETOR` |

---

### 6.9 Módulo 9: Portal do Proprietário / Investidor e Diário Transparente de Obra

#### 6.9.1 Descrição e Fluxo Operacional Detalhado
Canal B2C de relacionamento e transparência para o comprador final ou investidor acompanhar o percentual de avanço físico ($m^2$ executados), galeria de fotos e cronograma de entregas.

#### 6.9.2 Regras de Negócio (RN) do Módulo 9
- **RN-35 (Segregação de Visibilidade B2C):** Cliente visualiza apenas dados da sua unidade e áreas comuns.
- **RN-36 (Curadoria de Conteúdo Público):** Aprovação prévia do Engenheiro para fotos publicadas.
- **RN-37 (Notificação de Marcos de Entrega):** Envio automático de avisos ao concluir etapas macro da obra.

#### 6.9.3 Requisitos Funcionais (RF) do Módulo 9
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-23** | Portal do Proprietário B2C | Dashboard com avanço físico %, fotos e comunicados oficiais. | Essencial | `SUPER_ADMIN`, `CLIENTE`, `INVESTIDOR` |
| **RF-24** | Galeria de Fotos e Marcos da Obra | Histórico fotográfico em alta resolução do avanço da construção. | Importante | `SUPER_ADMIN`, `CLIENTE`, `INVESTIDOR` |

---

### 6.10 Módulo 10: Gestão de Garantias Pós-Obra e Assistência Técnica (ABNT NBR 15575 / SLA 24h)

#### 6.10.1 Descrição e Fluxo Operacional Detalhado
Central de pós-venda para abertura e triagem de chamados de assistência técnica após a entrega das chaves, categorizados pelos subsistemas da Norma de Desempenho ABNT NBR 15575 com SLA de 24h.

#### 6.10.2 Regras de Negócio (RN) do Módulo 10
- **RN-38 (Vigência de Garantia por Subsistema NBR 15575):** Validação da data da chave e prazo legal do subsistema.
- **RN-39 (Escalonamento por Estouro de SLA 24h):** Notificação automática para a diretoria em chamados não atendidos em 24h.
- **RN-40 (Termo de Aceite do Cliente):** Encerramento da OS exige assinatura digital do proprietário.
- **RN-41 (Classificação de Mal Uso vs Vício Construtivo):** Laudo técnico obrigatório para recusa de chamado por mau uso.

#### 6.10.3 Requisitos Funcionais (RF) do Módulo 10
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-25** | Chamados NBR 15575 e SLA 24h | Abertura de chamados por subsistema construtivo e controle de SLA. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `CLIENTE` |
| **RF-26** | Ordens de Serviço (OS) de Reparo | Emissão, agendamento de vistoria e acompanhamento de reparos. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO` |

---

### 6.11 Módulo 11: Chat Corporativo B2B e Central de Mensagens Instantâneas

#### 6.11.1 Descrição e Fluxo Operacional Detalhado
Canal de mensageria instantânea integrado para comunicação direta entre engenheiros, almoxarifado, financeiro, fornecedores B2B e corretores, vinculado ao contexto operacional.

#### 6.11.2 Regras de Negócio (RN) do Módulo 11
- **RN-42 (Vinculação Contextual):** Salas de chat associadas obrigatoriamente a uma obra, RFQ ou chamado.
- **RN-43 (Histórico Auditável Não-Apagável):** Proibição de exclusão de mensagens para garantir rastreabilidade.
- **RN-44 (Suporte a Anexos Técnicos):** Envio de fotos, desenhos PDF e arquivos de áudio no chat.

#### 6.11.3 Requisitos Funcionais (RF) do Módulo 11
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-27** | Chat Corporativo B2B Instantâneo | Troca de mensagens em tempo real vinculada ao contexto da obra. | Desejável | Todos os Perfis Cadastrados |
| **RF-28** | Central de Notificações Push/PubSub | Notificações internas de alertas de canteiro, estoque e cotações. | Importante | Todos os Perfis Cadastrados |

---

### 6.12 Módulo 12: Trilha Imutável de Auditoria (Audit Trail / ISO 9001) e Governança LGPD (Art. 18)

#### 6.12.1 Descrição e Fluxo Operacional Detalhado
Registro imutável (*Audit Trail*) de transações em regime *append-only* para conformidade ISO 9001 e central de direitos do titular de dados conforme a LGPD (Lei 13.709/2018).

#### 6.12.2 Regras de Negócio (RN) do Módulo 12
- **RN-45 (Imutabilidade Absoluta da Auditoria):** Registros de log gravados em tabela *append-only* inalterável.
- **RN-46 (Anonimização Irreversível LGPD):** Mascaramento de dados PII em solicitações de esquecimento.
- **RN-47 (Exportação JSON em até 48h):** Disponibilização do relatório de portabilidade em JSON estruturado.
- **RN-48 (Registro de IP e User-Agent):** Todo log captura obrigatoriamente e-mail, IP, timestamp e payload.
- **RN-49 (Alerta de Tentativa de Acesso Indevido):** Registro de falhas de autenticação recorrentes.
- **RN-50 (Retenção Legal de Logs):** Manutenção dos registros de auditoria pelo prazo legal mínimo de 5 anos.

#### 6.12.3 Requisitos Funcionais (RF) do Módulo 12
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-29** | Log Imutável de Auditoria | Registro auditável de ações de usuários para conformidade ISO 9001. | Essencial | `SUPER_ADMIN`, `AUDITOR` |
| **RF-30** | Central de Privacidade e Portabilidade LGPD | Exportação de dados do titular em JSON (Art. 18) e fluxo de anonimização. | Essencial | `SUPER_ADMIN`, `AUDITOR`, `CLIENTE` (dados próprios) |

---

## 7. REQUISITOS NÃO FUNCIONAIS (RNF-01 a RNF-10)

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

## 8. PREMISSAS, RESTRIÇÕES E EXCLUSÕES DO ESCOPO

### 8.1 Premissas do Projeto
1. **Disponibilidade de Dispositivos e Navegadores Modernos:** Dispositivos com navegadores atualizados e suporte WebGL.
2. **Adesão de Parceiros B2B:** Cadastro de fornecedores e locadoras para responder cotações RFQ.
3. **Conectividade Intermitente:** Cache offline PWA sincronizado assincronamente ao reconectar.

---

### 8.2 Restrições do Projeto
1. **Prazo Rígido Acadêmico:** Conclusão dentro do calendário acadêmico da AESA-CESA.
2. **Arquitetura Obrigatória:** Backend em Java 21 + Spring Boot 3.2 com Clean Architecture e DDD.
3. **Restrição Orçamentária:** Uso exclusivo de ferramentas Open Source e planos gratuitos Cloud.

---

### 8.3 Exclusões Deliberadas do Escopo (Fronteiras do Projeto)
1. **Gateways de Pagamento Reais:** Sem adquirentes financeiras reais; vendas operam como simulador e reserva comercial.
2. **Parsing Nativo de Arquivos Proprietários .RVT:** O 3D opera via OpenBIM `.ifc`, pranchas `.dwg` e `.pdf`.
3. **Aplicativos Nativos iOS/Android:** Mobilidade atendida via Progressive Web App (PWA).
4. **Assinatura Digital ICP-Brasil (A1/A3):** Uso de carimbo digital interno auditado por e-mail, IP e timestamp.
5. **Hardware IoT Físico no Canteiro:** Escopo restrito ao software sem fornecimento de sensores físicos ou RFID.
6. **Renderização de Nuvem de Pontos (Point Cloud):** Foco em malhas poligonais procedurais BIM.
7. **Suporte Multilíngue (i18n):** Plataforma disponibilizada exclusivamente em Português (pt-BR).

---

## 9. MATRIZ GERAL DE RASTREABILIDADE

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                MATRIZ DE RASTREABILIDADE                                 │
├───────┼───────────────────────┼─────────────────────────────┼────────────────────────────┤
│ ID RF │ Módulo Relacionado    │ Caso de Uso (Use Case Java) │ Suíte de Teste Automatizado│
├───────┼───────────────────────┼─────────────────────────────┼────────────────────────────┤
│ RF-01 │ Módulo 1 (IAM/RBAC)   │ AuthenticateUserUseCase     │ AuthIntegrationTest.java   │
│ RF-02 │ Módulo 1 (Multi-Tenant│ SwitchTenantUseCase         │ TenantIsolationTest.java   │
│ RF-04 │ Módulo 2 (Empreend.)  │ CreateEmpreendimentoUseCase │ EmpreendimentoTest.java    │
│ RF-06 │ Módulo 3 (BIM 3D)     │ RenderModel3DUseCase        │ ThreeJsRenderSpec.ts       │
│ RF-08 │ Módulo 3 (Extrusão 2D)│ Extrude2DPlanUseCase        │ CadParserTest.java         │
│ RF-10 │ Módulo 4 (Documentos) │ VersionDocumentUseCase      │ DocumentRepositoryTest.java│
│ RF-12 │ Módulo 5 (NFe 44dig)  │ ImportNfeSefazUseCase       │ NfeMódulo11ValidatorTest   │
│ RF-13 │ Módulo 5 (SKU Estoque)│ MoveStockItemUseCase        │ StockMovementTest.java     │
│ RF-15 │ Módulo 6 (RFQ B2B)    │ ProcessRfqBidUseCase        │ RfqMarketplaceTest.java    │
│ RF-17 │ Módulo 7 (RDO Voz IA) │ GenerateRdoFromAudioUseCase │ GeminiIaRdoParserTest.java │
│ RF-18 │ Módulo 7 (NR-18/ISO)  │ RegisterInspectionUseCase   │ InspectionLogTest.java     │
│ RF-20 │ Módulo 8 (Vendas 360) │ ReserveUnitUseCase          │ RealEstateSalesTest.java   │
│ RF-21 │ Módulo 8 (Simulador)  │ CalculateFinancingUseCase   │ FinancingCalculatorTest    │
│ RF-23 │ Módulo 9 (Portal B2C) │ GetOwnerDashboardUseCase    │ OwnerPortalE2E.spec.ts     │
│ RF-25 │ Módulo 10 (NBR 15575) │ OpenWarrantyTicketUseCase   │ Nbr15575SLA24hTest.java    │
│ RF-27 │ Módulo 11 (Chat B2B)  │ SendChatMessageUseCase      │ ChatPubSubTest.java        │
│ RF-29 │ Módulo 12 (Auditoria) │ LogAuditEventUseCase        │ AuditTrailAppendOnlyTest   │
│ RF-30 │ Módulo 12 (LGPD)      │ ExportUserDataJsonUseCase   │ LgpdPortabilityTest.java   │
└───────┴───────────────────────┴─────────────────────────────┴────────────────────────────┘
```

---

## 10. CRITÉRIOS DE ACEITAÇÃO DO PROJETO

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

## 11. GERENCIAMENTO DE RISCOS INICIAIS E PLANO DE MITIGAÇÃO

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MATRIZ DE RISCOS DO PROJETO                              │
├───────┬───────────────────────────────┬─────────────┬───────────┬────────────────────────┤
│ ID    │ Descrição do Risco            │ Probabilidade│ Impacto   │ Plano de Mitigação     │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-01  │ Expansão excessiva de escopo  │ Média       │ Alto      │ Adotar estritamente as │
│       │ (Scope Creep) durante o semestre│           │           │ exclusões do item 8.3. │
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

## 12. ENTREGÁVEIS TANGÍVEIS E ENCERRAMENTO

### 12.1 Entregáveis Tangíveis
1. **Código-Fonte Completo da Aplicação:** Repositório Git contendo o Frontend (React 18 + TypeScript + Vite + Tailwind CSS), Backend (Java 21 + Spring Boot 3.2 + Spring Security) e scripts de banco de dados (Flyway SQL).
2. **Documentação Arquitetural e de Requisitos:** DDE v3.1 consolidado, especificação de requisitos, registros de decisão arquitetural (ADRs) e diagramas UML/C4 Model.
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
