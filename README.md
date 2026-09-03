# 🏗️ Obra360 - Ecossistema Digital Integrado B2B/B2C da Construção Civil

[![Build & Test Status](https://github.com/JPedro01x/obra-360/actions/workflows/ci.yml/badge.svg)](https://github.com/JPedro01x/obra-360/actions/workflows/ci.yml)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture%20%2B%20DDD-orange.svg)](docs/03_ARQUITETURA_E_PADROES.md)
[![Java 17](https://img.shields.io/badge/Java-17-blue.svg)](backend/pom.xml)
[![Spring Boot 3.2.3](https://img.shields.io/badge/Spring%20Boot-3.2.3-brightgreen.svg)](backend/pom.xml)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](package.json)
[![Apache Kafka](https://img.shields.io/badge/Streaming-Apache%20Kafka-black.svg)](docker-compose.yml)

> **Plataforma Corporativa Multi-Tenant** desenvolvida para construtoras, incorporadoras, fornecedores B2B, investidores imobiliários e clientes finais. Integrando todo o ciclo de vida de um empreendimento — da viabilidade do terreno ao pós-venda.

---

## 📚 Documentação Técnica Completa do Projeto

Para consultar os manuais e diagramas detalhados do sistema, acesse a pasta [`docs/`](docs/):

1. 📄 [**01. Visão, Motivação e Justificativa**](docs/01_VISAO_E_JUSTIFICATIVA.md) - Contexto da construção civil, justificativa acadêmica e proposta de valor.
2. 📋 [**02. Requisitos e Regras de Negócio**](docs/02_REQUISITOS_E_REGRAS_DE_NEGOCIO.md) - Requisitos Funcionais (RF-01 a RF-17), Não-Funcionais (RNF-01 a RNF-10) e Matriz RBAC.
3. 🏛️ [**03. Arquitetura Técnica, Diagramas UML e Design Patterns**](docs/03_ARQUITETURA_E_PADROES.md) - Diagramas UML (Classes, Casos de Uso, Sequência) e catálogo de GoF Design Patterns.
4. ⚙️ [**04. Guia de Instalação, Execução e Deploy**](docs/04_GUIA_DE_INSTALACAO_E_EXECUCAO.md) - Passo a passo para rodar o Frontend, Backend, Docker e Swagger.
5. 📜 [**Decisões Arquiteturais (ADR)**](docs/ADR.md) - Registros de decisões de engenharia (Clean Architecture, Outbox Pattern, Flyway).

---

## 🛠️ Tecnologias Utilizadas

### Frontend (Single Page Application & PWA)
- **React 18** com **TypeScript** e **Vite 5**
- **Tailwind CSS** com suporte a Tema Claro e Escuro
- **Lucide Icons** & **jspdf / html2canvas** para geração de relatórios PDF
- **Progressive Web App (PWA)** com suporte a operação offline em canteiros

### Backend (API REST & Event-Driven Backbone)
- **Java 17** & **Spring Boot 3.2.3**
- **Clean Architecture** em 4 camadas concêntricas e **Domain-Driven Design (DDD)**
- **Apache Kafka** & **RabbitMQ** para streaming de eventos de domínio em tempo real
- **Transactional Outbox Pattern** para resiliência de mensagens
- **Flyway SQL Migrations** para versionamento DDL de banco de dados
- **Spring Actuator** & **Springdoc OpenAPI (Swagger UI)**

---

## ⚡ Como Rodar o Projeto em 3 Passos

### 1. Iniciar o Frontend (Porta 3000)
```bash
npm install
npm run dev
```

### 2. Iniciar o Backend Java (Porta 8080)
```bash
cd backend
mvn spring-boot:run
```

### 3. Subir Banco de Dados e Mensageria (Docker Compose)
```bash
docker compose up -d
```

---

## 👥 Autoria e Instituição

- **Autores**: João Pedro e Marcos Henrique
- **Professor Orientador**: Dennys Carvalho
- **Instituição**: AESA-CESA (2026)
- **Repositório GitHub**: [https://github.com/JPedro01x/obra-360](https://github.com/JPedro01x/obra-360)
