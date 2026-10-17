import React, { useState } from 'react';
import { WarrantyPostSalesTicket, RoleId, ThemeMode } from '../types';
import { INITIAL_WARRANTY_TICKETS } from '../data/mockData';
import { 
  ShieldCheck, Wrench, FileText, CheckCircle2, 
  Clock, Plus, AlertCircle, PhoneCall, Sparkles, User, AlertTriangle 
} from 'lucide-react';

interface WarrantyPostSalesViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const WarrantyPostSalesView: React.FC<WarrantyPostSalesViewProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';
  const [tickets, setTickets] = useState<WarrantyPostSalesTicket[]>(INITIAL_WARRANTY_TICKETS);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [filterPriority, setFilterPriority] = useState<string>('TODAS');

  // Form State
  const [category, setCategory] = useState<'Infiltração' | 'Elétrica' | 'Pintura' | 'Esquadrias' | 'Hidráulica'>('Infiltração');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<'ALTA' | 'MEDIA' | 'BAIXA'>('MEDIA');

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const created: WarrantyPostSalesTicket = {
      id: `ASS-${Math.floor(8800 + Math.random() * 1000)}`,
      unitNumber: 'Apt 101',
      ownerName: 'João Pedro Proprietário',
      category,
      description: description.trim(),
      status: 'ABERTO',
      openedAt: new Date().toLocaleDateString('pt-BR'),
      priority
    };

    setTickets([created, ...tickets]);
    setShowModal(false);
    setDescription('');
    
    const slaText = priority === 'ALTA' ? '24 horas (Atendimento de Urgência)' : '48 horas';

    onSendToast(
      'success',
      'Chamado de Assistência Registrado',
      `Solicitação ${created.id} cadastrada sob garantia. SLA de vistoria técnica: ${slaText}.`
    );
  };

  const handleCompleteTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'CONCLUIDO' } : t))
    );
    onSendToast('success', 'Chamado Concluído', `Laudo técnico aprovado e encerrado pelo proprietário.`);
  };

  const filteredTickets = tickets.filter(
    (t) => filterPriority === 'TODAS' || t.priority === filterPriority
  );

  return (
    <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4 sm:gap-6 transition-colors`}>
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
        isDark ? 'border-[#27272a]' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <h2 className={`font-extrabold text-base sm:text-lg ${textTitle}`}>Portal de Garantia & Pós-Obra (Assistência Técnica)</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Garantia 5 Anos NBR 15575
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${textMuted}`}>
            Termos de garantia estrutural, manual digital do proprietário e vistoria de chamados de manutenção
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Abrir Chamado de Garantia
        </button>
      </div>

      {/* SLA Info Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${innerBg}`}>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            24h
          </div>
          <div className="space-y-0.5">
            <span className={`font-bold text-xs ${textTitle}`}>SLA Urgência (Infiltração)</span>
            <p className={`text-[10px] ${textMuted}`}>Atendimento técnico imediato em vazamentos</p>
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${innerBg}`}>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            48h
          </div>
          <div className="space-y-0.5">
            <span className={`font-bold text-xs ${textTitle}`}>SLA Elétrica & Hidráulica</span>
            <p className={`text-[10px] ${textMuted}`}>Reparos de componentes e disjuntores</p>
          </div>
        </div>

        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${innerBg}`}>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            5 Anos
          </div>
          <div className="space-y-0.5">
            <span className={`font-bold text-xs ${textTitle}`}>Garantia Estrutural NBR</span>
            <p className={`text-[10px] ${textMuted}`}>Cobertura para fundação e alvenaria</p>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 border-zinc-700/30 gap-2">
          <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Chamados de Manutenção ({filteredTickets.length})</h3>
          
          <div className={`flex p-1 rounded-2xl border text-xs ${
            isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
          }`}>
            {['TODAS', 'ALTA', 'MEDIA', 'BAIXA'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  filterPriority === p ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTickets.map((t) => (
            <div key={t.id} className={`border rounded-2xl p-4 shadow-md space-y-3 flex flex-col justify-between ${innerBg}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-orange-500 font-bold">{t.id} • {t.unitNumber}</span>
                    <h4 className={`font-bold text-sm sm:text-base ${textTitle}`}>{t.category}</h4>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    t.status === 'CONCLUIDO' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {t.status === 'CONCLUIDO' ? '✓ Reparo Concluído' : '⚡ Em Atendimento Técnico'}
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${textMuted}`}>{t.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-700/30">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className={textMuted}>Aberto em: <strong>{t.openedAt}</strong></span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${
                    t.priority === 'ALTA' 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    Prioridade: {t.priority}
                  </span>
                </div>

                {t.status !== 'CONCLUIDO' && (
                  <button
                    onClick={() => handleCompleteTicket(t.id)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition"
                  >
                    Confirmar Resolução do Reparo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW TICKET MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <h3 className={`font-bold text-base ${textTitle}`}>Novo Chamado de Assistência Técnica</h3>
              <button onClick={() => setShowModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Categoria da Ocorrência:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  <option value="Infiltração">Infiltração / Vazamento (SLA 24h)</option>
                  <option value="Elétrica">Instalação Elétrica / Disjuntor</option>
                  <option value="Pintura">Pintura / Fissura de Parede</option>
                  <option value="Esquadrias">Esquadrias de Alumínio / Portas</option>
                  <option value="Hidráulica">Hidráulica / Torneiras</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Descrição Detalhada do Problema:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva a ocorrência constatada no imóvel..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Nível de Prioridade:</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  <option value="BAIXA">Baixa (Reparo Estético)</option>
                  <option value="MEDIA">Média (Urgência Normal)</option>
                  <option value="ALTA">Alta (Vazamento Ativo / Emergência SLA 24h)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isDark ? 'bg-[#27272a] text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/30"
                >
                  Registrar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
