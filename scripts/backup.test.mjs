import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createBackup, restoreBackup } from './backup.mjs';

test('backup restores database and documents, preserving the previous installation', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'obra360-backup-test-'));
  try {
    const data = path.join(root, 'data'),
      backups = path.join(root, 'backups');
    await mkdir(path.join(data, 'documentos'), { recursive: true });
    await writeFile(path.join(data, 'obra360.mv.db'), 'test database original');
    await writeFile(path.join(data, 'documentos', 'file'), 'test document');
    const id = await createBackup(data, backups);
    await writeFile(path.join(data, 'obra360.mv.db'), 'test database changed');
    const previous = await restoreBackup(data, backups, id);
    assert.equal(
      await readFile(path.join(data, 'obra360.mv.db'), 'utf8'),
      'test database original',
    );
    assert.equal(
      await readFile(path.join(previous, 'obra360.mv.db'), 'utf8'),
      'test database changed',
    );
    assert.equal(await readFile(path.join(data, 'documentos', 'file'), 'utf8'), 'test document');
    await writeFile(path.join(backups, id, 'data', 'documentos', 'file'), 'tampered');
    await assert.rejects(() => restoreBackup(data, backups, id), /corrompido/);
    await assert.rejects(() => restoreBackup(data, backups, '../outside'), /inválido/);
  } finally {
    const resolved = path.resolve(root),
      base = path.resolve(tmpdir());
    if (
      path.dirname(resolved) !== base ||
      !path.basename(resolved).startsWith('obra360-backup-test-')
    )
      throw new Error('Diretório de teste inesperado.');
    await rm(resolved, { recursive: true, force: true });
  }
});
