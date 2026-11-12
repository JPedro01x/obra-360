import { cp, mkdir, readdir, readFile, writeFile, rename, stat, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function inside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative) || !relative)
    throw new Error('Caminho fora do diretório permitido.');
  return path.resolve(target);
}
async function files(root, prefix = '') {
  const result = [];
  for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Links simbólicos não são aceitos no backup.');
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...(await files(root, relative)));
    else if (entry.isFile()) result.push(relative);
  }
  return result.sort();
}
const digest = async (filename) =>
  createHash('sha256')
    .update(await readFile(filename))
    .digest('hex');
export async function createBackup(data, backups) {
  const id = new Date().toISOString().replace(/[:]/g, '-');
  const destination = inside(backups, path.join(backups, id));
  if (!(await stat(path.join(data, 'obra360.mv.db'))).isFile())
    throw new Error('Banco local não encontrado.');
  const sourceFiles = await files(data);
  await mkdir(backups, { recursive: true });
  await mkdir(destination);
  await cp(data, path.join(destination, 'data'), {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  const hashes = {};
  for (const file of sourceFiles) hashes[file] = await digest(path.join(destination, 'data', file));
  await writeFile(
    path.join(destination, 'manifest.json'),
    JSON.stringify({ format: 1, createdAt: new Date().toISOString(), files: hashes }, null, 2),
  );
  return id;
}
export async function verifyBackup(backups, id) {
  if (!/^[0-9TZ.\-]+$/.test(id)) throw new Error('Identificador de backup inválido.');
  const snapshot = inside(backups, path.join(backups, id));
  for (const directory of [snapshot, path.join(snapshot, 'data')]) {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Diretório de backup inválido.');
  }
  const metadata = await lstat(path.join(snapshot, 'manifest.json'));
  if (!metadata.isFile() || metadata.isSymbolicLink()) throw new Error('Manifesto inválido.');
  const manifest = JSON.parse(await readFile(path.join(snapshot, 'manifest.json'), 'utf8'));
  if (manifest.format !== 1 || !manifest.files || !Object.hasOwn(manifest.files, 'obra360.mv.db'))
    throw new Error('Manifesto inválido.');
  const actual = await files(path.join(snapshot, 'data'));
  if (JSON.stringify(actual) !== JSON.stringify(Object.keys(manifest.files).sort()))
    throw new Error('A lista de arquivos difere do manifesto.');
  for (const file of actual) {
    const filename = inside(path.join(snapshot, 'data'), path.join(snapshot, 'data', file));
    if ((await digest(filename)) !== manifest.files[file])
      throw new Error('Backup corrompido: ' + file);
  }
  return { id, createdAt: manifest.createdAt, arquivos: actual.length };
}
export async function restoreBackup(data, backups, id) {
  await verifyBackup(backups, id);
  const snapshot = inside(backups, path.join(backups, id));
  const parent = path.dirname(path.resolve(data));
  const destination = inside(parent, data);
  const stage = inside(parent, path.join(parent, 'data-restore-' + Date.now()));
  const previous = inside(parent, path.join(parent, 'data-before-restore-' + Date.now()));
  await cp(path.join(snapshot, 'data'), stage, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  let moved = false;
  try {
    await stat(destination);
    await rename(destination, previous);
    moved = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await rename(stage, destination);
  } catch (error) {
    if (moved) await rename(previous, destination);
    throw error;
  }
  return moved ? previous : null;
}
async function serverRunning() {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: 8080 });
    const finish = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(1000, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = fileURLToPath(new URL('../', import.meta.url));
    const data = inside(root, path.join(root, 'obra360-backend', 'data'));
    const backups = inside(root, path.join(root, 'backups'));
    if (process.argv[2] !== 'verify' && await serverRunning())
      throw new Error('Encerre a API local antes de criar ou restaurar o backup.');
    if (process.argv[2] === 'verify' && process.argv.length === 4)
      console.log(JSON.stringify(await verifyBackup(backups, process.argv[3]), null, 2));
    else if (process.argv[2] === 'create')
      console.log('Backup criado: ' + (await createBackup(data, backups)));
    else if (process.argv[2] === 'restore' && process.argv.includes('--confirm'))
      console.log(
        'Backup restaurado. Base anterior preservada em: ' +
          ((await restoreBackup(data, backups, process.argv[3])) || 'não havia base anterior'),
      );
    else throw new Error('Use create, verify IDENTIFICADOR ou restore IDENTIFICADOR --confirm.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
