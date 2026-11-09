import { sanitizeInput } from './security';

/** Quote delimiters and prevent spreadsheet formulas in user supplied text. */
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (typeof value !== 'number' && /^[\s]*[=+\-@\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function escapeReportRecord<T extends object>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      typeof value === 'string' ? sanitizeInput(value) : value,
    ]),
  ) as T;
}
