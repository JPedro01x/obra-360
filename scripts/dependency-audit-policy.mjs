// Validates local evidence, not the authenticity of the file or an independent pentest.
export function validateDependencyAudit(report, jarSha256, now = Date.now()) {
  const issues = [];
  if (!/^[a-f0-9]{64}$/.test(jarSha256 || '') || report?.jarSha256 !== jarSha256)
    issues.push('A auditoria não corresponde ao JAR da entrega.');
  const age = now - Date.parse(report?.consultadoEm || '');
  if (!Number.isFinite(age) || age < 0 || age > 7 * 24 * 60 * 60 * 1000)
    issues.push('A consulta deve ter ocorrido nos últimos sete dias, sem data futura.');
  if (report?.fonte !== 'https://api.osv.dev/v1/querybatch')
    issues.push('Fonte de auditoria não reconhecida.');
  if (!Array.isArray(report?.achados) || report.achados.length || report?.avisosUnicos !== 0)
    issues.push('Há avisos de dependências ou resultado incompleto.');
  if (
    report?.inventarioRuntimeCompleto !== true ||
    !Array.isArray(report?.runtimeNaoIdentificado) ||
    report.runtimeNaoIdentificado.length ||
    !Array.isArray(report?.pacotes) ||
    !report.pacotes.length ||
    report.pacotes.length !== report.pacotesIdentificados
  )
    issues.push('Inventário de bibliotecas da aplicação incompleto.');
  return { aprovado: issues.length === 0, pendencias: issues };
}
