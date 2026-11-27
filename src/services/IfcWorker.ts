/// <reference lib="webworker" />
import { parseRealIfc } from './RealIfcParser';
self.onmessage = async (event: MessageEvent<File>) => {
  try {
    const request = event.data as File | { file: File; includeGeometry?: boolean };
    const file = request instanceof File ? request : request.file;
    const includeGeometry = !(request instanceof File) && request.includeGeometry === true;
    self.postMessage({ result: await parseRealIfc(file, includeGeometry) });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : 'Não foi possível ler o arquivo IFC.',
    });
  }
};
