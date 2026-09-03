# ARCHITECTURE DECISION RECORDS (ADR) - OBRA360 ENTERPRISE

**Status**: ACEITO E HOMOLOGADO  
**Data**: 2026-09-03  
**Autores**: João Pedro e Marcos Henrique (Orientação: Prof. Dennys Carvalho)  

---

## ADR 01: Clean Architecture em 4 Camadas e DDD para o Core da Plataforma

### Contexto
O Obra360 é uma plataforma corporativa B2B/B2C Multi-Tenant que integra todo o ciclo de vida da construção civil. O sistema requer alta testabilidade, baixo acoplamento com frameworks e facilidade para evoluir de um monólito modular para microserviços independentes.

### Decisão Arquitetural
Adotamos a **Clean Architecture (Robert C. Martin)** combinada com **Domain-Driven Design (DDD - Eric Evans)** dividida estritamente em 4 camadas isoladas:

1. **`domain/`**: Entidades puras Java, Value Objects (`NfeKey`), Domain Events e Interfaces de Estratégia sem dependências do Spring.
2. **`application/`**: Casos de Uso assíncronos (`@Async`) que orquestram as regras de negócio usando DTOs.
3. **`infrastructure/`**: Controladores REST Spring Boot, Repositórios JPA (`SpringDataCompanyRepository`), Adaptadores Kafka/RabbitMQ e Migrações Flyway.
4. **`presentation/`**: Single Page Application (SPA) em React 18 com TypeScript e Tailwind CSS.

### Consequências
- **Positivas**: 100% de desacoplamento do framework no domínio, facilidade de substituição do banco de dados e testes unitários executados em milissegundos sem subir o contexto do Spring.
- **Mitigações**: Uso de mapeadores DTO e Builder Pattern para evitar vazamento de estado de entidades JPA para a API pública.

---

## ADR 02: Resiliência Assíncrona com Transactional Outbox Pattern e Apache Kafka

### Contexto
Falhas de rede durante o envio de mensagens para barramentos de eventos (Kafka / RabbitMQ) podem causar inconsistência entre o banco transacional e os serviços consumidores.

### Decisão Arquitetural
Implementamos o **Transactional Outbox Pattern**:
- Na mesma transação ACID do banco de dados relacional, a alteração no domínio e o evento de saída são gravados na tabela `tb_outbox_events`.
- Um poller assíncrono em segundo plano (`OutboxPublisherScheduler.java`) transmite os eventos não processados para o Apache Kafka com garantia de entrega **At-Least-Once Delivery**.

---

## ADR 03: Governança de Banco de Dados com Migrações DDL Flyway

### Contexto
Alterações manuais em tabelas de banco de dados em ambientes de staging e produção geram inconsistências operacionais e falhas de deploy.

### Decisão Arquitetural
Adotamos o **Flyway SQL Migrations** (`db/migration/V1__init_schema.sql`):
- Todos os schemas e seeds iniciais são versionados e executados automaticamente na inicialização da aplicação Spring Boot.
