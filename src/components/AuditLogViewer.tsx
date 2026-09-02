import React, { useState } from 'react';
import { AuditLog, RoleId, ThemeMode } from '../types';
import { USER_ROLES } from '../data/mockData';
import { downloadCsvFile } from '../utils/reportExporter';
import { 
  History, ShieldCheck, Database, Filter, 
  Terminal, ArrowRight, User, Key, Lock, ShieldAlert, Download 
} from 'lucide-react';

interface AuditLogViewerProps {
  auditLogs: AuditLog[];
  currentRole: RoleId;
  theme: ThemeMode;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ auditLogs, currentRole, theme }) => {
  const isDark = theme === 'dark';

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterEntity, setFilterEntity] = useState<string>('ALL');

  const userPermissions = USER_ROLES[currentRole]?.permissions || [];
  
  // Strict RBAC Guard: Only Super Admin & Auditor Interno can view Audit Logs
  const canViewAudit = 
    userPermissions.includes('all') || 
    userPermissions.includes('audit_logs.consultar') ||
    ['SUPER_ADMIN', 'AUDITOR'].includes(currentRole);

  const filteredLogs = auditLogs.filter((log) => 
    filterEntity === 'ALL' || log.entity === filterEntity
  );

  const handleExportCsv = () => {
    const headers = ['ID', 'DataHora', 'Usuario', 'Papel', 'IP', 'Acao', 'Entidade', 'IDEntidade'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.user,
      l.role,
      l.ip,
      l.action,
      l.entity,
      l.entityId
    ]);
    downloadCsvFile(`Audit_Logs_Obra360_${Date.now()}`, headers, rows);
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  if (!canViewAudit) {
    return (
      <div className={`border rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors ${
        isDark ? 'bg-[#18181b] border-[#27272a] text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
      }`}>
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base sm:text-lg">Acesso Negado à Trilha de Auditoria (MongoDB)</h3>
        <p className="text-xs text-zinc-400 max-w-md">
          O perfil de <strong>{USER_ROLES[currentRole].title}</strong> não possui privilégios de auditoria de segurança (`audit_logs.consultar`). Alterne para <strong>Super Administrador</strong> ou <strong>Auditor Interno de Riscos</strong> no topo da página.
        </p>
      </div>
    );
  }

  return (
    <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4 sm:gap-6 transition-colors`}>
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
        isDark ? 'border-[#27272a]' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-rose-500 shrink-0" />
            <h2 className={`font-extrabold text-base sm:text-lg ${textTitle}`}>Trilha de Auditoria & Compliance (ISO 9001)</h2>
          </div>
          <p className={`text-xs ${textMuted}`}>Rastreabilidade completa: Quem alterou, IP, valor antigo e valor novo</p>
        </div>

        {/* Filter Dropdown & Export CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-2xl shadow-md transition"
          >
            <Download className="w-4 h-4" /> Exportar Excel (.csv)
          </button>

          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${textMuted}`} />
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
              }`}
            >
              <option value="ALL">Todas Entidades</option>
              <option value="Stage">Etapas (Stage)</option>
              <option value="StockItem">Almoxarifado (StockItem)</option>
              <option value="UserRole">Usuários (UserRole)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className={`border-b text-[11px] font-bold ${
              isDark ? 'border-[#27272a] text-zinc-400 bg-[#121214]' : 'border-zinc-200 text-zinc-600 bg-zinc-100'
            }`}>
              <th className="p-3">LOG ID</th>
              <th className="p-3">Data / Hora</th>
              <th className="p-3">Usuário & IP</th>
              <th className="p-3">Ação</th>
              <th className="p-3">Entidade</th>
              <th className="p-3 text-right">Detalhes</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#27272a]' : 'divide-zinc-200'}`}>
            {filteredLogs.map((log) => (
              <tr key={log.id} className={`transition ${isDark ? 'hover:bg-[#27272a]/50' : 'hover:bg-zinc-50'}`}>
                <td className="p-3 font-bold text-orange-500">{log.id}</td>
                <td className={`p-3 ${textMuted}`}>{log.timestamp}</td>
                <td className="p-3">
                  <div className={`font-bold ${textTitle}`}>{log.user}</div>
                  <div className={`text-[10px] ${textMuted}`}>{log.role} • IP: {log.ip}</div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {log.action}
                  </span>
                </td>
                <td className={`p-3 font-semibold ${textTitle}`}>{log.entity} ({log.entityId})</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="px-2.5 py-1 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-[10px] font-bold border border-orange-500/30 transition"
                  >
                    Ver Payload JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-orange-500" />
                <h3 className={`font-bold text-base ${textTitle}`}>Inspeção de Payload Imutável ({selectedLog.id})</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block mb-1 font-bold">Valor Anterior (Old State):</span>
                <pre className={`p-3 rounded-2xl border overflow-x-auto text-[11px] ${innerBg} text-rose-400 border-rose-500/30`}>
                  {JSON.stringify(selectedLog.oldValue, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-zinc-500 block mb-1 font-bold">Novo Valor Registrado (New State):</span>
                <pre className={`p-3 rounded-2xl border overflow-x-auto text-[11px] ${innerBg} text-emerald-400 border-emerald-500/30`}>
                  {JSON.stringify(selectedLog.newValue, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-600/30"
              >
                Fechar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
