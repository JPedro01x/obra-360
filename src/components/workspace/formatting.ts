import type { Row } from './types';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function format(value: Row[string], type?: string) {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (value === null || value === undefined || value === '') return 'Não informado';
  if (type === 'money')
    return Number.isFinite(Number(value)) ? currency.format(Number(value)) : 'Não informado';
  if (type === 'number')
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString('pt-BR') : 'Não informado';
  if (type === 'date') {
    const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : String(value));
    return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleDateString('pt-BR');
  }
  return String(value).replace(/_/g, ' ');
}
