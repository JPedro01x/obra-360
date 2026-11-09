import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { loadProjectEnv } from './load-env.mjs';

async function key(root) {
  const env = await loadProjectEnv(root);
  const raw = Buffer.from(env.MFA_ENCRYPTION_KEY || '', 'base64');
  if (raw.length !== 32)
    throw new Error('Configure a segurança local antes de acessar as credenciais de homologação.');
  return Buffer.from(
    hkdfSync('sha256', raw, Buffer.alloc(0), 'obra360-homologacao-credentials-v1', 32),
  );
}
export async function readCredentials(root) {
  const envelope = JSON.parse(await readFile(path.join(root, 'ACESSO-HOMOLOGACAO.local'), 'utf8'));
  // Compatibility is only for migrating the former local file; every write encrypts it.
  if (Array.isArray(envelope.contas)) return envelope;
  if (envelope.formato !== 'obra360-credenciais-v1')
    throw new Error('Formato de credenciais desconhecido.');
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      await key(root),
      Buffer.from(envelope.nonce, 'base64'),
    );
    decipher.setAAD(Buffer.from(envelope.formato));
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.conteudo, 'base64')),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8'));
  } catch {
    throw new Error(
      'Não foi possível abrir as credenciais. Confira a chave privada e a integridade do arquivo.',
    );
  }
}
export async function writeCredentials(root, credentials) {
  const nonce = randomBytes(12),
    formato = 'obra360-credenciais-v1';
  const cipher = createCipheriv('aes-256-gcm', await key(root), nonce);
  cipher.setAAD(Buffer.from(formato));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), 'utf8'),
    cipher.final(),
  ]);
  const envelope = {
    formato,
    algoritmo: 'AES-256-GCM',
    nonce: nonce.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    conteudo: encrypted.toString('base64'),
  };
  const target = path.join(root, 'ACESSO-HOMOLOGACAO.local');
  const temporary = path.join(root, `.credenciais-${randomBytes(12).toString('hex')}.local`);
  await writeFile(temporary, JSON.stringify(envelope, null, 2), { mode: 0o600, flag: 'wx' });
  await rename(temporary, target);
}
