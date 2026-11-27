import React, { useEffect, useRef, useState } from 'react';
import { requestApi } from '../services/http';
import type { ModelDraft, SavedModel } from '../services/modelGeometry';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';

type ServerDraft = ModelDraft & { versaoBase: number; token: string; atualizadoEm: string };

export function ModelCloudDraft({
  model,
  draft,
  canStore,
  hasLocalChanges,
  disabled,
  onRecover,
  onAssociate,
  onCompare,
  onDownload,
}: {
  model: SavedModel;
  draft: ModelDraft;
  canStore: boolean;
  hasLocalChanges: boolean;
  disabled: boolean;
  onRecover: (draft: ModelDraft) => void;
  onAssociate: (token: string | null) => void;
  onCompare: (draft: ModelDraft) => void;
  onDownload: (draft: ModelDraft) => void;
}) {
  const workspaceRevision = useWorkspaceRefresh();
  const [remote, setRemote] = useState<ServerDraft>();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [remoteUpdatePending, setRemoteUpdatePending] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const mounted = useRef(false);
  const endpoint = `/v1/workspace/modelador/modelos/${model.id}/rascunho`;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setReady(false);
    setError('');
    setNotice('');
    requestApi<ServerDraft | undefined>(endpoint, { signal: controller.signal }, 45000)
      .then((value) => {
        if (controller.signal.aborted) return;
        setRemote(value);
        setReady(true);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, [endpoint, model, refresh]);

  useEffect(() => {
    if (!workspaceRevision) return;
    if (hasLocalChanges) setRemoteUpdatePending(true);
    else setRefresh((value) => value + 1);
  }, [workspaceRevision, hasLocalChanges]);

  async function store() {
    if (!ready || !canStore || busy || disabled) return;
    if (remote && !window.confirm('Substituir o rascunho que está guardado no servidor?')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await requestApi<ServerDraft>(
        endpoint,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...draft,
            versaoBase: model.versao,
            token: remote?.token ?? null,
          }),
        },
        45000,
      );
      if (!mounted.current) return;
      setRemote(result);
      setRemoteUpdatePending(false);
      onAssociate(result.token);
      setNotice('Rascunho guardado no servidor para esta conta.');
    } catch (failure) {
      if (mounted.current) setError((failure as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function remove() {
    if (
      !remote ||
      !ready ||
      busy ||
      disabled ||
      !window.confirm('Excluir o rascunho privado do servidor?')
    )
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await requestApi(`${endpoint}?token=${encodeURIComponent(remote.token)}`, {
        method: 'DELETE',
      });
      if (!mounted.current) return;
      setRemote(undefined);
      setRemoteUpdatePending(false);
      onAssociate(null);
      setNotice('Rascunho removido do servidor.');
    } catch (failure) {
      if (mounted.current) setError((failure as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  function recover() {
    if (
      !remote ||
      !ready ||
      disabled ||
      busy ||
      model.arquivado ||
      remote.versaoBase !== model.versao
    )
      return;
    if (
      hasLocalChanges &&
      !window.confirm('Abrir o rascunho do servidor no lugar das alterações locais?')
    )
      return;
    onAssociate(remote.token);
    onRecover({ nome: remote.nome, documento: remote.documento });
  }

  return (
    <details className="model-plan-tools">
      <summary>Rascunho privado no servidor {ready && remote ? '· disponível' : ''}</summary>
      <p>Guarde as alterações para continuar em outro computador com a mesma conta.</p>
      {remoteUpdatePending && <p role="status">O rascunho pode ter uma revisão nova. Salve ou descarte suas alterações locais e atualize o rascunho.<button type="button" onClick={() => { setRemoteUpdatePending(false); setRefresh((value) => value + 1); }}>Atualizar rascunho</button></p>}
      {!ready && !error && <p role="status">Consultando o rascunho…</p>}
      {ready && remote && (
        <p>
          Guardado em {new Date(remote.atualizadoEm).toLocaleString('pt-BR')}.
          {remote.versaoBase !== model.versao &&
            ' O modelo mudou no banco. Compare ou baixe o rascunho.'}
        </p>
      )}
      <div className="model-toolbar">
        <button type="button" disabled={!ready || !canStore || busy || disabled} onClick={store}>
          Guardar rascunho no servidor
        </button>
        {ready && remote && (
          <>
            <button
              type="button"
              disabled={busy || disabled || model.arquivado || remote.versaoBase !== model.versao}
              onClick={recover}
            >
              Recuperar rascunho do servidor
            </button>
            <button type="button" onClick={() => onCompare(remote)}>
              Comparar rascunho do servidor
            </button>
            <button
              type="button"
              onClick={() => onDownload({ nome: remote.nome, documento: remote.documento })}
            >
              Baixar rascunho do servidor
            </button>
            <button type="button" disabled={busy || disabled} onClick={remove}>
              Excluir rascunho do servidor
            </button>
          </>
        )}
        <button
          type="button"
          disabled={busy || disabled}
          onClick={() => {
            setNotice('');
            setRefresh((value) => value + 1);
          }}
        >
          Atualizar rascunho do servidor
        </button>
      </div>
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
    </details>
  );
}
