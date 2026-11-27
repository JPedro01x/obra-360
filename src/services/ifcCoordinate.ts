export type IfcPoint = { x: number; y: number; z: number };

/** Applies web-ifc's flat transformation, which already includes unit scaling and Y-up axes. */
export function transformIfcPoint(matrix: readonly number[], x: number, y: number, z: number): IfcPoint {
  const tx = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  const ty = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  const tz = matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14];
  const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  const scale = w && w !== 1 ? 1 / w : 1;
  return { x: tx * scale, y: ty * scale, z: tz * scale };
}

/** Determinant of the linear 3x3 part of a column-major 4x4 transformation. */
export function ifcLinearDeterminant(matrix: readonly number[]) {
  return (
    matrix[0] * (matrix[5] * matrix[10] - matrix[9] * matrix[6]) -
    matrix[4] * (matrix[1] * matrix[10] - matrix[9] * matrix[2]) +
    matrix[8] * (matrix[1] * matrix[6] - matrix[5] * matrix[2])
  );
}
