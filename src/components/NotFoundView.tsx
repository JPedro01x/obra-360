import React from 'react';
import { ThemeMode } from '../types';
import { 
  Building2, Home, ArrowLeft, SearchX, HardHat, FileQuestion, Sparkles 
} from 'lucide-react';

interface NotFoundViewProps {
  theme: ThemeMode;
  onGoHome: () => void;
  onGoProjects: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({
  theme,
  onGoHome,
  onGoProjects
}) => {
  const isDark = theme === 'dark';

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200 shadow-2xl';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600';

  return (
    <div className={`min-h-[80vh] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-['Plus_Jakarta_Sans',sans-serif] ${
      isDark ? 'text-zinc-100' : 'text-zinc-900'
    }`}>
      
      <div className={`max-w-xl w-full border rounded-3xl p-6 sm:p-10 text-center space-y-6 relative overflow-hidden transition-all ${cardBg}`}>
        
        {/* Top Decorative Graphic Badge */}
        <div className="relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center mx-auto shadow-xl shadow-orange-600/30 text-white font-black">
            <HardHat className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-4xl sm:text-6xl font-black tracking-tighter text-orange-500 font-mono">404</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 uppercase font-mono">
              Rota Não Encontrada
            </span>
          </div>
        </div>

        {/* Content & Messages */}
        <div className="space-y-2 relative z-10">
          <h2 className={`font-extrabold text-xl sm:text-2xl ${textTitle}`}>
            Planta ou Documento Inexistente
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed max-w-md mx-auto ${textMuted}`}>
            A rota ou especificação técnica solicitada não foi localizada no servidor. É possível que o arquivo do canteiro tenha sido movido ou você não possua permissão de acesso.
          </p>
        </div>

        {/* Action Buttons Grid */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </button>

          <button
            type="button"
            onClick={onGoProjects}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 ${
              isDark 
                ? 'bg-[#121214] text-zinc-300 border-[#27272a] hover:bg-[#27272a] hover:text-white' 
                : 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-orange-500" />
            <span>Central de Projetos</span>
          </button>
        </div>

        {/* Footer Technical Note */}
        <div className={`pt-4 border-t text-[11px] font-mono flex items-center justify-center gap-1.5 ${
          isDark ? 'border-[#27272a] text-zinc-500' : 'border-zinc-200 text-zinc-400'
        }`}>
          <FileQuestion className="w-3.5 h-3.5 text-orange-500" />
          <span>Erro HTTP 404 - Obra360 Enterprise Route Guard</span>
        </div>

      </div>

    </div>
  );
};
