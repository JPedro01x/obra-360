CREATE TABLE documento_nfe (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    fornecedor_id BIGINT NOT NULL REFERENCES fornecedor_b2b(id),
    criado_por BIGINT NOT NULL REFERENCES usuario(id),
    chave_nfe VARCHAR(44) NOT NULL,
    numero VARCHAR(30) NOT NULL,
    data_emissao DATE NOT NULL,
    valor_total NUMERIC(14,2) NOT NULL CHECK (valor_total > 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDENTE_CONFERENCIA','ENTRADA_REGISTRADA','CANCELADA')),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_documento_nfe_empresa_chave UNIQUE (empresa_id, chave_nfe)
);
CREATE INDEX idx_documento_nfe_empresa_data ON documento_nfe(empresa_id, criado_em DESC);

CREATE TABLE documento_nfe_item (
    id BIGSERIAL PRIMARY KEY,
    documento_nfe_id BIGINT NOT NULL REFERENCES documento_nfe(id),
    item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
    quantidade NUMERIC(12,4) NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(12,2) NOT NULL CHECK (valor_unitario >= 0),
    valor_total NUMERIC(14,2) NOT NULL CHECK (valor_total >= 0),
    CONSTRAINT uk_documento_nfe_item_estoque UNIQUE (documento_nfe_id, item_estoque_id)
);

CREATE TABLE documento_nfe_evento (
    id BIGSERIAL PRIMARY KEY,
    documento_nfe_id BIGINT NOT NULL REFERENCES documento_nfe(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    tipo VARCHAR(40) NOT NULL,
    observacao VARCHAR(300) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_documento_nfe_evento_documento ON documento_nfe_evento(documento_nfe_id, criado_em);

ALTER TABLE movimentacao_estoque ADD COLUMN documento_nfe_id BIGINT REFERENCES documento_nfe(id);
ALTER TABLE movimentacao_estoque ADD CONSTRAINT uk_movimentacao_documento_nfe_item UNIQUE (documento_nfe_id, item_estoque_id);
