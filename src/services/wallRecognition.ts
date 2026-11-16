import type { ModelElement, ModelFloor } from './modelGeometry';
import type { PlanReference } from './planReference';
import type { WallRectangle } from './wallRecognitionCore';
export { wallRectangles } from './wallRecognitionCore';
export async function recognizeWalls(
  reference: PlanReference,
  floor: ModelFloor,
  signal?: AbortSignal,
): Promise<ModelElement[]> {
  const image = new Image();
  image.src = reference.url;
  await image.decode();
  if (image.naturalWidth * image.naturalHeight > 36_000_000)
    throw new Error('Referência excede o limite de processamento.');
  const canvas = document.createElement('canvas'),
    scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Leitura de imagem indisponível.');
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  signal?.throwIfAborted();
  if (typeof Worker === 'undefined')
    throw new Error('Reconhecimento indisponível neste navegador. Use o traçado manual.');
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const worker = new Worker(new URL('./wallRecognition.worker.ts', import.meta.url), {
    type: 'module',
  });
  const rectangles = await new Promise<WallRectangle[]>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      worker.terminate();
    };
    const abort = () => {
      cleanup();
      reject(new DOMException('Análise cancelada.', 'AbortError'));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'A análise excedeu o tempo limite. Use uma referência mais simples ou traçado manual.',
        ),
      );
    }, 20000);
    signal?.addEventListener('abort', abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ walls?: WallRectangle[]; error?: string }>) => {
      cleanup();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.walls || []);
    };
    worker.onerror = () => {
      cleanup();
      reject(
        new Error('Não foi possível analisar a referência. O traçado manual continua disponível.'),
      );
    };
    worker.postMessage(
      { pixels, width: canvas.width, height: canvas.height, reference: { ...reference, url: '' } },
      [pixels.buffer],
    );
  });
  return rectangles.map((r, i) => ({
    ...r,
    id: crypto.randomUUID(),
    pavimentoId: floor.id,
    tipo: 'PAREDE',
    nome: `Parede sugerida ${i + 1}`,
    base: 0,
    altura: floor.altura,
    cor: '#a1a1aa',
    paredeId: null,
    deslocamento: 0,
  }));
}
