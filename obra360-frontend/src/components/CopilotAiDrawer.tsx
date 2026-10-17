import React, { useState } from 'react';
import { ThemeMode, RoleId } from '../types';
import { USER_ROLES } from '../data/mockData';
import { 
  Sparkles, Send, Bot, User, ShieldCheck, 
  FileText, CheckCircle2, AlertTriangle, X, HelpCircle 
} from 'lucide-react';

interface CopilotAiDrawerProps {
  theme: ThemeMode;
  currentRole: RoleId;
  onClose: () => void;
}

interface AiMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  sourceNorm?: string;
}

export const CopilotAiDrawer: React.FC<CopilotAiDrawerProps> = ({ theme, currentRole, onClose }) => {
  const isDark = theme === 'dark';
  const roleObj = USER_ROLES[currentRole];

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'AI-1',
      sender: 'ai',
      text: `Olá! Sou o Obra360 Copilot IA. Como posso ajudar com cálculos de VGV, normas técnicas NBR 15575, segurança NR-18 ou conciliação de NFe para o perfil de ${roleObj.title}?`,
      timestamp: 'Agora',
      sourceNorm: 'Base de Conhecimento Obra360'
    }
  ]);

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userMsg: AiMessage = {
      id: `USR-${Date.now()}`,
      sender: 'user',
      text: inputPrompt.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    const promptText = inputPrompt.toLowerCase();
    setInputPrompt('');

    // Generate intelligent contextual response
    setTimeout(() => {
      let aiReply = 'Entendido! Analisei sua solicitação com base nos dados do empreendimento ativo e nas diretrizes do escopo DDE.';
      let norm = 'IA Generativa Obra360';

      if (promptText.includes('nr18') || promptText.includes('nr-18') || promptText.includes('segurança')) {
        aiReply = 'Conforme a norma NR-18 (Segurança e Saúde no Trabalho na Construção), o uso de linha de vida e guarda-corpo em alturas superiores a 2,0m é obrigatório antes da concretagem da laje.';
        norm = 'Norma Regulamentadora NR-18.4.1';
      } else if (promptText.includes('nbr') || promptText.includes('garantia') || promptText.includes('pós-venda')) {
        aiReply = 'A norma ABNT NBR 15575 estabelece desempenho estrutural mínimo de 5 anos de garantia para estruturas de concreto e 2 anos para estanqueidade de vedações hidráulicas.';
        norm = 'Norma ABNT NBR 15575:2021';
      } else if (promptText.includes('estoque') || promptText.includes('nfe') || promptText.includes('cimento')) {
        aiReply = 'O estoque atual de Cimento Votoran Fck 30MPa registra 320 sacos. Recomendo autorizar a emissão da cotação RFQ no Marketplace B2B antes de atingir o limite mínimo de 100 sacos.';
        norm = 'Conciliação Automática NFe / Almoxarifado';
      }

      const aiMsg: AiMessage = {
        id: `AI-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        sourceNorm: norm
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-black/50 backdrop-blur-sm flex justify-end">
      <div className={`w-full h-full border-l p-4 sm:p-5 shadow-2xl flex flex-col justify-between ${cardBg} transition-colors`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold bg-orange-600 text-white px-2 py-0.5 rounded-md uppercase">Copilot IA</span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">✓ Gemini LLM</span>
              </div>
              <h3 className={`font-extrabold text-sm sm:text-base ${textTitle}`}>Obra360 Assistant</h3>
            </div>
          </div>

          <button onClick={onClose} className={`p-1.5 rounded-xl ${isDark ? 'hover:bg-[#27272a] text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 mb-1">
                {m.sender === 'user' ? (
                  <span>Você ({roleObj.title}) • {m.timestamp}</span>
                ) : (
                  <span className="text-orange-400 font-bold">🤖 Obra360 Copilot • {m.timestamp}</span>
                )}
              </div>

              <div className={`p-3.5 rounded-2xl max-w-[90%] text-xs leading-relaxed border ${
                m.sender === 'user'
                  ? 'bg-orange-600 text-white border-orange-500 font-medium rounded-tr-none'
                  : isDark ? 'bg-[#121214] text-zinc-100 border-[#27272a] rounded-tl-none' : 'bg-zinc-100 text-zinc-900 border-zinc-200 rounded-tl-none'
              }`}>
                {m.sourceNorm && (
                  <span className="block text-[9px] font-mono font-bold bg-black/20 text-orange-200 px-2 py-0.5 rounded mb-1.5 w-fit">
                    📚 {m.sourceNorm}
                  </span>
                )}
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[10px] font-mono">
          <button
            onClick={() => setInputPrompt('Quais as exgências da NR-18 para pilares?')}
            className={`px-2.5 py-1 rounded-xl border whitespace-nowrap transition ${
              isDark ? 'bg-[#121214] border-[#27272a] text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}
          >
            🛡️ Normas NR-18
          </button>
          <button
            onClick={() => setInputPrompt('Qual a garantia da NBR 15575 para estanqueidade?')}
            className={`px-2.5 py-1 rounded-xl border whitespace-nowrap transition ${
              isDark ? 'bg-[#121214] border-[#27272a] text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}
          >
            🏠 Garantia NBR 15575
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendPrompt} className="flex items-center gap-2 pt-2 border-t border-zinc-700/30">
          <input
            type="text"
            placeholder="Pergunte sobre NBR 15575, NR-18 ou cotações..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className={`flex-1 text-xs p-3 rounded-2xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
              isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
            }`}
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
