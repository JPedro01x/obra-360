import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
import { RhSelect } from './RhSelect';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';
export function LaborPreparation() {
  const workspaceRevision = useWorkspaceRefresh();
  const [data, setData] = useState<{
    calculosLegaisAtivos: boolean;
    envioEsocialAtivo: boolean;
    funcionariosAtivos: number;
    preRequisitos: string[];
    observacao: string;
  } | null>(null);
  const [id, setId] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    requestApi<NonNullable<typeof data>>('/v1/workspace/rh/trabalhista/preparacao', {
      signal: c.signal,
    })
      .then((status) => {
        if (!c.signal.aborted) setData(status);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [workspaceRevision]);
  async function download(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const blob = await requestApi<Blob>(
        '/v1/workspace/rh/trabalhista/exportar-folha',
        {
          method: 'POST',
          body: JSON.stringify({ folhaId: Number(id), confirmacao: confirmation }),
        },
        30000,
        'blob',
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `folha-contabilidade-${id}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ws-card" aria-label="Preparação trabalhista">
      <h2>Contabilidade e obrigações trabalhistas</h2>
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {data && (
        <>
          <p>
            <strong>Cálculos legais automáticos: desativados. Envio ao eSocial: desativado.</strong>
          </p>
          <p>{data.observacao}</p>
          <p>Funcionários ativos cadastrados: {data.funcionariosAtivos}.</p>
          <h3>Pendências para homologação</h3>
          <ul>
            {data.preRequisitos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Exportar lançamentos fechados para conferência</h3>
          <form onSubmit={download}>
            <RhSelect
              field={{ name: 'folhaId', label: 'Folha para contabilidade', source: 'folhas' }}
              value={id}
              onChange={setId}
              disabled={busy}
            />
            <p className="ws-help">
              CSV com matrícula, nome e lançamentos da folha. Guarde em local privado e compartilhe
              somente com a contabilidade autorizada. Não inclui senhas ou credenciais.
            </p>
            <label>
              Digite EXPORTAR para confirmar
              <input
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                pattern="EXPORTAR"
              />
            </label>
            <button className="ws-primary" disabled={busy || !id} type="submit">
              Baixar CSV da contabilidade
            </button>
          </form>
        </>
      )}
    </section>
  );
}
