import React, { useState, useRef, useEffect } from 'react';
import { RoleId, UserRole, ThemeMode, AuthUser, Company } from '../types';
import { USER_ROLES } from '../data/mockData';
import { RoleSimulationModal } from './RoleSimulationModal';
import { 
  ShieldCheck, KeyRound, Sun, Moon, LogOut, User, Building, 
  ChevronDown, Search, Bell, Sparkles, Command
} from 'lucide-react';

interface RbacHeaderProps {
  currentRole: RoleId;
  onSelectRole: (role: RoleId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  activeCompany?: Company;
  onOpenCommandPalette?: () => void;
}

export const RbacHeader: React.FC<RbacHeaderProps> = ({
  currentRole,
  onSelectRole,
  theme,
  onToggleTheme,
  authUser,
  onLogout,
  activeCompany,
  onOpenCommandPalette
}) => {
  const roleObj: UserRole = USER_ROLES[currentRole];
  const isDark = theme === 'dark';
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [unreadNotificationsCount] = useState(3);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = authUser?.name || 'Carlos Silva';
  const userEmail = authUser?.email || 'carlos.silva@obra360.com';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      <header className={`border-b backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-colors ${
        isDark ? 'bg-[#121214]/90 border-[#27272a]' : 'bg-white/90 border-zinc-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Brand & Active Company Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 font-black text-xl text-white tracking-wider shrink-0 ring-2 ring-orange-500/20">
                360
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className={`font-black text-base sm:text-lg tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Obra360
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 whitespace-nowrap">
                    SaaS Enterprise
                  </span>
                </div>
                <p className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {activeCompany ? (
                    <>
                      <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="font-bold text-cyan-400 truncate max-w-[180px] sm:max-w-[240px]">{activeCompany.name}</span>
                    </>
                  ) : (
                    'Plataforma Integrada da Construção Civil'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Command Palette Trigger Button */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border text-xs transition shadow-sm ${
                isDark 
                  ? 'bg-[#18181b] border-[#27272a] hover:border-orange-500/50 text-zinc-400 hover:text-white' 
                  : 'bg-zinc-100 border-zinc-200 hover:border-orange-400 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium">Busca Rápida & Comandos...</span>
              <kbd className={`ml-3 px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border ${
                isDark ? 'bg-[#27272a] border-zinc-700 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700'
              }`}>
                Ctrl + K
              </kbd>
            </button>
          )}

          {/* Right Section: Theme Toggle + User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme Toggle Button (Only Symbol / Icon) */}
            <button
              onClick={onToggleTheme}
              data-testid="theme-toggle-btn"
              aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              className={`p-2 sm:p-2.5 rounded-2xl border flex items-center justify-center transition shadow-sm ${
                isDark 
                  ? 'bg-[#18181b] border-[#27272a] text-amber-400 hover:bg-[#27272a]' 
                  : 'bg-zinc-100 border-zinc-300 text-orange-600 hover:bg-zinc-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-orange-600" />}
            </button>

            {/* Notification Bell Badge */}
            <button
              onClick={onOpenCommandPalette}
              className={`relative p-2 rounded-2xl border transition shadow-sm ${
                isDark ? 'bg-[#18181b] border-[#27272a] text-zinc-300 hover:bg-[#27272a]' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
              }`}
              title="Notificações do Canteiro"
            >
              <Bell className="w-4 h-4 text-orange-500" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white rounded-full text-[9px] font-black flex items-center justify-center ring-2 ring-[#121214]">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Profile Menu Button */}
            <div className="relative" ref={dropdownRef}>
              <button
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
                <div className="text-left hidden md:block">
                  <div className="text-xs font-extrabold leading-none">{userName}</div>
                  <div className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5">{roleObj.title}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Profile Dropdown Popover */}
              {isProfileOpen && (
                <div className={`absolute right-0 mt-2 w-72 border rounded-3xl shadow-2xl p-3 z-50 transition-all ${
                  isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-zinc-200 text-zinc-900'
                }`}>
                  
                  {/* Account Header info */}
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

                  {/* Dev Sandbox Role Switcher Action */}
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
