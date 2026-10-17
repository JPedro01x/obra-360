import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { ThemeMode } from '../types';

interface CameraCaptureModalProps {
  theme: ThemeMode;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  theme,
  onClose,
  onCapture
}) => {
  const isDark = theme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn('Camera access error:', err);
        setCameraError('Não foi possível acessar a câmera do dispositivo. Verifique as permissões do navegador.');
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleTakeSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const cardBg = isDark ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-zinc-200';
  const textTitle = isDark ? 'text-white' : 'text-zinc-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 ${cardBg}`}>
        
        <div className={`flex justify-between items-center border-b pb-3 ${isDark ? 'border-[#27272a]' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-orange-500" />
            <h3 className={`font-bold text-base ${textTitle}`}>Câmera do Canteiro de Obras</h3>
          </div>
          <button onClick={onClose} className={`font-bold ${textMuted} hover:${textTitle}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {cameraError ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-xs text-rose-400 font-bold">{cameraError}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-700/50 flex items-center justify-center">
              {capturedImage ? (
                <img src={capturedImage} alt="Foto Capturada" className="w-full h-full object-cover" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {capturedImage ? (
                <>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700 font-bold text-xs flex items-center justify-center gap-2 text-zinc-300 hover:bg-zinc-800"
                  >
                    <RefreshCw className="w-4 h-4" /> Tirar Outra Foto
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
                  >
                    <Check className="w-4 h-4" /> Anexar ao Diário
                  </button>
                </>
              ) : (
                <button
                  onClick={handleTakeSnap}
                  className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30"
                >
                  <Camera className="w-4 h-4" /> Capturar Foto Agora
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
