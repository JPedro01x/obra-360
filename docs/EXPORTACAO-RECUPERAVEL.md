# Exportação recuperável no armazenamento local

A tabela `exportacao_job` é a fila operacional. O pedido é confirmado apenas depois do commit do trabalho e da auditoria; o executor mantém somente um processamento em memória. Um polling a cada dois segundos encontra os pedidos persistidos, inclusive depois de reinício. Não há limite artificial de quatro pedidos perdidos quando o processo encerra.

## Contrato da instalação

Esta implementação suporta **um escritor por diretório local**. Antes de recuperar trabalhos, a aplicação obtém um lock exclusivo do sistema operacional em `exportacoes/.worker.lock`, mantido durante sua vida útil. Outra aplicação apontando para o mesmo diretório falha na inicialização antes de consultar ou alterar a fila. Não remova o arquivo de lock enquanto houver processo ativo: a existência do arquivo não indica posse, e apagá-lo pode invalidar a exclusão em alguns sistemas. Após um encerramento abrupto o sistema operacional libera a posse; o arquivo vazio pode continuar existindo.

O mesmo banco não deve ser usado por instalações que apontem para diretórios diferentes. Locks de arquivos locais não oferecem coordenação entre sites, diretórios distintos, sistemas de arquivos sem locks confiáveis ou réplicas com discos independentes. O armazenamento dos documentos também mantém seu contrato de escritor único. Não há armazenamento em nuvem nesta alteração.

## Recuperação e falhas

Ao iniciar, o único escritor limpa arquivos finais ainda não publicados e arquivos `.zip.part` de trabalhos `FILA`/`PROCESSANDO`, mantém o pedido original e volta a processá-lo. O conteúdo é gerado novamente usando os dados disponíveis na tentativa, sem prometer uma fotografia dos dados no instante da solicitação.

Cada tentativa é contada em uma transação antes da geração. Há no máximo três tentativas por pedido, com intervalo de 30 segundos após falhas comuns. Um crash também consome a tentativa iniciada. Ao atingir três tentativas o pedido fica `FALHA`; uma nova solicitação exige novo pedido autorizado. O prazo continua sendo 24 horas desde a solicitação, inclusive enquanto aguarda na fila. Pedidos vencidos não geram um novo arquivo.

O ZIP é escrito em um arquivo privado `.zip.part` e só recebe o nome final por movimentação atômica no mesmo diretório. A publicação no banco ocorre depois dessa movimentação. Se o processo morrer entre movimentação e publicação, o próximo processo apaga o arquivo não publicado e repete a tentativa. Downloads exigem estado `PRONTO`, empresa correta e prazo válido. Um arquivo parcial nunca é servido. O sistema de arquivos precisa suportar movimentação atômica; se não suportar, a tentativa falha sem publicar um arquivo incompleto. A garantia é para reinício de processo; não equivale à durabilidade física de disco após queda de energia.

Arquivos incompletos são removidos nas falhas e no reinício. Falha de limpeza bloqueia a recuperação, ou marca o pedido `PENDENTE_LIMPEZA` para nova limpeza periódica. A limpeza de arquivos vencidos continua periódica. Uma interrupção de encerramento preserva o trabalho para a próxima inicialização. Se o worker demorar para encerrar, o lock é mantido até ele terminar.

## Limites e privacidade

Continuam válidos: uma exportação ativa por empresa, autorização e confirmação de senha de `SUPER_ADMIN` no controlador existente, isolamento de empresa no download, remoção de credenciais no ZIP, limite de 250 MiB e 100 mil registros e reserva global de 300 MiB no armazenamento privado. Mensagens de falha são fixas e não incluem texto de exceções ou conteúdo de documentos.

A migração V34 adiciona apenas o número de tentativas, o instante da próxima tentativa e o índice da fila. Não altera arquivos existentes. Depois de indisponibilidade do banco, pedidos permanecem persistidos. Antes de adquirir o próximo pedido, o worker único recupera também estados `PROCESSANDO` deixados pela sua tentativa anterior quando nem a atualização de falha pôde ser gravada. Após restaurar o banco, o polling retoma sem exigir reinício, mantendo o limite de tentativas. Use sempre o mesmo banco e diretório, sem executar dois escritores.

## Evidências automatizadas

`ExportacaoRecuperavelTest` cobre preservação da fila e exclusão entre escritores. `ExportacaoRecoveryIntegrationTest` usa H2/Flyway e arquivos isolados para recuperação de processamento interrompido, limpeza de arquivos parciais, publicação privada, conflito de pedidos da mesma empresa, repetição limitada, vencimento e isolamento de download. Os testes não simulam homologação de filesystem compartilhado ou armazenamento distribuído.


Verificação em 19/11/2026: oito testes executados, zero falhas/erros/ignorados (dois testes unitários, dois de recuperação com H2 real, duas regressões de autorização/privacidade já existentes, uma de exportação assíncrona existente e o startup HTTP real). Maven offline com Java 21 e saída de build isolada. A execução completa da suíte pertence à integração geral; este resultado não a substitui.
