import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { validatePilot } from './pilot-acceptance.mjs';
import { loadProjectEnv } from './load-env.mjs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...(await loadProjectEnv(root)), ...process.env };
const checks = [];
const add = (item, ok) => checks.push({ item, status: ok ? 'OK' : 'PENDENTE' });
const profiles = (env.SPRING_PROFILES_ACTIVE || '').split(',').map((profile) => profile.trim());
function httpsOrigin(value) {
  if (!value || /[*\s]/.test(value) || !URL.canParse(value)) return false;
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password &&
    (value === url.origin || value === url.origin + '/');
}
add(
  'PostgreSQL configurado',
  /^jdbc:postgresql:\/\//.test(env.SPRING_DATASOURCE_URL || '') &&
    !!env.SPRING_DATASOURCE_USERNAME &&
    !!env.SPRING_DATASOURCE_PASSWORD,
);
add(
  'Perfil de produção explícito',
  profiles.includes('prod') && !profiles.some((p) => ['local', 'dev', 'operador'].includes(p)),
);
add(
  'JWT persistente com 32 bytes ou mais',
  Buffer.byteLength(env.JWT_SECRET || '') >= 32 &&
    !/e2e|test|example|changeme/i.test(env.JWT_SECRET || ''),
);
add('Modo demonstrativo desativado', env.VITE_USE_MOCK === 'false');
add('Instalação inicial desabilitada', env.OBRA360_SETUP_ENABLED === 'false');
add('URL pública HTTPS', httpsOrigin(env.APP_PUBLIC_URL));
const origins = (env.CORS_ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean);
add(
  'Origens CORS HTTPS explícitas',
  origins.length > 0 && origins.every((origin) => httpsOrigin(origin) && !origin.endsWith('/')),
);
add(
  'Recuperação por e-mail configurada',
  env.EMAIL_ENABLED === 'true' && !!env.SMTP_HOST && !!env.EMAIL_FROM && !!env.APP_PUBLIC_URL,
);
add(
  'Armazenamento declarado',
  !!env.OBRA360_STORAGE_DIRECTORY,
);
add('Backup e restauração homologados pelo operador', env.PRODUCTION_BACKUP_VERIFIED === 'true');
let pilot = { aceiteDeclaradoCompleto: false };
if (env.PRODUCTION_PILOT_REPORT) {
  try { pilot = validatePilot(JSON.parse(await readFile(path.resolve(root, env.PRODUCTION_PILOT_REPORT), 'utf8'))); }
  catch { /* A missing or malformed acceptance report is never treated as approved. */ }
}
add('Relatório de aceite do piloto preenchido com versão, responsáveis e evidências', pilot.aceiteDeclaradoCompleto);
console.log(
  JSON.stringify(
    {
      configuracaoApta: checks.every((c) => c.status === 'OK'),
      checks,
      observacao:
        'Verificação de configuração. Não comprova credenciais, segurança independente, conformidade jurídica, desempenho ou aceite real do cliente.',
    },
    null,
    2,
  ),
);
process.exitCode = checks.every((c) => c.status === 'OK') ? 0 : 1;
