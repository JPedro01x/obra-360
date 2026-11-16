import React, { useEffect, useRef, useState } from 'react';
import { recognizeWalls } from '../services/wallRecognition';
import { applyOpeningSuggestions, suggestOpenings } from '../services/wallRecognitionCore';
import type { OpenPlanReference } from '../services/planReference';
import type { ModelElement, ModelFloor } from '../services/modelGeometry';
export function WallRecognition({
  reference,
  floor,
  scope,
  disabled,
  onApply,
}: {
  reference?: OpenPlanReference;
  floor: ModelFloor;
  scope: string;
  disabled: boolean;
  onApply: (walls: ModelElement[]) => boolean;
}) {
  const [walls, setWalls] = useState<ModelElement[]>([]),
    [selected, setSelected] = useState<string[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const controller = useRef<AbortController>();
  const [choices, setChoices] = useState<Record<string, 'PORTA' | 'JANELA'>>({});
  const openings = suggestOpenings(walls);
  useEffect(() => {
    generation.current++;
    setWalls([]);
    setSelected([]);
    setError('');
    setBusy(false);
    setChoices({});
    return () => {
      generation.current++;
      controller.current?.abort();
    };
  }, [reference, scope, floor.altura]);
  async function detect() {
    if (!reference?.calibrated || busy || disabled) return;
    const token = ++generation.current;
    setBusy(true);
    setError('');
    controller.current?.abort();
    controller.current = new AbortController();
    try {
      const result = await recognizeWalls(reference, floor, controller.current.signal);
      if (token !== generation.current) return;
      setWalls(result);
      setSelected(result.map((r) => r.id));
      setChoices({});
      if (!result.length)
        setError(
          'Nenhuma parede com traço sólido foi identificada. Use o traçado manual ou uma imagem mais nítida.',
        );
    } catch (e) {
      if (token === generation.current) setError((e as Error).message);
    } finally {
      if (token === generation.current) setBusy(false);
    }
  }
  return (
    <section className="model-reference-panel" aria-label="Reconhecimento assistido de paredes">
      <h3>Reconhecimento assistido</h3>
      <p className="ws-help">
        Após calibrar a escala, é possível sugerir paredes retas, inclusive inclinadas, com traço
        sólido. Possíveis vãos entre trechos alinhados precisam de sua escolha como porta ou janela.
        Confira a prévia antes de adicionar. Aberturas, cotas e medidas exigem revisão; fotografias
        inclinadas e plantas complexas podem exigir traçado manual. A imagem fica neste navegador.
      </p>
      <button
        className="ws-secondary"
        disabled={disabled || busy || !reference?.calibrated}
        onClick={() => void detect()}
      >
        {busy ? 'Analisando referência…' : 'Sugerir paredes da planta'}
      </button>
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {walls.length > 0 && reference && (
        <>
          <p>{walls.length} sugestões. Escolha as paredes que deseja adicionar ao rascunho.</p>
          <svg
            role="img"
            aria-label="Prévia das paredes sugeridas"
            viewBox={`${reference.x} ${reference.z} ${reference.width} ${reference.height}`}
            style={{ width: '100%', maxHeight: 420, background: 'white' }}
          >
            <image
              href={reference.url}
              x={reference.x}
              y={reference.z}
              width={reference.width}
              height={reference.height}
              opacity={0.5}
            />
            {walls
              .filter((w) => selected.includes(w.id))
              .map((w) => (
                <rect
                  key={w.id}
                  x={w.x - w.largura / 2}
                  y={w.z - w.profundidade / 2}
                  width={w.largura}
                  height={w.profundidade}
                  transform={`rotate(${-w.rotacao} ${w.x} ${w.z})`}
                  fill="#ff790080"
                  stroke="#d64f00"
                  strokeWidth={0.02}
                />
              ))}
          </svg>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {walls.map((w) => (
              <label key={w.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(w.id)}
                  onChange={(e) => {
                    setSelected((all) =>
                      e.target.checked ? [...all, w.id] : all.filter((id) => id !== w.id),
                    );
                    setChoices((all) =>
                      Object.fromEntries(
                        Object.entries(all).filter(
                          ([id]) =>
                            !openings.some((o) => o.id === id && (o.a === w.id || o.b === w.id)),
                        ),
                      ),
                    );
                  }}
                />
                {w.nome}: {w.largura.toFixed(2)} m × {w.profundidade.toFixed(2)} m ·{' '}
                {w.rotacao.toFixed(1)}°
              </label>
            ))}
          </div>
          {openings.length > 0 && (
            <div className="model-opening-suggestions">
              <h4>Possíveis vãos — classificação manual</h4>
              <p className="ws-help">
                Um intervalo pode ser uma abertura ou apenas paredes separadas. Escolher um tipo une
                os dois trechos e cria a abertura editável. Confira altura e peitoril no modelo.
              </p>
              {openings.map((o, i) => (
                <label key={o.id}>
                  Vão {i + 1} · {o.gap.toFixed(2)} m
                  <select
                    aria-label={`Classificação do vão ${i + 1}`}
                    disabled={!selected.includes(o.a) || !selected.includes(o.b)}
                    value={choices[o.id] || ''}
                    onChange={(e) =>
                      setChoices((all) => {
                        const next = { ...all };
                        if (e.target.value) next[o.id] = e.target.value as 'PORTA' | 'JANELA';
                        else delete next[o.id];
                        return next;
                      })
                    }
                  >
                    <option value="">Não criar abertura</option>
                    <option value="PORTA">Porta — conferir altura</option>
                    <option value="JANELA">Janela — conferir peitoril</option>
                  </select>
                </label>
              ))}
            </div>
          )}
          <button
            className="ws-primary"
            disabled={disabled || busy || selected.length === 0}
            onClick={() => {
              try {
                if (
                  onApply(
                    applyOpeningSuggestions(
                      walls.filter((w) => selected.includes(w.id)),
                      choices,
                    ),
                  )
                ) {
                  setWalls([]);
                  setSelected([]);
                  setChoices({});
                }
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Adicionar paredes selecionadas ao rascunho
          </button>
          <button
            className="ws-secondary"
            onClick={() => {
              setWalls([]);
              setSelected([]);
              setChoices({});
            }}
          >
            Descartar sugestões
          </button>
          <p className="ws-help">
            Adicionar não grava no banco. Confira o modelo e use Salvar modelo para registrar uma
            revisão.
          </p>
        </>
      )}
    </section>
  );
}
