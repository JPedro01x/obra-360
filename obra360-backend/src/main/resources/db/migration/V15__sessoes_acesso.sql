CREATE TABLE sessao_acesso (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    versao_credencial BIGINT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    revogado_em TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_sessao_usuario ON sessao_acesso(usuario_id);
