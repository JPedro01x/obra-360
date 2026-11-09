import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
import type { ModelDraft } from '../services/modelGeometry';
import type { SavedPlanReference } from '../services/planReference';
import { ModelPreview } from './ModelPreview';

type Frame = ModelDraft & { numero: number; motivo: string; criadoEm: string; referencia?: SavedPlanReference | null };

export function ModelTimeline({ modelId, last }: { modelId: number; last: number }) {
  const [number, setNumber] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState<Frame>();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    requestApi<Frame>(`/v1/workspace/modelador/modelos/${modelId}/revisoes/${number}`, {
      signal: controller.signal,
    })
      .then((next) => {
        if (!controller.signal.aborted) setFrame(next);
      })
      .catch((failure: Error) => {
        if (controller.signal.aborted) return;
        setError(failure.message);
        setPlaying(false);
      });
    return () => controller.abort();
  }, [modelId, number, retry]);

  useEffect(() => {
    if (!playing || frame?.numero !== number || number >= last) return;
    const timer = window.setTimeout(() => setNumber(number + 1), 1400);
    return () => window.clearTimeout(timer);
  }, [playing, number, frame, last]);

  function seek(next: number) {
    setPlaying(false);
    setError('');
    setNumber(next);
    if (next === number && frame?.numero !== number) setRetry((value) => value + 1);
  }

  const isPlaying = playing && (number < last || frame?.numero !== last);
  return (
    <section className="ws-service-panel" aria-label="Timelapse das revisões">
      <div className="model-toolbar">
        <button
          type="button"
          disabled={last < 2 || !!error}
          onClick={() => {
            if (isPlaying) setPlaying(false);
            else {
              if (number >= last) setNumber(1);
              setPlaying(true);
            }
          }}
        >
          {isPlaying ? 'Pausar timelapse' : 'Reproduzir timelapse'}
        </button>
        <button type="button" disabled={number <= 1} onClick={() => seek(number - 1)}>
          Anterior
        </button>
        <button type="button" disabled={number >= last} onClick={() => seek(number + 1)}>
          Próxima
        </button>
      </div>
      <label>
        Revisão {number} de {last}
        <input
          aria-label="Posição no histórico"
          type="range"
          min={1}
          max={last}
          step={1}
          value={number}
          disabled={last < 2}
          onChange={(event) => seek(Number(event.target.value))}
        />
      </label>
      {error && (
        <p className="ws-alert" role="alert">
          {error}{' '}
          <button className="ws-secondary" onClick={() => seek(number)}>
            Tentar novamente
          </button>
        </p>
      )}
      {!error && frame?.numero !== number && <p role="status">Carregando revisão {number}…</p>}
      {frame && (
        <>
          <p>
            Revisão exibida: {frame.numero} · {frame.nome} · {frame.motivo} ·{' '}
            {new Date(frame.criadoEm).toLocaleString('pt-BR')}
          </p>
          <ModelPreview draft={frame} revision={frame.numero}
            referenceSource={frame.referencia ? { modelId, metadata: frame.referencia } : undefined} />
        </>
      )}
    </section>
  );
}
