import { randomBytes } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadProjectEnv } from './load-env.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = await loadProjectEnv(root);
const file = new URL('../obra360-backend/.env', import.meta.url);
let existing = '';
try {
  existing = await readFile(file, 'utf8');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const lines = [];
for (const [name, value] of [
  ['JWT_SECRET', randomBytes(48).toString('base64')],
  ['MFA_ENCRYPTION_KEY', randomBytes(32).toString('base64')],
]) {
  if (!process.env[name] && !env[name]) {
    if (new RegExp(`^${name}=`, 'm').test(existing))
      throw new Error(`${name} existe vazio. Remova a linha vazia e execute novamente.`);
    lines.push(`${name}=${value}`);
  }
}
if (lines.length)
  await appendFile(
    file,
    `\n# Chaves locais privadas; preserve uma cópia segura fora do banco.\n${lines.join('\n')}\n`,
    { mode: 0o600 },
  );
console.log(
  lines.length
    ? 'Chaves locais configuradas em obra360-backend/.env. Nenhum segredo foi exibido. Reinicie o servidor.'
    : 'As chaves já estão configuradas; nenhum valor foi substituído.',
);
