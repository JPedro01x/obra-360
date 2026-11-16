CREATE TABLE exportacao_job (
 id VARCHAR(36) PRIMARY KEY, empresa_id BIGINT NOT NULL REFERENCES empresa(id), usuario_id BIGINT NOT NULL REFERENCES usuario(id),
 situacao VARCHAR(20) NOT NULL, criado_em TIMESTAMP WITH TIME ZONE NOT NULL, expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
 mensagem VARCHAR(250) NOT NULL, tamanho BIGINT NOT NULL
);
CREATE INDEX idx_exportacao_empresa ON exportacao_job(empresa_id,criado_em);
