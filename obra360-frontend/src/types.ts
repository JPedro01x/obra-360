export type RoleId = 
  | 'SUPER_ADMIN' 
  | 'GERENTE_OBRA' 
  | 'ENGENHEIRO' 
  | 'MESTRE_OBRA' 
  | 'ALMOXARIFE' 
  | 'FINANCEIRO' 
  | 'CLIENTE' 
  | 'AUDITOR'
  | 'INCORPORADOR'
  | 'ARQUITETO'
  | 'FORNECEDOR'
  | 'LOCADOR_MAQUINAS'
  | 'CORRETOR'
  | 'INVESTIDOR';

export type HierarchyLevel = 
  | 'Nível 1 - Gestão Estratégica' 
  | 'Nível 2 - Engenharia & Operação' 
  | 'Nível 3 - Execução & Logística' 
  | 'Nível 4 - Transparência & Auditoria'
  | 'Nível 5 - Negócios & Mercado B2B/B2C';

export type ThemeMode = 'dark' | 'light';

export type ProjectType = 
  | 'Casas Residenciais' 
  | 'Condomínios Fechados' 
  | 'Prédios & Edifícios' 
  | 'Hospitais & Saúde' 
  | 'Galpões Logísticos' 
  | 'Túneis & Subterrâneo' 
  | 'Energia Solar' 
  | 'Infraestrutura & Pontes' 
  | 'Comercial & Industrial';

export type CompanySegment = 
  | 'Construtora & Incorporadora' 
  | 'Escritório de Arquitetura/Engenharia' 
  | 'Fornecedor B2B Insumos' 
  | 'Empresa de Locação de Frota' 
  | 'Imobiliária & Hub Comercial' 
  | 'Empresa Terceirizada';

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  segment: CompanySegment;
  plan: 'Enterprise SaaS Pro' | 'Parceiro B2B Homologado' | 'Corporativo';
  verifiedBadge: boolean;
  activeProjectsCount: number;
  membersCount: number;
  cityState: string;
  phone: string;
}

export interface Project {
  id: string;
  companyId?: string;
  name: string;
  type: ProjectType;
  location: string;
  clientOrOwner: string;
  responsibleEngineer: string;
  responsibleArchitect: string;
  plannedDeadline: string;
  budget: number;
  spentBudget: number;
  vgv: number;
  status: 'PLANEJAMENTO' | 'EM_EXECUCAO' | 'EM_VENDAS' | 'CONCLUIDO';
  progressPercent: number;
  unitsCount: number;
  activeTeamsCount: number;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  category: 'Arquitetônico' | 'Estrutural' | 'Elétrico' | 'Hidráulico' | 'Licença/Alvará' | 'Memorial Descritivo';
  version: string; // e.g. 'v1.0', 'v2.0', 'v2.4'
  status: 'EM_ELABORACAO' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REJEITADO';
  author: string;
  authorRole: string;
  updatedAt: string;
  fileSize: string;
  fileType: 'IFC 3D' | 'DWG 2D' | 'PDF Técnico' | 'DOCX';
  notes?: string;
}

export interface ConstructionOccurrence {
  id: string;
  projectId: string;
  title: string;
  category: 'Não Conformidade' | 'Atraso' | 'Manutenção' | 'Falha de Execução' | 'Segurança NR-18';
  severity: 'ALTA' | 'MEDIA' | 'BAIXA';
  description: string;
  assignedTo: string;
  status: 'ABERTA' | 'EM_CORRECAO' | 'RESOLVIDA' | 'APROVADA_FISCAL';
  reportedBy: string;
  createdAt: string;
  hasPhoto: boolean;
  photoUrl?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface UserRole {
  id: RoleId;
  title: string;
  department: string;
  level: HierarchyLevel;
  badgeColor: string;
  permissions: string[];
  description: string;
  defaultEmail: string;
}

export interface RegisteredAccount {
  id: string;
  companyId?: string;
  name: string;
  email: string;
  role: RoleId;
  createdAt: string;
  createdBy: string;
  status: 'ATIVO' | 'INATIVO';
}

export interface AuthUser {
  email: string;
  name: string;
  role: RoleId;
  companyName?: string;
  token: string;
}

export interface BuildingElement {
  id: string;
  name: string;
  category: 'Fundação' | 'Estrutura' | 'Alvenaria' | 'Instalações' | 'Acabamento';
  status: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO';
  progressPercent: number;
  assignedWeek: number; // 1 to 8
  materialUsed: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  position?: [number, number, number];
}

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
}

export interface StockMovement {
  id: string;
  type: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA';
  productName: string;
  quantity: number;
  unit: string;
  nfeNumber?: string;
  destination: string;
  responsible: string;
  date: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  ip: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: Record<string, any>;
  newValue: Record<string, any>;
}

export interface ConstructionDiaryEntry {
  id: string;
  date: string;
  weather: 'Ensolarado' | 'Chuvoso' | 'Nublado';
  stage: string;
  teamSize: number;
  description: string;
  photosCount: number;
  author: string;
}

export interface EcosystemStage {
  number: number;
  title: string;
  pillar: 'Incorporação & Projetos' | 'Suprimentos & Contratações B2B' | 'Execução 3D & Canteiro' | 'Vendas & Pós-Obra B2C';
  description: string;
  responsibleActor: string;
  status: 'CONCLUIDO' | 'EM_ANDAMENTO' | 'PLANEJADO';
  progressPercent: number;
}

export interface B2bMaterialRFQ {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  targetPrice: number;
  supplierOffers: Array<{
    supplierName: string;
    unitPrice: number;
    deliveryDays: number;
    status: 'PENDENTE' | 'ACEITO' | 'RECUSADO';
  }>;
  status: 'EM_COTACAO' | 'FATURADO' | 'ENTREGUE';
  createdAt: string;
}

export interface EquipmentRentalItem {
  id: string;
  name: string;
  category: 'Escavadeiras' | 'Guindastes' | 'Betoneiras' | 'Andaimes Metálicos' | 'Geradores';
  dailyRate: number;
  availability: 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO';
  fleetProvider: string;
  location: string;
  specs: string;
}

export interface RealEstateUnit {
  id: string;
  unitNumber: string;
  floor: number;
  typology: 'Apartamento 2Q' | 'Apartamento 3Q Suíte' | 'Cobertura Duplex' | 'Loja Comercial' | 'Galpão Industrial' | 'Lote Residencial';
  areaM2: number;
  price: number;
  status: 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO';
  brokerAssigned?: string;
  buyerName?: string;
}

export interface WarrantyPostSalesTicket {
  id: string;
  unitNumber: string;
  ownerName: string;
  category: 'Infiltração' | 'Elétrica' | 'Pintura' | 'Esquadrias' | 'Hidráulica';
  description: string;
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
  openedAt: string;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
}
