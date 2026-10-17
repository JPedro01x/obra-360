/**
 * CLEAN ARCHITECTURE - APPLICATION / USE CASES LAYER
 * 
 * Este arquivo encapsula as regras de aplicação e casos de uso assíncronos (Use Cases Layer),
 * isolando a lógica de negócios e contratos do domínio (types.ts) da camada de UI (React/Three.js).
 */

import { 
  Project, ProjectDocument, ConstructionOccurrence, Company, 
  BuildingElement, StockItem, StockMovement, AuditLog, B2bMaterialRFQ, 
  RegisteredAccount 
} from '../types';
import { 
  INITIAL_COMPANIES, INITIAL_PROJECTS, INITIAL_DOCUMENTS, 
  INITIAL_OCCURRENCES, INITIAL_BUILDING_ELEMENTS, INITIAL_STOCK, 
  INITIAL_STOCK_MOVEMENTS, INITIAL_AUDIT_LOGS, INITIAL_REGISTERED_ACCOUNTS, 
  INITIAL_B2B_RFQS, getDefaultElementsForProject 
} from '../data/mockData';
import { logger } from './logger';
import { eventBus } from './eventBus';

// Simulated latency helper for real-world Async/Await Promises
const simulateNetworkDelay = <T>(data: T, delayMs: number = 300): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delayMs);
  });
};

/* ========================================================================= */
/* CONFIGURAÇÃO DE INTEGRAÇÃO HÍBRIDA (API REST / MOCK FALLBACK)             */
const metaEnv = (import.meta as any)?.env || {};
const API_BASE_URL = (metaEnv.VITE_API_URL as string) || 'http://localhost:8080/api';
// Se VITE_USE_MOCK for 'false' ou o usuário configurar no localStorage, tenta a API real do Spring Boot
const isMockDisabled = 
  metaEnv.VITE_USE_MOCK === 'false' || 
  (typeof window !== 'undefined' && localStorage.getItem('obra360_use_mock') === 'false');

async function hybridFetch<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  if (!isMockDisabled) {
    return simulateNetworkDelay(fallbackData as T, 200);
  }

  try {
    const activeTenant = (typeof window !== 'undefined' && localStorage.getItem('obra360_active_tenant')) || 'CMP-001';
    const activeToken = (typeof window !== 'undefined' && localStorage.getItem('obra360_token')) || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': activeTenant,
      ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}),
      ...(options?.headers as Record<string, string> || {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info(`[HYBRID API] Resposta recebida de ${endpoint} com sucesso`);
    return data as T;
  } catch (error) {
    logger.warn(`[HYBRID API] Backend offline ou falha em ${endpoint}. Ativando fallback em memória.`, error);
    return simulateNetworkDelay(fallbackData as T, 250);
  }
}

/* ========================================================================= */
/* CLEAN ARCHITECTURE: USE CASES & ASYNC DATA SERVICE API                    */
/* ========================================================================= */

export const api = {
  /**
   * Use Cases: Gestão de Organizações Multi-Tenant (Company Use Cases)
   */
  companies: {
    async getAll(): Promise<Company[]> {
      logger.info('Fetching companies via API Service');
      return hybridFetch<Company[]>('/v1/empresas', { method: 'GET' }, [...INITIAL_COMPANIES]);
    },
    async create(newCompany: Omit<Company, 'id'>): Promise<Company> {
      const created: Company = {
        ...newCompany,
        id: `CMP-${Math.floor(100 + Math.random() * 900)}`
      };
      logger.audit('CREATE_COMPANY', 'Company', created);
      eventBus.publish('COMPANY_REGISTERED', 'CompanyService', created);
      return hybridFetch<Company>('/v1/empresas', {
        method: 'POST',
        body: JSON.stringify(created)
      }, created);
    }
  },

  /**
   * Use Cases: Gestão de Empreendimentos (Project Use Cases)
   */
  projects: {
    async getAll(): Promise<Project[]> {
      return hybridFetch<Project[]>('/v1/projetos', { method: 'GET' }, [...INITIAL_PROJECTS]);
    },
    async create(newProject: Omit<Project, 'id'>): Promise<Project> {
      const created: Project = {
        ...newProject,
        id: `PRJ-${Math.floor(100 + Math.random() * 900)}`
      };
      logger.audit('CREATE_PROJECT', 'Project', created);
      return hybridFetch<Project>('/v1/projetos', {
        method: 'POST',
        body: JSON.stringify(created)
      }, created);
    }
  },

  /**
   * Use Cases: Central de Projetos 2D/3D & Versionamento (Document Use Cases)
   */
  documents: {
    async getByProjectId(projectId: string): Promise<ProjectDocument[]> {
      const filtered = INITIAL_DOCUMENTS.filter(d => d.projectId === projectId || d.projectId === 'PRJ-001');
      return hybridFetch<ProjectDocument[]>(`/v1/documentos?projetoId=${projectId}`, { method: 'GET' }, filtered);
    },
    async upload(newDoc: Omit<ProjectDocument, 'id' | 'updatedAt'>): Promise<ProjectDocument> {
      const created: ProjectDocument = {
        ...newDoc,
        id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
        updatedAt: new Date().toLocaleString('pt-BR')
      };
      logger.audit('UPLOAD_DOCUMENT', 'ProjectDocument', created);
      eventBus.publish('DOCUMENT_UPLOADED', 'DocumentService', created);
      return hybridFetch<ProjectDocument>('/v1/documentos', {
        method: 'POST',
        body: JSON.stringify(created)
      }, created);
    },
    async approve(documentId: string): Promise<boolean> {
      logger.audit('APPROVE_DOCUMENT', 'ProjectDocument', { documentId });
      eventBus.publish('DOCUMENT_APPROVED', 'DocumentService', { documentId, status: 'APROVADO' });
      return hybridFetch<boolean>(`/v1/documentos/${documentId}/aprovar`, { method: 'POST' }, true);
    }
  },

  /**
   * Use Cases: Fiscalização & Não Conformidades ISO 9001 (Occurrence Use Cases)
   */
  occurrences: {
    async getByProjectId(projectId: string): Promise<ConstructionOccurrence[]> {
      const filtered = INITIAL_OCCURRENCES.filter(o => o.projectId === projectId || o.projectId === 'PRJ-001');
      return hybridFetch<ConstructionOccurrence[]>(`/v1/qualidade/ocorrencias?projetoId=${projectId}`, { method: 'GET' }, filtered);
    },
    async create(newOcc: Omit<ConstructionOccurrence, 'id' | 'createdAt'>): Promise<ConstructionOccurrence> {
      const created: ConstructionOccurrence = {
        ...newOcc,
        id: `OCC-${Math.floor(300 + Math.random() * 700)}`,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      logger.audit('CREATE_OCCURRENCE', 'ConstructionOccurrence', created);
      eventBus.publish('OCCURRENCE_CREATED', 'QualityService', created);
      return hybridFetch<ConstructionOccurrence>('/v1/qualidade/ocorrencias', {
        method: 'POST',
        body: JSON.stringify(created)
      }, created);
    }
  },

  /**
   * Use Cases: Geometria Espacial 3D BIM (3D Model Use Cases)
   */
  elements: {
    async getAll(): Promise<BuildingElement[]> {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('obra360_3d_elements_v1') : null;
      const initial = saved ? JSON.parse(saved) : [...INITIAL_BUILDING_ELEMENTS];
      return hybridFetch<BuildingElement[]>('/v1/obras/elementos-3d', { method: 'GET' }, initial);
    },
    async getByProjectId(projectId: string, projectType: any = 'Prédios & Edifícios'): Promise<BuildingElement[]> {
      const storageKey = `obra360_3d_elements_${projectId}`;
      const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      const initial = saved ? JSON.parse(saved) : getDefaultElementsForProject({ id: projectId, type: projectType });
      return hybridFetch<BuildingElement[]>(`/v1/obras/${projectId}/elementos-3d`, { method: 'GET' }, initial);
    },
    async saveAllForProject(projectId: string, elements: BuildingElement[]): Promise<boolean> {
      const storageKey = `obra360_3d_elements_${projectId}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(elements));
      }
      return hybridFetch<boolean>(`/v1/obras/${projectId}/elementos-3d/batch`, {
        method: 'PUT',
        body: JSON.stringify(elements)
      }, true);
    },
    async updateStatus(id: string, status: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO', progress: number): Promise<boolean> {
      logger.audit('UPDATE_ELEMENT_STATUS', 'BuildingElement', { id, status, progress });
      eventBus.publish('STAGE_PROGRESS_UPDATED', '3DService', { id, status, progress });
      return hybridFetch<boolean>(`/v1/obras/elementos-3d/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, progress })
      }, true);
    },
    async updatePosition(id: string, position: [number, number, number]): Promise<boolean> {
      return hybridFetch<boolean>(`/v1/obras/elementos-3d/${id}/posicao`, {
        method: 'PATCH',
        body: JSON.stringify({ position })
      }, true);
    },
    async create(newElem: Omit<BuildingElement, 'id' | 'lastUpdatedAt'>): Promise<BuildingElement> {
      const created: BuildingElement = {
        ...newElem,
        id: `ELEM-${Math.floor(900 + Math.random() * 100)}`,
        lastUpdatedAt: 'Agora'
      };
      logger.audit('CREATE_ELEMENT_3D', 'BuildingElement', created);
      return hybridFetch<BuildingElement>('/v1/obras/elementos-3d', {
        method: 'POST',
        body: JSON.stringify(created)
      }, created);
    }
  },

  /**
   * Use Cases: Controle de Almoxarifado & NFe (Inventory Use Cases)
   */
  stock: {
    async getAll(): Promise<StockItem[]> {
      return hybridFetch<StockItem[]>('/v1/estoque', { method: 'GET' }, [...INITIAL_STOCK]);
    },
    async registerMovement(newMov: Omit<StockMovement, 'id'>): Promise<StockMovement> {
      const created: StockMovement = {
        ...newMov,
        id: `MOV-${Math.floor(100 + Math.random() * 900)}`
      };
      logger.audit('STOCK_MOVEMENT', 'StockMovement', created);
      return hybridFetch<StockMovement>('/v1/estoque/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(created)
      }, created);
    }
  },

  /**
   * Use Cases: Auditoria de Segurança & Compliance (Audit Use Cases)
   */
  auditLogs: {
    async getAll(): Promise<AuditLog[]> {
      return hybridFetch<AuditLog[]>('/v1/auditoria', { method: 'GET' }, [...INITIAL_AUDIT_LOGS]);
    }
  }
};
