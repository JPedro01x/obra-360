import React, { useEffect, useState } from 'react';
import { requestApi } from '../services/http';
type Option = { id: number; nome: string };
const api = <T,>(path: string, options?: RequestInit) =>
  requestApi<T>(`/v1/workspace/rh${path}`, options);
export function RhSelect({
  field,
  value,
  onChange,
  disabled = false,
  context,
}: {
  field: { name: string; label: string; source?: string; optional?: boolean };
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  context?: { param: string; value: string; label: string };
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const waiting = !!context && !context.value;
  useEffect(() => {
    const c = new AbortController();
    setOptions([]);
    setError('');
    if (waiting) {
      setLoading(false);
      return () => c.abort();
    }
    setLoading(true);
    const timer = setTimeout(
      () =>
        api<Option[]>(
          `/opcoes/${field.source}?q=${encodeURIComponent(query)}${context?.value ? `&${context.param}=${encodeURIComponent(context.value)}` : ''}`,
          {
            signal: c.signal,
          },
        )
          .then((value) => {
            if (!c.signal.aborted) {
              setOptions(value);
              setError('');
            }
          })
          .catch((e) => {
            if (!c.signal.aborted) setError(e.message);
          })
          .finally(() => {
            if (!c.signal.aborted) setLoading(false);
          }),
      query ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [field.source, query, context?.param, context?.value, waiting]);
  return (
    <div className="rh-select">
      <input
        aria-label={`Buscar opções: ${field.label}`}
        placeholder="Buscar opções pelo nome…"
        value={query}
        disabled={disabled || waiting}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label={field.label}
        name={field.name}
        required={!field.optional}
        value={value}
        disabled={disabled || waiting || loading || !!error}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{field.optional ? 'Sem vínculo' : 'Selecione…'}</option>
        {value && !options.some((o) => String(o.id) === value) && (
          <option value={value}>Registro #{value}</option>
        )}
        {options.map((o) => (
          <option value={o.id} key={o.id}>
            {o.nome} · #{o.id}
          </option>
        ))}
      </select>
      {waiting && <small>Selecione primeiro o {context?.label}.</small>}
      {!waiting && !loading && !error && !options.length && (
        <small>Nenhum cadastro encontrado para esta seleção.</small>
      )}
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
