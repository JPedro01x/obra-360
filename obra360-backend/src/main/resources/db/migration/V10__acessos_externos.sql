CREATE TABLE acesso_externo(id BIGSERIAL PRIMARY KEY,empresa_id BIGINT NOT NULL REFERENCES empresa(id),usuario_id BIGINT NOT NULL REFERENCES usuario(id),perfil VARCHAR(30) NOT NULL,projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),unidade_imobiliaria_id BIGINT REFERENCES unidade_imobiliaria(id),fornecedor_b2b_id BIGINT REFERENCES fornecedor_b2b(id));
CREATE INDEX idx_acesso_usuario ON acesso_externo(usuario_id,empresa_id);
ALTER TABLE unidade_imobiliaria ADD COLUMN reserva_usuario_id BIGINT REFERENCES usuario(id);
