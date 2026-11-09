import React, { useMemo, useState } from 'react';
import type { ModelDraft } from '../services/modelGeometry';
import { copyDraft } from '../services/modelGeometry';
import { connectWalls, dimensionGeometry, upgrade, wallEnds } from '../services/planTopology';
import { detectRooms, matchRoom, refreshRoomLabels } from '../services/planRooms';
import { openPrintSheet, sheetLayout, SheetSettings } from './PlanSheet';

export function PlanTools({
  draft,
  floorId,
  selected,
  writable,
  onChange,
  projectName,
  revision,
  dirty,
}: {
  draft: ModelDraft;
  floorId: string;
  selected: string[];
  writable: boolean;
  onChange: (next: ModelDraft) => boolean;
  projectName: string;
  revision: number;
  dirty: boolean;
}) {
  const [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [settings, setSettings] = useState<SheetSettings>({
    paper: 'A4',
    scale: 100,
    responsavel: '',
    folha: '01',
    includeDimensions: true,
    includeRooms: true,
  });
  const result = useMemo(() => {
    try {
      return { rooms: detectRooms(draft.documento, floorId), error: '' };
    } catch (e) {
      return {
        rooms: [],
        error: e instanceof Error ? e.message : 'Não foi possível calcular ambientes.',
      };
    }
  }, [draft.documento, floorId]);
  const dimensions = (draft.documento.cotas || []).filter((c) => c.pavimentoId === floorId),
    labels = (draft.documento.ambientes || []).filter((r) => r.pavimentoId === floorId);
  const layout = useMemo(() => sheetLayout(draft, floorId, settings), [draft, floorId, settings]);
  const invalidLabels = labels.filter((r) => !matchRoom(r, result.rooms));
  function run(action: (next: ModelDraft) => void, message: string) {
    if (!writable) return;
    setError('');
    setNotice('');
    try {
      const next = copyDraft(draft);
      action(next);
      if (onChange(next)) setNotice(message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operação indisponível.');
    }
  }
  function cotar() {
    run((next) => {
      const selectedWall = next.documento.elementos.find(
        (e) => selected.includes(e.id) && e.tipo === 'PAREDE',
      );
      if (!selectedWall) throw new Error('Selecione uma parede para cotar.');
      connectWalls(next.documento, floorId, [selectedWall.id]);
      const [a, b] = wallEnds(selectedWall);
      next.documento.cotas!.push({
        id: crypto.randomUUID(),
        pavimentoId: floorId,
        tipo: 'ALINHADA',
        ax: a.x,
        az: a.z,
        bx: b.x,
        bz: b.z,
        afastamento: 0.4,
        noAId: selectedWall.noInicioId,
        noBId: selectedWall.noFimId,
      });
    }, 'Cota criada e vinculada às extremidades da parede.');
  }
  return (
    <details className="model-plan-tools" open>
      <summary>Ambientes, conexões, cotas e impressão</summary>
      {error && (
        <div className="ws-alert" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <p role="status" className="model-notice">
          {notice}
        </p>
      )}
      <div className="model-toolbar">
        <button
          disabled={!writable}
          onClick={() =>
            run(
              (next) => connectWalls(next.documento, floorId),
              'Extremidades coincidentes conectadas. Arraste os nós laranja de uma parede selecionada para editar seus encontros.',
            )
          }
        >
          Conectar paredes do pavimento
        </button>
        <button
          disabled={!writable || !selected.length}
          onClick={() =>
            run((next) => {
              for (const e of next.documento.elementos)
                if (selected.includes(e.id) && e.tipo === 'PAREDE') {
                  e.noInicioId = null;
                  e.noFimId = null;
                }
            }, 'Paredes selecionadas desvinculadas; as medidas atuais foram preservadas.')
          }
        >
          Desconectar paredes selecionadas
        </button>
        <button
          disabled={!writable}
          onClick={() =>
            run((next) => {
              refreshRoomLabels(next.documento, floorId);
            }, 'Contornos recalculados. Rótulos compatíveis foram preservados; use Desfazer para recuperar a identificação anterior.')
          }
        >
          Identificar ambientes
        </button>
        <button disabled={!writable || !selected.length} onClick={cotar}>
          Cotar parede selecionada
        </button>
      </div>
      <p>
        Áreas e perímetros pelo eixo das paredes, sem desconto de espessuras. Extremidades
        coincidentes compartilham nós; encontros em T e cruzamentos são considerados no cálculo dos
        contornos, sem dividir automaticamente as paredes.
      </p>
      {result.error && (
        <p role="alert" className="model-plan-warning">
          {result.error}
        </p>
      )}
      {invalidLabels.length > 0 && (
        <p role="status" className="model-plan-warning">
          {invalidLabels.length} identificação(ões) sem contorno fechado correspondente. Revise as
          paredes e use Identificar ambientes.
        </p>
      )}
      <div className="model-annotation-columns">
        <details>
          <summary>Ambientes identificados · {labels.length}</summary>
          <div className="model-room-list">
            {labels.map((r, i) => {
              const room = matchRoom(r, result.rooms);
              return (
                <form
                  key={`${r.id}-${r.nome}`}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    run((next) => {
                      next.documento.ambientes!.find((item) => item.id === r.id)!.nome = String(
                        form.get('nome'),
                      ).trim();
                    }, 'Nome do ambiente atualizado.');
                  }}
                >
                  <label>
                    Nome do ambiente {i + 1}
                    <input
                      name="nome"
                      aria-label={`Nome do ambiente ${i + 1}`}
                      defaultValue={r.nome}
                      required
                      maxLength={100}
                      disabled={!writable}
                    />
                  </label>
                  <p>
                    {room
                      ? `${room.area.toFixed(2)} m² pelo eixo · perímetro ${room.perimetro.toFixed(2)} m`
                      : 'Sem contorno fechado correspondente'}
                  </p>
                  <div>
                    <button disabled={!writable}>Renomear ambiente</button>
                    <button
                      type="button"
                      disabled={!writable}
                      onClick={() =>
                        run((next) => {
                          next.documento.ambientes = next.documento.ambientes!.filter(
                            (item) => item.id !== r.id,
                          );
                        }, 'Rótulo removido; paredes preservadas.')
                      }
                    >
                      Remover identificação
                    </button>
                  </div>
                </form>
              );
            })}
            {!labels.length && (
              <p>Feche um contorno com paredes e clique em Identificar ambientes.</p>
            )}
          </div>
        </details>
        <details>
          <summary>Cotas do pavimento · {dimensions.length}</summary>
          <div className="model-dimension-list">
            {dimensions.map((c, i) => (
              <details key={`${c.id}-${JSON.stringify(c)}`}>
                <summary>
                  Cota {i + 1} · {dimensionGeometry(c).comprimento.toFixed(2)} m ·{' '}
                  {c.tipo.toLowerCase()}
                </summary>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    run((next) => {
                      const item = next.documento.cotas!.find((item) => item.id === c.id)!;
                      item.tipo = String(form.get('tipo')) as typeof item.tipo;
                      item.afastamento = Number(form.get('afastamento'));
                      if (!item.noAId) {
                        item.ax = Number(form.get('ax'));
                        item.az = Number(form.get('az'));
                      }
                      if (!item.noBId) {
                        item.bx = Number(form.get('bx'));
                        item.bz = Number(form.get('bz'));
                      }
                    }, 'Cota atualizada.');
                  }}
                >
                  <label>
                    Tipo da cota {i + 1}
                    <select
                      name="tipo"
                      aria-label={`Tipo da cota ${i + 1}`}
                      defaultValue={c.tipo}
                      disabled={!writable}
                    >
                      <option value="ALINHADA">Alinhada</option>
                      <option value="HORIZONTAL">Horizontal</option>
                      <option value="VERTICAL">Vertical</option>
                    </select>
                  </label>
                  <label>
                    Afastamento da cota {i + 1} (m)
                    <input
                      name="afastamento"
                      aria-label={`Afastamento da cota ${i + 1}`}
                      type="number"
                      step="0.01"
                      min={-100}
                      max={100}
                      defaultValue={c.afastamento}
                      required
                      disabled={!writable}
                    />
                  </label>
                  <div className="model-coordinate-fields">
                    {(['ax', 'az', 'bx', 'bz'] as const).map((key) => (
                      <label key={key}>
                        {key.toUpperCase()} (m)
                        <input
                          name={key}
                          aria-label={`${key.toUpperCase()} da cota ${i + 1}`}
                          type="number"
                          step="0.0001"
                          min={-10000}
                          max={10000}
                          defaultValue={c[key]}
                          required
                          disabled={!writable || !!(key[0] === 'a' ? c.noAId : c.noBId)}
                        />
                      </label>
                    ))}
                  </div>
                  <p>
                    {c.noAId || c.noBId
                      ? 'A cota acompanha os nós vinculados. Desvincule para editar coordenadas livres.'
                      : 'Cota entre pontos livres.'}
                  </p>
                  <button disabled={!writable}>Aplicar cota</button>
                  <button
                    type="button"
                    disabled={!writable || (!c.noAId && !c.noBId)}
                    onClick={() =>
                      run((next) => {
                        const item = next.documento.cotas!.find((item) => item.id === c.id)!;
                        item.noAId = null;
                        item.noBId = null;
                      }, 'Cota desvinculada; a medida atual foi preservada.')
                    }
                  >
                    Desvincular cota
                  </button>
                  <button
                    type="button"
                    disabled={!writable}
                    onClick={() =>
                      run((next) => {
                        next.documento.cotas = next.documento.cotas!.filter(
                          (item) => item.id !== c.id,
                        );
                      }, 'Cota removida.')
                    }
                  >
                    Excluir cota
                  </button>
                </form>
              </details>
            ))}
            {!dimensions.length && (
              <p>
                Use Desenhar cota na planta ou selecione uma parede e clique em Cotar parede
                selecionada.
              </p>
            )}
          </div>
        </details>
      </div>
      <details className="model-print-settings">
        <summary>Preparar impressão em escala</summary>
        <div className="model-view-options">
          <label>
            Papel
            <select
              aria-label="Papel da planta"
              value={settings.paper}
              onChange={(e) => setSettings((s) => ({ ...s, paper: e.target.value as 'A4' | 'A3' }))}
            >
              <option value="A4">A4 paisagem</option>
              <option value="A3">A3 paisagem</option>
            </select>
          </label>
          <label>
            Escala da planta
            <select
              aria-label="Escala da planta"
              value={settings.scale}
              onChange={(e) => setSettings((s) => ({ ...s, scale: Number(e.target.value) }))}
            >
              {[20, 25, 50, 75, 100, 200].map((n) => (
                <option key={n} value={n}>
                  1:{n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsável informado
            <input
              aria-label="Responsável informado na planta"
              maxLength={100}
              value={settings.responsavel}
              onChange={(e) => setSettings((s) => ({ ...s, responsavel: e.target.value }))}
            />
          </label>
          <label>
            Número da folha
            <input
              aria-label="Número da folha"
              maxLength={30}
              value={settings.folha}
              onChange={(e) => setSettings((s) => ({ ...s, folha: e.target.value }))}
            />
          </label>
          <label className="model-check">
            <input
              type="checkbox"
              checked={settings.includeDimensions}
              onChange={(e) => setSettings((s) => ({ ...s, includeDimensions: e.target.checked }))}
            />
            Incluir cotas
          </label>
          <label className="model-check">
            <input
              type="checkbox"
              checked={settings.includeRooms}
              onChange={(e) => setSettings((s) => ({ ...s, includeRooms: e.target.checked }))}
            />
            Incluir ambientes
          </label>
          <button
            disabled={!layout.fits}
            onClick={() => {
              setError('');
              try {
                openPrintSheet({ draft, floorId, settings, projectName, revision, dirty });
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Não foi possível abrir a impressão.');
              }
            }}
          >
            Abrir planta para impressão
          </button>
        </div>
        <p>
          {layout.fits
            ? `Desenho de ${layout.widthMm.toFixed(1)} × ${layout.heightMm.toFixed(1)} mm na escala 1:${settings.scale}.`
            : 'A planta não cabe no papel e escala escolhidos. Use escala menor ou papel A3; não haverá redução automática.'}{' '}
          A impressão usa o estado atual, inclusive alterações não salvas, identificadas como
          rascunho.
        </p>
      </details>
    </details>
  );
}
