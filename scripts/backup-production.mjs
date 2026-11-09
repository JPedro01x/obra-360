import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, open, readFile, rmdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const backups = path.resolve(root, process.env.OBRA360_BACKUP_DIR || 'backups/production');
const envFile = path.resolve(root, process.env.OBRA360_COMPOSE_ENV || '.env.production');
const compose = ['compose', '--env-file', envFile, '-f', path.join(root, 'deploy/compose.production.yml')];

async function command(program, args, { input, output, capture = false, quiet = false } = {}) {
  const source = input && await open(input, 'r');
  const target = output && await open(output, 'wx', 0o600);
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(program, args, {
        cwd: root,
        windowsHide: true,
        stdio: [source?.fd ?? 'ignore', target?.fd ?? (capture ? 'pipe' : quiet ? 'ignore' : 'inherit'), 'inherit'],
      });
      let stdout = '';
      child.stdout?.on('data', (chunk) => { stdout += chunk; });
      child.once('error', reject);
      child.once('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(`${program} retornou código ${code}.`)));
    });
  } finally {
    await source?.close();
    await target?.close();
  }
}
const docker = (args, options) => command('docker', [...compose, ...args], options);
async function checksum(filename) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

if (process.argv[2] === '--verify') {
  const directory = process.argv[3];
  if (!directory || process.argv.length !== 4) throw new Error('Use --verify <pasta-do-backup>.');
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifesto.json'), 'utf8'));
  if (manifest.format !== 1) throw new Error('Formato do manifesto de backup não reconhecido.');
  for (const name of ['postgres.dump', 'documentos.tar.gz']) {
    const filename = path.join(directory, name);
    const metadata = manifest.files?.[name];
    const info = await lstat(filename);
    if (!info.isFile() || info.size === 0 || metadata?.bytes !== info.size ||
        !/^[a-f0-9]{64}$/.test(metadata.sha256) || await checksum(filename) !== metadata.sha256) {
      throw new Error(`Backup inválido: ${name} difere do manifesto.`);
    }
  }
  console.log('Tamanhos e SHA-256 do backup conferidos.');
  process.exit(0);
}

if (!process.argv.includes('--janela-de-manutencao')) {
  throw new Error('Execute com --janela-de-manutencao para permitir a pausa do serviço durante a cópia.');
}
await mkdir(backups, { recursive: true, mode: 0o700 });
const lock = path.join(backups, '.backup-lock');
await mkdir(lock);
const id = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(backups, id);
const db = path.join(output, 'postgres.dump');
const files = path.join(output, 'documentos.tar.gz');
let restart = false;
try {
  const running = (await docker(['ps', '--status', 'running', '-q', 'app'], { capture: true })).trim();
  if (!running || running.split(/\r?\n/).length !== 1) {
    throw new Error('A rotina exige exatamente uma instância da aplicação em execução.');
  }
  await mkdir(output, { mode: 0o700 });
  restart = true;
  await docker(['stop', 'app']);
  await docker(['exec', '-T', 'db', 'pg_dump', '-U', 'obra360', '-d', 'obra360',
    '--format=custom', '--no-owner', '--no-acl'], { output: db });
  await docker(['exec', '-T', 'db', 'pg_restore', '--list'], { input: db, quiet: true });
  await docker(['run', '--rm', '--no-deps', '-T', '--entrypoint', 'tar', 'app', '-czf', '-', '-C', '/app/data', '.'], { output: files });
  await command('tar', ['-tzf', files], { quiet: true });
  const manifest = {};
  for (const file of [db, files]) manifest[path.basename(file)] = { bytes: (await stat(file)).size, sha256: await checksum(file) };
  await writeFile(path.join(output, 'manifesto.json'), JSON.stringify({ format: 1, id, files: manifest }, null, 2) + '\n', { mode: 0o600 });
  console.log(`Backup concluído: ${output}`);
} finally {
  try {
    if (restart) await docker(['start', 'app']);
  } finally {
    await rmdir(lock);
  }
}
