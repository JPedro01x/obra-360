CREATE TABLE modelo_rascunho (
    id BIGSERIAL PRIMARY KEY,
    modelo_id BIGINT NOT NULL REFERENCES modelo_obra(id),
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    versao_base BIGINT NOT NULL,
    token VARCHAR(36) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    documento TEXT NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_rascunho_modelo_usuario UNIQUE(modelo_id, usuario_id)
);

CREATE TABLE modelo_publicacao_evento (
    id BIGSERIAL PRIMARY KEY,
    modelo_id BIGINT NOT NULL REFERENCES modelo_obra(id),
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    autor VARCHAR(150) NOT NULL,
    unidade_id BIGINT NOT NULL,
    unidade_codigo VARCHAR(80) NOT NULL,
    revisao INTEGER NOT NULL,
    acao VARCHAR(20) NOT NULL,
    ocorrido_em TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_modelo_publicacao_evento ON modelo_publicacao_evento(modelo_id, empresa_id, id);
