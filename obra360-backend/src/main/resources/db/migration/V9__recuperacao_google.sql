CREATE TABLE password_reset (token_hash VARCHAR(64) PRIMARY KEY,usuario_id BIGINT NOT NULL REFERENCES usuario(id),criado_em TIMESTAMP WITH TIME ZONE NOT NULL,expira_em TIMESTAMP WITH TIME ZONE NOT NULL,usado BOOLEAN NOT NULL DEFAULT FALSE);
CREATE INDEX idx_reset_usuario ON password_reset(usuario_id);
ALTER TABLE usuario ADD COLUMN google_subject VARCHAR(255);
ALTER TABLE usuario ADD CONSTRAINT uk_google_subject UNIQUE(google_subject);
