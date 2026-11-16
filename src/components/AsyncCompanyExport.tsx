import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
type Job = { id: string; situacao: string; mensagem: string; tamanho: number; expiraEm: string };
export function AsyncCompanyExport() {
  const [jobs, setJobs] = useState<Job[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  const active = jobs.some((j) => ['FILA', 'PROCESSANDO'].includes(j.situacao));
  useEffect(() => {
    const c = new AbortController();
    requestApi<Job[]>('/v1/workspace/exportacoes', { signal: c.signal })
      .then((value) => {
        if (!c.signal.aborted) setJobs(value);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    const timer = active ? setTimeout(() => setRefresh((n) => n + 1), 5000) : undefined;
    return () => {
      c.abort();
      clearTimeout(timer);
    };
  }, [refresh, active]);
  async function download(job: Job) {
    setBusy(true);
    setError('');
    try {
      const blob = await requestApi<Blob>(
        `/v1/workspace/exportacoes/${job.id}/arquivo`,
        {},
        120000,
        'blob',
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'obra360-empresa.zip';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Exportação em segundo plano">
      <h3>Exportação em segundo plano</h3>
      <p>
        Para até 250 MB descompactados e 100 mil registros. Uma exportação por empresa por vez. O
        arquivo privado fica disponível por 24 horas. Reinícios interrompem trabalhos em andamento;
        solicite novamente se necessário.
      </p>
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          const form = e.currentTarget;
          const password = new FormData(form).get('senha');
          setBusy(true);
          setError('');
          try {
            await requestApi('/v1/workspace/exportacoes', {
              method: 'POST',
              body: JSON.stringify({ senha: password }),
            });
            form.reset();
            setRefresh((n) => n + 1);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Senha para solicitar exportação assíncrona
          <input
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            maxLength={200}
          />
        </label>
        <button disabled={busy || active} type="submit">
          Gerar exportação em segundo plano
        </button>
      </form>
      <button className="ws-secondary" disabled={busy} onClick={() => setRefresh((n) => n + 1)}>
        Atualizar exportações
      </button>
      {jobs.map((job) => (
        <article key={job.id} style={{ marginTop: 12 }}>
          <strong>{job.situacao}</strong> · {job.mensagem}
          {job.situacao === 'PRONTO' && (
            <>
              <p>
                {Math.ceil(job.tamanho / 1024)} KB · expira em{' '}
                {new Date(job.expiraEm).toLocaleString('pt-BR')}
              </p>
              <button className="ws-secondary" disabled={busy} onClick={() => void download(job)}>
                Baixar arquivo gerado
              </button>
            </>
          )}
        </article>
      ))}
    </section>
  );
}
