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
}: {
  field: { name: string; label: string; source?: string; optional?: boolean };
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [options, setOptions] = useState<Option[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const c = new AbortController();
    const timer = setTimeout(
      () =>
        api<Option[]>(`/opcoes/${field.source}?q=${encodeURIComponent(query)}`, {
          signal: c.signal,
        })
          .then((value) => {
            if (!c.signal.aborted) {
              setOptions(value);
              setError('');
            }
          })
          .catch((e) => {
            if (!c.signal.aborted) setError(e.message);
          }),
      query ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      c.abort();
    };
  }, [field.source, query]);
  return (
    <div className="rh-select">
      <input
        aria-label={`Buscar opções: ${field.label}`}
        placeholder="Buscar opções pelo nome…"
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        aria-label={field.label}
        name={field.name}
        required={!field.optional}
        value={value}
        disabled={disabled}
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
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
