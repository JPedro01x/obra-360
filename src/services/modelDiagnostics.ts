import { opening, type ModelDocument, type ModelElement } from './modelGeometry';
import { wallEnds } from './planTopology';

export type GeometryIssue = {
  kind: 'SOBREPOSICAO' | 'EXTREMIDADE' | 'PAVIMENTO';
  message: string;
  ids: string[];
  floorId: string;
};
const tolerance = 0.002;
function box(e: ModelElement) {
  const a = (e.rotacao * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a);
  const rx = (Math.abs(c) * e.largura + Math.abs(s) * e.profundidade) / 2;
  return {
    e,
    axes: [
      { x: c, z: -s },
      { x: s, z: c },
    ],
    minX: e.x - rx,
    maxX: e.x + rx,
  };
}
function overlap(a: ReturnType<typeof box>, b: ReturnType<typeof box>) {
  for (const axis of [...a.axes, ...b.axes]) {
    const projection = (v: typeof a) =>
      (Math.abs(axis.x * v.axes[0].x + axis.z * v.axes[0].z) * v.e.largura) / 2 +
      (Math.abs(axis.x * v.axes[1].x + axis.z * v.axes[1].z) * v.e.profundidade) / 2;
    if (
      Math.abs((a.e.x - b.e.x) * axis.x + (a.e.z - b.e.z) * axis.z) >=
      projection(a) + projection(b) - tolerance
    )
      return false;
  }
  return true;
}
function distanceToSegment(p: { x: number; z: number }, e: ModelElement) {
  const [a, b] = wallEnds(e),
    dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
}
/** Advisory scan only: intersections can be deliberate structural connections. */
export function diagnoseGeometry(doc: ModelDocument) {
  const issues: GeometryIssue[] = [];
  let comparisons = 0,
    limited = false;
  const floors = new Map(doc.pavimentos.map((f) => [f.id, f]));
  const add = (issue: GeometryIssue) => {
    if (issues.length < 100) issues.push(issue);
    else limited = true;
  };
  const solids = doc.elementos
    .filter((e) => !opening(e))
    .map(box)
    .sort((a, b) => a.minX - b.minX);
  scan: for (let i = 0; i < solids.length; i++)
    for (let j = i + 1; j < solids.length && solids[j].minX < solids[i].maxX; j++) {
      if (++comparisons > 250000) {
        limited = true;
        break scan;
      }
      const a = solids[i],
        b = solids[j];
      const lowA = floors.get(a.e.pavimentoId)!.cota + a.e.base,
        lowB = floors.get(b.e.pavimentoId)!.cota + b.e.base;
      if (Math.max(lowA, lowB) >= Math.min(lowA + a.e.altura, lowB + b.e.altura) - tolerance)
        continue;
      if (!overlap(a, b)) continue;
      // Slabs at the foot/top of structural elements and wall-end junctions are normal.
      if ((a.e.tipo === 'LAJE') !== (b.e.tipo === 'LAJE')) {
        const slab = a.e.tipo === 'LAJE' ? a : b,
          other = slab === a ? b : a;
        const sl = floors.get(slab.e.pavimentoId)!.cota + slab.e.base,
          ol = floors.get(other.e.pavimentoId)!.cota + other.e.base;
        if (sl <= ol + 0.02 || sl + slab.e.altura >= ol + other.e.altura - 0.02) continue;
      }
      if (
        a.e.tipo === 'PAREDE' &&
        b.e.tipo === 'PAREDE' &&
        Math.abs(Math.sin(((a.e.rotacao - b.e.rotacao) * Math.PI) / 180)) > 0.01 &&
        (wallEnds(a.e).some(
          (p) => distanceToSegment(p, b.e) < Math.max(a.e.profundidade, b.e.profundidade) / 2,
        ) ||
          wallEnds(b.e).some(
            (p) => distanceToSegment(p, a.e) < Math.max(a.e.profundidade, b.e.profundidade) / 2,
          ))
      )
        continue;
      add({
        kind: 'SOBREPOSICAO',
        message: `Possível interferência: ${a.e.nome} e ${b.e.nome}. Confira se a interseção é intencional.`,
        ids: [a.e.id, b.e.id],
        floorId: a.e.pavimentoId,
      });
    }
  const walls = doc.elementos.filter((e) => e.tipo === 'PAREDE');
  ends: for (const wall of walls)
    for (const [index, p] of wallEnds(wall).entries()) {
      let connected = false;
      for (const other of walls) {
        if (other.id === wall.id || other.pavimentoId !== wall.pavimentoId) continue;
        if (++comparisons > 250000) {
          limited = true;
          break ends;
        }
        if (distanceToSegment(p, other) <= Math.max(0.03, other.profundidade / 2 + 0.01)) {
          connected = true;
          break;
        }
      }
      if (!connected)
        add({
          kind: 'EXTREMIDADE',
          message: `${wall.nome}: extremidade ${index + 1} livre. Pode ser intencional; confira o fechamento do ambiente.`,
          ids: [wall.id],
          floorId: wall.pavimentoId,
        });
    }
  const ordered = [...doc.pavimentos].sort((a, b) => a.cota - b.cota);
  for (let i = 1; i < ordered.length; i++)
    if (ordered[i].cota < ordered[i - 1].cota + ordered[i - 1].altura - tolerance)
      add({
        kind: 'PAVIMENTO',
        message: `${ordered[i].nome} começa dentro da altura de ${ordered[i - 1].nome}. Confira cotas e eventual mezanino.`,
        ids: [],
        floorId: ordered[i].id,
      });
  return { issues, limited, comparisons };
}
