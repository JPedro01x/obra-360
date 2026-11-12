import React, { useEffect, useRef, useState } from 'react';
import { requestApi } from '../services/http';
type Evidence = { id: number; mime: string; tamanho: number; dataCriacao: string };
export function QualityEvidence({ id, onClose }: { id: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<Evidence[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    const controller = new AbortController();
    requestApi<Evidence[]>(`/v1/workspace/qualidade/${id}/evidencias`, {
      signal: controller.signal,
    })
      .then(setRows)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      dialog.current?.close();
    };
  }, [id]);
  async function download(row: Evidence) {
    setBusy(true);
    setError('');
    try {
      const blob = await requestApi<Blob>(
        `/v1/workspace/qualidade/${id}/evidencias/${row.id}/arquivo`,
        {},
        30000,
        'blob',
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `evidencia-${row.id}.${row.mime === 'image/png' ? 'png' : 'jpg'}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="ws ws-form-dialog"
      aria-label="Evidências de qualidade"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <section className="ws-modal">
        <h2>Evidências de qualidade</h2>
        {error && (
          <p className="ws-alert" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p role="status">Consultando fotos…</p>
        ) : rows.length ? (
          <ul>
            {rows.map((row) => (
              <li key={row.id}>
                Foto {row.id} · {new Date(row.dataCriacao).toLocaleString('pt-BR')} ·{' '}
                {Math.ceil(row.tamanho / 1024)} KB{' '}
                <button className="ws-secondary" disabled={busy} onClick={() => void download(row)}>
                  Baixar foto {row.id}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !error && <p>Nenhuma foto anexada.</p>
        )}
        <footer>
          <button className="ws-primary" disabled={busy} onClick={onClose}>
            Fechar evidências
          </button>
        </footer>
      </section>
    </dialog>
  );
}
