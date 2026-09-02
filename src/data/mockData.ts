import { 
  RoleId, UserRole, RegisteredAccount, BuildingElement, StockItem, 
  StockMovement, AuditLog, EcosystemStage, B2bMaterialRFQ, 
  EquipmentRentalItem, RealEstateUnit, WarrantyPostSalesTicket,
  Project, ProjectDocument, ConstructionOccurrence, Company 
} from '../types';

/* ========================================================================= */
/* MULTI-TENANT ENTERPRISE COMPANIES                                         */
/* ========================================================================= */

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'CMP-001',
    name: 'Engenharia & Construções Jardins S.A.',
    cnpj: '12.345.678/0001-90',
    segment: 'Construtora & Incorporadora',
    plan: 'Enterprise SaaS Pro',
    verifiedBadge: true,
    activeProjectsCount: 4,
    membersCount: 42,
    cityState: 'São Paulo / SP',
    phone: '(11) 3040-5000'
  },
  {
    id: 'CMP-002',
    name: 'Silva & Associados Arquitetura & Projetos BIM',
    cnpj: '98.765.432/0001-10',
    segment: 'Escritório de Arquitetura/Engenharia',
    plan: 'Parceiro B2B Homologado',
    verifiedBadge: true,
    activeProjectsCount: 6,
    membersCount: 15,
    cityState: 'São Paulo / SP',
    phone: '(11) 3210-9900'
  },
  {
    id: 'CMP-003',
    name: 'Votoran & Gerdau Suprimentos B2B',
    cnpj: '45.112.334/0001-55',
    segment: 'Fornecedor B2B Insumos',
    plan: 'Parceiro B2B Homologado',
    verifiedBadge: true,
    activeProjectsCount: 12,
    membersCount: 120,
    cityState: 'Sorocaba / SP',
    phone: '(15) 2101-8800'
  },
  {
    id: 'CMP-004',
    name: 'Caterpillar Rental Fleet Brasil',
    cnpj: '33.998.776/0001-22',
    segment: 'Empresa de Locação de Frota',
    plan: 'Parceiro B2B Homologado',
    verifiedBadge: true,
    activeProjectsCount: 8,
    membersCount: 65,
    cityState: 'Piracicaba / SP',
    phone: '(19) 3400-1122'
  },
  {
    id: 'CMP-005',
    name: 'Lopes Imobiliária & Hub Comercial',
    cnpj: '77.443.221/0001-88',
    segment: 'Imobiliária & Hub Comercial',
    plan: 'Parceiro B2B Homologado',
    verifiedBadge: true,
    activeProjectsCount: 5,
    membersCount: 85,
    cityState: 'São Paulo / SP',
    phone: '(11) 3888-7700'
  },
  {
    id: 'CMP-006',
    name: 'Armações & Estrutura LTDA',
    cnpj: '22.554.887/0001-33',
    segment: 'Empresa Terceirizada',
    plan: 'Parceiro B2B Homologado',
    verifiedBadge: true,
    activeProjectsCount: 3,
    membersCount: 28,
    cityState: 'Osasco / SP',
    phone: '(11) 4004-3322'
  }
];

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
/* 9 TYPES OF ENTERPRISE PROJECTS                                            */
/* ========================================================================= */

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-001',
    companyId: 'CMP-001',
    name: 'Residencial Jardins das Orquídeas',
    type: 'Prédios & Edifícios',
    location: 'Av. Paulista, 1400 - São Paulo/SP',
    clientOrOwner: 'Engenharia & Construções Jardins S.A.',
    responsibleEngineer: 'Eng. Carlos Residente',
    responsibleArchitect: 'Arq. Lucas Projetista',
    plannedDeadline: '10/04/2027',
    budget: 8500000.00,
    spentBudget: 5610000.00,
    vgv: 18500000.00,
    status: 'EM_EXECUCAO',
    progressPercent: 78,
    unitsCount: 48,
    activeTeamsCount: 6
  },
  {
    id: 'PRJ-002',
    companyId: 'CMP-001',
    name: 'Hospital Metropolitano de Alta Complexidade',
    type: 'Hospitais & Saúde',
    location: 'Rod. dos Bandeirantes, Km 42 - Campinas/SP',
    clientOrOwner: 'Secretaria de Saúde / Grupo Rede D\'Or',
    responsibleEngineer: 'Eng. Amanda Gerente',
    responsibleArchitect: 'Arq. Lucas Projetista',
    plannedDeadline: '15/12/2027',
    budget: 32000000.00,
    spentBudget: 12800000.00,
    vgv: 0.00,
    status: 'EM_EXECUCAO',
    progressPercent: 40,
    unitsCount: 120,
    activeTeamsCount: 14
  },
  {
    id: 'PRJ-003',
    companyId: 'CMP-001',
    name: 'Parque Logístico B2B Viracopos',
    type: 'Galpões Logísticos',
    location: 'Distrito Industrial - Indaiatuba/SP',
    clientOrOwner: 'Prologis do Brasil',
    responsibleEngineer: 'Eng. Carlos Residente',
    responsibleArchitect: 'Arq. Lucas Projetista',
    plannedDeadline: '30/08/2026',
    budget: 14500000.00,
    spentBudget: 13050000.00,
    vgv: 24000000.00,
    status: 'EM_EXECUCAO',
    progressPercent: 90,
    unitsCount: 12,
    activeTeamsCount: 8
  },
  {
    id: 'PRJ-004',
    companyId: 'CMP-001',
    name: 'Usina Fotovoltaica Sol do Sertão 50MW',
    type: 'Energia Solar',
    location: 'Zona Rural - Juazeiro/BA',
    clientOrOwner: 'Atlas Renewable Energy',
    responsibleEngineer: 'Eng. Amanda Gerente',
    responsibleArchitect: 'Arq. Lucas Projetista',
    plannedDeadline: '20/11/2026',
    budget: 45000000.00,
    spentBudget: 27000000.00,
    vgv: 0.00,
    status: 'EM_EXECUCAO',
    progressPercent: 60,
    unitsCount: 9000,
    activeTeamsCount: 10
  },
  {
    id: 'PRJ-005',
    companyId: 'CMP-001',
    name: 'Túnel Subterrâneo Rodoviário Sul',
    type: 'Túneis & Subterrâneo',
    location: 'Rodovia Anchieta Km 58 - Santos/SP',
    clientOrOwner: 'DERSA / Concessionária Ecovias',
    responsibleEngineer: 'Eng. Carlos Residente',
    responsibleArchitect: 'Arq. Lucas Projetista',
    plannedDeadline: '18/06/2028',
    budget: 98000000.00,
    spentBudget: 24500000.00,
    vgv: 0.00,
    status: 'EM_EXECUCAO',
    progressPercent: 25,
    unitsCount: 1,
    activeTeamsCount: 18
  },
  {
    id: 'PRJ-006',
    companyId: 'CMP-001',
    name: 'Condomínio Quinta da Serra Residencial',
    type: 'Condomínios Fechados',
    location: 'Estrada do Vinho - Gramado/RS',
    clientOrOwner: 'Incorporadora Gramado Luxo',
    responsibleEngineer: 'Eng. Carlos Residente',
    responsibleArchitect: 'Arq. Lucas Projetista',
    plannedDeadline: '05/03/2027',
    budget: 12000000.00,
    spentBudget: 6000000.00,
    vgv: 35000000.00,
    status: 'EM_VENDAS',
    progressPercent: 50,
    unitsCount: 30,
    activeTeamsCount: 5
  }
];

/* ========================================================================= */
/* 2D/3D BIM DOCUMENTS & BLUEPRINTS WITH VERSIONING (v1.0, v2.0, v2.4)       */
/* ========================================================================= */

export const INITIAL_DOCUMENTS: ProjectDocument[] = [
  {
    id: 'DOC-101',
    projectId: 'PRJ-001',
    title: 'Modelo Tridimensional Estrutural IFC',
    category: 'Estrutural',
    version: 'v2.4',
    status: 'APROVADO',
    author: 'Arq. Lucas Projetista',
    authorRole: 'Arquiteto BIM',
    updatedAt: '12/08/2026 14:30',
    fileSize: '45.2 MB',
    fileType: 'IFC 3D',
    notes: 'Revisão das armações dos pilares P-01 a P-08 com aço CA-50 Fck 30MPa aprovada.'
  },
  {
    id: 'DOC-102',
    projectId: 'PRJ-001',
    title: 'Planta Arquitetônica Pavimento Tipo',
    category: 'Arquitetônico',
    version: 'v2.0',
    status: 'APROVADO',
    author: 'Arq. Lucas Projetista',
    authorRole: 'Arquiteto BIM',
    updatedAt: '01/07/2026 09:15',
    fileSize: '12.8 MB',
    fileType: 'DWG 2D',
    notes: 'Ajuste de cota de iluminação natural e sacada gourmet.'
  },
  {
    id: 'DOC-103',
    projectId: 'PRJ-001',
    title: 'Projeto Elétrico Subestação & Fotovoltaica',
    category: 'Elétrico',
    version: 'v1.0',
    status: 'AGUARDANDO_APROVACAO',
    author: 'Eng. Roberto Elétrica',
    authorRole: 'Projetista Elétrico',
    updatedAt: '13/08/2026 16:45',
    fileSize: '8.4 MB',
    fileType: 'PDF Técnico',
    notes: 'Aguardando parecer final da concessionária Enel.'
  },
  {
    id: 'DOC-104',
    projectId: 'PRJ-001',
    title: 'Alvará de Construção & Licença Ambiental',
    category: 'Licença/Alvará',
    version: 'v1.0',
    status: 'APROVADO',
    author: 'Prefeitura Municipal S.P.',
    authorRole: 'Órgão Regulador',
    updatedAt: '10/01/2026 11:00',
    fileSize: '3.1 MB',
    fileType: 'PDF Técnico',
    notes: 'Alvará de aprovação e execução nº 2026/8841-SP.'
  }
];

/* ========================================================================= */
/* NON-CONFORMITY OCCURRENCES & QUALITY INSPECTION LOGS                     */
/* ========================================================================= */

export const INITIAL_OCCURRENCES: ConstructionOccurrence[] = [
  {
    id: 'OCC-301',
    projectId: 'PRJ-001',
    title: 'Fissura Superficial no Revestimento da Parede Direita',
    category: 'Não Conformidade',
    severity: 'MEDIA',
    description: 'Constatada fissura de 0.2mm após secagem da argamassa. Requer aplicação de tela de poliéster antes da pintura.',
    assignedTo: 'Armações & Estrutura LTDA',
    status: 'EM_CORRECAO',
    reportedBy: 'Eng. Carlos Residente',
    createdAt: '11/08/2026',
    hasPhoto: true
  },
  {
    id: 'OCC-302',
    projectId: 'PRJ-001',
    title: 'Inspeção de Segurança NR-18: Uso de Cinto de Trava-Quedas',
    category: 'Segurança NR-18',
    severity: 'ALTA',
    description: 'Verificação da ancoragem da linha de vida para operários no 4º andar. Todos equipados corretamente.',
    assignedTo: 'Mestre Zé Operacional',
    status: 'APROVADA_FISCAL',
    reportedBy: 'Técnico de Segurança NR-18',
    createdAt: '12/08/2026',
    hasPhoto: true
  }
];

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

export const INITIAL_BUILDING_ELEMENTS: BuildingElement[] = [
  {
    id: 'ELEM-001',
    name: 'Sapatas & Radier de Concreto Armado',
    category: 'Fundação',
    status: 'CONCLUIDO',
    progressPercent: 100,
    assignedWeek: 1,
    materialUsed: 'Concreto Fck 30MPa + Aço CA-50 (1.200 kg)',
    lastUpdatedBy: 'Carlos Engenheiro',
    lastUpdatedAt: 'Há 2 dias',
    position: [0, 0.35, 0]
  },
  {
    id: 'ELEM-002',
    name: 'Vigas Baldrame Impermeabilizadas',
    category: 'Fundação',
    status: 'CONCLUIDO',
    progressPercent: 100,
    assignedWeek: 2,
    materialUsed: 'Argamassa Asfáltica + Viga Baldrame',
    lastUpdatedBy: 'Carlos Engenheiro',
    lastUpdatedAt: 'Ontem',
    position: [0, 0.9, 0]
  },
  {
    id: 'ELEM-003',
    name: 'Pilares Estruturais P-01 a P-08',
    category: 'Estrutura',
    status: 'CONCLUIDO',
    progressPercent: 100,
    assignedWeek: 3,
    materialUsed: 'Concreto Fck 30MPa + Forma de Madeira',
    lastUpdatedBy: 'Carlos Engenheiro',
    lastUpdatedAt: 'Hoje',
    position: [0, 2.8, 0]
  },
  {
    id: 'ELEM-004',
    name: 'Laje Térreo & Vigas Superiores',
    category: 'Estrutura',
    status: 'CONCLUIDO',
    progressPercent: 100,
    assignedWeek: 4,
    materialUsed: 'Laje Pré-Moldada H12 + Concreto Usinado',
    lastUpdatedBy: 'Carlos Engenheiro',
    lastUpdatedAt: 'Hoje',
    position: [0, 4.5, 0]
  },
  {
    id: 'ELEM-005',
    name: 'Alvenaria Estrutural Paredes Perimetrais',
    category: 'Alvenaria',
    status: 'EM_EXECUCAO',
    progressPercent: 80,
    assignedWeek: 5,
    materialUsed: 'Blocos Cerâmicos Baianos 9x19x19',
    lastUpdatedBy: 'Zé Mestre de Obras',
    lastUpdatedAt: 'Em andamento',
    position: [-4.9, 2.8, 0]
  },
  {
    id: 'ELEM-006',
    name: 'Divisórias Internas de Cômodos',
    category: 'Alvenaria',
    status: 'EM_EXECUCAO',
    progressPercent: 50,
    assignedWeek: 6,
    materialUsed: 'Blocos Cerâmicos 9x19x19 + Argamassa',
    lastUpdatedBy: 'Zé Mestre de Obras',
    lastUpdatedAt: 'Em andamento',
    position: [4.9, 2.8, 0]
  },
  {
    id: 'ELEM-007',
    name: 'Estrutura do Telhado Cerâmico',
    category: 'Acabamento',
    status: 'PLANEJADO',
    progressPercent: 0,
    assignedWeek: 7,
    materialUsed: 'Telhas Cerâmicas + Ripada de Peroba',
    lastUpdatedBy: 'Planejamento',
    lastUpdatedAt: 'Programado',
    position: [0, 6.0, 0]
  },
  {
    id: 'ELEM-008',
    name: 'Painéis Solares Fotovoltaicos 550W',
    category: 'Instalações',
    status: 'PLANEJADO',
    progressPercent: 0,
    assignedWeek: 8,
    materialUsed: 'Módulos Fotovoltaicos 550W Monocristalinos',
    lastUpdatedBy: 'Planejamento',
    lastUpdatedAt: 'Programado',
    position: [0, 6.5, 0]
  }
];

export const INITIAL_STOCK: StockItem[] = [
  { id: 'STK-001', sku: 'CIM-CP2', name: 'Cimento Votoran CP II-Z 50kg', category: 'Insumos Básicos', quantity: 450, minStock: 100, unit: 'sacos', location: 'Almoxarifado Central - Prateleira A' },
  { id: 'STK-002', sku: 'ACO-CA50-10', name: 'Aço Gerdau CA-50 10mm (3/8")', category: 'Estrutural', quantity: 180, minStock: 50, unit: 'barras', location: 'Pátio de Armação B' },
  { id: 'STK-003', sku: 'TIJ-BAIANO', name: 'Bloco Cerâmico 9x19x19 (Tijolo Baiano)', category: 'Alvenaria', quantity: 3500, minStock: 1000, unit: 'unidades', location: 'Canteiro de Obras Lote 4' },
  { id: 'STK-004', sku: 'TUB-TIGRE-100', name: 'Tubo PVC Esgoto Tigre 100mm 6m', category: 'Hidráulica', quantity: 45, minStock: 15, unit: 'barras', location: 'Almoxarifado Hidráulico' },
  { id: 'STK-005', sku: 'SOLAR-550W', name: 'Painel Fotovoltaico Canadian 550W', category: 'Energia Solar', quantity: 24, minStock: 10, unit: 'módulos', location: 'Depósito Climatizado C' }
];

export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  { id: 'MOV-001', type: 'ENTRADA', productName: 'Cimento Votoran CP II-Z 50kg', quantity: 500, unit: 'sacos', nfeNumber: 'NFe-884192', destination: 'Almoxarifado Central', responsible: 'Roberto Almoxarife', date: '12/08/2026 08:30' },
  { id: 'MOV-002', type: 'SAIDA', productName: 'Cimento Votoran CP II-Z 50kg', quantity: 50, unit: 'sacos', destination: 'Concretagem Laje Térreo', responsible: 'Zé Mestre de Obras', date: '12/08/2026 14:15' },
  { id: 'MOV-003', type: 'ENTRADA', productName: 'Aço Gerdau CA-50 10mm (3/8")', quantity: 200, unit: 'barras', nfeNumber: 'NFe-910245', destination: 'Pátio de Armação', responsible: 'Roberto Almoxarife', date: '13/08/2026 10:00' }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-8801',
    timestamp: '13/08/2026 14:22:10',
    user: 'carlos.engenheiro@obra360.com',
    role: 'Engenheiro Residente (Campo)',
    ip: '192.168.1.105',
    action: 'UPDATE_STAGE_PROGRESS',
    entity: 'Stage',
    entityId: 'ELEM-004',
    oldValue: { progressPercent: 80, status: 'EM_EXECUCAO' },
    newValue: { progressPercent: 100, status: 'CONCLUIDO' }
  },
  {
    id: 'LOG-8802',
    timestamp: '13/08/2026 11:05:40',
    user: 'roberto.almoxarife@obra360.com',
    role: 'Almoxarife Chefe',
    ip: '192.168.1.108',
    action: 'STOCK_ENTRY',
    entity: 'StockItem',
    entityId: 'STK-002',
    oldValue: { quantity: 0 },
    newValue: { quantity: 200, nfeNumber: 'NFe-910245' }
  }
];

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

export const INITIAL_B2B_RFQS: B2bMaterialRFQ[] = [
  {
    id: 'RFQ-2041',
    materialName: 'Cimento CP II-Z 50kg (Lote 500 sacos)',
    quantity: 500,
    unit: 'sacos',
    targetPrice: 35.00,
    supplierOffers: [
      { supplierName: 'Votoran Parceiro Oficial', unitPrice: 33.50, deliveryDays: 2, status: 'ACEITO' },
      { supplierName: 'Atacadão da Construção LTDA', unitPrice: 34.20, deliveryDays: 3, status: 'RECUSADO' }
    ],
    status: 'FATURADO',
    createdAt: '10/08/2026'
  },
  {
    id: 'RFQ-2042',
    materialName: 'Aço Gerdau CA-50 10mm (Lote 200 barras)',
    quantity: 200,
    unit: 'barras',
    targetPrice: 65.00,
    supplierOffers: [
      { supplierName: 'Gerdau Distribuidora Direta', unitPrice: 61.80, deliveryDays: 1, status: 'PENDENTE' }
    ],
    status: 'EM_COTACAO',
    createdAt: '12/08/2026'
  }
];

export const INITIAL_EQUIPMENT_FLEET: EquipmentRentalItem[] = [
  { id: 'EQP-101', name: 'Escavadeira Hidráulica Caterpillar CAT 320', category: 'Escavadeiras', dailyRate: 1250.00, availability: 'EM_USO', fleetProvider: 'Caterpillar Rental Fleet', location: 'Canteiro Central', specs: '20 Toneladas, Caçamba 1.2m³' },
  { id: 'EQP-102', name: 'Guindaste Munck Rodoviário 15 Ton', category: 'Guindastes', dailyRate: 1800.00, availability: 'DISPONIVEL', fleetProvider: 'Guindastes São Paulo LTDA', location: 'Pátio Operacional', specs: 'Lança Telescópica 22 metros' },
  { id: 'EQP-103', name: 'Betoneira Industrial 400 Litros Monofásica', category: 'Betoneiras', dailyRate: 150.00, availability: 'DISPONIVEL', fleetProvider: 'Equipam Obras', location: 'Almoxarifado', specs: 'Motor Elétrico 2CV' }
];

export const INITIAL_REAL_ESTATE_UNITS: RealEstateUnit[] = [
  { id: 'UNT-101', unitNumber: 'Apt 101', floor: 1, typology: 'Apartamento 2Q', areaM2: 65, price: 420000.00, status: 'VENDIDO', buyerName: 'João Pedro Proprietário' },
  { id: 'UNT-102', unitNumber: 'Apt 102', floor: 1, typology: 'Apartamento 2Q', areaM2: 65, price: 420000.00, status: 'RESERVADO', brokerAssigned: 'Fernanda Corretora' },
  { id: 'UNT-201', unitNumber: 'Apt 201', floor: 2, typology: 'Apartamento 3Q Suíte', areaM2: 88, price: 580000.00, status: 'DISPONIVEL' },
  { id: 'UNT-202', unitNumber: 'Apt 202', floor: 2, typology: 'Apartamento 3Q Suíte', areaM2: 88, price: 585000.00, status: 'DISPONIVEL' },
  { id: 'UNT-501', unitNumber: 'Cobertura 501', floor: 5, typology: 'Cobertura Duplex', areaM2: 145, price: 1150000.00, status: 'DISPONIVEL' }
];

export const INITIAL_WARRANTY_TICKETS: WarrantyPostSalesTicket[] = [
  { id: 'ASS-8801', unitNumber: 'Apt 101', ownerName: 'João Pedro Proprietário', category: 'Infiltração', description: 'Pequena umidade identificada na esquadria da varana gourmet.', status: 'EM_ATENDIMENTO', openedAt: '05/08/2026', priority: 'ALTA' },
  { id: 'ASS-8802', unitNumber: 'Apt 101', ownerName: 'João Pedro Proprietário', category: 'Pintura', description: 'Retoque de pintura na porta de entrada da sala.', status: 'CONCLUIDO', openedAt: '01/07/2026', priority: 'BAIXA' }
];
