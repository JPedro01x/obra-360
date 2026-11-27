import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, ExternalLink, RefreshCw, X } from 'lucide-react';
import { requestApi } from '../services/http';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';

type StepKey = 'responsaveis' | 'equipe' | 'materiais' | 'cronograma' | 'planta2d' | 'cliente';
type Step = { etapa: StepKey; status: 'PENDENTE' | 'CONCLUIDA' | 'NAO_SE_APLICA'; quantidade: number; motivoDispensa?: string };
type Summary = { etapas: Step[] };
type SetupOptions = { funcionarios: { id: number; nome: string; equipeId: number }[]; equipes: { id: number; nome: string }[] };
const labels: Record<StepKey, string> = {
  responsaveis: 'Responsáveis e funcionários', equipe: 'Equipe da obra', materiais: 'Materiais',
  cronograma: 'Prazo e cronograma', planta2d: 'Planta 2D', cliente: 'Cliente e acesso à unidade',
};
const destinations: Partial<Record<StepKey, string>> = {
  equipe: 'equipes', materiais: 'estoque', cronograma: 'cronograma', cliente: 'unidades',
};
const waivableSteps: StepKey[] = ['materiais', 'planta2d', 'cliente'];

export function ProjectSetupWizard({ projectId, role, onClose, onNavigate, onOpenModeler, onChanged }: {
  projectId: number; role: string; onClose: () => void; onNavigate: (page: string) => void;
  onOpenModeler: (projectId: number, modelId: number) => void; onChanged: () => void;
}) {
  const workspaceRevision = useWorkspaceRefresh();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<SetupOptions | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [reason, setReason] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [waiverStep, setWaiverStep] = useState<StepKey | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [savingWaiver, setSavingWaiver] = useState(false);
  const canManage = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO', 'INCORPORADOR'].includes(role);
  const [openingModel, setOpeningModel] = useState(false);
  const canManageTeam = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO', 'MESTRE_OBRA'].includes(role);
  const canManageMaterials = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO', 'ALMOXARIFE'].includes(role);
  const canManageSchedule = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO'].includes(role);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setSummary(await requestApi<Summary>(`/v1/workspace/projetos/${projectId}/configuracao`)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [projectId, workspaceRevision]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!canManage) return;
    requestApi<SetupOptions>(`/v1/workspace/projetos/${projectId}/configuracao/opcoes`).then(setOptions).catch((e) => setError((e as Error).message));
  }, [canManage, projectId, workspaceRevision]);
  const saveAssignments = async () => {
    if (!selectedEmployees.length || reason.trim().length < 5) return;
    setSavingAssignment(true); setError('');
    try {
      await requestApi(`/v1/workspace/projetos/${projectId}/responsaveis`, { method: 'PUT', body: JSON.stringify({ equipeId: selectedTeam ? Number(selectedTeam) : null, funcionarios: selectedEmployees.map((funcionarioId) => ({ funcionarioId })), motivo: reason.trim() }) });
      setSelectedEmployees([]); setReason(''); await load();
      const updated = await requestApi<SetupOptions>(`/v1/workspace/projetos/${projectId}/configuracao/opcoes`); setOptions(updated); onChanged();
    } catch (e) { setError((e as Error).message); }
    finally { setSavingAssignment(false); }
  };
  const saveWaiver = async (step: StepKey) => {
    if (waiverReason.trim().length < 5) return;
    setSavingWaiver(true); setError('');
    try {
      await requestApi(`/v1/workspace/projetos/${projectId}/configuracao/${step}/dispensa`, { method: 'PUT', body: JSON.stringify({ justificativa: waiverReason.trim() }) });
      setWaiverStep(null); setWaiverReason(''); await load(); onChanged();
    } catch (e) { setError((e as Error).message); }
    finally { setSavingWaiver(false); }
  };
  const statusText = (step: Step) => step.status === 'CONCLUIDA' ? `Concluída · ${step.quantidade} registro(s)` : step.status === 'NAO_SE_APLICA' ? `Não se aplica · ${step.motivoDispensa}` : 'Pendente';
  const mayOpenModule = (step: StepKey) => step === 'equipe' ? canManageTeam : step === 'materiais' ? canManageMaterials : step === 'cronograma' ? canManageSchedule : canManage;
  const openModeler = async () => {
    setOpeningModel(true); setError('');
    try {
      const list = await requestApi<{ items: { id: number }[] }>(`/v1/workspace/modelador/modelos?projetoObraId=${projectId}&page=0&size=25`);
      const model = list.items[0] ?? await requestApi<{ id: number }>('/v1/workspace/modelador/modelos', { method: 'POST', body: JSON.stringify({ projetoObraId: projectId, nome: `Planta da obra ${projectId}` }) });
      onOpenModeler(projectId, model.id);
    } catch (e) { setError((e as Error).message); }
    finally { setOpeningModel(false); }
  };
  return <div className="ws-modal-backdrop ws-setup-backdrop">
    <section className="ws-modal ws-setup-modal" role="dialog" aria-modal="true" aria-labelledby="project-setup-title">
      <header><div><p className="ws-eyebrow">CONFIGURAÇÃO DA OBRA</p><h2 id="project-setup-title">Complete os vínculos operacionais</h2><p>As etapas podem ser concluídas agora ou retomadas depois. Cada alteração é salva no sistema.</p></div><button className="ws-icon-button" onClick={onClose} aria-label="Fechar configuração"><X size={18}/></button></header>
      {error && <div className="ws-alert" role="alert">{error}<button onClick={() => void load()}>Tentar novamente</button></div>}
      {loading && !summary ? <div className="ws-empty" role="status"><RefreshCw className="ws-spin"/>Consultando configurações salvas…</div> : <div className="ws-setup-steps">
        {(summary?.etapas ?? []).map((step) => <article className="ws-setup-step" key={step.etapa}>
          <div className="ws-setup-state">{step.status === 'CONCLUIDA' ? <CheckCircle2 aria-label="Concluída"/> : <Circle aria-label={step.status === 'NAO_SE_APLICA' ? 'Não se aplica' : 'Pendente'}/>}</div>
          <div className="ws-setup-copy"><strong>{labels[step.etapa]}</strong><span>{statusText(step)}</span></div>
          {step.etapa === 'planta2d' && canManage ? <button className="ws-secondary" disabled={openingModel} onClick={() => void openModeler()}>{openingModel ? 'Abrindo…' : 'Abrir modelador'} <ExternalLink size={14}/></button> : step.etapa === 'cliente' && role === 'SUPER_ADMIN' ? <><button className="ws-secondary" onClick={() => onNavigate('unidades')}>Unidades <ExternalLink size={14}/></button><button className="ws-secondary" onClick={() => onNavigate('acessos')}>Conceder acesso <ExternalLink size={14}/></button></> : destinations[step.etapa] && mayOpenModule(step.etapa) ? <button className="ws-secondary" onClick={() => onNavigate(destinations[step.etapa]!)}>Abrir módulo <ExternalLink size={14}/></button> : step.etapa === 'responsaveis' ? <span className="ws-help">O engenheiro responsável já consta no cadastro. Faça novos vínculos pelo RH ou pelo formulário abaixo.</span> : <span className="ws-help">Conclua com o perfil autorizado</span>}
          {step.etapa === 'responsaveis' && canManage && <div className="ws-setup-assignment">
            {options?.funcionarios.length ? <>
              <label>Funcionários ativos desta empresa<select multiple size={Math.min(5, options.funcionarios.length)} value={selectedEmployees.map(String)} onChange={(event) => setSelectedEmployees(Array.from(event.currentTarget.selectedOptions, (option) => Number(option.value)))}>{options.funcionarios.map((employee) => <option key={employee.id} value={employee.id}>{employee.nome}</option>)}</select></label>
              <label>Equipe<select value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)}><option value="">Sem equipe definida</option>{options.equipes.map((team) => <option key={team.id} value={team.id}>{team.nome}</option>)}</select></label>
              <label>Motivo do vínculo RH<input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: alocação inicial da obra" /></label>
              <button className="ws-secondary" disabled={savingAssignment || !selectedEmployees.length || reason.trim().length < 5} onClick={() => void saveAssignments()}>{savingAssignment ? 'Salvando…' : 'Vincular funcionários'}</button>
            </> : <span className="ws-help">Cadastre funcionários no RH; apenas nomes e IDs necessários à alocação são consultados.</span>}
          </div>}
          {step.status === 'PENDENTE' && waivableSteps.includes(step.etapa) && (step.etapa === 'cliente' ? role === 'SUPER_ADMIN' : canManage) && <div className="ws-setup-waiver">
            {waiverStep === step.etapa ? <><label>Justificativa<input value={waiverReason} maxLength={300} onChange={(event) => setWaiverReason(event.target.value)} placeholder="Explique por que a etapa não se aplica" /></label><button className="ws-secondary" disabled={savingWaiver || waiverReason.trim().length < 5} onClick={() => void saveWaiver(step.etapa)}>{savingWaiver ? 'Salvando…' : 'Confirmar dispensa'}</button><button className="ws-secondary" onClick={() => { setWaiverStep(null); setWaiverReason(''); }}>Cancelar</button></> : <button className="ws-secondary" onClick={() => setWaiverStep(step.etapa)}>Marcar como não aplicável</button>}
          </div>}
        </article>)}
        {!summary?.etapas?.length && !loading && <p>Não foi possível carregar as etapas desta obra.</p>}
      </div>}
      <footer className="ws-setup-footer"><span>O estoque começa sem saldo; registre recebimentos no fluxo de movimentação.</span><div><button className="ws-secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={16}/> Atualizar</button><button className="ws-primary" onClick={() => { onChanged(); onClose(); }}>Concluir depois</button></div></footer>
    </section>
  </div>;
}
