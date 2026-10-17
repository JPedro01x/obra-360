import React, { useState, useRef, useEffect } from 'react';
import { RoleId, UserRole, ThemeMode, AuthUser, Company, Project } from '../types';
import { USER_ROLES } from '../data/mockData';
import { RoleSimulationModal } from './RoleSimulationModal';
import { 
  ShieldCheck, KeyRound, Sun, Moon, LogOut, User, Building, 
  ChevronDown, Search, Bell, Sparkles, Command, Activity, Compass, Flame
} from 'lucide-react';

interface TopHeaderBarProps {
  currentRole: RoleId;
  onSelectRole: (role: RoleId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  activeCompany?: Company;
  activeProject?: Project;
  activeTab: string;
  onOpenCommandPalette: () => void;
}

export const TopHeaderBar: React.FC<TopHeaderBarProps> = ({
  currentRole,
  onSelectRole,
  theme,
  onToggleTheme,
  authUser,
  onLogout,
  activeCompany,
  activeProject,
  activeTab,
  onOpenCommandPalette
}) => {
  const roleObj: UserRole = USER_ROLES[currentRole];
  const isDark = theme === 'dark';
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isProfileOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isProfileOpen]);

  const userName = authUser?.name || 'Carlos Silva';
  const userEmail = authUser?.email || 'carlos.silva@obra360.com';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const getTabBreadcrumb = (tab: string) => {
    switch (tab) {
      case '3D': return 'Modelo 3D BIM Interativo';
      case 'PROJETOS': return 'Central de Projetos & GED';
      case 'DASHBOARD': return 'Dashboard Executivo & VGV';
      case 'ESTOQUE': return 'Almoxarifado & Estoque';
      case 'ORDENS_SERVICO': return 'Ordens de Serviço & Equipes';
      case 'MEDICOES': return 'Medições Físico-Financeiras';
      case 'CONCILIACAO_NFE': return 'Conciliação NF-e (44 Dígitos)';
      case 'MENSAGENS': return 'Chat B2B & Mensagens';
      case 'MARKETPLACE': return 'Marketplace B2B Insumos';
      case 'VENDAS': return 'Portal de Vendas';
      case 'CLIENTE': return 'Portal do Proprietário';
      case 'POSVENDAS': return 'Garantia & Pós-Venda';
      case 'RBAC': return 'Gestão de Acessos (RBAC)';
      case 'AUDITORIA': return 'Auditoria Imutável';
      default: return tab;
    }
  };

  return (
    <>
      <header className={`border-b backdrop-blur-2xl sticky top-0 z-20 px-4 lg:px-8 py-3 transition-colors ${
        isDark ? 'bg-[#121214]/90 border-[#27272a]' : 'bg-white/90 border-zinc-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-4 min-w-0">
          
          {/* Left: Breadcrumbs / Active Context Indicator */}
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-mono min-w-0 overflow-hidden">
              <span className="font-extrabold text-orange-500 flex items-center gap-1 text-sm shrink-0">
                <Flame className="w-4 h-4" /> Obra360
              </span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 whitespace-nowrap shrink-0">
                SaaS Enterprise
              </span>
              <span className="text-zinc-500 hidden sm:inline">/</span>
              <span className={`font-bold truncate max-w-[120px] sm:max-w-[160px] hidden sm:inline ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {activeCompany ? activeCompany.name : 'Empresa'}
              </span>
              <span className="text-zinc-500 hidden md:inline">/</span>
              <span className="font-bold text-orange-500 truncate max-w-[140px] sm:max-w-[180px] hidden md:inline">
                {activeProject ? activeProject.name : 'Projeto'}
              </span>
              <span className="text-zinc-500 font-bold">/</span>
              <span className={`px-2 py-0.5 rounded-full font-sans font-extrabold text-[11px] border shrink-0 truncate ${
                isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-100 text-orange-700 border-orange-300'
              }`}>
                {getTabBreadcrumb(activeTab)}
              </span>
            </div>
          </div>

          {/* Right Section: Command Search, System Pulse, Theme & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Search Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs transition shadow-sm ${
                isDark 
                  ? 'bg-[#18181b] border-[#27272a] hover:border-orange-500/50 text-zinc-400 hover:text-white' 
                  : 'bg-zinc-100 border-zinc-200 hover:border-orange-400 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium">Buscar (Ctrl + K)</span>
            </button>

            {/* Health Pulse Indicator */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-[11px] font-mono font-bold ${
              isDark ? 'bg-[#18181b] border-[#27272a] text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Spring Actuator 100% OK</span>
            </div>

            {/* Theme Switcher Button with explicit label */}
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition shadow-sm shrink-0 ${
                isDark 
                  ? 'bg-[#18181b] border-[#27272a] text-amber-400 hover:bg-[#27272a]' 
                  : 'bg-zinc-100 border-zinc-300 text-orange-600 hover:bg-zinc-200'
              }`}
              title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-orange-600" />}
              <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            {/* User Profile Menu */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                data-testid="user-profile-menu-btn"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border transition shadow-sm ${
                  isDark 
                    ? 'bg-[#18181b] border-[#27272a] hover:bg-[#27272a] text-white' 
                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-orange-500/20">
                  {userInitials}
                </div>
                <div className="text-left max-w-[130px] sm:max-w-[160px] min-w-0 overflow-hidden">
                  <div className="text-xs font-extrabold leading-none truncate">{userName}</div>
                  <div className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5 truncate">{roleObj.title}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {isProfileOpen && (
                <div className={`absolute right-0 mt-2 w-72 border rounded-3xl shadow-2xl p-3 z-50 transition-all ${
                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}>
                  <div className="flex items-center gap-3 p-2 border-b border-zinc-500/20 pb-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-xs truncate">{userName}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{userEmail}</div>
                      <div className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 ${roleObj.badgeColor}`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span>{roleObj.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsSimulationModalOpen(true);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold transition text-left ${
                        isDark ? 'hover:bg-[#27272a] text-orange-400' : 'hover:bg-orange-50 text-orange-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-orange-500" />
                        <span>Simular Perfil (Modo Dev)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 font-mono">
                        RBAC
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Developer RBAC Simulation Modal */}
      <RoleSimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={onSelectRole}
        theme={theme}
      />
    </>
  );
};
