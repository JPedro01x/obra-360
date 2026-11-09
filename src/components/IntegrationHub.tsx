import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
import type { IfcReadResult } from '../services/RealIfcParser';
interface Status {
  s3Configurado: boolean;
  armazenamento: string;
  iaConfigurada: boolean;
  emailConfigurado: boolean;
  googleConfigurado: boolean;
  sefazConfigurada: boolean;
}
export function IntegrationHub({ role }: { role: string }) {
  const [status, setStatus] = useState<Status | null>(null),
    [error, setError] = useState(''),
    [question, setQuestion] = useState(''),
    [answer, setAnswer] = useState(''),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState(''),
    [fiscal, setFiscal] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let active = true;
    requestApi<Status>('/v1/workspace/integracoes')
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !status?.iaConfigurada || !consent || !question.trim()) return;
    setBusy(true);
    setConsent(false);
    setError('');
    setAnswer('');
    try {
      const result = await requestApi<{ resposta: string }>(
        '/v1/workspace/integracoes/ia',
        { method: 'POST', body: JSON.stringify({ pergunta: question, autorizaEnvio: consent }) },
        45000,
      );
      setAnswer(result.resposta);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function query(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFiscal(null);
    try {
      setFiscal(
        await requestApi<Record<string, string>>(
          '/v1/workspace/integracoes/sefaz',
          { method: 'POST', body: JSON.stringify({ chave: key }) },
          35000,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ws-integration">
      <p className="ws-eyebrow">SERVIÇOS CONECTADOS</p>
      <h1>Integrações</h1>
      <p>
        As chaves permanecem no servidor. Configurado não significa conexão validada com o provedor.
      </p>
      {error && (
        <div className="ws-alert" role="alert">
          {error}
        </div>
      )}
      <div className="ws-service-grid">
        {[
          ['Documentos', status?.armazenamento === 's3' ? 'S3 selecionado' : 'Armazenamento local'],
          [
            'Amazon S3',
            status?.s3Configurado ? 'Bucket e região configurados' : 'Configuração necessária',
          ],
          [
            'Google',
            status?.googleConfigurado ? 'Client ID configurado' : 'Configuração necessária',
          ],
          ['E-mail', status?.emailConfigurado ? 'SMTP configurado' : 'Configuração necessária'],
          ['IA', status?.iaConfigurada ? 'Chave e modelo configurados' : 'Configuração necessária'],
          [
            'SEFAZ',
            status?.sefazConfigurada
              ? 'Certificado e serviço configurados'
              : 'Configuração necessária',
          ],
        ].map(([title, label]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{status ? label : error ? 'Status indisponível' : 'Consultando configuração…'}</p>
          </article>
        ))}
      </div>
      <article className="ws-service-panel">
        <h2>Assistente de IA</h2>
        <p>
          Somente sua pergunta será enviada ao provedor. O assistente não recebe automaticamente os
          dados da empresa nem altera cadastros.
        </p>
        <form onSubmit={ask}>
          <label>
            Sua pergunta
            <textarea
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setConsent(false);
              }}
              required
              maxLength={6000}
              rows={4}
            />
          </label>
          <label className="ws-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            Autorizo enviar esta pergunta ao provedor de IA configurado.
          </label>
          <button className="ws-primary" disabled={busy || !status?.iaConfigurada || !consent || !question.trim()}>
            {busy ? 'Consultando…' : 'Enviar pergunta'}
          </button>
        </form>
        {answer && (
          <div className="ws-ai-answer" role="status">
            {answer}
          </div>
        )}
      </article>
      {['SUPER_ADMIN', 'GERENTE_OBRA', 'ALMOXARIFE', 'FINANCEIRO'].includes(role) && (
        <article className="ws-service-panel">
          <h2>Consulta de protocolo NF-e</h2>
          <p>
            Usa o certificado A1 da empresa e o ambiente configurado. Exibe o código e o motivo
            retornados pela SEFAZ, sem inventar itens ou valores da nota.
          </p>
          <form onSubmit={query}>
            <label>
              Chave de acesso (44 dígitos)
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                pattern="[0-9]{44}"
                maxLength={44}
                required
                inputMode="numeric"
              />
            </label>
            <button className="ws-primary" disabled={busy || !status?.sefazConfigurada}>
              Consultar protocolo
            </button>
          </form>
          {fiscal && (
            <dl>
              {Object.entries(fiscal).map(([name, value]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>{value || 'Não informado'}</dd>
                </div>
              ))}
            </dl>
          )}
        </article>
      )}
    </section>
  );
}
export function IfcInspector() {
  const [result, setResult] = useState<IfcReadResult | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const worker = React.useRef<Worker | null>(null);
  useEffect(
    () => () => {
      worker.current?.terminate();
    },
    [],
  );
  function read(file?: File) {
    if (!file) return;
    setBusy(true);
    setResult(null);
    setError('');
    worker.current?.terminate();
    const current = new Worker(new URL('../services/IfcWorker.ts', import.meta.url), {
      type: 'module',
    });
    worker.current = current;
    const timeout = setTimeout(() => {
      current.terminate();
      setBusy(false);
      setError('A leitura excedeu 60 segundos. Tente um modelo menor.');
    }, 60000);
    current.onmessage = (e) => {
      clearTimeout(timeout);
      setBusy(false);
      if (e.data.error) setError(e.data.error);
      else setResult(e.data.result);
      current.terminate();
    };
    current.onerror = () => {
      clearTimeout(timeout);
      setBusy(false);
      setError('Não foi possível iniciar o leitor IFC.');
      current.terminate();
    };
    current.postMessage(file);
  }
  const display = (value: number | null) =>
    value === null ? 'Não informado' : value.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
  return (
    <section className="ws-integration">
      <p className="ws-eyebrow">OPENBIM</p>
      <h1>Leitor IFC</h1>
      <p>Leia um arquivo IFC local de até 20 MB no navegador, sem enviá-lo a um serviço externo.</p>
      <article className="ws-service-panel">
        <label>
          Selecionar arquivo IFC
          <input
            type="file"
            accept=".ifc"
            disabled={busy}
            onChange={(e) => read(e.target.files?.[0])}
          />
        </label>
        {busy && <p role="status">Lendo o arquivo…</p>}
        {error && (
          <div className="ws-alert" role="alert">
            {error}
          </div>
        )}
      </article>
      {result && (
        <>
          <div className="ws-service-grid">
            <article>
              <h3>Modelo</h3>
              <p>{result.fileName}</p>
              <p>{result.ifcSchema}</p>
            </article>
            <article>
              <h3>Elementos</h3>
              <p>{result.totalElementsCount}</p>
            </article>
            <article>
              <h3>Volume declarado (m³)</h3>
              <p>{display(result.totalReportedVolumeM3)}</p>
            </article>
          </div>
          {result.warnings.map((warning) => (
            <p className="ws-help" key={warning}>
              {warning}
            </p>
          ))}
          <div className="ws-table-card ws-table-scroll" tabIndex={0} role="region" aria-label="Tabela de quantidades IFC">
            <table>
              <thead>
                <tr>
                  <th scope="col">Elemento</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Volume (m³)</th>
                  <th scope="col">Área (m²)</th>
                  <th scope="col">Massa (kg)</th>
                </tr>
              </thead>
              <tbody>
                {result.parsedElements.map((element) => (
                  <tr key={element.expressId}>
                    <td>{element.name}</td>
                    <td>{element.type}</td>
                    <td>{display(element.volumeM3)}</td>
                    <td>{display(element.areaM2)}</td>
                    <td>{display(element.weightKg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
