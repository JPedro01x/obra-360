import React, { useState } from 'react';
import { Company, CompanySegment, ThemeMode } from '../types';
import { 
  Building, ShieldCheck, ChevronDown, Check, Plus, 
  Sparkles, MapPin, Phone, Users, Layers, Award, Factory 
} from 'lucide-react';

interface CompanySelectorHeaderProps {
  companies: Company[];
  activeCompany: Company;
  onSelectCompany: (company: Company) => void;
  onAddCompany: (newCompany: Omit<Company, 'id'>) => void;
  theme: ThemeMode;
}

export const CompanySelectorHeader: React.FC<CompanySelectorHeaderProps> = ({
  companies,
  activeCompany,
  onSelectCompany,
  onAddCompany,
  theme
}) => {
  const isDark = theme === 'dark';
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState<boolean>(false);

  // New Company Form State
  const [name, setName] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('44.888.999/0001-12');
  const [segment, setSegment] = useState<CompanySegment>('Construtora & Incorporadora');
  const [cityState, setCityState] = useState<string>('Curitiba / PR');
  const [phone, setPhone] = useState<string>('(41) 3300-9988');

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddCompany({
      name: name.trim(),
      cnpj: cnpj.trim(),
      segment,
      plan: 'Parceiro B2B Homologado',
      verifiedBadge: true,
      activeProjectsCount: 1,
      membersCount: 8,
      cityState: cityState.trim(),
      phone: phone.trim()
    });

    setShowAddCompanyModal(false);
    setName('');
  };

  return (
    <div className={`border rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${cardBg}`}>
      
      {/* Multi-Tenant Active Company Switcher */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-extrabold uppercase font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
            🏢 Organização Corporativa (Empresa Active Tenant)
          </span>
        </div>

        <button
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
            isDark ? 'bg-[#121214] border-[#27272a] hover:border-cyan-500/50' : 'bg-zinc-50 border-zinc-300 hover:border-cyan-500'
          }`}
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shrink-0">
            <Building className="w-5 h-5 text-cyan-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-extrabold text-sm sm:text-base leading-tight ${textTitle}`}>
                {activeCompany.name}
              </h3>
              {activeCompany.verifiedBadge && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> CNPJ Verificado
                </span>
              )}
            </div>

            <p className={`text-[11px] font-mono flex items-center gap-1.5 mt-0.5 ${textMuted}`}>
              <span>CNPJ: {activeCompany.cnpj}</span> • <span className="text-orange-400 font-semibold">{activeCompany.segment}</span>
            </p>
          </div>

          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpenDropdown ? 'rotate-180 text-cyan-400' : textMuted}`} />
        </button>

        {/* Dropdown Menu of Companies */}
        {isOpenDropdown && (
          <div className={`absolute top-full left-0 mt-2 z-50 w-full sm:w-[460px] border rounded-3xl p-3 shadow-2xl space-y-2 backdrop-blur-md ${
            isDark ? 'bg-[#18181b]/95 border-[#27272a]' : 'bg-white/95 border-zinc-300'
          }`}>
            <div className="flex justify-between items-center px-2 py-1 border-b border-zinc-700/30">
              <span className="text-[10px] font-bold uppercase font-mono text-zinc-400">Selecione a Empresa / Organização:</span>
              <button
                onClick={() => {
                  setIsOpenDropdown(false);
                  setShowAddCompanyModal(true);
                }}
                className="text-[10px] font-bold text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Cadastrar Nova Empresa
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
              {companies.map((cmp) => {
                const isSelected = activeCompany.id === cmp.id;
                return (
                  <div
                    key={cmp.id}
                    onClick={() => {
                      onSelectCompany(cmp);
                      setIsOpenDropdown(false);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                        : isDark ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a]' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 shrink-0">
                        <Building className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className={`font-bold text-xs ${textTitle}`}>{cmp.name}</div>
                        <div className={`text-[10px] font-mono ${textMuted}`}>
                          {cmp.cnpj} • {cmp.segment}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Live Enterprise Company Stats */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
        <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${innerBg}`}>
          <span className={textMuted}>Localização:</span>
          <span className={`font-bold ${textTitle}`}>{activeCompany.cityState}</span>
        </div>

        <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${innerBg}`}>
          <span className={textMuted}>Projetos no Ecossistema:</span>
          <span className="font-extrabold text-orange-400">{activeCompany.activeProjectsCount} Obras</span>
        </div>

        <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${innerBg}`}>
          <span className={textMuted}>Plano:</span>
          <span className="font-bold text-emerald-400">{activeCompany.plan}</span>
        </div>
      </div>

      {/* REGISTER NEW COMPANY MODAL */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-cyan-400" />
                <h3 className={`font-bold text-base ${textTitle}`}>Cadastrar Empresa no Ecossistema Obra360</h3>
              </div>
              <button onClick={() => setShowAddCompanyModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Razão Social / Nome da Empresa:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Construtora Horizon S.A. ou Gerdau Suprimentos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>CNPJ Corporativo:</label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Segmento de Atuação:</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as CompanySegment)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none font-semibold ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  <option value="Construtora & Incorporadora">Construtora & Incorporadora</option>
                  <option value="Escritório de Arquitetura/Engenharia">Escritório de Arquitetura / Engenharia</option>
                  <option value="Fornecedor B2B Insumos">Fornecedor B2B de Insumos e Materiais</option>
                  <option value="Empresa de Locação de Frota">Empresa de Locação de Frota Pesada</option>
                  <option value="Imobiliária & Hub Comercial">Imobiliária & Hub Comercial</option>
                  <option value="Empresa Terceirizada">Empresa Terceirizada / Empreiteira</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Cidade / UF:</label>
                  <input
                    type="text"
                    required
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Telefone Comercial:</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none font-mono ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isDark ? 'bg-[#27272a] text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/30"
                >
                  Cadastrar Empresa Parceira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
