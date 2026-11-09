import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  ModelDocument,
  ModelElement,
  opening,
  rounded,
  PlanPoint,
} from '../services/modelGeometry';
import { footprint } from './ModelViewport';
import { nearestPlanPoint } from '../services/planTopology';
import { detectRooms, matchRoom } from '../services/planRooms';
import { DimensionMarks, RoomMarks } from './PlanAnnotations';
import type { PlanReference } from '../services/planReference';

type View = { x: number; z: number; width: number; height: number };
export const planChanges = {
  added: { label: 'Adicionado', color: '#16a34a' },
  removed: { label: 'Removido', color: '#dc2626' },
  modified: { label: 'Alterado', color: '#ea580c' },
};
export type PlanChange = keyof typeof planChanges;
type Drag = {
  kind: 'wall' | 'move' | 'pan' | 'node' | 'measure';
  nodeId?: string;
  start: { x: number; z: number };
  client: { x: number; y: number };
  view: View;
  ids: string[];
  dx: number;
  dz: number;
};
export function ModelPlan({
  documento,
  floorId,
  selected,
  onSelect,
  editable,
  drawWall,
  snap,
  fit,
  onMove,
  onWall,
  onDrawEnd,
  measure,
  connect,
  onNodeMove,
  onDimension,
  reference,
  calibrationPoint,
  onCalibrate,
  pairedDocument,
  changes,
}: {
  documento: ModelDocument;
  floorId: string;
  selected: string[];
  onSelect: (id: string, extend: boolean) => void;
  editable: boolean;
  drawWall: boolean;
  snap: number;
  fit: number;
  onMove: (ids: string[], dx: number, dz: number) => void;
  onWall: (x: number, z: number, width: number, angle: number) => void;
  onDrawEnd: () => void;
  measure: boolean;
  connect: boolean;
  onNodeMove: (id: string, x: number, z: number) => void;
  onDimension: (a: PlanPoint, b: PlanPoint) => void;
  reference?: PlanReference;
  calibrationPoint?: PlanPoint;
  onCalibrate?: (point: PlanPoint) => void;
  pairedDocument?: ModelDocument;
  changes?: ReadonlyMap<string, PlanChange>;
}) {
  const gridId = useId();
  const svg = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: -8, z: -8, width: 16, height: 16 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const elements = documento.elementos.filter((e) => e.pavimentoId === floorId);
  const pairedSource = pairedDocument ? documento : undefined;
  const rooms = useMemo(() => {
    if (!(documento.ambientes || []).some((r) => r.pavimentoId === floorId)) return [];
    try {
      return detectRooms(documento, floorId);
    } catch {
      return [];
    }
  }, [documento, floorId]);
  useEffect(() => {
    let minX = -4,
      maxX = 4,
      minZ = -4,
      maxZ = 4;
    if (reference) {
      minX = Math.min(minX, reference.x);
      maxX = Math.max(maxX, reference.x + reference.width);
      minZ = Math.min(minZ, reference.z);
      maxZ = Math.max(maxZ, reference.z + reference.height);
    }
    for (const plan of pairedDocument ? [documento, pairedDocument] : [documento]) {
      for (const element of plan.elementos) {
        if (element.pavimentoId !== floorId) continue;
        const p = footprint(element, plan.elementos);
        const radius = Math.hypot(p.width, p.depth) / 2;
        minX = Math.min(minX, p.x - radius);
        maxX = Math.max(maxX, p.x + radius);
        minZ = Math.min(minZ, p.z - radius);
        maxZ = Math.max(maxZ, p.z + radius);
      }
    }
    const size = Math.max(maxX - minX, maxZ - minZ) + 4;
    setView({
      x: (minX + maxX) / 2 - size / 2,
      z: (minZ + maxZ) / 2 - size / 2,
      width: size,
      height: size,
    });
  }, [fit, floorId, pairedDocument, pairedSource]);
  function point(event: React.PointerEvent | React.WheelEvent) {
    const s = svg.current!;
    const matrix = s.getScreenCTM();
    if (!matrix) return { x: 0, z: 0 };
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: p.x, z: p.y };
  }
  const snapped = (n: number) => rounded(Math.round(n / snap) * snap);
  function down(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    const p = point(event);
    if (onCalibrate) {
      onCalibrate(p);
      return;
    }
    const target = (event.target as SVGElement).closest('[data-element-id]');
    const id = target?.getAttribute('data-element-id') || '';
    const nodeId =
      (event.target as SVGElement).closest('[data-node-id]')?.getAttribute('data-node-id') || '';
    const node = documento.nos?.find((n) => n.id === nodeId);
    const ids = id ? (selected.includes(id) ? selected : [id]) : [];
    if (!drawWall && !measure && !nodeId && id && (event.shiftKey || !selected.includes(id)))
      onSelect(id, event.shiftKey);
    const kind =
      measure && editable
        ? 'measure'
        : drawWall && editable
          ? 'wall'
          : node && editable
            ? 'node'
            : id && editable && !event.shiftKey
              ? 'move'
              : 'pan';
    setDrag({
      kind,
      start: node
        ? { x: node.x, z: node.z }
        : (connect && drawWall) || measure
          ? nearestPlanPoint(
              { x: snapped(p.x), z: snapped(p.z) },
              documento,
              floorId,
              Math.max(0.15, snap * 0.35),
            )
          : { x: snapped(p.x), z: snapped(p.z) },
      nodeId: node?.id,
      client: { x: event.clientX, y: event.clientY },
      view,
      ids,
      dx: 0,
      dz: 0,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function dragOffset(event: React.PointerEvent<SVGSVGElement>, drag: Drag) {
    if (event.clientX === drag.client.x && event.clientY === drag.client.y) return { dx: 0, dz: 0 };
    const p = point(event);
    let dx = snapped(p.x) - drag.start.x,
      dz = snapped(p.z) - drag.start.z;
    if ((connect && drag.kind === 'wall') || drag.kind === 'measure' || drag.kind === 'node') {
      const target = nearestPlanPoint(
        { x: snapped(p.x), z: snapped(p.z) },
        documento,
        floorId,
        Math.max(0.15, snap * 0.35),
        drag.nodeId,
      );
      dx = target.x - drag.start.x;
      dz = target.z - drag.start.z;
    }
    if (drag.kind === 'move' && drag.ids.length === 1) {
      const e = elements.find((e) => e.id === drag.ids[0]);
      const wall = e?.paredeId ? elements.find((w) => w.id === e.paredeId) : null;
      if (e && opening(e) && wall) {
        const a = (wall.rotacao * Math.PI) / 180,
          d = snapped(dx * Math.cos(a) - dz * Math.sin(a));
        dx = d * Math.cos(a);
        dz = -d * Math.sin(a);
      }
    }
    return { dx: rounded(dx), dz: rounded(dz) };
  }
  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (!drag) return;
    if (drag.kind === 'pan') {
      const matrix = svg.current?.getScreenCTM();
      if (!matrix) return;
      const dx = (event.clientX - drag.client.x) / matrix.a,
        dz = (event.clientY - drag.client.y) / matrix.d;
      setView({ ...drag.view, x: drag.view.x - dx, z: drag.view.z - dz });
      return;
    }
    setDrag({ ...drag, ...dragOffset(event, drag) });
  }
  function up(event: React.PointerEvent<SVGSVGElement>) {
    if (!drag) return;
    // The last pointer move may not have rendered by the time the gesture ends.
    const { dx, dz } = drag.kind === 'pan' ? drag : dragOffset(event, drag);
    if (drag.kind === 'move' && (dx || dz)) onMove(drag.ids, dx, dz);
    if (drag.kind === 'node' && drag.nodeId && (dx || dz))
      onNodeMove(drag.nodeId, rounded(drag.start.x + dx), rounded(drag.start.z + dz));
    if (drag.kind === 'measure' && Math.hypot(dx, dz) >= 0.01)
      onDimension(drag.start, {
        x: rounded(drag.start.x + dx),
        z: rounded(drag.start.z + dz),
      });
    if (drag.kind === 'wall') {
      const length = Math.hypot(dx, dz);
      if (length >= 0.1) {
        onWall(
          rounded(drag.start.x + dx / 2),
          rounded(drag.start.z + dz / 2),
          rounded(length),
          rounded((-Math.atan2(dz, dx) * 180) / Math.PI),
        );
        onDrawEnd();
      }
    }
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function isMoving(e: ModelElement) {
    return (
      drag?.kind === 'move' &&
      (drag.ids.includes(e.id) || (e.paredeId && drag.ids.includes(e.paredeId)))
    );
  }
  const font = view.width / 70;
  function zoom(factor: number) {
    setView((current) => {
      const size = Math.min(2000, Math.max(2, current.width * factor));
      return {
        x: current.x + (current.width - size) / 2,
        z: current.z + (current.height - size) / 2,
        width: size,
        height: size,
      };
    });
  }
  return (
    <div className={editable ? 'model-plan' : 'model-plan is-readonly'}>
      <svg
        ref={svg}
        viewBox={`${view.x} ${view.z} ${view.width} ${view.height}`}
        aria-label={editable ? 'Planta 2D editável em metros' : 'Planta 2D em metros'}
        role="img"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        onWheel={(event) => zoom(event.deltaY > 0 ? 1.12 : 0.89)}
      >
        <defs>
          <pattern id={gridId} width={1} height={1} patternUnits="userSpaceOnUse">
            <path
              d="M 1 0 L 0 0 0 1"
              fill="none"
              stroke="var(--line)"
              strokeWidth={view.width / 1800}
            />
          </pattern>
        </defs>
        <rect
          x={view.x}
          y={view.z}
          width={view.width}
          height={view.height}
          fill="var(--surface-muted)"
        />
        <rect
          x={view.x}
          y={view.z}
          width={view.width}
          height={view.height}
          fill={`url(#${gridId})`}
        />
        {reference && (
          <image href={reference.url} x={reference.x} y={reference.z}
            width={reference.width} height={reference.height} opacity={0.65} pointerEvents="none" />
        )}
        {calibrationPoint && (
          <circle cx={calibrationPoint.x} cy={calibrationPoint.z} r={view.width / 130}
            fill="var(--accent)" pointerEvents="none" />
        )}
        <path
          d={`M ${view.x} 0 H ${view.x + view.width} M 0 ${view.z} V ${view.z + view.height}`}
          stroke="var(--muted)"
          strokeWidth={view.width / 1000}
        />
        {[
          ...elements.filter((e) => e.tipo === 'LAJE'),
          ...elements.filter((e) => e.tipo !== 'LAJE' && !opening(e)),
          ...elements.filter(opening),
        ].map((e) => {
          const p = footprint(e, documento.elementos),
            moving = isMoving(e);
          const change = changes?.get(e.id);
          const highlight = change ? planChanges[change] : undefined;
          return (
            <g
              key={e.id}
              data-element-id={e.id}
              data-change={change}
              transform={`translate(${p.x + (moving ? drag!.dx : 0)} ${p.z + (moving ? drag!.dz : 0)}) rotate(${p.angle})`}
              className="model-footprint"
            >
              <title>
                {highlight && `${highlight.label}: `}{e.nome} · {e.largura} × {e.profundidade} m
              </title>
              <rect
                x={-p.width / 2}
                y={-p.depth / 2}
                width={p.width}
                height={p.depth}
                fill={highlight?.color ?? e.cor}
                fillOpacity={highlight ? 0.45 : e.tipo === 'LAJE' ? 0.25 : opening(e) ? 0.9 : 0.8}
                stroke={highlight?.color ?? (selected.includes(e.id) ? '#f97316' : 'var(--plan-outline)')}
                strokeWidth={view.width / (highlight || selected.includes(e.id) ? 300 : 900)}
                strokeDasharray={change === 'removed' ? `${view.width / 160} ${view.width / 280}` : undefined}
              />
              <text
                x={0}
                y={-p.depth / 2 - font * 0.5}
                textAnchor="middle"
                fontSize={font}
                fill="var(--ink)"
                pointerEvents="none"
              >
                {e.nome} · {e.largura.toFixed(2)} m
              </text>
              {e.tipo === 'PAREDE' && (
                <line
                  x1={-p.width / 2}
                  x2={p.width / 2}
                  y1={0}
                  y2={0}
                  stroke="var(--muted)"
                  strokeWidth={view.width / 2000}
                />
              )}
            </g>
          );
        })}
        {(documento.ambientes || [])
          .filter((label) => label.pavimentoId === floorId)
          .map((label) => {
            const room = matchRoom(label, rooms);
            return room ? (
              <RoomMarks key={label.id} room={room} label={label} font={font * 1.1} />
            ) : null;
          })}
        {(documento.cotas || [])
          .filter((c) => c.pavimentoId === floorId)
          .map((c) => (
            <DimensionMarks key={c.id} cota={c} font={font} line={view.width / 1500} />
          ))}
        {!drawWall &&
          !measure &&
          editable &&
          (documento.nos || [])
            .filter(
              (n) =>
                n.pavimentoId === floorId &&
                elements.some(
                  (e) => selected.includes(e.id) && (e.noInicioId === n.id || e.noFimId === n.id),
                ),
            )
            .map((n) => (
              <circle
                key={n.id}
                data-node-id={n.id}
                cx={n.x + (drag?.kind === 'node' && drag.nodeId === n.id ? drag.dx : 0)}
                cy={n.z + (drag?.kind === 'node' && drag.nodeId === n.id ? drag.dz : 0)}
                r={view.width / 90}
                fill="#f97316"
                stroke="white"
                strokeWidth={view.width / 600}
                style={{ cursor: 'crosshair' }}
              >
                <title>Nó conectado: arraste para editar as paredes</title>
              </circle>
            ))}
        {(drag?.kind === 'wall' || drag?.kind === 'measure') && (
          <>
            <line
              x1={drag.start.x}
              y1={drag.start.z}
              x2={drag.start.x + drag.dx}
              y2={drag.start.z + drag.dz}
              stroke="#f97316"
              strokeWidth={0.15}
            />
            <text
              x={drag.start.x + drag.dx / 2}
              y={drag.start.z + drag.dz / 2 - font}
              fontSize={font}
              fill="#c2410c"
            >
              {Math.hypot(drag.dx, drag.dz).toFixed(2)} m
            </text>
          </>
        )}
      </svg>
      <div className="model-plan-zoom" role="group" aria-label="Zoom da planta">
        <button type="button" aria-label="Diminuir zoom da planta" onClick={() => zoom(1.25)}>
          <Minus size={18} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Aumentar zoom da planta" onClick={() => zoom(0.8)}>
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
      <p className="model-viewport-hint">
        {!editable
          ? 'Use os botões de zoom para aproximar a planta.'
          : measure
          ? 'Arraste entre dois pontos para criar uma cota; extremidades próximas às paredes serão encaixadas.'
          : drawWall
            ? 'Arraste para desenhar uma parede na grade.'
            : 'Clique para selecionar · Shift para selecionar vários · arraste elementos para mover · arraste o fundo para deslocar · roda para zoom'}
      </p>
    </div>
  );
}
