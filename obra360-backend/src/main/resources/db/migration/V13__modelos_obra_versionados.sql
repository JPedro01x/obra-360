-- Modelos editáveis reais, separados da geometria demonstrativa legada.
CREATE TABLE modelo_obra (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 nome VARCHAR(150) NOT NULL,
 arquivado BOOLEAN NOT NULL DEFAULT FALSE,
 versao BIGINT NOT NULL DEFAULT 0,
 revisao INTEGER NOT NULL CHECK (revisao>=1),
 documento TEXT NOT NULL,
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_modelo_obra_nome UNIQUE(projeto_obra_id,nome)
);
CREATE INDEX idx_modelo_obra_empresa ON modelo_obra(empresa_id,projeto_obra_id);
CREATE TABLE modelo_revisao (
 id BIGSERIAL PRIMARY KEY,
 modelo_id BIGINT NOT NULL REFERENCES modelo_obra(id),
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 usuario_id BIGINT NOT NULL REFERENCES usuario(id),
 numero INTEGER NOT NULL,
 nome VARCHAR(150) NOT NULL,
 motivo VARCHAR(500) NOT NULL,
 documento TEXT NOT NULL,
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_modelo_revisao UNIQUE(modelo_id,numero)
);
CREATE INDEX idx_modelo_revisao_empresa ON modelo_revisao(empresa_id,modelo_id);
