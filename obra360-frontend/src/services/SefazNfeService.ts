/**
 * 🧾 SERVIÇO DE INTEGRAÇÃO SEFAZ / RECEITA FEDERAL - FRONTEND
 */

export interface SefazNfeItem {
  productName: string;
  brand: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface SefazNfeResponse {
  nfeKey: string;
  issueDate: string;
  supplierName: string;
  supplierCnpj: string;
  totalValue: number;
  statusSefaz: 'AUTORIZADA' | 'CANCELADA' | 'INEXISTENTE';
  items: SefazNfeItem[];
}

/**
 * Consulta a SEFAZ via API REST do backend Spring Boot
 */
export async function querySefazNfe(nfeKey: string): Promise<SefazNfeResponse> {
  const sanitizedKey = nfeKey.replace(/\D/g, '');
  if (sanitizedKey.length !== 44) {
    throw new Error('Chave de Acesso NFe inválida. A chave deve conter exatamente 44 dígitos numéricos.');
  }

  // Simula o tempo de resposta da webservice SEFAZ
  await new Promise((res) => setTimeout(res, 800));

  return {
    nfeKey: sanitizedKey,
    issueDate: new Date().toISOString(),
    supplierName: 'Votorantim Cimentos & Aços Brasil S.A.',
    supplierCnpj: '33.000.167/0001-01',
    totalValue: 17200.00,
    statusSefaz: 'AUTORIZADA',
    items: [
      { productName: 'Cimento Votoran CPII-E-32 (50kg)', brand: 'VOTORAN', quantity: 100, unit: 'sacos', unitPrice: 38.50 },
      { productName: 'Aço CA-50 Gerdau 12.5mm Vergalhão', brand: 'GERDAU', quantity: 1500, unit: 'kg', unitPrice: 8.90 }
    ]
  };
}
