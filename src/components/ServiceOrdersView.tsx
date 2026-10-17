import React, { useState } from 'react';
import { ServiceOrder, RoleId, ThemeMode } from '../types';
import { INITIAL_SERVICE_ORDERS } from '../data/mockData';
import { 
  Wrench, CheckCircle2, Clock, Users, Plus, 
  FileText, ShieldAlert, Sparkles, Filter, AlertTriangle, Check
} from 'lucide-react';

interface ServiceOrdersViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_SERVICE_ORDERS);
  const [filterCategory, setFilterCategory] = useState<string>('TODAS');
  const [showNewModal, setShowNewModal] = useState<boolean>(false);

  // New OS Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ServiceOrder['category']>('Fundação & Concreto');
  const [assignedTeam, setAssignedTeam] = useState('Equipe Alfa (Estruturas)');
  const [materialsConsumed, setMaterialsConsumed] = useState('Concreto Fck 30MPa (10m³)');

  const filteredOrders = filterCategory === 'TODAS'
    ? orders
    : orders.filter(o => o.category === filterCategory);

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const handleCreateOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newOS: ServiceOrder = {
      id: `OS-${Math.floor(5000 + Math.random() * 1000)}`,
      code: `OS-2026-00${orders.length + 1}`,
      title,
      category,
      assignedTeam,
      assignedMembersCount: 5,
      hoursWorked: 0,
      materialsConsumed,
      status: 'EM_ANDAMENTO',
      scheduledDate: new Date().toLocaleDateString('pt-BR'),
      approvedByEngineer: true
    };

    setOrders([newOS, ...orders]);
    setShowNewModal(false);
    setTitle('');
    onSendToast('success', 'Ordem de Serviço Emitida', `OS ${newOS.code} atribuída para ${assignedTeam}.`);
  };

  const handleCompleteOS = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'CONCLUIDO', approvedByEngineer: true } : o));
    onSendToast('success', 'Ordem de Serviço Concluída', `Baixa de materiais no estoque realizada com sucesso.`);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                [RF-10 / RF-11] Operação de Canteiro & Equipes
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black ${textTitle}`}>
              Gestão de Ordens de Serviço (OS) & Alocação de RH
            </h2>
            <p className={`text-xs ${textMuted}`}>
              Controle de tarefas de campo, horas trabalhadas, baixa automática de estoque por OS e alocação de equipes.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg transition shrink-0"
          >
            <Plus className="w-4 h-4" /> Emitir Nova OS de Canteiro
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredOrders.map(os => (
          <div key={os.id} className={`border rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 ${cardBg}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {os.code}
                </span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  os.status === 'CONCLUIDO' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : os.status === 'EM_ANDAMENTO'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                }`}>
                  {os.status}
                </span>
              </div>

              <h3 className={`font-bold text-sm leading-snug ${textTitle}`}>{os.title}</h3>
              <p className={`text-xs font-mono ${textMuted}`}>Categoria: {os.category}</p>

              <div className={`p-3 rounded-2xl text-xs space-y-1 ${isDark ? 'bg-[#121214]' : 'bg-zinc-50'}`}>
                <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                  <Users className="w-3.5 h-3.5 text-orange-500" />
                  <span>{os.assignedTeam} ({os.assignedMembersCount} membros)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Horas Apontadas: <strong>{os.hoursWorked}h</strong></span>
                </div>
              </div>

              {os.delayJustification && (
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong>Justificativa RN-07:</strong> {os.delayJustification}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-700/40 flex items-center justify-between">
              <span className={`text-[10px] font-mono ${textMuted}`}>Programada: {os.scheduledDate}</span>
              {os.status !== 'CONCLUIDO' && (
                <button
                  onClick={() => handleCompleteOS(os.id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition"
                >
                  <Check className="w-3.5 h-3.5" /> Dar Baixa (Concluir)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova OS */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className={`w-full max-w-lg border rounded-3xl p-6 space-y-4 ${cardBg}`}>
            <h3 className={`text-lg font-bold ${textTitle}`}>Emitir Ordem de Serviço (OS)</h3>
            
            <form onSubmit={handleCreateOS} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-bold mb-1">Título da OS</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Concretagem das Colunas do 3º Andar"
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Categoria de Serviço</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'}`}
                >
                  <option value="Fundação & Concreto">Fundação & Concreto</option>
                  <option value="Instalação Elétrica">Instalação Elétrica</option>
                  <option value="Hidráulica & Sanitário">Hidráulica & Sanitário</option>
                  <option value="Alvenaria & Vedações">Alvenaria & Vedações</option>
                  <option value="Pintura & Acabamento">Pintura & Acabamento</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Equipe Responsável Alocada</label>
                <input
                  type="text"
                  value={assignedTeam}
                  onChange={e => setAssignedTeam(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-bold mb-1">Insumos Estimados do Almoxarifado</label>
                <input
                  type="text"
                  value={materialsConsumed}
                  onChange={e => setMaterialsConsumed(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-600 text-zinc-400 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg"
                >
                  Emitir OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
