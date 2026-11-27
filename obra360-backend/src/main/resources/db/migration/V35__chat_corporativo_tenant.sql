ALTER TABLE mensagem_chat ADD COLUMN empresa_id BIGINT;

UPDATE mensagem_chat
SET empresa_id = (SELECT u.empresa_id FROM usuario u WHERE u.id = mensagem_chat.remetente_id)
WHERE empresa_id IS NULL;

ALTER TABLE mensagem_chat ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE mensagem_chat ADD CONSTRAINT fk_mensagem_chat_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id);
CREATE INDEX idx_chat_empresa_conversa ON mensagem_chat(empresa_id, remetente_id, destinatario_id, data_envio);
