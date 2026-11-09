import React, { useState } from 'react';
import type { ModelDraft } from '../services/modelGeometry';
import { ModelPlan } from './ModelPlan';
import { ModelViewport } from './ModelViewport';
import { PlanTools } from './PlanTools';
import './model-editor.css';

const ignore = () => {};

export function ModelPreview({
  draft,
  revision,
  projectName,
}: {
  draft: ModelDraft;
  revision: number;
  projectName?: string;
}) {
  const [floorId, setFloorId] = useState('');
  const [fit, setFit] = useState(0);
  const [view, setView] = useState('split');
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
      </div>
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
