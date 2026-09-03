import React, { useState, useEffect } from 'react';
import { ThemeMode, RoleId } from '../types';
import { 
  Bot, Mic, MicOff, Sparkles, AlertTriangle, CheckCircle2, 
  TrendingUp, Calendar, Zap, ArrowRight, Play, HardHat 
} from 'lucide-react';

interface AiConstructionAssistantProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
}

export const AiConstructionAssistantView: React.FC<AiConstructionAssistantProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200 shadow-xl';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600';

  // Toggle Voice Recording via Web Speech Recognition API
  const handleToggleVoiceRecording = () => {
    if (isListening) {
      setIsListening(false);
      onSendToast('info', 'Gravação Concluída', 'Processando transcrição de voz via inteligência artificial...');
      
      // Simulated AI Speech-to-Text Parsing result
      setTimeout(() => {
        setTranscriptText('Concretagem da laje do 3º pavimento realizada com sucesso. Aplicados 120 sacos de cimento Votoran Fck 30MPa e 1.5 toneladas de aço CA-50 Gerdau.');
        setAiAnalysisResult({
          parsedMaterials: [
            { item: 'Cimento Votoran Fck 30MPa', quantity: 120, unit: 'sacos' },
            { item: 'Aço Gerdau CA-50', quantity: 1500, unit: 'kg' }
          ],
          stageUpdated: 'Laje Térreo & Vigas Superiores',
          safetyCheck: '100% de conformidade com a norma NR-18 (Linha de vida ok)',
          delayPrediction: 'Risco BAIXO de atraso (Evolução 3% acima da média da Curva S)'
        });
        onSendToast('success', '✨ Diário de Obra Processado por IA', 'Dados estruturados e baixas de insumo calculadas automaticamente!');
      }, 1200);

    } else {
      setIsListening(true);
      setTranscriptText('');
      setAiAnalysisResult(null);
      onSendToast('info', '🎙️ Ouvindo Canteiro de Obras...', 'Fale os dados do Diário de Obra (RDO) claramente no microfone.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-6 relative overflow-hidden ${cardBg}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`font-extrabold text-xl ${textTitle}`}>Assistente de Canteiro & IA Preditiva</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400 animate-spin" /> Gemini AI Data Engine
                </span>
              </div>
              <p className={`text-xs ${textMuted}`}>
                Ditado por voz para Diário de Obra (RDO) e inteligência preditiva para cálculo de risco de atrasos da Curva S.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Voice Assistant Module */}
        <div className={`border rounded-3xl p-6 space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-base flex items-center gap-2 ${textTitle}`}>
              <Mic className="w-5 h-5 text-orange-500" /> Ditado por Voz para RDO (Canteiro Mobile)
            </h3>
            {isListening && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Gravando Áudio...
              </span>
            )}
          </div>

          <div className={`border rounded-2xl p-6 text-center space-y-4 ${
            isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <button
              onClick={handleToggleVoiceRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300 transform active:scale-95 shadow-xl ${
                isListening 
                  ? 'bg-rose-600 text-white animate-bounce shadow-rose-600/50' 
                  : 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-orange-600/40 hover:scale-105'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            <p className={`text-xs font-semibold ${textMuted}`}>
              {isListening 
                ? 'Clique para encerrar a gravação e processar por IA' 
                : 'Clique no microfone para ditar os serviços executados no canteiro hoje'}
            </p>

            {transcriptText && (
              <div className={`border rounded-xl p-3 text-left text-xs font-mono leading-relaxed ${
                isDark ? 'bg-[#18181b] text-emerald-400 border-emerald-500/30' : 'bg-white text-emerald-700 border-emerald-200'
              }`}>
                <span className="font-bold block text-[10px] uppercase tracking-wider mb-1 text-emerald-500">
                  Transcrição em Tempo Real (Speech-to-Text):
                </span>
                "{transcriptText}"
              </div>
            )}
          </div>

          {/* AI Parsed Results */}
          {aiAnalysisResult && (
            <div className="space-y-3 pt-2">
              <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Insumos Estruturados Extraídos pela IA:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiAnalysisResult.parsedMaterials.map((mat: any, idx: number) => (
                  <div key={idx} className={`border rounded-xl p-3 flex items-center justify-between text-xs ${
                    isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
                  }`}>
                    <span className="font-semibold">{mat.item}</span>
                    <span className="font-bold text-orange-500">{mat.quantity} {mat.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Predictive Delay Analytics Module */}
        <div className={`border rounded-3xl p-6 space-y-4 ${cardBg}`}>
          <h3 className={`font-bold text-base flex items-center gap-2 ${textTitle}`}>
            <TrendingUp className="w-5 h-5 text-purple-400" /> Análise Preditiva de Cronograma & Risco
          </h3>

          <div className="space-y-3">
            <div className={`border rounded-2xl p-4 flex items-center justify-between ${
              isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold text-xs ${textTitle}`}>Risco Global de Atraso</h4>
                  <p className="text-[11px] text-emerald-400 font-bold">3.2% (BAIXO RISCO)</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Dentro do Prazo
              </span>
            </div>

            <div className={`border rounded-2xl p-4 flex items-center justify-between ${
              isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold text-xs ${textTitle}`}>Alerta Preventivo de Clima</h4>
                  <p className={`text-[11px] ${textMuted}`}>Previsão de 4 dias de chuva forte na próxima semana.</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-400">
                Aviso Preditivo
              </span>
            </div>

            <div className={`border rounded-2xl p-4 space-y-2 ${
              isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Eficiência Média da Equipe de Armadores:</span>
                <span className="text-orange-500">94.8%</span>
              </div>
              <div className="w-full bg-zinc-700/30 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-amber-500 h-2 rounded-full w-[94.8%]" />
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
