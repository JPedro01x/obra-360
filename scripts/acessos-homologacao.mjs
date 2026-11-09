import { fileURLToPath } from 'node:url';
import { readCredentials } from './homologacao-credentials.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const credentials = await readCredentials(root);
const reveal = process.argv.includes('--mostrar-senhas');
const index = process.argv.indexOf('--perfil');
const role = index >= 0 ? process.argv[index + 1] : null;
const accounts = credentials.contas.filter((a) => !role || a.perfil === role);
if (!accounts.length) throw new Error('Perfil não encontrado.');
console.table(
  accounts.map((a) => ({
    perfil: a.perfil,
    email: a.email,
    ...(reveal ? { senha: a.senha } : {}),
  })),
);
if (!reveal)
  console.log(
    'Senhas protegidas. Para consultar uma conta no seu terminal privado, acrescente --perfil PERFIL --mostrar-senhas.',
  );
