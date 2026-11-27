import { modelRoles } from '../../services/modelGeometry';
import { internal, privileged, resources } from './resources';

const spreadsheetRoles = ['SUPER_ADMIN', 'RH', 'GERENTE_OBRA', 'INCORPORADOR'];

/** Frontend navigation policy. API authorization remains the security boundary. */
export function canAccessWorkspacePage(profile: string, page: string): boolean {
  if (page === 'conta' || page === 'notificacoes') return true;
  if (page === 'chat') return internal.includes(profile) || profile === 'COLABORADOR';
  if (page === 'medicoes') return ['SUPER_ADMIN','GERENTE_OBRA','ENGENHEIRO','FINANCEIRO','INCORPORADOR','AUDITOR'].includes(profile);
  if (page === 'notasfiscais') return ['SUPER_ADMIN','GERENTE_OBRA','FINANCEIRO','ALMOXARIFE','AUDITOR'].includes(profile);

  if (profile === 'RH') return page === 'rh' || (page === 'planilhas' && spreadsheetRoles.includes(profile));
  if (profile === 'COLABORADOR') return page === 'colaborador';
  if (!internal.includes(profile)) return false;

  if (page === 'rh') return profile === 'SUPER_ADMIN';
  if (page === 'planilhas') return spreadsheetRoles.includes(profile);
  if (page === 'dados') return profile === 'SUPER_ADMIN';
  if (page === 'integracoes' || page === 'ifc') return profile !== 'RH';
  if (page === 'modelador') return modelRoles.includes(profile);
  if (page === 'financeiro') return privileged.includes(profile);
  if (page === 'pedidosmateriais') return [...privileged, 'ALMOXARIFE'].includes(profile);

  const resource = resources.find((item) => item.id === page);
  if (!resource) return false;
  return (
    (page !== 'compras' || [...privileged, 'ALMOXARIFE'].includes(profile)) &&
    (!resource.restricted || privileged.includes(profile)) &&
    (!resource.adminOnly || profile === 'SUPER_ADMIN')
  );
}
