import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
import { useWorkspaceRefresh } from '../hooks/useWorkspaceRefresh';
import { OperationForm, OperationDefinition } from './OperationForms';
const ClientPlans = React.lazy(() => import('./ClientPlans').then((module) => ({ default: module.ClientPlans })));
interface Snapshot {
  perfil: string;
  acessos: { id: number }[];
  projetos: { id: number; nome: string; entrega: string; progresso: number | null }[];
  unidades: {
    id: number;
    projetoObraId?: number;
    codigo: string;
    situacao: string;
    area: number;
    valorTabela: number;
    reservadaPorVoce: boolean;
  }[];
  contratos: { numero: string; valor: number; termino: string }[];
  cotacoes: { codigo: string; valor: number; prazo: number; situacao: string }[];
  requisicoes: {
    id: number;
    acessoId: number;
    material: string;
    quantidade: number;
    projetoObraId: number;
  }[];
  chamados: {
    id: number;
    codigoChamado: string;
    descricaoDefeito: string;
    statusChamado: string;
  }[];
}
export function ExternalPortal() {
  const workspaceRevision = useWorkspaceRefresh();
  const [data, setData] = useState<Snapshot | null>(null),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState(''),
    [operation, setOperation] = useState<OperationDefinition | null>(null),
    [plansUnit, setPlansUnit] = useState<number | null>(null);
  useEffect(() => {
    let current = true;
    requestApi<Snapshot>('/v1/portal')
      .then((value) => {
        if (current) {
          setData(value);
          setError('');
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [revision, workspaceRevision]);
  async function reserve(id: number) {
    setError('');
    try {
      await requestApi(`/v1/portal/unidades/${id}/reservar`, { method: 'POST' });
      setNotice('Unidade reservada com sucesso.');
      setRevision((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const money = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const projectName = (id?: number) => data?.projetos.find((project) => project.id === id)?.nome;
  return (
    <section className="ws-integration">
      <p className="ws-eyebrow">SEU ESPAÇO</p>
      <h1>Portal de relacionamento</h1>
      <p>Você tem acesso somente aos registros vinculados à sua conta pela empresa.</p>
      {error && (
        <div className="ws-alert" role="alert">
          {error}
          <button onClick={() => setRevision((v) => v + 1)}>Tentar novamente</button>
        </div>
      )}
      {notice && (
        <div className="ws-notice" role="status">
          {notice}
        </div>
      )}
      {!data && !error && <p role="status">Carregando seu portal…</p>}
      {data && !data.acessos.length && (
        <article className="ws-service-panel">
          <h2>Nenhum vínculo disponível</h2>
          <p>Solicite ao administrador da empresa o vínculo com sua obra, unidade ou fornecedor.</p>
        </article>
      )}
      {data && (
        <>
          <div className="ws-service-grid">
            {data.projetos.map((project) => (
              <article key={project.id}>
                <h2>{project.nome}</h2>
                <p>
                  Entrega prevista:{' '}
                  {new Date(project.entrega + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
                <p>
                  Avanço informado:{' '}
                  {project.progresso === null
                    ? 'Não informado'
                    : `${project.progresso.toLocaleString('pt-BR')}%`}
                </p>
              </article>
            ))}
          </div>
          <div className="ws-service-grid">
            {data.unidades.map((unit) => (
              <article key={unit.id}>
                <h2>{unit.codigo}</h2>
                {projectName(unit.projetoObraId) && <p>{projectName(unit.projetoObraId)}</p>}
                <p>{unit.situacao}</p>
                <p>
                  {unit.area.toLocaleString('pt-BR')} m² · {money(unit.valorTabela)}
                </p>
                {data.perfil === 'CORRETOR' && unit.situacao === 'DISPONIVEL' && (
                  <button className="ws-primary" onClick={() => reserve(unit.id)}>
                    Reservar unidade
                  </button>
                )}
                {unit.reservadaPorVoce && <p>Reservada por você</p>}
                {data.perfil === 'CLIENTE' && (
                  <button
                    className="ws-primary"
                    onClick={() =>
                      setOperation({
                        title: 'Abrir chamado',
                        path: '/chamados',
                        roles: [],
                        hidden: { unidadeId: unit.id },
                        fields: [
                          { name: 'categoria', label: 'Categoria do problema', maxLength: 50 },
                          {
                            name: 'descricao',
                            label: 'Descreva o problema',
                            type: 'textarea',
                            maxLength: 10000,
                          },
                        ],
                      })
                    }
                  >
                    Abrir chamado
                  </button>
                )}
                {data.perfil === 'CLIENTE' && (
                  <button className="ws-secondary" aria-expanded={plansUnit === unit.id}
                    onClick={() => setPlansUnit((current) => current === unit.id ? null : unit.id)}>
                    {plansUnit === unit.id ? 'Fechar plantas' : 'Ver plantas da unidade'}
                  </button>
                )}
              </article>
            ))}
          </div>
          {data.unidades.filter((unit) => unit.id === plansUnit).map((unit) => (
            <React.Suspense key={unit.id} fallback={<p role="status">Abrindo visualizador…</p>}>
              <ClientPlans unitId={unit.id} unitName={unit.codigo}
                projectName={projectName(unit.projetoObraId)} />
            </React.Suspense>
          ))}
          {data.chamados.length > 0 && (
            <article className="ws-service-panel">
              <h2>Seus chamados</h2>
              {data.chamados.map((ticket) => (
                <div key={ticket.id}>
                  <strong>
                    {ticket.codigoChamado} · {ticket.statusChamado}
                  </strong>
                  <p>{ticket.descricaoDefeito}</p>
                </div>
              ))}
            </article>
          )}
          {data.contratos.length > 0 && (
            <article className="ws-service-panel">
              <h2>Seus contratos</h2>
              {data.contratos.map((contract) => (
                <p key={contract.numero}>
                  {contract.numero} · {money(contract.valor)} · Término: {contract.termino}
                </p>
              ))}
            </article>
          )}
          {['FORNECEDOR', 'LOCADOR_MAQUINAS'].includes(data.perfil) && data.acessos.length > 0 && (
            <article className="ws-service-panel">
              <h2>Requisições abertas e propostas</h2>
              <p>As requisições abaixo pertencem às obras vinculadas ao seu fornecedor.</p>
              {data.requisicoes.length === 0 && <p>Nenhuma requisição aberta para suas obras.</p>}
              {data.requisicoes.map((request) => (
                <div key={request.id} className="ws-service-row">
                  <strong>{request.material} · {request.quantidade}</strong>
                  <p>{projectName(request.projetoObraId)}</p>
                  <button className="ws-primary" onClick={() => setOperation({
                    title: `Proposta para requisição #${request.id}`,
                    path: '/propostas',
                    roles: [],
                    hidden: { acessoId: request.acessoId, requisicaoId: request.id },
                    fields: [
                      { name: 'valor', label: 'Valor total da proposta (R$)', type: 'number', min: 0, step: '0.01' },
                      { name: 'prazoDias', label: 'Prazo de entrega (dias)', type: 'number', min: 0, step: '1' },
                    ],
                  })}>Enviar proposta</button>
                </div>
              ))}
              <h3>Propostas enviadas</h3>
              {data.cotacoes.map((quote) => (
                <p key={quote.codigo}>
                  {quote.codigo} · {money(quote.valor)} · {quote.prazo} dias · {quote.situacao}
                </p>
              ))}
            </article>
          )}
        </>
      )}
      {operation && (
        <OperationForm
          definition={{ ...operation, portal: true }}
          onClose={() => setOperation(null)}
          onSaved={() => {
            setOperation(null);
            setNotice('Solicitação registrada com sucesso.');
            setRevision((v) => v + 1);
          }}
        />
      )}
    </section>
  );
}
