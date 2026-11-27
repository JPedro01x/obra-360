import { IfcAPI, IFCELEMENT, IFCPROJECT, IFCRELDEFINESBYPROPERTIES } from 'web-ifc';
import wasmUrl from 'web-ifc/web-ifc.wasm?url';
import { transformIfcPoint } from './ifcCoordinate';

export interface IfcElementRead {
  expressId: number;
  guid: string;
  type: string;
  name: string;
  volumeM3: number | null;
  areaM2: number | null;
  weightKg: number | null;
}
export type IfcModelMesh = {
  positionsBase64: string;
  indicesBase64: string;
  plantaXZ: { x: number; z: number }[];
  sourceGlobalId: string;
  sourceExpressId: number;
  sourceType: string;
  sourceName: string;
  x: number;
  y: number;
  z: number;
  largura: number;
  altura: number;
  profundidade: number;
  cor: string;
};
export interface IfcReadResult {
  fileName: string;
  ifcSchema: string;
  totalElementsCount: number;
  parsedElements: IfcElementRead[];
  totalReportedVolumeM3: number | null;
  totalReportedAreaM2: number | null;
  totalReportedWeightKg: number | null;
  warnings: string[];
  modelMeshes?: IfcModelMesh[];
  omittedGeometryCount?: number;
}
const value = (item: any): any =>
  item && typeof item === 'object' && 'value' in item ? item.value : item;
const prefixes: Record<string, number> = {
  EXA: 1e18,
  PETA: 1e15,
  TERA: 1e12,
  GIGA: 1e9,
  MEGA: 1e6,
  KILO: 1e3,
  HECTO: 1e2,
  DECA: 1e1,
  DECI: 1e-1,
  CENTI: 1e-2,
  MILLI: 1e-3,
  MICRO: 1e-6,
  NANO: 1e-9,
};
function factor(unit: any, expected: string, depth = 0): number | null {
  if (!unit || depth > 5 || value(unit.UnitType) !== expected) return null;
  if (unit.ConversionFactor) {
    const base = factor(unit.ConversionFactor.UnitComponent, expected, depth + 1);
    const amount = Number(value(unit.ConversionFactor.ValueComponent));
    return base !== null && Number.isFinite(amount) ? base * amount : null;
  }
  const prefix = value(unit.Prefix);
  const scale = prefix == null ? 1 : prefixes[prefix];
  if (scale === undefined) return null;
  const name = value(unit.Name);
  if (expected === 'VOLUMEUNIT' && name === 'CUBIC_METRE') return scale ** 3;
  if (expected === 'AREAUNIT' && name === 'SQUARE_METRE') return scale ** 2;
  if (expected === 'MASSUNIT' && name === 'GRAM') return scale / 1000;
  return null;
}
function quantity(sets: any[], property: string, unitType: string, defaults: any[]): number | null {
  const all = sets.flatMap((set) => set.Quantities || []).filter((q) => q[property] !== undefined);
  const chosen =
    all.find((q) => /^net/i.test(String(value(q.Name)))) ||
    all.find((q) => /^gross/i.test(String(value(q.Name)))) ||
    all[0];
  if (!chosen) return null;
  const number = Number(value(chosen[property]));
  const unit = chosen.Unit || defaults.find((u) => value(u.UnitType) === unitType);
  const scale = factor(unit, unitType);
  return Number.isFinite(number) && number >= 0 && scale !== null ? number * scale : null;
}
function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  return btoa(binary);
}
function convexHull(points: { x: number; z: number }[]) {
  const sorted = [...new Map(points.map((p) => [`${p.x},${p.z}`, p])).values()].sort(
    (a, b) => a.x - b.x || a.z - b.z,
  );
  const cross = (o: (typeof sorted)[number], a: (typeof sorted)[number], b: (typeof sorted)[number]) =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const half = (source: typeof sorted) => {
    const result: typeof sorted = [];
    for (const point of source) {
      while (result.length > 1 && cross(result[result.length - 2], result[result.length - 1], point) <= 0)
        result.pop();
      result.push(point);
    }
    return result;
  };
  const lower = half(sorted), upper = half([...sorted].reverse());
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  if (hull.length <= 128) return hull;
  return Array.from({ length: 128 }, (_, index) => hull[Math.floor((index * hull.length) / 128)]);
}
function colorHex(color: any) {
  const channels = [color?.x, color?.y, color?.z].map(Number);
  if (channels.some((part) => !Number.isFinite(part))) return '#94a3b8';
  return `#${channels.map((part) => Math.max(0, Math.min(255, Math.round(part * 255))).toString(16).padStart(2, '0')).join('')}`;
}
function extractModelMeshes(api: IfcAPI, model: number, ids: any, maximumBytes: number) {
  const meshes: IfcModelMesh[] = [];
  let omittedGeometryCount = 0;
  let encodedBytes = 0;
  const modelBounds = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (let i = 0; i < ids.size(); i++) {
    const expressId = ids.get(i);
    const line = api.GetLine(model, expressId);
    try {
      const flat = api.GetFlatMesh(model, expressId, true);
      const points: { x: number; y: number; z: number }[] = [];
      const triangles: number[] = [];
      let materialColor: string | null = null;
      for (let g = 0; g < flat.geometries.size(); g++) {
        const placed = flat.geometries.get(g);
        const geometry = api.GetGeometry(model, placed.geometryExpressID);
        try {
          const interleaved = api.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
          const indices = api.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
          const matrix = placed.flatTransformation;
          if (interleaved.length % 6 !== 0 || indices.length % 3 !== 0)
            throw new Error('A malha IFC contém buffers de geometria inválidos.');
          const vertexOffset = points.length;
          for (let vertex = 0; vertex < interleaved.length; vertex += 6) {
            const point = transformIfcPoint(matrix, interleaved[vertex], interleaved[vertex + 1], interleaved[vertex + 2]);
            if (![point.x, point.y, point.z].every(Number.isFinite))
              throw new Error('A malha IFC contém coordenadas inválidas.');
            points.push(point);
          }
          for (let index = 0; index < indices.length; index++) {
            if (indices[index] >= interleaved.length / 6)
              throw new Error('A malha IFC contém índices fora dos limites.');
            triangles.push(vertexOffset + indices[index]);
          }
          const rawBytes = points.length * 12 + triangles.length * 4;
          if (encodedBytes + Math.ceil(rawBytes / 3) * 4 > maximumBytes)
            throw new Error('A geometria IFC excede o limite de 1,25 MiB. Importe um arquivo simplificado.');
          if (points.length > 100_000 || triangles.length > 300_000)
            throw new Error('Um elemento IFC excede o limite de complexidade geométrica.');
          materialColor ||= colorHex(placed.color);
        } finally {
          geometry.delete();
        }
      }
      if (points.length < 3 || !triangles.length) {
        omittedGeometryCount++;
        continue;
      }
      const min = { x: Infinity, y: Infinity, z: Infinity };
      const max = { x: -Infinity, y: -Infinity, z: -Infinity };
      for (const point of points) {
        min.x = Math.min(min.x, point.x); min.y = Math.min(min.y, point.y); min.z = Math.min(min.z, point.z);
        max.x = Math.max(max.x, point.x); max.y = Math.max(max.y, point.y); max.z = Math.max(max.z, point.z);
      }
      modelBounds.minX = Math.min(modelBounds.minX, min.x);
      modelBounds.maxX = Math.max(modelBounds.maxX, max.x);
      modelBounds.minZ = Math.min(modelBounds.minZ, min.z);
      modelBounds.maxZ = Math.max(modelBounds.maxZ, max.z);
      const center = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 };
      const positions = new Float32Array(points.length * 3);
      points.forEach((point, index) => {
        positions[index * 3] = point.x - center.x;
        positions[index * 3 + 1] = point.y - center.y;
        positions[index * 3 + 2] = point.z - center.z;
      });
      const indices = new Uint32Array(triangles);
      if (positions.byteLength > 1_048_576 || indices.byteLength > 262_144)
        throw new Error('Um elemento IFC excede os limites de posições ou índices.');
      const positionsBase64 = toBase64(new Uint8Array(positions.buffer));
      const indicesBase64 = toBase64(new Uint8Array(indices.buffer));
      encodedBytes += positionsBase64.length + indicesBase64.length;
      if (encodedBytes > maximumBytes)
        throw new Error('A geometria IFC excede o limite de 1,25 MiB. Importe um arquivo simplificado.');
      const hull = convexHull(points.map(({ x, z }) => ({ x: x - center.x, z: z - center.z })));
      if (hull.length < 3) {
        omittedGeometryCount++;
        continue;
      }
      const dimensions = { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z };
      const sourceGlobalId = String(value(line.GlobalId) || '');
      if (!/^[A-Za-z0-9_$]{22}$/.test(sourceGlobalId))
        throw new Error(`O elemento IFC #${expressId} não tem GlobalId válido (22 caracteres).`);
      meshes.push({
        positionsBase64,
        indicesBase64,
        plantaXZ: hull,
        sourceGlobalId,
        sourceExpressId: expressId,
        sourceType: api.GetNameFromTypeCode(line.type),
        sourceName: String(value(line.Name) || `Elemento #${expressId}`).slice(0, 100),
        x: center.x,
        y: center.y,
        z: center.z,
        largura: Math.max(0.01, dimensions.x),
        altura: Math.max(0.01, dimensions.y),
        profundidade: Math.max(0.01, dimensions.z),
        cor: materialColor || '#94a3b8',
      });
      if (meshes.length > 2000) throw new Error('O modelo IFC excede o limite de 2.000 malhas.');
    } catch (error) {
      if (error instanceof Error && /^(A geometria IFC excede|Um elemento IFC|O elemento IFC #)/.test(error.message)) throw error;
      throw new Error(`Não foi possível converter a geometria IFC do elemento #${expressId}.`);
    }
  }
  return {
    meshes,
    omittedGeometryCount,
    centerX: (modelBounds.minX + modelBounds.maxX) / 2,
    centerZ: (modelBounds.minZ + modelBounds.maxZ) / 2,
  };
}
export async function parseRealIfc(file: File, includeGeometry = false): Promise<IfcReadResult> {
  if (file.size > 20 * 1024 * 1024) throw new Error('O leitor aceita arquivos de até 20 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0, 4096)).includes('ISO-10303-21'))
    throw new Error('O arquivo não contém um cabeçalho IFC STEP válido.');
  const api = new IfcAPI();
  let model = -1,
    initialized = false;
  try {
    await api.Init(() => wasmUrl, true);
    initialized = true;
    // Keep vertical elevations intact for the editor's floor mapping. Horizontal offsets are
    // normalized after extracting the complete model, avoiding huge georeferenced X/Z values.
    model = api.OpenModel(bytes, { COORDINATE_TO_ORIGIN: false });
    if (model < 0) throw new Error('Não foi possível abrir o modelo IFC.');
    const projectIds = api.GetLineIDsWithType(model, IFCPROJECT);
    if (!projectIds.size()) throw new Error('O arquivo não contém um IfcProject.');
    const project = api.GetLine(model, projectIds.get(0), true);
    const units = project.UnitsInContext?.Units || [];
    const ids = api.GetLineIDsWithType(model, IFCELEMENT, true);
    if (ids.size() > 10000) throw new Error('Este leitor aceita até 10.000 elementos por arquivo.');
    const relations = api.GetLineIDsWithType(model, IFCRELDEFINESBYPROPERTIES);
    const setsByElement = new Map<number, any[]>();
    for (let i = 0; i < relations.size(); i++) {
      const relation = api.GetLine(model, relations.get(i));
      const reference = value(relation.RelatingPropertyDefinition);
      if (typeof reference !== 'number') continue;
      const set = api.GetLine(model, reference, true);
      if (!set.Quantities) continue;
      for (const object of relation.RelatedObjects || []) {
        const id = value(object);
        setsByElement.set(id, [...(setsByElement.get(id) || []), set]);
      }
    }
    const elements: IfcElementRead[] = [];
    for (let i = 0; i < ids.size(); i++) {
      const id = ids.get(i),
        line = api.GetLine(model, id),
        sets = setsByElement.get(id) || [];
      elements.push({
        expressId: id,
        guid: String(value(line.GlobalId) || ''),
        type: api.GetNameFromTypeCode(line.type),
        name: String(value(line.Name) || `Elemento #${id}`),
        volumeM3: quantity(sets, 'VolumeValue', 'VOLUMEUNIT', units),
        areaM2: quantity(sets, 'AreaValue', 'AREAUNIT', units),
        weightKg: quantity(sets, 'WeightValue', 'MASSUNIT', units),
      });
    }
    const sum = (key: 'volumeM3' | 'areaM2' | 'weightKg') => {
      const known = elements.map((e) => e[key]).filter((v): v is number => v !== null);
      return known.length ? known.reduce((a, b) => a + b, 0) : null;
    };
    const result: IfcReadResult = {
      fileName: file.name,
      ifcSchema: api.GetModelSchema(model),
      totalElementsCount: elements.length,
      parsedElements: elements,
      totalReportedVolumeM3: sum('volumeM3'),
      totalReportedAreaM2: sum('areaM2'),
      totalReportedWeightKg: sum('weightKg'),
      warnings: [
        'Quantitativos extraídos dos conjuntos declarados no arquivo. Elementos sem quantidade ou unidade reconhecida ficam como não informados.',
        'Não há cálculo automático de concreto ou aço a partir de dimensões aproximadas.',
      ],
    };
    if (includeGeometry) {
      const extracted = extractModelMeshes(api, model, ids, 1_310_720);
      result.modelMeshes = extracted.meshes.map((mesh) => ({
        ...mesh,
        x: mesh.x - extracted.centerX,
        z: mesh.z - extracted.centerZ,
      }));
      result.omittedGeometryCount = extracted.omittedGeometryCount;
      if (!extracted.meshes.length) throw new Error('O IFC não contém malhas geométricas trianguladas compatíveis.');
      result.warnings.push(`${extracted.omittedGeometryCount} elemento(s) sem geometria 3D triangulada foram ignorados.`);
    }
    return result;
  } finally {
    if (model >= 0) api.CloseModel(model);
    if (initialized) api.Dispose();
  }
}
