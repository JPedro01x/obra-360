CREATE TABLE evento_mensagem (
    id VARCHAR(36) PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    ordem_id BIGINT NOT NULL REFERENCES solicitacao_servico(id),
    protocolo VARCHAR(80) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    proxima_tentativa TIMESTAMP WITH TIME ZONE NOT NULL,
    publicado_em TIMESTAMP WITH TIME ZONE,
    processado_em TIMESTAMP WITH TIME ZONE,
    tentativas INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_evento_mensagem_pendente ON evento_mensagem(publicado_em, proxima_tentativa);
