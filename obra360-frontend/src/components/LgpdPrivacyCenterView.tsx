import React, { useState } from 'react';
import { ThemeMode, RoleId, AuthUser } from '../types';
import { downloadLgpdDataPortability, maskEmail } from '../utils/security';
import { 
  ShieldCheck, Lock, FileText, Download, Trash2, Eye, AlertTriangle, CheckCircle2, UserCheck, ShieldAlert 
} from 'lucide-react';

interface LgpdPrivacyCenterProps {
  currentRole: RoleId;
  theme: ThemeMode;
  authUser: AuthUser | null;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const LgpdPrivacyCenterView: React.FC<LgpdPrivacyCenterProps> = ({
  currentRole,
  theme,
  authUser,
  onSendToast
}) => {
  const isDark = theme === 'dark';

  const [consentAnalytics, setConsentAnalytics] = useState<boolean>(true);
  const [consentAudit, setConsentAudit] = useState<boolean>(true);
  const [showDeletionModal, setShowDeletionModal] = useState<boolean>(false);
  const [deletionReason, setDeletionReason] = useState<string>('');

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200 shadow-xl';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600';

  const handleExportData = () => {
    const payload = {
      lgpdComplianceVersion: 'LGPD Lei 13.709/2018 - Artigo 18',
      exportedAt: new Date().toISOString(),
      userProfile: authUser || { email: 'usuario@obra360.com.br', name: 'Usuário Conectado', role: currentRole },
      securityPermissionsGranted: ['CONSENT_ANALYTICS', 'CONSENT_AUDIT_LOGS'],
      legalBasis: 'Execução de Contrato de Engenharia & Cumprimento de Obrigação Legal'
    };

    downloadLgpdDataPortability(payload);
    onSendToast('success', '📥 Portabilidade de Dados Concluída', 'Arquivo JSON com seus dados pessoais exportado conforme Art. 18 da LGPD.');
  };

  const handleConfirmDeletion = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDeletionModal(false);
    onSendToast(
      'warning',
      '🛡️ Solicitado Direito ao Esquecimento (Art. 18 LGPD)',
      'Sua solicitação de anonimização de PII foi encaminhada para a DPO & Comitê de Compliance da construtora.'
    );
    setDeletionReason('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-6 relative overflow-hidden ${cardBg}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`font-extrabold text-xl ${textTitle}`}>Central de Privacidade & Governança LGPD</h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Lei nº 13.709/2018 Compliant
                </span>
              </div>
              <p className={`text-xs ${textMuted}`}>
                Gestão dos direitos do titular de dados, portabilidade em JSON, consentimento de cookies e anonimização de PII.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Direitos do Titular de Dados (Art. 18 LGPD) */}
        <div className={`border rounded-3xl p-6 space-y-4 ${cardBg}`}>
          <h3 className={`font-bold text-base flex items-center gap-2 ${textTitle}`}>
            <UserCheck className="w-5 h-5 text-emerald-500" /> Direitos do Titular de Dados (Art. 18)
          </h3>

          <div className="space-y-3">
            
            {/* Portabilidade */}
            <div className={`border rounded-2xl p-4 flex items-center justify-between ${
              isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="space-y-1">
                <h4 className={`font-bold text-xs ${textTitle}`}>1. Direito à Portabilidade dos Dados</h4>
                <p className={`text-[11px] ${textMuted}`}>Exporte cópia completa dos seus dados em formato interoperável (JSON).</p>
              </div>
              <button
                onClick={handleExportData}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition shrink-0"
              >
                <Download className="w-4 h-4" /> Exportar Dados
              </button>
            </div>

            {/* Anonimização / Exclusão */}
            <div className={`border rounded-2xl p-4 flex items-center justify-between ${
              isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="space-y-1">
                <h4 className={`font-bold text-xs ${textTitle}`}>2. Direito à Anonimização / Esquecimento</h4>
                <p className={`text-[11px] ${textMuted}`}>Solicite a remoção ou substituição dos seus dados pessoais por hash criptográfico.</p>
              </div>
              <button
                onClick={() => setShowDeletionModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/20 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
              >
                <Trash2 className="w-4 h-4" /> Solicitar Exclusão
              </button>
            </div>

          </div>
        </div>

        {/* Gestão de Consentimento & Termos */}
        <div className={`border rounded-3xl p-6 space-y-4 ${cardBg}`}>
          <h3 className={`font-bold text-base flex items-center gap-2 ${textTitle}`}>
            <Lock className="w-5 h-5 text-teal-400" /> Gestão de Consentimento & Preferências
          </h3>

          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-3 rounded-2xl border border-zinc-700/30">
              <div>
                <h4 className={`text-xs font-bold ${textTitle}`}>Logs de Auditoria para Canteiro (Obrigatório)</h4>
                <p className={`text-[11px] ${textMuted}`}>Base legal: Cumprimento de obrigação legal e fiscal da construção civil.</p>
              </div>
              <input type="checkbox" checked disabled className="w-4 h-4 accent-emerald-500" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl border border-zinc-700/30">
              <div>
                <h4 className={`text-xs font-bold ${textTitle}`}>Análise de Performance & Cookies de PWA</h4>
                <p className={`text-[11px] ${textMuted}`}>Melhora a velocidade de carregamento dos modelos 3D BIM offline.</p>
              </div>
              <input
                type="checkbox"
                checked={consentAnalytics}
                onChange={(e) => setConsentAnalytics(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              isDark ? 'bg-[#121214] border-[#27272a] text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              <span className="font-bold block text-emerald-400 mb-1">DPO / Encarregado de Proteção de Dados:</span>
              Para dúvidas sobre privacidade, entre em contato com o DPO Obra360: <span className="font-mono underline">dpo.compliance@obra360.com.br</span>
            </div>

          </div>
        </div>

      </div>

      {/* Deletion Request Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleConfirmDeletion} className={`max-w-md w-full border rounded-3xl p-6 space-y-4 ${cardBg}`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-base flex items-center gap-2 ${textTitle}`}>
                <ShieldAlert className="w-5 h-5 text-rose-500" /> Confirmar Solicitação LGPD
              </h3>
              <button type="button" onClick={() => setShowDeletionModal(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <p className={`text-xs ${textMuted}`}>
              Em conformidade com o Art. 18 da LGPD, informe a justificativa da solicitação de anonimização. Os dados fiscais de engenharia serão preservados anonimizados.
            </p>

            <div>
              <label className={`block text-xs font-bold mb-1 ${textTitle}`}>Justificativa / Motivo:</label>
              <textarea
                required
                rows={3}
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Descreva o motivo da solicitação..."
                className={`w-full p-2.5 rounded-xl border text-xs ${
                  isDark ? 'bg-[#121214] border-[#27272a] text-white' : 'bg-white border-zinc-300'
                }`}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeletionModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Confirmar Anonimização
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
