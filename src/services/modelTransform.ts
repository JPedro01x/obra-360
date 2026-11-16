import { copyDraft, opening, rounded, validation, type ModelDraft } from './modelGeometry';
import { syncTopology, writeWallNodes } from './planTopology';

export type ElementTransform = {
  x: number;
  y: number;
  z: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
};
/** Converts a world-space manipulation into the existing document and topology. */
export function transformElement(
  draft: ModelDraft,
  id: string,
  change: ElementTransform,
): ModelDraft {
  if (
    Object.values(change).some((v) => !Number.isFinite(v)) ||
    [change.scaleX, change.scaleY, change.scaleZ].some((v) => v <= 0)
  )
    throw new Error('A transformação deve usar medidas finitas e escala positiva.');
  const next = copyDraft(draft);
  const target = next.documento.elementos.find((e) => e.id === id);
  if (!target) throw new Error('Elemento não encontrado no modelo atual.');
  const floor = next.documento.pavimentos.find((f) => f.id === target.pavimentoId)!;
  if (opening(target)) {
    const wall = next.documento.elementos.find((e) => e.id === target.paredeId)!;
    const angle = (wall.rotacao * Math.PI) / 180;
    target.deslocamento = rounded(
      (change.x - wall.x) * Math.cos(angle) - (change.z - wall.z) * Math.sin(angle),
    );
    target.base = rounded(change.y - floor.cota - wall.base);
  } else {
    target.x = rounded(change.x);
    target.z = rounded(change.z);
    target.base = rounded(change.y - floor.cota);
    target.rotacao = rounded(((change.rotation % 360) + 360) % 360);
    target.profundidade = rounded(target.profundidade * change.scaleZ);
  }
  target.largura = rounded(target.largura * change.scaleX);
  target.altura = rounded(target.altura * change.scaleY);
  if (target.tipo === 'PAREDE') writeWallNodes(next.documento, target);
  syncTopology(next.documento);
  const error = validation(next);
  if (error) throw new Error(error);
  return next;
}
