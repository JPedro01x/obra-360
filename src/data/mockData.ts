import { 
  RoleId, UserRole, RegisteredAccount, BuildingElement, StockItem, 
  StockMovement, AuditLog, EcosystemStage, B2bMaterialRFQ, 
  EquipmentRentalItem, RealEstateUnit, WarrantyPostSalesTicket,
  Project, ProjectDocument, ConstructionOccurrence, Company 
} from '../types';

/* ========================================================================= */
/* MULTI-TENANT ENTERPRISE COMPANIES (PROD CLEAN SLATE)                      */
/* ========================================================================= */

export const INITIAL_COMPANIES: Company[] = [];


export const USER_ROLES: Record<RoleId, UserRole> = {
  SUPER_ADMIN: {
    id: 'SUPER_ADMIN',
    title: 'Super Administrador (TI)',
    department: 'Governança & TI Corporativa',
    level: 'Nível 1 - Gestão Estratégica',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    permissions: ['all'],
    description: 'Acesso total e irrestrito ao sistema, infraestrutura, conciliação de banco de dados e gestão de permissões.',
    defaultEmail: 'admin.ti@obra360.com'
  },
  INCORPORADOR: {
    id: 'INCORPORADOR',
    title: 'Incorporador & Desenvolvedor',
    department: 'Incorporação & Novos Negócios',
    level: 'Nível 1 - Gestão Estratégica',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    permissions: ['projetos.ver', 'projetos.criar', 'vgv.ver', 'vendas.ver', 'relatorios.executivo'],
    description: 'Análise de viabilidade técnica, aquisição de terrenos, definição do VGV e lançamento dos empreendimentos.',
    defaultEmail: 'marcos.incorporador@obra360.com'
  },
  GERENTE_OBRA: {
    id: 'GERENTE_OBRA',
    title: 'Gerente Geral de Obras',
    department: 'Diretoria de Engenharia',
    level: 'Nível 1 - Gestão Estratégica',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    permissions: ['projetos.ver', 'cronograma.editar', 'orcamento.ver', 'medicao.aprovar', 'usuarios.contratar'],
    description: 'Responsável executivo pelo cumprimento da Curva S, alocação de recursos WBS e gestão dos canteiros.',
    defaultEmail: 'amanda.gerente@obra360.com'
  },
  ARQUITETO: {
    id: 'ARQUITETO',
    title: 'Arquiteto & Projetista BIM',
    department: 'Arquitetura & Projetos',
    level: 'Nível 2 - Engenharia & Operação',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    permissions: ['modelo3d.editar', 'projetos.versionar', 'projetos.aprovar'],
    description: 'Desenvolvimento das pranchas 2D/3D BIM, compatibilização espacial e versionamento técnico (v1.0, v2.0).',
    defaultEmail: 'lucas.arquiteto@obra360.com'
  },
  ENGENHEIRO: {
    id: 'ENGENHEIRO',
    title: 'Engenheiro Residente (Campo)',
    department: 'Engenharia de Campo',
    level: 'Nível 2 - Engenharia & Operação',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    permissions: ['modelo3d.editar', 'etapas.atualizar', 'ocorrencias.criar', 'qualidade.laudo'],
    description: 'Supervisão técnica no canteiro, ensaios de concreto (Fck 30MPa), medições de avanço e RDO.',
    defaultEmail: 'carlos.engenheiro@obra360.com'
  },
  FINANCEIRO: {
    id: 'FINANCEIRO',
    title: 'Analista Financeiro & Custos',
    department: 'Controladoria & Finanças',
    level: 'Nível 2 - Engenharia & Operação',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    permissions: ['orcamento.ver', 'custos.faturar', 'nfe.conciliar', 'relatorios.executivo'],
    description: 'Gestão de faturamento por Nota Fiscal (NFe), conciliação orçamentária e relatórios de DRE executivo.',
    defaultEmail: 'beatriz.financeiro@obra360.com'
  },
  FORNECEDOR: {
    id: 'FORNECEDOR',
    title: 'Fornecedor B2B de Materiais',
    department: 'Rede de Fornecedores B2B',
    level: 'Nível 5 - Negócios & Mercado B2B/B2C',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    permissions: ['rfq.responder', 'pedidos.faturar', 'catalogo.gerenciar'],
    description: 'Envio de cotações de insumos (cimento, aço CA-50, tijolos), faturamento direto NFe e entregas.',
    defaultEmail: 'votoran.fornecedor@obra360.com'
  },
  LOCADOR_MAQUINAS: {
    id: 'LOCADOR_MAQUINAS',
    title: 'Locador de Máquinas & Equipamentos',
    department: 'Locação de Frota Pesada',
    level: 'Nível 5 - Negócios & Mercado B2B/B2C',
    badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    permissions: ['frota.gerenciar', 'locacao.contratar', 'manutencao.registrar'],
    description: 'Gestão de catálogo de escavadeiras hidráulicas, guindastes munck, betoneiras e andaimes.',
    defaultEmail: 'cat.locadora@obra360.com'
  },
  MESTRE_OBRA: {
    id: 'MESTRE_OBRA',
    title: 'Mestre de Obras',
    department: 'Operações de Canteiro',
    level: 'Nível 3 - Execução & Logística',
    badgeColor: 'bg-yellow-600/20 text-yellow-500 border-yellow-600/30',
    permissions: ['etapas.atualizar', 'diario.criar', 'foto.capturar', 'estoque.solicitar'],
    description: 'Liderança operacional da equipe de pedreiros e armadores, foto diário e solicitações de insumo.',
    defaultEmail: 'ze.mestre@obra360.com'
  },
  ALMOXARIFE: {
    id: 'ALMOXARIFE',
    title: 'Almoxarife Chefe',
    department: 'Logística de Materiais',
    level: 'Nível 3 - Execução & Logística',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    permissions: ['estoque.entrada', 'estoque.saida', 'nfe.registrar', 'estoque.conferir'],
    description: 'Recebimento de cargas por chave NFe, movimentação física do estoque e baixas de canteiro.',
    defaultEmail: 'roberto.almoxarife@obra360.com'
  },
  CORRETOR: {
    id: 'CORRETOR',
    title: 'Corretor / Imobiliária Parceira',
    department: 'Hub Comercial & Imobiliário',
    level: 'Nível 5 - Negócios & Mercado B2B/B2C',
    badgeColor: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
    permissions: ['vendas.ver', 'unidades.reservar', 'simulador.usar'],
    description: 'Acesso ao Espelho de Vendas de Unidades em Tempo Real, reserva de apartamentos e simulação de crédito.',
    defaultEmail: 'fernanda.corretora@obra360.com'
  },
  INVESTIDOR: {
    id: 'INVESTIDOR',
    title: 'Investidor Imobiliário',
    department: 'Mercado de Capital & VGV',
    level: 'Nível 5 - Negócios & Mercado B2B/B2C',
    badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
    permissions: ['vgv.ver', 'roi.acompanhar', 'relatorios.investidor'],
    description: 'Acompanhamento do retorno financeiro (ROI), participação no VGV e valorização por m².',
    defaultEmail: 'ricardo.investidor@obra360.com'
  },
  CLIENTE: {
    id: 'CLIENTE',
    title: 'Cliente Proprietário (Sua Casa)',
    department: 'Experiência do Cliente & Pós-Venda',
    level: 'Nível 4 - Transparência & Auditoria',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    permissions: ['cliente.ver', 'obras.acompanhar', 'posvenda.abrir'],
    description: 'Acompanhamento da evolução física (78%), contagem regressiva para chaves e chamados pós-obra.',
    defaultEmail: 'joao.cliente@obra360.com'
  },
  AUDITOR: {
    id: 'AUDITOR',
    title: 'Auditor Interno de Riscos',
    department: 'Auditoria & Compliance',
    level: 'Nível 4 - Transparência & Auditoria',
    badgeColor: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
    permissions: ['logs.ver', 'auditoria.exportar', 'compliance.laudo'],
    description: 'Perícia nos logs imutáveis do banco de dados (MongoDB), controle de rastreabilidade e ISO 9001.',
    defaultEmail: 'auditor.compliance@obra360.com'
  }
};

/* ========================================================================= */
/* ENTERPRISE PROJECTS & DOCUMENTS (PROD CLEAN SLATE)                       */
/* ========================================================================= */

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_DOCUMENTS: ProjectDocument[] = [];
export const INITIAL_OCCURRENCES: ConstructionOccurrence[] = [];

/* ========================================================================= */
/* REGISTERED ACCOUNTS FOR LOGIN (14 ROLES)                                  */
/* ========================================================================= */

export const INITIAL_REGISTERED_ACCOUNTS: RegisteredAccount[] = [
  { id: 'USR-001', companyId: 'CMP-001', name: 'Administrador TI', email: 'admin.ti@obra360.com', role: 'SUPER_ADMIN', createdAt: '01/01/2026', createdBy: 'SYSTEM', status: 'ATIVO' },
  { id: 'USR-002', companyId: 'CMP-001', name: 'Marcos Incorporador', email: 'marcos.incorporador@obra360.com', role: 'INCORPORADOR', createdAt: '02/01/2026', createdBy: 'admin.ti@obra360.com', status: 'ATIVO' },
  { id: 'USR-003', companyId: 'CMP-001', name: 'Amanda Gerente', email: 'amanda.gerente@obra360.com', role: 'GERENTE_OBRA', createdAt: '03/01/2026', createdBy: 'admin.ti@obra360.com', status: 'ATIVO' },
  { id: 'USR-004', companyId: 'CMP-002', name: 'Lucas Arquiteto', email: 'lucas.arquiteto@obra360.com', role: 'ARQUITETO', createdAt: '04/01/2026', createdBy: 'amanda.gerente@obra360.com', status: 'ATIVO' },
  { id: 'USR-005', companyId: 'CMP-001', name: 'Carlos Engenheiro', email: 'carlos.engenheiro@obra360.com', role: 'ENGENHEIRO', createdAt: '05/01/2026', createdBy: 'amanda.gerente@obra360.com', status: 'ATIVO' },
  { id: 'USR-006', companyId: 'CMP-001', name: 'Beatriz Financeiro', email: 'beatriz.financeiro@obra360.com', role: 'FINANCEIRO', createdAt: '06/01/2026', createdBy: 'amanda.gerente@obra360.com', status: 'ATIVO' },
  { id: 'USR-007', companyId: 'CMP-003', name: 'Votoran Fornecedor', email: 'votoran.fornecedor@obra360.com', role: 'FORNECEDOR', createdAt: '07/01/2026', createdBy: 'amanda.gerente@obra360.com', status: 'ATIVO' },
  { id: 'USR-008', companyId: 'CMP-004', name: 'CAT Locadora', email: 'cat.locadora@obra360.com', role: 'LOCADOR_MAQUINAS', createdAt: '08/01/2026', createdBy: 'amanda.gerente@obra360.com', status: 'ATIVO' },
  { id: 'USR-009', companyId: 'CMP-006', name: 'Zé Mestre de Obras', email: 'ze.mestre@obra360.com', role: 'MESTRE_OBRA', createdAt: '09/01/2026', createdBy: 'carlos.engenheiro@obra360.com', status: 'ATIVO' },
  { id: 'USR-010', companyId: 'CMP-001', name: 'Roberto Almoxarife', email: 'roberto.almoxarife@obra360.com', role: 'ALMOXARIFE', createdAt: '10/01/2026', createdBy: 'carlos.engenheiro@obra360.com', status: 'ATIVO' },
  { id: 'USR-011', companyId: 'CMP-005', name: 'Fernanda Corretora', email: 'fernanda.corretora@obra360.com', role: 'CORRETOR', createdAt: '11/01/2026', createdBy: 'marcos.incorporador@obra360.com', status: 'ATIVO' },
  { id: 'USR-012', companyId: 'CMP-001', name: 'Ricardo Investidor', email: 'ricardo.investidor@obra360.com', role: 'INVESTIDOR', createdAt: '12/01/2026', createdBy: 'marcos.incorporador@obra360.com', status: 'ATIVO' },
  { id: 'USR-013', companyId: 'CMP-001', name: 'João Cliente', email: 'joao.cliente@obra360.com', role: 'CLIENTE', createdAt: '13/01/2026', createdBy: 'amanda.gerente@obra360.com', status: 'ATIVO' },
  { id: 'USR-014', companyId: 'CMP-001', name: 'Auditor Compliance', email: 'auditor.compliance@obra360.com', role: 'AUDITOR', createdAt: '14/01/2026', createdBy: 'admin.ti@obra360.com', status: 'ATIVO' }
];

export const INITIAL_BUILDING_ELEMENTS: BuildingElement[] = [];

export const INITIAL_STOCK: StockItem[] = [];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_ECOSYSTEM_STAGES: EcosystemStage[] = [
  { number: 1, title: 'Cadastro de Oportunidade & Terreno (VGV)', pillar: 'Incorporação & Projetos', description: 'Estudo de viabilidade técnica, aquisição de terreno e definição do Valor Geral de Vendas (VGV).', responsibleActor: 'Incorporador', status: 'CONCLUIDO', progressPercent: 100 },
  { number: 2, title: 'Contratação de Serviços de Arquitetura & Engenharia', pillar: 'Incorporação & Projetos', description: 'Seleção e contratação de escritórios de projetos estruturais, elétricos e hidráulicos.', responsibleActor: 'Arquiteto / Engenheiro', status: 'CONCLUIDO', progressPercent: 100 },
  { number: 3, title: 'Versionamento & Aprovação de Projetos 2D/3D BIM', pillar: 'Incorporação & Projetos', description: 'Entrega das pranchas 2D, modelo 3D BIM e aprovação dos alvarás junto à prefeitura.', responsibleActor: 'Arquiteto', status: 'CONCLUIDO', progressPercent: 100 },
  { number: 4, title: 'Planejamento de Prazos, WBS & Orçamento Executivo', pillar: 'Suprimentos & Contratações B2B', description: 'Elaboração da Curva S, fluxo financeiro semanal e discriminação de insumos.', responsibleActor: 'Gerente de Obras', status: 'CONCLUIDO', progressPercent: 100 },
  { number: 5, title: 'Contratação de Empreiteiras & Mão de Obra Terceirizada', pillar: 'Suprimentos & Contratações B2B', description: 'Seleção de profissionais autônomos, pedreiros e equipes terceirizadas de armadores.', responsibleActor: 'Gerente / Mestre de Obra', status: 'CONCLUIDO', progressPercent: 100 },
  { number: 6, title: 'Cotação & Compra B2B de Materiais (RFQ)', pillar: 'Suprimentos & Contratações B2B', description: 'Emissão de solicitações da cotação para fornecedores de cimento, aço e tijolos.', responsibleActor: 'Fornecedor B2B', status: 'EM_ANDAMENTO', progressPercent: 85 },
  { number: 7, title: 'Locação de Máquinas & Frota Pesada', pillar: 'Suprimentos & Contratações B2B', description: 'Contratação de escavadeiras, guindastes munck, andaimes e betoneiras.', responsibleActor: 'Locador de Máquinas', status: 'EM_ANDAMENTO', progressPercent: 75 },
  { number: 8, title: 'Execução & Acompanhamento 3D no Canteiro', pillar: 'Execução 3D & Canteiro', description: 'Leitura espacial 3D em tempo real, medição de etapas e Diário de Obra com fotos.', responsibleActor: 'Engenheiro / Mestre', status: 'EM_ANDAMENTO', progressPercent: 78 },
  { number: 9, title: 'Controle de Estoque & Conciliação de Custos NFe', pillar: 'Execução 3D & Canteiro', description: 'Baixas no almoxarifado, entradas por Chave NFe e conciliação financeira.', responsibleActor: 'Almoxarife / Financeiro', status: 'EM_ANDAMENTO', progressPercent: 70 },
  { number: 10, title: 'Fiscalização & Registro de Não Conformidades (ISO 9001)', pillar: 'Execução 3D & Canteiro', description: 'Ensaios de concreto Fck 30MPa, laudos de qualidade e registro de ocorrências.', responsibleActor: 'Engenheiro / Auditor', status: 'EM_ANDAMENTO', progressPercent: 65 },
  { number: 11, title: 'Divulgação & Comercialização Imobiliária', pillar: 'Vendas & Pós-Obra B2C', description: 'Lançamento da vitrine imobiliária com fotos, plantas e simulador de financiamento.', responsibleActor: 'Corretor / Imobiliária', status: 'EM_ANDAMENTO', progressPercent: 60 },
  { number: 12, title: 'Venda ou Locação das Unidades (Espelho de Vendas)', pillar: 'Vendas & Pós-Obra B2C', description: 'Reservas presenciais e online de apartamentos e comissão dos corretores.', responsibleActor: 'Corretor / Investidor', status: 'EM_ANDAMENTO', progressPercent: 55 },
  { number: 13, title: 'Entrega de Chaves & Garantia Pós-Obra (NBR 15575)', pillar: 'Vendas & Pós-Obra B2C', description: 'Termo de entrega das chaves, manual digital e chamados de manutenção SLA 24h.', responsibleActor: 'Cliente / Incorporador', status: 'PLANEJADO', progressPercent: 30 }
];

export const INITIAL_B2B_RFQS: B2bMaterialRFQ[] = [];

export const INITIAL_EQUIPMENT_FLEET: EquipmentRentalItem[] = [];

export const INITIAL_REAL_ESTATE_UNITS: RealEstateUnit[] = [];

export const INITIAL_WARRANTY_TICKETS: WarrantyPostSalesTicket[] = [];

