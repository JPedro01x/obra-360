import React, { useState } from 'react';
import { B2bMaterialRFQ, EquipmentRentalItem, RoleId, ThemeMode } from '../types';
import { INITIAL_B2B_RFQS, INITIAL_EQUIPMENT_FLEET, USER_ROLES } from '../data/mockData';
import { 
  ShoppingCart, Truck, Users, FileText, CheckCircle2, 
  Plus, Search, DollarSign, Calendar, ShieldCheck, Tag, Lock, ArrowUpRight, Clock, Award, Sparkles, Building2, Check 
} from 'lucide-react';

interface B2bMarketplaceViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const B2bMarketplaceView: React.FC<B2bMarketplaceViewProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'COTATES_MATERIAIS' | 'LOCACAO_MAQUINAS' | 'TERCEIRIZADOS'>('COTATES_MATERIAIS');
  const [rfqs, setRfqs] = useState<B2bMaterialRFQ[]>(INITIAL_B2B_RFQS);
  const [fleet, setFleet] = useState<EquipmentRentalItem[]>(INITIAL_EQUIPMENT_FLEET);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // New RFQ Form State
  const [showRfqModal, setShowRfqModal] = useState<boolean>(false);
  const [materialName, setMaterialName] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(200);
  const [unit, setUnit] = useState<string>('sacos');
  const [targetPrice, setTargetPrice] = useState<number>(34.50);

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const userRoleObj = USER_ROLES[currentRole];
  const isSupplier = currentRole === 'FORNECEDOR';
  const isMachineryRenter = currentRole === 'LOCADOR_MAQUINAS';

  const handleCreateRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) return;

    const created: B2bMaterialRFQ = {
      id: `RFQ-${Math.floor(2000 + Math.random() * 1000)}`,
      materialName: materialName.trim(),
      quantity,
      unit,
      targetPrice,
      supplierOffers: [
        { supplierName: 'Votoran / Gerdau Parceiro Oficial', unitPrice: targetPrice * 0.94, deliveryDays: 2, status: 'PENDENTE' },
        { supplierName: 'Atacadão da Construção LTDA', unitPrice: targetPrice * 0.98, deliveryDays: 3, status: 'PENDENTE' }
      ],
      status: 'EM_COTACAO',
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    setRfqs([created, ...rfqs]);
    setShowRfqModal(false);
    setMaterialName('');
    onSendToast('success', 'Cotação B2B Emitida', `Solicitação ${created.id} transmitida aos fornecedores parceiros.`);
  };

  const handleApproveRfqOffer = (rfqId: string, supplierName: string, price: number) => {
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === rfqId
          ? {
              ...r,
              status: 'FATURADO',
              supplierOffers: r.supplierOffers.map((o) =>
                o.supplierName === supplierName ? { ...o, status: 'ACEITO' } : o
              )
            }
          : r
      )
    );

    const totalVal = (rfqs.find((r) => r.id === rfqId)?.quantity || 1) * price;

    onSendToast(
      'success',
      'Proposta B2B Aprovada',
      `Ordem de compra faturada com ${supplierName}. Valor total: R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Nota Fiscal (NFe) gerada.`
    );
  };

  const handleRentEquipment = (item: EquipmentRentalItem) => {
    setFleet((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, availability: 'EM_USO' } : f))
    );
    onSendToast(
      'success',
      'Contrato de Locação Assinado',
      `Reserva ativada para ${item.name} (${item.fleetProvider}). Equipamento liberado para transporte até o canteiro.`
    );
  };

  const filteredRfqs = rfqs.filter((r) =>
    r.materialName.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFleet = fleet.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4 sm:gap-6 transition-colors`}>
      
      {/* Header Controls */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 ${
        isDark ? 'border-[#27272a]' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500 shrink-0" />
            <h2 className={`font-extrabold text-base sm:text-lg ${textTitle}`}>Hub de Negócios B2B & Suprimentos</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Rede de Fornecedores Homologados
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${textMuted}`}>
            Cotações B2B de materiais em grande escala, locação de frota pesada e terceirização de mão de obra
          </p>
        </div>

        {/* Tab Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="relative min-w-[160px]">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${textMuted}`} />
            <input
              type="text"
              placeholder="Buscar insumo ou máquina..."
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
            <button
              onClick={() => setActiveTab('COTATES_MATERIAIS')}
              className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                activeTab === 'COTATES_MATERIAIS' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Cotação Materiais ({rfqs.length})
            </button>

            <button
              onClick={() => setActiveTab('LOCACAO_MAQUINAS')}
              className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                activeTab === 'LOCACAO_MAQUINAS' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Locação de Máquinas ({fleet.length})
            </button>

            <button
              onClick={() => setActiveTab('TERCEIRIZADOS')}
              className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
                activeTab === 'TERCEIRIZADOS' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Empreiteiras Terceirizadas
            </button>
          </div>

          {activeTab === 'COTATES_MATERIAIS' && !isSupplier && (
            <button
              onClick={() => setShowRfqModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-2 sm:py-2.5 rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
            >
              <Plus className="w-4 h-4" /> Nova Cotação B2B
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: B2B MATERIAL RFQS */}
      {activeTab === 'COTATES_MATERIAIS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRfqs.map((rfq) => (
              <div key={rfq.id} className={`border rounded-2xl p-4 shadow-md space-y-3 flex flex-col justify-between ${innerBg}`}>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-orange-500 font-bold">{rfq.id} • Emissão: {rfq.createdAt}</span>
                      <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>{rfq.materialName}</h3>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      rfq.status === 'FATURADO' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {rfq.status === 'FATURADO' ? '✓ Pedido Faturado (NFe)' : '⚡ Em Cotação B2B'}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-mono p-2 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                    <span className={textMuted}>Lote Requisitado: <strong className={textTitle}>{rfq.quantity} {rfq.unit}</strong></span>
                    <span className="text-emerald-400 font-bold">Preço Teto: R$ {rfq.targetPrice.toFixed(2)} / {rfq.unit}</span>
                  </div>
                </div>

                {/* Proposals Received from B2B Suppliers */}
                <div className="space-y-2 pt-2 border-t border-zinc-700/30 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-400">Propostas dos Fornecedores:</span>
                    <span className="text-[10px] text-orange-400 font-mono font-bold">{rfq.supplierOffers.length} Ofertas</span>
                  </div>

                  {rfq.supplierOffers.map((off, idx) => {
                    const isWinner = off.status === 'ACEITO';
                    const unitVal = rfq.quantity * off.unitPrice;

                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition ${
                          isWinner 
                            ? 'bg-emerald-950/30 border-emerald-500/50' 
                            : isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className={`font-bold flex items-center gap-1.5 ${textTitle}`}>
                            <span>{off.supplierName}</span>
                            {isWinner && <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded-md">Vencedora</span>}
                          </div>
                          <div className={`text-[10px] ${textMuted}`}>Prazo de Entrega: <strong>{off.deliveryDays} dias úteis</strong> no Canteiro</div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 font-mono">
                          <div className="text-right">
                            <div className="text-emerald-400 font-bold text-sm">R$ {off.unitPrice.toFixed(2)} / un</div>
                            <div className={`text-[9px] ${textMuted}`}>Total: R$ {unitVal.toLocaleString('pt-BR')}</div>
                          </div>

                          {rfq.status !== 'FATURADO' && !isSupplier && (
                            <button
                              onClick={() => handleApproveRfqOffer(rfq.id, off.supplierName, off.unitPrice)}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                            >
                              Aprovar & NFe
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: EQUIPMENT RENTAL FLEET */}
      {activeTab === 'LOCACAO_MAQUINAS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredFleet.map((item) => (
            <div key={item.id} className={`border rounded-2xl p-4 shadow-md space-y-3 flex flex-col justify-between ${innerBg}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {item.category}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    item.availability === 'DISPONIVEL' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {item.availability === 'DISPONIVEL' ? '✓ Disponível para Reserva' : '⚡ Alugado na Obra'}
                  </span>
                </div>

                <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>{item.name}</h3>
                <p className={`text-xs leading-relaxed ${textMuted}`}>{item.specs}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-700/30">
                <div className="flex justify-between items-center font-mono">
                  <span className={`text-xs ${textMuted}`}>Valor da Diária:</span>
                  <span className="text-base font-extrabold text-emerald-500">R$ {item.dailyRate.toFixed(2)}</span>
                </div>
                <div className={`text-[10px] ${textMuted}`}>Frota Responsável: <strong className={textTitle}>{item.fleetProvider}</strong></div>

                {item.availability === 'DISPONIVEL' ? (
                  <button
                    onClick={() => handleRentEquipment(item)}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs shadow-md transition"
                  >
                    Solicitar Contrato de Locação
                  </button>
                ) : (
                  <div className="py-2 text-center text-xs font-bold text-zinc-500 bg-zinc-800/40 rounded-xl border border-zinc-700/30">
                    Equipamento Ativo no Canteiro
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SUBCONTRACTORS & WORKFORCE */}
      {activeTab === 'TERCEIRIZADOS' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Rede de Empreiteiras & Mão de Obra Homologada</h3>
            <span className="text-xs text-orange-500 font-bold font-mono">★ Todas com Certificação NR-18 / NR-35</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { company: 'Armações & Estrutura LTDA', service: 'Armação de Aço CA-50 & Concretagem', rating: '★ 4.9', workers: 15, phone: '(11) 98822-1020' },
              { company: 'Instalações Hidráulicas Silva', service: 'Hidráulica PPR/PVC & Tubulação de Esgoto', rating: '★ 4.8', workers: 6, phone: '(11) 97711-4030' },
              { company: 'SolarTek Energia Renovável', service: 'Instalação de Painéis Fotovoltaicos 550W', rating: '★ 5.0', workers: 8, phone: '(11) 99933-5050' },
            ].map((c, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${innerBg}`}>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-xs sm:text-sm ${textTitle}`}>{c.company}</h4>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">{c.rating}</span>
                  </div>
                  <p className={`text-xs ${textMuted}`}>{c.service}</p>
                  <p className="text-[10px] font-mono text-zinc-400">{c.workers} Operários em Equipe • Tel: {c.phone}</p>
                </div>
                <button
                  onClick={() => onSendToast('success', 'Contrato Emitido', `Solicitação de contratação enviada para ${c.company}`)}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                >
                  Contratar Empreiteira
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW RFQ MODAL */}
      {showRfqModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <h3 className={`font-bold text-base ${textTitle}`}>Criar Nova Cotação B2B (RFQ)</h3>
              <button onClick={() => setShowRfqModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <form onSubmit={handleCreateRfq} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Nome do Insumo / Material:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cimento CP II-Z ou Areia Lavada"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Quantidade:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Unidade Medida:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Preço Alvo Unitário (Teto R$):</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRfqModal(false)}
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
                  Enviar Cotação B2B
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
