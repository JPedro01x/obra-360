import React, { useState } from 'react';
import { requestApi } from '../services/http';
export function CompanyExport() {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section>
      <h2>Exportar dados da empresa</h2>
      <p>
        Baixa os registros operacionais, RH, modelos e arquivos. O ZIP contém dados pessoais e deve
        ser guardado em local privado. Credenciais, sessões e segredos não são incluídos. Limite por
        download: 25 MB e 10 mil registros; volumes maiores exigem exportação assistida.
      </p>
      {message && <p role="status">{message}</p>}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const values = new FormData(form);
          setBusy(true);
          setMessage('');
          try {
            const blob = await requestApi<Blob>(
              '/v1/workspace/exportar',
              { method: 'POST', body: JSON.stringify(Object.fromEntries(values)) },
              120000,
              'blob',
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `obra360-empresa-${new Date().toISOString().slice(0, 10)}.zip`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            form.reset();
            setMessage('Exportação concluída. Guarde o arquivo com segurança.');
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Confirme sua senha
          <input
            type="password"
            name="senha"
            autoComplete="current-password"
            required
            maxLength={200}
          />
        </label>
        <label>
          Código de duas etapas (se ativado)
          <input name="codigo" autoComplete="one-time-code" maxLength={64} />
        </label>
        <button disabled={busy}>Baixar exportação privada</button>
      </form>
    </section>
  );
}
