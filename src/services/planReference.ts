import { requestApi } from './http';

export type PlanReference = {
  url: string;
  x: number;
  z: number;
  width: number;
  height: number;
};

export type SavedPlanReference = {
  id: number;
  nomeArquivo: string;
  pavimentoId: string;
  pagina: number;
  x: number;
  z: number;
  largura: number;
  altura: number;
  calibrada: boolean;
};

export type OpenPlanReference = PlanReference & {
  file: File;
  page: number;
  pages: number;
  floorId: string;
  calibrated: boolean;
};

export async function loadSavedPlanReference(modelId: number, revision: number,
    metadata: SavedPlanReference, signal: AbortSignal): Promise<OpenPlanReference> {
  const blob = await requestApi<Blob>(
    `/v1/workspace/modelador/modelos/${modelId}/revisoes/${revision}/referencia`,
    { signal }, 45000, 'blob',
  );
  const file = new File([blob], metadata.nomeArquivo);
  const { reference, pages } = await renderPlanReference(file, metadata.pagina);
  return { ...reference, file, pages, page: metadata.pagina, floorId: metadata.pavimentoId,
    calibrated: metadata.calibrada, x: metadata.x, z: metadata.z,
    width: metadata.largura, height: metadata.altura };
}

const maxDimension = 2400;

export async function renderPlanReference(file: File, pageNumber: number) {
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new Error('Selecione um arquivo de até 20 MB.');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('A visualização de arquivos está indisponível neste navegador.');
  let pages = 1;
  if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') {
    const [pdf, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    pdf.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdf.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      maxImageSize: 36_000_000,
      isEvalSupported: false,
      enableXfa: false,
    });
    try {
      const document = await task.promise;
      pages = document.numPages;
      if (pageNumber < 1 || pageNumber > pages)
        throw new Error(`Este PDF tem ${pages} página(s). Escolha uma página válida.`);
      const page = await document.getPage(pageNumber);
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: maxDimension / Math.max(original.width, original.height),
      });
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      await page.render({ canvas, canvasContext: context, viewport }).promise;
    } finally {
      await task.destroy();
    }
  } else {
    if (!/\.(png|jpe?g|webp)$/i.test(file.name))
      throw new Error('Use um arquivo PDF, PNG, JPEG ou WebP.');
    const image = await createImageBitmap(file);
    try {
      if (image.width * image.height > 36_000_000)
        throw new Error('A imagem excede o limite de 36 megapixels.');
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    } finally {
      image.close();
    }
  }
  const width = (12 * canvas.width) / Math.max(canvas.width, canvas.height);
  const height = (12 * canvas.height) / Math.max(canvas.width, canvas.height);
  return {
    reference: {
      url: canvas.toDataURL('image/webp'),
      x: -width / 2,
      z: -height / 2,
      width,
      height,
    },
    pages,
  };
}
