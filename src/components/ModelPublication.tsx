import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
import type { ModelDraft, SavedModel } from '../services/modelGeometry';
import { ModelPreview } from './ModelPreview';

type Unit = { id: number; nome: string };
type PublicationEvent = {
  id: number;
  autor: string;
  unidadeCodigo: string;
  revisao: number;
  acao: 'PUBLICADA' | 'OCULTADA' | 'ARQUIVADA' | 'REATIVADA';
  ocorridoEm: string;
};
type RevisionPreview = ModelDraft & { numero: number; motivo: string };

function PublicationHistory({ endpoint, version }: { endpoint: string; version: number }) {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{ items: PublicationEvent[]; total: number }>();
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setResult(undefined);
    setError('');
    requestApi<{ items: PublicationEvent[]; total: number }>(
      `${endpoint}/publicacoes?page=${page}`,
      { signal: controller.signal },
    )
      .then((value) => {
        if (!controller.signal.aborted) setResult(value);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [endpoint, version, page]);
  return (
    <section className="ws-service-panel" aria-label="Histórico de publicação">
      {!result && !error && <p role="status">Carregando histórico…</p>}
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {result?.items.length === 0 && <p>Nenhum evento de publicação registrado.</p>}
      {!!result?.items.length && (
        <ul>
          {result.items.map((item) => (
            <li key={item.id}>
              {item.acao.toLowerCase()} · revisão {item.revisao} · {item.unidadeCodigo} ·{' '}
              {item.autor}
              {' · '}
              {new Date(item.ocorridoEm).toLocaleString('pt-BR')}
            </li>
          ))}
        </ul>
      )}
      <div className="model-toolbar">
        {page > 0 && (
          <button type="button" onClick={() => setPage((n) => n - 1)}>
            Publicações mais recentes
          </button>
        )}
        {result && (page + 1) * 20 < result.total && (
          <button type="button" onClick={() => setPage((n) => n + 1)}>
            Publicações anteriores
          </button>
        )}
      </div>
    </section>
  );
}

export function ModelPublication({
  model,
  onPublished,
  disabled,
}: {
  model: SavedModel;
  onPublished: (model: SavedModel) => void;
  disabled: boolean;
}) {
  const [search, setSearch] = useState('');
  const [unitId, setUnitId] = useState(String(model.unidadePublicadaId ?? ''));
  const [revision, setRevision] = useState(String(model.revisaoPublicada ?? model.revisao));
  const [units, setUnits] = useState<Unit[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [preview, setPreview] = useState<RevisionPreview>();
  const [previewError, setPreviewError] = useState('');
  const endpoint = `/v1/workspace/modelador/modelos/${model.id}`;
  const selectedRevision = Number(revision);
  const validRevision =
    Number.isSafeInteger(selectedRevision) &&
    selectedRevision >= 1 &&
    selectedRevision <= model.revisao;
  const unchanged =
    String(model.unidadePublicadaId ?? '') === unitId &&
    (!unitId || model.revisaoPublicada === selectedRevision);

  useEffect(() => {
    if (!previewOpen || !validRevision) return;
    const controller = new AbortController();
    setPreview(undefined);
    setPreviewError('');
    requestApi<RevisionPreview>(
      `${endpoint}/revisoes/${selectedRevision}`,
      {
        signal: controller.signal,
      },
      45000,
    )
      .then((value) => {
        if (!controller.signal.aborted) setPreview(value);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setPreviewError(failure.message);
      });
    return () => controller.abort();
  }, [endpoint, previewOpen, selectedRevision, validRevision]);

  useEffect(() => {
    const controller = new AbortController();
    setUnits([]);
    const timer = window.setTimeout(() => {
      requestApi<Unit[]>(`${endpoint}/unidades?q=${encodeURIComponent(search)}`, {
        signal: controller.signal,
      })
        .then((result) => {
          if (!controller.signal.aborted) setUnits(result);
        })
        .catch((failure: Error) => {
          if (!controller.signal.aborted) setError(failure.message);
        });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [endpoint, search]);

  async function publish() {
    if (disabled || busy || unchanged || (unitId && (model.arquivado || !validRevision))) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await requestApi<SavedModel>(`${endpoint}/publicacao`, {
        method: 'PATCH',
        body: JSON.stringify({
          versao: model.versao,
          unidadeId: unitId ? Number(unitId) : null,
          revisao: unitId ? selectedRevision : null,
        }),
      });
      onPublished(updated);
      setNotice(
        unitId
          ? 'Planta disponível aos clientes vinculados à unidade.'
          : 'Planta removida do portal.',
      );
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ws-service-panel" aria-label="Publicação da planta">
      <p>
        Os clientes vinculados à unidade verão a revisão que você escolher. Para liberar outra
        revisão, atualize a publicação.
      </p>
      {model.unidadePublicadaId && model.revisaoPublicada && (
        <p>Revisão publicada: {model.revisaoPublicada}</p>
      )}
      <div className="model-toolbar">
        <label>
          Buscar unidade{' '}
          <input
            value={search}
            maxLength={100}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Unidade para publicar
          <select
            value={unitId}
            disabled={busy}
            onChange={(event) => {
              setUnitId(event.target.value);
              if (!event.target.value) setPreviewOpen(false);
            }}
          >
            <option value="">Ocultar do portal</option>
            {unitId && !units.some((unit) => String(unit.id) === unitId) && (
              <option value={unitId}>Unidade #{unitId}</option>
            )}
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.nome}
              </option>
            ))}
          </select>
        </label>
        {unitId && (
          <label>
            Revisão para publicar
            <input
              type="number"
              min={1}
              max={model.revisao}
              step={1}
              value={revision}
              disabled={busy}
              onChange={(event) => {
                setRevision(event.target.value);
                setPreviewOpen(false);
              }}
            />
            <small>Revisões salvas de 1 a {model.revisao}</small>
          </label>
        )}
        {unitId && (
          <button
            type="button"
            disabled={!validRevision || busy}
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((open) => !open)}
          >
            {previewOpen ? 'Fechar prévia' : 'Ver prévia da revisão'}
          </button>
        )}
        <button
          className="ws-secondary"
          disabled={
            disabled || busy || (!!unitId && (model.arquivado || !validRevision)) || unchanged
          }
          onClick={publish}
        >
          Aplicar publicação
        </button>
        <button
          type="button"
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((open) => !open)}
        >
          {historyOpen ? 'Fechar histórico' : 'Ver histórico de publicação'}
        </button>
      </div>
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {previewOpen && (
        <section className="ws-service-panel" aria-label="Prévia da revisão">
          {previewError && (
            <p className="ws-alert" role="alert">
              {previewError}
            </p>
          )}
          {!preview && !previewError && <p role="status">Carregando prévia…</p>}
          {preview?.numero === selectedRevision && (
            <>
              <h3>
                {preview.nome} · revisão {preview.numero}
              </h3>
              <p>{preview.motivo}</p>
              <ModelPreview key={preview.numero} draft={preview} revision={preview.numero} />
            </>
          )}
        </section>
      )}
      {historyOpen && <PublicationHistory endpoint={endpoint} version={model.versao} />}
    </section>
  );
}
