import React, { useState } from 'react';
import { RealEstateUnit, RoleId, ThemeMode } from '../types';
import { INITIAL_REAL_ESTATE_UNITS } from '../data/mockData';
import { eventBus } from '../services/eventBus';
import { 
  Building, DollarSign, Home, Key, CheckCircle2, 
  Clock, Tag, Search, Filter, ArrowUpRight, Award, Layers, Calculator, ShieldCheck, Sparkles 
} from 'lucide-react';

interface RealEstateStorefrontViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const RealEstateStorefrontView: React.FC<RealEstateStorefrontViewProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';
  const [units, setUnits] = useState<RealEstateUnit[]>(INITIAL_REAL_ESTATE_UNITS);
  const [selectedFilter, setSelectedFilter] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Financial Simulator State
  const [selectedSimUnit, setSelectedSimUnit] = useState<RealEstateUnit | null>(null);
  const [downPayment, setDownPayment] = useState<number>(100000);
  const [installmentsCount, setInstallmentsCount] = useState<number>(360);

  const totalVgv = units.reduce((acc, u) => acc + u.price, 0);
  const soldVgv = units.filter((u) => u.status === 'VENDIDO').reduce((acc, u) => acc + u.price, 0);
  const reservedVgv = units.filter((u) => u.status === 'RESERVADO').reduce((acc, u) => acc + u.price, 0);
  const percentSold = Math.round((soldVgv / totalVgv) * 100);

  const isBrokerOrInvestor = ['CORRETOR', 'INVESTIDOR', 'INCORPORADOR', 'SUPER_ADMIN'].includes(currentRole);

  const filteredUnits = units.filter((u) => {
    const matchesFilter = selectedFilter === 'TODAS' || u.status === selectedFilter;
    const matchesSearch = u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.typology.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleReserveUnit = (id: string) => {
    const target = units.find((u) => u.id === id);
    if (!target) return;

    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'RESERVADO', brokerAssigned: 'Seu Perfil' } : u))
    );

    eventBus.publish('UNIT_RESERVED', 'RealEstateService', { unitNumber: target.unitNumber, price: target.price });

    const commission = target.price * 0.03;

    onSendToast(
      'success',
      'Reserva Imobiliária Efetivada',
      `Unidade ${target.unitNumber} reservada no espelho de vendas em tempo real. Comissão estimada do corretor (3%): R$ ${commission.toLocaleString('pt-BR')}.`
    );
  };

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
            <Building className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 shrink-0" />
            <h2 className={`font-extrabold text-lg sm:text-xl ${textTitle}`}>
              Portal de Comercialização Imobiliária & VGV
            </h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Espelho Sincronizado
            </span>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Comercialização de unidades em tempo real para Incorporadoras, Imobiliárias, Corretores e Investidores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-3.5 py-2 rounded-2xl border border-rose-500/20">
            ● VGV Total: R$ {totalVgv.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* VGV KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
          <div className="text-xs font-bold text-zinc-400">VGV Realizado (Vendas Aprovadas)</div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">
            R$ {soldVgv.toLocaleString('pt-BR')} ({percentSold}%)
          </h3>
          <div className="w-full bg-zinc-700/30 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentSold}%` }} />
          </div>
        </div>

        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
          <div className="text-xs font-bold text-zinc-400">VGV Reservado (Propostas Ativas)</div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-2">
            R$ {reservedVgv.toLocaleString('pt-BR')}
          </h3>
          <p className={`text-[11px] mt-1 ${textMuted}`}>Contratos em análise de crédito</p>
        </div>

        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
          <div className="text-xs font-bold text-zinc-400">Disponibilidade no Espelho</div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-orange-500 mt-2">
            {units.filter((u) => u.status === 'DISPONIVEL').length} de {units.length} Unidades
          </h3>
          <p className={`text-[11px] mt-1 ${textMuted}`}>Prontas para reserva imediata</p>
        </div>
      </div>

      {/* Units Mirror Matrix & Controls */}
      <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl space-y-4`}>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 border-zinc-700/40 gap-3">
          <div>
            <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Espelho de Vendas Interativo de Unidades</h3>
            <p className={`text-xs ${textMuted}`}>Clique em uma unidade disponível para simulação financeira ou reserva</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px]">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${textMuted}`} />
              <input
                type="text"
                placeholder="Buscar unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                }`}
              />
            </div>

            <div className={`flex p-1 rounded-2xl border text-xs overflow-x-auto ${
              isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
            }`}>
              {['TODAS', 'DISPONIVEL', 'RESERVADO', 'VENDIDO'].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    selectedFilter === f ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Units Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const isAvailable = unit.status === 'DISPONIVEL';
            const commission = unit.price * 0.03;

            return (
              <div
                key={unit.id}
                className={`border rounded-2xl p-4 shadow-md space-y-3 flex flex-col justify-between transition-all hover:border-orange-500/50 ${innerBg}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-orange-500 font-bold">{unit.unitNumber} • {unit.floor}º Andar</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      unit.status === 'VENDIDO'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : unit.status === 'RESERVADO'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {unit.status}
                    </span>
                  </div>

                  <h4 className={`font-extrabold text-sm sm:text-base ${textTitle}`}>{unit.typology}</h4>
                  <p className={`text-xs font-mono ${textMuted}`}>{unit.areaM2} m² Privativos • Suíte + Sol da Manhã</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-700/30 font-mono">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${textMuted}`}>Valor da Tabela:</span>
                    <span className="text-base font-extrabold text-emerald-500">R$ {unit.price.toLocaleString('pt-BR')}</span>
                  </div>

                  {isBrokerOrInvestor && (
                    <div className="flex justify-between text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                      <span>Comissão Corretor (3%):</span>
                      <span>R$ {commission.toLocaleString('pt-BR')}</span>
                    </div>
                  )}

                  {unit.buyerName && (
                    <div className={`text-[10px] ${textMuted}`}>Proprietário: <strong className={textTitle}>{unit.buyerName}</strong></div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedSimUnit(unit);
                        setDownPayment(Math.round(unit.price * 0.2));
                      }}
                      className={`py-2 rounded-xl font-bold text-xs border transition flex items-center justify-center gap-1 ${
                        isDark ? 'bg-[#18181b] border-[#27272a] hover:bg-[#27272a] text-zinc-200' : 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-800'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5 text-orange-500" /> Simular
                    </button>

                    {isAvailable ? (
                      <button
                        onClick={() => handleReserveUnit(unit.id)}
                        className="py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs shadow-md transition"
                      >
                        Efetuar Reserva
                      </button>
                    ) : (
                      <div className="py-2 text-center text-[10px] font-bold text-zinc-500 bg-zinc-800/40 rounded-xl border border-zinc-700/30">
                        Indisponível
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FINANCIAL SIMULATOR MODAL */}
      {selectedSimUnit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-orange-500" />
                <h3 className={`font-bold text-base ${textTitle}`}>Simulador de Financiamento Imobiliário</h3>
              </div>
              <button onClick={() => setSelectedSimUnit(null)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`p-3 rounded-2xl border space-y-1 font-mono ${innerBg}`}>
                <div className="flex justify-between">
                  <span className={textMuted}>Unidade Selecionada:</span>
                  <strong className={textTitle}>{selectedSimUnit.unitNumber} ({selectedSimUnit.typology})</strong>
                </div>
                <div className="flex justify-between">
                  <span className={textMuted}>Valor de Tabela:</span>
                  <strong className="text-emerald-400">R$ {selectedSimUnit.price.toLocaleString('pt-BR')}</strong>
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Entrada Inicial (R$):</label>
                <input
                  type="number"
                  step="5000"
                  value={downPayment}
                  onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Prazo do Financiamento (Meses):</label>
                <select
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(parseInt(e.target.value))}
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  <option value={120}>120 meses (10 Anos)</option>
                  <option value={240}>240 meses (20 Anos)</option>
                  <option value={360}>360 meses (30 Anos)</option>
                </select>
              </div>

              {/* Simulation Result */}
              {(() => {
                const financed = Math.max(0, selectedSimUnit.price - downPayment);
                const monthlyEstimated = (financed / installmentsCount) * 1.008; // 0.8% a.m. simulated
                return (
                  <div className="p-3 rounded-2xl bg-orange-600/10 border border-orange-500/30 text-orange-400 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Valor Financiado:</span>
                      <strong>R$ {financed.toLocaleString('pt-BR')}</strong>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Parcela Mensal Estimada:</span>
                      <span className="text-emerald-400">R$ {monthlyEstimated.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} /mês</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedSimUnit(null)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isDark ? 'bg-[#27272a] text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handleReserveUnit(selectedSimUnit.id);
                    setSelectedSimUnit(null);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/30"
                >
                  Reservar Unidade Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
