CREATE TABLE integracao_idempotencia (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    operacao VARCHAR(20) NOT NULL CHECK (operacao IN ('IA','SEFAZ')),
    chave_hash VARCHAR(64) NOT NULL,
    solicitacao_hash VARCHAR(64) NOT NULL,
    situacao VARCHAR(20) NOT NULL CHECK (situacao IN ('PROCESSANDO','CONCLUIDA','FALHA')),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalizado_em TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_integracao_idempotencia_chave UNIQUE (empresa_id, usuario_id, operacao, chave_hash)
);
CREATE INDEX idx_integracao_idempotencia_expira ON integracao_idempotencia(criado_em);
