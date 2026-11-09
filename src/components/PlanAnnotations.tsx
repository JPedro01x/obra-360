import React from 'react';
import type { ModelDimension, ModelRoom, PlanPoint } from '../services/modelGeometry';
import { dimensionGeometry } from '../services/planTopology';
import type { DetectedRoom } from '../services/planRooms';

export function polygonPath(points: PlanPoint[]) {
  return points.length ? `M ${points.map((p) => `${p.x} ${p.z}`).join(' L ')} Z` : '';
}
export function RoomMarks({
  room,
  label,
  font = 0.15,
  fill = true,
}: {
  room: DetectedRoom;
  label: ModelRoom;
  font?: number;
  fill?: boolean;
}) {
  const p = room.anchor;
  return (
    <g className="plan-room-mark" pointerEvents="none">
      {fill && (
        <path
          d={[polygonPath(room.pontos), ...room.holes.map(polygonPath)].join(' ')}
          fill="#10b981"
          fillOpacity={0.06}
          fillRule="evenodd"
        />
      )}
      <text
        x={p.x}
        y={p.z}
        fontSize={font}
        textAnchor="middle"
        fill="#0f513d"
        stroke="#ffffff"
        strokeWidth={font * 0.18}
        paintOrder="stroke"
        fontFamily="Arial, sans-serif"
      >
        <tspan x={p.x}>{label.nome}</tspan>
        <tspan x={p.x} dy={font * 1.35} fontSize={font * 0.85}>
          {room.area.toFixed(2)} m² (eixo)
        </tspan>
      </text>
    </g>
  );
}
export function DimensionMarks({
  cota,
  font = 0.15,
  line = 0.015,
}: {
  cota: ModelDimension;
  font?: number;
  line?: number;
}) {
  const { a, b, comprimento } = dimensionGeometry(cota),
    angle = (Math.atan2(b.z - a.z, b.x - a.x) * 180) / Math.PI;
  const textAngle = angle > 90 ? angle - 180 : angle < -90 ? angle + 180 : angle;
  return (
    <g
      className="plan-dimension-mark"
      pointerEvents="none"
      fill="none"
      stroke="#334155"
      strokeWidth={line}
    >
      <line x1={cota.ax} y1={cota.az} x2={a.x} y2={a.z} />
      <line x1={cota.bx} y1={cota.bz} x2={b.x} y2={b.z} />
      <line x1={a.x} y1={a.z} x2={b.x} y2={b.z} />
      {[a, b].map((p, i) => (
        <line
          key={i}
          x1={p.x - font * 0.35}
          y1={p.z + font * 0.35}
          x2={p.x + font * 0.35}
          y2={p.z - font * 0.35}
          strokeWidth={line * 1.5}
        />
      ))}
      <text
        transform={`translate(${(a.x + b.x) / 2} ${(a.z + b.z) / 2}) rotate(${textAngle})`}
        y={-font * 0.4}
        fontSize={font}
        fill="#0f172a"
        stroke="#ffffff"
        strokeWidth={font * 0.2}
        paintOrder="stroke"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
      >
        {comprimento.toFixed(2)} m
      </text>
    </g>
  );
}
