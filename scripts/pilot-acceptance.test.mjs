import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pilotTemplate, validatePilot } from './pilot-acceptance.mjs';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function declaredReport() {
  const report = pilotTemplate();
  report.empresa = { nome: 'Empresa sintética do teste', cnpj: '12345678000190' };
  report.versao = 'versao-sintetica-teste';
  for (const row of report.cenarios) Object.assign(row, {
    resultado: 'APROVADO', responsavel: 'Responsável sintético',
    aprovadoEm: '2026-01-01T12:00:00Z', evidencia: 'Referência sintética do teste',
  });
  return report;
}
const now = new Date('2026-11-11T15:00:00Z');
test('empty template never represents a completed pilot', () => {
  const result = validatePilot(pilotTemplate(), now);
  assert.equal(result.aceiteDeclaradoCompleto, false);
  assert.equal(result.pendencias.length, 15);
});
test('approval requires every scenario, owner, evidence, version and actual date', () => {
  assert.equal(validatePilot(declaredReport(), now).aceiteDeclaradoCompleto, true);
  for (const mutate of [
    r => r.cenarios.pop(), r => r.cenarios.push(r.cenarios[0]),
    r => { r.cenarios[0].resultado = 'REPROVADO'; },
    r => { r.cenarios[0].evidencia = ' '; }, r => { r.cenarios[0].responsavel = ''; },
    r => { r.cenarios[0].aprovadoEm = '2027-01-01T12:00:00Z'; },
    r => { r.cenarios[0].aprovadoEm = null; }, r => { r.versao = ''; },
  ]) { const report = declaredReport(); mutate(report); assert.equal(validatePilot(report, now).aceiteDeclaradoCompleto, false); }
});
test('malformed documents are reported as pending without crashing', () => {
  for (const report of [null, {}, { cenarios: [null] }])
    assert.equal(validatePilot(report, now).aceiteDeclaradoCompleto, false);
});

test('production check requires a complete report instead of a boolean acceptance flag', async () => {
  const temporaryRoot = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(temporaryRoot, 'obra360-pilot-test-'));
  const filename = path.join(directory, 'aceite.json');
  const command = fileURLToPath(new URL('./production-check.mjs', import.meta.url));
  const env = {
    ...process.env, SPRING_DATASOURCE_URL: 'jdbc:postgresql://127.0.0.1/synthetic',
    SPRING_DATASOURCE_USERNAME: 'synthetic', SPRING_DATASOURCE_PASSWORD: 'synthetic-only',
    SPRING_PROFILES_ACTIVE: 'prod', JWT_SECRET: 'v'.repeat(64), VITE_USE_MOCK: 'false',
    OBRA360_SETUP_ENABLED: 'false', APP_PUBLIC_URL: 'https://pilot.example.invalid',
    CORS_ALLOWED_ORIGINS: 'https://pilot.example.invalid', EMAIL_ENABLED: 'true',
    SMTP_HOST: 'smtp.example.invalid', EMAIL_FROM: 'sender@example.invalid',
    OBRA360_STORAGE_DIRECTORY: directory, PRODUCTION_BACKUP_VERIFIED: 'true',
    PRODUCTION_PILOT_ACCEPTED: 'true', PRODUCTION_PILOT_REPORT: '',
  };
  const run = () => spawnSync(process.execPath, [command], { env, encoding: 'utf8', timeout: 10000 });
  try {
    const bareFlag = run();
    assert.equal(bareFlag.status, 1);
    assert.equal(JSON.parse(bareFlag.stdout).checks.at(-1).status, 'PENDENTE');
    await writeFile(filename, JSON.stringify(declaredReport()));
    env.PRODUCTION_PILOT_REPORT = filename;
    const complete = run();
    assert.equal(complete.status, 0);
    assert.equal(JSON.parse(complete.stdout).configuracaoApta, true);
    assert.equal(complete.stdout.includes(env.JWT_SECRET), false);
    const incomplete = declaredReport(); incomplete.cenarios[0].evidencia = '';
    await writeFile(filename, JSON.stringify(incomplete));
    assert.equal(run().status, 1);
  } finally {
    if (path.dirname(directory) === temporaryRoot && path.basename(directory).startsWith('obra360-pilot-test-'))
      await rm(directory, { recursive: true, force: true });
  }
});
