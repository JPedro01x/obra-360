import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
type Diagnosis = {
  geradoEm: string;
  ambienteDados: string;
  contagens: Record<string, number>;
  perfisAtivos: Record<string, number>;
  alertas: { codigo: string; quantidade: number; mensagem: string }[];
  escopo: string;
};
const names: Record<string, string> = {
  usuarios: 'Usuários',
  obras: 'Obras',
  fornecedores: 'Fornecedores',
  materiais: 'Materiais',
  contratos: 'Contratos',
  funcionarios: 'Funcionários',
  modelos: 'Modelos 3D',
  documentosRH: 'Documentos de RH',
  vinculosExternos: 'Vínculos externos',
  folhas: 'Folhas',
};
export function DataQuality() {
  const [data, setData] = useState<Diagnosis | null>(null),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setError('');
    requestApi<Diagnosis>('/v1/workspace/dados/diagnostico', { signal: c.signal })
      .then((value) => {
        if (!c.signal.aborted) setData(value);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [revision]);
  return (
    <div className="rh-module">
      <div className="ws-title-row">
        <div>
          <p className="ws-eyebrow">CONFERÊNCIA CADASTRAL</p>
          <h1>Qualidade dos dados</h1>
          <p>Contagens, vínculos e pendências calculados a partir do banco da sua empresa.</p>
        </div>
        <button className="ws-secondary" onClick={() => setRevision((v) => v + 1)}>
          Atualizar diagnóstico
        </button>
      </div>
      {error && (
        <div className="ws-alert" role="alert">
          {error}
        </div>
      )}
      {data ? (
        <>
          <p>
            Ambiente: <strong>{data.ambienteDados}</strong> · Consulta:{' '}
            {new Date(data.geradoEm).toLocaleString('pt-BR')}
          </p>
          <div className="rh-metrics">
            {Object.entries(data.contagens).map(([key, count]) => (
              <div key={key}>
                <span>{names[key] || key}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          <section className="rh-section">
            <h2>Pendências para conferência</h2>
            {data.alertas.length ? (
              data.alertas.map((alert) => (
                <p key={alert.codigo}>
                  <strong>{alert.codigo.replace(/_/g, ' ')}</strong> · {alert.mensagem} (
                  {alert.quantidade})
                </p>
              ))
            ) : (
              <p>
                Nenhuma inconsistência foi encontrada nas regras estruturais verificadas. Isso não
                comprova veracidade factual ou completude de todos os processos.
              </p>
            )}
            <p>{data.escopo}</p>
          </section>
          <section className="rh-section">
            <h2>Perfis ativos cadastrados</h2>
            {Object.entries(data.perfisAtivos).map(([role, count]) => (
              <p key={role}>
                {role.replace(/_/g, ' ')}: {count}
              </p>
            ))}
            <p>
              O aceite final deve ser realizado pelos responsáveis da empresa com seus processos e
              documentos. Testes automatizados e contas de homologação não substituem esse aceite.
            </p>
          </section>
        </>
      ) : (
        <p role="status">Consultando o banco…</p>
      )}
    </div>
  );
}
