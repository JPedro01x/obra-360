import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { composeBuildEvidence, humanAcceptanceEvidence, parseComposeServices, readinessReportLocation, readinessStatus, sourceSnapshot, summarizeValidation } from './pilot-readiness-lib.mjs';

test('source snapshot is deterministic and changes with relevant source only', async () => {
  const parent = path.resolve(tmpdir());
  const root = await mkdtemp(path.join(parent, 'obra360-snapshot-'));
  try {
    await mkdir(path.join(root, 'src'));
    await mkdir(path.join(root, 'docs'));
    await mkdir(path.join(root, 'obra360-backend'));
    await mkdir(path.join(root, 'node_modules', 'ignored'), { recursive: true });
    await writeFile(path.join(root, 'src', 'a.ts'), 'one');
    await writeFile(path.join(root, 'docs', 'VALIDACAO-TECNICA-PILOTO-2026-11-27.md'), 'report references snapshot');
    await writeFile(path.join(root, 'obra360-backend', 'pom.xml'), '<project/>');
    await writeFile(path.join(root, '.env.production'), 'never include secrets');
    await writeFile(path.join(root, 'node_modules', 'ignored', 'b.js'), 'ignored');
    const first = await sourceSnapshot(root);
    assert.equal(first.fileCount, 2);
    assert.deepEqual(first.files, ['obra360-backend/pom.xml', 'src/a.ts']);
    assert.deepEqual(await sourceSnapshot(root), first);
    await writeFile(path.join(root, 'src', 'a.ts'), 'two');
    assert.notEqual((await sourceSnapshot(root)).sha256, first.sha256);
  } finally {
    if (path.dirname(root) === parent && path.basename(root).startsWith('obra360-snapshot-'))
      await rm(root, { recursive: true, force: true });
  }
});

test('compose service status accepts JSON array and line-delimited JSON', () => {
  assert.deepEqual(parseComposeServices('[{"Service":"app","State":"running","Health":"healthy"}]'), [
    { nome: 'app', estado: 'running', saudavel: 'healthy' },
  ]);
  assert.deepEqual(parseComposeServices('{"Name":"db","Status":"Up 1 minute"}\n'), [
    { nome: 'db', estado: 'Up 1 minute', saudavel: null },
  ]);
  assert.deepEqual(parseComposeServices(''), []);
});

test('human acceptance needs an explicit operator confirmation and a complete report', () => {
  assert.deepEqual(humanAcceptanceEvidence({ reportComplete: true, operatorConfirmed: false }), {
    status: 'PENDENTE',
    declaradoPeloOperador: false,
    motivo: 'use --confirm-human-acceptance após conferir as evidências do piloto',
  });
  assert.deepEqual(humanAcceptanceEvidence({ reportComplete: false, operatorConfirmed: true }), {
    status: 'PENDENTE',
    declaradoPeloOperador: false,
    motivo: 'relatório estruturalmente incompleto; confirmação não aceita',
  });
  assert.deepEqual(humanAcceptanceEvidence({ reportComplete: true, operatorConfirmed: true }), {
    status: 'APROVADO',
    declaradoPeloOperador: true,
    motivo: 'declaração explícita do operador; autenticidade das evidências não verificada independentemente',
  });
});

test('compose image is marked built only with a successful build and returned image ID', () => {
  assert.deepEqual(composeBuildEvidence({ buildRequested: false, buildExitCode: null, imageId: null }), {
    construidoNesteSnapshot: null,
    imagemComposeId: null,
  });
  assert.deepEqual(composeBuildEvidence({ buildRequested: true, buildExitCode: 0, imageId: 'sha256:abc' }), {
    construidoNesteSnapshot: true,
    imagemComposeId: 'sha256:abc',
  });
  assert.deepEqual(composeBuildEvidence({ buildRequested: true, buildExitCode: 1, imageId: null }), {
    construidoNesteSnapshot: false,
    imagemComposeId: null,
  });
});

test('report path is stored relative to the project root', () => {
  const result = readinessReportLocation('C:/project', '2026-11-27T13:20:55.697Z');
  assert.equal(result.relative, 'test-results/pilot-readiness-2026-11-27T13-20-55.697Z.json');
  assert.equal(result.absolute.replaceAll('\\', '/'), 'C:/project/test-results/pilot-readiness-2026-11-27T13-20-55.697Z.json');
});

test('interrupted and timed out processes never pass as successful validation', () => {
  assert.equal(summarizeValidation({ name: 'missing', startError: 'ENOENT' }).status, 'FALHOU');
  assert.equal(summarizeValidation({ name: 'missing', startError: 'ENOENT' }).motivo, 'não iniciou (ENOENT)');
  assert.equal(summarizeValidation({ name: 'maven', exitCode: null, signal: 'SIGTERM' }).status, 'FALHOU');
  assert.equal(summarizeValidation({ name: 'maven', exitCode: 0, timedOut: true }).status, 'FALHOU');
  assert.equal(summarizeValidation({ name: 'maven', exitCode: 0 }).status, 'APROVADO');
  assert.equal(readinessStatus([{ status: 'APROVADO' }, { status: 'PENDENTE' }]), 'INCOMPLETO');
  assert.equal(readinessStatus([{ status: 'APROVADO' }, { status: 'FALHOU' }]), 'FALHOU');
});
