import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';

type Profile = {
  nome: string;
  matricula: string;
  situacao: string;
  admissao: string;
  departamento: string;
  cargo: string;
  jornadaSemanalMinutos: number;
};
type Attendance = {
  id: number;
  data: string;
  entrada: string;
  saida: string;
  minutosTrabalhados: number;
  situacao: string;
};
type Payroll = { id: number; competencia: string; situacao: string };
type Statement = {
  competencia: string;
  situacao: string;
  proventos: number;
  descontos: number;
  liquido: number;
  lancamentos: { codigo: string; descricao: string; natureza: string; valor: number }[];
};
const api = <T,>(path: string, signal?: AbortSignal) =>
  requestApi<T>(`/v1/workspace/colaborador${path}`, { signal });
const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const date = (value: string) => value.split('-').reverse().join('/');

export function EmployeePortal() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [attendance, setAttendance] = useState<{ items: Attendance[]; total: number }>({
    items: [],
    total: 0,
  });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState('');
  const [statement, setStatement] = useState<Statement | null>(null);
  const [error, setError] = useState('');
  const [attendanceError, setAttendanceError] = useState('');
  const [statementError, setStatementError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api<Profile>('', controller.signal), api<Payroll[]>('/folhas', controller.signal)])
      .then(([employee, payroll]) => {
        setProfile(employee);
        setPayrolls(payroll);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setAttendanceError('');
    api<{ items: Attendance[]; total: number }>(`/ponto?page=${page}`, controller.signal)
      .then(setAttendance)
      .catch((e) => {
        if (!controller.signal.aborted) setAttendanceError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page]);
  useEffect(() => {
    setStatement(null);
    setStatementError('');
    if (!selected) return;
    const controller = new AbortController();
    api<Statement>(`/folhas/${selected}`, controller.signal)
      .then(setStatement)
      .catch((e) => {
        if (!controller.signal.aborted) setStatementError(e.message);
      });
    return () => controller.abort();
  }, [selected]);
  return (
    <div>
      <h1>Meu cadastro</h1>
      <p>Consulte seus dados funcionais, registros de ponto e demonstrativos liberados pelo RH.</p>
      {error && (
        <p className="ws-alert" role="alert">
          {error}
        </p>
      )}
      {profile && (
        <section className="ws-service-panel" aria-label="Meus dados funcionais">
          <h2>{profile.nome}</h2>
          <dl>
            {[
              ['Matrícula', profile.matricula],
              ['Departamento', profile.departamento],
              ['Cargo', profile.cargo],
              ['Admissão', date(profile.admissao)],
              ['Situação', profile.situacao],
              ['Jornada semanal', `${profile.jornadaSemanalMinutos} minutos`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <section className="ws-service-panel" aria-label="Meu ponto">
        <h2>Meu ponto</h2>
        {attendanceError && <p role="alert">{attendanceError}</p>}
        {loading ? (
          <p role="status">Consultando ponto…</p>
        ) : (
          !attendanceError && (
            <>
              {attendance.items.length ? (
                <div
                  className="ws-table-scroll"
                  role="region"
                  aria-label="Meus registros de ponto"
                  tabIndex={0}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Minutos</th>
                        <th>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.items.map((item) => (
                        <tr key={item.id}>
                          <td>{date(item.data)}</td>
                          <td>{item.entrada}</td>
                          <td>{item.saida}</td>
                          <td>{item.minutosTrabalhados}</td>
                          <td>{item.situacao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Nenhum registro de ponto disponível.</p>
              )}
              <div className="ws-table-footer">
                <span>
                  Página {page + 1} · {attendance.total} registros
                </span>
                <div>
                  <button
                    className="ws-secondary"
                    disabled={page === 0}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Ponto anterior
                  </button>
                  <button
                    className="ws-secondary"
                    disabled={(page + 1) * 25 >= attendance.total}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Próxima página de ponto
                  </button>
                </div>
              </div>
            </>
          )
        )}
      </section>
      <section className="ws-service-panel" aria-label="Meus demonstrativos">
        <h2>Meus demonstrativos</h2>
        <p>
          São exibidas somente folhas fechadas ou pagas com lançamentos em seu nome. Os valores são
          os registros administrativos do RH.
        </p>
        <label>
          Competência do demonstrativo
          <select aria-label="Competência do demonstrativo" value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Selecione uma competência</option>
            {payrolls.map((payroll) => (
              <option key={payroll.id} value={payroll.id}>
                {payroll.competencia} · {payroll.situacao}
              </option>
            ))}
          </select>
        </label>
        {!error && !payrolls.length && <p>Nenhum demonstrativo liberado.</p>}
        {statementError && <p role="alert">{statementError}</p>}
        {statement && (
          <article>
            <h3>Demonstrativo {statement.competencia}</h3>
            <ul>
              {statement.lancamentos.map((item, index) => (
                <li key={`${item.codigo}-${index}`}>
                  {item.codigo} · {item.descricao} · {item.natureza}: {money(item.valor)}
                </li>
              ))}
            </ul>
            <p>
              Proventos: {money(statement.proventos)} · Descontos: {money(statement.descontos)}
            </p>
            <strong>Líquido informado: {money(statement.liquido)}</strong>
          </article>
        )}
      </section>
    </div>
  );
}
