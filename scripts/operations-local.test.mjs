import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createBackup, verifyBackup } from './backup.mjs';
import { diagnoseLocal } from './operations-local.mjs';
import { java21Home } from './local-java.mjs';

const healthyFetch = async url => url.includes('/registros/') ? new Response('', { status: 401 })
  : new Response(JSON.stringify(url.includes('/instalacao') ? { necessaria: false } : { status: 'UP' }));
const ampleDisk = async () => ({ bavail: 10 * 1024 ** 3, bsize: 1 });

test('local diagnosis checks availability, protected data and actual backup hashes', async () => {
  const parent = path.resolve(tmpdir());
  const root = await mkdtemp(path.join(parent, 'obra360-ops-'));
  const data = path.join(root, 'obra360-backend/data');
  const backups = path.join(root, 'backups');
  try {
    await mkdir(data, { recursive: true });
    await writeFile(path.join(data, 'obra360.mv.db'), 'synthetic-fixture');
    const options = { root, fetchImpl: healthyFetch, disk: ampleDisk };
    assert.equal((await diagnoseLocal(options)).saudavel, false);
    const id = await createBackup(data, backups);
    const metadata = await verifyBackup(backups, id);
    const good = await diagnoseLocal(options);
    assert.equal(good.saudavel, true);
    assert.equal(good.checks.find(c => c.id === 'backup').arquivosConferidos, 1);
    const exposed = await diagnoseLocal({ ...options, fetchImpl: async () => new Response('{}') });
    assert.equal(exposed.saudavel, false);
    assert.equal(exposed.checks.find(c => c.id === 'consulta_protegida').status, 'ATENCAO');
    const offline = await diagnoseLocal({ ...options, fetchImpl: async () => { throw new Error('offline'); } });
    assert.equal(offline.checks.find(c => c.id === 'api').status, 'ATENCAO');
    const fullDisk = await diagnoseLocal({ ...options, disk: async () => ({ bavail: 1, bsize: 1024 }) });
    assert.equal(fullDisk.checks.find(c => c.id === 'disco').status, 'ATENCAO');
    const expired = await diagnoseLocal({ ...options, now: Date.parse(metadata.createdAt) + 49 * 3600000 });
    assert.equal(expired.checks.find(c => c.id === 'backup').status, 'ATENCAO');
    await writeFile(path.join(backups, id, 'data/obra360.mv.db'), 'tampered');
    assert.equal((await diagnoseLocal(options)).checks.find(c => c.id === 'backup').status, 'ATENCAO');
    assert.equal(await readFile(path.join(data, 'obra360.mv.db'), 'utf8'), 'synthetic-fixture');
  } finally {
    assert.equal(path.dirname(root), parent); assert(path.basename(root).startsWith('obra360-ops-'));
    await rm(root, { recursive: true, force: true });
  }
});
test('local launcher selects Java 21 instead of accepting an incompatible runtime', () => {
  assert.equal(java21Home('    java.home = C:\\Java\\jdk-21\nopenjdk version "21.0.12"'), 'C:\\Java\\jdk-21');
  assert.equal(java21Home('    java.home = C:\\Java\\jdk-25\nopenjdk version "25.0.1"'), null);
  assert.equal(java21Home('command not found'), null);
});
