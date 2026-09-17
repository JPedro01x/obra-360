CREATE TABLE IF NOT EXISTS tb_b2b_rfq (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    requester VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity_needed INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    best_quote_supplier VARCHAR(255),
    best_quote_price DOUBLE PRECISION,
    deadline TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tb_b2b_rfq (id, title, requester, category, quantity_needed, unit, status, best_quote_supplier, best_quote_price, deadline)
VALUES 
('RFQ-201', 'Cimento CP II Fck 30MPa - Lote 500 Sacos', 'Carlos Engenheiro', 'Insumos Estruturais', 500, 'Sacos', 'ABERTA', 'Votoran Cimentos', 16250.00, CURRENT_TIMESTAMP + INTERVAL '5' DAY),
('RFQ-202', 'Vergalhão Aço Gerdau CA-50 12mm - 200 Barras', 'Amanda Gerente', 'Aço & Armações', 200, 'Barras', 'ABERTA', 'Gerdau Aços', 11800.00, CURRENT_TIMESTAMP + INTERVAL '5' DAY);
