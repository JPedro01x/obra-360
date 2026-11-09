import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
import type { ModelDraft } from '../services/modelGeometry';
import { ModelPreview } from './ModelPreview';

type Summary = { id: number; nome: string; revisao: number };
type Plan = Summary & ModelDraft;

export function ClientPlans({ unitId, unitName, projectName }: {
  unitId: number;
  unitName: string;
  projectName?: string;
}) {
  const endpoint = `/v1/portal/unidades/${unitId}/plantas`;
  const [plans, setPlans] = useState<Summary[]>();
  const [selected, setSelected] = useState('');
  const [plan, setPlan] = useState<Plan>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    requestApi<Summary[]>(endpoint, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setPlans(result);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [endpoint, retry]);

  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    requestApi<Plan>(`${endpoint}/${selected}`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setPlan(result);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [endpoint, selected, retry]);

  return (
    <section className="ws-service-panel model-module" aria-label={`Plantas da unidade ${unitName}`}>
      {error && (
        <p className="ws-alert" role="alert">
          {error}{' '}
          <button
            className="ws-secondary"
            onClick={() => {
              setError('');
              setPlan(undefined);
              setSelected('');
              setPlans(undefined);
              setRetry((value) => value + 1);
            }}
          >
            Atualizar plantas
          </button>
        </p>
      )}
      {!plans && !error && <p role="status">Carregando plantas…</p>}
      {plans?.length === 0 && <p>Nenhuma planta publicada para esta unidade.</p>}
      {!!plans?.length && (
        <label className="model-view-options">
          Planta da unidade
          <select
            value={selected}
            onChange={(event) => {
              setError('');
              setPlan(undefined);
              setSelected(event.target.value);
            }}
          >
            <option value="">Selecione uma planta</option>
            {plans.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      {selected && !error && !plan && <p role="status">Abrindo planta…</p>}
      {plan && (
        <div>
          <h3>
            {plan.nome} · revisão {plan.revisao}
          </h3>
          <ModelPreview key={plan.id} draft={plan} revision={plan.revisao}
            projectName={projectName ? `${projectName} · ${unitName}` : unitName} />
        </div>
      )}
    </section>
  );
}
