# SDD ledger — plan: docs/superpowers/plans/2026-11-26-maximizar-modelador.md

- Task 1: Maximização do espaço de trabalho implementada em `ModelEditor` com botão acessível, overlay no viewport, rolagem e restauração por Esc. Ferramentas, canvas e inspetor permanecem no mesmo estado de edição.
- Task 1: `npm run typecheck` e `npm run build` passaram; nenhum teste automatizado foi adicionado ou executado, conforme instrução de desenvolvimento.
- Manual: procedimento existente atualizado com instruções Maximizar, Restaurar e Esc.
- Revisão independente: movida toda a barra de edição para dentro do overlay; PlanTools agora rola em altura limitada e o canvas mantém altura mínima; foco fica preso e retorna ao botão; erros/avisos ficam visíveis dentro do overlay.
- Decisão: maximizar continua disponível em perfil de leitura ou modelo arquivado, pois a solicitação inclui visualização; `writable` continua controlando todas as mutações. Se esta interpretação não corresponder ao pedido, o custo é apenas permitir ampliar uma visualização sem edição.
