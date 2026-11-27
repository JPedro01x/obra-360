import { createHash } from 'node:crypto';
import { readdir, readFile, lstat } from 'node:fs/promises';
import path from 'node:path';

const ROOT_FILES = new Set([
  '.dockerignore', '.gitignore', '.prettierrc.json', '.env.example', '.env.demo',
  'Dockerfile', 'README.md', 'index.html', 'package.json', 'package-lock.json',
  'obra360-backend/pom.xml',
  'tsconfig.json', 'postcss.config.js', 'tailwind.config.js', 'vite.config.ts',
  'playwright.config.ts', 'playwright.demo.config.ts', 'playwright.integrated.config.ts',
  'playwright.roles.config.ts', 'playwright.atendimento.config.ts',
]);
const TREE_ROOTS = [
  'src', 'public', 'scripts', 'tests', 'docs', 'deploy', '.github/workflows',
  'obra360-backend/src',
];
const SKIP_DIRS = new Set(['node_modules', 'target', 'dist', 'test-results', 'playwright-report', 'releases']);
const PRIVATE_FILE = /(?:^|[\\/])(?:\.env(?:\.[^/]+)?|[^/\\]+\.(?:local|pem|key|p12|pfx|jks|mv\.db|dump))$/i;
const SAFE_ENV = new Set(['.env.example', '.env.demo', 'obra360-backend/.env.example']);

async function listFiles(root, relative) {
  const absolute = path.join(root, relative);
  const info = await lstat(absolute).catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
  if (!info) return [];
  if (info.isSymbolicLink()) throw new Error(`Link simbólico não permitido no snapshot: ${relative}`);
  if (info.isFile()) return [relative.replaceAll('\\', '/')];
  if (!info.isDirectory()) return [];
  const entries = await readdir(absolute, { withFileTypes: true });
  const results = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    results.push(...await listFiles(root, path.posix.join(relative.replaceAll('\\', '/'), entry.name)));
  }
  return results;
}

export async function sourceSnapshot(root) {
  const roots = [...ROOT_FILES, ...TREE_ROOTS];
  const names = new Set();
  for (const name of roots) for (const file of await listFiles(root, name)) names.add(file);
  const hash = createHash('sha256');
  const files = [...names].filter((name) =>
    (!PRIVATE_FILE.test(name) || SAFE_ENV.has(name)) &&
    !/^docs\/VALIDACAO-TECNICA-PILOTO-\d{4}-\d{2}-\d{2}\.md$/i.test(name),
  ).sort();
  for (const name of files) {
    hash.update(name).update('\0').update(await readFile(path.join(root, name))).update('\0');
  }
  return { sha256: hash.digest('hex'), fileCount: files.length, files };
}

export function summarizeValidation({ name, exitCode, signal = null, timedOut = false, startError = null }) {
  if (startError) return { name, status: 'FALHOU', motivo: `não iniciou (${startError})` };
  if (timedOut) return { name, status: 'FALHOU', motivo: 'tempo excedido' };
  if (signal) return { name, status: 'FALHOU', motivo: `interrompido (${signal})` };
  return { name, status: exitCode === 0 ? 'APROVADO' : 'FALHOU', codigo: exitCode };
}

export function parseComposeServices(output) {
  if (!output.trim()) return [];
  let rows;
  try { rows = JSON.parse(output); }
  catch { rows = output.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)); }
  if (!Array.isArray(rows)) rows = [rows];
  return rows.map((row) => ({
    nome: row.Service || row.Name || 'desconhecido',
    estado: row.State || row.Status || 'desconhecido',
    saudavel: row.Health || null,
  })).sort((a, b) => a.nome.localeCompare(b.nome));
}

export function humanAcceptanceEvidence({ reportComplete, operatorConfirmed }) {
  if (!reportComplete) return {
    status: 'PENDENTE',
    declaradoPeloOperador: false,
    motivo: 'relatório estruturalmente incompleto; confirmação não aceita',
  };
  if (!operatorConfirmed) return {
    status: 'PENDENTE',
    declaradoPeloOperador: false,
    motivo: 'use --confirm-human-acceptance após conferir as evidências do piloto',
  };
  return {
    status: 'APROVADO',
    declaradoPeloOperador: true,
    motivo: 'declaração explícita do operador; autenticidade das evidências não verificada independentemente',
  };
}

export function composeBuildEvidence({ buildRequested, buildExitCode, imageId }) {
  return {
    construidoNesteSnapshot: !buildRequested ? null : buildExitCode === 0 && Boolean(imageId),
    imagemComposeId: buildExitCode === 0 && imageId ? imageId : null,
  };
}

export function readinessReportLocation(root, generatedAt) {
  const filename = `pilot-readiness-${generatedAt.replaceAll(':', '-')}.json`;
  const absolute = path.join(root, 'test-results', filename);
  return { absolute, relative: path.relative(root, absolute).replaceAll('\\', '/') };
}

export function readinessStatus(checks) {
  if (checks.some((check) => check.status === 'FALHOU')) return 'FALHOU';
  return checks.every((check) => check.status === 'APROVADO') ? 'APTO_PARA_REVISAO_DO_PILOTO' : 'INCOMPLETO';
}
