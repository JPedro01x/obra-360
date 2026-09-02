import React from 'react';
import { ToastNotification, ThemeMode } from '../types';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

interface ToastNotifierProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
  theme: ThemeMode;
}

export const ToastNotifier: React.FC<ToastNotifierProps> = ({ toasts, onDismiss, theme }) => {
  const isDark = theme === 'dark';

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
        let borderClass = 'border-emerald-500/40';

        if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
          borderClass = 'border-blue-500/40';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
          borderClass = 'border-amber-500/40';
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          borderClass = 'border-rose-500/40';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-slideIn transition-all ${
              isDark ? 'bg-[#18181b]/95 text-white' : 'bg-white/95 text-zinc-900'
            } ${borderClass}`}
          >
            <div className="flex items-start gap-2.5">
              {icon}
              <div className="space-y-0.5">
                <h4 className="font-bold text-xs">{toast.title}</h4>
                <p className="text-[11px] text-zinc-400 leading-tight">{toast.message}</p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
