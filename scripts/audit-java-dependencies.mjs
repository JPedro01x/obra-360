import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { useLocalJava21 } from './local-java.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
assert(process.argv.length <= 3, 'Informe somente o caminho de um JAR do projeto.');
const jar = path.resolve(
  process.argv[2] || path.join(root, 'obra360-backend/target/obra360-backend-1.0.0-SNAPSHOT.jar'),
);
assert(
  jar.toLowerCase().startsWith(root.toLowerCase()) && jar.endsWith('.jar'),
  'O JAR deve estar dentro do projeto.',
);
await useLocalJava21();
const content = await readFile(jar);
const entries = execFileSync(
  path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'jar.exe' : 'jar'),
  ['tf', jar],
  { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
);
const names = new Set(
  entries
    .split(/\r?\n/)
    .filter((n) => /^BOOT-INF\/lib\/[^/]+\.jar$/.test(n))
    .map((n) => path.posix.basename(n)),
);
assert(names.size > 0, 'O arquivo não contém bibliotecas de um JAR executável Spring Boot.');
const repository = path.join(homedir(), '.m2/repository');
const packages = new Map(),
  matched = new Set();
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(filename);
    else if (entry.isFile() && names.has(entry.name)) {
      const parts = path.relative(repository, filename).split(path.sep);
      if (parts.length < 4) continue;
      const name = parts.slice(0, -3).join('.') + ':' + parts.at(-3),
        version = parts.at(-2);
      packages.set(name, { name, version });
      matched.add(entry.name);
    }
  }
}
await walk(repository);
// Boot embeds this published artifact in its packaging plugin, so it may not
// have its own file in the local Maven repository. Its coordinates are stable.
for (const name of names) {
  const helper = name.match(/^(spring-boot-jarmode-(?:tools|layertools))-(\d+\.\d+\.\d+)\.jar$/);
  if (!matched.has(name) && helper) {
    const coordinate = `org.springframework.boot:${helper[1]}`;
    packages.set(coordinate, { name: coordinate, version: helper[2] });
    matched.add(name);
  }
}
const identified = [...packages.values()].sort((a, b) => a.name.localeCompare(b.name));
assert(identified.length > 0, 'Nenhum pacote identificado; auditoria incompleta.');
const unknown = [...names].filter((n) => !matched.has(n));
const unknownRuntime = unknown;
const response = await fetch('https://api.osv.dev/v1/querybatch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    queries: identified.map((p) => ({
      package: { ecosystem: 'Maven', name: p.name },
      version: p.version,
    })),
  }),
  signal: AbortSignal.timeout(30000),
});
assert(response.ok, `Consulta OSV indisponível: HTTP ${response.status}`);
const result = await response.json();
assert.equal(result.results.length, identified.length, 'Resposta OSV incompleta.');
const findings = identified
  .map((p, i) => ({ ...p, avisos: result.results[i].vulns || [] }))
  .filter((p) => p.avisos.length);
const report = {
  consultadoEm: new Date().toISOString(),
  fonte: 'https://api.osv.dev/v1/querybatch',
  jar: path.relative(root, jar),
  jarSha256: createHash('sha256').update(content).digest('hex'),
  jarsRuntime: names.size,
  pacotesIdentificados: identified.length,
  naoIdentificados: unknown,
  runtimeNaoIdentificado: unknownRuntime,
  inventarioRuntimeCompleto: unknownRuntime.length === 0,
  pacotes: identified,
  achados: findings,
  avisosUnicos: new Set(findings.flatMap((p) => p.avisos.map((v) => v.id))).size,
  observacao:
    'Presença de aviso por pacote/versão não comprova explorabilidade. Ausência de aviso não certifica segurança. Bibliotecas não identificadas não foram avaliadas.',
};
await mkdir(path.join(root, 'test-results'), { recursive: true });
const output = path.join(root, 'test-results', `java-dependencies-${Date.now()}.json`);
await writeFile(output, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    relatorio: path.relative(root, output),
    pacotesIdentificados: identified.length,
    naoIdentificados: report.naoIdentificados,
    pacotesComAvisos: findings.length,
    avisosUnicos: report.avisosUnicos,
  }),
);
if (unknownRuntime.length) process.exitCode = 2;
else if (findings.length) process.exitCode = 1;
