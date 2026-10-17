import React, { useState, useEffect } from 'react';
import { Search, Box, LayoutDashboard, Package, History, UserCheck, KeyRound, ShoppingCart, Building, ShieldCheck, X } from 'lucide-react';
import { ThemeMode } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  theme: ThemeMode;
  isTabAllowed?: (tab: string) => boolean;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  theme,
  isTabAllowed
}) => {
  const [search, setSearch] = useState('');
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: '3D', title: 'Modelo 3D Interativo & BIM', category: 'Navegação', icon: Box },
    { id: 'DASHBOARD', title: 'Dashboard Executivo & Curva S', category: 'Navegação', icon: LayoutDashboard },
    { id: 'ESTOQUE', title: 'Almoxarifado & Gestão de Insumos', category: 'Navegação', icon: Package },
    { id: 'AUDITORIA', title: 'Trilha de Auditoria (MongoDB)', category: 'Governança', icon: History },
    { id: 'CLIENTE', title: 'Portal do Proprietário & Cliente', category: 'Atendimento', icon: UserCheck },
    { id: 'MARKETPLACE', title: 'Marketplace B2B & Cotações', category: 'Suprimentos', icon: ShoppingCart },
    { id: 'RBAC', title: 'Matriz de Permissões (RBAC / IAM)', category: 'Segurança', icon: KeyRound },
    { id: 'POSVENDAS', title: 'Garantia Pós-Venda & Assistência', category: 'Pós-Venda', icon: ShieldCheck }
  ];

  const filtered = commands
    .filter((c) => !isTabAllowed || isTabAllowed(c.id))
    .filter(
      (c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-xl border rounded-3xl shadow-2xl overflow-hidden transition-all ${
        isDark ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-500/20 gap-3">
          <Search className="w-5 h-5 text-orange-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar módulo, ferramenta ou comando (Ctrl + K)..."
            className={`w-full bg-transparent text-sm focus:outline-none ${isDark ? 'text-white placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'}`}
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-500/10 text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Options List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-500 font-mono">Nenhum comando ou módulo encontrado.</p>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition text-xs font-semibold ${
                    isDark ? 'hover:bg-[#27272a] text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div>{item.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.category}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                    Abrir ↵
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className={`px-4 py-2 border-t text-[10px] font-mono flex items-center justify-between ${
          isDark ? 'border-[#27272a] bg-[#121214] text-zinc-500' : 'border-zinc-200 bg-zinc-50 text-zinc-500'
        }`}>
          <span>Navegue com as setas do teclado</span>
          <span>Pressione <kbd className="px-1.5 py-0.5 bg-zinc-500/20 rounded">ESC</kbd> para fechar</span>
        </div>

      </div>
    </div>
  );
};
