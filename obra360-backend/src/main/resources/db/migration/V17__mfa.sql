CREATE TABLE usuario_mfa (
    usuario_id BIGINT PRIMARY KEY REFERENCES usuario(id),
    segredo_cifrado VARCHAR(300) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    ultimo_contador BIGINT NOT NULL DEFAULT -1,
    codigos_hash VARCHAR(1000) NOT NULL DEFAULT ''
);
