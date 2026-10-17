-- V3__schema_completo_28_tabelas_corporativo.sql
-- Expansão do Schema Corporativo do Obra 360 para 28 Entidades Normalizadas em 3FN

-- 18. Tabela: filial_unidade (Filiais e Escritórios Regionais da Construtora)
CREATE TABLE IF NOT EXISTS filial_unidade (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    codigo_filial VARCHAR(50) NOT NULL UNIQUE,
    cidade VARCHAR(100) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    responsavel_regional VARCHAR(150) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_filial_empresa ON filial_unidade(empresa_id);

-- 19. Tabela: perfil_acesso (Cargos e Perfis de Acesso RBAC)
CREATE TABLE IF NOT EXISTS perfil_acesso (
    id BIGSERIAL PRIMARY KEY,
    codigo_perfil VARCHAR(50) NOT NULL UNIQUE,
    titulo_cargo VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    nivel_hierarquico VARCHAR(50) NOT NULL
);

-- 20. Tabela: permissao (Permissões Granulares Atômicas)
CREATE TABLE IF NOT EXISTS permissao (
    id BIGSERIAL PRIMARY KEY,
    chave_permissao VARCHAR(80) NOT NULL UNIQUE,
    descricao VARCHAR(255) NOT NULL,
    modulo VARCHAR(50) NOT NULL
);

-- 21. Tabela: usuario_perfil (N:N entre Usuário e Perfil)
CREATE TABLE IF NOT EXISTS usuario_perfil (
    usuario_id BIGINT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    perfil_id BIGINT NOT NULL REFERENCES perfil_acesso(id) ON DELETE CASCADE,
    data_atribuicao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, perfil_id)
);

-- 22. Tabela: perfil_permissao (N:N entre Perfil e Permissão)
CREATE TABLE IF NOT EXISTS perfil_permissao (
    perfil_id BIGINT NOT NULL REFERENCES perfil_acesso(id) ON DELETE CASCADE,
    permissao_id BIGINT NOT NULL REFERENCES permissao(id) ON DELETE CASCADE,
    PRIMARY KEY (perfil_id, permissao_id)
);

-- 23. Tabela: elemento_bim_3d (Maquete Procedural e Objetos Tridimensionais IFC)
CREATE TABLE IF NOT EXISTS elemento_bim_3d (
    id BIGSERIAL PRIMARY KEY,
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id) ON DELETE CASCADE,
    categoria_ifc VARCHAR(50) NOT NULL,
    nome_identificador VARCHAR(100) NOT NULL,
    pos_x NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    pos_y NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    pos_z NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
    escala_x NUMERIC(10,4) NOT NULL DEFAULT 1.0000,
    escala_y NUMERIC(10,4) NOT NULL DEFAULT 1.0000,
    escala_z NUMERIC(10,4) NOT NULL DEFAULT 1.0000,
    material_textura VARCHAR(100) NOT NULL DEFAULT 'Concreto',
    status_execucao VARCHAR(30) NOT NULL DEFAULT 'CONSTRUIDO',
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_elemento_bim_projeto ON elemento_bim_3d(projeto_obra_id);

-- 24. Tabela: colaborador (Membros e Profissionais de Equipes de Canteiro)
CREATE TABLE IF NOT EXISTS colaborador (
    id BIGSERIAL PRIMARY KEY,
    equipe_trabalho_id BIGINT NOT NULL REFERENCES equipe_trabalho(id),
    nome_completo VARCHAR(150) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    valor_hora NUMERIC(10,2) NOT NULL DEFAULT 35.00,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_admissao DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX IF NOT EXISTS idx_colaborador_equipe ON colaborador(equipe_trabalho_id);

-- 25. Tabela: insumo_consumido_os (Baixa de Insumos em Ordens de Serviço - RN-10)
CREATE TABLE IF NOT EXISTS insumo_consumido_os (
    id BIGSERIAL PRIMARY KEY,
    ordem_servico_id BIGINT NOT NULL REFERENCES ordem_servico(id) ON DELETE CASCADE,
    item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
    quantidade_utilizada NUMERIC(12,3) NOT NULL,
    custo_total_insumo NUMERIC(12,2) NOT NULL,
    data_consumo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_consumo_os ON insumo_consumido_os(ordem_servico_id);

-- 26. Tabela: cliente_comprador (Proprietários Finais de Unidades)
CREATE TABLE IF NOT EXISTS cliente_comprador (
    id BIGSERIAL PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 27. Tabela: proposta_reserva (Espelho Comercial e Reserva de Unidades)
CREATE TABLE IF NOT EXISTS proposta_reserva (
    id BIGSERIAL PRIMARY KEY,
    unidade_imobiliaria_id BIGINT NOT NULL REFERENCES unidade_imobiliaria(id),
    cliente_comprador_id BIGINT NOT NULL REFERENCES cliente_comprador(id),
    usuario_corretor_id BIGINT REFERENCES usuario(id),
    valor_ofertado NUMERIC(15,2) NOT NULL,
    valor_sinal_entrada NUMERIC(15,2) NOT NULL,
    status_proposta VARCHAR(30) NOT NULL DEFAULT 'EM_ANALISE',
    data_validade_reserva DATE NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reserva_unidade ON proposta_reserva(unidade_imobiliaria_id);

-- 28. Tabela: item_nfe (Itens Faturados na Conciliação NF-e de 44 Dígitos)
CREATE TABLE IF NOT EXISTS item_nfe (
    id BIGSERIAL PRIMARY KEY,
    nfe_chave_44 VARCHAR(44) NOT NULL,
    item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
    quantidade_faturada NUMERIC(12,3) NOT NULL,
    valor_unitario NUMERIC(12,2) NOT NULL,
    valor_total_item NUMERIC(12,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_item_nfe_chave ON item_nfe(nfe_chave_44);
