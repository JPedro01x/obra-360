/// <reference lib="webworker" />
import { parseRealIfc } from './RealIfcParser';
self.onmessage = async (event: MessageEvent<File>) => {
  try {
    self.postMessage({ result: await parseRealIfc(event.data) });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : 'Não foi possível ler o arquivo IFC.',
    });
  }
};
