# Painel operacional de mensageria

Integrações exibe indicadores e falhas em quarentena somente para SUPER_ADMIN, GERENTE_OBRA e AUDITOR. Os dois primeiros podem solicitar reprocessamento de falhas não resolvidas com evento identificado. A autorização definitiva permanece no servidor.

O painel consulta os indicadores e páginas de 25 falhas, permite atualização manual e mostra os contadores de publicação, processamento, consumo e atraso. Reprocessamento impede envios repetidos enquanto ocupado, atualiza os indicadores após sucesso e mantém erro explícito com opção de nova tentativa quando o servidor falha.

Cada consulta usa cancelamento e sequência para ignorar respostas substituídas. Ao sair da tela, respostas tardias não atualizam a tela remontada. O painel apresenta apenas identificador do evento, tipo do erro, data e estado; não apresenta payload bruto nem texto de exceção.

Playwright: cobertura de visibilidade por cinco perfis, auditor sem escrita, falha503 seguida de reprocessamento bem-sucedido, atualização do registro, paginação e resposta atrasada após remontagem. Fixtures HTTP verificam a interface; isolamento e idempotência efetivos pertencem aos testes do backend.
