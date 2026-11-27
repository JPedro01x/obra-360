-- Obra360 — snapshot PostgreSQL para Supabase
-- Consolidado das 40 migrações versionadas do backend: V1 até V41.
-- A V37 não existe no repositório e, por isso, não foi inventada.
-- Inventário confrontado com o documento DEM/ORM: 63 tabelas têm entidade JPA @Table;
-- o arquivo também preserva estruturas auxiliares criadas e usadas pelas migrações.
-- `mensagem_chat.empresa_id` está incluída conforme V35 para o escopo multiempresa.
--
-- COMO USAR
-- 1) Execute UMA VEZ no SQL Editor de um projeto Supabase vazio.
-- 2) Este arquivo cria apenas estrutura e dados técnicos de controle; não inclui dados fictícios,
--    contas, senhas, chaves ou segredos.
-- 3) O backend autentica usuários com seu próprio JWT. As tabelas ficam com RLS ativado e sem
--    políticas para anon/authenticated, bloqueando o acesso direto pelo Data API do Supabase.
--    O backend Java deve conectar-se SOMENTE no servidor usando credencial PostgreSQL privada
--    como proprietária das tabelas (ou role com BYPASSRLS); grants CRUD sem BYPASSRLS não bastam.
--    Nunca exponha a credencial do banco nem a service_role key no navegador.
-- 4) Antes da primeira inicialização do backend após aplicar este snapshot, configure:
--      SPRING_PROFILES_ACTIVE=prod
--      SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
--      SPRING_FLYWAY_BASELINE_VERSION=41
--    Isso registra o snapshot completo como baseline do Flyway; migrações futuras (V42+)
--    continuam sendo aplicadas normalmente. Após o primeiro startup bem-sucedido, o override de
--    BASELINE_VERSION pode ser removido, pois a tabela flyway_schema_history já estará criada.
-- 5) O projeto local padrão usa H2 e NÃO deve ser usado para validar a conexão Supabase.
--
-- Compatibilidade: PostgreSQL do Supabase. Não é um dump binário e não contém schema interno do Supabase.
-- Origem: obra360-backend/src/main/resources/db/migration

BEGIN;
SET search_path TO public;

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'acesso_externo', 'baixa_financeira', 'cliente_comprador', 'cobertura_garantia', 'colaborador', 'contrato_servico', 'convite_usuario', 'cotacao_b2b', 'documento_nfe', 'documento_nfe_evento', 'documento_nfe_item', 'documento_projeto', 'elemento_bim_3d', 'empresa', 'equipe_trabalho', 'etapa_cronograma', 'evento_mensagem', 'evento_pedido', 'evidencia_qualidade', 'exportacao_job', 'extrato_bancario', 'falha_mensageria', 'filial_unidade', 'fornecedor_b2b', 'garantia_pos_venda', 'instalacao', 'insumo_consumido_os', 'integracao_idempotencia', 'item_estoque', 'item_nfe', 'item_pedido_materiais', 'licenca_empresa', 'log_auditoria', 'medicao_fisica', 'medicao_fisica_anexo', 'medicao_fisica_evento', 'mensagem_chat', 'modelo_obra', 'modelo_publicacao_evento', 'modelo_rascunho', 'modelo_referencia', 'modelo_revisao', 'movimentacao_estoque', 'notificacao', 'ocorrencia_qualidade', 'orcamento_obra', 'password_reset', 'pedido_materiais', 'perfil_acesso', 'perfil_permissao', 'permissao', 'projeto_configuracao_etapa', 'projeto_obra', 'proposta_reserva', 'requisicao_compra', 'rh_afastamento', 'rh_beneficio', 'rh_candidato', 'rh_documento', 'rh_estrutura', 'rh_folha', 'rh_funcionario', 'rh_historico', 'rh_lancamento', 'rh_ponto', 'rh_treinamento', 'rh_vaga', 'sessao_acesso', 'solicitacao_atendimento', 'solicitacao_servico', 'storage_ledger', 'storage_usage', 'titulo_financeiro', 'unidade_imobiliaria', 'usage_mutex', 'usage_window', 'usuario', 'usuario_mfa', 'usuario_perfil'
      ])
  ) THEN
    RAISE EXCEPTION 'Tabelas Obra360 já existem em public. Não execute este snapshot sobre dados existentes; use as migrações Flyway.';
  END IF;
END
$guard$;


-- ============================================================================
-- SOURCE V1__schema_inicial.sql
-- ============================================================================
-- V1__schema_inicial.sql: Estrutura inicial de tabelas do Obra360 (Multi-Tenant + Race Condition Protection)

-- 1. Tabela: empresa (Tenant Root)
CREATE TABLE IF NOT EXISTS empresa (
    id BIGSERIAL PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150) NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela: usuario (Identidade & RBAC)
CREATE TABLE IF NOT EXISTS usuario (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    email VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    perfil VARCHAR(30) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    tentativas_login_falhas INT NOT NULL DEFAULT 0,
    bloqueado_ate TIMESTAMP WITH TIME ZONE,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_usuario_empresa ON usuario(empresa_id);

-- 3. Tabela: projeto_obra (Empreendimento)
CREATE TABLE IF NOT EXISTS projeto_obra (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    engenheiro_responsavel_id BIGINT NOT NULL REFERENCES usuario(id),
    nome VARCHAR(150) NOT NULL,
    vgv_estimado NUMERIC(15,2) NOT NULL,
    area_total_m2 NUMERIC(12,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_previsao_fim DATE NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_projeto_empresa ON projeto_obra(empresa_id);

-- 4. Tabela: item_estoque (Almoxarifado / SKU com Proteção Race Condition)
CREATE TABLE IF NOT EXISTS item_estoque (
    id BIGSERIAL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0, -- Optimistic Locking
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    sku VARCHAR(50) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    quantidade_atual NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    estoque_minimo NUMERIC(12,4) NOT NULL DEFAULT 0.0000,
    custo_unitario_medio NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_item_estoque_empresa_sku UNIQUE (empresa_id, sku),
    CONSTRAINT chk_quantidade_nao_negativa CHECK (quantidade_atual >= 0.0000) -- Proteção Física no PostgreSQL
);
CREATE INDEX idx_item_estoque_projeto ON item_estoque(projeto_obra_id);

-- 5. Tabela: movimentacao_estoque (Conciliação Fiscal NFe 44 dígitos)
CREATE TABLE IF NOT EXISTS movimentacao_estoque (
    id BIGSERIAL PRIMARY KEY,
    item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    tipo_movimentacao VARCHAR(20) NOT NULL,
    quantidade NUMERIC(12,4) NOT NULL,
    valor_total NUMERIC(14,2) NOT NULL,
    chave_nfe_44_digitos VARCHAR(44),
    data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_movimentacao_chave_nfe ON movimentacao_estoque(chave_nfe_44_digitos);
CREATE INDEX idx_movimentacao_item ON movimentacao_estoque(item_estoque_id);

-- ============================================================================
-- SOURCE V2__schema_completo_17_tabelas.sql
-- ============================================================================
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

-- ============================================================================
-- SOURCE V3__schema_completo_28_tabelas_corporativo.sql
-- ============================================================================
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
    ordem_servico_id BIGINT NOT NULL REFERENCES solicitacao_servico(id) ON DELETE CASCADE,
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

-- ============================================================================
-- SOURCE V4__validacao_intervalos.sql
-- ============================================================================
-- Validation in the database as well as the API. Existing invalid data must be
-- corrected by its owner before this migration can complete.
ALTER TABLE projeto_obra ADD CONSTRAINT chk_projeto_datas CHECK (data_previsao_fim >= data_inicio);
ALTER TABLE projeto_obra ADD CONSTRAINT chk_projeto_valores CHECK (vgv_estimado >= 0 AND area_total_m2 > 0);

-- ============================================================================
-- SOURCE V5__instalacao.sql
-- ============================================================================
CREATE TABLE instalacao (id BIGINT PRIMARY KEY);

-- ============================================================================
-- SOURCE V6__rastreabilidade_operacional.sql
-- ============================================================================
ALTER TABLE movimentacao_estoque ADD COLUMN ordem_servico_id BIGINT REFERENCES solicitacao_servico(id);
ALTER TABLE movimentacao_estoque ADD COLUMN chave_operacao VARCHAR(36);
ALTER TABLE movimentacao_estoque ADD CONSTRAINT uk_movimentacao_operacao UNIQUE (chave_operacao);
ALTER TABLE insumo_consumido_os ADD CONSTRAINT chk_consumo_positivo CHECK (quantidade_utilizada > 0 AND custo_total_insumo >= 0);
CREATE INDEX idx_movimentacao_os ON movimentacao_estoque(ordem_servico_id);

-- ============================================================================
-- SOURCE V7__fornecedores_por_empresa.sql
-- ============================================================================
-- Existing suppliers have no inferred owner: assign an owner after verifying
-- the original source; unassigned rows are hidden from company catalogs.
ALTER TABLE fornecedor_b2b ADD COLUMN empresa_id BIGINT REFERENCES empresa(id);
CREATE INDEX idx_fornecedor_empresa ON fornecedor_b2b(empresa_id);

-- ============================================================================
-- SOURCE V8__versao_credencial.sql
-- ============================================================================
ALTER TABLE usuario ADD COLUMN versao_credencial BIGINT NOT NULL DEFAULT 0;

-- ============================================================================
-- SOURCE V9__recuperacao_google.sql
-- ============================================================================
CREATE TABLE password_reset (token_hash VARCHAR(64) PRIMARY KEY,usuario_id BIGINT NOT NULL REFERENCES usuario(id),criado_em TIMESTAMP WITH TIME ZONE NOT NULL,expira_em TIMESTAMP WITH TIME ZONE NOT NULL,usado BOOLEAN NOT NULL DEFAULT FALSE);
CREATE INDEX idx_reset_usuario ON password_reset(usuario_id);
ALTER TABLE usuario ADD COLUMN google_subject VARCHAR(255);
ALTER TABLE usuario ADD CONSTRAINT uk_google_subject UNIQUE(google_subject);

-- ============================================================================
-- SOURCE V10__acessos_externos.sql
-- ============================================================================
CREATE TABLE acesso_externo(id BIGSERIAL PRIMARY KEY,empresa_id BIGINT NOT NULL REFERENCES empresa(id),usuario_id BIGINT NOT NULL REFERENCES usuario(id),perfil VARCHAR(30) NOT NULL,projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),unidade_imobiliaria_id BIGINT REFERENCES unidade_imobiliaria(id),fornecedor_b2b_id BIGINT REFERENCES fornecedor_b2b(id));
CREATE INDEX idx_acesso_usuario ON acesso_externo(usuario_id,empresa_id);
ALTER TABLE unidade_imobiliaria ADD COLUMN reserva_usuario_id BIGINT REFERENCES usuario(id);

-- ============================================================================
-- SOURCE V11__recursos_humanos.sql
-- ============================================================================
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

-- ============================================================================
-- SOURCE V12__rh_documentos_historico.sql
-- ============================================================================
-- Arquivos privados e histórico funcional; nenhuma alteração retroativa fictícia.
CREATE TABLE rh_historico (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao BIGINT NOT NULL DEFAULT 0,
    funcionario_id BIGINT NOT NULL REFERENCES rh_funcionario(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    tipo VARCHAR(30) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    data_referencia DATE NOT NULL,
    campos_alterados VARCHAR(500) NOT NULL,
    estado_anterior TEXT,
    estado_atual TEXT NOT NULL
);
CREATE INDEX idx_rh_historico_funcionario ON rh_historico(empresa_id,funcionario_id,id);
CREATE TABLE rh_documento (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    versao BIGINT NOT NULL DEFAULT 0,
    funcionario_id BIGINT NOT NULL REFERENCES rh_funcionario(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    grupo VARCHAR(36) NOT NULL,
    numero_versao INTEGER NOT NULL CHECK (numero_versao>=1),
    documento_anterior_id BIGINT REFERENCES rh_documento(id),
    titulo VARCHAR(150) NOT NULL,
    categoria VARCHAR(30) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(50) NOT NULL,
    tamanho BIGINT NOT NULL CHECK (tamanho>0 AND tamanho<=20971520),
    sha256 VARCHAR(64) NOT NULL,
    referencia_arquivo VARCHAR(50) NOT NULL,
    data_validade DATE,
    arquivado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_rh_documento_versao UNIQUE (empresa_id,funcionario_id,grupo,numero_versao)
);
CREATE INDEX idx_rh_documento_funcionario ON rh_documento(empresa_id,funcionario_id,id);

-- ============================================================================
-- SOURCE V13__modelos_obra_versionados.sql
-- ============================================================================
-- Modelos editáveis reais, separados da geometria demonstrativa legada.
CREATE TABLE modelo_obra (
 id BIGSERIAL PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 nome VARCHAR(150) NOT NULL,
 arquivado BOOLEAN NOT NULL DEFAULT FALSE,
 versao BIGINT NOT NULL DEFAULT 0,
 revisao INTEGER NOT NULL CHECK (revisao>=1),
 documento TEXT NOT NULL,
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_modelo_obra_nome UNIQUE(projeto_obra_id,nome)
);
CREATE INDEX idx_modelo_obra_empresa ON modelo_obra(empresa_id,projeto_obra_id);
CREATE TABLE modelo_revisao (
 id BIGSERIAL PRIMARY KEY,
 modelo_id BIGINT NOT NULL REFERENCES modelo_obra(id),
 empresa_id BIGINT NOT NULL REFERENCES empresa(id),
 usuario_id BIGINT NOT NULL REFERENCES usuario(id),
 numero INTEGER NOT NULL,
 nome VARCHAR(150) NOT NULL,
 motivo VARCHAR(500) NOT NULL,
 documento TEXT NOT NULL,
 criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uq_modelo_revisao UNIQUE(modelo_id,numero)
);
CREATE INDEX idx_modelo_revisao_empresa ON modelo_revisao(empresa_id,modelo_id);

-- ============================================================================
-- SOURCE V14__ambiente_de_dados.sql
-- ============================================================================
ALTER TABLE empresa ADD COLUMN ambiente_dados VARCHAR(20) NOT NULL DEFAULT 'OPERACAO';
ALTER TABLE empresa ADD CONSTRAINT ck_empresa_ambiente CHECK (ambiente_dados IN ('OPERACAO','HOMOLOGACAO'));

-- ============================================================================
-- SOURCE V15__sessoes_acesso.sql
-- ============================================================================
CREATE TABLE sessao_acesso (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    versao_credencial BIGINT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    revogado_em TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_sessao_usuario ON sessao_acesso(usuario_id);

-- ============================================================================
-- SOURCE V16__atendimento.sql
-- ============================================================================
CREATE TABLE solicitacao_atendimento (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    categoria VARCHAR(30) NOT NULL,
    assunto VARCHAR(150) NOT NULL,
    descricao VARCHAR(4000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    resposta VARCHAR(4000),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    versao BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_atendimento_empresa ON solicitacao_atendimento(empresa_id);

-- ============================================================================
-- SOURCE V17__mfa.sql
-- ============================================================================
CREATE TABLE usuario_mfa (
    usuario_id BIGINT PRIMARY KEY REFERENCES usuario(id),
    segredo_cifrado VARCHAR(300) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT FALSE,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    ultimo_contador BIGINT NOT NULL DEFAULT -1,
    codigos_hash VARCHAR(1000) NOT NULL DEFAULT ''
);

-- ============================================================================
-- SOURCE V18__convites.sql
-- ============================================================================
CREATE TABLE convite_usuario (
    id VARCHAR(36) PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    email VARCHAR(120) NOT NULL,
    perfil VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    revogado BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_convite_empresa ON convite_usuario(empresa_id);

-- ============================================================================
-- SOURCE V19__licenca_empresa.sql
-- ============================================================================
CREATE TABLE licenca_empresa (
    empresa_id BIGINT PRIMARY KEY REFERENCES empresa(id),
    plano VARCHAR(40) NOT NULL DEFAULT 'PILOTO',
    limite_usuarios INT NOT NULL DEFAULT 50 CHECK (limite_usuarios > 0),
    limite_projetos INT NOT NULL DEFAULT 50 CHECK (limite_projetos > 0),
    limite_modelos INT NOT NULL DEFAULT 500 CHECK (limite_modelos > 0)
);

-- ============================================================================
-- SOURCE V20__plantas_por_unidade.sql
-- ============================================================================
ALTER TABLE modelo_obra ADD COLUMN unidade_publicada_id BIGINT
    REFERENCES unidade_imobiliaria(id) ON DELETE SET NULL;
CREATE INDEX idx_modelo_unidade_publicada ON modelo_obra(empresa_id, unidade_publicada_id, arquivado);

-- ============================================================================
-- SOURCE V21__revisao_publicada_da_planta.sql
-- ============================================================================
ALTER TABLE modelo_obra ADD COLUMN revisao_publicada INTEGER;

UPDATE modelo_obra SET revisao_publicada = revisao
WHERE unidade_publicada_id IS NOT NULL;

ALTER TABLE modelo_obra ADD CONSTRAINT fk_modelo_revisao_publicada
    FOREIGN KEY (id, revisao_publicada) REFERENCES modelo_revisao(modelo_id, numero);

-- ============================================================================
-- SOURCE V22__rascunhos_e_publicacoes.sql
-- ============================================================================
CREATE TABLE modelo_rascunho (
    id BIGSERIAL PRIMARY KEY,
    modelo_id BIGINT NOT NULL REFERENCES modelo_obra(id),
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    versao_base BIGINT NOT NULL,
    token VARCHAR(36) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    documento TEXT NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_rascunho_modelo_usuario UNIQUE(modelo_id, usuario_id)
);

CREATE TABLE modelo_publicacao_evento (
    id BIGSERIAL PRIMARY KEY,
    modelo_id BIGINT NOT NULL REFERENCES modelo_obra(id),
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    autor VARCHAR(150) NOT NULL,
    unidade_id BIGINT NOT NULL,
    unidade_codigo VARCHAR(80) NOT NULL,
    revisao INTEGER NOT NULL,
    acao VARCHAR(20) NOT NULL,
    ocorrido_em TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_modelo_publicacao_evento ON modelo_publicacao_evento(modelo_id, empresa_id, id);

-- ============================================================================
-- SOURCE V23__referencia_das_revisoes.sql
-- ============================================================================
CREATE TABLE modelo_referencia (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    arquivo_key VARCHAR(40) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    pavimento_id VARCHAR(64) NOT NULL,
    pagina INTEGER NOT NULL,
    x DOUBLE PRECISION NOT NULL,
    z DOUBLE PRECISION NOT NULL,
    largura DOUBLE PRECISION NOT NULL,
    altura DOUBLE PRECISION NOT NULL,
    calibrada BOOLEAN NOT NULL
);

ALTER TABLE modelo_obra ADD COLUMN referencia_id BIGINT REFERENCES modelo_referencia(id);
ALTER TABLE modelo_revisao ADD COLUMN referencia_id BIGINT REFERENCES modelo_referencia(id);

-- ============================================================================
-- SOURCE V24__regras_operacionais_os.sql
-- ============================================================================
ALTER TABLE contrato_servico ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE solicitacao_servico ADD COLUMN exige_material BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE solicitacao_servico ADD COLUMN justificativa_atraso VARCHAR(2000);
ALTER TABLE solicitacao_servico ADD COLUMN solicitante_encerramento_id BIGINT REFERENCES usuario(id);
ALTER TABLE solicitacao_servico ADD COLUMN aprovador_encerramento_id BIGINT REFERENCES usuario(id);

-- ============================================================================
-- SOURCE V25__ciclo_compras.sql
-- ============================================================================
CREATE TABLE requisicao_compra (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
    solicitante_id BIGINT NOT NULL REFERENCES usuario(id),
    quantidade NUMERIC(12,4) NOT NULL CHECK (quantidade > 0),
    justificativa VARCHAR(1000) NOT NULL,
    status VARCHAR(30) NOT NULL,
    cotacao_selecionada_id BIGINT REFERENCES cotacao_b2b(id),
    aprovador_gestao_id BIGINT REFERENCES usuario(id),
    aprovador_financeiro_id BIGINT REFERENCES usuario(id),
    numero_pedido VARCHAR(50) UNIQUE,
    movimentacao_id BIGINT REFERENCES movimentacao_estoque(id),
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
    data_recebimento TIMESTAMP WITH TIME ZONE
);
ALTER TABLE cotacao_b2b ADD COLUMN requisicao_compra_id BIGINT REFERENCES requisicao_compra(id);
CREATE INDEX idx_compra_empresa ON requisicao_compra(empresa_id);
CREATE INDEX idx_cotacao_requisicao ON cotacao_b2b(requisicao_compra_id);

-- ============================================================================
-- SOURCE V26__primeiro_acesso_funcionario.sql
-- ============================================================================
ALTER TABLE usuario ADD COLUMN exige_troca_senha BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_rh_funcionario_usuario ON rh_funcionario(usuario_id);

-- ============================================================================
-- SOURCE V27__qualidade_e_garantia.sql
-- ============================================================================
CREATE TABLE evidencia_qualidade (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    ocorrencia_id BIGINT NOT NULL REFERENCES ocorrencia_qualidade(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    arquivo_key VARCHAR(50) NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    mime VARCHAR(30) NOT NULL,
    tamanho BIGINT NOT NULL CHECK(tamanho > 0),
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_evidencia_ocorrencia ON evidencia_qualidade(ocorrencia_id);
CREATE TABLE cobertura_garantia (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    unidade_id BIGINT NOT NULL REFERENCES unidade_imobiliaria(id),
    categoria VARCHAR(50) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    descricao VARCHAR(1000) NOT NULL,
    ativo BOOLEAN NOT NULL,
    UNIQUE(unidade_id,categoria),
    CHECK(data_fim >= data_inicio)
);
CREATE INDEX idx_cobertura_empresa ON cobertura_garantia(empresa_id);
ALTER TABLE garantia_pos_venda ADD COLUMN cobertura_id BIGINT REFERENCES cobertura_garantia(id);
ALTER TABLE garantia_pos_venda ADD COLUMN situacao_cobertura VARCHAR(30);
ALTER TABLE garantia_pos_venda ADD COLUMN motivo_avaliacao VARCHAR(2000);
ALTER TABLE garantia_pos_venda ADD COLUMN avaliador_id BIGINT REFERENCES usuario(id);
ALTER TABLE garantia_pos_venda ADD COLUMN vistoria_em TIMESTAMP WITH TIME ZONE;
ALTER TABLE garantia_pos_venda ADD COLUMN responsavel_vistoria_id BIGINT REFERENCES usuario(id);
ALTER TABLE garantia_pos_venda ADD COLUMN ordem_servico_id BIGINT REFERENCES solicitacao_servico(id);
CREATE TABLE notificacao (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    mensagem VARCHAR(500) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    lido_em TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_notificacao_usuario ON notificacao(empresa_id,usuario_id,lido_em);

-- ============================================================================
-- SOURCE V28__orcamento_financeiro_pedidos.sql
-- ============================================================================
CREATE TABLE orcamento_obra (
 id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id), projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 versao BIGINT NOT NULL DEFAULT 0, criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 revisao INTEGER NOT NULL, valor_aprovado NUMERIC(15,2) NOT NULL CHECK(valor_aprovado>0),
 situacao VARCHAR(20) NOT NULL, justificativa VARCHAR(1000) NOT NULL,
 autor_id BIGINT NOT NULL REFERENCES usuario(id), aprovador_id BIGINT REFERENCES usuario(id),
 UNIQUE(projeto_obra_id,revisao)
);
CREATE TABLE titulo_financeiro (
 id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id), projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 versao BIGINT NOT NULL DEFAULT 0, criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 tipo VARCHAR(10) NOT NULL CHECK(tipo IN ('PAGAR','RECEBER')), categoria VARCHAR(40) NOT NULL,
 descricao VARCHAR(250) NOT NULL, contraparte VARCHAR(150) NOT NULL,
 valor NUMERIC(15,2) NOT NULL CHECK(valor>0), baixado NUMERIC(15,2) NOT NULL CHECK(baixado>=0 AND baixado<=valor),
 vencimento DATE NOT NULL, situacao VARCHAR(20) NOT NULL, origem VARCHAR(100), UNIQUE(empresa_id,origem)
);
CREATE TABLE baixa_financeira (
 id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id), projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 versao BIGINT NOT NULL DEFAULT 0, criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 titulo_id BIGINT NOT NULL REFERENCES titulo_financeiro(id), chave VARCHAR(36) NOT NULL,
 valor NUMERIC(15,2) NOT NULL CHECK(valor<>0), data_efetiva DATE NOT NULL,
 conta VARCHAR(80) NOT NULL, observacao VARCHAR(500) NOT NULL, operador_id BIGINT NOT NULL REFERENCES usuario(id),
 estorno_de BIGINT UNIQUE REFERENCES baixa_financeira(id), estornado BOOLEAN NOT NULL DEFAULT FALSE,
 UNIQUE(empresa_id,chave)
);
CREATE TABLE extrato_bancario (
 id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id), projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 versao BIGINT NOT NULL DEFAULT 0, criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 conta VARCHAR(80) NOT NULL, identificador VARCHAR(100) NOT NULL, data DATE NOT NULL,
 descricao VARCHAR(250) NOT NULL, valor NUMERIC(15,2) NOT NULL CHECK(valor<>0),
 baixa_id BIGINT UNIQUE REFERENCES baixa_financeira(id), UNIQUE(empresa_id,conta,identificador)
);
CREATE TABLE pedido_materiais (
 id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id), projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 versao BIGINT NOT NULL DEFAULT 0, criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 fornecedor_b2b_id BIGINT NOT NULL REFERENCES fornecedor_b2b(id), justificativa VARCHAR(1000) NOT NULL,
 referencia_proposta VARCHAR(150) NOT NULL, total NUMERIC(15,2) NOT NULL CHECK(total>0),
 situacao VARCHAR(30) NOT NULL, vencimento DATE NOT NULL,
 aprovador_gestao_id BIGINT REFERENCES usuario(id), aprovador_financeiro_id BIGINT REFERENCES usuario(id),
 titulo_id BIGINT REFERENCES titulo_financeiro(id)
);
CREATE TABLE item_pedido_materiais (
 id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id), projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 versao BIGINT NOT NULL DEFAULT 0, criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 pedido_id BIGINT NOT NULL REFERENCES pedido_materiais(id), item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
 quantidade NUMERIC(12,4) NOT NULL CHECK(quantidade>0), valor_unitario NUMERIC(12,2) NOT NULL CHECK(valor_unitario>0),
 recebida NUMERIC(12,4) NOT NULL CHECK(recebida>=0 AND recebida<=quantidade),
 devolvida NUMERIC(12,4) NOT NULL CHECK(devolvida>=0 AND devolvida<=recebida),
 UNIQUE(pedido_id,item_estoque_id)
);
CREATE TABLE evento_pedido (
 id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
 empresa_id BIGINT NOT NULL REFERENCES empresa(id), projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
 versao BIGINT NOT NULL DEFAULT 0, criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
 pedido_id BIGINT NOT NULL REFERENCES pedido_materiais(id), chave VARCHAR(36) NOT NULL,
 tipo VARCHAR(10) NOT NULL, assinatura VARCHAR(64) NOT NULL, operador_id BIGINT NOT NULL REFERENCES usuario(id),
 observacao VARCHAR(1000) NOT NULL, itens TEXT NOT NULL, credito_id BIGINT REFERENCES titulo_financeiro(id),
 UNIQUE(empresa_id,chave)
);
CREATE INDEX idx_orcamento_obra ON orcamento_obra(empresa_id,projeto_obra_id,situacao);
CREATE INDEX idx_titulo_saldo ON titulo_financeiro(empresa_id,projeto_obra_id,situacao,vencimento);
CREATE INDEX idx_baixa_titulo ON baixa_financeira(empresa_id,titulo_id);
CREATE INDEX idx_extrato_conta ON extrato_bancario(empresa_id,conta,data);
CREATE INDEX idx_pedido_obra ON pedido_materiais(empresa_id,projeto_obra_id);
CREATE INDEX idx_evento_pedido ON evento_pedido(empresa_id,pedido_id);

-- ============================================================================
-- SOURCE V29__exportacoes_assincronas.sql
-- ============================================================================
CREATE TABLE exportacao_job (
 id VARCHAR(36) PRIMARY KEY, empresa_id BIGINT NOT NULL REFERENCES empresa(id), usuario_id BIGINT NOT NULL REFERENCES usuario(id),
 situacao VARCHAR(20) NOT NULL, criado_em TIMESTAMP WITH TIME ZONE NOT NULL, expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
 mensagem VARCHAR(250) NOT NULL, tamanho BIGINT NOT NULL
);
CREATE INDEX idx_exportacao_empresa ON exportacao_job(empresa_id,criado_em);

-- ============================================================================
-- SOURCE V30__mensageria_ordens.sql
-- ============================================================================
CREATE TABLE evento_mensagem (
    id VARCHAR(36) PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    ordem_id BIGINT NOT NULL REFERENCES solicitacao_servico(id),
    protocolo VARCHAR(80) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    proxima_tentativa TIMESTAMP WITH TIME ZONE NOT NULL,
    publicado_em TIMESTAMP WITH TIME ZONE,
    processado_em TIMESTAMP WITH TIME ZONE,
    tentativas INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_evento_mensagem_pendente ON evento_mensagem(publicado_em, proxima_tentativa);

-- ============================================================================
-- SOURCE V31__quarentena_mensageria.sql
-- ============================================================================
CREATE TABLE falha_mensageria (
    id VARCHAR(36) PRIMARY KEY,
    empresa_id BIGINT REFERENCES empresa(id),
    evento_id VARCHAR(36),
    topico VARCHAR(249) NOT NULL,
    particao INTEGER NOT NULL,
    deslocamento BIGINT NOT NULL,
    hash_conteudo VARCHAR(64) NOT NULL,
    tipo_erro VARCHAR(160) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    resolvido_em TIMESTAMP WITH TIME ZONE,
    operador_id BIGINT REFERENCES usuario(id)
);
CREATE INDEX idx_falha_mensageria_empresa ON falha_mensageria(empresa_id, resolvido_em, criado_em);
CREATE INDEX idx_falha_mensageria_evento ON falha_mensageria(evento_id);

-- ============================================================================
-- SOURCE V32__shared_usage_limits.sql
-- ============================================================================
CREATE TABLE usage_mutex (id INTEGER PRIMARY KEY);
CREATE TABLE usage_window (
 bucket_key VARCHAR(64) PRIMARY KEY,
 stripe INTEGER NOT NULL,
 starts_at BIGINT NOT NULL,
 hits INTEGER NOT NULL CHECK (hits > 0)
);
CREATE INDEX ix_usage_window_expiry ON usage_window(starts_at);
CREATE INDEX ix_usage_window_stripe ON usage_window(stripe);
INSERT INTO usage_mutex(id) VALUES (0);
INSERT INTO usage_mutex(id) VALUES (1);
INSERT INTO usage_mutex(id) VALUES (2);
INSERT INTO usage_mutex(id) VALUES (3);
INSERT INTO usage_mutex(id) VALUES (4);
INSERT INTO usage_mutex(id) VALUES (5);
INSERT INTO usage_mutex(id) VALUES (6);
INSERT INTO usage_mutex(id) VALUES (7);
INSERT INTO usage_mutex(id) VALUES (8);
INSERT INTO usage_mutex(id) VALUES (9);
INSERT INTO usage_mutex(id) VALUES (10);
INSERT INTO usage_mutex(id) VALUES (11);
INSERT INTO usage_mutex(id) VALUES (12);
INSERT INTO usage_mutex(id) VALUES (13);
INSERT INTO usage_mutex(id) VALUES (14);
INSERT INTO usage_mutex(id) VALUES (15);
INSERT INTO usage_mutex(id) VALUES (16);
INSERT INTO usage_mutex(id) VALUES (17);
INSERT INTO usage_mutex(id) VALUES (18);
INSERT INTO usage_mutex(id) VALUES (19);
INSERT INTO usage_mutex(id) VALUES (20);
INSERT INTO usage_mutex(id) VALUES (21);
INSERT INTO usage_mutex(id) VALUES (22);
INSERT INTO usage_mutex(id) VALUES (23);
INSERT INTO usage_mutex(id) VALUES (24);
INSERT INTO usage_mutex(id) VALUES (25);
INSERT INTO usage_mutex(id) VALUES (26);
INSERT INTO usage_mutex(id) VALUES (27);
INSERT INTO usage_mutex(id) VALUES (28);
INSERT INTO usage_mutex(id) VALUES (29);
INSERT INTO usage_mutex(id) VALUES (30);
INSERT INTO usage_mutex(id) VALUES (31);
INSERT INTO usage_mutex(id) VALUES (32);
INSERT INTO usage_mutex(id) VALUES (33);
INSERT INTO usage_mutex(id) VALUES (34);
INSERT INTO usage_mutex(id) VALUES (35);
INSERT INTO usage_mutex(id) VALUES (36);
INSERT INTO usage_mutex(id) VALUES (37);
INSERT INTO usage_mutex(id) VALUES (38);
INSERT INTO usage_mutex(id) VALUES (39);
INSERT INTO usage_mutex(id) VALUES (40);
INSERT INTO usage_mutex(id) VALUES (41);
INSERT INTO usage_mutex(id) VALUES (42);
INSERT INTO usage_mutex(id) VALUES (43);
INSERT INTO usage_mutex(id) VALUES (44);
INSERT INTO usage_mutex(id) VALUES (45);
INSERT INTO usage_mutex(id) VALUES (46);
INSERT INTO usage_mutex(id) VALUES (47);
INSERT INTO usage_mutex(id) VALUES (48);
INSERT INTO usage_mutex(id) VALUES (49);
INSERT INTO usage_mutex(id) VALUES (50);
INSERT INTO usage_mutex(id) VALUES (51);
INSERT INTO usage_mutex(id) VALUES (52);
INSERT INTO usage_mutex(id) VALUES (53);
INSERT INTO usage_mutex(id) VALUES (54);
INSERT INTO usage_mutex(id) VALUES (55);
INSERT INTO usage_mutex(id) VALUES (56);
INSERT INTO usage_mutex(id) VALUES (57);
INSERT INTO usage_mutex(id) VALUES (58);
INSERT INTO usage_mutex(id) VALUES (59);
INSERT INTO usage_mutex(id) VALUES (60);
INSERT INTO usage_mutex(id) VALUES (61);
INSERT INTO usage_mutex(id) VALUES (62);
INSERT INTO usage_mutex(id) VALUES (63);

-- ============================================================================
-- SOURCE V33__tenant_storage_ledger.sql
-- ============================================================================
-- No historical files are attributed to a tenant by this migration.
CREATE TABLE storage_usage (
 tenant_id BIGINT PRIMARY KEY,
 used_bytes BIGINT NOT NULL CHECK (used_bytes >= 0),
 limit_bytes BIGINT CHECK (limit_bytes >= 0)
);
CREATE TABLE storage_ledger (
 file_key VARCHAR(64) PRIMARY KEY,
 tenant_id BIGINT NOT NULL,
 size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0)
);
CREATE INDEX ix_storage_ledger_tenant ON storage_ledger(tenant_id);

-- ============================================================================
-- SOURCE V34__exportacao_recuperavel.sql
-- ============================================================================
ALTER TABLE exportacao_job ADD COLUMN tentativas INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exportacao_job ADD COLUMN proxima_tentativa_em TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_exportacao_fila ON exportacao_job (situacao, proxima_tentativa_em, criado_em);

-- ============================================================================
-- SOURCE V35__chat_corporativo_tenant.sql
-- ============================================================================
ALTER TABLE mensagem_chat ADD COLUMN empresa_id BIGINT;

UPDATE mensagem_chat
SET empresa_id = (SELECT u.empresa_id FROM usuario u WHERE u.id = mensagem_chat.remetente_id)
WHERE empresa_id IS NULL;

ALTER TABLE mensagem_chat ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE mensagem_chat ADD CONSTRAINT fk_mensagem_chat_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id);
CREATE INDEX idx_chat_empresa_conversa ON mensagem_chat(empresa_id, remetente_id, destinatario_id, data_envio);

-- ============================================================================
-- SOURCE V36__medicao_fisica.sql
-- ============================================================================
CREATE TABLE medicao_fisica (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    etapa_cronograma_id BIGINT NOT NULL REFERENCES etapa_cronograma(id),
    competencia DATE NOT NULL,
    descricao VARCHAR(2000) NOT NULL,
    quantidade NUMERIC(15,4) NOT NULL CHECK (quantidade > 0),
    unidade VARCHAR(20) NOT NULL,
    percentual_anterior NUMERIC(5,2) NOT NULL CHECK (percentual_anterior BETWEEN 0 AND 100),
    percentual_medido NUMERIC(5,2) NOT NULL CHECK (percentual_medido BETWEEN percentual_anterior AND 100),
    valor_medido NUMERIC(15,2) NOT NULL CHECK (valor_medido >= 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('EM_MEDICAO','APROVADO_ENGENHEIRO','LIBERADO_FINANCEIRO')),
    criado_por BIGINT NOT NULL REFERENCES usuario(id),
    aprovado_por BIGINT REFERENCES usuario(id),
    liberado_por BIGINT REFERENCES usuario(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_medicao_empresa_etapa_competencia UNIQUE (empresa_id, etapa_cronograma_id, competencia)
);
CREATE INDEX idx_medicao_empresa_obra ON medicao_fisica(empresa_id, projeto_obra_id, competencia DESC);
CREATE INDEX idx_medicao_etapa ON medicao_fisica(empresa_id, etapa_cronograma_id);

CREATE TABLE medicao_fisica_evento (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    medicao_id BIGINT NOT NULL REFERENCES medicao_fisica(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    acao VARCHAR(40) NOT NULL,
    status_anterior VARCHAR(30),
    status_novo VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_medicao_evento_empresa ON medicao_fisica_evento(empresa_id, medicao_id, criado_em);

-- ============================================================================
-- SOURCE V38__idempotencia_integracoes.sql
-- ============================================================================
CREATE TABLE integracao_idempotencia (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    operacao VARCHAR(20) NOT NULL CHECK (operacao IN ('IA','SEFAZ')),
    chave_hash VARCHAR(64) NOT NULL,
    solicitacao_hash VARCHAR(64) NOT NULL,
    situacao VARCHAR(20) NOT NULL CHECK (situacao IN ('PROCESSANDO','CONCLUIDA','FALHA')),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finalizado_em TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_integracao_idempotencia_chave UNIQUE (empresa_id, usuario_id, operacao, chave_hash)
);
CREATE INDEX idx_integracao_idempotencia_expira ON integracao_idempotencia(criado_em);

-- ============================================================================
-- SOURCE V39__persistencia_documentos_nfe.sql
-- ============================================================================
CREATE TABLE documento_nfe (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    fornecedor_id BIGINT NOT NULL REFERENCES fornecedor_b2b(id),
    criado_por BIGINT NOT NULL REFERENCES usuario(id),
    chave_nfe VARCHAR(44) NOT NULL,
    numero VARCHAR(30) NOT NULL,
    data_emissao DATE NOT NULL,
    valor_total NUMERIC(14,2) NOT NULL CHECK (valor_total > 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDENTE_CONFERENCIA','ENTRADA_REGISTRADA','CANCELADA')),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_documento_nfe_empresa_chave UNIQUE (empresa_id, chave_nfe)
);
CREATE INDEX idx_documento_nfe_empresa_data ON documento_nfe(empresa_id, criado_em DESC);

CREATE TABLE documento_nfe_item (
    id BIGSERIAL PRIMARY KEY,
    documento_nfe_id BIGINT NOT NULL REFERENCES documento_nfe(id),
    item_estoque_id BIGINT NOT NULL REFERENCES item_estoque(id),
    quantidade NUMERIC(12,4) NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(12,2) NOT NULL CHECK (valor_unitario >= 0),
    valor_total NUMERIC(14,2) NOT NULL CHECK (valor_total >= 0),
    CONSTRAINT uk_documento_nfe_item_estoque UNIQUE (documento_nfe_id, item_estoque_id)
);

CREATE TABLE documento_nfe_evento (
    id BIGSERIAL PRIMARY KEY,
    documento_nfe_id BIGINT NOT NULL REFERENCES documento_nfe(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    tipo VARCHAR(40) NOT NULL,
    observacao VARCHAR(300) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_documento_nfe_evento_documento ON documento_nfe_evento(documento_nfe_id, criado_em);

ALTER TABLE movimentacao_estoque ADD COLUMN documento_nfe_id BIGINT REFERENCES documento_nfe(id);
ALTER TABLE movimentacao_estoque ADD CONSTRAINT uk_movimentacao_documento_nfe_item UNIQUE (documento_nfe_id, item_estoque_id);

-- ============================================================================
-- SOURCE V40__anexos_medicao_fisica.sql
-- ============================================================================
CREATE TABLE medicao_fisica_anexo (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    medicao_id BIGINT NOT NULL REFERENCES medicao_fisica(id),
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    nome_arquivo VARCHAR(255) NOT NULL,
    arquivo_key VARCHAR(64) NOT NULL UNIQUE,
    sha256 VARCHAR(64) NOT NULL,
    mime VARCHAR(40) NOT NULL CHECK (mime IN ('application/pdf','image/jpeg','image/png')),
    tamanho BIGINT NOT NULL CHECK (tamanho > 0 AND tamanho <= 20971520),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_medicao_anexo_tenant_medicao ON medicao_fisica_anexo(empresa_id, medicao_id, criado_em);

-- ============================================================================
-- SOURCE V41__projeto_configuracao_etapas.sql
-- ============================================================================
CREATE TABLE projeto_configuracao_etapa (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa(id),
    projeto_obra_id BIGINT NOT NULL REFERENCES projeto_obra(id),
    etapa VARCHAR(30) NOT NULL,
    justificativa VARCHAR(300) NOT NULL,
    usuario_id BIGINT NOT NULL REFERENCES usuario(id),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_projeto_configuracao_etapa UNIQUE (empresa_id, projeto_obra_id, etapa),
    CONSTRAINT ck_projeto_configuracao_etapa CHECK (etapa IN ('responsaveis','equipe','materiais','cronograma','planta2d','cliente'))
);
CREATE INDEX idx_projeto_configuracao_empresa_obra ON projeto_configuracao_etapa(empresa_id, projeto_obra_id);

-- ============================================================================
-- Segurança Supabase: backend privado usa JDBC; Data API não recebe acesso direto.
-- Sem políticas, RLS nega SELECT/INSERT/UPDATE/DELETE para roles comuns.
-- Não use FORCE ROW LEVEL SECURITY: o backend deve conectar como dono/role privilegiada.
-- ============================================================================
ALTER TABLE public.acesso_externo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baixa_financeira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_comprador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobertura_garantia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convite_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacao_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_nfe_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_nfe_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_projeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elemento_bim_3d ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapa_cronograma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidencia_qualidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exportacao_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.falha_mensageria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filial_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_b2b ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garantia_pos_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumo_consumido_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integracao_idempotencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_pedido_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenca_empresa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicao_fisica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicao_fisica_anexo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicao_fisica_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagem_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelo_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelo_publicacao_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelo_rascunho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelo_referencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelo_revisao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacao_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencia_qualidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orcamento_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_permissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_configuracao_etapa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_reserva ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicao_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_afastamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_beneficio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_candidato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_estrutura ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_folha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_funcionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_lancamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_treinamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_vaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessao_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacao_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacao_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titulo_financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidade_imobiliaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_mutex ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_window ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_perfil ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.acesso_externo,
  public.baixa_financeira,
  public.cliente_comprador,
  public.cobertura_garantia,
  public.colaborador,
  public.contrato_servico,
  public.convite_usuario,
  public.cotacao_b2b,
  public.documento_nfe,
  public.documento_nfe_evento,
  public.documento_nfe_item,
  public.documento_projeto,
  public.elemento_bim_3d,
  public.empresa,
  public.equipe_trabalho,
  public.etapa_cronograma,
  public.evento_mensagem,
  public.evento_pedido,
  public.evidencia_qualidade,
  public.exportacao_job,
  public.extrato_bancario,
  public.falha_mensageria,
  public.filial_unidade,
  public.fornecedor_b2b,
  public.garantia_pos_venda,
  public.instalacao,
  public.insumo_consumido_os,
  public.integracao_idempotencia,
  public.item_estoque,
  public.item_nfe,
  public.item_pedido_materiais,
  public.licenca_empresa,
  public.log_auditoria,
  public.medicao_fisica,
  public.medicao_fisica_anexo,
  public.medicao_fisica_evento,
  public.mensagem_chat,
  public.modelo_obra,
  public.modelo_publicacao_evento,
  public.modelo_rascunho,
  public.modelo_referencia,
  public.modelo_revisao,
  public.movimentacao_estoque,
  public.notificacao,
  public.ocorrencia_qualidade,
  public.orcamento_obra,
  public.password_reset,
  public.pedido_materiais,
  public.perfil_acesso,
  public.perfil_permissao,
  public.permissao,
  public.projeto_configuracao_etapa,
  public.projeto_obra,
  public.proposta_reserva,
  public.requisicao_compra,
  public.rh_afastamento,
  public.rh_beneficio,
  public.rh_candidato,
  public.rh_documento,
  public.rh_estrutura,
  public.rh_folha,
  public.rh_funcionario,
  public.rh_historico,
  public.rh_lancamento,
  public.rh_ponto,
  public.rh_treinamento,
  public.rh_vaga,
  public.sessao_acesso,
  public.solicitacao_atendimento,
  public.solicitacao_servico,
  public.storage_ledger,
  public.storage_usage,
  public.titulo_financeiro,
  public.unidade_imobiliaria,
  public.usage_mutex,
  public.usage_window,
  public.usuario,
  public.usuario_mfa,
  public.usuario_perfil
FROM anon, authenticated;

DO $revoke_sequences$
DECLARE
  seq record;
BEGIN
  FOR seq IN
    SELECT sn.nspname AS schema_name, s.relname AS sequence_name
    FROM pg_catalog.pg_class s
    JOIN pg_catalog.pg_namespace sn ON sn.oid = s.relnamespace
    JOIN pg_catalog.pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
    JOIN pg_catalog.pg_class t ON t.oid = d.refobjid
    JOIN pg_catalog.pg_namespace tn ON tn.oid = t.relnamespace
    WHERE s.relkind = 'S'
      AND sn.nspname = 'public'
      AND tn.nspname = 'public'
      AND t.relname = ANY (ARRAY[
        'acesso_externo', 'baixa_financeira', 'cliente_comprador', 'cobertura_garantia', 'colaborador', 'contrato_servico', 'convite_usuario', 'cotacao_b2b', 'documento_nfe', 'documento_nfe_evento', 'documento_nfe_item', 'documento_projeto', 'elemento_bim_3d', 'empresa', 'equipe_trabalho', 'etapa_cronograma', 'evento_mensagem', 'evento_pedido', 'evidencia_qualidade', 'exportacao_job', 'extrato_bancario', 'falha_mensageria', 'filial_unidade', 'fornecedor_b2b', 'garantia_pos_venda', 'instalacao', 'insumo_consumido_os', 'integracao_idempotencia', 'item_estoque', 'item_nfe', 'item_pedido_materiais', 'licenca_empresa', 'log_auditoria', 'medicao_fisica', 'medicao_fisica_anexo', 'medicao_fisica_evento', 'mensagem_chat', 'modelo_obra', 'modelo_publicacao_evento', 'modelo_rascunho', 'modelo_referencia', 'modelo_revisao', 'movimentacao_estoque', 'notificacao', 'ocorrencia_qualidade', 'orcamento_obra', 'password_reset', 'pedido_materiais', 'perfil_acesso', 'perfil_permissao', 'permissao', 'projeto_configuracao_etapa', 'projeto_obra', 'proposta_reserva', 'requisicao_compra', 'rh_afastamento', 'rh_beneficio', 'rh_candidato', 'rh_documento', 'rh_estrutura', 'rh_folha', 'rh_funcionario', 'rh_historico', 'rh_lancamento', 'rh_ponto', 'rh_treinamento', 'rh_vaga', 'sessao_acesso', 'solicitacao_atendimento', 'solicitacao_servico', 'storage_ledger', 'storage_usage', 'titulo_financeiro', 'unidade_imobiliaria', 'usage_mutex', 'usage_window', 'usuario', 'usuario_mfa', 'usuario_perfil'
      ])
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE %I.%I FROM anon, authenticated', seq.schema_name, seq.sequence_name);
  END LOOP;
END
$revoke_sequences$;

COMMIT;
