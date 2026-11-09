-- Validation in the database as well as the API. Existing invalid data must be
-- corrected by its owner before this migration can complete.
ALTER TABLE projeto_obra ADD CONSTRAINT chk_projeto_datas CHECK (data_previsao_fim >= data_inicio);
ALTER TABLE projeto_obra ADD CONSTRAINT chk_projeto_valores CHECK (vgv_estimado >= 0 AND area_total_m2 > 0);
