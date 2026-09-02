import React, { useState } from 'react';
import { Project, ProjectType, ThemeMode } from '../types';
import { 
  Building2, Building, Activity, Warehouse, Route, Sun, 
  MapPin, Calendar, DollarSign, Users, ChevronDown, Check, Plus, Sparkles 
} from 'lucide-react';

interface ProjectSelectorHeaderProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (proj: Project) => void;
  onAddProject: (newProj: Omit<Project, 'id'>) => void;
  theme: ThemeMode;
}

export const ProjectSelectorHeader: React.FC<ProjectSelectorHeaderProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onAddProject,
  theme
}) => {
  const isDark = theme === 'dark';
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Project Form State
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<ProjectType>('Prédios & Edifícios');
  const [location, setLocation] = useState<string>('Av. Brigadeiro Faria Lima, 2000 - São Paulo/SP');
  const [clientOrOwner, setClientOrOwner] = useState<string>('Incorporadora Faria Lima LTDA');
  const [budget, setBudget] = useState<number>(15000000);
  const [vgv, setVgv] = useState<number>(32000000);

  const getProjectTypeIcon = (projType: ProjectType) => {
    switch (projType) {
      case 'Prédios & Edifícios': return <Building2 className="w-4 h-4 text-orange-500" />;
      case 'Hospitais & Saúde': return <Activity className="w-4 h-4 text-rose-500" />;
      case 'Galpões Logísticos': return <Warehouse className="w-4 h-4 text-amber-500" />;
      case 'Energia Solar': return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'Túneis & Subterrâneo': return <Route className="w-4 h-4 text-cyan-400" />;
      case 'Infraestrutura & Pontes': return <Building className="w-4 h-4 text-blue-400" />;
      default: return <Building2 className="w-4 h-4 text-orange-500" />;
    }
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddProject({
      name: name.trim(),
      type,
      location,
      clientOrOwner,
      responsibleEngineer: 'Eng. Carlos Residente',
      responsibleArchitect: 'Arq. Lucas Projetista',
      plannedDeadline: '25/12/2027',
      budget,
      spentBudget: budget * 0.2,
      vgv,
      status: 'PLANEJAMENTO',
      progressPercent: 15,
      unitsCount: 24,
      activeTeamsCount: 4
    });

    setShowAddModal(false);
    setName('');
  };

  return (
    <div className={`border rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${cardBg}`}>
      
      {/* Active Project Dropdown Switcher */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-extrabold uppercase font-mono text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
            ● Empreendimento Selecionado (1 de {projects.length})
          </span>
        </div>

        <button
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
            isDark ? 'bg-[#121214] border-[#27272a] hover:border-orange-500/50' : 'bg-zinc-50 border-zinc-300 hover:border-orange-500'
          }`}
        >
          <div className="p-2 rounded-xl bg-orange-600/10 border border-orange-500/20 shrink-0">
            {getProjectTypeIcon(activeProject.type)}
          </div>
          
          <div className="text-left">
            <h3 className={`font-extrabold text-sm sm:text-base leading-tight ${textTitle}`}>
              {activeProject.name}
            </h3>
            <p className={`text-[11px] font-mono flex items-center gap-1 mt-0.5 ${textMuted}`}>
              <span>{activeProject.type}</span> • <MapPin className="w-3 h-3 text-orange-500" /> 
              <span className="truncate max-w-[200px] sm:max-w-[300px]">{activeProject.location}</span>
            </p>
          </div>

          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpenDropdown ? 'rotate-180 text-orange-500' : textMuted}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpenDropdown && (
          <div className={`absolute top-full left-0 mt-2 z-50 w-full sm:w-[420px] border rounded-3xl p-3 shadow-2xl space-y-2 backdrop-blur-md ${
            isDark ? 'bg-[#18181b]/95 border-[#27272a]' : 'bg-white/95 border-zinc-300'
          }`}>
            <div className="flex justify-between items-center px-2 py-1 border-b border-zinc-700/30">
              <span className="text-[10px] font-bold uppercase font-mono text-zinc-400">Selecione o Empreendimento:</span>
              <button
                onClick={() => {
                  setIsOpenDropdown(false);
                  setShowAddModal(true);
                }}
                className="text-[10px] font-bold text-orange-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Novo Empreendimento
              </button>
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
              {projects.map((proj) => {
                const isSelected = activeProject.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj);
                      setIsOpenDropdown(false);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-600/10 border-orange-500/50 text-orange-400'
                        : isDark ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a]' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10">
                        {getProjectTypeIcon(proj.type)}
                      </div>
                      <div>
                        <div className={`font-bold text-xs ${textTitle}`}>{proj.name}</div>
                        <div className={`text-[10px] font-mono ${textMuted}`}>{proj.type} • {proj.progressPercent}% Concluído</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-orange-500 stroke-[3]" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Live Project Metrics Rollup */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${innerBg}`}>
          <span className={textMuted}>VGV Total:</span>
          <span className="font-extrabold text-emerald-400 text-sm">
            R$ {activeProject.vgv > 0 ? activeProject.vgv.toLocaleString('pt-BR') : 'N/A (Pública)'}
          </span>
        </div>

        <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${innerBg}`}>
          <span className={textMuted}>Orçamento WBS:</span>
          <span className="font-extrabold text-orange-400 text-sm">
            R$ {activeProject.budget.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className={`p-2.5 rounded-2xl border flex items-center gap-2 ${innerBg}`}>
          <span className={textMuted}>Prazo Previsto:</span>
          <span className={`font-bold ${textTitle}`}>{activeProject.plannedDeadline}</span>
        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className={`font-bold text-base ${textTitle}`}>Cadastrar Novo Empreendimento</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Nome do Empreendimento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Edifício Corporate Tower ou Usina Solar 30MW"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Tipo do Empreendimento (9 Categorias):</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProjectType)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none font-semibold ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  <option value="Prédios & Edifícios">Prédios & Edifícios Residencias/Comerciais</option>
                  <option value="Casas Residenciais">Casas Residenciais</option>
                  <option value="Condomínios Fechados">Condomínios Fechados</option>
                  <option value="Hospitais & Saúde">Hospitais & Centros de Saúde</option>
                  <option value="Galpões Logísticos">Galpões Logísticos e Industriais</option>
                  <option value="Túneis & Subterrâneo">Túneis & Obras Subterrâneas</option>
                  <option value="Energia Solar">Projetos de Energia Solar Fotovoltaica</option>
                  <option value="Infraestrutura & Pontes">Obras de Infraestrutura (Pontes e Rodovias)</option>
                  <option value="Comercial & Industrial">Empreendimentos Comerciais e Industriais</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Localização Completa:</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Orçamento WBS (R$):</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>VGV Estimado (R$):</label>
                  <input
                    type="number"
                    value={vgv}
                    onChange={(e) => setVgv(parseFloat(e.target.value) || 0)}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Cadastrar Empreendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
