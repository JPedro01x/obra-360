/**
 * GOF DESIGN PATTERN: STRATEGY & FACTORY PATTERN
 * Estratégia extensível de Cálculo Físico-Financeiro de Insumos por Metro Quadrado (m²)
 */

export interface MaterialCalculationResult {
  cementBags: number;
  steelKg: number;
  bricksThousands: number;
  sandM3: number;
  gravelM3: number;
}

export interface MaterialCalculationStrategy {
  calculate(areaM2: number): MaterialCalculationResult;
  getStructureType(): string;
}

export class ReinforcedConcreteStrategy implements MaterialCalculationStrategy {
  calculate(areaM2: number): MaterialCalculationResult {
    return {
      cementBags: Math.round(areaM2 * 7),
      steelKg: Math.round(areaM2 * 8),
      bricksThousands: Number((areaM2 * 0.04).toFixed(1)),
      sandM3: Number((areaM2 * 0.12).toFixed(1)),
      gravelM3: Number((areaM2 * 0.10).toFixed(1)),
    };
  }

  getStructureType(): string {
    return 'Estrutura Convencional em Concreto Armado (Fck 30MPa)';
  }
}

export class StructuralMasonryStrategy implements MaterialCalculationStrategy {
  calculate(areaM2: number): MaterialCalculationResult {
    return {
      cementBags: Math.round(areaM2 * 5),
      steelKg: Math.round(areaM2 * 4),
      bricksThousands: Number((areaM2 * 0.06).toFixed(1)),
      sandM3: Number((areaM2 * 0.09).toFixed(1)),
      gravelM3: Number((areaM2 * 0.06).toFixed(1)),
    };
  }

  getStructureType(): string {
    return 'Alvenaria Estrutural com Blocos de Concreto Groutados';
  }
}

/**
 * Factory Method para recuperar a estratégia de cálculo selecionada
 */
export class MaterialCalculatorFactory {
  static getStrategy(type: 'CONCRETO_ARMADO' | 'ALVENARIA_ESTRUTURAL'): MaterialCalculationStrategy {
    switch (type) {
      case 'ALVENARIA_ESTRUTURAL':
        return new StructuralMasonryStrategy();
      case 'CONCRETO_ARMADO':
      default:
        return new ReinforcedConcreteStrategy();
    }
  }
}
