ALTER TABLE modelo_obra ADD COLUMN unidade_publicada_id BIGINT
    REFERENCES unidade_imobiliaria(id) ON DELETE SET NULL;
CREATE INDEX idx_modelo_unidade_publicada ON modelo_obra(empresa_id, unidade_publicada_id, arquivado);
