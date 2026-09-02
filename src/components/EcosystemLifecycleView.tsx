import React, { useState } from 'react';
import { EcosystemStage, RoleId, ThemeMode } from '../types';
import { INITIAL_ECOSYSTEM_STAGES } from '../data/mockData';
import { 
  Building2, ShoppingCart, HardHat, KeyRound, CheckCircle2, 
  Clock, ArrowRight, ChevronRight, Award, Layers, Sparkles, Building, Users 
} from 'lucide-react';

interface EcosystemLifecycleViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onNavigateToTab: (tab: '3D' | 'DASHBOARD' | 'ESTOQUE' | 'AUDITORIA' | 'CLIENTE' | 'RBAC' | 'MARKETPLACE' | 'VENDAS' | 'POSVENDAS') => void;
}

export const EcosystemLifecycleView: React.FC<EcosystemLifecycleViewProps> = ({
  currentRole,
  theme,
  onNavigateToTab
}) => {
  const isDark = theme === 'dark';
  const [stages] = useState<EcosystemStage[]>(INITIAL_ECOSYSTEM_STAGES);
  const [selectedPillar, setSelectedPillar] = useState<string>('TODOS');

  const pillars = [
    'TODOS',
    'Incorporação & Projetos',
    'Suprimentos & Contratações B2B',
    'Execução 3D & Canteiro',
    'Vendas & Pós-Obra B2C'
  ];

  const filteredStages = stages.filter(
    (s) => selectedPillar === 'TODOS' || s.pillar === selectedPillar
  );

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${cardBg}`}>
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0" />
            <h2 className={`font-extrabold text-lg sm:text-xl ${textTitle}`}>
              Ciclo de Vida Integrado do Empreendimento (13 Estágios)
            </h2>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Plataforma corporativa de negócios conectando o mercado imobiliário e a cadeia de construção civil B2B e B2C.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-2xl border border-orange-500/20">
            ● 100% Cobertura de Ciclo
          </span>
        </div>
      </div>

      {/* Pillar Filter Tabs */}
      <div className={`flex p-1.5 rounded-2xl border text-xs overflow-x-auto gap-1 ${
        isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200'
      }`}>
        {pillars.map((pil) => (
          <button
            key={pil}
            onClick={() => setSelectedPillar(pil)}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
              selectedPillar === pil
                ? 'bg-orange-600 text-white shadow-md'
                : `${textMuted} hover:${textTitle}`
            }`}
          >
            {pil}
          </button>
        ))}
      </div>

      {/* Grid of 13 Stages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStages.map((stg) => (
          <div
            key={stg.number}
            className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-3 transition-all hover:border-orange-500/50 ${cardBg}`}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                  Estágio 0{stg.number} / 13
                </span>

                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  stg.status === 'CONCLUIDO' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : stg.status === 'EM_ANDAMENTO' 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                }`}>
                  {stg.status === 'CONCLUIDO' ? '✓ Concluído' : stg.status === 'EM_ANDAMENTO' ? '⚡ Em Andamento' : '🕒 Planejado'}
                </span>
              </div>

              <h3 className={`font-extrabold text-sm sm:text-base ${textTitle}`}>{stg.title}</h3>
              <p className={`text-xs leading-relaxed ${textMuted}`}>{stg.description}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-700/30">
              <div className="flex justify-between items-center text-[11px]">
                <span className={textMuted}>Ator Responsável:</span>
                <span className={`font-bold font-mono text-orange-500`}>{stg.responsibleActor}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className={textMuted}>Pilar de Negócio:</span>
                <span className={`font-bold ${textTitle}`}>{stg.pillar}</span>
              </div>

              {/* Action Button to Jump to Corresponding Module */}
              <button
                onClick={() => {
                  if (stg.number <= 3) onNavigateToTab('RBAC');
                  else if (stg.number <= 7) onNavigateToTab('MARKETPLACE');
                  else if (stg.number <= 10) onNavigateToTab('3D');
                  else if (stg.number <= 12) onNavigateToTab('VENDAS');
                  else onNavigateToTab('POSVENDAS');
                }}
                className={`w-full mt-2 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                  isDark ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a] text-orange-400' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-orange-600'
                }`}
              >
                <span>Acessar Módulo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
