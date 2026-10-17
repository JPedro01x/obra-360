import React, { useState } from 'react';
import { RoleId, UserRole, ThemeMode, AuthUser, Company } from '../types';
import { USER_ROLES } from '../data/mockData';
import { 
  Box, LayoutDashboard, Package, History, UserCheck, 
  ShieldCheck, KeyRound, ShoppingCart, Building, ShieldAlert, FileText, 
  MessageSquare, ChevronLeft, ChevronRight, Sparkles, Layers,
  Compass, HardHat, Activity, Cpu, Wrench, BarChart3, FileCheck
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  currentRole: RoleId;
  theme: ThemeMode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  canSee3dTab: boolean;
  canSeeDashboardTab: boolean;
  canSeeProjetosTab: boolean;
  canSeeStockTab: boolean;
  canSeeOsTab: boolean;
  canSeeMedicoesTab: boolean;
  canSeeNfeTab: boolean;
  canSeeChatTab: boolean;
  canSeeRbacTab: boolean;
  canSeeAuditTab: boolean;
  canSeeClientTab: boolean;
  canSeeMarketplaceTab: boolean;
  canSeeVendasTab: boolean;
  canSeePosVendasTab: boolean;
  activeCompany?: Company;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  theme,
  isCollapsed,
  onToggleCollapse,
  canSee3dTab,
  canSeeDashboardTab,
  canSeeProjetosTab,
  canSeeStockTab,
  canSeeOsTab,
  canSeeMedicoesTab,
  canSeeNfeTab,
  canSeeChatTab,
  canSeeRbacTab,
  canSeeAuditTab,
  canSeeClientTab,
  canSeeMarketplaceTab,
  canSeeVendasTab,
  canSeePosVendasTab,
  activeCompany
}) => {
  const isDark = theme === 'dark';
  const roleObj: UserRole = USER_ROLES[currentRole];

  const navSections = [
    {
      title: 'PRINCIPAL & VISÃO 3D',
      items: [
        { id: '3D', label: 'Modelo 3D Interativo & BIM', icon: Box, visible: canSee3dTab, badge: '3D' },
        { id: 'DASHBOARD', label: 'Dashboard Executivo & VGV', icon: LayoutDashboard, visible: canSeeDashboardTab, badge: 'VGV' },
        { id: 'PROJETOS', label: 'Central de Projetos & GED', icon: FileText, visible: canSeeProjetosTab, badge: 'GED' },
      ]
    },
    {
      title: 'OPERACIONAL & CAMPO',
      items: [
        { id: 'ESTOQUE', label: 'Almoxarifado & Estoque', icon: Package, visible: canSeeStockTab, badge: 'SKU' },
        { id: 'ORDENS_SERVICO', label: 'Ordens de Serviço & Equipes', icon: Wrench, visible: canSeeOsTab, badge: 'OS' },
        { id: 'MEDICOES', label: 'Medições Físico-Financeiras', icon: BarChart3, visible: canSeeMedicoesTab, badge: 'MED' },
        { id: 'CONCILIACAO_NFE', label: 'Conciliação NF-e (44 Dígitos)', icon: FileCheck, visible: canSeeNfeTab, badge: 'NF-E' },
        { id: 'MENSAGENS', label: 'Chat B2B & Central de Mensagens', icon: MessageSquare, visible: canSeeChatTab, badge: 'LIVE' },
        { id: 'MARKETPLACE', label: 'Marketplace B2B (Cotação & Máquinas)', icon: ShoppingCart, visible: canSeeMarketplaceTab, badge: 'B2B' },
      ]
    },
    {
      title: 'COMERCIAL & CLIENTE',
      items: [
        { id: 'VENDAS', label: 'Portal de Vendas Imobiliárias', icon: Building, visible: canSeeVendasTab, badge: 'VGV' },
        { id: 'CLIENTE', label: 'Portal do Proprietário', icon: UserCheck, visible: canSeeClientTab, badge: 'PWA' },
        { id: 'POSVENDAS', label: 'Garantia & Pós-Vendas', icon: ShieldCheck, visible: canSeePosVendasTab, badge: 'NR-18' },
      ]
    },
    {
      title: 'GOVERNANÇA & SEGURANÇA',
      items: [
        { id: 'RBAC', label: 'Permissões (RBAC / IAM)', icon: KeyRound, visible: canSeeRbacTab, badge: 'IAM' },
        { id: 'AUDITORIA', label: 'Auditoria (MongoDB)', icon: History, visible: canSeeAuditTab, badge: 'NO-SQL' },
      ]
    }
  ];

  return (
    <aside className={`sticky top-0 h-screen z-30 flex flex-col border-r transition-all duration-300 backdrop-blur-2xl ${
      isCollapsed ? 'w-20' : 'w-72'
    } ${
      isDark 
        ? 'bg-[#121214]/95 border-[#27272a] text-zinc-100 shadow-2xl shadow-black/50' 
        : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-xl'
    }`}>

      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-500/15 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 font-black text-xl text-white tracking-wider shrink-0 ring-2 ring-orange-500/20">
            360
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-lg tracking-tight truncate">Obra360</h1>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">Engine 3D & BIM v2.5</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-xl border transition ${
            isDark ? 'bg-[#18181b] border-[#27272a] hover:bg-[#27272a] text-zinc-400' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-600'
          }`}
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Active Role Badge Bar */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-zinc-500/10 bg-orange-500/5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-mono font-bold text-orange-500 tracking-wider">Perfil Ativo</div>
            <div className="text-xs font-extrabold truncate">{roleObj.title}</div>
          </div>
        </div>
      )}

      {/* Navigation Links Grouped by Section */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {navSections.map((sec, sIdx) => {
          const visibleItems = sec.items.filter((i) => i.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  {sec.title}
                </div>
              )}

              {visibleItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    data-testid={`nav-tab-${item.id}`}
                    onClick={() => {
                      console.log('[SidebarNav] Clicked tab:', item.id);
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30'
                        : isDark 
                          ? 'text-zinc-400 hover:text-white hover:bg-[#18181b]' 
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-orange-500'
                    }`} />

                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-lg border ${
                        isActive 
                          ? 'bg-white/20 text-white border-white/30' 
                          : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Active Indicator Bar on Collapsed View */}
                    {isCollapsed && isActive && (
                      <div className="absolute right-0 top-2 bottom-2 w-1 bg-orange-500 rounded-l-full shadow-lg shadow-orange-500" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Info / Tenant Card */}
      {!isCollapsed && activeCompany && (
        <div className="p-3 border-t border-zinc-500/15 m-3 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 border">
          <div className="flex items-center gap-2 text-xs font-extrabold text-orange-500 mb-1">
            <Cpu className="w-3.5 h-3.5" /> Tenant Corporativo
          </div>
          <div className="text-xs font-bold truncate">{activeCompany.name}</div>
          <div className="text-[10px] text-zinc-400 font-mono truncate">CNPJ: {activeCompany.cnpj}</div>
        </div>
      )}

    </aside>
  );
};
