import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Package, Sparkles, MessageSquare, X } from 'lucide-react';
import { ThemeMode } from '../types';

interface QuickActionFabProps {
  onOpenCommandPalette: () => void;
  onSelectTab: (tab: string) => void;
  theme: ThemeMode;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  onOpenCommandPalette,
  onSelectTab,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';

  const actions = [
    {
      id: 'cmd',
      label: 'Paleta de Comandos (Ctrl+K)',
      icon: Search,
      color: 'bg-orange-600 hover:bg-orange-500',
      action: () => {
        onOpenCommandPalette();
        setIsOpen(false);
      }
    },
    {
      id: 'stock',
      label: 'Novo Registro de Estoque',
      icon: Package,
      color: 'bg-emerald-600 hover:bg-emerald-500',
      action: () => {
        onSelectTab('ESTOQUE');
        setIsOpen(false);
      }
    },
    {
      id: 'chat',
      label: 'Assistente IA & Mensagens',
      icon: MessageSquare,
      color: 'bg-cyan-600 hover:bg-cyan-500',
      action: () => {
        onSelectTab('MENSAGENS');
        setIsOpen(false);
      }
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* SpeedDial Options Menu */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {actions.map((act, index) => {
              const Icon = act.icon;
              return (
                <motion.button
                  key={act.id}
                  initial={{ opacity: 0, y: 15, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.8 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={act.action}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-white font-bold text-xs shadow-xl transition cursor-pointer"
                >
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold shadow-md ${
                    isDark ? 'bg-[#18181b] text-white border border-[#27272a]' : 'bg-white text-zinc-900 border border-zinc-200'
                  }`}>
                    {act.label}
                  </span>
                  <div className={`p-2.5 rounded-2xl shadow-lg ${act.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-orange-600/40 border border-orange-400/30 cursor-pointer"
        title="Ações Rápidas de Campo"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </motion.div>
      </motion.button>
    </div>
  );
};
