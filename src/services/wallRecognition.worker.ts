import { wallRectangles } from './wallRecognitionCore';
import type { PlanReference } from './planReference';
const scope = self as unknown as {
  onmessage: (
    event: MessageEvent<{
      pixels: Uint8ClampedArray;
      width: number;
      height: number;
      reference: PlanReference;
    }>,
  ) => void;
  postMessage: (data: unknown) => void;
};
scope.onmessage = (event) => {
  try {
    const { pixels, width, height, reference } = event.data;
    scope.postMessage({ walls: wallRectangles(pixels, width, height, reference) });
  } catch (error) {
    scope.postMessage({
      error: error instanceof Error ? error.message : 'Falha ao analisar referência.',
    });
  }
};
