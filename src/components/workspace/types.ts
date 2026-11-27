export type Row = Record<string, string | number | boolean | null>;
export interface Session {
  id: number;
  exigeTrocaSenha?: boolean;
  nome: string;
  email: string;
  perfil: string;
  empresa: { nomeFantasia: string; razaoSocial: string; cnpj: string; ambienteDados?: string };
}
export interface Page {
  items: Row[];
  total: number;
  page: number;
  size: number;
}
export interface Resource {
  id: string;
  title: string;
  description: string;
  columns: [string, string, ('money' | 'date' | 'number')?][];
  restricted?: boolean;
  adminOnly?: boolean;
}
