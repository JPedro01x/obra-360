import React, { useState } from 'react';
import { BuildingElement, ThemeMode } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { 
  Building, CheckCircle2, Clock, Calendar, 
  Camera, ShieldCheck, Heart, ArrowUpRight, Plus, Sparkles 
} from 'lucide-react';

interface ClientPortalViewProps {
  elements: BuildingElement[];
  theme: ThemeMode;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ elements, theme }) => {
  const isDark = theme === 'dark';

  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [photoGallery, setPhotoGallery] = useState<Array<{ id: string; url: string; title: string; date: string }>>([
    {
      id: 'FOTO-1',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80',
      title: 'Concretagem da Fundação & Sapatas',
      date: '10/08/2026'
    },
    {
      id: 'FOTO-2',
      url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
      title: 'Montagem de Armação de Aço CA-50',
      date: '12/08/2026'
    },
    {
      id: 'FOTO-3',
      url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80',
      title: 'Assentamento de Tijolos Baianos',
      date: 'Hoje (13/08/2026)'
    }
  ]);

  const totalElements = elements.length;
  const completedElements = elements.filter((e) => e.status === 'CONCLUIDO').length;
  const overallProgress = Math.round(
    elements.reduce((acc, e) => acc + e.progressPercent, 0) / totalElements
  );

  const handleCaptureNewPhoto = (imageDataUrl: string) => {
    const newPhoto = {
      id: `FOTO-${Date.now()}`,
      url: imageDataUrl,
      title: 'Foto Capturada no Canteiro de Obras',
      date: 'Hoje'
    };
    setPhotoGallery([newPhoto, ...photoGallery]);
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const innerBg = isDark ? 'bg-[#121214]' : 'bg-zinc-50';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      
      {/* Welcome Banner for Client */}
      <div className={`border rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${cardBg}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
            <h2 className={`font-extrabold text-lg sm:text-xl ${textTitle}`}>
              Portal Transparente do Proprietário
            </h2>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Bem-vindo! Acompanhe em tempo real a realização do sonho da sua casa própria.
          </p>
        </div>

        {/* Key Delivery Countdown Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-tr from-orange-600 to-amber-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg shadow-orange-600/30 shrink-0">
          <Clock className="w-6 h-6 animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">Previsão Entrega das Chaves</div>
            <div className="text-sm sm:text-base font-extrabold">10 de Abril de 2027</div>
            <div className="text-[10px] opacity-80">Faltam 238 dias corridos</div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
          <div className="text-xs font-bold text-zinc-400">Progresso Geral da Casa</div>
          <h3 className={`text-2xl sm:text-3xl font-extrabold mt-2 ${textTitle}`}>{overallProgress}%</h3>
          <div className="w-full bg-zinc-700/30 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
          <div className="text-xs font-bold text-zinc-400">Estruturas Prontas</div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">
            {completedElements} de {totalElements}
          </h3>
          <p className={`text-[11px] mt-1 ${textMuted}`}>Fundação e baldrame concluídos</p>
        </div>

        <div className={`${cardBg} border rounded-3xl p-4 sm:p-5 shadow-xl`}>
          <div className="text-xs font-bold text-zinc-400">Laudos Tecnológicos & Qualidade</div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-500 mt-2">100% OK</h3>
          <p className={`text-[11px] mt-1 ${textMuted}`}>Resistência Fck 30MPa Aprovada</p>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <div className={`${cardBg} border rounded-3xl p-4 sm:p-6 shadow-xl space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 border-zinc-700/40 gap-2">
          <div>
            <h3 className={`font-bold text-sm sm:text-base ${textTitle}`}>Diário Fotográfico Transparente da Obra</h3>
            <p className={`text-xs ${textMuted}`}>Fotos atualizadas enviadas diretamente do canteiro</p>
          </div>

          <button
            onClick={() => setShowCameraModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-3.5 py-2 rounded-2xl shadow-md transition shrink-0"
          >
            <Camera className="w-4 h-4" /> Tirar Foto Real
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {photoGallery.map((photo) => (
            <div key={photo.id} className={`border rounded-2xl overflow-hidden shadow-md flex flex-col justify-between ${innerBg}`}>
              <div className="aspect-video relative overflow-hidden bg-black">
                <img src={photo.url} alt={photo.title} className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/70 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {photo.date}
                </span>
              </div>
              <div className="p-3 space-y-1">
                <h4 className={`font-bold text-xs ${textTitle}`}>{photo.title}</h4>
                <p className={`text-[10px] ${textMuted}`}>Inspeção de engenharia aprovada</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Device Camera Modal */}
      {showCameraModal && (
        <CameraCaptureModal
          theme={theme}
          onClose={() => setShowCameraModal(false)}
          onCapture={handleCaptureNewPhoto}
        />
      )}

    </div>
  );
};
