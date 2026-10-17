-- V2__schema_completo_17_tabelas.sql: Complemento do Schema do Obra360 (Total de 17 Tabelas Relacionais e Auditoria)

-- 6. Tabela: fornecedor_b2b (Marketplace / Homologação)
CREATE TABLE IF NOT EXISTS fornecedor_b2b (
    id BIGSERIAL PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    razao_social VARCHAR(255) NOT NULL,
    categoria_fornecimento VARCHAR(100) NOT NULL,
    status_homologacao VARCHAR(30) NOT NULL DEFAULT 'HOMOLOGADO',
    score_reputacao NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_fornecedor_cnpj ON fornecedor_b2b(cnpj);

-- 7. Tabela: cotacao_b2b (Propostas Comerciais B2B)
CREATE TABLE IF NOT EXISTS cotacao_b2b (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    fornecedor_b2b_id BIGINT NOT NULL REFERENCES fornecedor_b2b(id),
    codigo_cotacao VARCHAR(30) NOT NULL UNIQUE,
    valor_proposta NUMERIC(15,2) NOT NULL,
    prazo_entrega_dias INT NOT NULL,
    status_cotacao VARCHAR(30) NOT NULL DEFAULT 'EM_ANALISE',
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cotacao_empresa ON cotacao_b2b(empresa_id);

-- 8. Tabela: contrato_servico (Instrumentos Contratuais & SLA)
CREATE TABLE IF NOT EXISTS contrato_servico (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    fornecedor_b2b_id BIGINT NOT NULL REFERENCES fornecedor_b2b(id),
    numero_contrato VARCHAR(50) NOT NULL UNIQUE,
    valor_total NUMERIC(15,2) NOT NULL,
    retencao_tecnica_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00,
    tempo_limite_sla_horas INT NOT NULL DEFAULT 48,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_contrato_projeto ON contrato_servico(projeto_obra_id);

-- 9. Tabela: documento_projeto (GED / Pranchas / PDF / DWG)
CREATE TABLE IF NOT EXISTS documento_projeto (
    id BIGSERIAL PRIMARY KEY,
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    titulo VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    url_armazenamento VARCHAR(500) NOT NULL,
    hash_arquivo_sha256 VARCHAR(64) NOT NULL,
    versao INT NOT NULL DEFAULT 1,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_documento_projeto ON documento_projeto(projeto_obra_id);

-- 10. Tabela: etapa_cronograma (Fases Físicas e Curva S)
CREATE TABLE IF NOT EXISTS etapa_cronograma (
    id BIGSERIAL PRIMARY KEY,
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    nome_etapa VARCHAR(200) NOT NULL,
    ordem_execucao INT NOT NULL,
    data_inicio_prevista DATE NOT NULL,
    data_fim_prevista DATE NOT NULL,
    percentual_executado NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_etapa_projeto ON etapa_cronograma(projeto_obra_id);

-- 11. Tabela: ocorrencia_qualidade (Não Conformidades ISO 9001 e Laudos NR-18)
CREATE TABLE IF NOT EXISTS ocorrencia_qualidade (
    id BIGSERIAL PRIMARY KEY,
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    responsavel_id BIGINT NOT NULL REFERENCES usuario(id),
    titulo VARCHAR(200) NOT NULL,
    norma_regulamentadora VARCHAR(30) NOT NULL,
    grau_severidade VARCHAR(20) NOT NULL,
    status_plano_acao VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ocorrencia_projeto ON ocorrencia_qualidade(projeto_obra_id);

-- 12. Tabela: equipe_trabalho (Gestão de Mão de Obra de Campo)
CREATE TABLE IF NOT EXISTS equipe_trabalho (
    id BIGSERIAL PRIMARY KEY,
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    lider_encarregado_id BIGINT NOT NULL REFERENCES usuario(id),
    nome_equipe VARCHAR(100) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    quantidade_operarios INT NOT NULL DEFAULT 1,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_equipe_projeto ON equipe_trabalho(projeto_obra_id);

-- 13. Tabela: unidade_imobiliaria (Espelho de Vendas & Amortização)
CREATE TABLE IF NOT EXISTS unidade_imobiliaria (
    id BIGSERIAL PRIMARY KEY,
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    codigo_unidade VARCHAR(30) NOT NULL,
    area_privativa_m2 NUMERIC(10,4) NOT NULL,
    valor_tabela NUMERIC(15,2) NOT NULL,
    status_venda VARCHAR(30) NOT NULL DEFAULT 'DISPONIVEL',
    sistema_amortizacao VARCHAR(20),
    indice_correcao VARCHAR(20),
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_unidade_projeto ON unidade_imobiliaria(projeto_obra_id);

-- 14. Tabela: solicitacao_servico (Ordens de Serviço de Campo & Chamados)
CREATE TABLE IF NOT EXISTS solicitacao_servico (
    id BIGSERIAL PRIMARY KEY,
    contrato_servico_id BIGINT NOT NULL REFERENCES contrato_servico(id),
    equipe_trabalho_id BIGINT REFERENCES equipe_trabalho(id),
    unidade_imobiliaria_id BIGINT REFERENCES unidade_imobiliaria(id),
    codigo_protocolo VARCHAR(30) NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    status_os VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_limite_sla TIMESTAMP WITH TIME ZONE NOT NULL,
    data_encerramento TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_solicitacao_contrato ON solicitacao_servico(contrato_servico_id);

-- 15. Tabela: garantia_pos_venda (Assistência Técnica Pós-Chaves)
CREATE TABLE IF NOT EXISTS garantia_pos_venda (
    id BIGSERIAL PRIMARY KEY,
    unidade_imobiliaria_id BIGINT NOT NULL REFERENCES unidade_imobiliaria(id),
    usuario_cliente_id BIGINT NOT NULL REFERENCES usuario(id),
    codigo_chamado VARCHAR(30) NOT NULL UNIQUE,
    descricao_defeito TEXT NOT NULL,
    categoria_defeito VARCHAR(50) NOT NULL,
    status_chamado VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atendimento TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_garantia_unidade ON garantia_pos_venda(unidade_imobiliaria_id);

-- 16. Tabela: mensagem_chat (Comunicação Corporativa B2B/B2C)
CREATE TABLE IF NOT EXISTS mensagem_chat (
    id BIGSERIAL PRIMARY KEY,
    remetente_id BIGINT NOT NULL REFERENCES usuario(id),
    destinatario_id BIGINT NOT NULL REFERENCES usuario(id),
    conteudo_mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    data_envio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_remetente ON mensagem_chat(remetente_id);
CREATE INDEX idx_chat_destinatario ON mensagem_chat(destinatario_id);

-- 17. Tabela: log_auditoria (Auditoria Geral & Rastreabilidade de Operações Criticas)
CREATE TABLE IF NOT EXISTS log_auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT REFERENCES usuario(id),
    empresa_id BIGINT REFERENCES empresa(id),
    acao VARCHAR(50) NOT NULL,
    entidade_afetada VARCHAR(100) NOT NULL,
    entidade_id BIGINT,
    detalhes_json TEXT,
    ip_origem VARCHAR(45),
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_auditoria_empresa ON log_auditoria(empresa_id);
CREATE INDEX idx_auditoria_data ON log_auditoria(data_hora);
