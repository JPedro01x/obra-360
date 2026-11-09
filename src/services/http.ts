const env = (import.meta as ImportMeta & { env: Record<string, string> }).env;
export const DEMO_MODE = env.VITE_USE_MOCK === 'true';
export const API_BASE_URL = (env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function requestApi<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 15000,
  responseType: 'json' | 'blob' = 'json',
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const token = sessionStorage.getItem('obra360_access_token');
  const publicEndpoint = [
    '/v1/auth/login',
    '/v1/auth/aceitar-convite',
    '/v1/auth/configuracao',
    '/v1/auth/google',
    '/v1/auth/google/nonce',
    '/v1/auth/recuperar',
    '/v1/auth/redefinir',
    '/v1/instalacao',
  ].includes(path);
  if (token && !publicEndpoint) headers.set('Authorization', `Bearer ${token}`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 401 && headers.has('Authorization')) {
        sessionStorage.removeItem('obra360_access_token');
        window.dispatchEvent(new Event('obra360:session-expired'));
      }
      const messages: Record<number, string> = {
        400: 'Confira os campos informados.',
        401: 'E-mail ou senha inválidos, ou sessão expirada.',
        403: 'Você não tem permissão para esta operação.',
        404: 'Recurso não encontrado.',
        409: 'O registro já existe ou foi alterado. Atualize e tente novamente.',
        413: 'O arquivo excede o limite de 20 MB.',
        429: 'Muitas tentativas. Aguarde antes de tentar novamente.',
        503: 'Serviço indisponível. Tente novamente em instantes.',
      };
      const problem = await response.json().catch(() => null);
      const detail =
        [400, 403, 409, 503].includes(response.status) &&
        typeof problem?.detail === 'string' &&
        problem.detail.length <= 300
          ? problem.detail
          : null;
      throw new ApiError(
        detail || messages[response.status] || 'Não foi possível concluir a operação no servidor.',
        response.status,
        typeof problem?.code === 'string' ? problem.code : undefined,
      );
    }
    if (response.status === 204) return undefined as T;
    if (responseType === 'blob') return (await response.blob()) as T;
    const content = await response.text();
    return content ? (JSON.parse(content) as T) : (undefined as T);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.',
    );
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}
