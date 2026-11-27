import { API_BASE_URL, DEMO_MODE } from './http';
import { parseWorkspaceSseFrames } from './realtimeSse';

export type WorkspaceChange = {
  id: string;
  module: string;
  occurredAt: string;
};

const CHANGE_EVENT = 'obra360:workspace-change';
const RESYNC_EVENT = 'obra360:workspace-resync';

export function onWorkspaceChange(listener: (change: WorkspaceChange) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<WorkspaceChange>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function onWorkspaceResync(listener: () => void): () => void {
  window.addEventListener(RESYNC_EVENT, listener);
  return () => window.removeEventListener(RESYNC_EVENT, listener);
}

function emitChange(change: WorkspaceChange) {
  window.dispatchEvent(new CustomEvent<WorkspaceChange>(CHANGE_EVENT, { detail: change }));
}

function emitResync() {
  window.dispatchEvent(new Event(RESYNC_EVENT));
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = window.setTimeout(done, ms);
    function done() {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}

function dispatchSessionExpired() {
  sessionStorage.removeItem('obra360_access_token');
  window.dispatchEvent(new Event('obra360:session-expired'));
}

async function readStream(response: Response, signal: AbortSignal): Promise<void> {
  if (!response.body) throw new Error('O stream não forneceu um corpo de leitura.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseWorkspaceSseFrames(buffer);
      buffer = parsed.remainder;
      for (const frame of parsed.events) {
        if (frame.event === 'workspace-change' && frame.data) {
          try {
            emitChange(JSON.parse(frame.data) as WorkspaceChange);
          } catch {
            // Ignore malformed frames; the reconnect path performs a full resync.
          }
        }
      }
      if (buffer.length > 64 * 1024) throw new Error('Frame SSE excedeu o limite permitido.');
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

/** Connects to the authenticated server stream and refreshes active views after reconnects. */
export async function connectWorkspaceRealtime(signal: AbortSignal): Promise<void> {
  if (DEMO_MODE) return;
  let attempt = 0;
  let connectedOnce = false;
  while (!signal.aborted) {
    const token = sessionStorage.getItem('obra360_access_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/v1/workspace/eventos`, {
        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal,
      });
      if (response.status === 401) {
        dispatchSessionExpired();
        return;
      }
      if (response.status === 403) return;
      if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream'))
        throw new Error(`Stream de atualização indisponível (${response.status}).`);

      if (connectedOnce) emitResync();
      connectedOnce = true;
      attempt = 0;
      await readStream(response, signal);
    } catch {
      if (signal.aborted) return;
    }
    if (!signal.aborted) {
      attempt++;
      await wait(Math.min(15_000, 750 * 2 ** Math.min(attempt, 5)), signal);
    }
  }
}
