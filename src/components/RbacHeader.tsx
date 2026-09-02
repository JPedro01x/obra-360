import React from 'react';
import { RoleId, UserRole, ThemeMode, AuthUser, Company } from '../types';
import { USER_ROLES } from '../data/mockData';
import { ShieldCheck, KeyRound, Sun, Moon, LogOut, User, Building, FileText, Box } from 'lucide-react';

interface RbacHeaderProps {
  currentRole: RoleId;
  onSelectRole: (role: RoleId) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  activeCompany?: Company;
  onOpenDde?: () => void;
}

export const RbacHeader: React.FC<RbacHeaderProps> = ({
  currentRole,
  onSelectRole,
  theme,
  onToggleTheme,
  authUser,
  onLogout,
  activeCompany,
  onOpenDde
}) => {
  const roleObj: UserRole = USER_ROLES[currentRole];
  const isDark = theme === 'dark';

  return (
    <header className={`border-b backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-colors ${
      isDark ? 'bg-[#18181b]/95 border-[#27272a]' : 'bg-white/95 border-zinc-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand & System Title */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20 font-black text-lg sm:text-xl text-white tracking-wider shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className={`font-extrabold text-base sm:text-lg tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  Obra360
                </h1>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 whitespace-nowrap">
                  Enterprise Multi-Tenant
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {activeCompany ? (
                  <>
                    <Building className="w-3 h-3 text-cyan-400" />
                    <span className="font-semibold text-cyan-400 truncate max-w-[200px]">{activeCompany.name}</span>
                  </>
                ) : (
                  'Plataforma Integrada Corporativa'
                )}
              </p>
            </div>
          </div>

          {/* Theme Toggle Button for Mobile */}
          <div className="flex md:hidden items-center gap-2">
            {onOpenDde && (
              <button
                onClick={onOpenDde}
                className="p-2 rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/30 font-bold text-xs flex items-center gap-1"
                title="Documento DDE"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border flex items-center justify-center text-xs font-bold transition ${
                isDark 
                  ? 'bg-[#121214] border-[#27272a] text-amber-400' 
                  : 'bg-zinc-100 border-zinc-300 text-orange-600'
              }`}
              title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-orange-600" />}
            </button>
            {authUser && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-rose-600/10 text-rose-500 border border-rose-500/30 font-bold text-xs"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Section: Theme Toggle + RBAC Switcher + User Logout */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 sm:gap-3">
          
          {/* DDE Document Button */}
          {onOpenDde && (
            <button
              onClick={onOpenDde}
              className="hidden md:flex p-2.5 rounded-2xl bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 border border-orange-500/30 items-center gap-2 text-xs font-bold transition shadow-sm"
              title="Abrir Documento de Definição de Escopo (DDE)"
            >
              <FileText className="w-4 h-4 text-orange-500" />
              <span className="hidden lg:inline">Documento DDE</span>
            </button>
          )}

          {/* Theme Toggle Button for Desktop */}
          <button
            onClick={onToggleTheme}
            className={`hidden md:flex p-2.5 rounded-2xl border items-center gap-2 text-xs font-bold transition shadow-sm ${
              isDark 
                ? 'bg-[#121214] border-[#27272a] text-amber-400 hover:bg-[#27272a]' 
                : 'bg-zinc-100 border-zinc-300 text-orange-600 hover:bg-zinc-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-orange-600" />}
            <span className="hidden lg:inline">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          {/* RBAC Profile Switcher */}
          <div className={`flex items-center gap-2 sm:gap-3 border rounded-2xl p-1 sm:p-1.5 shadow-inner w-full md:w-auto justify-between ${
            isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
              <span className={`text-[11px] sm:text-xs font-semibold hidden sm:inline ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Perfil:
              </span>
            </div>

            <select
              value={currentRole}
              onChange={(e) => onSelectRole(e.target.value as RoleId)}
              className={`font-semibold text-[11px] sm:text-xs rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 border focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer flex-1 md:flex-none max-w-[200px] sm:max-w-none ${
                isDark 
                  ? 'bg-[#18181b] text-white border-[#27272a]' 
                  : 'bg-white text-zinc-900 border-zinc-300'
              }`}
            >
              {Object.values(USER_ROLES).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>

            <div className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border flex items-center gap-1 shrink-0 ${roleObj.badgeColor}`}>
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{roleObj.department}</span>
              <span className="inline sm:hidden">{roleObj.level.split(' - ')[0]}</span>
            </div>
          </div>

          {/* Logout Button Desktop */}
          {authUser && (
            <button
              onClick={onLogout}
              className="hidden md:flex p-2.5 rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 font-bold text-xs items-center gap-1.5 transition"
              title="Sair da Sessão"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Sair</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
