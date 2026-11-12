import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const pilotCases = [
  'cadastros', 'perfis', 'projetos', 'equipes_os', 'compras_estoque', 'documentos',
  'rh_administrativo', 'plantas', 'isolamento_empresas', 'recuperacao_senha',
  'backup_restauracao', 'capacidade', 'atendimento',
];
export function pilotTemplate() {
  return {
    formato: 'obra360-piloto-v1', empresa: { nome: '', cnpj: '' }, versao: '',
    cenarios: pilotCases.map(id => ({ id, resultado: 'PENDENTE', responsavel: '',
      aprovadoEm: null, evidencia: '', observacoes: '' })),
  };
}
const filled = value => typeof value === 'string' && value.trim().length > 0;

// Validate the structure of a human acceptance record, never its truth or legal effect.
export function validatePilot(report, now = new Date()) {
  const pendencias = [];
  if (report?.formato !== 'obra360-piloto-v1') pendencias.push('Formato de relatório inválido.');
  if (!filled(report?.empresa?.nome) || !/^\d{14}$/.test(report?.empresa?.cnpj || ''))
    pendencias.push('Identifique a empresa e seu CNPJ sem pontuação.');
  if (!filled(report?.versao)) pendencias.push('Identifique a versão efetivamente testada.');
  const rows = Array.isArray(report?.cenarios) ? report.cenarios : [];
  if (rows.some(row => !pilotCases.includes(row?.id))) pendencias.push('Há cenários desconhecidos.');
  for (const id of pilotCases) {
    const matches = rows.filter(row => row?.id === id);
    if (matches.length !== 1) { pendencias.push(`${id}: cenário ausente ou duplicado.`); continue; }
    const row = matches[0];
    if (row.resultado !== 'APROVADO') { pendencias.push(`${id}: ${row.resultado === 'REPROVADO' ? 'reprovado' : 'pendente'}.`); continue; }
    if (!filled(row.responsavel) || !filled(row.evidencia))
      pendencias.push(`${id}: informe responsável e referência à evidência.`);
    const date = typeof row.aprovadoEm === 'string' ? Date.parse(row.aprovadoEm) : NaN;
    if (!/^\d{4}-\d{2}-\d{2}T/.test(row.aprovadoEm || '') || !Number.isFinite(date) || date > now.getTime())
      pendencias.push(`${id}: informe uma data de aprovação válida e não futura.`);
  }
  return {
    aceiteDeclaradoCompleto: pendencias.length === 0, pendencias,
    observacao: 'Validação estrutural de declarações humanas. Não confirma autenticidade das evidências, dados cadastrais, assinatura, segurança independente ou prontidão comercial.',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--modelo') console.log(JSON.stringify(pilotTemplate(), null, 2));
  else {
    try {
      if (!process.argv[2]) throw new Error();
      const result = validatePilot(JSON.parse(await readFile(process.argv[2], 'utf8')));
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.aceiteDeclaradoCompleto ? 0 : 1;
    } catch {
      console.error('Informe um relatório JSON válido. Para gerar o modelo: npm run validar:piloto -- --modelo');
      process.exitCode = 2;
    }
  }
}
