# Mensageria operacional — ordens de serviço

## Fluxo implementado

1. A criação de uma OS pelo `OperacaoService` grava a OS e um evento em `evento_mensagem`, na mesma transação.
2. Um publicador consulta os eventos pendentes e envia seu identificador ao tópico `obra360-ordens-notificacoes-v1`.
3. O envio só é marcado como publicado após confirmação do Kafka.
4. O consumidor lê o evento persistido, confere a empresa do destinatário e cria uma notificação para o encarregado da equipe.
5. A notificação e o comprovante de processamento são confirmados na mesma transação. Reentregas não duplicam o efeito.

O conteúdo enviado ao Kafka é somente o UUID do evento. Senhas, documentos, dados pessoais e a descrição da OS não são enviados. O contexto da empresa é recuperado da outbox, sem depender de `TenantContext` da requisição HTTP.

Se o broker estiver indisponível, a criação da OS continua. O evento permanece no banco e é reenviado com intervalo progressivo, até 5 minutos entre tentativas. Publicações sem recibo de processamento são reenviadas após `MESSAGING_RECEIPT_TIMEOUT_MS` (padrão 300000; entre 10000 e 86400000 ms), inclusive após recuperação do broker ou restauração do banco. O recibo relacional impede notificações duplicadas. Eventos em quarentena não são reenviados automaticamente. Destinatários inativos ou de outra empresa não recebem a notificação.

Uma falha do consumidor recebe três novas tentativas, com intervalo de dois segundos, antes de ser registrada em `falha_mensageria`. A recuperação só confirma o consumo depois do commit dessa quarentena; falha no banco mantém a reentrega. Os parâmetros `MESSAGING_RETRY_ATTEMPTS` (0–10) e `MESSAGING_RETRY_DELAY_MS` (10–60000) são limitados na inicialização. A quarentena guarda hash, localização no tópico e classe do erro, sem mensagem bruta ou texto da exceção. A empresa é obtida exclusivamente do evento original persistido. Registros inválidos sem evento original ficam sem empresa e exigem análise do operador no banco; não são expostos a usuários de empresas.

## Uso local sem Docker (Java 21 e Maven)

O comando `npm run dev` inicia o broker local automaticamente quando `MESSAGING_ENABLED=true`, `KAFKA_BOOTSTRAP_SERVERS` está ausente ou definido como `127.0.0.1:9092`, e não há um serviço escutando nesse endereço. Um broker configurado em outro endereço é administrado separadamente. Para iniciar somente o broker, em um terminal separado:

```powershell
npm run kafka:local
```

Esse comando inicia um servidor Apache Kafka real com dados em `obra360-backend/data/kafka`. O primeiro início resolve as dependências via Maven. É um recurso de desenvolvimento/operação local; não é um cluster de alta disponibilidade. As portas 9092 e 9093 ficam restritas ao loopback. Não apague essa pasta para reiniciar o broker.

No arquivo local `obra360-backend/.env`, configure, sem duplicar chaves existentes:

```dotenv
MESSAGING_ENABLED=true
KAFKA_BOOTSTRAP_SERVERS=127.0.0.1:9092
```

Inicie/reinicie a aplicação:

```powershell
npm run dev
```

A integração está desabilitada por padrão para preservar instalações que ainda não possuem broker. Eventos de OS são persistidos mesmo nesse caso, e são publicados após habilitar a integração. Iniciar apenas o broker não altera a configuração de um backend que já está em execução.

## Alternativa com Docker

```powershell
docker compose -f deploy/compose.messaging.yml up -d
```

Use a mesma configuração `MESSAGING_ENABLED=true` e endereço acima. Não execute os dois brokers simultaneamente. O volume Docker preserva os dados do Kafka. A configuração é de um nó local; ambientes distribuídos exigem configuração própria de autenticação, TLS e replicação.

## Verificação

Crie uma OS com equipe e contrato da mesma obra e com contrato vigente. Entre como encarregado dessa equipe e consulte as notificações.

Administradores, gerentes de obra e auditores podem consultar `GET /api/v1/workspace/mensageria`. A resposta informa se a integração está habilitada e os totais da própria empresa: pendentes de publicação, aguardando processamento e processados. `habilitada` é configuração, não comprovação de conectividade. As notificações já processadas ficam persistidas.

O painel em Integrações também mostra falhas e eventos sem processamento há mais de cinco minutos (`requerAtencao`). A lista paginada está em `GET /api/v1/workspace/mensageria/falhas?page=0&size=25`. Administrador e gerente podem reprocessar uma falha pelo painel ou `POST /api/v1/workspace/mensageria/falhas/{id}/reprocessar`; auditor possui somente leitura. A operação é idempotente e auditada. Corrija a causa antes de repetir. Indicadores e logs precisam ser acompanhados pelo responsável; não há envio automático de alerta a um serviço externo.

## Instalação local com Compose de produção

Use os dois arquivos juntos em todas as operações da mesma instalação:

```powershell
docker compose --env-file deploy/production.env -f deploy/compose.production.yml -f deploy/compose.production.messaging.yml up -d --build
```

O overlay habilita a aplicação e um Kafka de nó único com volume persistido na rede privada, sem publicar portas do broker no host. Defina `SHARED_USAGE_LIMITS_SECRET` com um segredo aleatório próprio, diferente de `JWT_SECRET`, no arquivo privado de ambiente. O template `deploy/production.example.env` lista as configurações. Para backup com esse overlay, defina `OBRA360_COMPOSE_MESSAGING=true` além das variáveis habituais do script de backup. Essa configuração atende a um host; não constitui cluster de alta disponibilidade. O CI possui ensaios separados com e sem mensageria.

## Retenção sob comando do operador

Execute a aplicação com perfil `prod,operador`, modo não web e `OP_ACTION=limpar-mensageria`, `OP_COMPANY_ID` da empresa e `OP_RETENTION_DAYS=90` (30–3650). O padrão é simulação; apenas `OP_APPLY=true` confirma a exclusão. Cada execução limita a mil falhas resolvidas antigas e mil eventos processados antigos. Pendências, falhas não resolvidas, registros recentes e outras empresas são preservados. O resultado é auditado. Faça backup consistente antes de aplicar e repita em lotes conforme o inventário. Falhas sem empresa não entram nessa limpeza por empresa.

O teste abaixo inicia um broker Kafka real e uma base isolada, sem usar dados da empresa:

```powershell
cd obra360-backend
mvn -Dtest=MensageriaKafkaIntegrationTest test
```

São verificados envio/consumo com notificação persistida, rollback, reprocessamento sem duplicação, recuperação após falha de publicação e isolamento do destinatário. Não são utilizados mocks do broker no cenário de ponta a ponta; uma falha de publicação é simulada especificamente para verificar a recuperação.

## Limites

- O fluxo novo atende à notificação de criação de OS. Não significa que chat, auditoria e todos os demais módulos utilizem Kafka.
- A auditoria permanece relacional; esta implementação não adiciona NoSQL.
- Os registros da outbox também preservam o comprovante de consumo. A limpeza é explícita e deve ser acompanhada pelo operador.
- O tópico e o grupo de consumo são versionados. Não exclua tópicos nem reinicie offsets sem avaliar os eventos ainda pendentes.
- As migrações correspondentes são V30 (outbox) e V31 (quarentena).

Referências: [Spring Kafka — testes com broker](https://docs.spring.io/spring-kafka/reference/testing.html) e [Apache Kafka — imagem oficial](https://kafka.apache.org/41/getting-started/docker/).
