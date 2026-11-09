ALTER TABLE modelo_obra ADD COLUMN revisao_publicada INTEGER;

UPDATE modelo_obra SET revisao_publicada = revisao
WHERE unidade_publicada_id IS NOT NULL;

ALTER TABLE modelo_obra ADD CONSTRAINT fk_modelo_revisao_publicada
    FOREIGN KEY (id, revisao_publicada) REFERENCES modelo_revisao(modelo_id, numero);
