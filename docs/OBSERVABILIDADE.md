# Observabilidade e operação de logs

Esta página descreve as trilhas existentes no perfil de produção e como tratá-las no piloto. Elas têm fontes e finalidades diferentes; nenhuma delas, isoladamente, prova tudo o que ocorreu.

## Trilhas existentes

| Fonte | O que mostra hoje | Limites e cuidado |
| --- | --- | --- |
| Auditoria SQL (`log_auditoria`) | Ações que alguns fluxos gravam na mesma transação da operação: por exemplo, cadastro/acesso, ações de RH, documentos, publicação de planta, operações financeiras e provisionamento. A entidade tem campos para empresa, usuário, ação, tipo/ID do objeto, detalhes JSON, IP e data/hora. | É cobertura seletiva. Campos como detalhes e IP podem estar vazios; leituras, falhas e mudanças sem chamada explícita de auditoria não aparecem necessariamente. O rollback da transação pode remover a ação junto com a alteração. Usuários com poder administrativo no PostgreSQL podem modificar ou apagar linhas; não é uma trilha imutável. |
| Aplicação (`app`) | Spring Boot envia sua saída de runtime para o console, capturado pelo mecanismo de logs do Docker. O filtro da aplicação emite uma linha para cada caminho `/api/` com `requestId`, método, URI, status e duração em ms; a resposta inclui `X-Request-ID`. Isso ajuda a correlacionar a resposta com o log. | A linha não contém query string, cabeçalhos ou corpo e não é auditoria completa de ações de negócio. `spring.jpa.show-sql` está desligado, mas isso não garante que toda mensagem de exceção seja livre de dados sensíveis. Trate a saída como restrita. |
| Proxy Caddy (`proxy`) | O Caddy termina TLS e encaminha tráfego para `app`. Os pedidos da API são registrados pelo filtro da aplicação. | O `Caddyfile` atual não declara `log`; portanto, logs de acesso HTTP do proxy não estão habilitados pela configuração do projeto. Não há uma trilha do proxy com estado/status/latência; a linha da aplicação não registra rotas que não começam com `/api/`. |
| PostgreSQL (`db`) | Saída do servidor capturada pelo Docker, como início do serviço e avisos/erros que o servidor emitir. | O Compose não define política própria de retenção, envio externo nem `log_statement`/duração SQL. As opções efetivas dependem do servidor e do ambiente; consulte-as na instância antes de concluir que comandos ou valores não foram registrados. Log SQL não substitui `log_auditoria`. |
| Saúde | `GET /actuator/health/readiness` verifica estado de prontidão e banco. O healthcheck do Compose usa a rota internamente. `npm run monitorar:producao -- https://dominio` registra um resultado JSON com HTTP, prontidão e latência. | É um sinal de disponibilidade do momento, não um histórico de negócio, métrica detalhada, alerta automático ou diagnóstico completo. O comando não agenda verificações nem envia alertas. |

Não há hoje um coletor externo, política de retenção central, painel de métricas ou entrega automática de alertas configurados pelo projeto. O daemon Docker e o host influenciam como e por quanto tempo a saída dos contêineres fica disponível. Confirme a configuração real do host, limites de disco e procedimento de exportação antes do piloto.

O pacote local `npm run piloto:validar` registra também uma fotografia pontual do estado e da saúde dos serviços Compose quando o arquivo privado de produção está configurado. Essa evidência não é monitoramento contínuo, não retém histórico por si só e não substitui o monitor HTTPS nem o plano de alertas da equipe.

## Consulta operacional

Com acesso restrito ao host e usando o mesmo arquivo privado Compose da instalação, consulte uma janela curta de logs:

```sh
docker compose --env-file .env.production -f deploy/compose.production.yml logs --since=1h --timestamps app db proxy
```

Não copie a saída bruta para chamados, mensagens ou documentos compartilhados. Ao coletar evidência, anote intervalo UTC, versão da aplicação, serviços consultados e operador; remova ou masque qualquer credencial, identificador pessoal desnecessário, conteúdo de requisição e dado de cliente antes de compartilhar. O acesso ao host Docker equivale a acesso privilegiado aos contêineres e aos dados que eles processam.

Para verificar o endpoint de saúde, use o comando documentado no runbook:

```sh
npm run monitorar:producao -- https://seu-dominio
```

O comando retorna código 1 para falha de prontidão e 2 para URL inválida. A organização deve escolher e configurar por conta própria a agenda, o destino de alertas, os responsáveis e o canal de atendimento; a execução isolada apenas imprime JSON no terminal.

## SQL e trilha de negócio

`log_auditoria` fica no banco da aplicação, tem índices por empresa e data e recebe ações explícitas dos fluxos. É diferente dos logs textuais do PostgreSQL e do console da aplicação. Como o código não audita toda leitura, requisição ou falha, use a tabela para as ações que ela efetivamente registra, não para reconstruir toda a atividade. Antes de investigar, limite a consulta à empresa, ao intervalo e às colunas necessárias; evite exportações amplas com dados de RH ou clientes.

O Hibernate está configurado com `show-sql: false`. O Compose não habilita registro de cada comando SQL. Mudanças de configuração SQL para diagnóstico devem ser temporárias, aprovadas pelo operador, limitadas no tempo e avaliadas quanto à exposição de parâmetros e ao custo de armazenamento. Nunca habilite log geral de requisições ou SQL em produção sem testar a redação de valores.

## Acesso, retenção e redação

- Restrinja leitura de logs, consultas de auditoria, backups e exportações aos operadores que precisam investigar incidentes. Proteja o acesso ao Docker e ao PostgreSQL e mantenha contas individuais para administração do host.
- Defina antes do piloto um prazo de retenção por trilha, responsável por coleta e descarte, capacidade de disco e local externo criptografado quando for necessário preservar evidência. O repositório não implementa expurgo automático de `log_auditoria` nem define a retenção dos logs do daemon Docker.
- Preserve logs e backup com controle de acesso e, quando exportados, criptografia em trânsito e repouso. Registre acesso e descarte conforme a política operacional da empresa. Não deixe cópias em diretórios temporários ou compartilhados sem proteção.
- Senhas, hashes de senha, JWTs, cookies de sessão, tokens de convite e de recuperação, segredos de integração e conteúdo de arquivos não devem ser coletados em logs ou evidências. Nunca registre corpo bruto de requisição, bytes de anexos nem respostas sensíveis de provedores.
- Antes de compartilhar saída, revise URLs e parâmetros, cabeçalhos, stack traces, SQL e valores, endereços de e-mail, IPs, nomes e conteúdo de RH. Remova ou mascare o que não for essencial. A configuração atual não garante redação automática em todas as fontes.
- Se houver suspeita de exposição, restrinja os logs originais, preserve a cópia necessária para a investigação, registre quem teve acesso e siga o procedimento interno de incidente. Não altere a evidência original para produzir uma versão de compartilhamento; gere uma cópia redigida.

Não declare que a aplicação tem auditoria inviolável, cobertura total ou certificação independente com base nessas trilhas. Para essas propriedades, é necessário desenho e validação específicos fora do escopo atual.
