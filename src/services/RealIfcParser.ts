import { IfcAPI, IFCELEMENT, IFCPROJECT, IFCRELDEFINESBYPROPERTIES } from 'web-ifc';
import wasmUrl from 'web-ifc/web-ifc.wasm?url';

export interface IfcElementRead {
  expressId: number;
  guid: string;
  type: string;
  name: string;
  volumeM3: number | null;
  areaM2: number | null;
  weightKg: number | null;
}
export interface IfcReadResult {
  fileName: string;
  ifcSchema: string;
  totalElementsCount: number;
  parsedElements: IfcElementRead[];
  totalReportedVolumeM3: number | null;
  totalReportedAreaM2: number | null;
  totalReportedWeightKg: number | null;
  warnings: string[];
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
export async function parseRealIfc(file: File): Promise<IfcReadResult> {
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
    model = api.OpenModel(bytes, { COORDINATE_TO_ORIGIN: true });
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
    return {
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
  } finally {
    if (model >= 0) api.CloseModel(model);
    if (initialized) api.Dispose();
  }
}
