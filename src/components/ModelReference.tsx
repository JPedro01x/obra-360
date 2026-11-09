import React, { useEffect, useRef, useState } from 'react';
import { renderPlanReference, type OpenPlanReference } from '../services/planReference';

export function ModelReference({
  reference,
  floorId,
  calibrated,
  calibrating,
  disabled,
  onLoad,
  onCalibrate,
  onRemove,
}: {
  reference?: OpenPlanReference;
  floorId: string;
  calibrated: boolean;
  calibrating: boolean;
  disabled: boolean;
  onLoad: (reference: OpenPlanReference) => void;
  onCalibrate: (meters: number | null) => void;
  onRemove: () => void;
}) {
  const [pageChoice, setPageChoice] = useState<{ reference: OpenPlanReference; page: number }>();
  const page = reference && pageChoice?.reference === reference ? pageChoice.page : reference?.page ?? 1;
  const [meters, setMeters] = useState('5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  async function load(source: File, pageNumber: number) {
    const current = ++generation.current;
    setError('');
    setBusy(true);
    try {
      const result = await renderPlanReference(source, pageNumber);
      if (generation.current !== current) return;
      onLoad({ ...result.reference, file: source, page: pageNumber, pages: result.pages, floorId, calibrated: false });
    } catch (failure) {
      if (generation.current === current) setError((failure as Error).message);
    } finally {
      if (generation.current === current) setBusy(false);
    }
  }

  return (
    <details className="model-plan-tools">
      <summary>Usar planta PDF ou imagem como referência</summary>
      <p>
        Abra uma planta, calibre uma distância conhecida e use Desenhar parede para traçar sobre a
        referência. As paredes aparecem em 3D enquanto você desenha.
      </p>
      <p>
        Cada revisão pode guardar um arquivo, a página aberta e a escala. Salvar modelo registra
        a referência junto com a geometria. Trocar o arquivo ou a página exige uma nova calibração.
      </p>
      <div className="model-toolbar">
        <label>
          Arquivo da planta
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            disabled={busy || disabled}
            onChange={(event) => {
              const source = event.target.files?.[0];
              event.target.value = '';
              if (!source) return;
              void load(source, 1);
            }}
          />
        </label>
        {reference && reference.pages > 1 && (
          <>
            <label>
              Página do PDF
              <input
                type="number"
                min={1}
                max={reference.pages}
                step={1}
                value={page}
                disabled={busy || disabled}
                onChange={(event) => setPageChoice({ reference, page: Number(event.target.value) })}
              />
            </label>
            <button
              disabled={busy || disabled || !Number.isInteger(page) || page < 1 || page > reference.pages || page === reference.page}
              onClick={() => load(reference.file, page)}
            >
              Abrir página
            </button>
          </>
        )}
        {reference && (
          <>
            <label>
              Distância real (m)
              <input
                type="number"
                min={0.1}
                max={1000}
                step="any"
                value={meters}
                disabled={calibrating || busy || disabled}
                onChange={(event) => setMeters(event.target.value)}
              />
            </label>
            <button
              disabled={busy || disabled || Number(meters) < 0.1 || Number(meters) > 1000}
              onClick={() => onCalibrate(calibrating ? null : Number(meters))}
            >
              {calibrating ? 'Cancelar calibração' : 'Calibrar escala'}
            </button>
            <button disabled={busy || disabled} onClick={onRemove}>
              Remover referência
            </button>
          </>
        )}
      </div>
      {reference && <p>Referência atual: {reference.file.name} · página {reference.page}</p>}
      {busy && <p role="status">Abrindo arquivo da planta…</p>}
      {calibrated && !calibrating && (
        <p role="status">Escala calibrada. A planta está pronta para traçar.</p>
      )}
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}
