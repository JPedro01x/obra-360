CREATE TABLE medicao_fisica (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    etapa_cronograma_id BIGINT NOT NULL REFERENCES etapa_cronograma(id),
    competencia DATE NOT NULL,
    descricao VARCHAR(2000) NOT NULL,
    quantidade NUMERIC(15,4) NOT NULL CHECK (quantidade > 0),
    unidade VARCHAR(20) NOT NULL,
    percentual_anterior NUMERIC(5,2) NOT NULL CHECK (percentual_anterior BETWEEN 0 AND 100),
    percentual_medido NUMERIC(5,2) NOT NULL CHECK (percentual_medido BETWEEN percentual_anterior AND 100),
    valor_medido NUMERIC(15,2) NOT NULL CHECK (valor_medido >= 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('EM_MEDICAO','APROVADO_ENGENHEIRO','LIBERADO_FINANCEIRO')),
    criado_por BIGINT NOT NULL REFERENCES usuario(id),
    aprovado_por BIGINT REFERENCES usuario(id),
    liberado_por BIGINT REFERENCES usuario(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_medicao_empresa_etapa_competencia UNIQUE (empresa_id, etapa_cronograma_id, competencia)
);
CREATE INDEX idx_medicao_empresa_obra ON medicao_fisica(empresa_id, projeto_obra_id, competencia DESC);
CREATE INDEX idx_medicao_etapa ON medicao_fisica(empresa_id, etapa_cronograma_id);

CREATE TABLE medicao_fisica_evento (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    medicao_id BIGINT NOT NULL REFERENCES medicao_fisica(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    acao VARCHAR(40) NOT NULL,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_medicao_evento_empresa ON medicao_fisica_evento(empresa_id, medicao_id, criado_em);
