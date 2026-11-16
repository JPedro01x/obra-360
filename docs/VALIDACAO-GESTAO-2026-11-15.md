# Validação da atualização de gestão — 15/11/2026

Implementação: orçamento revisado, contas/baixas/estornos, conciliação CSV, pedidos com vários itens, recebimento parcial e devolução, exportação administrativa para contabilidade, reconhecimento assistido de paredes, exportação assíncrona, quota local e comando de retenção técnica. Regras e limites em [GESTAO-FINANCEIRA-E-COMPRAS.md](GESTAO-FINANCEIRA-E-COMPRAS.md).

## Evidências executadas

- Compilação Java 21 e pacote da aplicação: aprovados.
- Verificação TypeScript: aprovada.
- Interface Chromium: **74 cenários aprovados**, incluindo orçamento, múltiplos materiais, entrega/devolução, CSV, exportação para contabilidade, reconhecimento assistido e temas claro/escuro em celular de 320 px. Registro local: `scratch/gestao-ui-final.log`.
- PostgreSQL temporário: **87 cenários aprovados** (84 de fluxos/permissões e 3 de atomicidade/concorrência/exportação), com migrações V1–V29 e esquema validado. Testes com gravações persistentes de concorrência usam esquema separado da suíte de instalação inicial. Registro: `scratch/gestao-postgres-retest.log`.
- Suíte Java completa com H2: aprovada durante a implementação; regressão PostgreSQL posterior inclui as validações novas de retenção e créditos de devolução. Registro: `scratch/gestao-verify-final.log`.
- Concorrência: dois recebimentos com a mesma chave aumentam o estoque uma vez; falha no segundo material reverte toda a entrega, inclusive estoque e eventos.
- Exportação assíncrona: ZIP privado gerado, credenciais excluídas, outra empresa bloqueada e arquivo removido após expiração em cenário de teste.
- Quota: documentos gerais e RH contam no mesmo limite; gravação acima da quota é rejeitada sem arquivo parcial no cenário testado.
- Instalação persistida: consultas e telas de financeiro/pedidos acessíveis, sem erros JavaScript e sem registrar despesas ou movimentações de estoque nessa conferência. Cálculos legais, eSocial e provedores externos conferidos como desativados. Registro: `scratch/gestao-live-check.log`.
- Backup anterior à atualização: `backups/2026-11-15T16-14-19.128Z`, 18 arquivos conferidos por manifesto. Diagnóstico posterior: API, interface, autenticação, disco e backup saudáveis.

Os bancos de testes são isolados da instalação operacional. Os arquivos de evidência em `scratch/` e backups são privados e ignorados pelo Git. Esses resultados não equivalem a homologação contábil/trabalhista, auditoria independente, aceite de cliente ou certificação de capacidade. O RH permanece administrativo, sem cálculo legal ou transmissão oficial. Os provedores externos permanecem sem ativação.
