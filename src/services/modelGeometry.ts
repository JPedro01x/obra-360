import { topologyValidation } from './planTopology';
import type { SavedPlanReference } from './planReference';
export type ElementType = 'PAREDE' | 'LAJE' | 'PILAR' | 'PORTA' | 'JANELA';
export type ModelFloor = { id: string; nome: string; cota: number; altura: number };
export type ModelElement = {
  id: string;
  pavimentoId: string;
  tipo: ElementType;
  nome: string;
  x: number;
  z: number;
  base: number;
  largura: number;
  profundidade: number;
  altura: number;
  rotacao: number;
  cor: string;
  paredeId: string | null;
  deslocamento: number;
  noInicioId?: string | null;
  noFimId?: string | null;
};
export type PlanPoint = { x: number; z: number };
export type ModelNode = PlanPoint & { id: string; pavimentoId: string };
export type ModelDimension = {
  id: string;
  pavimentoId: string;
  tipo: 'ALINHADA' | 'HORIZONTAL' | 'VERTICAL';
  ax: number;
  az: number;
  bx: number;
  bz: number;
  afastamento: number;
  noAId?: string | null;
  noBId?: string | null;
};
export type ModelRoom = PlanPoint & {
  id: string;
  pavimentoId: string;
  nome: string;
  paredeIds: string[];
};
export type ModelDocument = {
  schemaVersao: 1 | 2;
  pavimentos: ModelFloor[];
  elementos: ModelElement[];
  nos?: ModelNode[];
  cotas?: ModelDimension[];
  ambientes?: ModelRoom[];
};
export type ModelDraft = { nome: string; documento: ModelDocument };
export type SavedModel = ModelDraft & {
  referencia?: SavedPlanReference | null;
  id: number;
  projetoObraId: number;
  versao: number;
  revisao: number;
  arquivado: boolean;
  atualizadoEm: string;
  unidadePublicadaId?: number | null;
  revisaoPublicada?: number | null;
};
export const editableRoles = ['SUPER_ADMIN', 'GERENTE_OBRA', 'ENGENHEIRO', 'ARQUITETO'];
export const modelRoles = [...editableRoles, 'MESTRE_OBRA', 'AUDITOR', 'INCORPORADOR'];
export const opening = (element: ModelElement) =>
  element.tipo === 'PORTA' || element.tipo === 'JANELA';
export const copyDraft = (draft: ModelDraft): ModelDraft => JSON.parse(JSON.stringify(draft));
export const rounded = (n: number) => Math.round(n * 10000) / 10000;
export function anchor(element: ModelElement, all: ModelElement[]) {
  const wall = element.paredeId ? all.find((e) => e.id === element.paredeId) : null;
  if (!wall)
    return {
      x: element.x,
      z: element.z,
      base: element.base,
      rotacao: element.rotacao,
      profundidade: element.profundidade,
    };
  const angle = (wall.rotacao * Math.PI) / 180;
  return {
    x: wall.x + Math.cos(angle) * element.deslocamento,
    z: wall.z - Math.sin(angle) * element.deslocamento,
    base: wall.base + element.base,
    rotacao: wall.rotacao,
    profundidade: wall.profundidade,
  };
}
export function validation(draft: ModelDraft): string | null {
  if (
    !draft ||
    typeof draft.nome !== 'string' ||
    !draft.documento ||
    ![1, 2].includes(draft.documento.schemaVersao) ||
    !Array.isArray(draft.documento.pavimentos) ||
    !Array.isArray(draft.documento.elementos)
  )
    return 'Formato de projeto inválido.';
  const doc = draft.documento;
  if (!draft.nome.trim() || draft.nome.length > 150)
    return 'Informe um nome de até 150 caracteres.';
  if (!doc.pavimentos.length || doc.pavimentos.length > 50 || doc.elementos.length > 2000)
    return 'Use de 1 a 50 pavimentos e até 2.000 elementos.';
  const ids = new Set<string>();
  for (const f of doc.pavimentos) {
    if (
      !f ||
      typeof f.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(f.id) ||
      typeof f.nome !== 'string'
    )
      return 'Pavimento inválido no arquivo de projeto.';
    if (ids.has(f.id)) return 'Identificador repetido.';
    ids.add(f.id);
    if (
      !f.nome.trim() ||
      f.nome.length > 100 ||
      !Number.isFinite(f.cota) ||
      f.cota < -1000 ||
      f.cota > 10000 ||
      !Number.isFinite(f.altura) ||
      f.altura < 0.1 ||
      f.altura > 100
    )
      return 'Confira nome, cota e altura do pavimento.';
  }
  const walls = new Map(doc.elementos.filter((e) => e?.tipo === 'PAREDE').map((e) => [e.id, e]));
  for (const e of doc.elementos) {
    if (
      !e ||
      typeof e.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(e.id) ||
      typeof e.nome !== 'string' ||
      typeof e.cor !== 'string' ||
      !['PAREDE', 'LAJE', 'PILAR', 'PORTA', 'JANELA'].includes(e.tipo)
    )
      return 'Elemento inválido no arquivo de projeto.';
    if (ids.has(e.id)) return 'Identificador repetido.';
    ids.add(e.id);
    const f = doc.pavimentos.find((f) => f.id === e.pavimentoId);
    if (!f) return 'Pavimento inexistente.';
    if (!e.nome.trim() || e.nome.length > 100 || !/^#[a-f0-9]{6}$/i.test(e.cor))
      return 'Confira nome e cor do elemento.';
    if (
      [e.x, e.z, e.base, e.largura, e.profundidade, e.altura, e.rotacao, e.deslocamento].some(
        (n) => !Number.isFinite(n),
      )
    )
      return 'As medidas precisam ser números finitos.';
    if (
      Math.abs(e.x) > 10000 ||
      Math.abs(e.z) > 10000 ||
      Math.abs(e.rotacao) > 360 ||
      e.base < 0 ||
      e.base > 100 ||
      e.largura < 0.01 ||
      e.largura > 1000 ||
      e.profundidade < 0.01 ||
      e.profundidade > 1000 ||
      e.altura < 0.01 ||
      e.altura > 100
    )
      return 'Medidas fora dos limites do editor.';
    if (!opening(e)) {
      if (e.paredeId != null || e.deslocamento !== 0)
        return 'Somente aberturas usam parede e deslocamento.';
      if (e.tipo !== 'LAJE' && e.base + e.altura > f.altura + 1e-6)
        return 'O elemento ultrapassa a altura do pavimento.';
    } else {
      const w = walls.get(e.paredeId || '');
      if (!w || w.pavimentoId !== e.pavimentoId)
        return 'Portas e janelas precisam de uma parede no mesmo pavimento.';
      if (
        Math.abs(e.deslocamento) + e.largura / 2 > w.largura / 2 + 1e-6 ||
        e.base + e.altura > w.altura + 1e-6
      )
        return 'A abertura não cabe na parede.';
      if (e.tipo === 'PORTA' && e.base !== 0) return 'A porta deve iniciar na base da parede.';
    }
  }
  for (const wall of walls.values()) {
    const list = doc.elementos.filter((e) => e.paredeId === wall.id);
    if (list.length > 32) return 'Limite de 32 aberturas por parede.';
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i],
          b = list[j];
        if (
          Math.abs(a.deslocamento - b.deslocamento) < (a.largura + b.largura) / 2 - 1e-6 &&
          Math.max(a.base, b.base) < Math.min(a.base + a.altura, b.base + b.altura) - 1e-6
        )
          return 'Portas ou janelas se sobrepõem na parede.';
      }
  }
  return topologyValidation(doc, ids);
}
export function wallCells(wall: ModelElement, elements: ModelElement[]) {
  const holes = elements.filter((e) => e.paredeId === wall.id);
  const xs = Array.from(
    new Set([
      -wall.largura / 2,
      wall.largura / 2,
      ...holes.flatMap((o) => [o.deslocamento - o.largura / 2, o.deslocamento + o.largura / 2]),
    ]),
  ).sort((a, b) => a - b);
  const ys = Array.from(
    new Set([0, wall.altura, ...holes.flatMap((o) => [o.base, o.base + o.altura])]),
  ).sort((a, b) => a - b);
  const cells: { x: number; y: number; width: number; height: number }[] = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < ys.length - 1; j++) {
      const x = (xs[i] + xs[i + 1]) / 2,
        y = (ys[j] + ys[j + 1]) / 2,
        width = xs[i + 1] - xs[i],
        height = ys[j + 1] - ys[j];
      if (
        width > 1e-6 &&
        height > 1e-6 &&
        !holes.some(
          (o) =>
            Math.abs(x - o.deslocamento) < o.largura / 2 - 1e-7 &&
            y > o.base - 1e-7 &&
            y < o.base + o.altura + 1e-7,
        )
      )
        cells.push({ x, y, width, height });
    }
  return cells;
}
