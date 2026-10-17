import React from 'react';
import { RoleId, UserRole, ThemeMode } from '../types';
import { USER_ROLES } from '../data/mockData';
import { ShieldCheck, KeyRound, Check, X, Sparkles } from 'lucide-react';

interface RoleSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: RoleId;
  onSelectRole: (role: RoleId) => void;
  theme: ThemeMode;
}

export const RoleSimulationModal: React.FC<RoleSimulationModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
  theme
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className={`w-full max-w-2xl border rounded-3xl shadow-2xl p-6 transition-all ${
        isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Simulação de Perfis RBAC (Modo Dev / Sandbox)</h2>
              <p className="text-xs text-zinc-400">Escolha o nível de permissão corporativo para simular a experiência do usuário</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-500/10 text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5 max-h-[60vh] overflow-y-auto pr-1">
          {Object.values(USER_ROLES).map((role) => {
            const isSelected = currentRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  onSelectRole(role.id);
                  onClose();
                }}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition ${
                  isSelected
                    ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                    : isDark 
                      ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a] text-zinc-300' 
                      : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-800'
                }`}
              >
                <div className={`p-2 rounded-xl text-xs font-bold shrink-0 ${role.badgeColor}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs truncate">{role.title}</span>
                    {isSelected && <Check className="w-4 h-4 text-orange-500 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">{role.department}</p>
                  <div className="text-[9px] font-mono text-zinc-500 mt-1 uppercase">{role.level}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-500/20 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-orange-500" /> Matriz de segurança RBAC com 13 níveis ativos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
};
