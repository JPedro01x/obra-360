-- RH operacional: dados segregados por empresa; nenhum dado inicial fictício.
CREATE TABLE rh_estrutura (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 tipo VARCHAR(20) NOT NULL,
 nome VARCHAR(150) NOT NULL,
 departamento_id BIGINT,
 ativo BOOLEAN NOT NULL
);
CREATE INDEX idx_rh_estrutura_empresa ON rh_estrutura(empresa_id);
CREATE TABLE rh_funcionario (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 matricula VARCHAR(30) NOT NULL,
 nome VARCHAR(150) NOT NULL,
 cpf VARCHAR(11) NOT NULL,
 email VARCHAR(120),
 telefone VARCHAR(30),
 nascimento DATE,
 admissao DATE NOT NULL,
 desligamento DATE,
 vinculo VARCHAR(20) NOT NULL,
 situacao VARCHAR(20) NOT NULL,
 departamento_id BIGINT NOT NULL,
 cargo_id BIGINT NOT NULL,
 projeto_obra_id BIGINT,
 equipe_id BIGINT,
 usuario_id BIGINT,
 salario_base NUMERIC(15,2) NOT NULL,
 jornada_semanal_minutos INTEGER NOT NULL
);
CREATE INDEX idx_rh_funcionario_empresa ON rh_funcionario(empresa_id);
CREATE TABLE rh_ponto (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 funcionario_id BIGINT NOT NULL,
 data DATE NOT NULL,
 entrada TIME NOT NULL,
 saida_intervalo TIME,
 retorno_intervalo TIME,
 saida TIME NOT NULL,
 minutos_trabalhados INTEGER NOT NULL,
 observacao VARCHAR(500),
 situacao VARCHAR(20) NOT NULL
);
CREATE INDEX idx_rh_ponto_empresa ON rh_ponto(empresa_id);
CREATE TABLE rh_afastamento (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 funcionario_id BIGINT NOT NULL,
 tipo VARCHAR(30) NOT NULL,
 inicio DATE NOT NULL,
 fim DATE NOT NULL,
 observacao VARCHAR(500),
 situacao VARCHAR(20) NOT NULL,
 aprovador_id BIGINT
);
CREATE INDEX idx_rh_afastamento_empresa ON rh_afastamento(empresa_id);
CREATE TABLE rh_beneficio (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 funcionario_id BIGINT NOT NULL,
 nome VARCHAR(100) NOT NULL,
 valor_empresa NUMERIC(15,2) NOT NULL,
 desconto_funcionario NUMERIC(15,2) NOT NULL,
 inicio DATE NOT NULL,
 fim DATE,
 ativo BOOLEAN NOT NULL
);
CREATE INDEX idx_rh_beneficio_empresa ON rh_beneficio(empresa_id);
CREATE TABLE rh_folha (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 competencia VARCHAR(7) NOT NULL,
 situacao VARCHAR(20) NOT NULL,
 total_proventos NUMERIC(17,2) NOT NULL,
 total_descontos NUMERIC(17,2) NOT NULL,
 data_pagamento DATE
);
CREATE INDEX idx_rh_folha_empresa ON rh_folha(empresa_id);
CREATE TABLE rh_lancamento (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 folha_id BIGINT NOT NULL,
 funcionario_id BIGINT NOT NULL,
 codigo VARCHAR(40) NOT NULL,
 descricao VARCHAR(150) NOT NULL,
 natureza VARCHAR(20) NOT NULL,
 valor NUMERIC(15,2) NOT NULL
);
CREATE INDEX idx_rh_lancamento_empresa ON rh_lancamento(empresa_id);
CREATE TABLE rh_treinamento (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 funcionario_id BIGINT NOT NULL,
 tipo VARCHAR(20) NOT NULL,
 titulo VARCHAR(150) NOT NULL,
 realizacao DATE NOT NULL,
 validade DATE,
 carga_horaria_minutos INTEGER NOT NULL,
 instituicao VARCHAR(150),
 observacao VARCHAR(500)
);
CREATE INDEX idx_rh_treinamento_empresa ON rh_treinamento(empresa_id);
CREATE TABLE rh_vaga (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 titulo VARCHAR(150) NOT NULL,
 departamento_id BIGINT NOT NULL,
 cargo_id BIGINT NOT NULL,
 quantidade INTEGER NOT NULL,
 descricao VARCHAR(2000) NOT NULL,
 abertura DATE NOT NULL,
 situacao VARCHAR(20) NOT NULL
);
CREATE INDEX idx_rh_vaga_empresa ON rh_vaga(empresa_id);
CREATE TABLE rh_candidato (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 versao BIGINT NOT NULL DEFAULT 0,
 vaga_id BIGINT NOT NULL,
 nome VARCHAR(150) NOT NULL,
 email VARCHAR(120) NOT NULL,
 telefone VARCHAR(30),
 etapa VARCHAR(20) NOT NULL,
 observacao VARCHAR(1000)
);
CREATE INDEX idx_rh_candidato_empresa ON rh_candidato(empresa_id);
CREATE UNIQUE INDEX uq_rh_estrutura ON rh_estrutura(empresa_id,tipo,nome);
CREATE UNIQUE INDEX uq_rh_matricula ON rh_funcionario(empresa_id,matricula);
CREATE UNIQUE INDEX uq_rh_cpf ON rh_funcionario(empresa_id,cpf);
CREATE UNIQUE INDEX uq_rh_usuario ON rh_funcionario(empresa_id,usuario_id);
CREATE UNIQUE INDEX uq_rh_ponto ON rh_ponto(funcionario_id,data);
CREATE UNIQUE INDEX uq_rh_folha ON rh_folha(empresa_id,competencia);
CREATE UNIQUE INDEX uq_rh_lancamento ON rh_lancamento(folha_id,funcionario_id,codigo);
ALTER TABLE rh_estrutura ADD CONSTRAINT fk_rh_estrutura_departamento_id FOREIGN KEY (departamento_id) REFERENCES rh_estrutura(id);
ALTER TABLE rh_funcionario ADD CONSTRAINT fk_rh_funcionario_departamento_id FOREIGN KEY (departamento_id) REFERENCES rh_estrutura(id);
ALTER TABLE rh_funcionario ADD CONSTRAINT fk_rh_funcionario_cargo_id FOREIGN KEY (cargo_id) REFERENCES rh_estrutura(id);
ALTER TABLE rh_funcionario ADD CONSTRAINT fk_rh_funcionario_projeto_obra_id FOREIGN KEY (projeto_obra_id) REFERENCES projeto_obra(id);
ALTER TABLE rh_funcionario ADD CONSTRAINT fk_rh_funcionario_equipe_id FOREIGN KEY (equipe_id) REFERENCES equipe_trabalho(id);
ALTER TABLE rh_funcionario ADD CONSTRAINT fk_rh_funcionario_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuario(id);
ALTER TABLE rh_ponto ADD CONSTRAINT fk_rh_ponto_funcionario_id FOREIGN KEY (funcionario_id) REFERENCES rh_funcionario(id);
ALTER TABLE rh_afastamento ADD CONSTRAINT fk_rh_afastamento_funcionario_id FOREIGN KEY (funcionario_id) REFERENCES rh_funcionario(id);
ALTER TABLE rh_afastamento ADD CONSTRAINT fk_rh_afastamento_aprovador_id FOREIGN KEY (aprovador_id) REFERENCES usuario(id);
ALTER TABLE rh_beneficio ADD CONSTRAINT fk_rh_beneficio_funcionario_id FOREIGN KEY (funcionario_id) REFERENCES rh_funcionario(id);
ALTER TABLE rh_lancamento ADD CONSTRAINT fk_rh_lancamento_folha_id FOREIGN KEY (folha_id) REFERENCES rh_folha(id);
ALTER TABLE rh_lancamento ADD CONSTRAINT fk_rh_lancamento_funcionario_id FOREIGN KEY (funcionario_id) REFERENCES rh_funcionario(id);
ALTER TABLE rh_treinamento ADD CONSTRAINT fk_rh_treinamento_funcionario_id FOREIGN KEY (funcionario_id) REFERENCES rh_funcionario(id);
ALTER TABLE rh_vaga ADD CONSTRAINT fk_rh_vaga_departamento_id FOREIGN KEY (departamento_id) REFERENCES rh_estrutura(id);
ALTER TABLE rh_vaga ADD CONSTRAINT fk_rh_vaga_cargo_id FOREIGN KEY (cargo_id) REFERENCES rh_estrutura(id);
ALTER TABLE rh_candidato ADD CONSTRAINT fk_rh_candidato_vaga_id FOREIGN KEY (vaga_id) REFERENCES rh_vaga(id);
ALTER TABLE rh_funcionario ADD CONSTRAINT ck_rh_salario CHECK (salario_base>=0 AND jornada_semanal_minutos BETWEEN 1 AND 10080);
ALTER TABLE rh_ponto ADD CONSTRAINT ck_rh_ponto_min CHECK (minutos_trabalhados>0 AND minutos_trabalhados<=1440);
ALTER TABLE rh_afastamento ADD CONSTRAINT ck_rh_afastamento_datas CHECK (fim>=inicio);
ALTER TABLE rh_lancamento ADD CONSTRAINT ck_rh_lancamento_valor CHECK (valor>0);
