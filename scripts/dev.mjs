import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadProjectEnv } from './load-env.mjs';
import { useLocalJava21 } from './local-java.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
Object.assign(process.env, await loadProjectEnv(root));
process.env.VITE_USE_MOCK = 'false';
await useLocalJava21();
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (process.platform === 'win32')
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    else child.kill('SIGTERM');
  }
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
function launch(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', (error) => {
    console.error(`Falha ao iniciar: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code || 0);
  });
  return child;
}

// Refuse to reuse an unknown server: it may point at another database.
try {
  await fetch('http://127.0.0.1:8080/actuator/health', { signal: AbortSignal.timeout(1000) });
  console.error(
    'A porta 8080 já está em uso. Encerre o servidor existente antes de iniciar esta instalação.',
  );
  process.exit(1);
} catch {}

console.log(
  'Iniciando API e banco local persistente. Primeiro início pode demorar para compilar o Java.',
);
const backendDir = path.join(root, 'obra360-backend');
if (process.platform === 'win32')
  launch(
    process.env.ComSpec || 'cmd.exe',
    [
      '/d',
      '/s',
      '/c',
      'mvn spring-boot:run -Dspring-boot.run.profiles=local -Dspring-boot.run.arguments=--server.address=127.0.0.1',
    ],
    backendDir,
  );
else
  launch(
    'mvn',
    [
      'spring-boot:run',
      '-Dspring-boot.run.profiles=local',
      '-Dspring-boot.run.arguments=--server.address=127.0.0.1',
    ],
    backendDir,
  );
let ready = false;
for (let attempt = 0; attempt < 120 && !stopping; attempt++) {
  try {
    const response = await fetch('http://127.0.0.1:8080/actuator/health', {
      signal: AbortSignal.timeout(1500),
    });
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!ready) {
  console.error('A API não iniciou. Confira o Java 21, Maven e os erros acima.');
  stop(1);
} else if (!stopping) {
  launch(
    process.execPath,
    [
      path.join(root, 'node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '3000',
      '--strictPort',
    ],
    root,
  );
}
