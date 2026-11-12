export function localCalendarDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
const starts: Record<string, string> = {
  dataPrevisaoFim: 'dataInicio',
  dataTermino: 'dataInicio',
  dataFim: 'dataInicio',
  dataFimPrevista: 'dataInicioPrevista',
  fim: 'inicio',
};
export type PlanningField = { name: string; label: string; type?: string; futureOnly?: boolean };
export function planningMinimum(
  field: PlanningField,
  values: Record<string, unknown>,
  originals: Record<string, unknown> = {},
): string | undefined {
  if (field.type !== 'date' && field.type !== 'datetime-local') return undefined;
  const start = String(values[starts[field.name]] || '');
  if (!field.futureOnly) return start || undefined;
  let minimum = localCalendarDate();
  if (field.type === 'datetime-local') {
    const nextMinute = new Date(Date.now() + 60000);
    minimum = `${localCalendarDate(nextMinute)}T${String(nextMinute.getHours()).padStart(2, '0')}:${String(nextMinute.getMinutes()).padStart(2, '0')}`;
  }
  const original = String(originals[field.name] || '');
  if (field.type === 'date' && original && values[field.name] === original && original < minimum)
    minimum = original;
  return start > minimum ? start : minimum;
}
export function planningError(
  fields: PlanningField[],
  values: Record<string, unknown>,
  originals: Record<string, unknown> = {},
): string | undefined {
  for (const [end, start] of Object.entries(starts)) {
    if (values[end] && values[start] && String(values[end]) < String(values[start]))
      return 'A data final deve ser igual ou posterior ao início.';
  }
  const today = localCalendarDate();
  for (const field of fields) {
    const value = values[field.name];
    if (!field.futureOnly || !value) continue;
    if (field.type === 'datetime-local') {
      if (
        !Number.isFinite(new Date(String(value)).getTime()) ||
        new Date(String(value)).getTime() <= Date.now()
      )
        return `${field.label} deve estar no futuro.`;
    } else if (field.type === 'date' && String(value) < today && value !== originals[field.name])
      return `${field.label} não pode estar no passado.`;
  }
  return undefined;
}
