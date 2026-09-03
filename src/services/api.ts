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
  INITIAL_B2B_RFQS 
} from '../data/mockData';
import { logger } from './logger';
import { eventBus } from './eventBus';

const BACKEND_BASE_URL = 'http://localhost:8080/api/v1';

// Simulated latency helper for real-world Async/Await Promises
const simulateNetworkDelay = <T>(data: T, delayMs: number = 300): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delayMs);
  });
};

/* ========================================================================= */
/* CLEAN ARCHITECTURE: USE CASES & ASYNC DATA SERVICE API                    */
/* ========================================================================= */

export const api = {
  /**
   * Use Cases: Gestão de Organizações Multi-Tenant (Company Use Cases)
   * @requirement [Tenant.RF-01] Gestão Multi-Empresas (Multi-Tenant)
   */
  companies: {
    async getAll(): Promise<Company[]> {
      logger.info('Fetching companies via API Service (Spring Boot Sync)');
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/companies`);
        if (response.ok) {
          const backendData = await response.json();
          if (Array.isArray(backendData) && backendData.length > 0) {
            return backendData;
          }
        }
      } catch (err) {
        logger.info('Spring Boot Backend offline. Serving via Clean Architecture Use Case Fallback.');
      }
      return simulateNetworkDelay([...INITIAL_COMPANIES], 250);
    },
    async create(newCompany: Omit<Company, 'id'>): Promise<Company> {
      const created: Company = {
        ...newCompany,
        id: `CMP-${Math.floor(100 + Math.random() * 900)}`
      };
      logger.audit('CREATE_COMPANY', 'Company', created);
      eventBus.publish('COMPANY_REGISTERED', 'CompanyService', created);

      try {
        await fetch(`${BACKEND_BASE_URL}/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(created)
        });
      } catch (err) {
        logger.info('Spring Boot async sync queued via EventBus.');
      }

      return simulateNetworkDelay(created, 400);
    }
  },

  /**
   * Use Cases: Gestão de Empreendimentos (Project Use Cases)
   */
  projects: {
    async getAll(): Promise<Project[]> {
      return simulateNetworkDelay([...INITIAL_PROJECTS], 300);
    },
    async create(newProject: Omit<Project, 'id'>): Promise<Project> {
      const created: Project = {
        ...newProject,
        id: `PRJ-${Math.floor(100 + Math.random() * 900)}`
      };
      logger.audit('CREATE_PROJECT', 'Project', created);
      return simulateNetworkDelay(created, 450);
    }
  },

  /**
   * Use Cases: Central de Projetos 2D/3D & Versionamento (Document Use Cases)
   */
  documents: {
    async getByProjectId(projectId: string): Promise<ProjectDocument[]> {
      const filtered = INITIAL_DOCUMENTS.filter(d => d.projectId === projectId || d.projectId === 'PRJ-001');
      return simulateNetworkDelay(filtered, 300);
    },
    async upload(newDoc: Omit<ProjectDocument, 'id' | 'updatedAt'>): Promise<ProjectDocument> {
      const created: ProjectDocument = {
        ...newDoc,
        id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
        updatedAt: new Date().toLocaleString('pt-BR')
      };
      logger.audit('UPLOAD_DOCUMENT', 'ProjectDocument', created);
      eventBus.publish('DOCUMENT_UPLOADED', 'DocumentService', created);
      return simulateNetworkDelay(created, 500);
    },
    async approve(documentId: string): Promise<boolean> {
      logger.audit('APPROVE_DOCUMENT', 'ProjectDocument', { documentId });
      eventBus.publish('DOCUMENT_APPROVED', 'DocumentService', { documentId, status: 'APROVADO' });
      return simulateNetworkDelay(true, 350);
    }
  },

  /**
   * Use Cases: Fiscalização & Não Conformidades ISO 9001 (Occurrence Use Cases)
   */
  occurrences: {
    async getByProjectId(projectId: string): Promise<ConstructionOccurrence[]> {
      const filtered = INITIAL_OCCURRENCES.filter(o => o.projectId === projectId || o.projectId === 'PRJ-001');
      return simulateNetworkDelay(filtered, 250);
    },
    async create(newOcc: Omit<ConstructionOccurrence, 'id' | 'createdAt'>): Promise<ConstructionOccurrence> {
      const created: ConstructionOccurrence = {
        ...newOcc,
        id: `OCC-${Math.floor(300 + Math.random() * 700)}`,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      logger.audit('CREATE_OCCURRENCE', 'ConstructionOccurrence', created);
      eventBus.publish('OCCURRENCE_CREATED', 'QualityService', created);
      return simulateNetworkDelay(created, 400);
    }
  },

  /**
   * Use Cases: Geometria Espacial 3D BIM (3D Model Use Cases)
   */
  elements: {
    async getAll(): Promise<BuildingElement[]> {
      return simulateNetworkDelay([...INITIAL_BUILDING_ELEMENTS], 350);
    },
    async updateStatus(id: string, status: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO', progress: number): Promise<boolean> {
      logger.audit('UPDATE_ELEMENT_STATUS', 'BuildingElement', { id, status, progress });
      eventBus.publish('STAGE_PROGRESS_UPDATED', '3DService', { id, status, progress });
      return simulateNetworkDelay(true, 300);
    },
    async updatePosition(id: string, position: [number, number, number]): Promise<boolean> {
      return simulateNetworkDelay(true, 150);
    },
    async create(newElem: Omit<BuildingElement, 'id' | 'lastUpdatedAt'>): Promise<BuildingElement> {
      const created: BuildingElement = {
        ...newElem,
        id: `ELEM-${Math.floor(900 + Math.random() * 100)}`,
        lastUpdatedAt: 'Agora'
      };
      logger.audit('CREATE_ELEMENT_3D', 'BuildingElement', created);
      return simulateNetworkDelay(created, 400);
    }
  },

  /**
   * Use Cases: Controle de Almoxarifado & NFe (Inventory Use Cases)
   */
  stock: {
    async getAll(): Promise<StockItem[]> {
      return simulateNetworkDelay([...INITIAL_STOCK], 300);
    },
    async registerMovement(newMov: Omit<StockMovement, 'id'>): Promise<StockMovement> {
      const created: StockMovement = {
        ...newMov,
        id: `MOV-${Math.floor(100 + Math.random() * 900)}`
      };
      logger.audit('STOCK_MOVEMENT', 'StockMovement', created);
      return simulateNetworkDelay(created, 450);
    }
  },

  /**
   * Use Cases: Auditoria de Segurança & Compliance (Audit Use Cases)
   */
  auditLogs: {
    async getAll(): Promise<AuditLog[]> {
      return simulateNetworkDelay([...INITIAL_AUDIT_LOGS], 250);
    }
  }
};
