# Obra360 — textos para corrigir a documentação

Base da revisão: código local no commit 639d4fc, analisado em 11/11/2026. Este arquivo complementa CORRECOES-DOCUMENTACAO.md com redações utilizáveis nos documentos.

## Como utilizar

Os parágrafos de descrição da versão podem substituir afirmações incompatíveis com o software. Na ERS, preserve os requisitos obrigatórios e acrescente o campo **Situação na versão analisada**, usando os textos abaixo. Reduzir um requisito obrigatório para acomodar o código exige aprovação do responsável pelo escopo. As prioridades originais não foram reavaliadas.

As descrições não constituem novo teste de execução nem aceite de produção. Figuras e referências bibliográficas precisam de conferência nos arquivos/fontes originais.

## 1. DDE: introdução e visão do produto

O Obra360 é uma plataforma web voltada à centralização de informações e processos de empresas do setor da construção. A versão analisada reúne autenticação, controle de acesso por perfil, isolamento de dados por empresa, gestão de obras, contratos, equipes, ordens de serviço, materiais, documentos, ocorrências, unidades imobiliárias, chamados de garantia, recursos humanos e modelagem 2D/3D. Os módulos possuem diferentes níveis de abrangência, descritos na matriz de atendimento dos requisitos.

A visão do produto contempla ampliar a integração entre engenharia, suprimentos, relacionamento e administração. Os recursos planejados não são apresentados como funcionalidades já entregues. Compras completas, medições físico-financeiras, gestão de máquinas, chat operacional e automações específicas permanecem sujeitos à implementação e validação dos respectivos critérios de aceite.

### Escopo da versão

A versão oferece operações persistidas por meio da API, respeitando as permissões do usuário e sua empresa. A disponibilidade de integrações externas depende de configuração, credenciais, certificados e serviços compatíveis. O modo demonstrativo deve ser identificado separadamente da operação conectada ao backend.

### Dados utilizados

Os registros apresentados na operação conectada são obtidos do banco de dados. Persistência significa que os registros são armazenados e recuperados pela aplicação; não comprova que correspondam a uma empresa, pessoa ou transação externa real. Registros criados para demonstração ou teste devem ter sua origem identificada. A utilização de dados de uma empresa depende de fornecimento, autorização e conferência desses dados.

### Limitações e exclusões

A consulta fiscal implementada não realiza o ciclo completo de importação de itens, conciliação de compras e entrada automática em estoque. O RH possui controles administrativos e folha com lançamentos manuais, sem processamento completo das obrigações trabalhistas. O uso de PDF ou imagem no modelador ocorre como referência para calibração e traçado. A aplicação não oferece sincronização offline geral dos módulos operacionais.

A exclusão de assinatura digital de documentos não impede o uso de certificado A1 na comunicação fiscal. Integrações de pagamento permanecem fora do escopo quando assim definido no documento aprovado.

### Critérios de aceite

O aceite deverá considerar uma matriz por requisito com situação, evidência, ambiente, versão e pendência. Funcionalidades parcialmente implementadas não serão classificadas como integralmente atendidas. Requisitos de disponibilidade, desempenho, acessibilidade, segurança e operação com provedores externos exigem validação específica.

## 2. ERS: correções dos requisitos funcionais

Para cada requisito, acrescente o campo de situação abaixo. Os textos de descrição sugeridos delimitam a versão existente; não substituem automaticamente obrigações mais amplas do escopo aprovado.

| ID | Texto para inserir em “Situação na versão analisada” |
| --- | --- |
| RF-01 | O mecanismo principal de autenticação está implementado com e-mail/senha, JWT assinado e sessões revogáveis no banco. A recuperação por e-mail depende do SMTP configurado. Google e MFA possuem fluxos específicos. |
| RF-02 | O acesso é controlado por perfis e permissões no backend. Requisições sem autenticação podem retornar 401; operações não autorizadas, 403; recursos de outra empresa podem retornar 404 para evitar exposição de sua existência. |
| RF-03 | O isolamento é aplicado a partir da empresa do usuário autenticado, por filtros diretos ou relacionamentos das entidades. A empresa informada pelo navegador não substitui a autorização no servidor. |
| RF-04 | Há instalação e provisionamento de empresas. O CRUD completo de organizações com edição e inativação na interface operacional permanece parcial. |
| RF-05 | Há cadastro, consulta, listagem e edição de obras. Categorias, localização e inativação previstas no requisito original não estão integralmente disponíveis no contrato operacional. |
| RF-06 | Há cadastro de unidades e estados DISPONIVEL, RESERVADO e VENDIDO. Estados adicionais e o ciclo completo de entrega e garantia não são demonstrados por esse fluxo. |
| RF-07 | Há contratos associados à obra e ao fornecedor, com valores, vigência e SLA informado. Catálogo de serviços, vínculo contratual à unidade e alertas automáticos de vencimento permanecem pendentes. |
| RF-08 | Existem fluxos distintos para OS, garantia e atendimento da conta. A integração completa entre solicitação, contrato, unidade, severidade e equipe permanece parcial. |
| RF-09 | Há etapas e atualização manual de progresso. O diário fotográfico por etapa e sua publicação ao proprietário não estão completos. |
| RF-10 | Há criação, execução e encerramento de OS, associação de equipe e consumo de materiais. Apontamento de horas e atribuição individual por profissional permanecem parciais. |
| RF-11 | O RH permite cadastrar funcionários, cargos e alocações em obra/equipe. A programação individual por OS e a detecção de conflitos de horário permanecem pendentes. |
| RF-12 | Há materiais, saldos, estoque mínimo e movimentações, incluindo consumo por OS. Transferências entre almoxarifados, gestão de equipamentos e cálculo automático por metro quadrado permanecem pendentes no fluxo operacional. |
| RF-13 | Há consulta de situação/protocolo de NF-e mediante chave e certificado A1 configurado. Importação de itens, conciliação com pedidos e entrada automática no estoque permanecem pendentes. |
| RF-14 | Há fornecedores, cotações e propostas pelo portal. Requisição, comparação completa, aprovações, pedido e recebimento integrado permanecem parciais ou pendentes. |
| RF-15 | Há ocorrências com norma informada, severidade, responsável e estado. Evidências fotográficas obrigatórias, laudos e notificações automáticas não estão integralmente implementados. |
| RF-16 | Há abertura e acompanhamento de chamados de garantia. Classificação automática de cobertura, agenda de vistoria e conversão em OS permanecem pendentes. |
| RF-17 | Há armazenamento, download protegido, hash e versionamento de documentos. Upload, leitura IFC e autoria 2D/3D são capacidades distintas. Armazenar DWG não representa editar ou interpretar nativamente esse formato. |
| RF-18 | Há custo unitário de material e custo dos consumos. Despesas indiretas, centros de custo, orçamento e análise completa de desvios permanecem pendentes. |
| RF-19 | Há resumos e indicadores operacionais. Curva S físico-financeira baseada em planejamento e medições e atualização em tempo real não estão comprovadas no fluxo operacional. |
| RF-20 | O chat corporativo contextualizado por obra e OS permanece pendente no fluxo operacional. Estruturas de dados e telas demonstrativas não comprovam seu funcionamento completo. |
| RF-21 | O portal restringe os recursos aos vínculos do usuário e apresenta unidades, chamados e plantas publicadas. Diário fotográfico e compartilhamento geral de documentos permanecem parciais. |
| RF-22 | A gestão operacional de máquinas, horímetros, alocações e manutenção preventiva permanece pendente. |
| RF-23 | Há registro relacional de auditoria e ausência de API comum para editar/excluir seus eventos. O histórico genérico de valores anteriores e posteriores de toda alteração permanece parcial. |
| RF-24 | Há avisos, contadores e indicadores na interface. A entrega automática de notificações aos responsáveis, com canal e histórico, permanece parcial. |
| RF-25 | O fluxo completo de medição, aprovação, atualização física vinculada e liberação de faturamento permanece pendente. O percentual manual de uma etapa não equivale a medição aprovada. |

### Substituição do título e critério de RF-01

**[RF-01] Cadastro e autenticação com JWT e sessões revogáveis.** O sistema deve permitir autenticação por e-mail e senha e proteger os recursos por token JWT assinado. Deve permitir revogar sessões e recuperar a senha por fluxo de e-mail quando o serviço estiver configurado.

**Critério de aceite:** credenciais válidas geram acesso autenticado; credenciais inválidas são rejeitadas; tokens expirados, inválidos ou associados a sessões revogadas não autorizam operações protegidas. A recuperação deve usar token válido e temporário e não expor a senha anterior.

## 3. ERS: textos dos requisitos não funcionais

| ID | Redação sugerida |
| --- | --- |
| RNF-01 | O sistema tem como meta responder às operações selecionadas em até dois segundos, segundo percentil, carga, volume e ambiente definidos no plano de desempenho. O atendimento será declarado após execução e registro desse plano. |
| RNF-02 | A autenticação deve usar JWT assinado como Bearer, sem sessão HTTP tradicional. O servidor mantém sessões revogáveis e consulta dados de autorização no banco. A assinatura do token não significa criptografia de seu conteúdo. |
| RNF-03 | A disponibilidade de 99,9% é uma meta de operação, cuja janela de medição, exclusões e responsabilidades devem ser definidas. Testes locais não comprovam seu atendimento. |
| RNF-04 | As senhas devem ser protegidas com BCrypt e não retornadas pela API. O ambiente de produção deve usar HTTPS. Versões TLS e controles de segurança deverão ser verificados no ambiente publicado; não se declara cobertura integral da OWASP sem avaliação específica. |
| RNF-05 | A escalabilidade horizontal e o processamento assíncrono deverão ser demonstrados por testes de múltiplas instâncias e por um fluxo integrado de publicação e consumo de eventos. A presença da dependência Kafka não comprova esse atendimento. |
| RNF-06 | A interface deve ser avaliada segundo os critérios de acessibilidade adotados, com testes automatizados e manuais, incluindo teclado, foco, contraste e leitor de tela. O nível de conformidade será declarado somente para o escopo efetivamente avaliado. |
| RNF-07 | A interface deve adaptar-se às resoluções e navegadores definidos na matriz de compatibilidade. Os resultados devem identificar páginas, dispositivos, cenários por toque e limitações de recursos como WebGL e impressão. |
| RNF-08 | O sistema deve aplicar controle de acesso, isolamento e procedimentos para solicitações de privacidade. Exportação, retenção, anonimização e exclusão devem ter regras documentadas. Os controles existentes não equivalem, isoladamente, a uma certificação de conformidade legal. |
| RNF-09 | A implementação atual está organizada em entidades, repositórios, serviços e infraestrutura web, com uso de JPA e EntityManager. A independência estrita do domínio e a arquitetura hexagonal permanecem sujeitas à refatoração, quando exigidas pelo escopo. |
| RNF-10 | A auditoria atual utiliza persistência relacional. O armazenamento NoSQL permanece pendente caso seja requisito obrigatório da entrega. |
| RNF-11 | O sistema possui verificações de saúde. Circuit Breaker aplicado às integrações permanece pendente; timeout, tratamento de erro e health check não equivalem a esse mecanismo. |
| RNF-12 | A validação deve registrar comandos, ambiente, versão, resultados e testes ignorados. Testes unitários, integração, PostgreSQL, interface e restauração são evidências distintas. Aprovação da suíte não representa, por si só, cobertura integral de código. |
| RNF-13 | A evolução do banco PostgreSQL é controlada por migrações Flyway, atualmente V1 a V23 na versão analisada. No perfil local, Flyway está desabilitado e o Hibernate atualiza o schema. |
| RNF-14 | O backend utiliza Java 21 e Spring Boot. A interface e a documentação devem usar português do Brasil. Identificadores técnicos e mensagens de bibliotecas podem utilizar inglês, caso essa delimitação seja aprovada no escopo acadêmico. |

## 4. ERS: textos para as regras de negócio

Use os textos como descrição da implementação e de suas pendências, preservando a obrigação original quando aplicável.

| ID | Texto a inserir |
| --- | --- |
| RN-01 | A validação do formato e do dígito da chave é distinta da consulta fiscal. Uma chave válida não comprova autorização da NF-e nem fornece seus itens. A movimentação manual atual não exige vínculo fiscal. |
| RN-02 | O indicador atual considera estoque baixo quando o saldo é menor que o mínimo cadastrado. O critério menor ou igual e a sugestão automática de compra permanecem pendentes de ajuste, caso mantidos como obrigação. |
| RN-03 | O backend deve impedir movimentações que produzam saldo negativo, inclusive sob concorrência, e tratar a repetição de uma mesma operação de forma idempotente. |
| RN-04 | As operações devem respeitar a empresa do usuário autenticado, diretamente ou por relacionamentos validados. Não é obrigatório que toda tabela tenha uma coluna denominada tenant_id. |
| RN-05 | A exigência de fotos para ocorrências de severidade alta ou crítica permanece pendente. O cadastro atual não impõe anexação obrigatória. |
| RN-06 | Os eventos de auditoria não possuem operação comum de alteração ou exclusão na API. Proteção contra alterações por administradores do banco requer controles adicionais e não deve ser descrita como inviolabilidade absoluta. |
| RN-07 | A exigência de justificativa e aprovação para encerramento tardio permanece pendente. O fluxo atual permite transição de estado sem essa autorização adicional. |
| RN-08 | A criação de OS valida vínculos de empresa e obra. O bloqueio por contrato vencido ou inativo permanece pendente de implementação. |
| RN-09 | O limite de duas OS simultâneas por profissional permanece pendente de vínculo individual, intervalos e verificação de sobreposição. |
| RN-10 | A obrigatoriedade de materiais por tipo de OS permanece pendente. O fluxo atual pode encerrar uma ordem sem consumo registrado. |
| RN-11 | O endereço de e-mail é único globalmente na base atual. O uso do mesmo e-mail em empresas diferentes exige revisão de identificação, autenticação e restrições do banco. |
| RN-12 | A reserva pelo portal depende da disponibilidade da unidade. A versão utiliza DISPONIVEL, RESERVADO e VENDIDO. Regras de entrega, venda completa e restrições adicionais às mudanças administrativas permanecem pendentes de definição e implementação. |
| RN-13 | Os chamados registram categoria e estado. A determinação automática de cobertura por prazo e tipo permanece pendente. |
| RN-14 | A aprovação de compras por dois responsáveis distintos permanece pendente de estados, alçadas, validações e trilha de aprovação. |
| RN-15 | O progresso da etapa é informado pelo usuário autorizado. Sua atualização automática por medição aprovada permanece pendente. |
| RN-16 | O JWT identifica o usuário e contém informações de sessão e versão da credencial. Empresa e perfil são consultados na base para autorização, sem depender de dados arbitrários enviados pelo cliente. |
| RN-17 | O impedimento de inativar fornecedor com pedidos em aberto depende da implementação do ciclo de pedidos e da operação de inativação. Não é considerado atendido pela versão atual. |
| RN-18 | O prazo da OS é informado na abertura. O cálculo automático por severidade, calendário e SLA contratual permanece pendente. |
| RN-19 | A rastreabilidade completa de alterações de custo até nota ou cotação, incluindo valores anterior e posterior, permanece parcial. Um evento genérico de atualização não comprova essa origem. |
| RN-20 | Os formatos devem ser especificados por recurso: GED, referência de planta, documentos de RH e leitor IFC. A referência de planta admite PDF, PNG, JPEG e WebP. A restrição de formatos originalmente prevista para o GED não está integralmente aplicada. |

## 5. DEM: descrições para o dicionário

Estas descrições substituem textos incorretos ou copiados. A lista de colunas de cada tabela deve ser conferida nas migrações e entidades; esta seção não substitui o schema físico completo.

| Tabela | Descrição correta |
| --- | --- |
| empresa | Armazena a identificação e as informações da empresa vinculada aos dados operacionais. Seus campos incluem nome_fantasia, razao_social, ambiente_dados e data_criacao. |
| usuario | Armazena identidade, perfil, vínculo empresarial e informações de autenticação. O e-mail é globalmente único. senha_hash contém hash BCrypt e não a senha reversivelmente criptografada. |
| projeto_obra | Armazena a obra e seus dados operacionais, incluindo nome, área total, VGV estimado, datas e vínculos de empresa e responsável. |
| contrato_servico | Armazena o contrato vinculado à obra e ao fornecedor, com valor, retenção, prazo de SLA e vigência. Não é um repositório de arquivos. |
| documento_projeto | Armazena metadados dos documentos associados ao projeto, incluindo título, referência de armazenamento, hash e versão documental. |
| etapa_cronograma | Armazena etapas da obra, suas datas e o percentual de execução informado. O percentual não comprova medição financeira aprovada. |
| item_estoque | Armazena materiais por empresa, incluindo SKU, nome, categoria, unidade, saldo, estoque mínimo e custo unitário médio. A combinação empresa/SKU é única. |
| movimentacao_estoque | Armazena entradas, saídas e consumos, com material, usuário, quantidade, valores e vínculos aplicáveis. A chave da operação permite tratar repetição. |
| fornecedor_b2b | Armazena o cadastro de fornecedores e sua avaliação/situação. Valores iniciais aplicados por cada fluxo devem ser diferenciados de defaults físicos do banco. |
| cotacao_b2b | Armazena propostas e condições de cotação. A entidade não representa, isoladamente, um ciclo completo de leilão, aprovação e pedido de compra. |
| ocorrencia_qualidade | Armazena ocorrência, projeto, responsável, norma informada, severidade e estado. Evidências fotográficas obrigatórias dependem de complemento. |
| equipe_trabalho | Armazena equipe, liderança, especialidade e quantidade de operários. A quantidade não equivale ao cadastro de disponibilidade individual por OS. |
| solicitacao_servico | Armazena a solicitação utilizada no fluxo de ordem de serviço, com vínculos, descrição, prioridade, prazo e encerramento. |
| unidade_imobiliaria | Armazena unidades e sua situação de disponibilidade/reserva/venda, incluindo o vínculo da reserva quando aplicável. |
| mensagem_chat | Estrutura de mensagens existente no modelo de dados, sem comprovar a disponibilidade de chat operacional por grupos na versão analisada. |
| log_auditoria | Armazena eventos de auditoria em tabela relacional, com identificador BIGINT, ação, entidade, identificador afetado, detalhes textuais em JSON, origem e data/hora. |

### Correções pontuais de campos

- Em usuario, usar email VARCHAR(120), nome VARCHAR(100), perfil VARCHAR(30) e senha_hash VARCHAR(255), sem valor padrão booleano. Incluir os campos atuais de ativação, Google, versão da credencial e bloqueio.
- Em empresa, usar razao_social de 150 caracteres e data_criacao; não apresentar status_ativo e data_cadastro como campos existentes da entidade atual.
- Em projeto_obra, usar area_total_m2 com precisão 12 e escala 2. Não listar categoria_obra, orcamento_aprovado, percentual_concluido ou status_obra como colunas existentes.
- Em item_estoque, substituir codigo_sku por sku e descricao_insumo por nome. Não apresentar coeficiente_cm2 como campo atual.
- Em movimentacao_estoque, usar usuario_id, incluir ordem_servico_id e chave_operacao e conferir precisão dos valores.
- Em solicitacao_servico, corrigir a segunda ocorrência de data_limite_sla para data_encerramento, opcional.
- Em log_auditoria, retirar ObjectId/MongoDB e usar acao, entidade_afetada, entidade_id, detalhes_json, ip_origem e data_hora. Empresa e usuário podem ser nulos nos eventos em que não houver identidade associada.
- Acrescentar as entidades posteriores até V23, incluindo RH, sessões, convites, MFA, acessos externos, modelos, revisões, rascunhos, publicações e referências de plantas.
- Diferenciar valor padrão SQL, valor aplicado pela aplicação e validação de entrada. Não desenhar associações JPA inexistentes apenas porque há IDs relacionados.

## 6. Documentação técnica: arquitetura

O frontend principal utiliza React, TypeScript e Vite, com fontes nos diretórios src e public na raiz do projeto. O backend utiliza Java 21 e Spring Boot 3.2.4. A aplicação organiza entidades em domain.entity, repositórios em domain.repository e componentes web em infrastructure.web.controller, infrastructure.web.dto e infrastructure.web.exception. Há regras transacionais e acesso à persistência por JPA e EntityManager.

A estrutura atual é descrita como aplicação em camadas. Não se afirma independência completa do domínio em relação aos frameworks nem decomposição em microsserviços. A classe principal é Obra360Application.

### Banco de dados e conexões

O perfil local utiliza H2 persistente em arquivo. A configuração de produção utiliza PostgreSQL, com migrações Flyway e validação do schema pelo Hibernate. Na versão analisada existem migrações de V1 a V23. No perfil local, Flyway está desabilitado e o Hibernate atualiza o schema.

As operações acessam o banco por meio da camada de persistência e das transações. Ao término do uso, a conexão pode retornar ao pool para reutilização. Isso é diferente de encerrar o processo do banco de dados após cada consulta. A documentação deve descrever aquisição, uso e liberação de recursos, sem afirmar desligamento do servidor a cada requisição.

### Autenticação e autorização

As senhas são protegidas com hash BCrypt. A autenticação emite JWT assinado, utilizando JJWT 0.11.5 na versão analisada. O token identifica o usuário e a sessão; empresa, perfil e estado da conta são verificados no servidor. O banco mantém sessões para revogação. O conteúdo de um JWT assinado não deve ser considerado secreto apenas por estar assinado.

A autorização considera perfil, empresa e vínculos com o recurso. O frontend auxilia a navegação, mas as decisões de acesso são aplicadas pelo backend. Segredos, certificados e credenciais não devem constar do manual ou dos apêndices públicos.

### Auditoria

Os eventos de auditoria são persistidos em log_auditoria no banco relacional. Os registros podem identificar ação, entidade afetada, usuário, empresa, origem e data/hora. O conteúdo de detalhes varia conforme a operação; não há captura genérica de todo estado anterior e posterior. A API não oferece edição ou exclusão comum desses eventos. Inviolabilidade contra administradores do banco não é garantida por esse mecanismo.

### Mensageria, resiliência e observabilidade

O projeto contém componentes e dependências de Kafka, mas sua presença não demonstra processamento assíncrono completo nos fluxos operacionais. Circuit Breaker aplicado às integrações permanece pendente. Os endpoints de saúde, liveness e readiness devem ser descritos conforme a configuração. Outros endpoints, como métricas, exigem exposição e autorização próprias.

### Operação offline

A aplicação depende da API para executar suas operações corporativas. O service worker atual remove o cache legado e não implementa fila geral IndexedDB com sincronização posterior. Rascunhos locais do modelador constituem um recurso específico, sem representar operação offline de todos os módulos.

### API e execução

O catálogo deve refletir as rotas operacionais sob /api/v1/auth, /api/v1/instalacao, /api/v1/workspace e /api/v1/portal, conforme seus controladores e permissões. Rotas legadas não devem ser apresentadas como disponíveis quando bloqueadas pela configuração de segurança. Cada operação deve informar método, caminho completo, perfil, entrada, resposta e erros.

As respostas de sucesso variam conforme o recurso; não há envelope universal obrigatório. Os erros operacionais utilizam ProblemDetail conforme o tratamento aplicável.

O ambiente local utiliza frontend na porta 3000 e API na 8080. A configuração de produção com Docker Compose prevê proxy Caddy nas portas 80/443 e PostgreSQL na rede interna. Essa preparação não comprova implantação executada, Kubernetes ou alta disponibilidade. O engines do frontend exige Node ^20.19.0 ou >=22.12.0.

Repositório: https://github.com/JPedro01x/obra-360.

## 7. Integrações: texto correto

| Recurso | Texto para inserir |
| --- | --- |
| SEFAZ | A integração consulta situação/protocolo da NF-e com chave de acesso e certificado A1 configurado. Não executa importação completa de itens, conciliação de pedidos e entrada automática em estoque. |
| S3 | O projeto possui configuração para armazenamento externo. O uso efetivo depende de bucket, permissões e credenciais válidas. Disponibilidade do adaptador não comprova envio realizado ao provedor em produção. |
| E-mail | O envio e a recuperação de senha dependem de SMTP configurado. O fluxo deve ser validado com entrega efetiva, validade do token e tratamento de falhas. |
| Google | O login depende da configuração OAuth e dos vínculos de conta previstos pela aplicação. O botão na interface não comprova configuração ativa do provedor. |
| IA | O assistente encaminha ao provedor configurado a pergunta autorizada pelo usuário. Não consulta automaticamente os dados da empresa nem altera cadastros. Sua operação depende das credenciais e disponibilidade do provedor. |
| IFC | A leitura de arquivos IFC é distinta do editor próprio de plantas e do armazenamento de documentos. Não representa conversão ou edição universal de qualquer modelo BIM. |

## 8. RH: texto pronto

O módulo de Recursos Humanos permite administrar funcionários, departamentos, cargos, alocação em obra/equipe, registros manuais de ponto, afastamentos, benefícios, treinamentos e certificações, informações administrativas de exames, vagas e candidatos. Também oferece lançamentos manuais de proventos e descontos, totais de folha, fechamento, registro administrativo de pagamento, demonstrativos, documentos privados e histórico funcional.

O acesso é restrito aos perfis autorizados, incluindo RH e SUPER_ADMIN, e aos dados da respectiva empresa. O registro de pagamento não realiza transferência bancária. A versão não constitui folha trabalhista completa: não calcula automaticamente INSS, IRRF, FGTS, férias, 13º, rescisão ou banco de horas, nem transmite eventos ao eSocial. O desligamento de funcionário não deve ser descrito como desativação automática de sua conta de usuário sem integração específica.

## 9. Modelador: texto pronto

O modelador permite criar e administrar plantas vinculadas às obras, com edição de elementos 2D e visualização 3D. O usuário pode utilizar PDF ou imagem como referência, informar página e pavimento, calibrar uma dimensão conhecida e traçar paredes, aberturas e demais elementos suportados.

As revisões podem preservar a referência original e sua calibração. O módulo oferece revisões, comparação, timelapse, rascunhos, exportação JSON e impressão em escala. O timelapse apresenta a evolução das revisões do modelo, sem comprovar automaticamente a execução física da obra. O portal apresenta a geometria das revisões publicadas conforme os vínculos de acesso; isso não concede acesso irrestrito aos arquivos originais internos.

Não se declara conversão automática completa de qualquer PDF ou imagem em modelo 3D. O número de plantas por projeto e por cliente deve ser descrito conforme os vínculos e limites efetivamente configurados.

## 10. Testes e resultados: texto pronto

A verificação utiliza testes de backend, integração com PostgreSQL, interface, perfis de acesso, jornada integrada e restauração, conforme os cenários executados. Cada resultado deve identificar data, commit, comando, ambiente, quantidade de testes executados, ignorados e falhos e localização da evidência.

A execução de mvn test pode ignorar testes condicionais de PostgreSQL. Sua validação exige executar o procedimento específico. Resultados automatizados não representam aceite de uma empresa, conformidade legal, disponibilidade de produção ou inexistência de defeitos. Essas conclusões dependem de avaliações e evidências próprias.

Modelo de registro a preencher com uma execução efetiva:

| Campo | Conteúdo obrigatório |
| --- | --- |
| Versão | Commit efetivamente testado |
| Data | Data e horário da execução |
| Ambiente | Sistema, banco e serviços utilizados |
| Comando | Comando exato executado |
| Resultado | Executados, aprovados, falhos e ignorados |
| Evidência | Arquivo do relatório ou log sem segredos |
| Limites | Cenários e provedores não verificados |

## 11. Manual: abertura e procedimentos

Este manual descreve a versão operacional do Obra360. As opções disponíveis dependem do perfil e dos vínculos do usuário. Recursos externos exigem configuração prévia. Exemplos de cadastros não devem ser interpretados como transações reais sem identificação de sua origem.

Para cada procedimento, usar esta estrutura: **objetivo, perfil autorizado, pré-requisitos, caminho na interface, passos, resultado esperado e erros possíveis**. Inserir capturas atuais da operação conectada à API, com dados apropriados para divulgação.

Procedimentos necessários: login e recuperação; Google e MFA; usuários e convites; obras e equipes; contratos e OS; materiais e consumo; documentos; ocorrências e garantias; unidades e portais; RH; criação de planta com referência e calibração; revisão e publicação; integrações; auditoria e privacidade.

Excluir instruções de elaboração como “o aluno deve inserir uma figura”. Não publicar senhas, tokens, certificados, documentos pessoais ou backups nos exemplos. Capturas devem mostrar apenas funções realmente disponíveis ao perfil utilizado.

## 12. Figuras, referências e fechamento

Os diagramas devem corresponder ao schema e aos fluxos da versão identificada. Incluir entidades posteriores, cardinalidades, restrições e estados reais. Kafka, MongoDB e outros componentes planejados devem estar identificados como propostos, quando presentes no desenho. Renumerar as figuras e escrever legendas específicas para DER, classes, sequências, componentes, implantação e BPMN.

As referências devem conter apenas fontes efetivamente consultadas. Conferir autoria, título, edição, ano e páginas das citações conforme as fontes originais e o padrão exigido pela instituição. Exemplos de referências do template não substituem a bibliografia do trabalho.

**Redação final sugerida:** A versão apresenta os módulos e mecanismos descritos na matriz de atendimento. Há funcionalidades parciais e pendências identificadas, especialmente nas automações e nos critérios operacionais mais amplos. A conclusão dos requisitos obrigatórios depende de implementação e validação; ajustes de escopo dependem de aprovação. A preparação para uso comercial exige também aceite operacional, configuração de provedores e evidências do ambiente de produção.
