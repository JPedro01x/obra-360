-- Existing suppliers have no inferred owner: assign an owner after verifying
-- the original source; unassigned rows are hidden from company catalogs.
ALTER TABLE fornecedor_b2b ADD COLUMN empresa_id BIGINT REFERENCES empresa(id);
CREATE INDEX idx_fornecedor_empresa ON fornecedor_b2b(empresa_id);
