import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
type Notification = { id: number; mensagem: string; criadoEm: string; lidoEm: string | null };
export function Notifications() {
  const [data, setData] = useState<{
    items: Notification[];
    total: number;
    naoLidas: number;
  } | null>(null);
  const [page, setPage] = useState(0),
    [revision, setRevision] = useState(0);
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    setData(null);
    requestApi<typeof data>(`/v1/workspace/notificacoes?page=${page}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [page, revision]);
  async function read(id: number) {
    setBusy(true);
    setError('');
    try {
      await requestApi(`/v1/workspace/notificacoes/${id}/ler`, { method: 'POST' });
      setRevision((value) => value + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ws-service-panel">
      <h1>Notificações</h1>
      <p>Avisos internos de ocorrências e chamados atribuídos a você.</p>
      <button className="ws-secondary" onClick={() => setRevision((value) => value + 1)}>
        Atualizar notificações
      </button>
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {data ? (
        <>
          <p>{data.naoLidas} não lidas</p>
          {data.items.length ? (
            <ul>
              {data.items.map((item) => (
                <li key={item.id}>
                  <p>{item.mensagem}</p>
                  <small>{new Date(item.criadoEm).toLocaleString('pt-BR')}</small>{' '}
                  {item.lidoEm ? (
                    <span>Lida</span>
                  ) : (
                    <button
                      className="ws-secondary"
                      disabled={busy}
                      onClick={() => void read(item.id)}
                    >
                      Marcar como lida
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma notificação disponível.</p>
          )}
          <footer className="ws-table-footer">
            <span>Página {page + 1}</span>
            <div>
              <button
                className="ws-secondary"
                disabled={page === 0}
                onClick={() => setPage((value) => value - 1)}
              >
                Notificações anteriores
              </button>
              <button
                className="ws-secondary"
                disabled={(page + 1) * 25 >= data.total}
                onClick={() => setPage((value) => value + 1)}
              >
                Próximas notificações
              </button>
            </div>
          </footer>
        </>
      ) : (
        !error && <p role="status">Consultando notificações…</p>
      )}
    </section>
  );
}
