export function parseBankCsv(text: string) {
  if (text.length > 1024 * 1024) throw new Error('O CSV deve ter até 1 MB.');
  const rows: string[][] = [];
  let row: string[] = [],
    field = '',
    quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ';' && !quoted) {
      row.push(field);
      field = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (quoted) throw new Error('Aspas incompletas no CSV.');
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  if (
    rows[0]?.map((v) => v.trim().toLowerCase()).join(';') !== 'identificador;data;descricao;valor'
  )
    throw new Error('Cabeçalho esperado: identificador;data;descricao;valor');
  if (rows.length < 2 || rows.length > 501)
    throw new Error('Informe entre 1 e 500 movimentos por importação.');
  return rows.slice(1).map((r, i) => {
    if (
      r.length !== 4 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(r[1].trim()) ||
      !/^-?\d{1,13}([.,]\d{1,2})?$/.test(r[3].trim())
    )
      throw new Error(
        `Linha ${i + 2}: confira as quatro colunas, a data AAAA-MM-DD e o valor sem separador de milhares.`,
      );
    return {
      identificador: r[0].trim(),
      data: r[1].trim(),
      descricao: r[2].trim(),
      valor: Number(r[3].trim().replace(',', '.')),
    };
  });
}
