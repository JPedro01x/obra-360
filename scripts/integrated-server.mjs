import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSmtpCapture } from './test-smtp.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const vite = path.join(root, 'node_modules/vite/bin/vite.js');
const output = path.join(root, 'test-results/integrated-dist');
const frontendEnvironment = {
  ...process.env,
  OBRA360_PROXY_TARGET: 'http://127.0.0.1:8081',
  VITE_USE_MOCK: 'false',
  VITE_API_URL: '/api',
};
const children = [];
let stopping = false;
let capture;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  capture?.close();
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
function start(command, args, cwd, env = process.env) {
  const child = spawn(command, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', (e) => {
    console.error(e.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code || 0);
  });
}
try {
  await fetch('http://127.0.0.1:8081/actuator/health', { signal: AbortSignal.timeout(1000) });
  console.error('A porta de teste 8081 já está em uso.');
  process.exit(1);
} catch {}
const build = spawnSync(process.execPath, [vite, 'build', '--outDir', output], {
  cwd: root, env: frontendEnvironment, stdio: 'inherit', windowsHide: true,
});
if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);
const testEnvironment = {
  ...process.env,
  SERVER_PORT: '8081',
  SERVER_ADDRESS: '127.0.0.1',
  SPRING_PROFILES_ACTIVE: 'dev',
  SPRING_DATASOURCE_URL: 'jdbc:h2:mem:obra360_e2e;DB_CLOSE_DELAY=-1;MODE=PostgreSQL',
  SPRING_DATASOURCE_USERNAME: 'sa',
  SPRING_DATASOURCE_PASSWORD: '',
  SPRING_DATASOURCE_DRIVER_CLASS_NAME: 'org.h2.Driver',
  SPRING_JPA_HIBERNATE_DDL_AUTO: 'update',
  OBRA360_STORAGE_DIRECTORY: './target/e2e-documents',
  OBRA360_SETUP_ENABLED: 'true',
  JWT_SECRET: 'e2e-only-secret-not-for-production-1234567890',
};
Object.assign(testEnvironment, {
  EMAIL_ENABLED: 'true',
  MFA_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: '1025',
  SMTP_USERNAME: '',
  SMTP_PASSWORD: '',
  SMTP_STARTTLS: 'false',
  SMTP_SSL: 'false',
  EMAIL_FROM: 'no-reply@test.invalid',
  APP_PUBLIC_URL: 'http://127.0.0.1:4175',
  DOCUMENT_STORAGE: 'local',
  AI_ENABLED: 'false',
  GOOGLE_CLIENT_ID: '',
  SEFAZ_ENABLED: 'false',
  OBRA360_SECURITY_REQUESTS_PER_MINUTE: '10000',
  CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:4175',
});
capture = await createSmtpCapture();
if (process.platform === 'win32')
  start(
    process.env.ComSpec || 'cmd.exe',
    ['/d', '/s', '/c', 'mvn spring-boot:run -Dspring-boot.run.profiles=dev'],
    path.join(root, 'obra360-backend'),
    testEnvironment,
  );
else
  start(
    'mvn',
    ['spring-boot:run', '-Dspring-boot.run.profiles=dev'],
    path.join(root, 'obra360-backend'),
    testEnvironment,
  );
let ready = false;
for (let i = 0; i < 120 && !stopping; i++) {
  try {
    // Readiness includes the actual installation query used by the first screen.
    const response = await fetch('http://127.0.0.1:8081/api/v1/instalacao', {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!ready) {
  console.error('A API de teste não iniciou.');
  stop(1);
} else if (!stopping)
  start(
    process.execPath,
    [
      vite,
      'preview',
      '--outDir',
      output,
      '--host',
      '127.0.0.1',
      '--port',
      '4175',
      '--strictPort',
    ],
    root,
    frontendEnvironment,
  );
