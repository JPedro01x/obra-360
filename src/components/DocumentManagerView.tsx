import React, { useState, useEffect } from 'react';
import { ProjectDocument, RoleId, ThemeMode } from '../types';
import { INITIAL_DOCUMENTS, USER_ROLES } from '../data/mockData';
import { api } from '../services/api';
import { 
  FileText, Layers, CheckCircle2, Clock, Upload, 
  Sparkles, Filter, Search, Plus, Eye, History, ShieldCheck, Download, Award, Loader2 
} from 'lucide-react';

interface DocumentManagerViewProps {
  currentRole: RoleId;
  theme: ThemeMode;
  onSendToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => void;
}

export const DocumentManagerView: React.FC<DocumentManagerViewProps> = ({
  currentRole,
  theme,
  onSendToast
}) => {
  const isDark = theme === 'dark';
  const [documents, setDocuments] = useState<ProjectDocument[]>(INITIAL_DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isUploadingAsync, setIsUploadingAsync] = useState<boolean>(false);

  // New Document Form
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<'Arquitetônico' | 'Estrutural' | 'Elétrico' | 'Hidráulico' | 'Licença/Alvará' | 'Memorial Descritivo'>('Arquitetônico');
  const [version, setVersion] = useState<string>('v2.0');
  const [fileType, setFileType] = useState<'IFC 3D' | 'DWG 2D' | 'PDF Técnico' | 'DOCX'>('IFC 3D');
  const [notes, setNotes] = useState<string>('');

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  const userRoleObj = USER_ROLES[currentRole];
  const canApprove = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ARQUITETO', 'ENGENHEIRO'].includes(currentRole);

  const categories = ['TODOS', 'Arquitetônico', 'Estrutural', 'Elétrico', 'Hidráulico', 'Licença/Alvará', 'Memorial Descritivo'];

  // Initial Async Load
  useEffect(() => {
    async function loadDocs() {
      const fetched = await api.documents.getByProjectId('PRJ-001');
      setDocuments(fetched);
    }
    loadDocs();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'TODOS' || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.version.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploadingAsync(true);
    try {
      const created = await api.documents.upload({
        projectId: 'PRJ-001',
        title: title.trim(),
        category,
        version: version.trim() || 'v1.0',
        status: 'AGUARDANDO_APROVACAO',
        author: userRoleObj.title,
        authorRole: userRoleObj.department,
        fileSize: `${(Math.random() * 20 + 2).toFixed(1)} MB`,
        fileType,
        notes: notes.trim() || 'Nova versão enviada para homologação executiva.'
      });

      setDocuments([created, ...documents]);
      setShowUploadModal(false);
      setTitle('');
      setNotes('');

      onSendToast(
        'success',
        'Documento Sincronizado na Nuvem',
        `Arquivo "${created.title}" (${created.version}) enviado com sucesso para análise técnica.`
      );
    } finally {
      setIsUploadingAsync(false);
    }
  };

  const handleApproveDocument = async (id: string) => {
    await api.documents.approve(id);
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'APROVADO' } : d))
    );
    onSendToast('success', 'Projeto Homologado Assincronamente', `Documento aprovado pelo ${userRoleObj.title}. Versão vigente atualizada.`);
  };

  return (
    <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col gap-4 sm:gap-6 transition-colors`}>
      
      {/* Header Banner */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 ${
        isDark ? 'border-[#27272a]' : 'border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-500 shrink-0" />
            <h2 className={`font-extrabold text-base sm:text-lg ${textTitle}`}>Central de Projetos & Versionamento (2D / 3D BIM)</h2>
            <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Controle de Revisões Vigentes (Async API)
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${textMuted}`}>
            Repositório único de pranchas arquitetônicas, projetos estruturais, elétricos, hidráulicos e alvarás
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px]">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${textMuted}`} />
            <input
              type="text"
              placeholder="Buscar projeto ou versão..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
              }`}
            />
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-lg shadow-orange-600/30 transition shrink-0"
          >
            <Upload className="w-4 h-4" /> Enviar Nova Versão (v2.0)
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className={`flex p-1 rounded-2xl border text-xs overflow-x-auto gap-1 ${
        isDark ? 'bg-[#121214] border-[#27272a]' : 'bg-zinc-100 border-zinc-200'
      }`}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              selectedCategory === cat ? 'bg-orange-600 text-white shadow-md' : `${textMuted} hover:${textTitle}`
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className={`border rounded-2xl p-4 shadow-md space-y-3 flex flex-col justify-between ${innerBg}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-extrabold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                      {doc.version}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                      doc.fileType === 'IFC 3D' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {doc.fileType}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm sm:text-base mt-1.5 ${textTitle}`}>{doc.title}</h3>
                </div>

                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  doc.status === 'APROVADO' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {doc.status === 'APROVADO' ? '✓ Versão Aprovada' : '🕒 Em Análise Técnica'}
                </span>
              </div>

              <p className={`text-xs leading-relaxed ${textMuted}`}>{doc.notes || 'Sem observações adicionais.'}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-700/30 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className={textMuted}>Autor do Projeto:</span>
                <span className={`font-bold ${textTitle}`}>{doc.author} ({doc.authorRole})</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={textMuted}>Atualizado em:</span>
                <span className={textMuted}>{doc.updatedAt} • {doc.fileSize}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onSendToast('info', 'Download de Projeto', `Baixando arquivo ${doc.title} (${doc.version})...`)}
                  className={`py-1.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-1.5 transition ${
                    isDark ? 'bg-[#18181b] border-[#27272a] hover:bg-[#27272a] text-zinc-300' : 'bg-white border-zinc-300 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-orange-500" /> Baixar
                </button>

                {doc.status !== 'APROVADO' && canApprove ? (
                  <button
                    onClick={() => handleApproveDocument(doc.id)}
                    className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Aprovar Versão
                  </button>
                ) : (
                  <div className="py-1.5 text-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    ✓ Vigente na Obra
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD NEW VERSION MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 ${cardBg}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                <h3 className={`font-bold text-base ${textTitle}`}>Enviar Nova Versão de Projeto</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className={`font-bold ${textMuted} hover:${textTitle}`}>✕</button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-3 text-xs">
              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Título do Projeto / Prancha:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prancha Arquitetônica Pavimento Tipo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Categoria:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  >
                    <option value="Arquitetônico">Arquitetônico</option>
                    <option value="Estrutural">Estrutural</option>
                    <option value="Elétrico">Elétrico</option>
                    <option value="Hidráulico">Hidráulico</option>
                    <option value="Licença/Alvará">Licença / Alvará</option>
                    <option value="Memorial Descritivo">Memorial Descritivo</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 font-semibold ${textMuted}`}>Versão do Arquivo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: v2.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Formato do Arquivo:</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none font-mono ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                >
                  <option value="IFC 3D">BIM IFC 3D (.ifc)</option>
                  <option value="DWG 2D">AutoCAD DWG 2D (.dwg)</option>
                  <option value="PDF Técnico">PDF Técnico (.pdf)</option>
                  <option value="DOCX">Documento Word (.docx)</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 font-semibold ${textMuted}`}>Histórico / Notas da Revisão:</label>
                <textarea
                  rows={2}
                  placeholder="Descreva as alterações desta versão em relação à anterior..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-[#121214] text-white border-[#27272a]' : 'bg-zinc-50 text-zinc-900 border-zinc-300'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploadingAsync}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    isDark ? 'bg-[#27272a] text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingAsync}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5"
                >
                  {isUploadingAsync ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando NUVEM...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Registrar Versão
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
