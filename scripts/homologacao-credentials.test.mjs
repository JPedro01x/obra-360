import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { readCredentials, writeCredentials } from './homologacao-credentials.mjs';

test('private credentials reject tampering and a different encryption key', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'obra360-credentials-'));
  const saved = process.env.MFA_ENCRYPTION_KEY;
  delete process.env.MFA_ENCRYPTION_KEY;
  try {
    await mkdir(path.join(root, 'obra360-backend'));
    const env = path.join(root, 'obra360-backend', '.env');
    await writeFile(env, `MFA_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}\n`);
    const credentials = {
      contas: [{ perfil: 'RH', email: 'test@test.invalid', senha: 'SenhaExclusivaTeste@12345' }],
    };
    const target = path.join(root, 'ACESSO-HOMOLOGACAO.local');
    await writeFile(target, JSON.stringify(credentials));
    assert.deepEqual(await readCredentials(root), credentials);
    await writeCredentials(root, credentials);
    const original = await readFile(target, 'utf8');
    assert(!original.includes(credentials.contas[0].senha));
    assert(!original.includes(credentials.contas[0].email));
    assert.deepEqual(await readCredentials(root), credentials);
    const modified = JSON.parse(original);
    modified.tag = Buffer.alloc(16).toString('base64');
    await writeFile(target, JSON.stringify(modified));
    await assert.rejects(() => readCredentials(root), /integridade/);
    await writeFile(target, original);
    await writeFile(env, `MFA_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}\n`);
    await assert.rejects(() => readCredentials(root), /chave privada/);
  } finally {
    if (saved === undefined) delete process.env.MFA_ENCRYPTION_KEY;
    else process.env.MFA_ENCRYPTION_KEY = saved;
    assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()));
    assert(path.basename(root).startsWith('obra360-credentials-'));
    await rm(root, { recursive: true, force: true });
  }
});
