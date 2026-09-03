# 03. ARQUITETURA TÉCNICA, DIAGRAMAS UML E DESIGN PATTERNS

---

## 1. Visão Geral da Arquitetura (Clean Architecture em 4 Camadas)

O Obra360 adota a **Clean Architecture** dividindo a aplicação em círculos concêntricos de responsabilidade, onde as dependências apontam estritamente para dentro:

```mermaid
graph TD
    subgraph "Camada 4: Presentation & UI (Frontend)"
        REACT["🖥️ React 18 / TypeScript / Tailwind CSS"]
    end

    subgraph "Camada 3: Infrastructure & Adapters (Backend)"
        CTRL["🌐 REST Controllers (@RestController)"]
        JPA["🗄️ Repositórios JPA (Spring Data)"]
        KAFKA_ADM["🐘 Kafka Event Publisher & Consumer"]
        FLYWAY_MIGRATION["📜 Flyway SQL Migrations"]
    end

    subgraph "Camada 2: Application Layer (Use Cases)"
        UC1["⚡ CreateCompanyUseCase.java"]
        UC2["⚡ RegisterStockMovementUseCase.java"]
        DTO["📦 DTOs (CompanyDTO, StockItemDTO)"]
    end

    subgraph "Camada 1: Domain Layer (Pure Java / Business Core)"
        ENTITIES["🧱 Entidades (Company, StockItem, ConstructionOccurrence)"]
        VO["💎 Value Objects (NfeKey)"]
        PATTERNS["🏭 GoF Patterns (StockItemFactory, SefazNfeValidationStrategy)"]
    end

    REACT --> CTRL
    CTRL --> DTO
    CTRL --> UC1
    CTRL --> UC2
    UC1 --> ENTITIES
    UC2 --> PATTERNS
    JPA --> ENTITIES
    KAFKA_ADM --> PATTERNS
```

---

## 2. Diagrama de Classes UML (Modelos de Domínio DDD)

```mermaid
classDiagram
    class Company {
        +String id
        +String name
        +String cnpj
        +String segment
        +String plan
        +boolean verifiedBadge
        +int activeProjectsCount
        +int membersCount
        +String cityState
        +String phone
    }

    class StockItem {
        +String id
        +String sku
        +String name
        +String category
        +int quantity
        +String unit
        +int minStock
        +String lastSupplier
        +boolean isLowStock()
    }

    class NfeKey {
        -String value
        +getValue() String
        +getFormattedKey() String
    }

    class ConstructionOccurrence {
        +String id
        +String projectId
        +String title
        +String category
        +String severity
        +String description
        +String assignedTo
        +String status
        +boolean hasPhoto
    }

    class B2bMaterialRFQ {
        +String id
        +String title
        +String requester
        +String category
        +int quantityNeeded
        +String unit
        +String status
        +Double bestQuotePrice
    }

    StockItem "1" -- "1" NfeKey : validada por >
```

---

## 3. Diagrama de Casos de Uso UML (Use Cases)

```mermaid
usecaseDiagram
    actor "Engenheiro Residente" as Eng
    actor "Almoxarife de Canteiro" as Alm
    actor "Gerente de Compras B2B" as Com
    actor "Diretoria Corporativa" as Dir

    rectangle "Plataforma Obra360" {
        usecase "UC-01: Cadastrar Organização Multi-Tenant" as UC1
        usecase "UC-02: Registrar Movimentação de Estoque NFe" as UC2
        usecase "UC-03: Disparar Alerta de Estoque Mínimo" as UC3
        usecase "UC-04: Calcular Insumos por m²" as UC4
        usecase "UC-05: Abrir Cotação B2B (RFQ)" as UC5
        usecase "UC-06: Cadastrar Ocorrência NR-18 / ISO 9001" as UC6
        usecase "UC-07: Gerar Relatório Executivo PDF" as UC7
    }

    Dir --> UC1
    Dir --> UC7
    Alm --> UC2
    UC2 ..> UC3 : <<include>>
    Eng --> UC4
    Eng --> UC6
    Com --> UC5
```

---

## 4. Diagrama de Sequência Assíncrono (Outbox Pattern + Kafka)

```mermaid
sequenceDiagram
    autonumber
    actor User as Almoxarife (Front-end)
    participant Ctrl as StockController
    participant UC as RegisterStockMovementUseCase
    participant DB as Banco PostgreSQL (ACID)
    participant Outbox as OutboxPublisherScheduler
    participant Kafka as Apache Kafka Cluster

    User->>Ctrl: POST /stock/movements (Retirar 50 Sacos Cimento)
    Ctrl->>UC: executeAsync(movement)
    UC->>DB: UPDATE tb_stock_items (quantity = 30)
    UC->>DB: INSERT INTO tb_outbox_events (StockMinReachedEvent)
    Note over DB: Transação COMMITADA no Banco com Sucesso!
    UC-->>User: 200 OK (Movimentação Concluída)

    loop Polling a cada 5 segundos
        Outbox->>DB: SELECT * FROM tb_outbox_events WHERE processed = false
        Outbox->>Kafka: send("obra360.events.stock-min", payload)
        Outbox->>DB: UPDATE tb_outbox_events SET processed = true
    end
```

---

## 5. Catálogo de Design Patterns GoF Aplicados

| Pattern | Classificacão | Aplicação Prática no Projeto |
| :--- | :--- | :--- |
| **Factory Method** | Criacional | `StockItemFactory.java` - Encapsula a criação de insumos por categoria e limiares críticos. |
| **Strategy Pattern** | Comportamental | `SefazNfeValidationStrategy.java` e `materialCalculatorStrategy.ts` - Estratégias de validação fiscal NFe e cálculo de materiais $m^2$. |
| **Builder Pattern** | Criacional | `CompanyBuilder.java` - API fluente para construção de instâncias da entidade `Company`. |
| **DTO Pattern** | Estrutural | `CompanyDTO.java` e `StockItemDTO.java` - Transfere dados validados entre as camadas da API. |
| **Outbox Pattern** | Arquitetural | `OutboxEventJpaEntity.java` e `OutboxPublisherScheduler.java` - Garantia de entrega assíncrona de eventos. |
