CREATE TABLE IF NOT EXISTS tb_occurrences (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT,
    assigned_to VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'EM_CORRECAO',
    reported_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    has_photo BOOLEAN DEFAULT TRUE
);

INSERT INTO tb_occurrences (id, project_id, title, category, severity, description, assigned_to, status, reported_by, has_photo)
VALUES 
('OCC-101', 'PRJ-001', 'Fissura Capilar na Viga V-102 (Nível 2)', 'Não Conformidade', 'MEDIA', 'Identificada fissura de 0.2mm após desforma da viga. Solicitado laudo do projetista.', 'Engenharia de Campo', 'EM_CORRECAO', 'Carlos Silva (Engenheiro)', TRUE),
('OCC-102', 'PRJ-001', 'Ausência de Linha de Vida no 4º Pavimento (NR-18)', 'Segurança NR-18', 'ALTA', 'Trabalho em altura paralisado até instalação completa de trava-quedas e cabo de aço.', 'Técnico de Segurança', 'EM_CORRECAO', 'Roberto Mestre de Obra', TRUE);
