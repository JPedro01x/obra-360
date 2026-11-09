CREATE TABLE convite_usuario (
    id VARCHAR(36) PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    email VARCHAR(120) NOT NULL,
    perfil VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    revogado BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_convite_empresa ON convite_usuario(empresa_id);
