import React from 'react';
import { StockItem, BuildingElement, RoleId, ThemeMode } from '../types';
import { USER_ROLES } from '../data/mockData';
import { generateExecutiveReportPDF } from '../utils/exportUtils';
import { 
  TrendingUp, AlertTriangle, CheckCircle2, DollarSign, 
  Building, PackageCheck, ShieldCheck, ArrowUpRight, Clock, Lock,
  Wrench, FileText, Camera, Users, HardHat, ShieldAlert, Award, Layers,
  Package, ArrowDownRight, ArrowUpRight as ArrowUp, Check, Key, Printer 
} from 'lucide-react';

interface ExecutiveDashboardProps {
  elements: BuildingElement[];
  stockItems: StockItem[];
  currentRole: RoleId;
  theme: ThemeMode;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  elements, 
  stockItems, 
  currentRole,
  theme 
}) => {
  const isDark = theme === 'dark';
  const roleObj = USER_ROLES[currentRole];

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const completedCount = elements.filter((e) => e.status === 'CONCLUIDO').length;
  const inProgressCount = elements.filter((e) => e.status === 'EM_EXECUCAO').length;
  const totalElements = elements.length;
  const totalProgressPercent = Math.round(
    elements.reduce((acc, e) => acc + e.progressPercent, 0) / totalElements
  );

  const lowStockItems = stockItems.filter((item) => item.quantity <= item.minStock);

  const handlePrintPDF = () => {
    generateExecutiveReportPDF(roleObj.title, elements, stockItems);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Sleek Minimal Header Strip */}
      <div className={`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-colors ${cardBg}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Award className="w-5 h-5 text-orange-500 shrink-0" />
          </div>
          <div>
            <h2 className={`font-extrabold text-base ${textTitle}`}>
              Painel {roleObj.title}
            </h2>
            <p className={`text-xs ${textMuted}`}>
              {roleObj.department} • {roleObj.level}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintPDF}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition"
          title="Gerar Relatório Executivo em PDF Impresso"
        >
          <Printer className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUPER ADMIN / GERENTE GERAL DE OBRAS (Painel Estratégico da Diretoria) */}
      {/* ========================================================================= */}
      {(currentRole === 'SUPER_ADMIN' || currentRole === 'GERENTE_OBRA') && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Progresso Global</span>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>{totalProgressPercent}%</h3>
              <p className="text-[11px] text-emerald-500 mt-1 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +5.2% esta semana
              </p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Custo Real Executado</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>R$ 166.400,00</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Previsto: R$ 250.000,00 (66%)</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Matriz de Risco</span>
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">12% (BAIXO)</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>0 atrasos de suprimentos</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Data Conclusão</span>
                <Clock className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>10/04/2027</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Falta 238 dias corridos</p>
            </div>
          </div>

          {/* S-Curve Graph for Executive Directors */}
          <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl space-y-4`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-zinc-700/50 gap-2">
              <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Curva S Executiva da Diretoria (Planejado x Realizado)</h3>
              <span className="text-[10px] font-mono text-orange-500 font-bold">Relatório Executivo Q3</span>
            </div>
            <div className="h-40 sm:h-52 w-full flex items-end justify-between gap-1.5 sm:gap-2 pt-4">
              {[
                { week: 'Sem 1', plan: 15, real: 15 },
                { week: 'Sem 2', plan: 30, real: 30 },
                { week: 'Sem 3', plan: 45, real: 42 },
                { week: 'Sem 4', plan: 60, real: 58 },
                { week: 'Sem 5', plan: 72, real: 65 },
                { week: 'Sem 6', plan: 85, real: 75 },
                { week: 'Sem 7', plan: 95, real: 0 },
                { week: 'Sem 8', plan: 100, real: 0 },
              ].map((d, idx) => (
                <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full">
                  <div className="w-3 sm:w-4 bg-orange-500/40 rounded-t" style={{ height: `${d.plan}%` }} />
                  {d.real > 0 && <div className="w-3 sm:w-4 bg-emerald-500/80 rounded-t" style={{ height: `${d.real}%` }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ENGENHEIRO RESIDENTE (Painel de Engenharia de Campo & Modelo BIM) */}
      {/* ========================================================================= */}
      {currentRole === 'ENGENHEIRO' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Avanço de Estrutura</span>
                <Wrench className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>{totalProgressPercent}%</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>{completedCount} de {totalElements} prontas</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Concreto Fck 30MPa</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">32.4 MPa</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Aprovado no laudo de 28d</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Elementos 3D BIM</span>
                <Building className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>{elements.length} Mapeados</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Com coordenadas X, Y, Z</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Laudo do Prumo</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">100% OK</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Sem desvios técnicos</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ANALISTA FINANCEIRO & CUSTOS (Painel de Controladoria & Fluxo de Caixa) */}
      {/* ========================================================================= */}
      {currentRole === 'FINANCEIRO' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Orçamento Realizado</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>R$ 166.400,00</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>66.5% do teto financeiro</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Saldo Orçamentário</span>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-2 text-emerald-500">R$ 83.600,00</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Disponível</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Notas Fiscais NFe</span>
                <FileText className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>14 NFes</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Conciliadas no estoque</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Desvio Orçamentário</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">-1.8%</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Economia verificada</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MESTRE DE OBRAS (Painel Operacional de Campo & Equipe) */}
      {/* ========================================================================= */}
      {currentRole === 'MESTRE_OBRA' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Operários Hoje</span>
                <Users className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>12 Operários</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>8 Pedreiros, 4 Serventes</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Clima</span>
                <HardHat className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-2">Ensolarado</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>0h paradas</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Checklist EPI</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">100% OK</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Equipamento completo</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Fotos do Diário</span>
                <Camera className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>4 Fotos Hoje</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Enviado ao cliente</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ALMOXARIFE CHEFE (Painel Logístico do Almoxarifado) */}
      {/* ========================================================================= */}
      {currentRole === 'ALMOXARIFE' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Estoque Crítico</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-500 mt-2">{lowStockItems.length} Produtos</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Requer reposição</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Entradas NFe Mês</span>
                <PackageCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>100 Sacos Cimento</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Nota Fiscal NF-884920</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Saídas Obras Hoje</span>
                <Package className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>500 Tijolos</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Destino: Térreo</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Total SKUs</span>
                <Layers className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>{stockItems.length} Produtos</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Localizados no Galpão</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CLIENTE PROPRIETÁRIO (Painel Transparente da Casa do Cliente) */}
      {/* ========================================================================= */}
      {currentRole === 'CLIENTE' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Status da Sua Casa</span>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>{totalProgressPercent}%</h3>
              <p className="text-[11px] text-emerald-500 mt-1 font-medium">Estrutura 100% Pronta</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Entrega das Chaves</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-2">10/04/2027</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>238 dias corridos</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Diário Fotográfico</span>
                <Camera className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>10 Fotos</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Atualizado Hoje</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Garantia Estrutural</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">5 Anos</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Laudos de Engenharia OK</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. AUDITOR INTERNO DE RISCOS (Painel de Auditoria & Conformidade) */}
      {/* ========================================================================= */}
      {currentRole === 'AUDITOR' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Integridade MongoDB</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">100% ÍNTEGRO</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Sem adulterações</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Logs Auditados</span>
                <FileText className="w-4 h-4 text-orange-500" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>1.482 Logs</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Com IP e Timestamp</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Conformidade ISO 9001</span>
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">98.4%</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Compliance Máximo</p>
            </div>

            <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
              <div className="flex justify-between text-xs font-semibold text-zinc-400">
                <span>Violações RBAC</span>
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">0 Violações</h3>
              <p className={`text-[11px] mt-1 ${textMuted}`}>Zero acessos suspeitos</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
