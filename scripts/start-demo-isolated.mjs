import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from './load-env.mjs';
import { useLocalJava21 } from './local-java.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const backend = path.join(root, 'obra360-backend');
const jar = path.join(backend, 'target/obra360-backend-1.0.0-SNAPSHOT.jar');
const sourceMode = process.argv.includes('--source');
const env = {
  ...(await loadProjectEnv(root)),
  SPRING_DATASOURCE_URL: 'jdbc:h2:file:./data/demonstracao/obra360-demo;MODE=PostgreSQL;DB_CLOSE_ON_EXIT=FALSE',
  SPRING_DATASOURCE_USERNAME: 'sa',
  SPRING_DATASOURCE_PASSWORD: '',
  OBRA360_STORAGE_DIRECTORY: './data/demonstracao/documentos',
  APP_PUBLIC_URL: 'http://127.0.0.1:3001',
  CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:3001,http://localhost:3001',
  OBRA360_PROXY_TARGET: 'http://127.0.0.1:8081',
  VITE_USE_MOCK: 'false',
};
const javaHome = await useLocalJava21();
const java = path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
if (!sourceMode) await access(jar).catch(() => { throw new Error('Gere primeiro o backend com Maven (package, sem executar testes) ou use --source.'); });
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (process.platform === 'win32')
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  process.exitCode = code;
}
function launch(command, args, cwd, childEnv) {
  const child = spawn(command, args, { cwd, env: childEnv, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.once('error', (error) => { console.error(`Falha ao iniciar demonstração: ${error.message}`); stop(1); });
  child.once('exit', (code) => { if (!stopping) stop(code || 0); });
  return child;
}
async function waitFor(url, label) {
  for (let i = 0; i < 120 && !stopping; i++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} não iniciou. Confira os logs exibidos neste terminal.`);
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

async function ensurePortAvailable(port) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(port, '127.0.0.1', resolve);
  }).catch((error) => {
    if (error?.code === 'EADDRINUSE')
      throw new Error(`A porta ${port} já está em uso; a demonstração não foi iniciada nem alterada.`);
    const reason = error?.code || error?.message || 'erro desconhecido';
    throw new Error(`Não foi possível verificar a porta ${port} (${reason}); a demonstração não foi iniciada nem alterada.`);
  });
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
}

await Promise.all([ensurePortAvailable(8081), ensurePortAvailable(3001)]);

if (sourceMode) {
  const mavenArgs = ['-o', 'spring-boot:run', '-Dspring-boot.run.profiles=local', '-Dspring-boot.run.arguments=--server.address=127.0.0.1,--server.port=8081'];
  if (process.platform === 'win32') {
    const commandLine = `mvn ${mavenArgs.map((arg) => /\s/.test(arg) ? `"${arg}"` : arg).join(' ')}`;
    launch(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', commandLine], backend, env);
  } else launch('mvn', mavenArgs, backend, env);
} else {
  launch(java, ['-Xmx768m', '-jar', jar, '--spring.profiles.active=local', '--server.address=127.0.0.1', '--server.port=8081'], backend, env);
}
try {
  await waitFor('http://127.0.0.1:8081/actuator/health', 'API da demonstração');
  const vite = path.join(root, 'node_modules/vite/bin/vite.js');
  launch(process.execPath, [vite, '--host', '127.0.0.1', '--port', '3001', '--strictPort'], root, env);
  await waitFor('http://127.0.0.1:3001/', 'Interface da demonstração');
  console.log('Demonstração isolada pronta em http://127.0.0.1:3001 (API: http://127.0.0.1:8081).');
} catch (error) {
  console.error(error.message);
  stop(1);
}
