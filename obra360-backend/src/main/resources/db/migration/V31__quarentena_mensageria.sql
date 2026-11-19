CREATE TABLE falha_mensageria (
    id VARCHAR(36) PRIMARY KEY,
    empresa_id BIGINT REFERENCES empresa(id),
    evento_id VARCHAR(36),
    topico VARCHAR(249) NOT NULL,
    particao INTEGER NOT NULL,
    deslocamento BIGINT NOT NULL,
    hash_conteudo VARCHAR(64) NOT NULL,
    tipo_erro VARCHAR(160) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    resolvido_em TIMESTAMP WITH TIME ZONE,
    operador_id BIGINT REFERENCES usuario(id)
);
CREATE INDEX idx_falha_mensageria_empresa ON falha_mensageria(empresa_id, resolvido_em, criado_em);
CREATE INDEX idx_falha_mensageria_evento ON falha_mensageria(evento_id);
