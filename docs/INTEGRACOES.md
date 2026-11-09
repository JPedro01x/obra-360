# Integrações e ativação

Os conectores estão implementados, mas configuração presente não comprova conexão. Nenhuma conta externa foi criada ou contratada. Sem configuração, a API informa indisponibilidade e não inventa resultados.

Copie `obra360-backend/.env.example` para `.env` na mesma pasta. `npm run dev` carrega os arquivos `.env` da raiz e do backend; variáveis do processo têm precedência. Reinicie a API após configurar. Maven direto e produção exigem variáveis no ambiente. Nunca coloque segredos em `VITE_` ou no Git.

| Recurso | Implementação                                                       | Configuração necessária                                                                           |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| S3      | Upload, download protegido e exclusão pelo SDK AWS                  | `DOCUMENT_STORAGE=s3`, `AWS_REGION`, `S3_BUCKET`, credenciais pelo provedor padrão AWS            |
| Google  | Assinatura, emissor, audiência, validade e nonce; vínculo explícito | Cliente OAuth Web, origem autorizada e `GOOGLE_CLIENT_ID`                                         |
| IA      | OpenAI Responses API, consentimento e limite de uso                 | `AI_ENABLED=true`, `OPENAI_API_KEY`, `AI_MODEL` disponível na conta                               |
| E-mail  | Recuperação SMTP com token de uso único válido por 15 minutos       | `EMAIL_ENABLED=true`, `SMTP_HOST/PORT/USERNAME/PASSWORD`, `EMAIL_FROM`, `APP_PUBLIC_URL`          |
| SEFAZ   | Consulta SOAP de situação/protocolo de NF-e com certificado A1      | `SEFAZ_ENABLED=true`, `SEFAZ_URL`, `SEFAZ_A1_PATH/PASSWORD`, `SEFAZ_EMPRESA_ID`, `SEFAZ_AMBIENTE` |
| IFC     | Leitura e quantitativos declarados, no navegador                    | Arquivo IFC válido; nenhuma conta externa                                                         |
| Portais | Vínculos por empresa, usuário, obra e unidade/fornecedor            | Administrador cadastrar usuário externo e conceder **Acessos externos**                           |

S3 usa credenciais apenas no servidor. Objetos recebem identificadores aleatórios. Arquivos locais anteriores continuam acessíveis. O backup local não inclui objetos remotos; configure retenção e backup do bucket separadamente.

Para Google, entre com senha e vincule a conta Google autenticada com o mesmo e-mail verificado. Depois, use o botão Google para entrar. Não há cadastro automático nem vínculo silencioso por e-mail.

A IA envia somente a pergunta consentida e instruções do assistente, com `store:false`. Não envia automaticamente os cadastros nem altera o banco. Não existe chave/modelo fictício de fallback.

SMTP exige TLS fora do loopback. Configure `SMTP_STARTTLS=true` ou `SMTP_SSL=true` conforme o provedor. A resposta pública não revela se o endereço existe. Tokens são armazenados como hash; redefinir a senha invalida as sessões anteriores. Verifique a entrega real antes de liberar recuperação aos usuários.

SEFAZ exige URL oficial **NFeConsultaProtocolo4** do autorizador correto e A1 PKCS12 da empresa vinculada. Ambiente `2` é homologação e `1` produção. O recurso consulta situação/protocolo: não emite NF-e, não baixa XML e não importa itens/valores. O dígito da chave não comprova autorização fiscal. Comunicação real depende de teste com o certificado.

O leitor IFC aceita até 20 MB e 10 mil elementos em worker. Quantidades ausentes ficam como não informadas. Totais usam propriedades declaradas e unidades reconhecidas, sem estimativas artificiais ou cálculo geométrico completo. O leitor não envia o arquivo a serviços externos.

Clientes precisam de vínculo à unidade; fornecedores/locadores, ao fornecedor cadastrado. Corretores podem reservar unidades disponíveis. Investidores recebem resumo por obra, sem finanças internas. Clientes abrem chamados e fornecedores enviam propostas dentro dos vínculos autorizados. Revogação remove o acesso nas requisições seguintes.

## Verificações

Testes locais verificam HTTP Responses, assinatura Google com JWKS de teste, PUT/GET/DELETE S3 e XML SEFAZ com bloqueio de entidades externas. Não comprovam acesso aos provedores reais. A jornada integrada usa SMTP de captura no loopback, somente com destinatários `@test.invalid`.

`npm run test:postgres` executa 49 cenários e migrações V1–V19 em PostgreSQL temporário isolado, com porta livre escolhida automaticamente. Não transfere nem altera a base operacional H2. Publicação exige validar o ambiente de destino, HTTPS, segredos, backups e os serviços efetivamente ativados.

Referências: [Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [OpenAI](https://developers.openai.com/api/docs/guides/text), [web-ifc](https://github.com/ThatOpen/engine_web-ifc), [SEFAZ SVRS](https://dfe-portal.svrs.rs.gov.br/NFE/Servicos), [AWS SDK](https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3-presign.html).
