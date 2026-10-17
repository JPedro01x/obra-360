import React, { useState } from 'react';
import { RoleId, UserRole, HierarchyLevel, ThemeMode, RegisteredAccount } from '../types';
import { USER_ROLES } from '../data/mockData';
import { 
  KeyRound, ShieldCheck, CheckCircle2, XCircle, Lock, 
  UserCheck, Layers, Award, ShieldAlert, ChevronRight, Search, UserPlus, Mail, User 
} from 'lucide-react';

interface RbacMatrixViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  registeredAccounts: RegisteredAccount[];
  onRegisterAccount: (acc: Omit<RegisteredAccount, 'id' | 'createdAt' | 'createdBy' | 'status'>) => void;
}

export const RbacMatrixView: React.FC<RbacMatrixViewProps> = ({
  currentRole,
  theme,
  registeredAccounts,
  onRegisterAccount
}) => {
  const isDark = theme === 'dark';
  const [selectedRole, setSelectedRole] = useState<RoleId>(currentRole);
  const [showHireModal, setShowHireModal] = useState<boolean>(false);

  // Hire Form State
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<RoleId>('ENGENHEIRO');

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  // Strict RBAC Guard: Access to IAM Governance Matrix
  const canManageRbac = ['SUPER_ADMIN', 'GERENTE_OBRA', 'AUDITOR'].includes(currentRole);

  // Authorized to hire/create users: Super Admin and Gerente de Obras
  const canHireUsers = ['SUPER_ADMIN', 'GERENTE_OBRA'].includes(currentRole);

  if (!canManageRbac) {
    return (
      <div className={`border rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors ${
        isDark ? 'bg-[#18181b] border-[#27272a] text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
      }`}>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base sm:text-lg">Acesso Restrito à Governança de Permissões (IAM)</h3>
        <p className="text-xs text-zinc-400 max-w-md">
          O perfil de <strong>{USER_ROLES[currentRole].title}</strong> não possui privilégios para visualizar a matriz geral de permissões do sistema. Alterne para <strong>Super Administrador</strong>, <strong>Gerente Geral de Obras</strong> ou <strong>Auditor Interno de Riscos</strong> no topo da página.
        </p>
      </div>
    );
  }

  const roleObj = USER_ROLES[selectedRole];

  const levelsList: HierarchyLevel[] = [
    'Nível 1 - Gestão Estratégica',
    'Nível 2 - Engenharia & Operação',
    'Nível 3 - Execução & Logística',
    'Nível 4 - Transparência & Auditoria'
  ];

  const allPermissionsList = [
    { key: 'user.manage', label: 'Gestão de Usuários & Perfis RBAC', category: 'IAM & Governança' },
    { key: 'obra.criar', label: 'Criar / Excluir Projetos de Obra', category: 'Gestão de Obras' },
    { key: 'etapa.atualizar', label: 'Atualizar Medição & Progresso das Etapas', category: 'Engenharia & 3D' },
    { key: 'modelo3d.editar', label: 'Editar Geometria e Objetos no 3D BIM', category: 'Engenharia & 3D' },
    { key: 'diario.criar', label: 'Preencher Diário de Obra (Fotos/Clima)', category: 'Campo' },
    { key: 'estoque.entrada', label: 'Registrar Entrada de Notas Fiscais (NFe)', category: 'Logística' },
    { key: 'estoque.saida', label: 'Registrar Saída de Materiais para Obra', category: 'Logística' },
    { key: 'financeiro.aprovar', label: 'Aprovar Pagamentos e Fluxo de Caixa', category: 'Financeiro' },
    { key: 'audit_logs.consultar', label: 'Consultar Trilha de Auditoria (MongoDB)', category: 'Auditoria' },
    { key: 'portal_cliente.acessar', label: 'Acessar Portal Transparente do Cliente', category: 'Cliente' },
  ];

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    onRegisterAccount({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole
    });

    setNewName('');
    setNewEmail('');
    setShowHireModal(false);
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${cardBg}`}>
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 shrink-0" />
            <h2 className={`font-extrabold text-lg sm:text-xl ${textTitle}`}>Matriz de Governança & Permissões IAM (RBAC)</h2>
          </div>
          <p className={`text-xs mt-1 ${textMuted}`}>
            Segregação de funções e contratação de novos usuários pelo Gerente Geral de Obras e TI
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canHireUsers ? (
            <button
              onClick={() => setShowHireModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
            >
              <UserPlus className="w-4 h-4" /> + Cadastrar Usuário
            </button>
          ) : (
            <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-2xl border border-orange-500/20">
              Seu Perfil Atual: <strong>{USER_ROLES[currentRole].title}</strong>
            </span>
          )}
        </div>
      </div>

      {/* SECTION: Registered Accounts Table */}
      <div className={`border rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 ${cardBg}`}>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
          isDark ? 'border-[#27272a]' : 'border-zinc-200'
        }`}>
          <div>
            <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Contas & Usuários Autorizados ({registeredAccounts.length})</h3>
            <p className={`text-xs ${textMuted}`}>Usuários contratados que possuem permissão de login no sistema</p>
          </div>

          <span className="text-[10px] sm:text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 w-fit">
            ● Somente Contas Nesta Lista Podem Logar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className={`uppercase font-mono border-b text-[10px] ${
              isDark ? 'bg-[#121214] text-zinc-400 border-[#27272a]' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              <tr>
                <th className="p-3">Usuário / Nome</th>
                <th className="p-3">E-mail de Acesso</th>
                <th className="p-3">Cargo RBAC & Nível</th>
                <th className="p-3">Cadastrado Por</th>
                <th className="p-3 text-right">Status Conta</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium text-[11px] ${
              isDark ? 'divide-[#27272a]/60 text-zinc-300' : 'divide-zinc-200 text-zinc-700'
            }`}>
              {registeredAccounts.map((acc) => {
                const roleInformation = USER_ROLES[acc.role];
                return (
                  <tr key={acc.id} className={isDark ? 'hover:bg-[#121214]/50' : 'hover:bg-zinc-50'}>
                    <td className="p-3">
                      <div className={`font-bold ${textTitle}`}>{acc.name}</div>
                      <span className="text-[10px] font-mono text-zinc-400">ID: {acc.id}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-orange-500">{acc.email}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInformation?.badgeColor}`}>
                        {roleInformation?.title}
                      </span>
                    </td>
                    <td className={`p-3 text-[11px] ${textMuted}`}>{acc.createdBy}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                        ✓ Ativo (Pode Logar)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Hierarchy Levels Cards + Selected Role Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Col (2 cols): Roles Grouped by Hierarchy Levels */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Níveis Hierárquicos & Cargos</h3>
            <span className={`text-xs ${textMuted}`}>8 Perfis Registrados</span>
          </div>

          <div className="space-y-4">
            {levelsList.map((levelName, levelIdx) => {
              const rolesInLevel = Object.values(USER_ROLES).filter((r) => r.level === levelName);
              if (rolesInLevel.length === 0) return null;

              return (
                <div key={levelIdx} className={`border rounded-2xl p-4 shadow-sm space-y-3 transition-colors ${cardBg}`}>
                  <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-orange-500" />
                      <h4 className={`font-bold text-xs ${textTitle}`}>{levelName}</h4>
                    </div>
                    <span className={`text-[11px] font-mono ${textMuted}`}>{rolesInLevel.length} Cargos</span>
                  </div>

                  {/* Role Cards in this Level */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                    {rolesInLevel.map((role) => {
                      const isSelected = selectedRole === role.id;
                      const isUserActiveRole = currentRole === role.id;

                      return (
                        <div
                          key={role.id}
                          onClick={() => setSelectedRole(role.id as RoleId)}
                          className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-orange-950/40 border-orange-500 ring-2 ring-orange-500/50 shadow-md'
                              : isDark ? 'bg-[#121214] border-[#27272a] hover:border-[#3f3f46]' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${role.badgeColor}`}>
                                {role.department}
                              </span>
                              {isUserActiveRole && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                  ● Ativo
                                </span>
                              )}
                            </div>
                            <h5 className={`font-bold text-xs pt-1 ${textTitle}`}>{role.title}</h5>
                            <p className={`text-[11px] line-clamp-2 ${textMuted}`}>{role.description}</p>
                          </div>

                          <div className="pt-2 flex justify-between items-center text-[10px] font-semibold text-orange-500">
                            <span>{role.permissions.includes('all') ? 'Permissão Total' : `${role.permissions.length} Permissões`}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col (1 col): Role Inspector Details & Permissions Token */}
        <div className={`border rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 space-y-2 h-fit ${cardBg}`}>
          <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0" />
              <h3 className={`font-bold text-xs sm:text-sm ${textTitle}`}>Inspeção de Permissões</h3>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${roleObj.badgeColor}`}>
              {roleObj.id}
            </span>
          </div>

          <div className="space-y-2">
            <h4 className={`font-extrabold text-sm sm:text-base ${textTitle}`}>{roleObj.title}</h4>
            <p className={`text-xs ${textMuted}`}>{roleObj.description}</p>

            <div className={`p-3 rounded-2xl border text-xs space-y-1 ${innerBg}`}>
              <p className={textMuted}><strong>Nível Hierárquico:</strong> <span className={textTitle}>{roleObj.level}</span></p>
              <p className={textMuted}><strong>Departamento:</strong> <span className={textTitle}>{roleObj.department}</span></p>
            </div>
          </div>

          {/* Granular Permission Token Checks */}
          <div className="space-y-2 pt-1">
            <h4 className={`font-bold text-xs flex items-center gap-1.5 ${textTitle}`}>
              <Layers className="w-4 h-4 text-orange-500" /> Permissões Concedidas:
            </h4>

            <div className="space-y-1.5 max-h-[280px] sm:max-h-[320px] overflow-y-auto pr-1">
              {allPermissionsList.map((perm) => {
                const hasPerm = roleObj.permissions.includes('all') || roleObj.permissions.includes(perm.key);

                return (
                  <div
                    key={perm.key}
                    className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                      hasPerm
                        ? isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isDark ? 'bg-[#121214]/50 border-[#27272a]/60 text-zinc-500 opacity-60' : 'bg-zinc-100 border-zinc-200 text-zinc-400 opacity-60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        {hasPerm ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />}
                        <span>{perm.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 pl-5">{perm.key}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Cross-Reference Matrix Table for All Roles */}
      <div className={`border rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 ${cardBg}`}>
        <div className={`border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
          <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Matriz Geral de Controle de Acesso (RBAC Cross-Reference)</h3>
          <p className={`text-xs ${textMuted}`}>Mapeamento completo de módulos x cargos e privilégios</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className={`uppercase font-mono border-b text-[10px] ${
              isDark ? 'bg-[#121214] text-zinc-400 border-[#27272a]' : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              <tr>
                <th className="p-3">Módulo / Permissão</th>
                {Object.values(USER_ROLES).map((role) => (
                  <th key={role.id} className="p-3 text-center min-w-[90px]">{role.title.split(' ')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y font-medium text-[11px] ${
              isDark ? 'divide-[#27272a]/60 text-zinc-300' : 'divide-zinc-200 text-zinc-700'
            }`}>
              {allPermissionsList.map((perm) => (
                <tr key={perm.key} className={isDark ? 'hover:bg-[#121214]/50' : 'hover:bg-zinc-50'}>
                  <td className="p-3">
                    <div className={`font-bold ${textTitle}`}>{perm.label}</div>
                    <span className="text-[10px] font-mono text-orange-500">{perm.key}</span>
                  </td>
                  {Object.values(USER_ROLES).map((role) => {
                    const hasPerm = role.permissions.includes('all') || role.permissions.includes(perm.key);
                    return (
                      <td key={role.id} className="p-3 text-center">
                        {hasPerm ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-500/10 text-zinc-500 text-xs">
                            -
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HIRE / REGISTER USER MODAL */}
      {showHireModal && canHireUsers && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 ${cardBg}`}>
            
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" />
                <h3 className={`font-bold text-base ${textTitle}`}>Contratar / Cadastrar Novo Acesso</h3>
              </div>
              <button onClick={() => setShowHireModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>
                ✕
              </button>
            </div>

            <form onSubmit={handleHireSubmit} className="space-y-4 text-xs">
              <div>
                <label className={`block mb-1.5 font-semibold ${textMuted}`}>Nome Completo do Colaborador ou Cliente:</label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3 top-3 ${textMuted}`} />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fernando Souza (Novo Engenheiro)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold ${textMuted}`}>E-mail de Acesso (Corporativo ou Gmail):</label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-3 ${textMuted}`} />
                  <input
                    type="email"
                    required
                    placeholder="fernando@obra360.com ou cliente@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1.5 font-semibold ${textMuted}`}>Atribuir Cargo RBAC & Nível:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleId)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none font-semibold ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  {Object.values(USER_ROLES).map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({role.level.split(' - ')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div className={`p-3 rounded-2xl border text-[11px] ${innerBg}`}>
                <p className={textMuted}>
                  Ao cadastrar, esta conta ficará ativa imediatamente e poderá logar no sistema com permissões de <strong>{USER_ROLES[newRole].title}</strong>.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHireModal(false)}
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
                  Confirmar Cadastro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
