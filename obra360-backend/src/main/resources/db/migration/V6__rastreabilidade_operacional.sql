ALTER TABLE movimentacao_estoque ADD COLUMN ordem_servico_id BIGINT REFERENCES solicitacao_servico(id);
ALTER TABLE movimentacao_estoque ADD COLUMN chave_operacao VARCHAR(36);
ALTER TABLE movimentacao_estoque ADD CONSTRAINT uk_movimentacao_operacao UNIQUE (chave_operacao);
ALTER TABLE insumo_consumido_os ADD CONSTRAINT chk_consumo_positivo CHECK (quantidade_utilizada > 0 AND custo_total_insumo >= 0);
CREATE INDEX idx_movimentacao_os ON movimentacao_estoque(ordem_servico_id);
