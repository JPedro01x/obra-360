import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  INITIAL_COMPANIES,
  getDefaultElementsForProject
} from './data/mockData';
import { api } from './services/api';
import { eventBus } from './services/eventBus';
import { SidebarNav } from './components/SidebarNav';
import { TopHeaderBar } from './components/TopHeaderBar';
import { CompanySelectorHeader } from './components/CompanySelectorHeader';
import { ProjectSelectorHeader } from './components/ProjectSelectorHeader';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { LoginView } from './components/LoginView';
import { ToastNotifier } from './components/ToastNotifier';

// LAZY LOADING (Code-Splitting de Telas Pesadas)
const BimViewer3D = React.lazy(() => import('./components/BimViewer3D').then(m => ({ default: m.BimViewer3D })));
const DocumentManagerView = React.lazy(() => import('./components/DocumentManagerView').then(m => ({ default: m.DocumentManagerView })));
const InventoryManager = React.lazy(() => import('./components/InventoryManager').then(m => ({ default: m.InventoryManager })));
const AuditLogViewer = React.lazy(() => import('./components/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const ClientPortalView = React.lazy(() => import('./components/ClientPortalView').then(m => ({ default: m.ClientPortalView })));
const RbacMatrixView = React.lazy(() => import('./components/RbacMatrixView').then(m => ({ default: m.RbacMatrixView })));
const B2bMarketplaceView = React.lazy(() => import('./components/B2bMarketplaceView').then(m => ({ default: m.B2bMarketplaceView })));
const RealEstateStorefrontView = React.lazy(() => import('./components/RealEstateStorefrontView').then(m => ({ default: m.RealEstateStorefrontView })));
const WarrantyPostSalesView = React.lazy(() => import('./components/WarrantyPostSalesView').then(m => ({ default: m.WarrantyPostSalesView })));
const LiveB2bChatView = React.lazy(() => import('./components/LiveB2bChatView').then(m => ({ default: m.LiveB2bChatView })));
const ServiceOrdersView = React.lazy(() => import('./components/ServiceOrdersView').then(m => ({ default: m.ServiceOrdersView })));
const PhysicalMeasurementsView = React.lazy(() => import('./components/PhysicalMeasurementsView').then(m => ({ default: m.PhysicalMeasurementsView })));
const NfeConciliationView = React.lazy(() => import('./components/NfeConciliationView').then(m => ({ default: m.NfeConciliationView })));

// Loading Fallback para Code-Splitting
const ViewLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[420px] p-8 text-center animate-fadeIn">
    <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4 shadow-lg shadow-orange-500/20" />
    <span className="text-xs font-bold tracking-widest uppercase text-zinc-400">Carregando Módulo Obra360...</span>
    <span className="text-[11px] text-zinc-500 mt-1 font-mono">Renderização sob demanda (Lazy Code-Splitting)</span>
  </div>
);
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { QuickActionFab } from './components/QuickActionFab';
import { 
  Box, LayoutDashboard, Package, History, UserCheck, 
  Sparkles, Layers, ShieldCheck, CheckCircle2, KeyRound, ShoppingCart, Building, Heart, FileText, Wifi, WifiOff, MessageSquare 
} from 'lucide-react';

export function App() {
  // Command Palette Ctrl+K State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => {
    const id = `TOAST-${Date.now()}`;
    const newToast: ToastNotification = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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

  // Helper para carregar elementos de um projeto específico
  const getElementsForProject = (proj: Project): BuildingElement[] => {
    try {
      const key = `obra360_3d_elements_${proj.id}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      // Fallback para o primeiro projeto caso exista dado legado
      if (proj.id === 'PRJ-001') {
        const legacy = localStorage.getItem('obra360_3d_elements_v1');
        if (legacy) return JSON.parse(legacy);
      }
    } catch (e) {
      console.warn('Erro ao carregar elementos 3D do projeto:', e);
    }
    return getDefaultElementsForProject(proj);
  };

  // State com persistência permanente de elementos 3D isolados por projeto
  const [elements, setElements] = useState<BuildingElement[]>(() => getElementsForProject(INITIAL_PROJECTS[0]));

  // Ao alternar o empreendimento ativo, carrega o modelo 3D correspondente
  useEffect(() => {
    const projElements = getElementsForProject(activeProject);
    setElements(projElements);
  }, [activeProject.id]);

  // Salva automaticamente qualquer alteração nos elementos 3D do projeto ativo
  useEffect(() => {
    try {
      const key = `obra360_3d_elements_${activeProject.id}`;
      localStorage.setItem(key, JSON.stringify(elements));
    } catch (e) {
      console.warn('Erro ao persistir elementos 3D no localStorage:', e);
    }
  }, [elements, activeProject.id]);

  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Cookie Consent Banner LGPD State
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('obra360_cookie_consent_v1');
    } catch {
      return true;
    }
  });

  const handleAcceptCookies = () => {
    try {
      localStorage.setItem('obra360_cookie_consent_v1', 'accepted');
    } catch {}
    setShowCookieBanner(false);
    addToast('success', 'Preferências Salvas', 'Conformidade com a LGPD registrada.');
  };

  // EventBus Subscribers
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

  // PWA Offline Listener
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

  // Initial Async Data Fetching
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
          setCompanies(fetchedCompanies);
          setActiveCompany(fetchedCompanies[0]);
          setProjects(fetchedProjects);
          setActiveProject(fetchedProjects[0]);
          setElements(fetchedElements);
          setStockItems(fetchedStock);
          setAuditLogs(fetchedAudit);
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

  // Auth state with instant default demo user access
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('obra360_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      id: 'USR-DEFAULT',
      name: 'Carlos Silva',
      email: 'carlos.engenheiro@obra360.com',
      role: 'SUPER_ADMIN'
    };
  });

  const [currentRole, setCurrentRole] = useState<RoleId>(() => {
    return authUser ? authUser.role : 'SUPER_ADMIN';
  });

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'3D' | 'PROJETOS' | 'DASHBOARD' | 'ESTOQUE' | 'ORDENS_SERVICO' | 'MEDICOES' | 'CONCILIACAO_NFE' | 'AUDITORIA' | 'CLIENTE' | 'RBAC' | 'MARKETPLACE' | 'VENDAS' | 'POSVENDAS' | 'MENSAGENS'>('3D');

  useEffect(() => {
    console.log('[App.tsx] activeTab updated to:', activeTab);
  }, [activeTab]);

  // Theme state persisted in localStorage
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('obra360_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const isDark = theme === 'dark';

  // STRICT RBAC TAB VISIBILITY GUARDS PER ROLE (13 ROLES)
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const canSee3dTab = isSuperAdmin || ['GERENTE_OBRA', 'ENGENHEIRO', 'ARQUITETO', 'MESTRE_OBRA', 'ALMOXARIFE', 'INCORPORADOR', 'FINANCEIRO'].includes(currentRole);
  const canSeeProjetosTab = isSuperAdmin || ['GERENTE_OBRA', 'ARQUITETO', 'ENGENHEIRO', 'INCORPORADOR', 'AUDITOR'].includes(currentRole);
  const canSeeStockTab = isSuperAdmin || ['GERENTE_OBRA', 'ENGENHEIRO', 'FINANCEIRO', 'MESTRE_OBRA', 'ALMOXARIFE'].includes(currentRole);
  const canSeeRbacTab = isSuperAdmin || ['GERENTE_OBRA', 'AUDITOR', 'INCORPORADOR'].includes(currentRole);
  const canSeeAuditTab = isSuperAdmin || ['AUDITOR'].includes(currentRole);
  const canSeeClientTab = isSuperAdmin || ['GERENTE_OBRA', 'CLIENTE', 'INCORPORADOR'].includes(currentRole);
  const canSeeMarketplaceTab = isSuperAdmin || ['GERENTE_OBRA', 'ENGENHEIRO', 'ALMOXARIFE', 'FINANCEIRO', 'FORNECEDOR', 'LOCADOR_MAQUINAS', 'MESTRE_OBRA'].includes(currentRole);
  const canSeeVendasTab = isSuperAdmin || ['INCORPORADOR', 'CORRETOR', 'INVESTIDOR', 'GERENTE_OBRA'].includes(currentRole);
  const canSeePosVendasTab = isSuperAdmin || ['CLIENTE', 'GERENTE_OBRA', 'INCORPORADOR'].includes(currentRole);

  // Auto redirect active tab when role changes
  useEffect(() => {
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
    addToast('info', 'Tema Alterado', `Modo ${nextTheme === 'dark' ? 'Escuro' : 'Claro'} ativado com sucesso.`);
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

  // ASYNC ACTION HANDLERS
  const handleAddCompany = async (newCmpData: Omit<Company, 'id'>) => {
    setIsSyncingAsync(true);
    try {
      const created = await api.companies.create(newCmpData);
      setCompanies((prev) => [created, ...prev]);
      setActiveCompany(created);
      try { confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } }); } catch {}
      addToast('success', 'Nova Empresa Cadastrada', `Organização "${created.name}" (CNPJ ${created.cnpj}) integrada ao Obra360.`);
    } finally {
      setIsSyncingAsync(false);
    }
  };

  const handleAddProject = async (newProjData: Omit<Project, 'id'>) => {
    setIsSyncingAsync(true);
    try {
      const created = await api.projects.create({ ...newProjData, companyId: activeCompany.id });
      // Gera e persiste o modelo 3D inicial exclusivo para o novo empreendimento
      const initialElements = getDefaultElementsForProject(created);
      try {
        localStorage.setItem(`obra360_3d_elements_${created.id}`, JSON.stringify(initialElements));
      } catch {}
      setProjects((prev) => [created, ...prev]);
      setActiveProject(created);
      setElements(initialElements);
      try { confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } }); } catch {}
      addToast('success', 'Novo Empreendimento & Modelo 3D', `Empreendimento "${created.name}" cadastrado com modelo 3D inicial (${created.type}).`);
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

    if (newStatus === 'CONCLUIDO') {
      try { confetti({ particleCount: 85, spread: 75, origin: { y: 0.6 } }); } catch {}
    }

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

  const handleAddElement = async (newElemData: Omit<BuildingElement, 'id' | 'lastUpdatedAt'>) => {
    setIsSyncingAsync(true);
    try {
      const created = await api.elements.create(newElemData);
      setElements((prev) => [...prev, created]);
      addToast('success', 'Elemento 3D Criado Assincronamente', `${created.name} gerado no modelo espacial.`);
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
    const generated: BuildingElement[] = [
      { id: `${activeProject.id}-ELEM-001`, projectId: activeProject.id, name: 'Sapata & Radier de Concreto (Planta 2D)', category: 'Fundação', status: 'CONCLUIDO', progressPercent: 100, assignedWeek: 1, materialUsed: 'Concreto Fck 30MPa', lastUpdatedBy: 'AI Parser', lastUpdatedAt: 'Agora', position: [0, 0, 0] },
      { id: `${activeProject.id}-ELEM-002`, projectId: activeProject.id, name: 'Vigas Baldrame Impermeabilizadas', category: 'Fundação', status: 'CONCLUIDO', progressPercent: 100, assignedWeek: 2, materialUsed: 'Tinta Asfáltica', lastUpdatedBy: 'AI Parser', lastUpdatedAt: 'Agora', position: [0, 0, 0] },
      { id: `${activeProject.id}-ELEM-003`, projectId: activeProject.id, name: 'Pilares Estruturais Mapeados (2D)', category: 'Estrutura', status: 'CONCLUIDO', progressPercent: 100, assignedWeek: 3, materialUsed: 'Concreto Fck 30MPa', lastUpdatedBy: 'AI Parser', lastUpdatedAt: 'Agora', position: [0, 0, 0] },
      { id: `${activeProject.id}-ELEM-004`, projectId: activeProject.id, name: 'Laje Térreo Extraída da Planta', category: 'Estrutura', status: 'CONCLUIDO', progressPercent: 100, assignedWeek: 4, materialUsed: 'Laje Pré-Moldada H12', lastUpdatedBy: 'AI Parser', lastUpdatedAt: 'Agora', position: [0, 0, 0] }
    ];

    setElements(generated);
    try {
      localStorage.setItem(`obra360_3d_elements_${activeProject.id}`, JSON.stringify(generated));
    } catch {}
    addToast('success', 'Modelo 3D Gerado por IA', `Planta "${presetName}" convertida com sucesso para o projeto "${activeProject.name}".`);
  };

  const handleResetModel = (newElements: BuildingElement[], title: string = 'Modelo 3D Atualizado') => {
    setElements(newElements);
    try {
      localStorage.setItem(`obra360_3d_elements_${activeProject.id}`, JSON.stringify(newElements));
    } catch {}
    addToast('success', title, `O projeto "${activeProject.name}" agora conta com ${newElements.length} elementos 3D cadastrados.`);
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
    <div className={`min-h-screen flex font-['Plus_Jakarta_Sans',sans-serif] transition-colors ${
      isDark ? 'bg-[#0e0f12] text-zinc-100' : 'bg-slate-100 text-zinc-900'
    }`}>
      
      {/* Floating Toast Notifier Container */}
      <ToastNotifier toasts={toasts} onDismiss={handleDismissToast} theme={theme} />

      {/* 🚀 Futuristic Sidebar Navigation */}
      <SidebarNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        theme={theme}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        canSee3dTab={canSee3dTab}
        canSeeProjetosTab={canSeeProjetosTab}
        canSeeStockTab={canSeeStockTab}
        canSeeRbacTab={canSeeRbacTab}
        canSeeAuditTab={canSeeAuditTab}
        canSeeClientTab={canSeeClientTab}
        canSeeMarketplaceTab={canSeeMarketplaceTab}
        canSeeVendasTab={canSeeVendasTab}
        canSeePosVendasTab={canSeePosVendasTab}
        activeCompany={activeCompany}
      />

      {/* Right Main Content Panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Top Header Bar */}
        <TopHeaderBar
          currentRole={currentRole}
          onSelectRole={handleSelectRole}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          authUser={authUser}
          onLogout={handleLogout}
          activeCompany={activeCompany}
          activeProject={activeProject}
          activeTab={activeTab}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Inner Content Workspace Container */}
        <div className="p-4 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* Async Cloud Connection & PWA Offline Status Banner */}
          <div className={`border rounded-2xl px-4 py-2 flex items-center justify-between font-mono text-xs ${
            !isOnline 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-bold">📶 Modo Offline do Canteiro: Dados mantidos em IndexedDB local.</span>
                </>
              ) : (
                <>
                  <Wifi className={`w-4 h-4 ${isSyncingAsync ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
                  <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
                    {isSyncingAsync ? '⚡ Sincronizando alterações assincronamente...' : '✓ Spring Boot Actuator & Kafka Messaging EventBus Ativos'}
                  </span>
                </>
              )}
            </div>

            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
              !isOnline ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {!isOnline ? 'PWA Offline Mode' : 'Event-Driven API v2.5'}
            </span>
          </div>

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
              <React.Suspense fallback={<ViewLoadingFallback />}>
                <AnimatePresence mode="wait">
                {activeTab === '3D' && canSee3dTab && (
                  <motion.div
                    key="3D"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <BimViewer3D
                      elements={elements}
                      activeProject={activeProject}
                      currentRole={currentRole}
                      theme={theme}
                      onUpdateElementStatus={handleUpdateElementStatus}
                      onUpdateElementPosition={handleUpdateElementPosition}
                      onAddElement={handleAddElement}
                      onDeleteElement={handleDeleteElement}
                      onImportFloorPlan={handleImportFloorPlan}
                      onResetModel={handleResetModel}
                      onSendToast={addToast}
                    />
                  </motion.div>
                )}

                {activeTab === 'PROJETOS' && canSeeProjetosTab && (
                  <motion.div
                    key="PROJETOS"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <DocumentManagerView currentRole={currentRole} theme={theme} onSendToast={addToast} />
                  </motion.div>
                )}

                {activeTab === 'DASHBOARD' && (
                  <motion.div
                    key="DASHBOARD"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <ExecutiveDashboard elements={elements} stockItems={stockItems} currentRole={currentRole} theme={theme} />
                  </motion.div>
                )}

                {activeTab === 'MENSAGENS' && (
                  <motion.div
                    key="MENSAGENS"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <LiveB2bChatView currentRole={currentRole} theme={theme} activeCompany={activeCompany} onSendToast={addToast} />
                  </motion.div>
                )}

                {activeTab === 'MARKETPLACE' && canSeeMarketplaceTab && (
                  <motion.div
                    key="MARKETPLACE"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <B2bMarketplaceView currentRole={currentRole} theme={theme} onSendToast={addToast} />
                  </motion.div>
                )}

                {activeTab === 'ESTOQUE' && canSeeStockTab && (
                  <motion.div
                    key="ESTOQUE"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <InventoryManager
                      stockItems={stockItems}
                      movements={movements}
                      currentRole={currentRole}
                      theme={theme}
                      onAddMovement={handleAddMovement}
                    />
                  </motion.div>
                )}

                {activeTab === 'ORDENS_SERVICO' && (
                  <motion.div
                    key="ORDENS_SERVICO"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <ServiceOrdersView currentRole={currentRole} theme={theme} onSendToast={addToast} />
                  </motion.div>
                )}

                {activeTab === 'MEDICOES' && (
                  <motion.div
                    key="MEDICOES"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <PhysicalMeasurementsView currentRole={currentRole} theme={theme} onSendToast={addToast} />
                  </motion.div>
                )}

                {activeTab === 'CONCILIACAO_NFE' && (
                  <motion.div
                    key="CONCILIACAO_NFE"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <NfeConciliationView currentRole={currentRole} theme={theme} onSendToast={addToast} />
                  </motion.div>
                )}

                {activeTab === 'VENDAS' && canSeeVendasTab && (
                  <motion.div
                    key="VENDAS"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <RealEstateStorefrontView currentRole={currentRole} theme={theme} onSendToast={addToast} />
                  </motion.div>
                )}

                {activeTab === 'RBAC' && canSeeRbacTab && (
                  <motion.div
                    key="RBAC"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <RbacMatrixView
                      currentRole={currentRole}
                      theme={theme}
                      registeredAccounts={registeredAccounts}
                      onRegisterAccount={handleRegisterAccount}
                    />
                  </motion.div>
                )}

                {activeTab === 'AUDITORIA' && canSeeAuditTab && (
                  <motion.div
                    key="AUDITORIA"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <AuditLogViewer auditLogs={auditLogs} currentRole={currentRole} theme={theme} />
                  </motion.div>
                )}

                {activeTab === 'CLIENTE' && canSeeClientTab && (
                  <motion.div
                    key="CLIENTE"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <ClientPortalView elements={elements} theme={theme} />
                  </motion.div>
                )}

                {activeTab === 'POSVENDAS' && canSeePosVendasTab && (
                  <motion.div
                    key="POSVENDAS"
                    initial={{ opacity: 0.9, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0.9, y: -4 }}
                    transition={{ duration: 0.1 }}
                  >
                    <WarrantyPostSalesView currentRole={currentRole} theme={theme} onSendToast={addToast} />
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Suspense>
          )}
          </main>
        </div>

        {/* Footer */}
        <footer className={`border-t py-5 px-6 text-center text-xs font-mono transition-colors mt-auto ${
          isDark ? 'border-[#27272a] bg-[#121214] text-zinc-500' : 'border-zinc-200 bg-white text-zinc-600'
        }`}>
          <p>Obra360 • Plataforma Corporativa Event-Driven, PubSub & Structured Logger (SaaS B2B / B2C)</p>
        </footer>

      </div>

      {/* Quick Action SpeedDial Floating Button */}
      <QuickActionFab
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        theme={theme}
      />

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        theme={theme}
      />

      {/* Aviso de Cookies Flutuante (Conformidade LGPD) */}
      {showCookieBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 animate-fadeIn">
          <div className={`p-4 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col gap-3 ${
            isDark ? 'bg-[#18181b]/95 border-orange-500/30 text-white shadow-black/60' : 'bg-white/95 border-orange-200 text-zinc-900 shadow-orange-500/10'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-2xl bg-orange-500/10 text-orange-500 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xs">Privacidade e Cookies (LGPD)</p>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Utilizamos cookies e armazenamento local para autenticação segura, persistência do modelo 3D e conformidade com o Art. 18 da Lei 13.709/2018.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-500/10">
              <button
                type="button"
                onClick={() => {
                  handleAcceptCookies();
                  setActiveTab('LGPD' as any);
                }}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl hover:underline ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'}`}
              >
                Gerenciar
              </button>
              <button
                type="button"
                onClick={handleAcceptCookies}
                className="text-xs font-bold px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md hover:opacity-95 transition"
              >
                Concordar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default App;
