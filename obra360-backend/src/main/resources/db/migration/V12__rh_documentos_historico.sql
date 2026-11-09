-- Arquivos privados e histórico funcional; nenhuma alteração retroativa fictícia.
CREATE TABLE rh_historico (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao BIGINT NOT NULL DEFAULT 0,
    funcionario_id BIGINT NOT NULL REFERENCES rh_funcionario(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    tipo VARCHAR(30) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    data_referencia DATE NOT NULL,
    campos_alterados VARCHAR(500) NOT NULL,
    estado_anterior TEXT,
    estado_atual TEXT NOT NULL
);
CREATE INDEX idx_rh_historico_funcionario ON rh_historico(empresa_id,funcionario_id,id);
CREATE TABLE rh_documento (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao BIGINT NOT NULL DEFAULT 0,
    funcionario_id BIGINT NOT NULL REFERENCES rh_funcionario(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    grupo VARCHAR(36) NOT NULL,
    numero_versao INTEGER NOT NULL CHECK (numero_versao>=1),
    documento_anterior_id BIGINT REFERENCES rh_documento(id),
    titulo VARCHAR(150) NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50) NOT NULL,
    tamanho BIGINT NOT NULL CHECK (tamanho>0 AND tamanho<=20971520),
    sha256 VARCHAR(64) NOT NULL,
    referencia_arquivo VARCHAR(50) NOT NULL,
    data_validade DATE,
    arquivado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_rh_documento_versao UNIQUE (empresa_id,funcionario_id,grupo,numero_versao)
);
CREATE INDEX idx_rh_documento_funcionario ON rh_documento(empresa_id,funcionario_id,id);
