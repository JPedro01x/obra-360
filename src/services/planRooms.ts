import type { ModelDocument, ModelRoom, PlanPoint } from './modelGeometry';
import { wallEnds } from './planTopology';

export type DetectedRoom = {
  pontos: PlanPoint[];
  holes: PlanPoint[][];
  paredeIds: string[];
  area: number;
  perimetro: number;
  anchor: PlanPoint;
};
const cross = (a: PlanPoint, b: PlanPoint) => a.x * b.z - a.z * b.x;
const subtract = (a: PlanPoint, b: PlanPoint) => ({ x: a.x - b.x, z: a.z - b.z });
const len = (a: PlanPoint, b: PlanPoint) => Math.hypot(a.x - b.x, a.z - b.z);
const area = (points: PlanPoint[]) =>
  points.reduce((sum, p, i) => sum + cross(p, points[(i + 1) % points.length]), 0) / 2;
export function insidePolygon(p: PlanPoint, points: PlanPoint[]) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (a.z > p.z !== b.z > p.z && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x)
      result = !result;
  }
  return result;
}
export function insideRoom(p: PlanPoint, room: DetectedRoom) {
  return insidePolygon(p, room.pontos) && !room.holes.some((h) => insidePolygon(p, h));
}
function pointOnSurface(polygon: PlanPoint[], holes: PlanPoint[][] = []): PlanPoint {
  const levels = Array.from(new Set([...polygon, ...holes.flat()].map((p) => p.z))).sort(
    (a, b) => a - b,
  );
  let best = { x: polygon[0].x, z: polygon[0].z },
    bestWidth = -1;
  for (let i = 0; i < levels.length - 1; i++) {
    const z = (levels[i] + levels[i + 1]) / 2,
      intersections: number[] = [];
    for (const poly of [polygon, ...holes])
      for (let j = 0; j < poly.length; j++) {
        const a = poly[j],
          b = poly[(j + 1) % poly.length];
        if (a.z > z !== b.z > z) intersections.push(a.x + ((b.x - a.x) * (z - a.z)) / (b.z - a.z));
      }
    intersections.sort((a, b) => a - b);
    for (let j = 0; j < intersections.length - 1; j += 2) {
      const width = intersections[j + 1] - intersections[j];
      if (width > bestWidth) {
        best = { x: (intersections[j] + intersections[j + 1]) / 2, z };
        bestWidth = width;
      }
    }
  }
  return best;
}

/** Bounded faces of the planar centre-line graph. Intersections are split virtually. */
export function detectRooms(doc: ModelDocument, floorId: string): DetectedRoom[] {
  const walls = doc.elementos.filter((e) => e.tipo === 'PAREDE' && e.pavimentoId === floorId);
  if (walls.length > 400)
    throw new Error('A identificação automática admite até 400 paredes por pavimento.');
  const segments = walls.map((w) => ({ id: w.id, points: wallEnds(w), cuts: [0, 1] }));
  for (let i = 0; i < segments.length; i++)
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i],
        b = segments[j],
        [p, p2] = a.points,
        [q, q2] = b.points,
        r = subtract(p2, p),
        s = subtract(q2, q),
        qp = subtract(q, p),
        den = cross(r, s);
      if (Math.abs(den) < 1e-9) {
        if (Math.abs(cross(qp, r)) < 1e-7) {
          const rr = r.x * r.x + r.z * r.z;
          const ts = [
            (qp.x * r.x + qp.z * r.z) / rr,
            ((q2.x - p.x) * r.x + (q2.z - p.z) * r.z) / rr,
          ].sort((a, b) => a - b);
          if (Math.min(1, ts[1]) - Math.max(0, ts[0]) > 1e-5)
            throw new Error(
              'Existem paredes coincidentes ou sobrepostas no mesmo eixo. Ajuste antes de identificar ambientes.',
            );
        }
        continue;
      }
      const t = cross(qp, s) / den,
        u = cross(qp, r) / den;
      if (t >= -1e-7 && t <= 1 + 1e-7 && u >= -1e-7 && u <= 1 + 1e-7) {
        a.cuts.push(Math.max(0, Math.min(1, t)));
        b.cuts.push(Math.max(0, Math.min(1, u)));
      }
    }
  const vertices: PlanPoint[] = [],
    vertexIds = new Map<string, number>(),
    edges = new Map<string, { a: number; b: number; wall: string }>(),
    neighbors = new Map<number, number[]>();
  function vertex(p: PlanPoint) {
    const key = `${Math.round(p.x * 10000)}:${Math.round(p.z * 10000)}`;
    let id = vertexIds.get(key);
    if (id === undefined) {
      id = vertices.length;
      vertices.push(p);
      vertexIds.set(key, id);
    }
    return id;
  }
  for (const seg of segments) {
    const [a, b] = seg.points,
      ts = Array.from(new Set(seg.cuts.map((t) => Math.round(t * 1e9) / 1e9))).sort(
        (a, b) => a - b,
      );
    for (let i = 0; i < ts.length - 1; i++) {
      const from = vertex({ x: a.x + (b.x - a.x) * ts[i], z: a.z + (b.z - a.z) * ts[i] }),
        to = vertex({ x: a.x + (b.x - a.x) * ts[i + 1], z: a.z + (b.z - a.z) * ts[i + 1] });
      if (from === to) continue;
      const key = [from, to].sort((a, b) => a - b).join(':');
      if (edges.has(key)) continue;
      edges.set(key, { a: from, b: to, wall: seg.id });
      neighbors.set(from, [...(neighbors.get(from) || []), to]);
      neighbors.set(to, [...(neighbors.get(to) || []), from]);
    }
  }
  if (vertices.length > 10000 || edges.size > 20000)
    throw new Error(
      'Contorno complexo demais para a identificação automática. Simplifique as interseções.',
    );
  for (const [id, list] of neighbors)
    list.sort(
      (a, b) =>
        Math.atan2(vertices[a].z - vertices[id].z, vertices[a].x - vertices[id].x) -
        Math.atan2(vertices[b].z - vertices[id].z, vertices[b].x - vertices[id].x),
    );
  // Graph bridges do not bound a room (for example a freestanding wall inside a room).
  const discovery = new Map<number, number>(),
    low = new Map<number, number>(),
    bridges = new Set<string>();
  let clock = 0;
  for (const start of neighbors.keys())
    if (!discovery.has(start)) {
      discovery.set(start, ++clock);
      low.set(start, clock);
      const stack = [{ v: start, parent: -1, index: 0 }];
      while (stack.length) {
        const frame = stack[stack.length - 1],
          list = neighbors.get(frame.v)!;
        if (frame.index < list.length) {
          const to = list[frame.index++];
          if (to === frame.parent) continue;
          if (!discovery.has(to)) {
            discovery.set(to, ++clock);
            low.set(to, clock);
            stack.push({ v: to, parent: frame.v, index: 0 });
          } else low.set(frame.v, Math.min(low.get(frame.v)!, discovery.get(to)!));
        } else {
          stack.pop();
          if (frame.parent >= 0) {
            if (low.get(frame.v)! > discovery.get(frame.parent)!)
              bridges.add([frame.v, frame.parent].sort((a, b) => a - b).join(':'));
            low.set(frame.parent, Math.min(low.get(frame.parent)!, low.get(frame.v)!));
          }
        }
      }
    }
  for (const [id, list] of neighbors)
    neighbors.set(
      id,
      list.filter((to) => !bridges.has([id, to].sort((a, b) => a - b).join(':'))),
    );
  for (const key of bridges) edges.delete(key);
  const visited = new Set<string>(),
    faces: { pontos: PlanPoint[]; paredeIds: string[]; area: number }[] = [];
  for (const edge of edges.values())
    for (const [startA, startB] of [
      [edge.a, edge.b],
      [edge.b, edge.a],
    ]) {
      if (visited.has(`${startA}:${startB}`)) continue;
      let a = startA,
        b = startB,
        closed = false;
      const polygon: number[] = [],
        wallIds = new Set<string>();
      for (let step = 0; step <= edges.size * 2; step++) {
        const key = `${a}:${b}`;
        if (visited.has(key)) {
          closed = a === startA && b === startB;
          break;
        }
        visited.add(key);
        polygon.push(a);
        wallIds.add(edges.get([a, b].sort((x, y) => x - y).join(':'))!.wall);
        const outgoing = neighbors.get(b)!;
        const index = outgoing.indexOf(a),
          next = outgoing[(index - 1 + outgoing.length) % outgoing.length];
        a = b;
        b = next;
      }
      if (!closed || polygon.length < 3) continue;
      let points = polygon.map((i) => vertices[i]);
      const signed = area(points);
      if (signed <= 0.01) continue;
      // Dangling edges repeat vertices and can look like a contour. Reject those faces.
      if (new Set(polygon).size !== polygon.length) continue;
      points = points.filter(
        (p, i) =>
          Math.abs(
            cross(
              subtract(p, points[(i + points.length - 1) % points.length]),
              subtract(points[(i + 1) % points.length], p),
            ),
          ) > 1e-8,
      );
      if (points.length > 200 || wallIds.size > 200)
        throw new Error('Um ambiente excede 200 vértices ou paredes. Simplifique o contorno.');
      faces.push({ pontos: points, paredeIds: Array.from(wallIds).sort(), area: signed });
      if (faces.length > 500) throw new Error('Limite de 500 ambientes por modelo.');
    }
  const parents = faces.map((f, index) => {
    const center = pointOnSurface(f.pontos);
    let parent = -1;
    for (let j = 0; j < faces.length; j++) {
      const other = faces[j];
      if (
        j !== index &&
        other.area > f.area + 1e-6 &&
        insidePolygon(center, other.pontos) &&
        (parent < 0 || other.area < faces[parent].area)
      )
        parent = j;
    }
    return parent;
  });
  return faces
    .map((f, i) => {
      const children = faces.filter((_, j) => parents[j] === i),
        holes = children.map((c) => c.pontos);
      return {
        pontos: f.pontos,
        holes,
        paredeIds: f.paredeIds,
        area: f.area - children.reduce((s, c) => s + c.area, 0),
        perimetro: [f.pontos, ...holes].reduce(
          (sum, poly) => sum + poly.reduce((s, p, k) => s + len(p, poly[(k + 1) % poly.length]), 0),
          0,
        ),
        anchor: pointOnSurface(f.pontos, holes),
      };
    })
    .filter((r) => r.area > 0.01);
}
export function matchRoom(label: ModelRoom, rooms: DetectedRoom[]): DetectedRoom | undefined {
  const key = [...label.paredeIds].sort().join('|');
  const same = rooms.filter((r) => r.paredeIds.join('|') === key);
  return same.length === 1 ? same[0] : rooms.find((r) => insideRoom(label, r));
}
export function refreshRoomLabels(doc: ModelDocument, floorId: string) {
  const rooms = detectRooms(doc, floorId),
    old = (doc.ambientes || []).filter((r) => r.pavimentoId === floorId),
    used = new Set<string>();
  const result = rooms.map((room, i) => {
    const label = old.find((label) => !used.has(label.id) && matchRoom(label, rooms) === room);
    if (label) used.add(label.id);
    return {
      id: label?.id || crypto.randomUUID(),
      pavimentoId: floorId,
      nome: label?.nome || `Ambiente ${i + 1}`,
      x: room.anchor.x,
      z: room.anchor.z,
      paredeIds: room.paredeIds,
    };
  });
  doc.schemaVersao = 2;
  doc.ambientes = [...(doc.ambientes || []).filter((r) => r.pavimentoId !== floorId), ...result];
  return rooms;
}
