import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
type Usage = {
  plano: string;
  usuariosAtivos: number;
  convitesPendentes: number;
  projetos: number;
  modelos: number;
  limiteUsuarios: number;
  limiteProjetos: number;
  limiteModelos: number;
};
export function LicenseUsage() {
  const [data, setData] = useState<Usage>(),
    [error, setError] = useState('');
  useEffect(() => {
    requestApi<Usage>('/v1/workspace/licenca')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section>
      <h2>Plano e utilização</h2>
      {error && <p role="status">{error}</p>}
      {data && (
        <>
          <p>
            Plano: {data.plano}. Contratação e cobrança administradas pelo operador, sem pagamento
            automático nesta versão.
          </p>
          <ul>
            <li>
              Usuários ativos: {data.usuariosAtivos}; convites reservados: {data.convitesPendentes};
              limite: {data.limiteUsuarios}.
            </li>
            <li>
              Obras: {data.projetos} de {data.limiteProjetos}.
            </li>
            <li>
              Modelos, incluindo arquivados: {data.modelos} de {data.limiteModelos}.
            </li>
          </ul>
          <p>Para ajustar limites, registre uma solicitação abaixo.</p>
        </>
      )}
    </section>
  );
}
