import { readdir, readFile, statfs } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyBackup } from './backup.mjs';
import { setTimeout as sleep } from 'node:timers/promises';

export async function diagnoseLocal({ root, fetchImpl = fetch, disk = statfs, now = Date.now() }) {
  const checks = [];
  const add = (id, ok, detail = {}) => checks.push({ id, status: ok ? 'OK' : 'ATENCAO', ...detail });
  await Promise.all([
    ['api', 'http://127.0.0.1:8080/actuator/health/readiness', async r => r.ok && (await r.json()).status === 'UP'],
    ['interface', 'http://127.0.0.1:3000/', async r => r.status === 200],
    ['instalacao', 'http://127.0.0.1:8080/api/v1/instalacao', async r => r.ok && (await r.json()).necessaria === false],
    ['consulta_protegida', 'http://127.0.0.1:8080/api/v1/workspace/registros/projetos', async r => r.status === 401],
  ].map(async ([id, url, validate]) => {
    try {
      const start = performance.now();
      const response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(8000) });
      add(id, await validate(response), { http: response.status, latenciaMs: Math.round(performance.now() - start) });
    } catch { add(id, false, { motivo: 'Indisponível ou resposta inválida.' }); }
  }));
  try {
    const space = await disk(path.join(root, 'obra360-backend/data'));
    const bytes = Number(space.bavail) * Number(space.bsize);
    add('disco', Number.isFinite(bytes) && bytes >= 2 * 1024 ** 3, { livreGB: Math.round(bytes / 1024 ** 3 * 100) / 100, minimoGB: 2 });
  } catch { add('disco', false, { motivo: 'Não foi possível consultar o volume dos dados.' }); }
  try {
    const backups = path.join(root, 'backups');
    const candidates = (await readdir(backups, { withFileTypes: true }))
      .filter(entry => entry.isDirectory() && /^[0-9TZ.\-]+$/.test(entry.name))
      .map(entry => entry.name).sort().reverse();
    if (!candidates.length) throw new Error('Nenhuma cópia completa com manifesto.');
    const id = candidates[0];
    const manifest = JSON.parse(await readFile(path.join(backups, id, 'manifest.json'), 'utf8'));
    const age = (now - Date.parse(manifest.createdAt)) / 3600000;
    const verified = await verifyBackup(backups, id);
    add('backup', Number.isFinite(age) && age >= 0 && age <= 48,
      { copia: verified.id, arquivosConferidos: verified.arquivos, idadeHoras: Math.round(age * 100) / 100, limiteHoras: 48 });
  } catch { add('backup', false, { motivo: 'Cópia ausente, incompleta, corrompida ou manifesto inválido.' }); }
  checks.sort((a, b) => a.id.localeCompare(b.id));
  return { verificadoEm: new Date(now).toISOString(), saudavel: checks.every(c => c.status === 'OK'), checks,
    observacao: 'Diagnóstico local e verificação de hashes. Não restaura dados, não testa a recuperação em outro computador e não aprova operação comercial.' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const watch = process.argv.includes('--watch');
  if (process.argv.slice(2).some(arg => arg !== '--watch')) {
    console.error('Use sem argumentos para diagnóstico ou --watch para observar a cada 60 segundos.'); process.exitCode = 2;
  } else {
    const root = fileURLToPath(new URL('../', import.meta.url));
    let stopped = false;
    const controller = new AbortController();
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { stopped = true; controller.abort(); });
    do {
      const result = await diagnoseLocal({ root });
      console.log(JSON.stringify(result, null, watch ? 0 : 2));
      process.exitCode = result.saudavel ? 0 : 1;
      if (!watch || stopped) break;
      try { await sleep(60000, undefined, { signal: controller.signal }); } catch { break; }
    } while (!stopped);
  }
}
