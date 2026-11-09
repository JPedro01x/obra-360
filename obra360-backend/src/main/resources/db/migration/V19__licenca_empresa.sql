CREATE TABLE licenca_empresa (
    empresa_id BIGINT PRIMARY KEY REFERENCES empresa(id),
    plano VARCHAR(40) NOT NULL DEFAULT 'PILOTO',
    limite_usuarios INT NOT NULL DEFAULT 50 CHECK (limite_usuarios > 0),
    limite_projetos INT NOT NULL DEFAULT 50 CHECK (limite_projetos > 0),
    limite_modelos INT NOT NULL DEFAULT 500 CHECK (limite_modelos > 0)
);
