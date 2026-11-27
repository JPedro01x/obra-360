import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePilot } from './pilot-acceptance.mjs';
import { composeBuildEvidence, humanAcceptanceEvidence, parseComposeServices, readinessReportLocation, readinessStatus, sourceSnapshot, summarizeValidation } from './pilot-readiness-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = new Set(process.argv.slice(2));
const runChecks = !args.has('--no-validation');
const buildCompose = args.has('--build-compose');
const operatorConfirmedAcceptance = args.has('--confirm-human-acceptance');
const generatedAt = new Date().toISOString();
const snapshot = await sourceSnapshot(root);
const gitResult = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true });
const gitCommit = gitResult.status === 0 ? gitResult.stdout.trim() : null;
const dockerVersion = spawnSync('docker', ['compose', 'version', '--short'], { cwd: root, encoding: 'utf8', windowsHide: true });
const dockerAvailable = dockerVersion.status === 0;
const checks = [];
let composeImageId = null;
let composeServices = [];
let composeBuildAttempted = false;
let composeBuildExitCode = null;

function quoteForShell(value) {
  return `"${value.replaceAll('"', '\\"')}"`;
}
function execute(program, cmdArgs, { cwd = root, timeoutMs = 12 * 60 * 1000, capture = false } = {}) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : program;
    const commandArgs = process.platform === 'win32'
      ? ['/d', '/s', '/c', [program, ...cmdArgs].map((value) => /[\s&()]/.test(value) ? quoteForShell(value) : value).join(' ')]
      : cmdArgs;
    const child = spawn(command, commandArgs, { cwd, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', windowsHide: true, detached: process.platform !== 'win32' });
    let timedOut = false;
    let stdout = '';
    if (capture) child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    if (capture) child.stderr.resume();
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === 'win32') {
        const killed = spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { encoding: 'utf8', windowsHide: true });
        if (killed.error || killed.status !== 0) child.kill('SIGTERM');
      } else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
        setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Process group already exited. */ } }, 2500).unref();
      }
    }, timeoutMs);
    child.once('error', (error) => {
      clearTimeout(timer);
      resolve({ exitCode: null, signal: null, timedOut: false, startError: error.code || error.name });
    });
    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      resolve({ exitCode: code, signal, timedOut, stdout });
    });
  });
}
async function validate(name, program, cmdArgs, options) {
  const result = await execute(program, cmdArgs, options);
  checks.push(summarizeValidation({ name, ...result }));
}

if (runChecks) {
  await validate('TypeScript typecheck', 'npm', ['run', 'typecheck']);
  await validate('Frontend production build', 'npm', ['run', 'build']);
  await validate('Delivery policy and operator checks', 'npm', ['run', 'test:delivery-policy']);
  await validate('Low-end device performance journey', 'npm', ['run', 'test:performance']);
  await validate(
    'Backend Maven verification', 'mvn', ['verify', '--batch-mode'],
    { cwd: path.join(root, 'obra360-backend') },
  );
  await validate('Isolated PostgreSQL integration suite', 'npm', ['run', 'test:postgres']);
} else {
  checks.push({ name: 'Validações de código', status: 'PENDENTE', motivo: 'executadas com --no-validation' });
}
checks.push({
  name: 'Fonte vinculada a commit Git',
  status: gitCommit ? 'APROVADO' : 'PENDENTE',
  motivo: gitCommit ? 'commit registrado no manifesto' : 'esta cópia não tem metadados Git; repita a validação no checkout da main',
});

if (!dockerAvailable) {
  checks.push({ name: 'Docker Compose', status: 'PENDENTE', motivo: 'Docker Compose indisponível neste computador' });
  checks.push({ name: 'Compose service state', status: 'PENDENTE', motivo: 'Docker Compose indisponível neste computador' });
} else {
  const envPath = process.env.OBRA360_COMPOSE_ENV;
  if (!envPath) {
    checks.push({ name: 'Compose production config', status: 'PENDENTE', motivo: 'OBRA360_COMPOSE_ENV não aponta para o arquivo privado de produção' });
    checks.push({ name: 'Compose service state', status: 'PENDENTE', motivo: 'arquivo privado de produção não configurado' });
  } else {
    const compose = ['compose', '--env-file', path.resolve(envPath), '-f', 'deploy/compose.production.yml'];
    const result = await execute('docker', [...compose, 'config', '--quiet']);
    checks.push(result.startError
      ? { name: 'Compose production config', status: 'FALHOU', motivo: `não iniciou (${result.startError})` }
      : summarizeValidation({ name: 'Compose production config', ...result }));
    if (!result.startError && result.exitCode === 0 && !result.signal && !result.timedOut) {
      const serviceResult = await execute('docker', [...compose, 'ps', '--all', '--format', 'json'], { capture: true });
      if (!serviceResult.startError && serviceResult.exitCode === 0 && !serviceResult.signal && !serviceResult.timedOut) {
        try {
          composeServices = parseComposeServices(serviceResult.stdout);
          const running = composeServices.length > 0 && composeServices.every((service) => /^(running|up)(?:\b|$)/i.test(service.estado) && (!service.saudavel || service.saudavel === 'healthy'));
          checks.push({ name: 'Compose service state', status: running ? 'APROVADO' : composeServices.length ? 'FALHOU' : 'PENDENTE', ...(running ? {} : { motivo: composeServices.length ? 'um ou mais serviços não estão em execução/saudáveis' : 'nenhum serviço Compose está iniciado' }) });
        } catch {
          checks.push({ name: 'Compose service state', status: 'FALHOU', motivo: 'resposta de estado Compose inválida' });
        }
      } else {
        checks.push(summarizeValidation({ name: 'Compose service state', ...serviceResult }));
      }
    } else {
      checks.push({ name: 'Compose service state', status: 'PENDENTE', motivo: 'configuração Compose não aprovada' });
    }
    if (buildCompose && result.exitCode === 0 && !result.signal && !result.timedOut) {
      composeBuildAttempted = true;
      const buildResult = await execute('docker', [...compose, 'build', 'app'], { timeoutMs: 30 * 60 * 1000 });
      composeBuildExitCode = buildResult.exitCode;
      checks.push(buildResult.startError
        ? { name: 'Compose app image build', status: 'FALHOU', motivo: `não iniciou (${buildResult.startError})` }
        : summarizeValidation({ name: 'Compose app image build', ...buildResult }));
      if (buildResult.exitCode === 0 && !buildResult.signal && !buildResult.timedOut) {
        const identity = await execute('docker', [...compose, 'images', '--quiet', 'app'], { capture: true });
        composeImageId = identity.exitCode === 0 && !identity.signal && !identity.timedOut ? identity.stdout.trim().split(/\s+/)[0] || null : null;
        checks.push({ name: 'Compose app image identity', status: composeImageId ? 'APROVADO' : 'FALHOU', ...(composeImageId ? {} : { motivo: 'ID da imagem Compose não retornado' }) });
      }
    } else if (buildCompose) {
      checks.push({ name: 'Compose app image build', status: 'PENDENTE', motivo: 'configuração Compose não aprovada' });
    } else {
      checks.push({ name: 'Compose app image build', status: 'PENDENTE', motivo: 'use --build-compose para construir a imagem usada no Compose' });
    }
  }
}

const pilotPath = process.env.PRODUCTION_PILOT_REPORT;
let pilotApproval = false;
if (pilotPath) {
  try {
    const report = JSON.parse(await readFile(path.resolve(pilotPath), 'utf8'));
    pilotApproval = validatePilot(report).aceiteDeclaradoCompleto;
  } catch { /* Invalid or unavailable evidence remains pending. */ }
}
const humanAcceptance = humanAcceptanceEvidence({ reportComplete: pilotApproval, operatorConfirmed: operatorConfirmedAcceptance });
checks.push({ name: 'Aceite humano do piloto', ...humanAcceptance });
checks.push({ name: 'Ensaio de restauração em pré-produção', status: process.env.PRODUCTION_BACKUP_VERIFIED === 'true' ? 'APROVADO' : 'PENDENTE', motivo: process.env.PRODUCTION_BACKUP_VERIFIED === 'true' ? 'declaração do operador; validar evidência no ambiente' : 'não declarado pelo operador' });

const { absolute: reportPath, relative: reportRelativePath } = readinessReportLocation(root, generatedAt);
const report = {
  formato: 'obra360-pilot-readiness-v1',
  versaoProjeto: JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version,
  relatorioRelativo: reportRelativePath,
  geradoEm: generatedAt,
  status: readinessStatus(checks),
  fonte: { sha256: snapshot.sha256, arquivos: snapshot.fileCount, commitGit: gitCommit },
  implantacao: {
    caminhoConfiguradoParaCompose: 'imagem Docker construída a partir de Dockerfile e deploy/compose.production.yml deste snapshot',
    dockerComposeDisponivel: dockerAvailable,
    dockerComposeVersao: dockerAvailable ? dockerVersion.stdout.trim() : null,
    ...composeBuildEvidence({ buildRequested: composeBuildAttempted, buildExitCode: composeBuildExitCode, imageId: composeImageId }),
    dockerfileSha256: await createHash('sha256').update(await readFile(path.join(root, 'Dockerfile'))).digest('hex'),
    composeSha256: await createHash('sha256').update(await readFile(path.join(root, 'deploy/compose.production.yml'))).digest('hex'),
    servicosCompose: composeServices,
  },
  checks,
  aceiteHumano: {
    ...humanAcceptance,
    autenticidadeVerificadaIndependentemente: false,
  },
  limitacao: 'Relatório técnico local. Não publica o sistema, não confirma credenciais/infraestrutura externa e não substitui revisão de segurança, restauração acompanhada ou aceite dos usuários do piloto.',
};
const resultsDirectory = path.join(root, 'test-results');
await mkdir(resultsDirectory, { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
console.log(`Relatório: ${path.relative(root, reportPath)}`);
console.log(`Snapshot SHA-256: ${snapshot.sha256}; Git: ${gitCommit || 'indisponível nesta cópia'}`);
console.log(`Status: ${report.status}`);
for (const check of checks) console.log(`${check.status}: ${check.name}${check.motivo ? ` — ${check.motivo}` : ''}`);
process.exitCode = report.status === 'APTO_PARA_REVISAO_DO_PILOTO' ? 0 : 1;
