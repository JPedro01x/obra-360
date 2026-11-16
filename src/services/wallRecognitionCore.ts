import type { ModelElement } from './modelGeometry';
import type { PlanReference } from './planReference';
export type WallRectangle = {
  x: number;
  z: number;
  largura: number;
  profundidade: number;
  rotacao: number;
};
/** Conservative detector for solid strokes; all results require human review. */
export function wallRectangles(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  reference: PlanReference,
): WallRectangle[] {
  if (
    width < 1 ||
    height < 1 ||
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width > 1200 ||
    height > 1200 ||
    pixels.length !== width * height * 4 ||
    !Number.isFinite(reference.width) ||
    !Number.isFinite(reference.height) ||
    !Number.isFinite(reference.x) ||
    !Number.isFinite(reference.z) ||
    reference.width > 1_000_000 ||
    reference.height > 1_000_000 ||
    reference.width <= 0 ||
    reference.height <= 0
  )
    throw new Error('Imagem ou escala inválida para reconhecimento.');
  const ink = new Uint8Array(width * height);
  for (let i = 0; i < ink.length; i++) {
    const p = i * 4;
    const r = pixels[p],
      g = pixels[p + 1],
      b = pixels[p + 2];
    ink[i] =
      pixels[p + 3] > 100 && Math.max(r, g, b) - Math.min(r, g, b) < 40 && (r + g + b) / 3 < 185
        ? 1
        : 0;
  }
  const found: WallRectangle[] = [];
  for (const vertical of [false, true]) {
    const across = vertical ? height : width,
      down = vertical ? width : height;
    const alongScale = (vertical ? reference.height : reference.width) / across;
    const thickScale = (vertical ? reference.width : reference.height) / down;
    const minLength = Math.max(8, Math.ceil(0.8 / alongScale));
    let active: { start: number; end: number; first: number; last: number }[] = [];
    const finish = (r: (typeof active)[number]) => {
      const thickness = (r.last - r.first + 1) * thickScale,
        length = (r.end - r.start) * alongScale;
      if (thickness < 0.07 || thickness > 0.6 || length < 0.8 || length < thickness * 3) return;
      const along = ((r.start + r.end) / 2) * alongScale,
        cross = ((r.first + r.last + 1) / 2) * thickScale;
      found.push({
        x: reference.x + (vertical ? cross : along),
        z: reference.z + (vertical ? along : cross),
        largura: length,
        profundidade: thickness,
        rotacao: vertical ? 90 : 0,
      });
    };
    for (let y = 0; y < down; y++) {
      const runs: { start: number; end: number }[] = [];
      for (let x = 0; x < across;) {
        if (!ink[vertical ? x * width + y : y * width + x]) {
          x++;
          continue;
        }
        const start = x++;
        while (x < across && ink[vertical ? x * width + y : y * width + x]) x++;
        if (x - start >= minLength) runs.push({ start, end: x });
      }
      const next: typeof active = [],
        used = new Set<number>();
      for (const run of runs) {
        const index = active.findIndex(
          (a, i) =>
            !used.has(i) && Math.abs(a.start - run.start) <= 2 && Math.abs(a.end - run.end) <= 2,
        );
        if (index >= 0) {
          used.add(index);
          next.push({ ...active[index], last: y });
        } else next.push({ ...run, first: y, last: y });
      }
      active.forEach((r, i) => {
        if (!used.has(i)) finish(r);
      });
      active = next;
    }
    active.forEach(finish);
  }
  found.push(...diagonalWalls(ink, width, height, reference, found));
  return found
    .sort((a, b) => b.largura - a.largura)
    .filter(
      (r, i, all) =>
        !all
          .slice(0, i)
          .some(
            (a) =>
              a.rotacao === r.rotacao &&
              Math.abs(a.x - r.x) < 0.1 &&
              Math.abs(a.z - r.z) < 0.1 &&
              Math.abs(a.largura - r.largura) < 0.2,
          ),
    )
    .slice(0, 150);
}

function diagonalWalls(
  ink: Uint8Array,
  width: number,
  height: number,
  reference: PlanReference,
  axes: WallRectangle[],
) {
  const remaining = ink.slice(),
    queue = new Int32Array(ink.length),
    result: WallRectangle[] = [];
  const sx = reference.width / width,
    sz = reference.height / height;
  for (const wall of axes) {
    const vertical = wall.rotacao === 90,
      rx = (vertical ? wall.profundidade : wall.largura) / 2,
      rz = (vertical ? wall.largura : wall.profundidade) / 2;
    const left = Math.max(0, Math.floor((wall.x - reference.x - rx) / sx)),
      right = Math.min(width - 1, Math.ceil((wall.x - reference.x + rx) / sx));
    const top = Math.max(0, Math.floor((wall.z - reference.z - rz) / sz)),
      bottom = Math.min(height - 1, Math.ceil((wall.z - reference.z + rz) / sz));
    for (let y = top; y <= bottom; y++) remaining.fill(0, y * width + left, y * width + right + 1);
  }
  for (let start = 0; start < remaining.length; start++) {
    if (!remaining[start]) continue;
    let count = 1,
      head = 0,
      sumX = 0,
      sumZ = 0,
      xx = 0,
      zz = 0,
      xz = 0;
    queue[0] = start;
    remaining[start] = 0;
    while (head < count) {
      const index = queue[head++],
        x = index % width,
        y = Math.floor(index / width),
        px = (x + 0.5) * sx,
        pz = (y + 0.5) * sz;
      sumX += px;
      sumZ += pz;
      xx += px * px;
      zz += pz * pz;
      xz += px * pz;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (remaining[next]) {
            remaining[next] = 0;
            queue[count++] = next;
          }
        }
    }
    if (count < 12) continue;
    const cx = sumX / count,
      cz = sumZ / count,
      cxx = xx / count - cx * cx,
      czz = zz / count - cz * cz,
      cxz = xz / count - cx * cz;
    const angle = Math.atan2(2 * cxz, cxx - czz) / 2,
      dx = Math.cos(angle),
      dz = Math.sin(angle);
    if (Math.min(Math.abs(dz), Math.abs(dx)) < Math.sin((3 * Math.PI) / 180)) continue;
    let min = 0,
      max = 0,
      lo = 0,
      hi = 0;
    for (let k = 0; k < count; k++) {
      const x = ((queue[k] % width) + 0.5) * sx - cx,
        z = (Math.floor(queue[k] / width) + 0.5) * sz - cz;
      const along = x * dx + z * dz,
        cross = -x * dz + z * dx;
      min = Math.min(min, along);
      max = Math.max(max, along);
      lo = Math.min(lo, cross);
      hi = Math.max(hi, cross);
    }
    const length = max - min + Math.abs(dx) * sx + Math.abs(dz) * sz;
    const thickness = hi - lo + Math.abs(dz) * sx + Math.abs(dx) * sz;
    if (
      length < 0.8 ||
      thickness < 0.07 ||
      thickness > 0.6 ||
      length < thickness * 4 ||
      (count * sx * sz) / (length * thickness) < 0.65
    )
      continue;
    const along = (min + max) / 2,
      cross = (lo + hi) / 2;
    result.push({
      x: reference.x + cx + dx * along - dz * cross,
      z: reference.z + cz + dz * along + dx * cross,
      largura: length,
      profundidade: thickness,
      rotacao: ((((-angle * 180) / Math.PI) % 180) + 180) % 180,
    });
  }
  return result;
}

export type OpeningSuggestion = {
  id: string;
  a: string;
  b: string;
  gap: number;
  offset: number;
  merged: ModelElement;
};
/** Gaps are not classified from pixels: the user must explicitly choose door or window. */
export function suggestOpenings(walls: ModelElement[]): OpeningSuggestion[] {
  const result: OpeningSuggestion[] = [];
  for (let i = 0; i < walls.length && result.length < 30; i++)
    for (let j = i + 1; j < walls.length && result.length < 30; j++) {
      const a = walls[i],
        b = walls[j],
        r = (a.rotacao * Math.PI) / 180,
        dx = Math.cos(r),
        dz = -Math.sin(r);
      if (
        a.pavimentoId !== b.pavimentoId ||
        Math.abs(Math.sin(((a.rotacao - b.rotacao) * Math.PI) / 180)) > 0.015 ||
        Math.abs(a.profundidade - b.profundidade) > 0.05
      )
        continue;
      const distance = (b.x - a.x) * dx + (b.z - a.z) * dz,
        cross = -(b.x - a.x) * dz + (b.z - a.z) * dx;
      if (Math.abs(cross) > 0.04) continue;
      const gap = Math.abs(distance) - (a.largura + b.largura) / 2;
      if (gap < 0.5 || gap > 2.2) continue;
      const left = Math.min(-a.largura / 2, distance - b.largura / 2),
        right = Math.max(a.largura / 2, distance + b.largura / 2),
        center = (left + right) / 2;
      const gapCenter =
        distance > 0
          ? (a.largura / 2 + distance - b.largura / 2) / 2
          : (distance + b.largura / 2 - a.largura / 2) / 2;
      result.push({
        id: `${a.id}:${b.id}`,
        a: a.id,
        b: b.id,
        gap,
        offset: gapCenter - center,
        merged: { ...a, x: a.x + dx * center, z: a.z + dz * center, largura: right - left },
      });
    }
  return result;
}
export function applyOpeningSuggestions(
  walls: ModelElement[],
  choices: Record<string, 'PORTA' | 'JANELA'>,
): ModelElement[] {
  const candidates = suggestOpenings(walls),
    used = new Set<string>(),
    extra: ModelElement[] = [];
  for (const [id, type] of Object.entries(choices)) {
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate) throw new Error('As duas paredes do vão precisam estar selecionadas.');
    if (used.has(candidate.a) || used.has(candidate.b))
      throw new Error(
        'Uma parede participa de mais de um vão. Aplique um par por vez e revise o resultado.',
      );
    if (type !== 'PORTA' && type !== 'JANELA')
      throw new Error('Escolha porta ou janela para o vão.');
    used.add(candidate.a);
    used.add(candidate.b);
    const wall = candidate.merged,
      base = type === 'PORTA' ? 0 : Math.min(1, wall.altura / 3);
    extra.push(wall, {
      id: crypto.randomUUID(),
      pavimentoId: wall.pavimentoId,
      tipo: type,
      nome: `${type === 'PORTA' ? 'Porta' : 'Janela'} sugerida — revisar medidas`,
      x: 0,
      z: 0,
      base,
      largura: candidate.gap,
      altura: Math.min(type === 'PORTA' ? 2.1 : 1.2, wall.altura - base),
      profundidade: wall.profundidade,
      rotacao: 0,
      cor: type === 'PORTA' ? '#a16207' : '#38bdf8',
      paredeId: wall.id,
      deslocamento: candidate.offset,
    });
  }
  return [...walls.filter((w) => !used.has(w.id)), ...extra].map((element) => {
    const result = { ...element };
    for (const key of [
      'x',
      'z',
      'base',
      'largura',
      'profundidade',
      'altura',
      'rotacao',
      'deslocamento',
    ] as const)
      result[key] = Math.round(result[key] * 10000) / 10000;
    return result;
  });
}
