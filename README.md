# 🏗️ Obra360 — Plataforma Corporativa Integrada da Construção Civil e Mercado Imobiliário

[![Build & Test Status](https://img.shields.io/badge/E2E%20Tests-23%20Passed%20(100%25)-success?style=for-the-badge&logo=playwright)](https://playwright.dev/)
[![React Version](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Three.js-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Java%2021%20%2B%20Spring%20Boot%203-brightgreen?style=for-the-badge&logo=springboot)](https://spring.io/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%203FN%20(Flyway%20V3)-blue?style=for-the-badge&logo=postgresql)](https://flywaydb.org/)
[![Compliance](https://img.shields.io/badge/Compliance-LGPD%20%7C%20ISO%209001%20%7C%20NR--18-orange?style=for-the-badge)](#-seguran%C3%A7a-governan%C3%A7a-e-conformidade-lgpd)

---

## 📌 Sumário
1. [Sobre o Projeto](#-sobre-o-projeto)
2. [Identificação Acadêmica e Técnica](#-identifica%C3%A7%C3%A3o-acad%C3%AAmica-e-t%C3%A9cnica)
3. [Arquitetura de Software](#-arquitetura-de-software)
   - [Padrões Arquiteturais e de Projeto](#padr%C3%B5es-arquiteturais-e-de-projeto)
   - [Estrutura do Banco de Dados (Flyway V3 em 3FN)](#estrutura-do-banco-de-dados-flyway-v3-em-3fn)
4. [Módulos do Sistema (14 Módulos Operacionais)](#-m%C3%B3dulos-do-sistema-14-m%C3%B3dulos-operacionais)
5. [Matriz de Governança e Perfis RBAC (14 Papéis)](#-matriz-de-governan%C3%A7a-e-perfis-rbac-14-pap%C3%A9is)
6. [Regras de Negócio Centrais](#-regras-de-neg%C3%B3cio-centrais)
7. [Segurança, Governança e Conformidade LGPD](#-seguran%C3%A7a-governan%C3%A7a-e-conformidade-lgpd)
8. [Suíte de Testes Automatizados (Playwright E2E)](#-su%C3%ADte-de-testes-automatizados-playwright-e2e)
9. [Tutorial Completo de Instalação e Execução](#-tutorial-completo-de-instala%C3%A7%C3%A3o-e-execu%C3%A7%C3%A3o)
   - [Pré-requisitos](#pr%C3%A9-requisitos)
   - [Executando o Frontend](#1-executando-o-frontend)
   - [Executando os Testes E2E](#2-executando-os-testes-e2e-playwright)
   - [Executando o Backend Spring Boot](#3-executando-o-backend-spring-boot)
   - [Executando com Docker Compose](#4-executando-com-docker-compose)
10. [Estrutura de Pastas do Repositório](#-estrutura-de-pastas-do-reposit%C3%B3rio)
11. [Licença e Autoria](#-licen%C3%A7a-e-autoria)

---

## 📖 Sobre o Projeto

O **Obra360** é um ecossistema digital corporativo SaaS Multi-Tenant (B2B/B2C) projetado para centralizar, integrar e rastrear de ponta a ponta o ciclo de vida completo de empreendimentos na **Construção Civil e no Mercado Imobiliário**.

Historicamente, o setor da construção enfrenta graves perdas de produtividade decorrentes de fragmentação da informação, silos de dados entre fornecedores e empreiteiras, assimetria de comunicação e falta de rastreabilidade fiscal e física. 

A plataforma Obra360 soluciona esses desafios unificando:
- **Modelagem Espacial 3D BIM & OpenBIM (IFC)** em tempo real no navegador;
- **Central de Projetos (GED)** com versionamento e esteira de aprovação;
- **Controle de Canteiro de Obras** com emissão de Ordens de Serviço (OS), boletins de medição físico-financeira e Curva S executiva;
- **Almoxarifado & Compras B2B** integrado à **Conciliação Fiscal de NF-e por Chave de 44 Dígitos (Validação Módulo 11 da SEFAZ)**;
- **Espelho de Vendas Interativo** com simulador de amortização SAC e PRICE corrigido pelo INCC-M;
- **Portal do Proprietário e Pós-Vendas (Garantias)** para assistência técnica e transparência ao cliente final;
- **Governança Estrita RBAC (14 perfis)** e **Trilha de Auditoria Imutável (NoSQL/MongoDB)**.

---

## 🎓 Identificação Acadêmica e Técnica

- **Título do Projeto:** Obra360 — Plataforma Corporativa Integrada da Construção Civil e Mercado Imobiliário
- **Autores:** João Pedro e Marcos Henrique
- **Disciplina:** Projeto Interdisciplinar de Engenharia de Software
- **Professor Orientador:** Prof. Dennys Cavalcanti Carvalho
- **Padrões Normativos Adotados:** IEEE 830, ISO/IEC/IEEE 29148, ISO 9001 (Qualidade), NR-18 (Segurança do Trabalho no Canteiro), LGPD (Lei nº 13.709/2018), OWASP Top 10 e ABNT NBR 15575 (Desempenho de Edificações).

---

## 🏛️ Arquitetura de Software

O ecossistema adota os princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal (Ports & Adapters)**, garantindo que as regras de negócio permaneçam desacopladas de frameworks e detalhes de infraestrutura.

```
+-----------------------------------------------------------------------------------+
|                           CAMADA DE APRESENTAÇÃO (UI)                            |
|       React 18  *  Vite  *  Tailwind CSS  *  Three.js (BIM 3D)  *  Lucide Icons    |
+-----------------------------------------------------------------------------------+
                                        | (REST APIs / JWT / EventBus)
                                        v
+-----------------------------------------------------------------------------------+
|                        ADAPTADORES DE ENTRADA (CONTROLLERS)                       |
|       Spring MVC Controllers  *  Filtros JWT  *  Global Exception Handler         |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                         CAMADA DE APLICAÇÃO (USE CASES)                           |
|       Serviços de Aplicação  *  DTOs  *  Esteira CQRS  *  Event Publisher         |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                           CAMADA DE DOMÍNIO (CORE DDD)                            |
|       Entidades de Domínio  *  Value Objects (NfeKey)  *  GoF Patterns  *  Eventos |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                       ADAPTADORES DE SAÍDA (INFRAESTRUTURA)                       |
|  PostgreSQL (JPA/Hibernate)  *  Flyway Migrations  *  MongoDB  *  AWS S3  * Kafka |
+-----------------------------------------------------------------------------------+
```

### Padrões Arquiteturais e de Projeto
- **Domain-Driven Design (DDD):** Entidades com identidade clara, Agregados (`Projeto`, `OrdemServico`, `Empresa`), e Value Objects imutáveis (ex: `NfeKey` com validação matemática intrínseca).
- **GoF Strategy Pattern:** Estratégias intercambiáveis de cálculo de insumos (`materialCalculatorStrategy.ts`) e validação de chaves fiscais (`SefazNfeValidationStrategy`, `SintegraValidationStrategy`).
- **GoF Builder & Factory:** Instanciação controlada de entidades complexas com invariantes de negócio assegurados.
- **Transactional Outbox Pattern & EventBus:** Publicação confiável de eventos de negócio (`DOCUMENT_APPROVED`, `STAGE_PROGRESS_UPDATED`, `COMPANY_REGISTERED`) sem risco de perda em transações distribuídas.
- **Modo Híbrido Resiliente (Hybrid Fetch):** O frontend se conecta automaticamente ao backend Spring Boot via REST e autenticação Bearer JWT; caso o servidor esteja offline, ativa dinamicamente o *fallback* de simulação em memória com latência realista.

### Estrutura do Banco de Dados (Flyway V3 em 3FN)
O banco de dados relacional foi estruturado em **Terceira Forma Normal (3FN)** com **28 entidades corporativas** mapeadas nas migrações do Flyway (`V1`, `V2`, `V3__schema_completo_28_tabelas_corporativo.sql`):

1. `empresas` (Multi-Tenant)
2. `usuarios` (IAM & RBAC)
3. `perfis_acesso`
4. `usuario_perfis`
5. `empreendimentos`
6. `fases_obra`
7. `elementos_bim_3d`
8. `documentos_tecnicos`
9. `versoes_documento`
10. `fornecedores_b2b`
11. `categorias_insumo`
12. `itens_almoxarifado`
13. `movimentacoes_estoque`
14. `cotacoes_rfq_b2b`
15. `propostas_fornecedor`
16. `notas_fiscais_nfe`
17. `itens_nota_fiscal`
18. `equipes_trabalho`
19. `colaboradores_equipe`
20. `ordens_servico`
21. `apontamentos_diario_obra`
22. `ocorrencias_qualidade` (ISO 9001 / NR-18)
23. `boletins_medicao`
24. `itens_medicao_fisica`
25. `unidades_imobiliarias`
26. `contratos_venda`
27. `solicitacoes_garantia` (Pós-Vendas)
28. `auditoria_imutavel`

---

## 📦 Módulos do Sistema (14 Módulos Operacionais)

O sistema conta com 14 módulos funcionais com carregamento assíncrono sob demanda (*Lazy Code-Splitting*):

| Módulo | Identificador | Descrição e Funcionalidades Principais |
|---|:---:|---|
| **1. Modelo 3D BIM** | `3D` | Renderizador 3D WebGL (Three.js), visualização de elementos por fase construtiva, deformação e posicionamento espacial, e importação de modelos OpenBIM IFC. |
| **2. Dashboard Executivo** | `DASHBOARD` | KPIs globais de avanço físico x financeiro, Curva S executiva planejada vs realizada, monitor de VGV e saldo orçamentário. |
| **3. Central de Projetos (GED)** | `PROJETOS` | Gestão Eletrônica de Documentos técnicos (plantas, memoriais, pranchas 2D/3D), versionamento contínuo (v1.0, v2.0) e esteira de aprovação formal. |
| **4. Almoxarifado & Estoque** | `ESTOQUE` | Rastreamento de inventário físico, registro de entradas/saídas/perdas, cálculo de insumos por $m^2$ ($C_{m^2}$) e alertas automáticos de estoque mínimo. |
| **5. Ordens de Serviço & Equipes** | `ORDENS_SERVICO` | Emissão de OS de canteiro, despacho para mestres e encarregados, controle de prazos e alocação de mão de obra. |
| **6. Medições Físico-Financeiras** | `MEDICOES` | Apuração de percentual de avanço de serviços de canteiro, validação técnica por engenheiros e liberação de faturamento. |
| **7. Conciliação NF-e (44 Dígitos)** | `CONCILIACAO_NFE` | Validação fiscal algorítmica da Chave de Acesso de NF-e (44 dígitos via Módulo 11 SEFAZ) com alimentação imediata no estoque e auditoria. |
| **8. Chat B2B & Mensagens** | `MENSAGENS` | Canais de comunicação corporativa em tempo real entre construtora, canteiro, arquitetos e fornecedores. |
| **9. Marketplace B2B** | `MARKETPLACE` | Hub de cotações B2B (RFQ), locação de máquinas pesadas/frotas e leilão reverso de materiais de construção. |
| **10. Portal de Vendas Imobiliárias** | `VENDAS` | Espelho de vendas interativo de unidades (Disponível, Reservada, Vendida) com simulador de amortização SAC e PRICE (até 360 meses) com correção INCC-M. |
| **11. Portal do Proprietário** | `CLIENTE` | Área transparente do comprador com diário fotográfico da obra, cronograma de evolução da torre e documentos contratuais. |
| **12. Pós-Vendas & Garantia** | `POSVENDAS` | Portal de chamados de garantia técnica segundo a ABNT NBR 15575, prazos legais e controle de SLA de assistência técnica. |
| **13. Matriz RBAC & IAM** | `RBAC` | Matriz de governança corporativa, concessão e revogação de papéis e controle granular de permissões de acesso. |
| **14. Auditoria de Segurança** | `AUDITORIA` | Trilha de auditoria imutável (NoSQL/MongoDB) contendo registro detalhado de todas as mutações e transações executadas no sistema. |

---

## 👥 Matriz de Governança e Perfis RBAC (14 Papéis)

O sistema possui isolamento estrito de acesso através de **14 perfis operacionais**. Ao alternar o perfil de usuário, o roteamento automático do sistema redireciona a interface e oculta seletivamente módulos não autorizados:

1. **SUPER_ADMIN (Super Administrador TI):** Acesso irrestrito a todos os 14 módulos, governança RBAC e configurações globais.
2. **INCORPORADOR:** Visão macroestratégica, Dashboard Executivo, VGV, Vendas e aprovação de medições.
3. **GERENTE_OBRA:** Controle pleno de engenharia, cronograma, modelo 3D, almoxarifado, medições e canteiro.
4. **ENGENHEIRO:** Gestão técnica de campo, aprovação de projetos, emissão de OS, medições e vistorias.
5. **ARQUITETO:** Acesso prioritário à Central de Projetos (GED), modelos BIM 3D e compatibilização espacial.
6. **FINANCEIRO:** Foco em conciliação fiscal NF-e, medições físico-financeiras, fluxo de caixa e custos operacionais.
7. **FORNECEDOR:** Canal exclusivo de atendimento no Marketplace B2B e envio de propostas de fornecimento.
8. **LOCADOR_MAQUINAS:** Gestão e disponibilidade de frotas, equipamentos pesados e contratos de locação.
9. **MESTRE_OBRA:** Foco prático em canteiro de obras, execução de Ordens de Serviço e requisição de insumos ao almoxarifado.
10. **ALMOXARIFE:** Acesso restrito a movimentações de estoque, conciliação de notas fiscais de entrada e conferência de materiais.
11. **CORRETOR:** Acesso exclusivo ao Portal de Vendas Imobiliárias, espelho de unidades e simulação de crédito.
12. **INVESTIDOR:** Visualização executiva de progresso, relatórios gerenciais e acompanhamento de VGV.
13. **CLIENTE:** Portal do proprietário, acompanhamento fotográfico da sua unidade e abertura de chamados pós-vendas.
14. **AUDITOR:** Acesso exclusivo à Trilha de Auditoria imutável, laudos de qualidade ISO 9001 e compliance LGPD.

---

## ⚙️ Regras de Negócio Centrais

- **[RN-01] Validação Fiscal SEFAZ (Módulo 11):** Nenhuma Nota Fiscal Eletrônica pode ser conciliada sem conter exatamente 44 dígitos numéricos e validação matemática de seu Dígito Verificador (DV) através do algoritmo oficial Módulo 11 da Receita Federal/SEFAZ.
- **[RN-02] Isolamento Estrito de Perfis (RBAC):** Usuários de menor privilégio (ex: Corretor ou Cliente) têm bloqueio absoluto a dados operacionais de canteiro, almoxarifado, NF-e ou governança corporativa.
- **[RN-03] Multi-Tenancy e Isolamento de Projetos:** Dados e modelos espaciais 3D são particionados por Empresa (`companyId`) e Empreendimento (`projectId`), garantindo que um tenant nunca acesse informações de outro.
- **[RN-04] Rastreabilidade de Estoque e Consumo ($C_{m^2}$):** Toda saída de almoxarifado deve obrigatoriamente estar vinculada a uma Ordem de Serviço ou etapa construtiva ativa.
- **[RN-05] Transparência do Proprietário:** Fotos e relatos publicados no diário de obra tornam-se visíveis no portal do comprador somente após aprovação pelo Gerente de Obra.

---

## 🛡️ Segurança, Governança e Conformidade LGPD

- **Conformidade LGPD (Lei nº 13.709/2018):**
  - Banner de consentimento de cookies persistente com aceite explícito (`obra360_cookie_consent_v1`).
  - Funções de mascaramento de PII (`maskEmail`, `maskCnpj`, `maskPhone`) em relatórios e telas públicas.
  - Exportação e download estruturado de dados pessoais do titular em JSON (Art. 18 da LGPD - Direito à Portabilidade).
- **Segurança da Aplicação (OWASP Top 10):**
  - Sanitização de strings contra ataques de *Cross-Site Scripting* (XSS) em inputs de texto.
  - Autenticação stateless via Tokens JWT (JSON Web Tokens) com tempo de expiração curto.
  - Proteção contra ataques de força bruta (*Brute Force Protection Service*) e *Rate Limiting* por IP/usuário.
  - Respostas padronizadas para erros de API em conformidade com a RFC 7807 (*Problem Details*).

---

## 🧪 Suíte de Testes Automatizados (Playwright E2E)

A plataforma conta com uma suíte de testes de ponta a ponta (E2E) completa desenvolvida com **Playwright**, totalizando **23 testes automatizados** com **100% de taxa de sucesso**:

```
Running 23 tests using 1 worker

  ✓ 1. Deve validar todas as 14 abas operacionais como SUPER_ADMIN
  ✓ 2. Deve testar a regra da Conciliação Fiscal NF-e (Validação 44 dígitos - RN-01)
  ✓ 3. Deve testar funcionalidades operacionais de Canteiro: Ordem de Serviço & Medição
  ✓ 4. Deve testar o Marketplace B2B e Reserva Imobiliária em Vendas
  ✓ 5. Deve testar o isolamento rigoroso de permissões (RBAC) para diferentes perfis
  ✓ 6. Deve testar troca Multi-Tenant de Empresa e Empreendimento
  ✓ 7. Conexão API: api.companies.getAll(), projects, elements, stock e auditLogs
  ✓ 8. Conexão EventBus: Publicação e consumo de eventos entre módulos desacoplados
  ✓ 9. Conexão Sidebar → View: 14 abas entregam o componente lazy-loaded correto
  ✓ 10. Conexão localStorage: Tema, Auth, LGPD e maquetes 3D persistidos
  ✓ 11. Fluxo Multi-Tenant: Empresa → Projeto → Modelo 3D → Dados Contextuais
  ✓ 12. Conexão RBAC → Router: Redirecionamento automático por perfil de acesso
  ✓ 13. Toast Notification System: Conexão reativa de feedback visual
  ✓ 14. Lazy Loading (Code-Splitting): 12 módulos carregados sem erros JS
  ✓ 15. PWA Offline Detection: Listeners de status de conectividade
  ✓ 16. Fluxo E2E Integrado: NF-e → Entrada Almoxarifado → Registro de Auditoria
  ✓ 17. Deve carregar o título e a marca da plataforma Obra 360
  ✓ 18. Deve navegar entre todas as abas principais do sistema
  ✓ 19. Deve alternar entre perfis de acesso RBAC através do menu de perfil
  ✓ 20. Deve alternar entre o Modo Escuro e Modo Claro
  ✓ 21. Deve validar o funcionamento do mapa 3D com canvas Three.js
  ✓ 22. Deve abrir o gerenciador de modelos 3D e maquetes por projeto
  ✓ 23. Jornada Completa do Usuário no Ecossistema Obra 360

  23 passed (1.3m) — 0 failed!
```

---

## 🚀 Tutorial Completo de Instalação e Execução

### Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- **Node.js:** versão 18 ou superior (`node -v`)
- **NPM:** versão 9 ou superior (`npm -v`)
- **Java JDK:** versão 17 ou 21 (para o backend Spring Boot, opcional para testar o frontend)
- **Git:** para clonagem e versionamento

---

### 1. Executando o Frontend

Clone o repositório e instale as dependências:

```bash
# 1. Clonar o repositório
git clone https://github.com/JPedro01x/obra-360.git
cd obra-360

# 2. Instalar dependências do frontend
npm install

# 3. Iniciar o servidor de desenvolvimento Vite
npm run dev
```

A aplicação estará disponível em:
👉 **`http://localhost:3000`**

---

### 2. Executando os Testes E2E (Playwright)

Com o servidor de desenvolvimento rodando (ou permitindo que o Playwright gerencie o ciclo de vida):

```bash
# Executar toda a suíte de testes (23 testes)
npx playwright test

# Executar apenas a suíte de auditoria completa
npx playwright test tests/e2e/comprehensive-system-audit.spec.ts --reporter=list

# Executar a auditoria de conexões do sistema
npx playwright test tests/e2e/connections-audit.spec.ts --reporter=list

# Visualizar o relatório interativo HTML dos testes
npx playwright show-report
```

---

### 3. Executando o Backend Spring Boot

O backend está localizado no diretório `obra360-backend/`:

```bash
# Entrar no diretório do backend
cd obra360-backend

# Compilar e executar os testes unitários/integração
mvn clean test

# Iniciar a aplicação Spring Boot
mvn spring-boot:run
```

O backend estará ativo em:
👉 **`http://localhost:8080/api`**  
👉 Documentação Swagger OpenAPI: **`http://localhost:8080/swagger-ui.html`**

---

### 4. Executando com Docker Compose

Caso deseje subir todo o ecossistema (Frontend, Backend Spring Boot, Banco PostgreSQL e pgAdmin) com um único comando:

```bash
# Na raiz do projeto
docker-compose up --build -d
```

---

## 📂 Estrutura de Pastas do Repositório

```
obra-360/
├── .github/
│   └── workflows/
│       └── ci.yml               # Esteira de CI/CD automatizada do GitHub Actions
├── obra360-backend/             # Backend Corporativo Java 21 / Spring Boot 3
│   ├── pom.xml                  # Gerenciador de dependências Maven
│   └── src/
│       ├── main/
│       │   ├── java/com/obra360/
│       │   │   ├── domain/      # Entidades, Value Objects, GoF Patterns
│       │   │   ├── application/ # Use Cases, DTOs e Regras de Negócio
│       │   │   └── infrastructure/ # Spring Controllers, JPA, Security
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/ # Scripts Flyway (V1, V2, V3 com 28 tabelas)
│       └── test/                # Testes automatizados JUnit 5 e MockMvc
├── src/                         # Frontend React 18 + Vite + Three.js
│   ├── components/              # 14 Módulos operacionais e componentes de UI
│   │   ├── BimViewer3D.tsx      # Renderizador 3D WebGL / OpenBIM IFC
│   │   ├── ExecutiveDashboard.tsx # KPIs globais e Curva S
│   │   ├── NfeConciliationView.tsx # Validação Módulo 11 SEFAZ
│   │   ├── RealEstateStorefrontView.tsx # Espelho de Vendas SAC/PRICE
│   │   ├── RoleSimulationModal.tsx # Simulador Dev dos 14 perfis RBAC
│   │   └── ...
│   ├── data/
│   │   └── mockData.ts          # Datasets iniciais realistas de obras e empresas
│   ├── services/
│   │   ├── api.ts               # Camada de casos de uso assíncronos (Hybrid Fetch)
│   │   ├── eventBus.ts          # Mensageria PubSub de eventos
│   │   ├── SefazNfeService.ts   # Algoritmo Módulo 11 da Receita Federal
│   │   └── IfcParserService.ts  # Parser de modelos OpenBIM IFC
│   ├── utils/
│   │   ├── security.ts          # Sanitização XSS e mascaramento LGPD
│   │   └── materialCalculatorStrategy.ts # Estratégia de cálculo de insumos
│   ├── App.tsx                  # Orquestrador central e roteamento inteligente
│   └── main.tsx                 # Ponto de entrada React
├── tests/
│   └── e2e/                     # Suíte de Testes Automatizados E2E Playwright
│       ├── comprehensive-system-audit.spec.ts # Auditoria de páginas e perfis
│       ├── connections-audit.spec.ts         # Teste de conexões e integrações
│       ├── obra360-react.spec.ts              # Validação de componentes centrais
│       └── user-experience.spec.ts           # Simulação da jornada real do usuário
├── package.json                 # Dependências e scripts do frontend
├── playwright.config.ts         # Configuração de execução do Playwright
├── tailwind.config.js           # Estilização corporativa moderna
├── vite.config.ts               # Otimização e build do Vite
└── README.md                    # Documentação técnica e guia do ecossistema
```

---

## 📄 Licença e Autoria

Este projeto foi concebido e desenvolvido para fins acadêmicos e corporativos como parte do **Projeto Interdisciplinar de Engenharia de Software**.

- **Desenvolvedores:** João Pedro & Marcos Henrique  
- **Orientação:** Prof. Dennys Cavalcanti Carvalho  
- **Licença:** MIT — Livre para estudos, aprimoramentos e aplicação em ecossistemas de engenharia e tecnologia.
