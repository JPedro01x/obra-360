CREATE TABLE medicao_fisica_anexo (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    medicao_id BIGINT NOT NULL REFERENCES medicao_fisica(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    nome_arquivo VARCHAR(255) NOT NULL,
    arquivo_key VARCHAR(64) NOT NULL UNIQUE,
    sha256 VARCHAR(64) NOT NULL,
    mime VARCHAR(40) NOT NULL CHECK (mime IN ('application/pdf','image/jpeg','image/png')),
    tamanho BIGINT NOT NULL CHECK (tamanho > 0 AND tamanho <= 20971520),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_medicao_anexo_tenant_medicao ON medicao_fisica_anexo(empresa_id, medicao_id, criado_em);
