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

  return (
    <header className={`border-b backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors ${
      isDark ? 'bg-[#121214]/90 border-[#27272a]' : 'bg-white/90 border-zinc-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Active Company Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-600/20 font-black text-white shrink-0">
            <Box className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Obra360
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                SaaS Multi-Tenant
              </span>
            </div>
            {activeCompany && (
              <p className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <Building className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 truncate max-w-[180px] sm:max-w-[240px]">{activeCompany.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Section: RBAC Profile Switcher & Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* RBAC Profile Switcher Pill */}
          <div className={`flex items-center gap-2 border rounded-2xl p-1 shadow-sm ${
            isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="text-xs font-semibold hidden md:inline">Perfil:</span>
            </div>

            <select
              value={currentRole}
              onChange={(e) => onSelectRole(e.target.value as RoleId)}
              className={`font-semibold text-xs rounded-xl px-2.5 py-1.5 border focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer ${
                isDark 
                  ? 'bg-[#121214] text-white border-[#27272a]' 
                  : 'bg-white text-zinc-900 border-zinc-300'
              }`}
            >
              {Object.values(USER_ROLES).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-2xl border flex items-center justify-center text-xs transition ${
              isDark 
                ? 'bg-[#18181b] border-[#27272a] text-amber-400 hover:bg-[#27272a]' 
                : 'bg-zinc-100 border-zinc-300 text-orange-600 hover:bg-zinc-200'
            }`}
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout Button */}
          {authUser && (
            <button
              onClick={onLogout}
              className="p-2 rounded-2xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20 font-bold text-xs transition"
              title="Sair da Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
