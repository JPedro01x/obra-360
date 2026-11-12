ALTER TABLE usuario ADD COLUMN exige_troca_senha BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_rh_funcionario_usuario ON rh_funcionario(usuario_id);
