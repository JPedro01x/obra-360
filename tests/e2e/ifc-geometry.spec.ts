import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { IfcAPI } from 'web-ifc';
import { ifcLinearDeterminant, transformIfcPoint } from '../../src/services/ifcCoordinate';

test('IFC em milímetros vira uma malha Y-up em metros sem escalar duas vezes', async () => {
  const api = new IfcAPI();
  await api.Init();
  let model = -1;
  try {
    const file = new Uint8Array(readFileSync(fileURLToPath(new URL('../fixtures/geometry-mm.ifc', import.meta.url))));
    model = api.OpenModel(file, { COORDINATE_TO_ORIGIN: false });
    expect(api.GetModelSchema(model)).toBe('IFC4');
    const walls = api.GetLineIDsWithType(model, api.GetTypeCodeFromName('IFCWALL'), true);
    expect(walls.size()).toBe(1);
    const flat = api.GetFlatMesh(model, walls.get(0), true);
    expect(flat.geometries.size()).toBe(1);
    const placed = flat.geometries.get(0);
    const geometry = api.GetGeometry(model, placed.geometryExpressID);
    try {
      const interleaved = api.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
      const transform = placed.flatTransformation;
      expect(ifcLinearDeterminant(transform)).toBeGreaterThan(0);
      const points = [];
      for (let index = 0; index < interleaved.length; index += 6)
        points.push(transformIfcPoint(transform, interleaved[index], interleaved[index + 1], interleaved[index + 2]));
      const bounds = (axis: 'x' | 'y' | 'z') => [
        Math.min(...points.map((point) => point[axis])),
        Math.max(...points.map((point) => point[axis])),
      ];
      const dimensions = ['x', 'y', 'z'].map((axis) => {
        const [minimum, maximum] = bounds(axis as 'x' | 'y' | 'z');
        return Number((maximum - minimum).toFixed(3));
      });
      expect(dimensions).toEqual([4, 2.8, 0.2]);
      expect(api.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize()).length / 3).toBe(12);
    } finally {
      geometry.delete();
    }
  } finally {
    if (model >= 0) api.CloseModel(model);
    api.Dispose();
  }
});

test('parser converte IFC para schema 3 e preserva malha na serialização JSON local', async ({ page }) => {
  const bytes = readFileSync(fileURLToPath(new URL('../fixtures/geometry-mm.ifc', import.meta.url)));
  await page.goto('/tests/fixtures/geometry-mm.ifc');
  const outcome = await page.evaluate(async (fileBytes) => {
    const [{ parseRealIfc }, { validation }] = await Promise.all([
      import('/src/services/RealIfcParser.ts'),
      import('/src/services/modelGeometry.ts'),
    ]);
    const file = new File([new Uint8Array(fileBytes)], 'geometry-mm.ifc');
    const imported = await parseRealIfc(file, true);
    const mesh = imported.modelMeshes?.[0];
    if (!mesh) throw new Error('Parser não retornou malha.');
    const draft = {
      nome: 'Modelo IFC',
      documento: {
        schemaVersao: 3,
        pavimentos: [{ id: 'floor-1', nome: 'Térreo', cota: 0, altura: 3 }],
        elementos: [{
          id: `ifc-${mesh.sourceExpressId}`, pavimentoId: 'floor-1', tipo: 'MALHA_IFC',
          nome: mesh.sourceName, x: mesh.x, z: mesh.z, base: mesh.y - mesh.altura / 2,
          largura: mesh.largura, profundidade: mesh.profundidade, altura: mesh.altura,
          rotacao: 0, cor: mesh.cor, paredeId: null, deslocamento: 0,
          malhaIfc: {
            positionsBase64: mesh.positionsBase64, indicesBase64: mesh.indicesBase64,
            plantaXZ: mesh.plantaXZ, sourceGlobalId: mesh.sourceGlobalId,
            sourceExpressId: mesh.sourceExpressId, sourceType: mesh.sourceType,
            sourceName: mesh.sourceName,
          },
        }],
      },
    };
    const savePayload = JSON.stringify(draft);
    const reopened = JSON.parse(savePayload);
    return {
      sourceGlobalId: mesh.sourceGlobalId,
      sourceType: mesh.sourceType,
      bounds: [mesh.largura, mesh.altura, mesh.profundidade],
      beforeValidation: validation(draft),
      afterValidation: validation(reopened),
      schemaVersao: reopened.documento.schemaVersao,
      persistedMesh: reopened.documento.elementos[0].malhaIfc,
    };
  }, [...bytes]);
  expect(outcome.sourceGlobalId).toBe('0000000000000000000002');
  expect(outcome.sourceType).toBe('IfcWall');
  expect(outcome.bounds.map((n) => Number(n.toFixed(3)))).toEqual([4, 2.8, 0.2]);
  expect(outcome.beforeValidation).toBeNull();
  expect(outcome.afterValidation).toBeNull();
  expect(outcome.schemaVersao).toBe(3);
  expect(outcome.persistedMesh).toMatchObject({
    sourceGlobalId: outcome.sourceGlobalId,
    sourceType: 'IfcWall',
  });
  expect(outcome.persistedMesh.positionsBase64.length).toBeGreaterThan(0);
  expect(outcome.persistedMesh.indicesBase64.length).toBeGreaterThan(0);
});

test('IFC inválido e acima do limite falham sem alterar rascunho no browser', async ({ page }) => {
  await page.goto('/tests/fixtures/geometry-mm.ifc');
  const result = await page.evaluate(async () => {
    const { parseRealIfc } = await import('/src/services/RealIfcParser.ts');
    const draft = {
      nome: 'Modelo existente',
      documento: {
        schemaVersao: 1,
        pavimentos: [{ id: 'floor-1', nome: 'Térreo', cota: 0, altura: 3 }],
        elementos: [],
      },
    };
    const before = JSON.stringify(draft);
    const errors: string[] = [];
    for (const file of [
      new File(['isto não é IFC'], 'invalid.ifc'),
      new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'oversized.ifc'),
    ]) {
      try { await parseRealIfc(file, true); }
      catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
    }
    return { errors, unchanged: JSON.stringify(draft) === before };
  });
  expect(result.errors[0]).toContain('cabeçalho IFC STEP válido');
  expect(result.errors[1]).toContain('até 20 MB');
  expect(result.unchanged).toBe(true);
});
