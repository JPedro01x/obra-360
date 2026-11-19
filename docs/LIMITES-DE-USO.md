# Limites de uso e armazenamento privado

## Ativação

O comportamento local permanece padrão: HTTP 100 requisições/minuto por endereço de conexão, IA cinco perguntas/minuto por usuário, e armazenamento global de 10 GiB (`DOCUMENT_STORAGE_MAX_BYTES`). `obra360.security.requests-per-minute` continua configurável. Não se confia diretamente em `X-Forwarded-For` ou `Forwarded`; um proxy confiável precisa resolver o endereço antes do filtro.

Para compartilhar contadores entre instâncias usando **o mesmo banco da aplicação**, configurar:

- `obra360.limits.shared-enabled=true` (`SHARED_USAGE_LIMITS_ENABLED`).
- `obra360.limits.key-secret` (`SHARED_USAGE_LIMITS_SECRET`), segredo aleatório de pelo menos 32 bytes, igual em todas as instâncias; não reutilizar senha do banco/JWT. Não registrar o valor. Trocar o segredo inicia novas identidades de contagem.

O modo compartilhado usa janelas fixas alinhadas ao minuto UTC, com transações independentes do negócio e 64 locks relacionais. A fronteira de minuto pode permitir duas cotas próximas uma da outra; não é uma janela deslizante nem um orçamento financeiro de tokens. HTTP retorna 429 com `Retry-After`; falha do banco retorna 503 sem encaminhar a requisição ao serviço. IA consome uma tentativa antes de chamar o provedor, inclusive se o provedor falhar. Chaves persistidas são HMAC-SHA256 com escopo separado para HTTP e IA; não se armazenam IP, pergunta, token ou credencial nessas tabelas.

Há no máximo 2.048 identidades por faixa (131.072 no total). Saturação nega novas identidades. Limpeza remove lotes limitados de chaves expiradas, também após reinício; agendamento periódico não depende de novas requisições. Não exportar essas tabelas como identificação de clientes.

## Orçamento por empresa

`DOCUMENT_STORAGE_TENANT_MAX_BYTES` é a cota padrão de **novos documentos contabilizados** por empresa, somando documentos operacionais e RH. Zero (padrão) desabilita a nova contabilidade; valor negativo impede inicialização. A quota global continua incluindo todos os arquivos físicos, inclusive RH, exportações e arquivos antigos, e permanece a proteção final do disco.

A migração V33 cria um ledger vazio. Ela **não atribui arquivos históricos** à empresa atual. Arquivos já existentes ou escritos enquanto a quota estava desabilitada permanecem sem contabilização por empresa e continuam ocupando a quota global. A leitura desses legados preserva a autorização das rotas existentes; não há migração automática baseada no nome do arquivo ou em quem o leu. Uma eventual incorporação exige inventário validado de referências e donos no banco, backup e procedimento de manutenção.

Arquivos novos contabilizados têm empresa obtida do contexto autenticado no servidor e verificação adicional de proprietário ao ler/excluir. Sem contexto, a escrita com quota ativa é recusada. Operadores podem definir um orçamento específico em `storage_usage.limit_bytes` por empresa, sob lock e transação; `NULL` usa o padrão do ambiente. Nunca reduzir `used_bytes` manualmente para liberar espaço. Reduzir o orçamento abaixo do uso bloqueia novas escritas até liberar espaço legitimamente.

A reserva do ledger é confirmada antes da escrita. Falha da escrita libera a reserva; rollback do negócio remove o novo arquivo e libera a reserva. Exclusão durante uma transação ocorre depois do commit, preservando o arquivo em caso de rollback. Arquivo só libera espaço contabilizado depois de removido do disco. Se houver queda de processo, indisponibilidade no momento da compensação ou erro de limpeza, o ledger pode reter uma cobrança conservadora. O operador deve reconciliar referências, existência/tamanho e empresas antes de corrigir; não apagar automaticamente uma reserva simplesmente por idade. O contador representa bytes reservados/contabilizados, não uma promessa de ocupação física exata.

## Restrição operacional

O filesystem privado requer **um único escritor por diretório local**. Locks relacionais tornam os contadores compartilháveis, mas não tornam `Files.walk`, a reserva de exportação, criação e exclusão de arquivos seguros como armazenamento distribuído. Não escalar réplicas compartilhando o diretório sem projeto e homologação específicos. Exportações continuam usando a quota/reserva global existente; a cota de documentos por empresa não contabiliza automaticamente os ZIPs.

Conservar backup consistente de banco e diretório, e monitorar espaço físico, respostas 429/503/507 e divergências entre ledger e disco. Os testes isolados verificam concorrência entre serviços, fronteira de janela, falha fechada, isolamento entre empresas e rollback; não representam homologação de filesystem distribuído ou carga de produção.

## Evidência PostgreSQL — 19/11/2026

`PostgresOperationalLimitsIntegrationTest` executou quatro testes sem falhas em PostgreSQL 18.6 local isolado, usando um schema aleatório removido ao final e as migrações reais V32/V33. Dois serviços concorrentes admitiram exatamente 17 de 80 tentativas para uma cota de 17; duas instâncias de quota admitiram cinco de 30 reservas de dois bytes para orçamento de dez bytes. Também foram verificados fronteira e recuo de relógio, isolamento de escopos/empresas, rollback de inclusão e exclusão, exclusão após commit, alias de UUID em maiúsculas, limpeza em lotes e falha fechada 503 com tabela temporariamente indisponível. O erro de relação inexistente no log do servidor é provocado deliberadamente por esse último teste.

O teste é condicionado a `TEST_POSTGRES_URL` e integra a lista de `npm run test:postgres`. Essa execução complementa os 21 testes direcionados em H2; não substitui a suíte completa de integração nem comprova carga ou filesystem distribuído.
