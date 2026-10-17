import React, { useState, useRef, useEffect } from 'react';
import { RoleId, UserRole, ThemeMode, AuthUser, Company } from '../types';
import { USER_ROLES } from '../data/mockData';
import { RoleSimulationModal } from './RoleSimulationModal';
import { ShieldCheck, KeyRound, Sun, Moon, LogOut, User, Building, ChevronDown, Sparkles } from 'lucide-react';

interface RbacHeaderProps {
  currentRole: RoleId;
  onSelectRole: (role: RoleId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  activeCompany?: Company;
}

export const RbacHeader: React.FC<RbacHeaderProps> = ({
  currentRole,
  onSelectRole,
  theme,
  onToggleTheme,
  authUser,
  onLogout,
  activeCompany
}) => {
  const roleObj: UserRole = USER_ROLES[currentRole];
  const isDark = theme === 'dark';
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
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
      <header className={`border-b backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-colors ${
        isDark ? 'bg-[#18181b]/95 border-[#27272a]' : 'bg-white/95 border-zinc-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Brand & Active Company */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-lg sm:text-xl text-white tracking-wider shrink-0">
                360
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className={`font-extrabold text-base sm:text-lg tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    Obra360
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 whitespace-nowrap">
                    SaaS Enterprise
                  </span>
                </div>
                <p className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {activeCompany ? (
                    <>
                      <Building className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="font-semibold text-cyan-400 truncate max-w-[180px] sm:max-w-[240px]">{activeCompany.name}</span>
                    </>
                  ) : (
                    'Plataforma Integrada Corporativa'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section: Theme Toggle + User Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`p-2 sm:px-3 sm:py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold transition shadow-sm ${
                isDark 
                  ? 'bg-[#121214] border-[#27272a] text-amber-400 hover:bg-[#27272a]' 
                  : 'bg-zinc-100 border-zinc-300 text-orange-600 hover:bg-zinc-200'
              }`}
              title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-orange-600" />}
              <span className="hidden sm:inline">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>

            {/* User Profile Menu Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border transition shadow-sm ${
                  isDark 
                    ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a] text-white' 
                    : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
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
                    <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-md">
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
