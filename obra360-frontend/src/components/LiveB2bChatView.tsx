import React, { useState } from 'react';
import { RoleId, ThemeMode, Company } from '../types';
import { USER_ROLES } from '../data/mockData';
import { 
  MessageSquare, Send, Paperclip, CheckCheck, Users, 
  Building, ShieldCheck, Search, Sparkles, AlertTriangle, PhoneCall 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  companyName: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  tag?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  category: 'Geral da Obra' | 'Fornecedores B2B' | 'Projetistas BIM' | 'Atendimento Cliente';
  unreadCount: number;
  lastMessage: string;
}

interface LiveB2bChatViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  activeCompany?: Company;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const LiveB2bChatView: React.FC<LiveB2bChatViewProps> = ({
  currentRole,
  theme,
  activeCompany,
  onSendToast
}) => {
  const isDark = theme === 'dark';
  const roleObj = USER_ROLES[currentRole];

  const [activeChannelId, setActiveChannelId] = useState<string>('CHN-001');
  const [inputMessage, setInputMessage] = useState<string>('');

  const [channels] = useState<ChatChannel[]>([
    { id: 'CHN-001', name: '📢 Canal Operacional - Canteiro Residencial Jardins', category: 'Geral da Obra', unreadCount: 2, lastMessage: 'Almoxarifado: Carga de cimento liberada via NFe-884192.' },
    { id: 'CHN-002', name: '🤝 Rede B2B: Cotações Votoran & Gerdau', category: 'Fornecedores B2B', unreadCount: 0, lastMessage: 'Fornecedor: Proposta do lote de aço CA-50 atualizada.' },
    { id: 'CHN-003', name: '📐 Projetistas BIM: Compatibilização v2.4', category: 'Projetistas BIM', unreadCount: 1, lastMessage: 'Arquiteto: Ajuste nas cotas da laje aprovado.' },
    { id: 'CHN-004', name: '💬 Atendimento Proprietário (Apt 101)', category: 'Atendimento Cliente', unreadCount: 0, lastMessage: 'Engenharia: Agendada vistoria de pré-entrega.' }
  ]);

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    'CHN-001': [
      { id: 'M-1', senderName: 'Carlos Engenheiro', senderRole: 'Engenheiro Residente', companyName: 'Engenharia Jardins S.A.', content: 'Bom dia equipe! As armações dos pilares P-01 a P-08 estão finalizadas. Mestre Zé, favor preparar a concretagem Fck 30MPa.', timestamp: '08:30', isMe: currentRole === 'ENGENHEIRO' },
      { id: 'M-2', senderName: 'Zé Mestre de Obras', senderRole: 'Mestre de Obras', companyName: 'Armações & Estrutura LTDA', content: 'Certo Eng. Carlos! A equipe de armadores já conferiu a linha de vida NR-18. Tudo pronto.', timestamp: '08:42', isMe: currentRole === 'MESTRE_OBRA' },
      { id: 'M-3', senderName: 'Roberto Almoxarife', senderRole: 'Almoxarife Chefe', companyName: 'Engenharia Jardins S.A.', content: 'Confirmada a entrada de 500 sacos de cimento Votoran por Chave NFe-884192.', timestamp: '09:15', isMe: currentRole === 'ALMOXARIFE', tag: 'NFe Registrada' }
    ],
    'CHN-002': [
      { id: 'M-10', senderName: 'Votoran Fornecedor', senderRole: 'Fornecedor B2B', companyName: 'Votoran & Gerdau B2B', content: 'Olá Engenharia! A cotação RFQ-2041 foi faturada com desconto unitário de R$ 33,50/saco. Entrega agendada em 48h.', timestamp: '10:00', isMe: currentRole === 'FORNECEDOR' }
    ],
    'CHN-003': [
      { id: 'M-20', senderName: 'Lucas Arquiteto', senderRole: 'Arquiteto BIM', companyName: 'Silva Arquitetura', content: 'Subi o modelo 3D v2.4 com a revisão das sacadas gourmets. Podem conferir na Central de Projetos.', timestamp: '11:20', isMe: currentRole === 'ARQUITETO', tag: 'Modelo v2.4' }
    ],
    'CHN-004': [
      { id: 'M-30', senderName: 'João Cliente', senderRole: 'Cliente Proprietário', companyName: 'Proprietário Apt 101', content: 'Boa tarde! Gostaria de confirmar a data da vistoria de entrega do Apt 101.', timestamp: '14:05', isMe: currentRole === 'CLIENTE' }
    ]
  });

  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const activeMessages = messages[activeChannelId] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: `M-${Date.now()}`,
      senderName: roleObj.title,
      senderRole: roleObj.department,
      companyName: activeCompany ? activeCompany.name : 'Obra360 Corporativo',
      content: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages({
      ...messages,
      [activeChannelId]: [...activeMessages, newMsg]
    });

    setInputMessage('');
    onSendToast('info', 'Mensagem Transmitida', `Enviada para ${activeChannel.name}`);
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row gap-4 sm:gap-6 min-h-[560px] transition-colors`}>
      
      {/* Channels Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-3 shrink-0 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-4 border-zinc-700/30">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500 shrink-0" />
            <h3 className={`font-extrabold text-base ${textTitle}`}>Canais B2B do Ecossistema</h3>
          </div>
          <p className={`text-[11px] ${textMuted}`}>Comunicação corporativa direta e auditável</p>
        </div>

        <div className="space-y-1.5 overflow-y-auto max-h-[440px] pr-1">
          {channels.map((chn) => {
            const isSelected = chn.id === activeChannelId;
            return (
              <div
                key={chn.id}
                onClick={() => setActiveChannelId(chn.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-orange-600/10 border-orange-500/50 text-orange-400'
                    : isDark ? 'bg-[#121214] border-[#27272a] hover:bg-[#27272a]' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-bold text-xs ${textTitle}`}>{chn.name}</span>
                  {chn.unreadCount > 0 && (
                    <span className="text-[9px] font-extrabold bg-orange-600 text-white px-1.5 py-0.5 rounded-full">
                      {chn.unreadCount}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] font-mono line-clamp-1 ${textMuted}`}>{chn.lastMessage}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        
        {/* Chat Thread Header */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${innerBg}`}>
          <div>
            <span className="text-[10px] font-mono font-bold text-orange-400 uppercase">{activeChannel.category}</span>
            <h4 className={`font-extrabold text-sm sm:text-base ${textTitle}`}>{activeChannel.name}</h4>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Rede Ativa</span>
          </div>
        </div>

        {/* Message Thread History */}
        <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 pr-2">
          {activeMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mb-1">
                <strong>{msg.senderName}</strong> • <span>{msg.companyName}</span> • <span>{msg.timestamp}</span>
              </div>

              <div className={`p-3.5 rounded-2xl max-w-md text-xs leading-relaxed shadow-sm border ${
                msg.isMe
                  ? 'bg-orange-600 text-white border-orange-500 font-medium rounded-tr-none'
                  : isDark ? 'bg-[#121214] text-zinc-100 border-[#27272a] rounded-tl-none' : 'bg-zinc-100 text-zinc-900 border-zinc-200 rounded-tl-none'
              }`}>
                {msg.tag && (
                  <span className="block text-[9px] font-mono font-bold uppercase tracking-wider bg-black/20 text-orange-200 px-2 py-0.5 rounded-md mb-1.5 w-fit">
                    📌 {msg.tag}
                  </span>
                )}
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-zinc-700/30">
          <input
            type="text"
            placeholder={`Enviar mensagem no canal ${activeChannel.category}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
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
