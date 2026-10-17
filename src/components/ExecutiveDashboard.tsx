import React from 'react';
import { StockItem, BuildingElement, RoleId, ThemeMode } from '../types';
import { USER_ROLES } from '../data/mockData';
import { generateExecutiveReportPDF } from '../utils/exportUtils';
import { 
  TrendingUp, AlertTriangle, CheckCircle2, DollarSign, 
  Building, PackageCheck, ShieldCheck, ArrowUpRight, Clock, Lock,
  Wrench, FileText, Camera, Users, HardHat, ShieldAlert, Award, Layers,
  Package, ArrowDownRight, Printer, Sparkles, Activity, PieChart, BarChart3,
  FileCheck, Cpu
} from 'lucide-react';

interface ExecutiveDashboardProps {
  elements: BuildingElement[];
  stockItems: StockItem[];
  currentRole: RoleId;
  theme: ThemeMode;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  elements, 
  stockItems, 
  currentRole,
  theme 
}) => {
  const isDark = theme === 'dark';
  const roleObj = USER_ROLES[currentRole];

  const cardBg = isDark 
    ? 'bg-[#18181b]/90 border-[#27272a] shadow-2xl backdrop-blur-xl' 
    : 'bg-white border-zinc-200 shadow-xl';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const completedCount = elements.filter((e) => e.status === 'CONCLUIDO').length;
  const inProgressCount = elements.filter((e) => e.status === 'EM_EXECUCAO').length;
  const plannedCount = elements.filter((e) => e.status === 'PLANEJADO').length;
  const totalElements = elements.length || 1;
  const totalProgressPercent = Math.round(
    elements.reduce((acc, e) => acc + e.progressPercent, 0) / totalElements
  );

  const lowStockItems = stockItems.filter((item) => item.quantity <= item.minStock);

  const handlePrintPDF = () => {
    generateExecutiveReportPDF(roleObj.title, elements, stockItems);
  };

  return (
    <div className="flex flex-col gap-6 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* 🚀 Futuristic Hero Glassmorphic Header Card */}
      <div className={`border rounded-3xl p-6 relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-[#18181b] via-[#121214] to-[#18181b] border-orange-500/20 shadow-2xl' 
          : 'bg-gradient-to-r from-orange-50 via-white to-amber-50 border-orange-200 shadow-xl'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                ⚡ Painel de Controle de Alto Desempenho
              </span>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${roleObj.badgeColor}`}>
                Modo {roleObj.title}
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${textTitle}`}>
              Dashboard Executivo & Curva S (VGV)
            </h1>

            <p className={`text-xs sm:text-sm font-medium max-w-2xl ${textMuted}`}>
              Visão corporativa integrada para <strong className="text-orange-500">{roleObj.department}</strong>. Acompanhamento em tempo real de avanço físico, saldo de almoxarifado, medições Cm² e conformidade legal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handlePrintPDF}
              className="btn-spell text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Relatório Executivo PDF
            </button>
          </div>
        </div>
      </div>

      {/* 📊 Top KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Progresso Global */}
        <div className={`spell-card p-5 border rounded-3xl ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span data-testid="kpi-progresso-global" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progresso Global</span>
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${textTitle}`}>{totalProgressPercent}%</span>
            <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +5.2%
            </span>
          </div>
          <div className="w-full bg-zinc-700/30 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-600 to-amber-400 h-full rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${totalProgressPercent}%` }}
            />
          </div>
          <p className={`text-[11px] font-mono mt-2 ${textMuted}`}>
            {completedCount} etapas concluídas de {totalElements}
          </p>
        </div>

        {/* Card 2: Custo Realizado */}
        <div className={`spell-card p-5 border rounded-3xl ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Orçamento Realizado</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${textTitle}`}>R$ 166,4k</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">-1.8% desvio</span>
          </div>
          <p className={`text-[11px] font-mono mt-3 ${textMuted}`}>
            Previsto: R$ 250.000,00 (Teto 66%)
          </p>
        </div>

        {/* Card 3: Saldo de Almoxarifado SKU */}
        <div className={`spell-card p-5 border rounded-3xl ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Itens em Estoque</span>
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <PackageCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black ${textTitle}`}>{stockItems.length} SKUs</span>
            {lowStockItems.length > 0 ? (
              <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {lowStockItems.length} baixos
              </span>
            ) : (
              <span className="text-xs font-extrabold text-emerald-400">100% OK</span>
            )}
          </div>
          <p className={`text-[11px] font-mono mt-3 ${textMuted}`}>
            Conciliação NF-e 44 dígitos ativa
          </p>
        </div>

        {/* Card 4: Matriz de Segurança NR-18 / ISO 9001 */}
        <div className={`spell-card p-5 border rounded-3xl ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Conformidade Legal</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">98.4%</span>
            <span className="text-xs font-bold text-emerald-400">ISO 9001</span>
          </div>
          <p className={`text-[11px] font-mono mt-3 ${textMuted}`}>
            Checklist NR-18 e Laudos em dia
          </p>
        </div>

      </div>

      {/* 📈 S-Curve Section & Live Activity Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Curva S Interactive Graph Widget */}
        <div className={`lg:col-span-2 border rounded-3xl p-6 shadow-xl space-y-4 ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-zinc-500/15 gap-2">
            <div>
              <h3 className={`font-black text-base ${textTitle}`}>Curva S Executiva (Físico x Financeiro)</h3>
              <p className={`text-xs ${textMuted}`}>Comparativo semanal entre avanço planejado e executado</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-3 h-3 rounded bg-orange-500/40 inline-block" /> Planejado
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Realizado
              </span>
            </div>
          </div>

          <div className="h-56 w-full flex items-end justify-between gap-2 pt-6">
            {[
              { week: 'Sem 1', plan: 15, real: 15 },
              { week: 'Sem 2', plan: 30, real: 30 },
              { week: 'Sem 3', plan: 45, real: 42 },
              { week: 'Sem 4', plan: 60, real: 58 },
              { week: 'Sem 5', plan: 72, real: 65 },
              { week: 'Sem 6', plan: 85, real: 75 },
              { week: 'Sem 7', plan: 95, real: 0 },
              { week: 'Sem 8', plan: 100, real: 0 },
            ].map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div 
                    className="w-3.5 sm:w-5 bg-orange-500/40 rounded-t-lg transition-all group-hover:bg-orange-500/60" 
                    style={{ height: `${d.plan}%` }} 
                    title={`Planejado: ${d.plan}%`}
                  />
                  {d.real > 0 && (
                    <div 
                      className="w-3.5 sm:w-5 bg-emerald-500 rounded-t-lg shadow-lg shadow-emerald-500/20 transition-all group-hover:bg-emerald-400" 
                      style={{ height: `${d.real}%` }} 
                      title={`Realizado: ${d.real}%`}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-mono font-bold mt-2 ${textMuted}`}>{d.week}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Launchpad & Stage Status List */}
        <div className={`border rounded-3xl p-6 shadow-xl space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between border-b pb-3 border-zinc-500/15">
            <h3 className={`font-black text-base ${textTitle}`}>Status das Etapas 3D</h3>
            <span className="text-[10px] font-mono font-extrabold text-orange-500 uppercase">BIM Stage Engine</span>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {elements.slice(0, 5).map((elem) => (
              <div 
                key={elem.id} 
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className={`font-bold text-xs truncate ${textTitle}`}>{elem.name}</div>
                  <div className={`text-[10px] font-mono ${textMuted}`}>{elem.category} • {elem.assignedWeek}ª Sem</div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    elem.status === 'CONCLUIDO' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {elem.progressPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
