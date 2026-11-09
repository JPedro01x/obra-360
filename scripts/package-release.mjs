import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const commit = git('rev-parse', 'HEAD').trim();
const id = `obra360-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const output = path.join(root, 'releases', id);
const source = path.join(output, 'source');
const bundle = path.join(output, 'bundle');
const rootFiles = new Set([
  '.dockerignore', '.gitignore', '.prettierrc.json', '.env.example', '.env.demo', 'Dockerfile',
  'README.md', 'index.html', 'package.json', 'package-lock.json', 'tsconfig.json',
  'postcss.config.js', 'tailwind.config.js', 'vite.config.ts', 'playwright.config.ts',
  'playwright.demo.config.ts', 'playwright.integrated.config.ts', 'playwright.roles.config.ts',
]);
const isSource = (name) => rootFiles.has(name) ||
  /^(?:src|public|scripts|tests|docs|deploy|\.github\/workflows)\//.test(name) ||
  /^obra360-backend\/(?:src\/|(?:pom\.xml|Dockerfile|docker-compose\.yml|\.env\.example)$)/.test(name);
const privateName = /(?:^|\/)(?:\.env(?:\.[^/]+)?|[^/]+\.(?:local|pem|key|p12|pfx|jks|mv\.db|dump))$/i;
const safeEnv = new Set(['.env.example', '.env.demo', 'obra360-backend/.env.example']);
const sha = async (filename) => createHash('sha256').update(await readFile(filename)).digest('hex');

function run(program, args, cwd = root, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, { cwd, env, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${program} encerrou com código ${code}.`)));
  });
}
function buildCommand(program, args, cwd, env) {
  return process.platform === 'win32'
    ? run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', [program, ...args].join(' ')], cwd, env)
    : run(program, args, cwd, env);
}

await mkdir(path.join(root, 'releases'), { recursive: true });
await mkdir(output);
await mkdir(source);
await mkdir(bundle);
const sourceHashes = {};
const entries = [...new Set(git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0'))].sort();
for (const name of entries) {
  if (!isSource(name) || (privateName.test(name) && !safeEnv.has(name))) continue;
  if (name.split('/').some((part) => ['..', 'node_modules', 'target', 'dist'].includes(part))) continue;
  const from = path.join(root, name);
  const info = await lstat(from).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!info) continue; // Tracked file removed in this snapshot.
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Entrada inesperada na entrega: ${name}`);
  const target = path.join(source, name);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(from, target, { force: false, errorOnExist: true });
  sourceHashes[name] = await sha(target);
}
for (const required of ['package-lock.json', 'Dockerfile', 'deploy/compose.production.yml', 'obra360-backend/pom.xml', 'src/main.tsx']) {
  if (!sourceHashes[required]) throw new Error(`Arquivo obrigatório ausente: ${required}`);
}

await writeFile(path.join(source, 'FONTE-SHA256.json'), JSON.stringify(sourceHashes, null, 2) + '\n');
await run('tar', ['-czf', path.join(output, 'fonte.tar.gz'), '-C', source, '.']);
const frontendEnv = { ...process.env, VITE_USE_MOCK: 'false', VITE_API_URL: '/api' };
await Promise.all([
  (async () => {
    await buildCommand('npm', ['ci', '--prefer-offline', '--no-audit'], source, frontendEnv);
    await buildCommand('npm', ['run', 'build'], source, frontendEnv);
  })(),
  buildCommand('mvn', ['package', '-Dmaven.test.skip=true', '--batch-mode'],
    path.join(source, 'obra360-backend'), process.env),
]);
await cp(path.join(source, 'dist'), path.join(bundle, 'public'), { recursive: true });
await cp(path.join(source, 'obra360-backend', 'target', 'obra360-backend-1.0.0-SNAPSHOT.jar'), path.join(bundle, 'app.jar'));
await cp(path.join(source, 'docs'), path.join(bundle, 'docs'), { recursive: true });
await run('tar', ['-czf', path.join(output, 'obra360.tar.gz'), '-C', bundle, '.']);
const artifacts = {};
for (const filename of ['fonte.tar.gz', 'obra360.tar.gz']) artifacts[filename] = await sha(path.join(output, filename));
await writeFile(path.join(output, 'manifesto.json'), JSON.stringify({
  id, commitBase: commit, node: process.version, geradoEm: new Date().toISOString(), artifacts,
}, null, 2) + '\n');
console.log(`Entrega e manifesto em releases/${id}`);
