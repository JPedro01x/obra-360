CREATE TABLE projeto_configuracao_etapa (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    etapa VARCHAR(30) NOT NULL,
    justificativa VARCHAR(300) NOT NULL,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_projeto_configuracao_etapa UNIQUE (empresa_id, projeto_obra_id, etapa),
    CONSTRAINT ck_projeto_configuracao_etapa CHECK (etapa IN ('responsaveis','equipe','materiais','cronograma','planta2d','cliente'))
);
CREATE INDEX idx_projeto_configuracao_empresa_obra ON projeto_configuracao_etapa(empresa_id, projeto_obra_id);
