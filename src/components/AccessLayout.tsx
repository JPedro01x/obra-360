import React from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import './access.css';

// Presentation metadata only. Authorization always comes from the saved account.
export const accessProfiles = [
  { id: 'SUPER_ADMIN', title: 'Super Administrador (TI)', level: 1, area: 'Administração' },
  { id: 'INCORPORADOR', title: 'Incorporador & Desenvolvedor', level: 1, area: 'Incorporação' },
  { id: 'GERENTE_OBRA', title: 'Gerente Geral de Obras', level: 1, area: 'Gestão de Obras' },
  {
    id: 'ARQUITETO',
    title: 'Arquiteto & Projetista BIM',
    level: 2,
    area: 'Arquitetura & Projetos',
  },
  {
    id: 'ENGENHEIRO',
    title: 'Engenheiro Residente (Campo)',
    level: 2,
    area: 'Engenharia de Campo',
  },
  {
    id: 'FINANCEIRO',
    title: 'Analista Financeiro & Custos',
    level: 2,
    area: 'Controladoria & Finanças',
  },
  { id: 'RH', title: 'Recursos Humanos', level: 2, area: 'Gestão de Pessoas' },
  { id: 'MESTRE_OBRA', title: 'Mestre de Obras', level: 3, area: 'Operações de Canteiro' },
  { id: 'ALMOXARIFE', title: 'Almoxarife Chefe', level: 3, area: 'Logística de Materiais' },
  { id: 'COLABORADOR', title: 'Colaborador', level: 3, area: 'Meu cadastro e demonstrativos' },
  { id: 'AUDITOR', title: 'Auditor', level: 4, area: 'Transparência & Auditoria' },
  { id: 'FORNECEDOR', title: 'Fornecedor B2B de Materiais', level: 5, area: 'Fornecedores B2B' },
  {
    id: 'LOCADOR_MAQUINAS',
    title: 'Locador de Máquinas & Equipamentos',
    level: 5,
    area: 'Locação de Equipamentos',
  },
  {
    id: 'CORRETOR',
    title: 'Corretor / Imobiliária Parceira',
    level: 5,
    area: 'Comercial & Imobiliário',
  },
  { id: 'INVESTIDOR', title: 'Investidor Imobiliário', level: 5, area: 'Investimentos' },
  { id: 'CLIENTE', title: 'Cliente Proprietário', level: 5, area: 'Relacionamento com Cliente' },
];
const levels: Record<number, string> = {
  1: 'Gestão Estratégica',
  2: 'Engenharia & Operação',
  3: 'Execução & Logística',
  4: 'Transparência & Auditoria',
  5: 'Negócios & Mercado B2B/B2C',
};
export function SelectedAccess({ role }: { role: string }) {
  const profile = accessProfiles.find((p) => p.id === role);
  return (
    <div className="access-selected" aria-live="polite">
      <div>
        <span>Perfil de acesso</span>
        <small>{profile?.area || 'Conta cadastrada'}</small>
      </div>
      <strong>{profile?.title || 'Identificar pelo meu cadastro'}</strong>
      <p>
        {profile
          ? `Nível ${profile.level} — ${levels[profile.level]}`
          : 'O sistema confirma seu perfil ao autenticar.'}
      </p>
    </div>
  );
}
export function AccessLayout({
  children,
  role,
  onRoleChange,
}: {
  children: React.ReactNode;
  role: string;
  onRoleChange: (role: string) => void;
}) {
  return (
    <main className="ws access-page">
      <div className="access-grid">
        <section className="access-card access-identity" aria-label="Escolha de nível de usuário">
          <div className="access-brand">
            <span>360</span>
            <div>
              <h1>Obra360</h1>
              <p>Plataforma B2B/B2C da Construção & Imóveis</p>
            </div>
          </div>
          <p className="access-description">
            Acesso exclusivo para atores do ecossistema corporativo: incorporadores, arquitetos,
            construtores, fornecedores B2B, corretores, investidores e clientes.
          </p>
          <h2 className="access-list-title">
            <Sparkles size={15} /> Perfis do ecossistema ({accessProfiles.length})
          </h2>
          <fieldset className="access-profiles">
            <legend>Escolha seu perfil de acesso</legend>
            <label className={`access-profile ${role === '' ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="perfilAcesso"
                value=""
                checked={role === ''}
                onChange={() => onRoleChange('')}
              />
              <span className="access-level">Automático</span>
              <strong>Identificar pelo meu cadastro</strong>
              <small>Usar o perfil vinculado à minha conta</small>
            </label>
            {accessProfiles.map((p) => (
              <label
                key={p.id}
                className={`access-profile level-${p.level} ${role === p.id ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="perfilAcesso"
                  value={p.id}
                  checked={role === p.id}
                  onChange={() => onRoleChange(p.id)}
                />
                <span className="access-level">Nível {p.level}</span>
                <strong>{p.title}</strong>
                <small>{p.area}</small>
              </label>
            ))}
          </fieldset>
          <div className="access-restricted">
            <ShieldCheck size={17} />
            <span>Autenticação restrita a usuários previamente cadastrados.</span>
          </div>
        </section>
        <section className="access-card access-form-panel">{children}</section>
      </div>
    </main>
  );
}
