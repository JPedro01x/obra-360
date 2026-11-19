ALTER TABLE exportacao_job ADD COLUMN tentativas INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exportacao_job ADD COLUMN proxima_tentativa_em TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_exportacao_fila ON exportacao_job (situacao, proxima_tentativa_em, criado_em);
