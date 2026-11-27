import React from 'react';
import { INITIAL_NFE_CONCILIATIONS } from '../data/mockData';
import { FileCheck } from 'lucide-react';

export const NfeConciliationView: React.FC = () => (
  <section className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-5">
    <header>
      <span className="text-xs font-bold uppercase tracking-wide text-amber-600">Demonstração — somente exemplos</span>
      <h2 className="mt-2 text-xl font-black">Notas fiscais</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Esta tela pertence ao modo de demonstração. Não grava notas, consulta a SEFAZ ou atualiza estoque.
        Use o módulo operacional “Notas fiscais” para registrar dados persistidos.
      </p>
    </header>
    <div className="flex items-center gap-2 text-sm font-semibold"><FileCheck size={18} /> Exemplos carregados na interface</div>
    {INITIAL_NFE_CONCILIATIONS.map((invoice) => (
      <article key={invoice.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <strong>{invoice.nfeNumber} · {invoice.supplierName}</strong>
          <span>{invoice.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <p className="mt-2 break-all font-mono text-xs text-zinc-500">Chave de exemplo: {invoice.nfeKey}</p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Dados fictícios; não representam autorização fiscal ou movimentação de estoque.</p>
      </article>
    ))}
  </section>
);
