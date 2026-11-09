import React, { useEffect, useState } from 'react';
import type { ModelDraft } from '../services/modelGeometry';
import { ModelPlan } from './ModelPlan';
import { ModelViewport } from './ModelViewport';
import { PlanTools } from './PlanTools';
import { loadSavedPlanReference, type OpenPlanReference, type SavedPlanReference } from '../services/planReference';
import './model-editor.css';

const ignore = () => {};

export function ModelPreview({
  draft,
  revision,
  projectName,
  referenceSource,
}: {
  draft: ModelDraft;
  revision: number;
  projectName?: string;
  referenceSource?: { modelId: number; metadata: SavedPlanReference };
}) {
  const [floorId, setFloorId] = useState('');
  const [fit, setFit] = useState(0);
  const [view, setView] = useState('split');
  const [requested, setRequested] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<{ revision: number; image?: OpenPlanReference; error?: string }>();
  const modelId = referenceSource?.modelId;
  const metadata = referenceSource?.metadata;
  const showReference = requested === revision && !!metadata;
  const currentReference = showReference && loaded?.revision === revision ? loaded : undefined;
  useEffect(() => {
    if (!showReference || !metadata || modelId == null) return;
    const controller = new AbortController();
    void loadSavedPlanReference(modelId, revision, metadata, controller.signal)
      .then((image) => {
        if (!controller.signal.aborted) {
          setLoaded({ revision, image });
          setFloorId(image.floorId);
          setFit((value) => value + 1);
        }
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setLoaded({ revision, error: error.message });
      });
    return () => controller.abort();
  }, [showReference, modelId, metadata, revision]);
  const { documento } = draft;
  const floor = documento.pavimentos.find((item) => item.id === floorId) ?? documento.pavimentos[0];
  return (
    <>
      <div className="model-view-options">
        <label>
          Pavimento da visualização
          <select value={floor.id} onChange={(event) => setFloorId(event.target.value)}>
            {documento.pavimentos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Visualização da planta
          <select value={view} onChange={(event) => setView(event.target.value)}>
            <option value="split">Planta e 3D</option>
            <option value="2d">Planta 2D</option>
            <option value="3d">Vista 3D</option>
          </select>
        </label>
        <button className="ws-secondary" onClick={() => setFit((value) => value + 1)}>
          Enquadrar visualização
        </button>
        {metadata && <button className="ws-secondary" type="button" onClick={() => {
          setLoaded(undefined);
          setRequested(showReference ? null : revision);
        }}>
          {showReference ? 'Ocultar referência desta revisão' : 'Mostrar referência desta revisão'}
        </button>}
      </div>
      {showReference && !currentReference && <p role="status">Carregando referência da revisão…</p>}
      {currentReference?.error && <p role="alert">{currentReference.error}</p>}
      {currentReference?.image && <p>Referência: {metadata?.nomeArquivo} · página {metadata?.pagina}</p>}
      <div className={`model-canvases view-${view}`}>
        {view !== '3d' && (
          <ModelPlan
            documento={documento}
            floorId={floor.id}
            selected={[]}
            onSelect={ignore}
            editable={false}
            drawWall={false}
            snap={0.1}
            fit={fit + revision}
            onMove={ignore}
            onWall={ignore}
            onDrawEnd={ignore}
            measure={false}
            connect={false}
            onNodeMove={ignore}
            onDimension={ignore}
            reference={currentReference?.image?.floorId === floor.id ? currentReference.image : undefined}
          />
        )}
        {view !== '2d' && (
          <ModelViewport
            documento={documento}
            floorId={floor.id}
            allFloors
            selected={[]}
            onSelect={ignore}
            fit={fit + revision}
          />
        )}
      </div>
      {projectName && (
        <PlanTools
          draft={draft}
          floorId={floor.id}
          selected={[]}
          writable={false}
          onChange={() => false}
          projectName={projectName}
          revision={revision}
          dirty={false}
        />
      )}
    </>
  );
}
