import React, { useState } from 'react';
import { diagnoseGeometry } from '../services/modelDiagnostics';
import type { ModelDocument } from '../services/modelGeometry';

export function ModelDiagnostics({
  documento,
  onInspect,
}: {
  documento: ModelDocument;
  onInspect: (ids: string[], floor: string) => void;
}) {
  const [result, setResult] = useState<{
    document: ModelDocument;
    scan: ReturnType<typeof diagnoseGeometry>;
  } | null>(null);
  const stale = result?.document !== documento;
  return (
    <section className="model-reference-panel" aria-label="Conferência da geometria">
      <h3>Conferência da geometria</h3>
      <p className="ws-help">
        Compara volumes retangulares sem descontar vãos e verifica extremidades livres e cotas de
        pavimentos. Conexões estruturais podem ser intencionais. A análise não certifica o projeto e
        não modifica elementos.
      </p>
      <button
        className="ws-secondary"
        onClick={() => setResult({ document: documento, scan: diagnoseGeometry(documento) })}
      >
        Verificar geometria
      </button>
      {result &&
        (stale ? (
          <p role="status">O modelo mudou. Execute a conferência novamente.</p>
        ) : (
          <>
            <p role="status">{result.scan.issues.length} apontamento(s) para revisão.</p>
            {result.scan.limited && (
              <p role="alert">
                A análise atingiu o limite de comparações ou 100 apontamentos. Corrija ou revise por
                partes; a lista não é completa.
              </p>
            )}
            <ul className="model-diagnostic-list">
              {result.scan.issues.map((issue, i) => (
                <li key={i}>
                  <span>{issue.message}</span>
                  <button onClick={() => onInspect(issue.ids, issue.floorId)}>Inspecionar</button>
                </li>
              ))}
            </ul>
          </>
        ))}
    </section>
  );
}
