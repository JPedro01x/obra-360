# Integrações e ativação

Os conectores estão implementados, mas configuração presente não comprova conexão. Nenhuma conta externa foi criada ou contratada. Sem configuração, a API informa indisponibilidade e não inventa resultados.

Copie `obra360-backend/.env.example` para `.env` na mesma pasta. `npm run dev` carrega os arquivos `.env` da raiz e do backend; variáveis do processo têm precedência. Reinicie a API após configurar. Maven direto e produção exigem variáveis no ambiente. Nunca coloque segredos em `VITE_` ou no Git.

| Recurso | Implementação                                                       | Configuração necessária                                                                           |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Google  | Assinatura, emissor, audiência, validade e nonce; vínculo explícito | Cliente OAuth Web, origem autorizada e `GOOGLE_CLIENT_ID`                                         |
| IA      | OpenAI Responses API, consentimento e limite de uso                 | `AI_ENABLED=true`, `OPENAI_API_KEY`, `AI_MODEL` disponível na conta                               |
| E-mail  | Recuperação SMTP com token de uso único válido por 15 minutos       | `EMAIL_ENABLED=true`, `SMTP_HOST/PORT/USERNAME/PASSWORD`, `EMAIL_FROM`, `APP_PUBLIC_URL`          |
| SEFAZ   | Consulta SOAP de situação/protocolo de NF-e com certificado A1      | `SEFAZ_ENABLED=true`, `SEFAZ_URL`, `SEFAZ_A1_PATH/PASSWORD`, `SEFAZ_EMPRESA_ID`, `SEFAZ_AMBIENTE` |
| IFC     | Leitura e quantitativos declarados, no navegador                    | Arquivo IFC válido; nenhuma conta externa                                                         |
| Portais | Vínculos por empresa, usuário, obra e unidade/fornecedor            | Conta externa ativa e vínculo em **Acessos externos** concedido pelo administrador da empresa       |

Os documentos são armazenados exclusivamente no disco do servidor, no diretório `OBRA360_STORAGE_DIRECTORY` (padrão `data/documentos`). Não há integração com armazenamento em nuvem. Inclua esse diretório nos backups.

Para Google, entre com senha e vincule a conta Google autenticada com o mesmo e-mail verificado. Depois, use o botão Google para entrar. Não há cadastro automático nem vínculo silencioso por e-mail.

A IA envia somente a pergunta consentida e instruções do assistente, com `store:false`. Não envia automaticamente os cadastros nem altera o banco. Não existe chave/modelo fictício de fallback.

Cada tentativa, resposta e falha de consulta de IA e SEFAZ gera evento em `log_auditoria`, associado ao usuário e à empresa da sessão. O conteúdo da pergunta e a chave da NF-e não são gravados nesse log. Os timeouts limitam a espera (35 s para IA e 25 s para SEFAZ); falha externa retorna indisponibilidade e não é substituída por resposta local simulada.

As chamadas de IA e SEFAZ exigem `X-Idempotency-Key` com UUID. A interface gera uma chave por envio explícito; integrações de terceiros devem reutilizar a mesma chave ao repetir a mesma solicitação. O servidor grava no SQL somente hashes da chave e da solicitação, o estado e usuário/empresa por até 30 dias. Uma restrição única por empresa/usuário/operação/chave evita chamadas duplicadas concorrentes; a repetição retorna HTTP 409 e não chama o provedor novamente. A nova tabela é mapeada para o `ddl-auto:update` local e também incluída na migração V38 do PostgreSQL.

SMTP exige TLS fora do loopback. Configure `SMTP_STARTTLS=true` ou `SMTP_SSL=true` conforme o provedor. A resposta pública não revela se o endereço existe. Tokens são armazenados como hash; redefinir a senha invalida as sessões anteriores. Verifique a entrega real antes de liberar recuperação aos usuários.

SEFAZ exige URL oficial **NFeConsultaProtocolo4** do autorizador correto e A1 PKCS12 da empresa vinculada. Ambiente `2` é homologação e `1` produção. O recurso consulta situação/protocolo: não emite NF-e, não baixa XML e não importa itens/valores. O dígito da chave não comprova autorização fiscal. Comunicação real depende de teste com o certificado.

A senha do A1 é removida do buffer mutável após carregar o certificado e inicializar o contexto TLS. O serviço não registra a chave consultada nem o conteúdo da requisição SOAP.

O leitor IFC aceita até 20 MB e 10 mil elementos em worker. Quantidades ausentes ficam como não informadas. Totais usam propriedades declaradas e unidades reconhecidas, sem estimativas artificiais ou cálculo geométrico completo. O leitor não envia o arquivo a serviços externos.

## Cadastro local de NF-e

O módulo **Notas fiscais** do Workspace recebe dados informados pelo funcionário: chave de acesso, número, data, fornecedor interno e itens associados ao almoxarifado. O servidor valida o dígito verificador, exige fornecedor e materiais da empresa autenticada, confere a soma das linhas e persiste cabeçalho, itens e eventos. A chave é única por empresa. A nota permanece `PENDENTE_CONFERENCIA`; perfis autorizados podem registrar a entrada, que altera saldos e movimentações na mesma transação, ou cancelar a pendência com justificativa. Uma entrada já registrada não pode ser cancelada nesse fluxo; precisa de um estorno separado. Tentativas repetidas são recusadas e o histórico permanece.

Esse fluxo é um lançamento operacional manual: **não importa XML, não consulta/autentica a nota na SEFAZ e não transmite compra a fornecedor**. O usuário deve conferir o documento recebido antes de registrar a entrada. `ENTRADA_REGISTRADA` descreve somente o estoque local. A consulta oficial de protocolo continua na seção Integrações e requer certificado A1 e homologação do ambiente. Em PostgreSQL, as tabelas e a ligação das movimentações estão na migration V39; em H2 local, as entidades são criadas pelo schema update. Nenhum dos dois esquemas foi executado/verificado neste ambiente nesta revisão.

## Evidências das medições

O módulo de medições permite anexar PDF, PNG ou JPEG de até 20 MB, limitado a 20 arquivos por medição. O servidor confere assinatura do conteúdo, MIME e extensão correspondente, grava no armazenamento privado, mantém os metadados e o SHA-256 no SQL e restringe consulta/download à empresa da medição. O download verifica o hash antes de devolver o arquivo como anexo, sem permitir que o conteúdo seja interpretado como página ativa. A migration PostgreSQL V40 cria os metadados; sua aplicação e o aceite de upload/download no ambiente continuam pendentes. Anexos não podem ser apagados ou substituídos neste fluxo.

## Portal de relacionamento

O administrador (`SUPER_ADMIN`) convida o proprietário com o perfil `CLIENTE` e concede um vínculo por unidade após o aceite. O envio do link de convite é manual, mesmo com SMTP configurado para recuperação de senha. Consulte o [passo a passo de acesso do proprietário](OPERACAO.md#acesso-do-proprietário-à-unidade).

A API `/api/v1/portal` entrega ao proprietário o resumo das obras vinculadas, os dados das unidades vinculadas e seus próprios chamados nessas unidades. A lista e a abertura de plantas exigem perfil `CLIENTE` e vínculo com a unidade na obra da própria empresa. A API retorna somente as revisões publicadas para aquela unidade em modelos não arquivados. Documentos internos da obra, referências originais e revisões privadas ficam fora do portal. O servidor confere o vínculo a cada requisição, inclusive quando a URL usa diretamente o identificador da unidade ou do modelo.

A revogação em **Acessos externos** retira a unidade das próximas respostas do portal e bloqueia novas consultas de plantas e novos chamados para a unidade. O login permanece disponível enquanto a conta estiver ativa.

Fornecedores e locadores precisam de vínculo ao fornecedor cadastrado para enviar propostas. No portal, cada fornecedor vê requisições abertas somente nas obras vinculadas e pode enviar uma proposta ligada à requisição; o sistema persiste o valor e o prazo no SQL, impede proposta repetida do mesmo fornecedor e a equipe pode comparar/selecionar a cotação no fluxo de compras. Essa operação é interna ao Obra360: **não envia o pedido a um ERP/loja externo nem confirma compra com um vendedor**. Para isso, ainda são necessários o sistema de destino, contrato da API, credenciais, sandbox, aprovação do responsável e um conector homologado. Corretores podem reservar unidades disponíveis nas obras vinculadas. Investidores recebem resumo por obra, sem finanças internas.

## Verificações

Testes locais verificam HTTP Responses, assinatura Google com JWKS de teste, gravação/leitura/exclusão local e XML SEFAZ com bloqueio de entidades externas. Não comprovam acesso aos provedores reais. A jornada integrada usa SMTP de captura no loopback, somente com destinatários `@test.invalid`.

`npm run test:postgres` executa os cenários operacionais e as migrações disponíveis em PostgreSQL temporário isolado, com porta livre escolhida automaticamente. Não transfere nem altera a base operacional H2. Publicação exige validar o ambiente de destino, HTTPS, segredos, backups e os serviços efetivamente ativados.

Referências: [Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [OpenAI](https://developers.openai.com/api/docs/guides/text), [web-ifc](https://github.com/ThatOpen/engine_web-ifc), [SEFAZ SVRS](https://dfe-portal.svrs.rs.gov.br/NFE/Servicos).
