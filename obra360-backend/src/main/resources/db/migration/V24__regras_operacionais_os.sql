ALTER TABLE contrato_servico ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE solicitacao_servico ADD COLUMN exige_material BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE solicitacao_servico ADD COLUMN justificativa_atraso VARCHAR(2000);
ALTER TABLE solicitacao_servico ADD COLUMN solicitante_encerramento_id BIGINT REFERENCES usuario(id);
ALTER TABLE solicitacao_servico ADD COLUMN aprovador_encerramento_id BIGINT REFERENCES usuario(id);
