import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDependencyAudit } from './dependency-audit-policy.mjs';
const now = Date.parse('2026-11-15T22:00:00Z');
const hash = 'a'.repeat(64);
const evidence = () => ({
  jarSha256: hash,
  consultadoEm: new Date(now - 1000).toISOString(),
  fonte: 'https://api.osv.dev/v1/querybatch',
  achados: [],
  avisosUnicos: 0,
  inventarioRuntimeCompleto: true,
  runtimeNaoIdentificado: [],
  pacotes: [{ name: 'example:library', version: '1.0' }],
  pacotesIdentificados: 1,
});
test('accepts recent evidence bound to the actual delivery binary', () => {
  assert.equal(validateDependencyAudit(evidence(), hash, now).aprovado, true);
  assert.equal(validateDependencyAudit(evidence(), 'b'.repeat(64), now).aprovado, false);
});
test('rejects stale or future evidence and missing reports', () => {
  for (const date of [now + 1, now - 8 * 86400000])
    assert.equal(
      validateDependencyAudit(
        { ...evidence(), consultadoEm: new Date(date).toISOString() },
        hash,
        now,
      ).aprovado,
      false,
    );
  assert.equal(validateDependencyAudit(null, hash, now).aprovado, false);
});
test('rejects advisories and incomplete or empty inventories', () => {
  for (const changes of [
    { achados: [{ name: 'example:library', avisos: [{ id: 'EXAMPLE' }] }] },
    { avisosUnicos: 1 },
    { inventarioRuntimeCompleto: false },
    { runtimeNaoIdentificado: ['unknown.jar'] },
    { pacotes: [] },
    { pacotesIdentificados: 2 },
    { fonte: 'https://example.invalid' },
  ])
    assert.equal(validateDependencyAudit({ ...evidence(), ...changes }, hash, now).aprovado, false);
});
