# Operação de produção

## Backup

Para a configuração Compose com documentos no volume local, rode `npm run backup:production -- --janela-de-manutencao` em uma janela acordada. Configure `OBRA360_COMPOSE_ENV` com o caminho do arquivo privado de ambiente e `OBRA360_BACKUP_DIR` com um diretório privado fora dos volumes da aplicação. O comando para a aplicação para alinhar a cópia do PostgreSQL com a dos documentos e tenta reiniciá-la ao terminar, inclusive em caso de falha. Confirme o resultado do comando e a prontidão da aplicação antes de encerrar a janela. Mantenha as cópias criptografadas, com controle de acesso e retenção definida, em armazenamento separado do host. Preserve a versão da aplicação e as chaves JWT e MFA em um cofre separado. Restrinja a execução a um operador autorizado.

## Restauração

Use um host isolado, volumes novos, a mesma versão da entrega e a mesma versão principal do PostgreSQL. Confira os tamanhos e os SHA-256 com `npm run backup:production -- --verify "/caminho/do/backup"`. Prepare um arquivo privado de ambiente no host de recuperação e injete as chaves originais a partir do cofre. Os comandos abaixo usam Bash e supõem que a imagem da aplicação já foi construída para o projeto `obra360-restore`.

```bash
compose=(docker compose --project-name obra360-restore --env-file .env.restore -f deploy/compose.production.yml)
"${compose[@]}" up -d --wait db
"${compose[@]}" exec -T db pg_restore -U obra360 -d obra360 --single-transaction --exit-on-error --no-owner --no-acl < postgres.dump
"${compose[@]}" run --rm --no-deps -T --entrypoint tar app -xzf - -C /app/data < documentos.tar.gz
"${compose[@]}" up -d --wait app
```

Confira a prontidão da aplicação, autenticação com MFA, abertura de obras, permissão de um perfil restrito e download de um documento com hash conhecido. Registre a idade da cópia e a duração da recuperação. Só direcione tráfego ao ambiente recuperado após os checks de dados, permissões e HTTPS. Para voltar de uma atualização com migração incompatível, restaure a cópia anterior à mudança em um ambiente separado antes de redirecionar tráfego.

O ensaio local `npm run test:preproduction -- "releases/<id>/bundle"` cria PostgreSQL e TLS descartáveis em loopback. Ele testa o pacote Java e a recuperação por cópia física do cluster parado e dos arquivos. Execute também o procedimento de restauração lógica acima no ambiente de pré-produção para validar `pg_dump`, `pg_restore` e os volumes do Compose.

## Monitoramento e capacidade

Configure o monitor externo para fazer GET em `/actuator/health/readiness` por HTTPS com validação de certificado. Trate HTTP diferente de 200, corpo com `status` diferente de `UP` ou falha de conexão como indisponibilidade. Acompanhe taxa de respostas 5xx, latência, uso de disco e idade da última cópia verificada. Nomeie o responsável, o substituto e o canal de atendimento. Combine com o piloto metas de recuperação e volume simultâneo. Faça o teste de carga com a quantidade de usuários, arquivos e operações esperados para o cliente, incluindo criação, edição e download. O ensaio local registra a latência de um arquivo pequeno em loopback.

O comando `npm run monitorar:producao -- https://seu-dominio` emite JSON com prontidão, código HTTP e latência. Ele retorna código 1 para falha de prontidão e 2 para endereço inválido. No serviço de monitoramento escolhido, agende a checagem e associe esses resultados ao canal de alerta da equipe.

Registre o incidente com horário, versão, impacto e ações. Preserve os logs necessários para diagnóstico, com acesso restrito e sem dados de login, tokens ou segredos.
