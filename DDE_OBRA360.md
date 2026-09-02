# DDE - Documento de Design de Engenharia
## Projeto: Obra360 - Plataforma Integrada de Gestão de Obras com Modelo 3D Evolutivo
**Disciplina:** Projeto Interdisciplinar do 5º Período  
**Data:** 13/08/2026  
**Versão:** 1.1.0  

---

## 1. Visão Estratégica & Problema Corporativo

### 1.1 Contexto e Justificativa
Empresas de engenharia, arquitetura e construção civil enfrentam grandes desafios na centralização de informações operacionais, acompanhamento físico-financeiro de obras e comunicação transparente com contratantes e clientes. Dados de estoque, etapas, diários de obra e contratos frequentemente permanecem fragmentados em planilhas e mensagens descentralizadas.

O **Obra360** é uma plataforma corporativa integrada que conecta a operação administrativa e de campo (engenheiros, mestres de obras, almoxarifados e financeiro) a um **Modelo 3D Evolutivo (BIM)** navegável, permitindo que a empresa controle sua operação com rastreabilidade total enquanto o cliente final acompanha o desenvolvimento do seu projeto em tempo real.

### 1.2 Principais Stakeholders (Partes Interessadas)
* **Super Administrador / TI**: Gestão de usuários, perfis (RBAC), auditoria imutável e saúde dos microserviços.
* **Gerente de Obras**: Planejamento de etapas, cronogramas, contingência de atrasos e indicadores executivos.
* **Engenheiro Residente**: Atualização de progresso das etapas no modelo 3D, medições técnicas e registros de ocorrência.
* **Mestre de Obras**: Preenchimento do Diário de Obra, registro de mão de obra presente e solicitação de insumos.
* **Almoxarife Chefe**: Controle de Entradas de mercadorias (via Nota Fiscal NFe) e Saídas para frentes de trabalho.
* **Analista Financeiro**: Acompanhamento de custos previstos x realizados, contratos e pagamentos.
* **Cliente Proprietário**: Visualização simplificada da evolução visual 3D, galeria de fotos e diário da obra.
* **Auditor Interno**: Consulta imutável a logs de alteração e rastreamento de responsabilidade (*Audit Trail*).

---

## 2. Domain-Driven Design (DDD) & Bounded Contexts

```
┌────────────────────────────────────────────────────────────────────────┐
│                          OBRA360 CORE SYSTEM                           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌────────────────┬──────────────┼───────────────┬────────────────┐
    ▼                ▼              ▼               ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  1. IAM      │ │  2. Gestão   │ │ 3. Logística │ │4. Comunicação│ │ 5. Analytics │
│  (Identity & │ │  de Obras &  │ │  e Estoque   │ │  & Eventos   │ │  e Dashboard │
│   Access)    │ │  Modelo 3D   │ │ (Almoxarifado│ │ (RabbitMQ)   │ │ (Data Intel.)│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
       │                │               │               │                │
       └────────────────┴───────┬───────┴───────────────┴────────────────┘
                                ▼
                    ┌────────────────────────┐
                    │ 6. Auditoria & Logs    │
                    │   (MongoDB Audit)      │
                    └────────────────────────┘
```

### 2.1 Linguagem Ubíqua (Ubiquitous Language)
* **Obra (Project)**: Entidade principal que engloba localização, cliente, orçamento e cronograma.
* **Etapa (Stage)**: Fase da construção (ex: Fundação, Alvenaria) com progresso em porcentagem e responsável.
* **Modelo 3D Snapshot**: Versão geométrica da obra vinculada a um marco temporal (Semana/Mês).
* **Movimentação de Estoque**: Registro formal de Entrada (NFe) ou Saída (com destino e solicitante).
* **Audit Trail**: Registro imutável de quem alterou qual atributo de qual entidade, com timestamp e IP.

---

## 3. Matriz de Permissões Granulares (RBAC)

```
USUÁRIO ────► PERFIL (ROLE) ────► PERMISSÕES GRANULARES (PERMISSIONS)
```

| Permissão | Super Admin | Gerente Obra | Engenheiro | Mestre Obra | Almoxarife | Financeiro | Cliente | Auditor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `user.manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `obra.criar` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `etapa.atualizar` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `modelo3d.editar` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `diario.criar` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `estoque.entrada` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `estoque.saida` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `audit_logs.consultar`| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `minha_obra.visualizar`| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Persistência Poliglota (Polyglot Persistence)

### 4.1 Banco Relacional - PostgreSQL (Dados Transacionais)
* **users**: `id (PK)`, `email`, `password_hash`, `department_id`, `status`.
* **roles** & **permissions**: Tabelas de RBAC N:M.
* **projects**: `id (PK)`, `name`, `client_id`, `budget`, `status`, `progress_percent`.
* **stages**: `id (PK)`, `project_id (FK)`, `name`, `planned_progress`, `actual_progress`, `status`.
* **products**: `id (PK)`, `sku`, `name`, `min_stock`, `current_stock`, `unit`.
* **stock_movements**: `id (PK)`, `type`, `product_id (FK)`, `quantity`, `destination`, `nfe_number`, `created_at`.

### 4.2 Banco NoSQL - MongoDB (Auditoria & Eventos)
* **audit_logs**:
```json
{
  "_id": "ObjectId('66b7c0f1a23e')",
  "timestamp": "2026-08-13T09:14:22Z",
  "user_email": "carlos.engenheiro@obra360.com",
  "role": "Engenheiro Residente",
  "ip_address": "189.40.102.14",
  "action": "UPDATE_STAGE_PROGRESS",
  "entity": "Stage",
  "entityId": "ELEM-005",
  "old_value": { "progressPercent": 65, "status": "EM_EXECUCAO" },
  "new_value": { "progressPercent": 75, "status": "EM_EXECUCAO" }
}
```

---

## 5. Arquitetura Hexagonal (Ports & Adapters)

```
                 ┌───────────────────────────────────────┐
                 │       Camada de Apresentação          │
                 │      (React + Three.js + Vite)        │
                 └──────────────────┬────────────────────┘
                                    │ HTTP REST / WebSocket
                 ┌──────────────────▼────────────────────┐
                 │          Adaptação Inbound            │
                 │        (Spring REST Controllers)      │
                 └──────────────────┬────────────────────┘
                                    │
 ┌──────────────────────────────────▼──────────────────────────────────┐
 │                          DOMÍNIO DA APLICAÇÃO                       │
 │  (Casos de Uso, Entidades de Domínio, Validações e Regras de Negócio)│
 └──────────────────────────────────┬──────────────────────────────────┘
                                    │ Portas de Saída (Output Ports)
                 ┌──────────────────▼────────────────────┐
                 │          Adaptação Outbound           │
                 │   (Spring Data JPA, MongoRepository,  │
                 │          RabbitTemplate AMQP)         │
                 └──────────────────┬────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    PostgreSQL    │       │     MongoDB      │       │     RabbitMQ     │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

---

## 6. Configuração de Infraestrutura Docker (`docker-compose.yml`)

A infraestrutura completa da aplicação pode ser iniciada via Docker Compose:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: obra360-postgres
    environment:
      POSTGRES_DB: obra360_db
      POSTGRES_USER: obra360_admin
      POSTGRES_PASSWORD: secret_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  mongo:
    image: mongo:7.0
    container_name: obra360-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongodata:/data/db

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: obra360-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

volumes:
  pgdata:
  mongodata:
```

---

## 7. Estratégia Real de Evolução e Versionamento do Modelo 3D/BIM

No cenário corporativo real, o modelo 3D não é recriado ou destruído a cada mudança. Existem **duas camadas de atualização**:

### 7.1 Atualização Operacional por Medição de Campo (Diária/Semanal)
- **Não exige um novo arquivo IFC/Revit**: Quando o engenheiro atualiza a medição de uma parede para 80%, o sistema atualiza o atributo do elemento associado (`guid`) no PostgreSQL.
- **Domínio Orientado a Eventos**: O backend publica o evento `EtapaAtualizadaEvent` via **RabbitMQ**.
- **Reatividade Visual**: O frontend (Three.js / xeokit) recebe o evento via WebSocket e altera dinamicamente a propriedade do objeto 3D (cor, opacidade ou textura) sem recarregar a cena.

### 7.2 Versionamento do Projeto BIM (Importação/Parser IFC)
- **Importação de Novo IFC**: Caso a equipe de arquitetura altere a geometria (ex: deslocamento de janela no Revit), a nova revisão `projeto_v1.2.ifc` é enviada ao Obra360.
- **Diferenciação Geométrica (BIM Diff)**: O pipeline analisa os GUIDs e cria um snapshot incremental no **MongoDB**, mantendo a rastreabilidade total de revisões do projeto.

---

## 8. Plano de Verificação & Validação dos Testes

1. **Testes Automatizados de Frontend**: Execução do pipeline de build TypeScript e Vite sem erros de tipagem (`npm run build` -> Sucesso).
2. **Validação Manual da Trilha de Auditoria**:
   - Alteração de progresso no modelo 3D -> Verificação instantânea da geração do evento de auditoria no MongoDB.
   - Movimentação de Saída de Estoque -> Verificação de dedução automática do saldo de produto e alerta de estoque mínimo.
