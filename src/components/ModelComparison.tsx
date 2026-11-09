import React, { useEffect, useMemo, useState } from 'react';
import { requestApi } from '../services/http';
import {
  anchor,
  type ModelDocument,
  type ModelDraft,
  type ModelElement,
  type SavedModel,
} from '../services/modelGeometry';
import { ModelPlan, planChanges, type PlanChange } from './ModelPlan';

const ignore = () => {};

function changed(
  before: ModelElement,
  after: ModelElement,
  bank: ModelDocument,
  draft: ModelDocument,
) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]) as Set<keyof ModelElement>;
  return (
    [...keys].some((key) => (before[key] ?? null) !== (after[key] ?? null)) ||
    JSON.stringify(anchor(before, bank.elementos)) !==
      JSON.stringify(anchor(after, draft.elementos))
  );
}

function changesOnFloor(bank: ModelDocument | undefined, draft: ModelDocument, floorId: string) {
  const before = new Map<string, PlanChange>();
  const after = new Map<string, PlanChange>();
  const counts = { added: 0, removed: 0, modified: 0 };
  if (!bank) return { before, after, counts };
  const from = new Map(
    bank.elementos
      .filter((element) => element.pavimentoId === floorId)
      .map((element) => [element.id, element]),
  );
  const to = new Map(
    draft.elementos
      .filter((element) => element.pavimentoId === floorId)
      .map((element) => [element.id, element]),
  );
  for (const [id, element] of from) {
    const next = to.get(id);
    if (!next) {
      before.set(id, 'removed');
      counts.removed++;
    } else if (changed(element, next, bank, draft)) {
      before.set(id, 'modified');
      after.set(id, 'modified');
      counts.modified++;
    }
  }
  for (const id of to.keys()) {
    if (from.has(id)) continue;
    after.set(id, 'added');
    counts.added++;
  }
  return { before, after, counts };
}

function ComparisonPlan({
  document,
  other,
  floorId,
  fit,
  changes,
}: {
  document: ModelDocument;
  other: ModelDocument;
  floorId: string;
  fit: number;
  changes: ReadonlyMap<string, PlanChange>;
}) {
  if (!document.pavimentos.some((floor) => floor.id === floorId))
    return <p>Este pavimento não existe nesta versão.</p>;
  return (
    <ModelPlan
      documento={document}
      pairedDocument={other}
      changes={changes}
      floorId={floorId}
      selected={[]}
      onSelect={ignore}
      editable={false}
      drawWall={false}
      snap={0.1}
      fit={fit}
      onMove={ignore}
      onWall={ignore}
      onDrawEnd={ignore}
      measure={false}
      connect={false}
      onNodeMove={ignore}
      onDimension={ignore}
    />
  );
}

export function ModelComparison({
  modelId,
  draft,
  onClose,
}: {
  modelId: number;
  draft: ModelDraft;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState<SavedModel>();
  const [error, setError] = useState('');
  const [floorId, setFloorId] = useState('');
  const [fit, setFit] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    requestApi<SavedModel>(
      `/v1/workspace/modelador/modelos/${modelId}`,
      {
        signal: controller.signal,
      },
      45000,
    )
      .then((result) => {
        if (!controller.signal.aborted) setSaved(result);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [modelId]);
  const floors = new Map(saved?.documento.pavimentos.map((floor) => [floor.id, floor.nome]));
  for (const floor of draft.documento.pavimentos) {
    if (!floors.has(floor.id)) floors.set(floor.id, floor.nome);
  }
  const activeFloor = floors.has(floorId) ? floorId : floors.keys().next().value!;
  const differences = useMemo(
    () => changesOnFloor(saved?.documento, draft.documento, activeFloor),
    [saved, draft.documento, activeFloor],
  );

  return (
    <section className="ws-service-panel" aria-label="Comparação de plantas">
      <div className="model-toolbar">
        {saved && (
          <>
            <label>
              Pavimento da comparação
              <select value={activeFloor} onChange={(event) => setFloorId(event.target.value)}>
                {[...floors].map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => setFit((value) => value + 1)}>
              Enquadrar as duas plantas
            </button>
          </>
        )}
        <button type="button" onClick={onClose}>
          Fechar comparação
        </button>
      </div>
      {!saved && !error && <p role="status">Consultando a revisão atual no banco…</p>}
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <ul className="model-change-legend" aria-label="Legenda das diferenças">
          {(Object.keys(planChanges) as PlanChange[]).map((key) => (
            <li key={key}>
              <span aria-hidden="true" style={{ backgroundColor: planChanges[key].color }} />
              {planChanges[key].label}: {differences.counts[key]}
            </li>
          ))}
        </ul>
      )}
      {saved && (
        <div className="model-canvases view-split">
          <section aria-label="Planta do banco">
            <h3>Banco · revisão {saved.revisao}</h3>
            <p>{saved.nome}</p>
            <ComparisonPlan
              document={saved.documento}
              other={draft.documento}
              floorId={activeFloor}
              fit={fit}
              changes={differences.before}
            />
          </section>
          <section aria-label="Planta do rascunho">
            <h3>Rascunho</h3>
            <p>{draft.nome}</p>
            <ComparisonPlan
              document={draft.documento}
              other={saved.documento}
              floorId={activeFloor}
              fit={fit}
              changes={differences.after}
            />
          </section>
        </div>
      )}
    </section>
  );
}
