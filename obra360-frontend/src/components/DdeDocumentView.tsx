import React from 'react';
import { ThemeMode } from '../types';
import { 
  FileText, ShieldCheck, CheckCircle2, User, Building, 
  Layers, AlertTriangle, X, Award, Target, BookOpen, Clock 
} from 'lucide-react';

interface DdeDocumentViewProps {
  theme: ThemeMode;
  onClose: () => void;
}

export const DdeDocumentView: React.FC<DdeDocumentViewProps> = ({ theme, onClose }) => {
  const isDark = theme === 'dark';

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className={`border rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto ${cardBg} transition-colors`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center border-b pb-4 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-orange-600 text-white px-2 py-0.5 rounded-md uppercase">DDE Homologado</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ Versão 1.0 (2026)</span>
              </div>
              <h2 className={`font-extrabold text-lg sm:text-xl ${textTitle}`}>
                1 DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-[#27272a] text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Section 1.1 Introdução */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-sm text-orange-500 font-mono uppercase tracking-wider">1.1 Introdução</h3>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            O setor da construção civil é um dos principais motores econômicos globais, porém historicamente enfrenta graves desafios de fragmentação de dados, baixa produtividade e falhas de comunicação entre os diversos agentes da cadeia produtiva. O <strong>Obra 360</strong> é uma plataforma corporativa web e ecossistema digital integrado (<em>SaaS Multi-Tenant B2B/B2C</em>) destinado a construtoras, incorporadoras, escritórios de engenharia e arquitetura, fornecedores de insumos, investidores e clientes finais. A ideia central da solução é integrar todo o ciclo de vida de um empreendimento, desde o surgimento da oportunidade e viabilidade de terrenos, passando pelo projeto arquitetônico, planejamento WBS, cotações de materiais por Nota Fiscal, até a comercialização imobiliária, espelho de vendas, entrega de chaves e gestão de garantias pós-obra (NBR 15575).
          </p>
        </div>

        {/* Section 1.2 Visão Geral */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-sm text-orange-500 font-mono uppercase tracking-wider">1.2 Visão Geral do Documento</h3>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            Este documento apresenta o escopo detalhado do Obra 360, uma plataforma web/sistema corporativo destinada à gestão integrada de empreendimentos da construção civil e do mercado imobiliário. Ele funciona como um mapa estruturado que define com clareza os objetivos gerais e específicos, a justificativa mercadológica apoiada em dados do setor, o mapeamento de requisitos funcionais e não funcionais com suas respectivas prioridades, entregáveis tangíveis, premissas de infraestrutura, restrições tecnológicas, critérios rigorosos de aceitação, exclusões deliberadas de escopo, mapeamento de stakeholders e gerenciamento de riscos iniciais.
          </p>
        </div>

        {/* Section 1.3 Identificação */}
        <div className={`p-4 rounded-2xl border ${innerBg} space-y-2 font-mono text-xs`}>
          <h3 className="font-extrabold text-sm text-orange-500 uppercase tracking-wider">1.3 Identificação do Projeto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><span className={textMuted}>Nome do Projeto:</span> <strong className={textTitle}>Obra 360 - Plataforma Integrada de Gestão da Construção Civil</strong></div>
            <div><span className={textMuted}>Autor(es):</span> <strong className={textTitle}>João Pedro e Marcos Henrique (Desenvolvedores)</strong></div>
            <div><span className={textMuted}>Orientador:</span> <strong className={textTitle}>Dennys Carvalho</strong></div>
            <div><span className={textMuted}>Arquitetura:</span> <strong className="text-emerald-400">Clean Architecture + Domain-Driven Design (DDD)</strong></div>
          </div>
        </div>

        {/* Section 1.4 Objetivos */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-orange-500 font-mono uppercase tracking-wider">1.4 Objetivos do Projeto</h3>
          
          <div className={`p-3.5 rounded-2xl border ${innerBg} text-xs`}>
            <strong className="text-orange-400 block mb-1 font-mono">Objetivo Geral:</strong>
            <p className={textMuted}>
              Desenvolver e implementar uma plataforma corporativa web integrada baseada em Clean Architecture para centralizar a gestão, a execução e a comercialização de empreendimentos imobiliários e de infraestrutura, conectando todos os atores do ecossistema da construção civil em um ambiente Multi-Tenant unificado.
            </p>
          </div>

          <div>
            <strong className="text-orange-400 block mb-1.5 font-mono text-xs">Objetivos Específicos:</strong>
            <ul className={`list-disc list-inside text-xs space-y-1 ${textMuted}`}>
              <li>Levantamento dos requisitos funcionais e não funcionais junto aos diversos perfis operacionais do ecossistema.</li>
              <li>Projetar a arquitetura do sistema utilizando os padrões de Clean Architecture em 4 ou mais camadas desacopladas.</li>
              <li>Implementar barramento de mensageria assíncrona EventBus (PubSub) para comunicação desacoplada entre os Casos de Uso.</li>
              <li>Projetar a arquitetura do sistema utilizando os padrões de Domain-Driven Design (DDD).</li>
              <li>Almoxarifado & Conciliação NFe: Implementar sistema de controle de estoque e movimentações com suporte a conciliação por Nota Fiscal (NFe) e alertas de estoque mínimo SKU.</li>
              <li>Validação e Testes de Aceitação: Validar a solução por meio de testes de integração, testes de aceitação de usabilidade e compilação limpa.</li>
              <li>Gestão de Categorias de Empreendimentos: Desenvolver suporte operacional para diferentes tipos de obras.</li>
              <li>Fiscalização de Não-Conformidades ISO 9001 e laudos NR-18.</li>
              <li>Portal do Proprietário & Diário Transparente de Obra.</li>
              <li>Design System & Suporte a Temas (Dark / Light Mode).</li>
            </ul>
          </div>
        </div>

        {/* Section 1.5 Justificativa */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-sm text-orange-500 font-mono uppercase tracking-wider">1.5 Justificativa</h3>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            A indústria da construção civil é historicamente reconhecida como uma das menos digitalizadas do mundo. De acordo com o estudo global da McKinsey & Company (2020) sobre a produtividade na construção, o setor tem registrado um crescimento de produtividade de apenas 1% ao ano nas últimas duas décadas, em comparação com 2,8% na manufatura global. No Brasil, dados da Câmara Brasileira da Indústria da Construção (CBIC, 2023) apontam que até 8% do custo total de uma obra é perdido devido a retrabalho, desperdício de materiais no canteiro e desbalanceamento no controle de estoque. O Obra 360 justifica-se ao substituir o modelo arcaico e fragmentado de planilhas e e-mails por uma Plataforma Corporativa Integrada.
          </p>
        </div>

        {/* Section 1.7 Escopo & Entregáveis */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-orange-500 font-mono uppercase tracking-wider">1.7 Escopo do Produto e Entregáveis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className={`p-3.5 rounded-2xl border ${innerBg} space-y-1.5`}>
              <strong className={`font-bold ${textTitle}`}>1.7.1 Funcionalidades Previstas:</strong>
              <ul className={`list-disc list-inside space-y-1 text-[11px] ${textMuted}`}>
                <li>Gestão Multi-Empresas (Multi-Tenant SaaS B2B/B2C)</li>
                <li>Gestão de 9 Categorias de Empreendimentos</li>
                <li>Fiscalização ISO 9001 & Laudos NR-18</li>
                <li>Almoxarifado & Conciliação NFe por Chave</li>
                <li>Marketplace B2B (Cotações RFQ & Frotas)</li>
                <li>Portal do Proprietário & Diário de Obra</li>
                <li>Garantias Pós-Venda (NBR 15575)</li>
                <li>Barramento EventBus (PubSub) & Chat B2B</li>
              </ul>
            </div>

            <div className={`p-3.5 rounded-2xl border ${innerBg} space-y-1.5`}>
              <strong className={`font-bold ${textTitle}`}>1.7.2 Entregáveis:</strong>
              <ul className={`list-disc list-inside space-y-1 text-[11px] ${textMuted}`}>
                <li>Código-fonte completo no repositório GitHub (frontend, backend e DB)</li>
                <li>Relatório Técnico completo com diagramas e manuais</li>
                <li>Sistema funcional em ambiente de produção (PWA)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 1.9 Critérios de Aceitação */}
        <div className={`p-4 rounded-2xl border ${innerBg} space-y-2 text-xs font-mono`}>
          <h3 className="font-extrabold text-sm text-orange-500 uppercase tracking-wider">1.9 Critérios de Aceitação</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Compilação Limpa (Zero Errors via `npm run build`)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Isolamento Total de Dados por Tenant (CNPJ)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Fidelidade da Matriz RBAC (13 Perfis)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Conformidade com Design System & Dark Mode</span>
            </div>
          </div>
        </div>

        {/* Section 1.11 Stakeholders */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-sm text-orange-500 font-mono uppercase tracking-wider">1.11 Stakeholders Envolvidos</h3>
          <div className={`p-3.5 rounded-2xl border ${innerBg} text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono`}>
            <div><span className={textMuted}>Organizadores:</span> <strong className={textTitle}>João Pedro e Marcos Henrique</strong></div>
            <div><span className={textMuted}>Professor Orientador:</span> <strong className="text-cyan-400">Dennys Carvalho</strong></div>
            <div><span className={textMuted}>Administrador:</span> <strong className={textTitle}>Administrador de TI / Governança</strong></div>
            <div><span className={textMuted}>Testers:</span> <strong className={textTitle}>Estudantes de Ensino Superior (IES)</strong></div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-600/30 transition"
          >
            Fechar Documentação DDE
          </button>
        </div>

      </div>
    </div>
  );
};
