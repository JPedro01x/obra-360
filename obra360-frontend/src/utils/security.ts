/**
 * 🛡️ UTILITÁRIOS DE SEGURANÇA, MASCARAMENTO DE PII E SANITIZAÇÃO LGPD
 * 
 * Atende às diretrizes da LGPD (Lei nº 13.709/2018) e OWASP Top 10 para proteção
 * de dados sensíveis na camada de apresentação (Presentation Layer).
 */

/**
 * Sanitiza strings para prevenção de Cross-Site Scripting (XSS)
 */
export function sanitizeInput(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Mascara e-mails para exibição pública ou perfis de menor privilégio (ex: j***o@obra360.com)
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.com';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.substring(0, 2)}***${user.substring(user.length - 1)}@${domain}`;
}

/**
 * Mascara CNPJ para conformidade LGPD (ex: 12.345.***\/****-90)
 */
export function maskCnpj(cnpj: string): string {
  if (!cnpj || cnpj.length < 14) return '**.***.***\/****-**';
  return cnpj.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})$/, '$1.$2.***\/****-$5');
}

/**
 * Mascara telefone corporativo (ex: (11) 9****-5000)
 */
export function maskPhone(phone: string): string {
  if (!phone) return '(**) *****-****';
  return phone.replace(/(\(\d{2}\)\s*\d{1})\d{4}(\-\d{4})/, '$1****$2');
}

/**
 * Gera arquivo JSON de portabilidade de dados do titular (LGPD Art. 18 - Direito à Portabilidade)
 */
export function downloadLgpdDataPortability(userData: any, filename = 'obra360_lgpd_portabilidade_dados.json') {
  const jsonStr = JSON.stringify(userData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
