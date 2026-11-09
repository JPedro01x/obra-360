const target = process.argv[2] || process.env.APP_PUBLIC_URL || '';
const url = URL.canParse(target) ? new URL(target) : null;
if (!url || url.protocol !== 'https:' || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash) {
  console.error('Informe a origem HTTPS do Obra360, sem caminho, credenciais ou parâmetros.');
  process.exit(2);
}

const started = performance.now();
let status;
let ready = false;
let error;
try {
  const response = await fetch(new URL('/actuator/health/readiness', url), {
    headers: { Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  });
  status = response.status;
  ready = status === 200 && (await response.json()).status === 'UP';
} catch (failure) {
  error = failure.name === 'TimeoutError' ? 'tempo limite' : 'falha de conexão ou resposta inválida';
}

console.log(JSON.stringify({
  origem: url.origin,
  pronto: ready,
  http: status ?? null,
  latenciaMs: Math.round(performance.now() - started),
  ...(error ? { erro: error } : {}),
}));
process.exitCode = ready ? 0 : 1;
