import React, { useState } from 'react';
import { NfeConciliation, RoleId, ThemeMode } from '../types';
import { INITIAL_NFE_CONCILIATIONS } from '../data/mockData';
import { 
  FileCheck, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, 
  Search, Plus, Sparkles, Building2, Check, Hash
} from 'lucide-react';

interface NfeConciliationViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const NfeConciliationView: React.FC<NfeConciliationViewProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';
  const [conciliations, setConciliations] = useState<NfeConciliation[]>(INITIAL_NFE_CONCILIATIONS);
  
  // Form State for 44-digit key validation (RN-01)
  const [inputKey, setInputKey] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('Votoran Cimentos S.A.');
  const [nfeNumber, setNfeNumber] = useState<string>('NF-e 092.144');
  const [totalAmount, setTotalAmount] = useState<number>(14500);
  const [itemsCount, setItemsCount] = useState<number>(350);

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const cleanKey = inputKey.replace(/\D/g, '');
  const isValidLength = cleanKey.length === 44;

  const handleConciliateNfe = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidLength) {
      onSendToast('error', 'Chave NF-e Inválida (RN-01)', 'A chave de acesso da NF-e deve conter exatamente 44 dígitos numéricos.');
      return;
    }

    const newNfe: NfeConciliation = {
      id: `NFE-${Math.floor(9000 + Math.random() * 1000)}`,
      nfeKey: cleanKey,
      supplierCnpj: '12.345.678/0001-95',
      supplierName,
      nfeNumber,
      issueDate: new Date().toLocaleDateString('pt-BR'),
      totalAmount,
      itemsCount,
      status: 'CONCILIADO'
    };

    setConciliations([newNfe, ...conciliations]);
    setInputKey('');
    onSendToast('success', 'NF-e Conciliada com Sucesso (44 Dígitos)', `Insumos integrados ao estoque e faturamento do pedido registrado.`);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-6 shadow-xl relative overflow-hidden ${cardBg}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
              [RF-13 / RN-01] Conciliação Fiscal Automatizada
            </span>
          </div>
          <h2 className={`text-xl sm:text-2xl font-black ${textTitle}`}>
            Conciliação de NF-e por Chave de 44 Dígitos
          </h2>
          <p className={`text-xs ${textMuted}`}>
            Validação estrita de 44 dígitos numéricos para lançamento automatizado de notas fiscais, atualização de saldo de estoque e conciliação com pedidos B2B.
          </p>
        </div>
      </div>

      {/* 44-Digit Key Validator Card Form */}
      <div className={`border rounded-3xl p-6 shadow-xl space-y-4 ${cardBg}`}>
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-orange-500" />
          <h3 className={`font-bold text-base ${textTitle}`}>Entrada de Nota Fiscal Eletrônica</h3>
        </div>

        <form onSubmit={handleConciliateNfe} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-zinc-400 mb-1.5">
              Chave de Acesso da NF-e (Obrigatório: 44 Dígitos Numéricos - RN-01)
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="Ex: 35260812345678000195550010000458921098765432"
                maxLength={44}
                className={`w-full p-3 font-mono text-xs rounded-2xl border transition tracking-wider ${
                  isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                } ${cleanKey.length > 0 && !isValidLength ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                required
              />
              <span className={`absolute right-3 top-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isValidLength ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {cleanKey.length}/44 dígitos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Razão Social Fornecedor</label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'}`}
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Número da NF-e</label>
              <input
                type="text"
                value={nfeNumber}
                onChange={e => setNfeNumber(e.target.value)}
                className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'}`}
              />
            </div>
            <div>
              <label className="block text-zinc-400 font-bold mb-1">Valor Total da Nota (R$)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={e => setTotalAmount(Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'}`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isValidLength}
            className={`w-full py-3 rounded-2xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
              isValidLength
                ? 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'
                : 'bg-zinc-700/50 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <FileCheck className="w-4 h-4" /> Validar Chave de 44 Dígitos & Conciliar Estoque
          </button>
        </form>
      </div>

      {/* Conciliated NF-es List */}
      <div className="space-y-3">
        <h3 className={`font-bold text-sm ${textTitle}`}>Histórico de Notas Fiscais Conciliadas</h3>
        {conciliations.map(nfe => (
          <div key={nfe.id} className={`border rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardBg}`}>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {nfe.nfeNumber}
                </span>
                <span className="text-xs font-bold truncate">{nfe.supplierName}</span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 truncate">
                Chave: {nfe.nfeKey}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className={`text-sm font-black ${textTitle}`}>R$ {nfe.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] font-mono text-emerald-400">✓ Insumos Atualizados ({nfe.itemsCount} itens)</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
