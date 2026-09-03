-- =========================================================================
-- FLYWAY DATABASE MIGRATION V1__init_schema.sql
-- Obra360 Enterprise Relational Database Schema DDL & Corporate Seeds
-- =========================================================================

-- 1. Organizações Corporativas Multi-Tenant (tb_companies)
CREATE TABLE IF NOT EXISTS tb_companies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(255) NOT NULL UNIQUE,
    segment VARCHAR(255) NOT NULL,
    plan VARCHAR(255) NOT NULL,
    verified_badge BOOLEAN NOT NULL DEFAULT TRUE,
    active_projects_count INT NOT NULL DEFAULT 0,
    members_count INT NOT NULL DEFAULT 0,
    city_state VARCHAR(255),
    phone VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Itens de Estoque e Almoxarifado (tb_stock_items)
CREATE TABLE IF NOT EXISTS tb_stock_items (
    id VARCHAR(255) PRIMARY KEY,
    sku VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    min_stock INT NOT NULL DEFAULT 10,
    last_supplier VARCHAR(255)
);

-- 3. Ocorrências Técnicas ISO 9001 e NR-18 (tb_occurrences)
CREATE TABLE IF NOT EXISTS tb_occurrences (
    id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'EM_CORRECAO',
    reported_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    has_photo BOOLEAN DEFAULT TRUE
);

-- 4. Cotações B2B RFQ (tb_b2b_rfqs)
CREATE TABLE IF NOT EXISTS tb_b2b_rfqs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    requester VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    quantity_needed INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ABERTA',
    best_quote_supplier VARCHAR(255),
    best_quote_price NUMERIC(15, 2),
    deadline TIMESTAMP
);

-- 5. Usuários e Perfis RBAC (tb_users - 13 Níveis de Acesso)
CREATE TABLE IF NOT EXISTS tb_users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

