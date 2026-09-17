import React, { useState, useEffect } from 'react';
import { 
  RoleId, BuildingElement, StockItem, StockMovement, AuditLog, 
  ThemeMode, AuthUser, RegisteredAccount, ToastNotification, Project, Company 
} from './types';
import { 
  USER_ROLES, 
  INITIAL_BUILDING_ELEMENTS, 
  INITIAL_STOCK, 
  INITIAL_STOCK_MOVEMENTS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_REGISTERED_ACCOUNTS,
  INITIAL_PROJECTS,
  INITIAL_COMPANIES
} from './data/mockData';
import { api } from './services/api';
import { eventBus } from './services/eventBus';
import { RbacHeader } from './components/RbacHeader';
import { CompanySelectorHeader } from './components/CompanySelectorHeader';
import { ProjectSelectorHeader } from './components/ProjectSelectorHeader';
import { BimViewer3D } from './components/BimViewer3D';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { DocumentManagerView } from './components/DocumentManagerView';
import { InventoryManager } from './components/InventoryManager';
import { AuditLogViewer } from './components/AuditLogViewer';
import { ClientPortalView } from './components/ClientPortalView';
import { RbacMatrixView } from './components/RbacMatrixView';
import { LoginView } from './components/LoginView';
import { ToastNotifier } from './components/ToastNotifier';
import { B2bMarketplaceView } from './components/B2bMarketplaceView';
import { NotFoundView } from './components/NotFoundView';
import { RealEstateStorefrontView } from './components/RealEstateStorefrontView';
import { WarrantyPostSalesView } from './components/WarrantyPostSalesView';
import { LiveB2bChatView } from './components/LiveB2bChatView';
import { AiConstructionAssistantView } from './components/AiConstructionAssistantView';
import { LgpdPrivacyCenterView } from './components/LgpdPrivacyCenterView';
import { 
  Box, LayoutDashboard, Package, History, UserCheck, 
  Sparkles, Layers, ShieldCheck, CheckCircle2, KeyRound, ShoppingCart, Building, Heart, FileText, Wifi, WifiOff, MessageSquare 
} from 'lucide-react';

export function App() {
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = `TOAST-${Date.now()}`;
    const newToast: ToastNotification = { id, type, title, message };
    
    // Capped at 2 toasts max to prevent screen accumulation
    setToasts((prev) => [...prev.slice(-1), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Async Loading & PWA Offline States
  const [isLoadingAsyncData, setIsLoadingAsyncData] = useState<boolean>(true);
  const [isSyncingAsync, setIsSyncingAsync] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Multi-Tenant Companies State
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [activeCompany, setActiveCompany] = useState<Company>(INITIAL_COMPANIES[0]);

  // Projects State (9 Project Types Support)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project>(INITIAL_PROJECTS[0]);

  // State with localStorage persistence
  const [elements, setElements] = useState<BuildingElement[]>(() => {
    const saved = localStorage.getItem('obra360_elements');
    return saved ? JSON.parse(saved) : INITIAL_BUILDING_ELEMENTS;
  });

  useEffect(() => {
    localStorage.setItem('obra360_elements', JSON.stringify(elements));
  }, [elements]);

  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // EventBus Subscribers (Event-Driven Messaging Layer)
  useEffect(() => {
    const unsubDoc = eventBus.subscribe('DOCUMENT_APPROVED', (event) => {
      addToast('success', 'Mensageria EventBus: Projeto Aprovado', `Evento recebido do serviço ${event.sender}.`);
    });

    const unsubOcc = eventBus.subscribe('OCCURRENCE_CREATED', (event) => {
      addToast('warning', 'Mensageria EventBus: Não Conformidade', `Nova ocorrência notificada por ${event.sender}.`);
    });

    const unsubStage = eventBus.subscribe('STAGE_PROGRESS_UPDATED', (event) => {
      addToast('info', 'Mensageria EventBus: Avanço Físico 3D', `Atualização de etapa recebida no tópico STAGE_PROGRESS_UPDATED.`);
    });

    return () => {
      unsubDoc();
      unsubOcc();
      unsubStage();
    };
  }, []);

  // PWA Offline Listener & Service Worker Registration
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('success', 'Conexão Restabelecida (PWA)', 'Fila de alterações do canteiro sincronizada com a nuvem.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('warning', 'Modo Offline de Canteiro', 'Sem sinal de internet. As alterações estão sendo mantidas localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker registration skipped:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial Async Data Fetching via Async/Await API Services Layer
  useEffect(() => {
    let isMounted = true;
    async function loadAsyncEcosystemData() {
      setIsLoadingAsyncData(true);
      try {
        const [fetchedCompanies, fetchedProjects, fetchedElements, fetchedStock, fetchedAudit] = await Promise.all([
          api.companies.getAll(),
          api.projects.getAll(),
          api.elements.getAll(),
          api.stock.getAll(),
          api.auditLogs.getAll()
        ]);

        if (isMounted) {
          if (Array.isArray(fetchedCompanies) && fetchedCompanies.length > 0) {
            setCompanies(fetchedCompanies);
            setActiveCompany(fetchedCompanies[0]);
          }
          if (Array.isArray(fetchedProjects) && fetchedProjects.length > 0) {
            setProjects(fetchedProjects);
            setActiveProject(fetchedProjects[0]);
          }
          if (Array.isArray(fetchedElements) && fetchedElements.length > 0) {
            setElements(fetchedElements);
          }
          if (Array.isArray(fetchedStock) && fetchedStock.length > 0) {
            setStockItems(fetchedStock);
          }
          if (Array.isArray(fetchedAudit) && fetchedAudit.length > 0) {
            setAuditLogs(fetchedAudit);
          }
          setIsLoadingAsyncData(false);
        }
      } catch (err) {
        console.error('Async API Error:', err);
        if (isMounted) setIsLoadingAsyncData(false);
      }
    }

    loadAsyncEcosystemData();
    return () => { isMounted = false; };
  }, []);

  // Registered accounts state
  const [registeredAccounts, setRegisteredAccounts] = useState<RegisteredAccount[]>(() => {
    const saved = localStorage.getItem('obra360_registered_accounts');
    return saved ? JSON.parse(saved) : INITIAL_REGISTERED_ACCOUNTS;
  });

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('obra360_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentRole, setCurrentRole] = useState<RoleId>(() => {
    return authUser ? authUser.role : 'ENGENHEIRO';
  });

  // Automatically restore real JWT session on app load if valid token exists in localStorage
  useEffect(() => {
    async function restoreJwtSession() {
      const restoredUser = await api.auth.me();
      if (restoredUser) {
        setAuthUser(restoredUser);
        setCurrentRole(restoredUser.role);
        localStorage.setItem('obra360_user', JSON.stringify(restoredUser));
      }
    }
    restoreJwtSession();
  }, []);

  // Active Tab State (with 404 Route Guard Support, AI Voice Assistant & LGPD Privacy Center)
  const [activeTab, setActiveTab] = useState<'3D' | 'PROJETOS' | 'DASHBOARD' | 'ESTOQUE' | 'AUDITORIA' | 'CLIENTE' | 'RBAC' | 'MARKETPLACE' | 'VENDAS' | 'POSVENDAS' | 'MENSAGENS' | 'IA' | 'LGPD' | 'NOT_FOUND'>('3D');

  useEffect(() => {
    (window as any).__setObra360ActiveTab = setActiveTab;
  }, []);

  // Theme state persisted in localStorage
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('obra360_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const isDark = theme === 'dark';

  // STRICT AIRTIGHT RBAC TAB VISIBILITY GUARDS PER ROLE (13 ROLES)
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const canSee3dTab = isSuperAdmin || ['GERENTE_OBRA', 'ENGENHEIRO', 'ARQUITETO', 'MESTRE_OBRA', 'INCORPORADOR'].includes(currentRole);
  const canSeeProjetosTab = isSuperAdmin || ['GERENTE_OBRA', 'ARQUITETO', 'ENGENHEIRO', 'INCORPORADOR', 'AUDITOR'].includes(currentRole);
  const canSeeStockTab = isSuperAdmin || ['GERENTE_OBRA', 'ENGENHEIRO', 'ALMOXARIFE', 'MESTRE_OBRA'].includes(currentRole);
  const canSeeMarketplaceTab = isSuperAdmin || ['GERENTE_OBRA', 'ENGENHEIRO', 'FINANCEIRO', 'FORNECEDOR', 'LOCADOR_MAQUINAS'].includes(currentRole);
  const canSeeVendasTab = isSuperAdmin || ['INCORPORADOR', 'CORRETOR', 'INVESTIDOR', 'FINANCEIRO'].includes(currentRole);
  const canSeeClientTab = isSuperAdmin || ['CLIENTE'].includes(currentRole);
  const canSeePosVendasTab = isSuperAdmin || ['CLIENTE', 'GERENTE_OBRA', 'ENGENHEIRO'].includes(currentRole);
  const canSeeAuditTab = isSuperAdmin || ['AUDITOR'].includes(currentRole);
  const canSeeRbacTab = isSuperAdmin || ['SUPER_ADMIN'].includes(currentRole);
  const canSeeDashboardTab = currentRole !== 'CLIENTE';

  // Auto redirect active tab when role changes to prevent unauthorized view leakage
  useEffect(() => {
    if (currentRole === 'CLIENTE') {
      if (activeTab !== 'CLIENTE' && activeTab !== 'POSVENDAS') {
        setActiveTab('CLIENTE');
      }
      return;
    }

    if (currentRole === 'CORRETOR' || currentRole === 'INVESTIDOR') {
      if (activeTab !== 'VENDAS' && activeTab !== 'DASHBOARD' && activeTab !== 'MENSAGENS') {
        setActiveTab('VENDAS');
      }
      return;
    }

    if (currentRole === 'ALMOXARIFE') {
      if (activeTab !== 'ESTOQUE' && activeTab !== 'DASHBOARD' && activeTab !== 'MENSAGENS') {
        setActiveTab('ESTOQUE');
      }
      return;
    }

    if (currentRole === 'FORNECEDOR' || currentRole === 'LOCADOR_MAQUINAS') {
      if (activeTab !== 'MARKETPLACE' && activeTab !== 'DASHBOARD' && activeTab !== 'MENSAGENS') {
        setActiveTab('MARKETPLACE');
      }
      return;
    }

    if (currentRole === 'AUDITOR') {
      if (activeTab !== 'AUDITORIA' && activeTab !== 'PROJETOS' && activeTab !== 'DASHBOARD' && activeTab !== 'MENSAGENS') {
        setActiveTab('AUDITORIA');
      }
      return;
    }

    if (activeTab === '3D' && !canSee3dTab) setActiveTab('DASHBOARD');
    if (activeTab === 'PROJETOS' && !canSeeProjetosTab) setActiveTab('DASHBOARD');
    if (activeTab === 'AUDITORIA' && !canSeeAuditTab) setActiveTab('DASHBOARD');
    if (activeTab === 'RBAC' && !canSeeRbacTab) setActiveTab('DASHBOARD');
    if (activeTab === 'CLIENTE' && !canSeeClientTab) setActiveTab('DASHBOARD');
    if (activeTab === 'ESTOQUE' && !canSeeStockTab) setActiveTab('DASHBOARD');
    if (activeTab === 'MARKETPLACE' && !canSeeMarketplaceTab) setActiveTab('DASHBOARD');
    if (activeTab === 'VENDAS' && !canSeeVendasTab) setActiveTab('DASHBOARD');
    if (activeTab === 'POSVENDAS' && !canSeePosVendasTab) setActiveTab('DASHBOARD');
  }, [currentRole, activeTab, canSee3dTab, canSeeProjetosTab, canSeeAuditTab, canSeeRbacTab, canSeeClientTab, canSeeStockTab, canSeeMarketplaceTab, canSeeVendasTab, canSeePosVendasTab]);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('obra360_theme', nextTheme);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('obra360_user', JSON.stringify(user));
    
    if (['FORNECEDOR', 'LOCADOR_MAQUINAS'].includes(user.role)) {
      setActiveTab('MARKETPLACE');
    } else if (['CORRETOR', 'INVESTIDOR'].includes(user.role)) {
      setActiveTab('VENDAS');
    } else if (user.role === 'CLIENTE') {
      setActiveTab('CLIENTE');
    } else if (user.role === 'ARQUITETO') {
      setActiveTab('PROJETOS');
    } else {
      setActiveTab('3D');
    }

    addToast('success', 'Sessão Iniciada', `Bem-vindo, ${user.name}! Modo ${USER_ROLES[user.role].title} ativado.`);
  };

  const handleLogout = () => {
    setAuthUser(null);
    localStorage.removeItem('obra360_user');
    addToast('info', 'Sessão Encerrada', 'Você saiu da plataforma Obra360.');
  };

  const handleSelectRole = (newRole: RoleId) => {
    setCurrentRole(newRole);
    if (authUser) {
      const updatedUser: AuthUser = { ...authUser, role: newRole, email: USER_ROLES[newRole].defaultEmail };
      setAuthUser(updatedUser);
      localStorage.setItem('obra360_user', JSON.stringify(updatedUser));
      addToast('info', 'Perfil Alternado', `Acessando modo: ${USER_ROLES[newRole].title}`);
    }
  };

  // ASYNC ACTION HANDLERS WITH API LATENCY
  const handleAddCompany = async (newCmpData: Omit<Company, 'id'>) => {
    setIsSyncingAsync(true);
    try {
      const created = await api.companies.create(newCmpData);
      setCompanies((prev) => [created, ...prev]);
      setActiveCompany(created);
      addToast('success', 'Nova Empresa Cadastrada', `Organização "${created.name}" (CNPJ ${created.cnpj}) integrada ao Obra360.`);
    } finally {
      setIsSyncingAsync(false);
    }
  };

  const handleAddProject = async (newProjData: Omit<Project, 'id'>) => {
    setIsSyncingAsync(true);
    try {
      const created = await api.projects.create({ ...newProjData, companyId: activeCompany.id });
      setProjects((prev) => [created, ...prev]);
      setActiveProject(created);
      addToast('success', 'Novo Empreendimento', `Empreendimento "${created.name}" cadastrado na empresa ${activeCompany.name}.`);
    } finally {
      setIsSyncingAsync(false);
    }
  };

  const handleUpdateElementStatus = async (
    id: string, 
    newStatus: 'PLANEJADO' | 'EM_EXECUCAO' | 'CONCLUIDO', 
    newProgress: number
  ) => {
    const target = elements.find((e) => e.id === id);
    if (!target) return;

    setIsSyncingAsync(true);
    try {
      await api.elements.updateStatus(id, newStatus, newProgress);
      const oldVal = { status: target.status, progressPercent: target.progressPercent };

      setElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus, progressPercent: newProgress, lastUpdatedAt: 'Agora' } : e))
      );

      const newLog: AuditLog = {
        id: `LOG-${Math.floor(8800 + Math.random() * 1000)}`,
        timestamp: new Date().toLocaleString('pt-BR'),
        user: authUser ? authUser.email : `${currentRole.toLowerCase()}@obra360.com`,
        role: USER_ROLES[currentRole].title,
        ip: '192.168.1.105',
        action: 'UPDATE_STAGE_PROGRESS',
        entity: 'Stage',
        entityId: id,
        oldValue: oldVal,
        newValue: { status: newStatus, progressPercent: newProgress }
      };

      setAuditLogs((prev) => [newLog, ...prev]);
    } finally {
      setIsSyncingAsync(false);
    }
  };

  const handleUpdateElementPosition = async (id: string, pos: [number, number, number]) => {
    const target = elements.find((e) => e.id === id);
    if (!target) return;

    await api.elements.updatePosition(id, pos);

    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, position: pos, lastUpdatedAt: 'Agora' } : e))
    );
  };

  const handleUpdateElementTransform = async (
    id: string, 
    pos?: [number, number, number],
    rot?: [number, number, number],
    scale?: [number, number, number],
    color?: string
  ) => {
    const target = elements.find((e) => e.id === id);
    if (!target) return;

    if (pos) await api.elements.updatePosition(id, pos);

    setElements((prev) =>
      prev.map((e) => (e.id === id ? { 
        ...e, 
        position: pos || e.position,
        rotation: rot || e.rotation,
        scale: scale || e.scale,
        color: color || e.color,
        lastUpdatedAt: 'Agora' 
      } : e))
    );
  };

  const handleAddElement = async (newElemData: Omit<BuildingElement, 'id' | 'lastUpdatedAt'>) => {
    setIsSyncingAsync(true);
    try {
      const created = await api.elements.create({
        ...newElemData,
        projectId: activeProject.id
      });
      setElements((prev) => [...prev, created]);
      addToast('success', 'Elemento 3D Criado na Obra', `${created.name} integrado ao modelo da obra "${activeProject.name}".`);
    } finally {
      setIsSyncingAsync(false);
    }
  };

  const handleDeleteElement = (id: string) => {
    const target = elements.find((e) => e.id === id);
    if (!target) return;

    setElements((prev) => prev.filter((e) => e.id !== id));
    addToast('warning', 'Elemento 3D Removido', `${target.name} foi removido do modelo.`);
  };

  const handleImportFloorPlan = (presetName: string) => {
    const projId = activeProject.id;
    const generated: BuildingElement[] = [
      { id: `ELEM-${Date.now()}-1`, projectId: projId, name: `Radier & Sapata de Fundação (${presetName})`, category: 'Fundação', status: 'CONCLUIDO', progressPercent: 100, assignedWeek: 1, materialUsed: 'Concreto Armado Fck 30MPa', lastUpdatedBy: 'AI CAD Parser', lastUpdatedAt: 'Agora', position: [0, 0, 0] },
      { id: `ELEM-${Date.now()}-2`, projectId: projId, name: 'Vigas Baldrame Impermeabilizadas', category: 'Fundação', status: 'CONCLUIDO', progressPercent: 100, assignedWeek: 2, materialUsed: 'Tinta Asfáltica Manta 4mm', lastUpdatedBy: 'AI CAD Parser', lastUpdatedAt: 'Agora', position: [0, 0, 0] },
      { id: `ELEM-${Date.now()}-3`, projectId: projId, name: 'Pilares Estruturais CA-50 (Planta 2D)', category: 'Estrutura', status: 'CONCLUIDO', progressPercent: 100, assignedWeek: 3, materialUsed: 'Concreto CA-50', lastUpdatedBy: 'AI CAD Parser', lastUpdatedAt: 'Agora', position: [-4.8, 2.8, -3.2] },
      { id: `ELEM-${Date.now()}-4`, projectId: projId, name: 'Alvenaria Externa & Vedações (2D)', category: 'Alvenaria', status: 'EM_EXECUCAO', progressPercent: 85, assignedWeek: 4, materialUsed: 'Blocos Cerâmicos Baianos 14x19x29cm', lastUpdatedBy: 'AI CAD Parser', lastUpdatedAt: 'Agora', position: [4.9, 2.8, 0] },
      { id: `ELEM-${Date.now()}-5`, projectId: projId, name: 'Vedações Internas & Divisórias (2D)', category: 'Alvenaria', status: 'EM_EXECUCAO', progressPercent: 70, assignedWeek: 5, materialUsed: 'Blocos de Concreto Estrutural', lastUpdatedBy: 'AI CAD Parser', lastUpdatedAt: 'Agora', position: [0, 2.8, -3.3] },
      { id: `ELEM-${Date.now()}-6`, projectId: projId, name: 'Laje Térreo Pré-Moldada H12', category: 'Estrutura', status: 'EM_EXECUCAO', progressPercent: 50, assignedWeek: 6, materialUsed: 'Vigotas EPS H12', lastUpdatedBy: 'AI CAD Parser', lastUpdatedAt: 'Agora', position: [0, 4.4, 0] },
      { id: `ELEM-${Date.now()}-7`, projectId: projId, name: 'Estrutura de Telhado & Painéis Solares', category: 'Estrutura', status: 'PLANEJADO', progressPercent: 0, assignedWeek: 7, materialUsed: 'Telhas Cerâmicas & Placas Fotovoltaicas', lastUpdatedBy: 'AI CAD Parser', lastUpdatedAt: 'Agora', position: [0, 6.0, 0] }
    ];

    // Append to existing elements, preserving project isolation
    setElements((prev) => [...prev.filter(e => e.projectId !== projId), ...generated]);
    addToast('success', '✨ Modelo 3D BIM Extrudado da Planta 2D', `Estrutura 3D da obra "${activeProject.name}" gerada automaticamente a partir da planta "${presetName}".`);
  };

  const handleAddMovement = async (newMov: Omit<StockMovement, 'id'>) => {
    setIsSyncingAsync(true);
    try {
      const createdMov = await api.stock.registerMovement(newMov);
      setMovements((prev) => [createdMov, ...prev]);

      setStockItems((prev) =>
        prev.map((item) => {
          if (item.name === newMov.productName) {
            const delta = newMov.type === 'ENTRADA' ? newMov.quantity : -newMov.quantity;
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
      );

      addToast('success', 'Movimentação Sincronizada', `${newMov.type}: ${newMov.quantity} ${newMov.unit} de ${newMov.productName}.`);
    } finally {
      setIsSyncingAsync(false);
    }
  };

  const handleRegisterAccount = (newAccData: Omit<RegisteredAccount, 'id' | 'createdAt' | 'createdBy' | 'status'>) => {
    const newId = `USR-${Math.floor(100 + Math.random() * 900)}`;
    const created: RegisteredAccount = {
      ...newAccData,
      id: newId,
      companyId: activeCompany.id,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      createdBy: authUser ? authUser.email : 'amanda.gerente@obra360.com',
      status: 'ATIVO'
    };

    const updatedList = [created, ...registeredAccounts];
    setRegisteredAccounts(updatedList);
    localStorage.setItem('obra360_registered_accounts', JSON.stringify(updatedList));
    addToast('success', 'Novo Usuário Cadastrado', `A conta para ${created.name} (${created.email}) está pronta para login.`);
  };

  const getDashboardTabLabel = (role: RoleId) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'GERENTE_OBRA':
      case 'INCORPORADOR':
        return 'Dashboard Executivo & VGV';
      case 'ARQUITETO':
        return 'Dashboard de Arquitetura & Projetos';
      case 'ENGENHEIRO':
        return 'Dashboard de Engenharia (BIM)';
      case 'FINANCEIRO':
        return 'Dashboard Financeiro & Custos';
      case 'FORNECEDOR':
        return 'Dashboard de Suprimentos B2B';
      case 'LOCADOR_MAQUINAS':
        return 'Dashboard de Frota & Máquinas';
      case 'MESTRE_OBRA':
        return 'Dashboard Operacional de Campo';
      case 'ALMOXARIFE':
        return 'Dashboard do Almoxarifado';
      case 'CORRETOR':
        return 'Dashboard de Vendas Imobiliárias';
      case 'INVESTIDOR':
        return 'Dashboard de Investimento & ROI';
      case 'CLIENTE':
        return 'Dashboard do Cliente (Sua Casa)';
      case 'AUDITOR':
        return 'Dashboard de Auditoria & Riscos';
      default:
        return 'Dashboard Executivo';
    }
  };

  // IF NOT AUTHENTICATED: Show Login Screen
  if (!authUser) {
    return (
      <>
        <ToastNotifier toasts={toasts} onDismiss={handleDismissToast} theme={theme} />
        <LoginView
          registeredAccounts={registeredAccounts}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors ${
      isDark ? 'bg-[#121214] text-zinc-100' : 'bg-slate-100 text-zinc-900'
    }`}>
      
      {/* Floating Toast Notifier Container */}
      <ToastNotifier toasts={toasts} onDismiss={handleDismissToast} theme={theme} />

      {/* Top Header with RBAC Switcher & Active Company Badge */}
      <RbacHeader
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        authUser={authUser}
        onLogout={handleLogout}
        activeCompany={activeCompany}
      />

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-4">
        
        {/* Async Cloud Connection & PWA Offline Status Banner (Shown when syncing or offline) */}
        {(!isOnline || isSyncingAsync) && (
          <div className={`border rounded-2xl px-4 py-2 flex items-center justify-between font-mono text-xs ${
            !isOnline 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-bold">Modo Offline do Canteiro: Dados salvos localmente.</span>
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Sincronizando alterações assincronamente via EventBus PubSub...</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Multi-Tenant Company Selector Bar */}
        <CompanySelectorHeader
          companies={companies}
          activeCompany={activeCompany}
          onSelectCompany={setActiveCompany}
          onAddCompany={handleAddCompany}
          theme={theme}
        />

        {/* Project Selector Header (Multi-Project Support: 9 Categories) */}
        <ProjectSelectorHeader
          projects={projects}
          activeProject={activeProject}
          onSelectProject={setActiveProject}
          onAddProject={handleAddProject}
          theme={theme}
        />

              {/* Navigation Bar - Ultra-Clean & Mobile Responsive Layout */}
        <nav className={`border rounded-2xl p-1.5 shadow-md ${
          isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200'
        }`}>
          {/* Mobile Viewport Dropdown Selector */}
          <div className="block md:hidden p-1">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            >
              <option value="DASHBOARD">📊 Painel Executivo ({getDashboardTabLabel(currentRole)})</option>
              {canSee3dTab && <option value="3D">🏛️ Modelo 3D Interativo & BIM</option>}
              {canSeeProjetosTab && <option value="PROJETOS">📐 Central de Projetos (2D/3D BIM)</option>}
              <option value="IA">✨ IA Preditiva & Voz (Gemini)</option>
              <option value="MENSAGENS">💬 Chat B2B & Mensagens</option>
              {canSeeMarketplaceTab && <option value="MARKETPLACE">🛒 Marketplace B2B (Cotação)</option>}
              {canSeeStockTab && <option value="ESTOQUE">📦 Almoxarifado & Estoque NFe</option>}
              {canSeeVendasTab && <option value="VENDAS">🏢 Portal de Vendas Imobiliárias</option>}
              {canSeeClientTab && <option value="CLIENTE">👤 Portal do Proprietário</option>}
              {canSeePosVendasTab && <option value="POSVENDAS">🛡️ Garantia & Pós-Vendas</option>}
              {canSeeRbacTab && <option value="RBAC">🔑 Permissões (RBAC / IAM)</option>}
              {canSeeAuditTab && <option value="AUDITORIA">📜 Auditoria & ISO 9001</option>}
              <option value="LGPD">⚖️ Privacidade & LGPD (Art. 18)</option>
            </select>
          </div>

          {/* Desktop & Tablet Navigation Row */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto scrollbar-thin py-0.5 px-1">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'DASHBOARD'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> {getDashboardTabLabel(currentRole)}
            </button>

            {canSee3dTab && (
              <button
                onClick={() => setActiveTab('3D')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === '3D'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Box className="w-4 h-4" /> Modelo 3D & BIM
              </button>
            )}

            {canSeeProjetosTab && (
              <button
                onClick={() => setActiveTab('PROJETOS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'PROJETOS'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <FileText className="w-4 h-4" /> Projetos
              </button>
            )}

            <button
              onClick={() => setActiveTab('IA')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'IA'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : isDark ? 'text-purple-400 hover:text-white hover:bg-[#27272a]' : 'text-purple-600 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" /> IA Voice & Gemini
            </button>

            <button
              onClick={() => setActiveTab('MENSAGENS')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'MENSAGENS'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chat B2B
            </button>

            {canSeeMarketplaceTab && (
              <button
                onClick={() => setActiveTab('MARKETPLACE')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'MARKETPLACE'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" /> Marketplace
              </button>
            )}

            {canSeeStockTab && (
              <button
                onClick={() => setActiveTab('ESTOQUE')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'ESTOQUE'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Package className="w-4 h-4" /> Estoque NFe
              </button>
            )}

            {canSeeVendasTab && (
              <button
                onClick={() => setActiveTab('VENDAS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'VENDAS'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Building className="w-4 h-4" /> Imóveis
              </button>
            )}

            {canSeeClientTab && (
              <button
                onClick={() => setActiveTab('CLIENTE')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'CLIENTE'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Proprietário
              </button>
            )}

            {canSeePosVendasTab && (
              <button
                onClick={() => setActiveTab('POSVENDAS')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'POSVENDAS'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Pós-Vendas
              </button>
            )}

            {canSeeRbacTab && (
              <button
                onClick={() => setActiveTab('RBAC')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'RBAC'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <KeyRound className="w-4 h-4" /> IAM
              </button>
            )}

            {canSeeAuditTab && (
              <button
                onClick={() => setActiveTab('AUDITORIA')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeTab === 'AUDITORIA'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : isDark ? 'text-zinc-400 hover:text-white hover:bg-[#27272a]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <History className="w-4 h-4" /> Auditoria
              </button>
            )}

            <button
              onClick={() => setActiveTab('LGPD')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'LGPD'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : isDark ? 'text-emerald-400 hover:text-white hover:bg-[#27272a]' : 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> LGPD
            </button>
          </div>
        </nav>

        {/* Main Content Area with Async Loading Indicator */}
        <main className="w-full space-y-6">
          {isLoadingAsyncData ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className={`text-xs font-mono font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Carregando ecossistema assincronamente da nuvem...
              </p>
            </div>
          ) : (
            <>
              {activeTab === '3D' && canSee3dTab && (
                <BimViewer3D
                  elements={elements}
                  activeProject={activeProject}
                  currentRole={currentRole}
                  theme={theme}
                  onUpdateElementStatus={handleUpdateElementStatus}
                  onUpdateElementPosition={handleUpdateElementPosition}
                  onUpdateElementTransform={handleUpdateElementTransform}
                  onAddElement={handleAddElement}
                  onDeleteElement={handleDeleteElement}
                  onImportFloorPlan={handleImportFloorPlan}
                  onSendToast={addToast}
                />
              )}

              {activeTab === 'PROJETOS' && canSeeProjetosTab && (
                <DocumentManagerView currentRole={currentRole} theme={theme} onSendToast={addToast} />
              )}

              {activeTab === 'DASHBOARD' && (
                <ExecutiveDashboard elements={elements} stockItems={stockItems} currentRole={currentRole} theme={theme} />
              )}

              {activeTab === 'MENSAGENS' && (
                <LiveB2bChatView currentRole={currentRole} theme={theme} activeCompany={activeCompany} onSendToast={addToast} />
              )}

              {activeTab === 'IA' && (
                <AiConstructionAssistantView currentRole={currentRole} theme={theme} onSendToast={addToast} />
              )}

              {activeTab === 'MARKETPLACE' && canSeeMarketplaceTab && (
                <B2bMarketplaceView currentRole={currentRole} theme={theme} onSendToast={addToast} />
              )}

              {activeTab === 'ESTOQUE' && canSeeStockTab && (
                <InventoryManager
                  stockItems={stockItems}
                  movements={movements}
                  currentRole={currentRole}
                  theme={theme}
                  onAddMovement={handleAddMovement}
                />
              )}

              {activeTab === 'VENDAS' && canSeeVendasTab && (
                <RealEstateStorefrontView currentRole={currentRole} theme={theme} onSendToast={addToast} />
              )}

              {activeTab === 'RBAC' && canSeeRbacTab && (
                <RbacMatrixView
                  currentRole={currentRole}
                  theme={theme}
                  registeredAccounts={registeredAccounts}
                  onRegisterAccount={handleRegisterAccount}
                />
              )}

              {activeTab === 'AUDITORIA' && canSeeAuditTab && (
                <AuditLogViewer auditLogs={auditLogs} currentRole={currentRole} theme={theme} />
              )}

              {activeTab === 'LGPD' && (
                <LgpdPrivacyCenterView currentRole={currentRole} theme={theme} authUser={authUser} onSendToast={addToast} />
              )}

              {activeTab === 'NOT_FOUND' && (
                <NotFoundView
                  theme={theme}
                  onGoHome={() => setActiveTab('DASHBOARD')}
                  onGoProjects={() => setActiveTab('PROJETOS')}
                />
              )}

              {activeTab === 'CLIENTE' && canSeeClientTab && (
                <ClientPortalView elements={elements} theme={theme} />
              )}

              {activeTab === 'POSVENDAS' && canSeePosVendasTab && (
                <WarrantyPostSalesView currentRole={currentRole} theme={theme} onSendToast={addToast} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className={`border-t py-6 px-4 text-center text-xs font-mono transition-colors ${
        isDark ? 'border-[#27272a] bg-[#121214] text-zinc-500' : 'border-zinc-200 bg-white text-zinc-600'
      }`}>
        <p>Obra360 • Plataforma Corporativa Event-Driven, PubSub & Structured Logger (SaaS B2B / B2C)</p>
      </footer>

    </div>
  );
}
export default App;
