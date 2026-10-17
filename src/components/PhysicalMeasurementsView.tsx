import React, { useState } from 'react';
import { PhysicalMeasurement, RoleId, ThemeMode } from '../types';
import { INITIAL_PHYSICAL_MEASUREMENTS } from '../data/mockData';
import { 
  BarChart3, DollarSign, CheckCircle2, Clock, Plus, 
  Building, ShieldCheck, Sparkles, TrendingUp, Check
} from 'lucide-react';

interface PhysicalMeasurementsViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const PhysicalMeasurementsView: React.FC<PhysicalMeasurementsViewProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';
  const [measurements, setMeasurements] = useState<PhysicalMeasurement[]>(INITIAL_PHYSICAL_MEASUREMENTS);

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const totalMeasuredAmount = measurements.reduce((acc, m) => acc + m.measuredAmount, 0);

  const handleApproveEngineer = (id: string) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, status: 'APROVADO_ENGENHEIRO', approverEngineer: 'Eng. Carlos Residente' } : m));
    onSendToast('success', 'Medição Física Aprovada', `Percentual de conclusão atualizado no cronograma (RN-15).`);
  };

  const handleReleaseFinance = (id: string) => {
    setMeasurements(prev => prev.map(m => m.id === id ? { ...m, status: 'LIBERADO_FINANCEIRO' } : m));
    onSendToast('success', 'Liberação Financeira Efetuada', `Valor liberado para faturamento e pagamento ao empreiteiro.`);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                [RF-25 / RN-15] Medição Físico-Financeira
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black ${textTitle}`}>
              Gestão de Medições Físico-Financeiras & Cronograma
            </h2>
            <p className={`text-xs ${textMuted}`}>
              Medição periódica de serviços por empreiteiros, atualização automática do avanço físico e liberação de recursos.
            </p>
          </div>

          <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white px-5 py-3 rounded-2xl shadow-lg shrink-0">
            <div className="text-[10px] uppercase font-mono font-bold">Total Medido Aprovado</div>
            <div className="text-xl font-black">R$ {totalMeasuredAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Measurements List */}
      <div className="space-y-4">
        {measurements.map(med => (
          <div key={med.id} className={`border rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {med.code}
                </span>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                  med.status === 'LIBERADO_FINANCEIRO'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : med.status === 'APROVADO_ENGENHEIRO'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}>
                  {med.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className={`font-bold text-base ${textTitle}`}>{med.stageName}</h3>
              <p className={`text-xs font-mono ${textMuted}`}>Empreiteiro: <strong>{med.contractorName}</strong></p>

              <div className="w-full max-w-md bg-zinc-700/30 h-2.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${med.measuredProgressPercent}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                Progresso Físico Medido: <strong className="text-emerald-400">{med.measuredProgressPercent}%</strong> (Anterior: {med.previousProgressPercent}%)
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-mono text-zinc-400">Valor da Medição</div>
                <div className={`text-xl font-black ${textTitle}`}>R$ {med.measuredAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-zinc-500">Fiscalizado por: {med.approverEngineer}</div>
              </div>

              <div className="flex items-center gap-2">
                {med.status === 'EM_MEDICAO' && (
                  <button
                    onClick={() => handleApproveEngineer(med.id)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Aprovar Medição (Engenheiro)
                  </button>
                )}

                {med.status === 'APROVADO_ENGENHEIRO' && (
                  <button
                    onClick={() => handleReleaseFinance(med.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <DollarSign className="w-4 h-4" /> Liberar Faturamento (Financeiro)
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
