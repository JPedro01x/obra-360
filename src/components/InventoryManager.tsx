import React, { useState } from 'react';
import { StockItem, StockMovement, RoleId, ThemeMode } from '../types';
import { USER_ROLES } from '../data/mockData';
import { exportToCSV } from '../utils/exportUtils';
import { 
  Package, ArrowDownRight, ArrowUpRight, Plus, 
  FileText, ShieldAlert, CheckCircle2, MapPin, Search, Lock, Download 
} from 'lucide-react';

interface InventoryManagerProps {
  stockItems: StockItem[];
  movements: StockMovement[];
  currentRole: RoleId;
  theme: ThemeMode;
  onAddMovement: (mov: Omit<StockMovement, 'id'>) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  stockItems,
  movements,
  currentRole,
  theme,
  onAddMovement
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'ESTOQUE' | 'MOVIMENTACOES'>('ESTOQUE');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [selectedProductId, setSelectedProductId] = useState<string>(stockItems[0]?.id || '');
  const [qty, setQty] = useState<number>(10);
  const [nfe, setNfe] = useState<string>('NF-99402');
  const [destination, setDestination] = useState<string>('Obra #1024 - Alvenaria');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const userPermissions = USER_ROLES[currentRole]?.permissions || [];
  
  // Strict RBAC: Only Super Admin & Almoxarife can create Stock Movements (NFe Entry / Exit)
  const canManageStock = 
    userPermissions.includes('all') || 
    userPermissions.includes('estoque.entrada') || 
    userPermissions.includes('estoque.saida');

  const filteredItems = stockItems.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (activeTab === 'ESTOQUE') {
      exportToCSV('Obra360_Saldo_Estoque', stockItems);
    } else {
      exportToCSV('Obra360_Movimentacoes_Estoque', movements);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = stockItems.find((p) => p.id === selectedProductId);
    if (!product) return;

    onAddMovement({
      type: movementType,
      productName: product.name,
      quantity: qty,
      unit: product.unit,
      nfeNumber: movementType === 'ENTRADA' ? nfe : undefined,
      destination: movementType === 'SAIDA' ? destination : 'Almoxarifado Central',
      responsible: USER_ROLES[currentRole].title,
      date: new Date().toLocaleString('pt-BR')
    });

    setShowModal(false);
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4 sm:gap-6 transition-colors`}>
      
      {/* Header & Controls */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 ${
        isDark ? 'border-[#27272a]' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500 shrink-0" />
            <h2 className={`font-extrabold text-base sm:text-lg ${textTitle}`}>Almoxarifado & Estoque</h2>
          </div>
          <p className={`text-xs ${textMuted}`}>Entradas via Nota Fiscal (NFe) e Saídas para Obras</p>
        </div>

        {/* Tab Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-2xl border text-xs font-bold transition ${
              isDark ? 'bg-[#121214] border-[#27272a] text-zinc-300 hover:bg-[#27272a]' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
            }`}
            title="Exportar Tabela de Insumos para CSV/Excel"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>

          <div className={`flex p-1 rounded-2xl border text-xs overflow-x-auto ${
            isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              onClick={() => setActiveTab('ESTOQUE')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold transition whitespace-nowrap ${
                activeTab === 'ESTOQUE' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Saldo ({stockItems.length})
            </button>
            <button
              onClick={() => setActiveTab('MOVIMENTACOES')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold transition whitespace-nowrap ${
                activeTab === 'MOVIMENTACOES' ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
              }`}
            >
              Movimentações ({movements.length})
            </button>
          </div>

          {canManageStock ? (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-2 sm:py-2.5 rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
            >
              <Plus className="w-4 h-4" /> Registrar Movimentação
            </button>
          ) : (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-2xl border text-[11px] font-semibold ${
              isDark ? 'bg-[#121214] border-[#27272a] text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-500'
            }`}>
              <Lock className="w-3 h-3 text-amber-500" /> Leitura RBAC
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      {activeTab === 'ESTOQUE' && (
        <div className="relative max-w-md w-full">
          <Search className={`w-4 h-4 absolute left-3.5 top-3 ${textMuted}`} />
          <input
            type="text"
            placeholder="Buscar por SKU ou Nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
            }`}
          />
        </div>
      )}

      {/* TAB 1: STOCK BALANCES */}
      {activeTab === 'ESTOQUE' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className={`uppercase font-mono border-b text-[10px] ${
              isDark ? 'bg-[#121214] text-zinc-400 border-[#27272a]' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              <tr>
                <th className="p-3">SKU / Produto</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Localização</th>
                <th className="p-3">Estoque</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-[#27272a]/60 text-zinc-300' : 'divide-zinc-200 text-zinc-700'}`}>
              {filteredItems.map((item) => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className={isDark ? 'hover:bg-[#121214]/50' : 'hover:bg-zinc-50'}>
                    <td className="p-3">
                      <div className={`font-bold ${textTitle}`}>{item.name}</div>
                      <span className="text-[10px] font-mono text-orange-500">{item.sku}</span>
                    </td>
                    <td className={`p-3 ${textMuted}`}>{item.category}</td>
                    <td className="p-3 flex items-center gap-1">
                      <MapPin className={`w-3.5 h-3.5 ${textMuted}`} /> {item.location}
                    </td>
                    <td className={`p-3 font-bold font-mono text-sm ${textTitle}`}>
                      {item.quantity} <span className={`text-xs font-normal ${textMuted}`}>{item.unit}</span>
                    </td>
                    <td className="p-3 text-right">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                          Min: {item.minStock}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MOVEMENTS HISTORY */}
      {activeTab === 'MOVIMENTACOES' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className={`uppercase font-mono border-b text-[10px] ${
              isDark ? 'bg-[#121214] text-zinc-400 border-[#27272a]' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              <tr>
                <th className="p-3">Tipo</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Quantidade</th>
                <th className="p-3">Destino</th>
                <th className="p-3">Nota Fiscal</th>
                <th className="p-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${isDark ? 'divide-[#27272a]/60 text-zinc-300' : 'divide-zinc-200 text-zinc-700'}`}>
              {movements.map((mov) => (
                <tr key={mov.id} className={isDark ? 'hover:bg-[#121214]/50' : 'hover:bg-zinc-50'}>
                  <td className="p-3">
                    {mov.type === 'ENTRADA' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                        <ArrowDownRight className="w-3 h-3" /> ENTRADA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        <ArrowUpRight className="w-3 h-3" /> SAÍDA
                      </span>
                    )}
                  </td>
                  <td className={`p-3 font-bold ${textTitle}`}>{mov.productName}</td>
                  <td className="p-3 font-mono font-bold text-sm">
                    {mov.quantity} {mov.unit}
                  </td>
                  <td className="p-3">{mov.destination}</td>
                  <td className="p-3 font-mono text-orange-500 font-bold">
                    {mov.nfeNumber || mov.responsible}
                  </td>
                  <td className={`p-3 text-right font-mono text-[11px] ${textMuted}`}>
                    {mov.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REGISTRATION MODAL */}
      {showModal && canManageStock && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 ${cardBg}`}>
            
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <h3 className={`font-bold text-base ${textTitle}`}>Nova Movimentação de Estoque</h3>
              <button onClick={() => setShowModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className={`block mb-1.5 font-semibold ${textMuted}`}>Tipo de Operação:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('SAIDA')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      movementType === 'SAIDA' ? 'bg-amber-600/30 text-amber-500 border-amber-500' : `${innerBg} ${textMuted} border-zinc-300 dark:border-[#27272a]`
                    }`}
                  >
                    Saída para Obra
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('ENTRADA')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      movementType === 'ENTRADA' ? 'bg-emerald-600/30 text-emerald-500 border-emerald-500' : `${innerBg} ${textMuted} border-zinc-300 dark:border-[#27272a]`
                    }`}
                  >
                    Entrada (NFe)
                  </button>
                </div>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold ${textMuted}`}>Selecione o Produto:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Atual: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold ${textMuted}`}>Quantidade:</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              {movementType === 'ENTRADA' ? (
                <div>
                  <label className={`block mb-1.5 font-semibold ${textMuted}`}>Número da Nota Fiscal (NFe):</label>
                  <input
                    type="text"
                    value={nfe}
                    onChange={(e) => setNfe(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              ) : (
                <div>
                  <label className={`block mb-1.5 font-semibold ${textMuted}`}>Destino / Finalidade Obra:</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isDark ? 'bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/30"
                >
                  Confirmar Registro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
