import type {
  ModelDimension,
  ModelDocument,
  ModelElement,
  ModelNode,
  PlanPoint,
} from './modelGeometry';

const round = (n: number) => Math.round(n * 10000) / 10000;
const distance = (a: PlanPoint, b: PlanPoint) => Math.hypot(a.x - b.x, a.z - b.z);
export function wallEnds(e: ModelElement): [PlanPoint, PlanPoint] {
  const a = (e.rotacao * Math.PI) / 180,
    dx = (Math.cos(a) * e.largura) / 2,
    dz = (-Math.sin(a) * e.largura) / 2;
  return [
    { x: round(e.x - dx), z: round(e.z - dz) },
    { x: round(e.x + dx), z: round(e.z + dz) },
  ];
}
export function upgrade(doc: ModelDocument) {
  doc.schemaVersao = 2;
  doc.nos ??= [];
  doc.cotas ??= [];
  doc.ambientes ??= [];
}
export function syncTopology(doc: ModelDocument) {
  const nodes = new Map((doc.nos || []).map((n) => [n.id, n]));
  for (const e of doc.elementos)
    if (e.tipo === 'PAREDE' && e.noInicioId && e.noFimId) {
      const a = nodes.get(e.noInicioId),
        b = nodes.get(e.noFimId);
      if (!a || !b) continue;
      const [currentA, currentB] = wallEnds(e);
      if (distance(currentA, a) < 0.0000001 && distance(currentB, b) < 0.0000001) continue;
      e.x = round((a.x + b.x) / 2);
      e.z = round((a.z + b.z) / 2);
      e.largura = round(distance(a, b));
      e.rotacao = round((-Math.atan2(b.z - a.z, b.x - a.x) * 180) / Math.PI);
    }
  for (const c of doc.cotas || []) {
    const a = nodes.get(c.noAId || ''),
      b = nodes.get(c.noBId || '');
    if (a) {
      c.ax = a.x;
      c.az = a.z;
    } else c.noAId = null;
    if (b) {
      c.bx = b.x;
      c.bz = b.z;
    } else c.noBId = null;
  }
  const walls = new Map(doc.elementos.filter((e) => e.tipo === 'PAREDE').map((e) => [e.id, e]));
  for (const r of doc.ambientes || [])
    r.paredeIds = r.paredeIds.filter((id) => walls.get(id)?.pavimentoId === r.pavimentoId);
  const used = new Set<string>();
  for (const e of doc.elementos) {
    if (e.noInicioId) used.add(e.noInicioId);
    if (e.noFimId) used.add(e.noFimId);
  }
  for (const c of doc.cotas || []) {
    if (c.noAId) used.add(c.noAId);
    if (c.noBId) used.add(c.noBId);
  }
  if (doc.nos) doc.nos = doc.nos.filter((n) => used.has(n.id));
}
export function connectWalls(doc: ModelDocument, floor: string, ids?: string[], tolerance = 0.001) {
  upgrade(doc);
  const get = (point: PlanPoint) => {
    let node = doc.nos!.find((n) => n.pavimentoId === floor && distance(n, point) <= tolerance);
    if (!node) {
      node = { id: crypto.randomUUID(), pavimentoId: floor, ...point };
      doc.nos!.push(node);
    }
    return node.id;
  };
  for (const e of doc.elementos.filter(
    (e) => e.tipo === 'PAREDE' && e.pavimentoId === floor && (!ids || ids.includes(e.id)),
  )) {
    const [a, b] = wallEnds(e);
    e.noInicioId = get(a);
    e.noFimId = get(b);
  }
  syncTopology(doc);
}
export function nearestPlanPoint(
  point: PlanPoint,
  doc: ModelDocument,
  floor: string,
  tolerance: number,
  excludeNodeId?: string,
): PlanPoint {
  const excluded = doc.nos?.find((n) => n.id === excludeNodeId);
  const candidates: PlanPoint[] = [
    ...(doc.nos || []).filter((n) => n.pavimentoId === floor && n.id !== excludeNodeId),
    ...doc.elementos
      .filter((e) => e.tipo === 'PAREDE' && e.pavimentoId === floor)
      .flatMap(wallEnds)
      .filter((p) => !excluded || distance(p, excluded) > 0.000001),
  ];
  let result = point,
    best = tolerance;
  for (const p of candidates) {
    const d = distance(point, p);
    if (d < best) {
      result = p;
      best = d;
    }
  }
  return { x: result.x, z: result.z };
}
export function writeWallNodes(doc: ModelDocument, wall: ModelElement, previousFloor?: string) {
  if (!wall.noInicioId || !wall.noFimId) return;
  if (previousFloor && previousFloor !== wall.pavimentoId) {
    const [a, b] = wallEnds(wall);
    wall.noInicioId = crypto.randomUUID();
    wall.noFimId = crypto.randomUUID();
    doc.nos ??= [];
    doc.nos.push(
      { id: wall.noInicioId, pavimentoId: wall.pavimentoId, ...a },
      { id: wall.noFimId, pavimentoId: wall.pavimentoId, ...b },
    );
    return;
  }
  const [a, b] = wallEnds(wall);
  for (const [id, p] of [
    [wall.noInicioId, a],
    [wall.noFimId, b],
  ] as [string, PlanPoint][]) {
    const n = doc.nos?.find((n) => n.id === id);
    if (n) {
      n.x = p.x;
      n.z = p.z;
    }
  }
}
export function dimensionGeometry(c: ModelDimension) {
  let a = { x: c.ax, z: c.az },
    b = { x: c.bx, z: c.bz };
  if (c.tipo === 'HORIZONTAL') {
    const z = Math.min(c.az, c.bz) - c.afastamento;
    a = { x: c.ax, z };
    b = { x: c.bx, z };
  } else if (c.tipo === 'VERTICAL') {
    const x = Math.max(c.ax, c.bx) + c.afastamento;
    a = { x, z: c.az };
    b = { x, z: c.bz };
  } else {
    const d = Math.hypot(c.bx - c.ax, c.bz - c.az) || 1,
      nx = -(c.bz - c.az) / d,
      nz = (c.bx - c.ax) / d;
    a = { x: c.ax + nx * c.afastamento, z: c.az + nz * c.afastamento };
    b = { x: c.bx + nx * c.afastamento, z: c.bz + nz * c.afastamento };
  }
  return { a, b, comprimento: distance(a, b) };
}
export function topologyValidation(doc: ModelDocument, ids: Set<string>): string | null {
  if (
    (doc.nos && !Array.isArray(doc.nos)) ||
    (doc.cotas && !Array.isArray(doc.cotas)) ||
    (doc.ambientes && !Array.isArray(doc.ambientes))
  )
    return 'Anotações de projeto inválidas.';
  const nodes = doc.nos || [],
    dimensions = doc.cotas || [],
    rooms = doc.ambientes || [];
  if (nodes.length > 4000 || dimensions.length > 500 || rooms.length > 500)
    return 'Limite de 4.000 nós, 500 cotas e 500 identificações de ambiente.';
  if (doc.schemaVersao === 1 && (nodes.length || dimensions.length || rooms.length))
    return 'Recursos de planta exigem formato de projeto 2.';
  const floors = new Set(doc.pavimentos.map((f) => f.id)),
    nodeMap = new Map<string, ModelNode>();
  const identify = (id: string) => {
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id) || ids.has(id)) return false;
    ids.add(id);
    return true;
  };
  const point = (x: number, z: number) =>
    Number.isFinite(x) && Number.isFinite(z) && Math.abs(x) <= 10000 && Math.abs(z) <= 10000;
  for (const n of nodes) {
    if (!n || !identify(n.id) || !floors.has(n.pavimentoId) || !point(n.x, n.z))
      return 'Nó de parede inválido ou repetido.';
    nodeMap.set(n.id, n);
  }
  for (const e of doc.elementos)
    if (e.noInicioId || e.noFimId) {
      const a = nodeMap.get(e.noInicioId || ''),
        b = nodeMap.get(e.noFimId || '');
      if (
        doc.schemaVersao !== 2 ||
        e.tipo !== 'PAREDE' ||
        !a ||
        !b ||
        a.id === b.id ||
        a.pavimentoId !== e.pavimentoId ||
        b.pavimentoId !== e.pavimentoId
      )
        return 'Conexão de parede inválida.';
      const [pa, pb] = wallEnds(e);
      if (distance(a, pa) > 0.001 || distance(b, pb) > 0.001)
        return 'Medidas divergem dos nós da parede.';
    }
  for (const c of dimensions) {
    if (
      !c ||
      !identify(c.id) ||
      !floors.has(c.pavimentoId) ||
      !point(c.ax, c.az) ||
      !point(c.bx, c.bz) ||
      !Number.isFinite(c.afastamento) ||
      Math.abs(c.afastamento) > 100 ||
      !['ALINHADA', 'HORIZONTAL', 'VERTICAL'].includes(c.tipo)
    )
      return 'Cota inválida.';
    const a = nodeMap.get(c.noAId || ''),
      b = nodeMap.get(c.noBId || '');
    if (
      c.noAId &&
      (!a || a.pavimentoId !== c.pavimentoId || distance(a, { x: c.ax, z: c.az }) > 0.001)
    )
      return 'Vínculo da cota inválido.';
    if (
      c.noBId &&
      (!b || b.pavimentoId !== c.pavimentoId || distance(b, { x: c.bx, z: c.bz }) > 0.001)
    )
      return 'Vínculo da cota inválido.';
    if (dimensionGeometry(c).comprimento < 0.01) return 'A cota precisa medir ao menos 0,01 m.';
  }
  const walls = new Map(doc.elementos.filter((e) => e.tipo === 'PAREDE').map((e) => [e.id, e]));
  for (const r of rooms) {
    if (
      !r ||
      !identify(r.id) ||
      !floors.has(r.pavimentoId) ||
      !point(r.x, r.z) ||
      typeof r.nome !== 'string' ||
      !r.nome.trim() ||
      r.nome.length > 100 ||
      !Array.isArray(r.paredeIds) ||
      r.paredeIds.length > 200 ||
      r.paredeIds.some((id) => !walls.has(id) || walls.get(id)!.pavimentoId !== r.pavimentoId)
    )
      return 'Identificação de ambiente inválida.';
  }
  return null;
}
