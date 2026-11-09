CREATE TABLE solicitacao_atendimento (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    categoria VARCHAR(30) NOT NULL,
    assunto VARCHAR(150) NOT NULL,
    descricao VARCHAR(4000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    resposta VARCHAR(4000),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    versao BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_atendimento_empresa ON solicitacao_atendimento(empresa_id);
