-- V1__schema_inicial.sql: Estrutura inicial de tabelas do Obra360 (Multi-Tenant + Race Condition Protection)

-- 1. Tabela: empresa (Tenant Root)
CREATE TABLE IF NOT EXISTS empresa (
    id BIGSERIAL PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela: usuario (Identidade & RBAC)
CREATE TABLE IF NOT EXISTS usuario (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    perfil VARCHAR(30) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    tentativas_login_falhas INT NOT NULL DEFAULT 0,
    bloqueado_ate TIMESTAMP WITH TIME ZONE,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_usuario_empresa ON usuario(empresa_id);

-- 3. Tabela: projeto_obra (Empreendimento)
CREATE TABLE IF NOT EXISTS projeto_obra (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    engenheiro_responsavel_id BIGINT NOT NULL REFERENCES usuario(id),
    nome VARCHAR(150) NOT NULL,
    vgv_estimado NUMERIC(15,2) NOT NULL,
    area_total_m2 NUMERIC(12,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_previsao_fim DATE NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_projeto_empresa ON projeto_obra(empresa_id);

-- 4. Tabela: item_estoque (Almoxarifado / SKU com Proteção Race Condition)
CREATE TABLE IF NOT EXISTS item_estoque (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0, -- Optimistic Locking
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    sku VARCHAR(50) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    quantidade_atual NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    estoque_minimo NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    custo_unitario_medio NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_item_estoque_empresa_sku UNIQUE (empresa_id, sku),
    CONSTRAINT chk_quantidade_nao_negativa CHECK (quantidade_atual >= 0.0000) -- Proteção Física no PostgreSQL
);
CREATE INDEX idx_item_estoque_projeto ON item_estoque(projeto_obra_id);

-- 5. Tabela: movimentacao_estoque (Conciliação Fiscal NFe 44 dígitos)
CREATE TABLE IF NOT EXISTS movimentacao_estoque (
    id BIGSERIAL PRIMARY KEY,
    item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    tipo_movimentacao VARCHAR(20) NOT NULL,
    quantidade NUMERIC(12,4) NOT NULL,
    valor_total NUMERIC(14,2) NOT NULL,
    chave_nfe_44_digitos VARCHAR(44),
    data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_movimentacao_chave_nfe ON movimentacao_estoque(chave_nfe_44_digitos);
CREATE INDEX idx_movimentacao_item ON movimentacao_estoque(item_estoque_id);
