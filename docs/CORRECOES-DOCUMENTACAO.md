# Correções da documentação do Obra360

Análise de 11/11/2026, com base na main local no commit 639d4fc, nos quatro textos distintos recebidos e no código e migrações correspondentes. Os seis anexos DEM têm conteúdo idêntico.

Este é um roteiro de correções. Os documentos originais permanecem como recebidos. As classificações abaixo descrevem a implementação examinada. Requisitos escritos no futuro podem continuar expressando objetivos, mas seu atendimento precisa ser registrado separadamente. Um requisito obrigatório da disciplina exige implementação ou alteração formal de escopo aprovada pelo professor.

As figuras chegaram como legendas no texto colado. Seus desenhos, cardinalidades, setas e conteúdo visual ainda precisam ser comparados com os arquivos originais. As citações bibliográficas também precisam ser verificadas nas fontes originais.

## 1. Correções que afetam todos os documentos

1. Identificar a versão, a data e o commit do software descrito.
2. Distinguir a versão operacional conectada à API, a demonstração com registros simulados e as funcionalidades planejadas.
3. Acrescentar uma matriz com requisito, situação, implementação, teste/evidência e pendência. Uma tela da demonstração ou uma classe isolada não comprova atendimento de ponta a ponta.
4. Registrar os ambientes. O desenvolvimento local usa H2 persistente. A configuração de produção usa PostgreSQL. Os testes incluem H2 e PostgreSQL isolados. Flyway está desabilitado no perfil local e habilitado na configuração de PostgreSQL.
5. Apresentar testes com data, comando, ambiente, resultado e limites. Testes automatizados não equivalem a aceite de uma empresa real, disponibilidade contratada ou auditoria independente.
6. Trocar garantias absolutas, como “regressão zero”, “perfeitamente responsivo”, “rastreabilidade total” e “imutável contra qualquer alteração”, por comportamentos delimitados e evidências.
7. Documentar os recursos posteriores ao texto original, especialmente RH, sessões revogáveis, MFA, convites, portais, modelador, revisões, rascunhos, publicações e referência de PDF/imagem por revisão.
8. Atualizar referências cruzadas. O DDE usa exemplo “NF-04” para disponibilidade, enquanto a ERS usa “RNF-03”. Escolher uma convenção única.
9. Ajustar linguagem e revisão editorial. Corrigir fragmentos de fórmulas como “Cm2C_{m^2}Cm2”, erros de digitação, figuras repetidas e trechos copiados de outras entidades.

## 2. DDE — Documento de Definição de Escopo

| Seção | Correção necessária |
| --- | --- |
| 1.1 Introdução | Apresentar a centralização do ciclo completo como visão do produto. Delimitar o que a versão entregue cobre. Viabilidade de terrenos, automações fiscais, medições e autoria BIM completa não devem aparecer como entrega já comprovada. |
| 1.2 Visão geral | Garantir que prioridades, infraestrutura, entregáveis e critérios citados existam e correspondam à ERS e ao software. |
| 1.3 Identificação | Padronizar o nome Obra360 ou Obra 360, os autores e a identificação do repositório. |
| 1.4 Objetivos | Marcar a situação dos objetivos de NoSQL, Kafka, Circuit Breaker, compras completas, Curva S e conciliação fiscal. A implementação atual não comprova todos esses objetivos. |
| 1.5 Justificativa | Manter a fundamentação do problema, separando expectativa de benefício de resultado medido no projeto. Conferir as obras citadas e incluir referências bibliográficas completas. |
| 1.6 Identificação dos requisitos | Usar RF, RNF e RN de maneira uniforme, com IDs únicos e links/seções corretos. |
| 1.7 Escopo | Delimitar os módulos conforme a matriz RF abaixo. Evitar listar como concluídos ativos pesados, transferências de estoque, requisições/pedidos de compra, chat por obra e controles financeiros ausentes do fluxo operacional. |
| 1.7.2 Entregáveis | Identificar os arquivos realmente entregues, versão do banco, manual, diagramas, scripts e resultados dos testes. |
| 1.8 Premissas | Diferenciar banco de teste e dados de uma empresa real. Contas de provedores, certificado fiscal e infraestrutura devem aparecer como dependências de ativação. |
| 1.8.2 Restrições | Tratar NoSQL, broker e arquitetura hexagonal estrita como obrigações pendentes se forem exigências do professor. Dependência de APIs externas não justifica declarar implementada uma automação interna ausente. |
| 1.9 Aceitação | Registrar cada critério como atendido, parcial, pendente ou não verificado. Remover a aparência de aceite já concluído quando houver apenas testes locais. |
| 1.10 Exclusões | Manter a exclusão de gateways, se esse for o escopo aprovado. Delimitar a exclusão de assinatura digital de documentos, pois a consulta SEFAZ implementada depende de certificado A1. Explicitar a situação real da operação offline. |
| 1.11 Stakeholders | Padronizar autores, organizadores, responsáveis pelo aceite e perfis. Há diferença entre os dois autores apresentados e a identificação singular de organizador. |
| 1.12 Riscos | Associar riscos às funcionalidades efetivamente dependentes de provedores e aos requisitos ainda pendentes, com responsável e medida de acompanhamento. |

## 3. ERS — requisitos funcionais

“Base atendida” significa que o mecanismo principal existe, sujeito aos detalhes indicados. “Parcial” significa que parte relevante do critério original continua ausente.

| ID | Situação observada | Correção ou complemento |
| --- | --- | --- |
| RF-01 | Base atendida com dependência externa | Descrever login por e-mail/senha, JWT assinado, sessões revogáveis e recuperação por SMTP configurado. Documentar MFA e vínculo explícito Google. Corrigir a descrição de ausência de estado no servidor. |
| RF-02 | Base atendida | Relacionar os 15 perfis reais à matriz de permissões. Distinguir 401 para falta de autenticação e 403 para operação proibida. Dados de outra empresa também podem resultar em 404 para não revelar sua existência. |
| RF-03 | Base atendida | Descrever empresa obtida da identidade autenticada e filtros diretos ou por relacionamentos. Não apresentar cabeçalho de tenant informado pelo navegador como autoridade. Citar os testes de isolamento. |
| RF-04 | Parcial | Há instalação/provisionamento da empresa, incluindo comando do operador. O CRUD completo de organizações e sua inativação não está disponível pela interface operacional descrita. Ajustar o alcance ou implementar o restante. |
| RF-05 | Parcial | Há cadastro, edição e consulta de obras. Categoria, localização e inativação de empreendimento não estão no contrato operacional atual. Relacionar os campos realmente disponíveis. |
| RF-06 | Parcial | Há unidades e estados DISPONIVEL, RESERVADO e VENDIDO. Conciliar “em garantia”, “entregue”, tipos e especificações prometidas com os estados e campos efetivamente implementados. |
| RF-07 | Parcial | Há cadastro de contrato, fornecedor, obra, valor, vigência e SLA informado. Complementar ou retirar da entrega atual catálogo de serviços, vínculo contratual à unidade e alertas automáticos de vencimento. |
| RF-08 | Parcial | Distinguir OS operacional, chamado de garantia e solicitação de atendimento da conta. Não descrevê-los como um fluxo único completo de contrato, unidade, severidade e equipe sem implementar essa ligação. |
| RF-09 | Parcial | Há etapas e progresso informado. O diário fotográfico por etapa com publicação ao proprietário precisa de fluxo específico. |
| RF-10 | Parcial | Há OS, equipe, transições de estado, consumo e baixa de material. Documentar o alcance do histórico e complementar apontamento de horas e atribuição individual prometidos. |
| RF-11 | Parcial em relação ao texto | RH cadastra funcionários/cargos e alocação em obra/equipe. A composição por profissional em cada OS, disponibilidade e conflitos de horário não estão completas. Incluir requisitos específicos para o RH administrativo já existente. |
| RF-12 | Parcial | Há material, saldo, mínimo, movimentações e custo de consumo. Transferência entre almoxarifados, gestão de equipamentos e cálculo automático por m² não fazem parte do fluxo operacional atual completo. |
| RF-13 | Parcial | Documentar consulta de situação/protocolo da NF-e com chave e A1. Importação dos itens, conciliação com pedido e entrada automática no estoque exigem implementação adicional. |
| RF-14 | Parcial | Há fornecedores, cotações e proposta do portal. Requisição de compra, mapa comparativo, aprovação e pedido com recebimento integrado precisam de implementação própria. |
| RF-15 | Parcial | Há ocorrência, norma informada, severidade, responsável e estado do plano de ação. Fotos obrigatórias, laudo regulatório e notificação automática não estão demonstrados pelo fluxo atual. |
| RF-16 | Parcial | Há abertura e acompanhamento do chamado de garantia. Cobertura automática por tipo/prazo, agenda de vistoria e conversão em OS precisam ser completadas. |
| RF-17 | Base atendida para GED | Descrever envio, download protegido, hash e versões. Separar armazenamento de arquivo, leitura IFC, modelagem 2D/3D e referência PDF/imagem. Não inferir leitura/edição nativa de DWG a partir do upload. Conciliar formatos permitidos com RN-20. |
| RF-18 | Parcial | Há custo unitário e custo dos materiais consumidos. Despesas indiretas, centros de custo, orçamento e análise de desvio precisam de implementação adicional. |
| RF-19 | Parcial | Existem consultas e indicadores operacionais. A Curva S físico-financeira calculada a partir de planejamento e medições e a atualização em tempo real prometida não estão demonstradas na área operacional. |
| RF-20 | Pendente no fluxo operacional | Documentar a tabela/legado separadamente. A existência de entidade e tela demonstrativa não comprova chat operacional em grupos por obra/OS, entrega e histórico contextualizado. |
| RF-21 | Parcial | O portal limita acesso pelos vínculos e exibe unidades, chamados e plantas publicadas. Completar ou delimitar diário fotográfico e acesso aos documentos previstos. |
| RF-22 | Pendente no fluxo operacional | Cadastro e gestão de horímetro, manutenção e alocação de máquinas precisam de fluxo operacional. Reescrever o critério “cadastrados [...] a cada OS concluída” como resultados separados de cadastro, uso, manutenção e alocação. |
| RF-23 | Parcial | Há auditoria relacional de operações, sem API comum de edição/exclusão. O estado anterior/novo não é registrado genericamente para toda mutação. Delimitar as proteções e completar os eventos exigidos. |
| RF-24 | Parcial | Contadores, avisos da interface e indicador de estoque baixo não equivalem a entrega automática de notificações a responsáveis. Definir evento, destinatário, canal, momento e histórico. |
| RF-25 | Pendente no fluxo operacional completo | Implementar medição, itens, aprovação, cálculo financeiro e vínculo com a etapa. A atualização manual do percentual não demonstra o critério de aprovação e liberação de faturamento. |

## 4. ERS — requisitos não funcionais

| ID | Correção necessária |
| --- | --- |
| RNF-01 | Manter o limite de 2 segundos como meta até executar carga representativa. Definir recursos do ambiente, conjunto de operações, volume, concorrência, duração e percentil. A leitura local de um arquivo pequeno não comprova todo o SLA. |
| RNF-02 | Trocar “JWT criptografado sem estado de sessão” por “JWT assinado enviado como Bearer, com sessão revogável no banco”. O sistema não usa sessão HTTP tradicional, mas mantém estado de autenticação no servidor. |
| RNF-03 | Tratar 99,9% como meta dependente da infraestrutura. Esclarecer se a janela é o mês inteiro ou apenas horário comercial, e como indisponibilidade e manutenção serão medidas. |
| RNF-04 | Descrever BCrypt e controles implementados. Diferenciar HTTP de desenvolvimento e HTTPS de produção. A exclusividade de TLS 1.3 precisa de configuração e teste próprios. Testes funcionais não comprovam cobertura completa da OWASP Top 10. |
| RNF-05 | Marcar Kafka e escalabilidade horizontal como pendentes de comprovação no fluxo operacional. Demonstrar produtor, tópico, consumidor e efeito persistido. Limites de requisições e controles de IA mantidos em memória também precisam de avaliação antes de múltiplas instâncias. |
| RNF-06 | Identificar auditorias e ferramentas de acessibilidade, páginas e cenários. Testes de teclado/layout são evidências parciais. Acrescentar verificação com leitor de tela e evitar declarar conformidade AA integral apenas por teste automatizado. |
| RNF-07 | Substituir “perfeitamente” pela matriz de navegadores e resoluções testados. Registrar limitações, especialmente WebGL, impressão e operações por toque. |
| RNF-08 | Descrever controles e fluxos realmente implementados, incluindo pedidos de privacidade e exportação. Anonimização/exclusão efetiva e política de retenção ainda exigem definição e implementação. Uma declaração de conformidade precisa de revisão própria. |
| RNF-09 | Ajustar a descrição para a organização atual em camadas e serviços, com entidades JPA e operações com EntityManager. Se a exigência for domínio independente e ports/adapters estritos, completar a refatoração e demonstrar as dependências. |
| RNF-10 | Descrever a auditoria relacional atual. Se NoSQL for obrigatório, implementar e integrar o armazenamento, em vez de declarar MongoDB concluído. |
| RNF-11 | Separar Health Checks implementados de Circuit Breaker pendente. Timeout e tratamento de erro não comprovam abertura, rejeição temporária e recuperação de circuito. |
| RNF-12 | Distinguir execução de todos os testes de cobertura de código. Documentar mvn test, npm run test:postgres, testes de interface, jornada integrada, perfis e restauração. A suíte PostgreSQL é condicional e pode ser pulada por mvn test sozinho. |
| RNF-13 | Atualizar o histórico para V1–V23 e explicitar em quais perfis Flyway é executado. No perfil local, o schema é atualizado por Hibernate. |
| RNF-14 | Java 21 e Spring Boot estão presentes. A exigência de todo código/log exclusivamente pt-BR diverge dos identificadores, testes e mensagens de bibliotecas. Propor texto que delimite pt-BR à experiência do usuário e à documentação, sujeito à aprovação acadêmica. |

## 5. ERS — regras de negócio

| ID | Correção necessária |
| --- | --- |
| RN-01 | Definir validação de formato/dígito verificador e consulta do protocolo como etapas diferentes. Uma chave matematicamente válida não comprova autorização nem contém os itens a importar. A entrada operacional atual também admite registro manual sem vínculo fiscal. |
| RN-02 | Resolver a diferença entre “menor ou igual” do texto e o contador atual, que usa saldo menor que o mínimo. A sugestão de requisição de compra não está integrada ao fluxo completo. |
| RN-03 | Manter a regra. Vincular a evidência ao backend, inclusive concorrência e repetição da operação, e não apenas à validação visual. |
| RN-04 | Escrever o isolamento como regra sobre a organização autenticada e seus relacionamentos. A implementação não tem uma coluna tenant_id em toda tabela. Algumas entidades são isoladas pela obra, contrato, material ou usuário associado. |
| RN-05 | Implementar upload/vínculo de evidências e validação transacional para ALTA/CRITICA, ou registrar a pendência. O cadastro atual não exige arquivo. |
| RN-06 | Delimitar os administradores considerados. A API não fornece alteração/exclusão comum de logs. Proteção contra administradores do banco e inviolabilidade física exigem controles adicionais. |
| RN-07 | Implementar justificativa, aprovação e impedimento de encerramento tardio sem esses dados. A transição atual de status não exige essa autorização adicional. |
| RN-08 | Implementar a validação da vigência na abertura da OS e definir o significado de contrato inativo. O fluxo atual verifica pertencimento e associação, mas não bloqueia pela vigência na criação da ordem. |
| RN-09 | Implementar vínculo de profissionais às OS, intervalos e detecção de sobreposição. O cadastro de equipe com quantidade de operários não demonstra o limite de duas OS por pessoa. |
| RN-10 | Definir quais tipos de OS exigem materiais e validar antes do encerramento. Hoje é possível encerrar sem consumo informado. |
| RN-11 | Documentar que a unicidade atual do e-mail é global. Se o mesmo e-mail precisar existir em organizações diferentes, revisar banco, login e identificação da conta antes de afirmar suporte por tenant. |
| RN-12 | Delimitar a reserva do portal e os estados existentes. ENTREGUE e contratos de venda completos não fazem parte desse fluxo. Definir também quem pode reabrir uma unidade vendida, pois a alteração administrativa atual não impõe uma matriz irreversível de estados. |
| RN-13 | Implementar parâmetros de cobertura, data inicial e classificação do chamado. O sistema atual registra categoria/estado sem decisão automática de cobertura. |
| RN-14 | Implementar alçada, dois aprovadores distintos, estados de aprovação e trilha. A cotação atual não aplica essa aprovação conjunta. |
| RN-15 | Implementar a ligação entre medição aprovada e progresso. Hoje o percentual é atualizado diretamente pelo usuário autorizado. |
| RN-16 | Ajustar para a estratégia real de JWT com subject, identificador de sessão e versão da credencial, com consulta de empresa/perfil no banco. Se os claims exigidos forem mantidos, implementar sua emissão e revalidação. |
| RN-17 | Especificar a operação de inativação e o fluxo de pedidos antes de declarar a trava. A área operacional atual não oferece o ciclo completo descrito. |
| RN-18 | Implementar cálculo de SLA por severidade e suas regras de calendário, ou documentar o prazo informado na abertura da OS. A configuração do contrato não gera esse prazo automaticamente no fluxo examinado. |
| RN-19 | Completar a origem da alteração de custo e seu histórico anterior/novo. O evento genérico de atualização de material não comprova rastreabilidade até uma nota ou cotação. |
| RN-20 | Separar formatos do GED, da referência de planta, do leitor IFC e do RH. O GED atual não aplica essa lista restrita. A referência aceita PDF/PNG/JPEG/WebP e o RH possui regras próprias. Evitar tratar armazenamento de DWG como leitura/edição do formato. |

## 6. DEM — dicionário de dados

Conferir nomes SQL, tipos, tamanhos, nulabilidade, PK, FK, UNIQUE, valores padrão e índices contra as migrações e as entidades. Diferenciar restrição do banco de validação da aplicação e de valor preenchido por @PrePersist. IDs Long não devem ser representados no diagrama de classes como relacionamentos @ManyToOne inexistentes.

| Tabela | Correções concretas |
| --- | --- |
| empresa | Padronizar o nome SQL em minúsculas. Usar nome_fantasia, razao_social de 150 caracteres e data_criacao. Incluir ambiente_dados. status_ativo e data_cadastro não são os campos atuais da entidade. |
| usuario | email é VARCHAR(120), nome é VARCHAR(100) e perfil é VARCHAR(30). Corrigir email com tamanho 14 e o padrão true de senha_hash. Documentar BCrypt como hash. Incluir ativo, google_subject, versao_credencial, tentativas_login_falhas e bloqueado_ate, com a proteção dos campos sensíveis na API. A unicidade do e-mail é global. |
| projeto_obra | Substituir a descrição copiada de usuário. Usar nome, vgv_estimado, area_total_m2, data_inicio e data_previsao_fim. area_total_m2 usa precisão 12 e escala 2. Não listar categoria_obra, orcamento_aprovado, percentual_concluido e status_obra como colunas existentes. |
| contrato_servico | Substituir a descrição de repositório de arquivos pela descrição de contrato, obra, fornecedor, valor, retenção, SLA e vigência. Documentar data_criacao e conferir os valores aplicados pela aplicação versus defaults SQL. |
| documento_projeto | Corrigir a descrição copiada de usuário e usar titulo sem acento no nome SQL. O arquivo fica no armazenamento e a linha guarda sua referência/hash. Controle de versão do arquivo não equivale automaticamente a locking otimista JPA. |
| etapa_cronograma | Preencher nome_etapa com tamanho 200 e registrar data_criacao. O percentual é informado no fluxo atual. Não descrever liberação automática por medição. |
| item_estoque | Usar sku, nome, categoria, unidade_medida e custo_unitario_medio. A unicidade do SKU é por empresa. Não listar descricao_insumo, codigo_sku ou coeficiente_cm2 como colunas desta entidade. Incluir version e datas de criação/atualização. |
| movimentacao_estoque | Usar usuario_id em vez de usuario_responsavel_id. Incluir valor_total, ordem_servico_id e chave_operacao. Documentar ENTRADA, SAIDA e CONSUMO_OS do fluxo operacional, separando a implementação fiscal legada. Não afirmar transferências integradas. |
| fornecedor_b2b | Incluir empresa_id e conferir a migração de associação por empresa. Explicitar que o cadastro operacional cria EM_ANALISE com score zero, enquanto o fallback de @PrePersist da entidade usa HOMOLOGADO e 5,00. Não apresentar um único padrão sem indicar a origem. |
| cotacao_b2b | Descrever a proposta persistida, com data_criacao. Não afirmar leilão reverso, mapa comparativo ou pedido de compra completo a partir desses campos. |
| ocorrencia_qualidade | Incluir data_criacao. Descrever norma como classificação informada. O esquema atual não contém o vínculo completo de evidências fotográficas obrigatório na ERS. |
| equipe_trabalho | Diferenciar quantidade_operarios do vínculo individual de membros. Alocação de funcionário em equipe no RH não implementa automaticamente horários por profissional/OS. |
| solicitacao_servico | Substituir a descrição copiada de equipe. Trocar a segunda ocorrência de data_limite_sla por data_encerramento, que é opcional. Explicar que a aplicação usa esta entidade no fluxo de OS. |
| unidade_imobiliaria | Incluir reserva_usuario_id e data_criacao. Conciliar os estados com DISPONIVEL, RESERVADO e VENDIDO. Campos de amortização/índice não demonstram um simulador financeiro operacional. |
| mensagem_chat | Identificar a tabela como estrutura existente cuja presença não comprova o chat por grupos e contexto prometido. Especificar o fluxo que realmente estará disponível na entrega. |
| log_auditoria | Substituir ObjectId por identificador BIGINT relacional. Usar acao, entidade_afetada, entidade_id, detalhes_json, ip_origem e data_hora. usuario_id e empresa_id são opcionais na entidade. Revisar nomes, tamanhos e preenchimento de cada evento. Não apresentar DOCUMENT/MongoDB como implementação atual. |

Completar o dicionário e os diagramas com as tabelas introduzidas nas migrações posteriores, incluindo garantias e demais entidades omitidas no texto, consumo de OS, acessos externos, tabelas rh_*, sessões, recuperação de senha/vínculo Google, MFA, convites, licenças, atendimento, modelos/revisões, rascunhos, eventos de publicação e modelo_referencia.

Remover nomes de serviços apenas idealizados e apontar os serviços/controladores realmente responsáveis pelo fluxo. Exemplos presentes no texto, como TenantService, OrganizacaoService, AuditoriaNoSqlService e ChatCorporativoService, não devem ser tratados como classes existentes sem correspondência no fonte.

## 7. DEM — diagramas

1. Conferir DER contra o schema evoluído até V23, incluindo cardinalidades, FKs, unicidade e isolamento pelos relacionamentos.
2. Diferenciar a estrutura física SQL do modelo conceitual do negócio e das associações representadas em Java por IDs.
3. Atualizar sequências para as rotas operacionais. Mensagem Kafka só deve constar como execução atual quando houver produtor e consumidor no fluxo correspondente.
4. Registrar transações, concorrência, conflito 409, rollback de arquivo e revisões do modelador nos fluxos que usam esses mecanismos.
5. Conciliar estados dos diagramas com os enums/valores aceitos no backend. Distinguir solicitação, OS, garantia, unidade, folha e cotação.
6. Incluir os 15 perfis reais e distinguir acesso interno ao arquivo de referência de acesso do cliente à planta publicada.
7. Representar a arquitetura de produção preparada e marcar infraestrutura efetivamente validada. Docker Compose não comprova Kubernetes ou balanceamento de múltiplas réplicas.
8. Rever a classificação de casos de uso como “modelagem estrutural” conforme o template da disciplina.
9. Renumerar figuras de forma consistente. O texto repete números 7–13 depois das figuras 1–14.
10. Corrigir legendas genéricas “Diagrama de Componentes” usadas para arquitetura, ORM e BPMN, e corrigir “Clean Archuitecture”.
11. Substituir espaços de figuras por desenhos reais com texto legível, fonte, versão e referência no parágrafo correspondente.

## 8. Documentação técnica — capítulo 5

| Seção | Correção |
| --- | --- |
| 5.1 Arquitetura | Descrever React/TypeScript/Vite, API Spring Boot, banco local e configuração PostgreSQL. Qualificar a distribuição real dos componentes. |
| 5.1 e 5.2.1 Offline | Retirar da descrição da versão operacional App Shell offline, fila IndexedDB e sincronização em segundo plano. O worker atual retira o cache legado. Rascunho local do modelador não substitui sincronização offline geral. |
| 5.1.1 Domínio | O pacote real é domain.entity e contém entidades JPA dependentes de jakarta.persistence. Não afirmar que essas classes sejam entidades puras independentes de frameworks. |
| 5.1.1 Aplicação | Há serviços, validações e controladores com EntityManager e regras transacionais. A passagem obrigatória e universal por DtoMapper não corresponde a todos os endpoints. |
| 5.1.1 Infraestrutura | Corrigir caminhos para infrastructure.web.controller, infrastructure.web.dto, infrastructure.web.exception, infrastructure.messaging e domain.repository, conforme cada arquivo real. |
| 5.2.2 Backend | Manter Java 21 e Spring Boot 3.2.4. JJWT é 0.11.5 no pom examinado. Não declarar uso de virtual threads ou ZGC sem configuração/evidência. Uma aplicação Spring Boot com módulos não caracteriza, por si só, múltiplos microsserviços. |
| 5.2.2 Actuator | Documentar health, liveness e readiness expostos e a configuração/permissão necessária para outros endpoints. /actuator/metrics não está liberado como informado pelo catálogo atual. |
| 5.2.2 Mensageria/resiliência | Explicar o estado dos produtores/listeners Kafka e a ausência de Circuit Breaker aplicado. A dependência resilience4j-ratelimiter não demonstra Circuit Breaker e Retry. |
| 5.2.3 Persistência | Descrever H2 local, PostgreSQL de produção/teste e auditoria relacional. Atualizar os nomes reais das migrações V1–V23. |
| 5.2.4 Ferramentas | Relacionar apenas ferramentas comprovadamente usadas. Separar preferências de IDE/ferramentas de IA dos requisitos de execução. |
| 5.2.5 Padrões | Apontar exemplos reais para cada padrão. Nem todos os beans precisam ser Singleton por regra e os serviços também usam EntityManager. Factory/Strategy exige correspondência concreta. |
| 5.2.6 API | Documentar as respostas reais. Erros operacionais usam ProblemDetail com status/detail e outros campos aplicáveis. As respostas de sucesso não possuem um envelope único universal timestamp/status/message/data. |
| 5.2.6 Segurança | Distinguir hash BCrypt de senha e criptografia do segredo MFA. .env é carregado pelo launcher do projeto, enquanto execução Maven/Java direta depende das variáveis injetadas. |
| 5.2.6 Releases | Informar tags realmente existentes. A forma v1.0.0 pode ser uma convenção, mas não comprova que a release foi criada. |
| 5.2.7 Ambiente | Atualizar Node para o engines do package.json, que exige ^20.19.0 ou >=22.12.0. Identificar mínimos de hardware como estimativas até medir carga. |
| 5.2.7 Portas | Documentar 3000 para a interface local e 8080 para a API. Em produção Compose, o proxy publica 80/443 e o PostgreSQL fica na rede interna. Kafka não é dependência ativa comprovada desse Compose. |
| 5.2.8 Integrações | Descrever consulta de protocolo SEFAZ com certificado A1, não entrada automática de itens. Incluir Google, SMTP, S3, IA e leitor IFC com estado de ativação e limites. |
| 5.2.9 Catálogo | Substituir o catálogo de 17 rotas legadas por contratos reais de /api/v1/auth, /api/v1/instalacao, /api/v1/workspace e /api/v1/portal. A SecurityConfig bloqueia as demais rotas comuns. Incluir métodos, perfis, payloads e erros. |
| Repositório | Corrigir para https://github.com/JPedro01x/obra-360. |
| Árvore de pastas | O frontend fica na raiz com src, public, index.html, package.json e Vite. A classe principal é Obra360Application. Atualizar pacotes, migrations e arquivos de infraestrutura. |
| Conteúdo de static | Tratar arquivos antigos/gerados separadamente da fonte atual. O build do frontend e a configuração de recursos estáticos determinam o que é servido. |
| Testes | Substituir “regressão zero” por comandos, resultados e limites. Distinguir testes com API simulada, jornada com banco isolado e validação de provedores reais. |

## 9. Recursos que precisam entrar na documentação

Adicionar requisitos e critérios de aceite, usando IDs novos e rastreáveis, para os recursos implementados depois do texto original.

- RH administrativo com funcionários, departamentos, cargos, ponto, afastamentos, benefícios, treinamentos, recrutamento, folha manual, demonstrativo, documentos privados e histórico funcional.
- Regras específicas de RH, incluindo permissões SUPER_ADMIN/RH, isolamento, CPF, concorrência, folha fechada, aprovação de ponto e arquivo privado.
- Explicitar que o RH atual não calcula automaticamente encargos, férias, 13º, rescisão ou banco de horas, nem envia eSocial. O registro administrativo de pagamento não movimenta dinheiro.
- Sessões revogáveis, MFA, códigos de recuperação, convites, controle de limites e atendimento da conta.
- Modelador 2D/3D com modelos por obra, edição, revisões, rascunhos, comparação, timelapse, exportação JSON e impressão em escala.
- Arquivo PDF/imagem por revisão, com página, pavimento, posição e escala, restauração histórica e acesso interno restrito.
- Portal do cliente com várias plantas publicadas por unidade e revisão fixada na publicação.
- IA com envio consentido de pergunta, sem consulta automática à base nem mutação de cadastros.
- Exportação privada da empresa e seus limites. Distinguir exportação de portabilidade de backup restaurável.
- Backup, teste de restauração, prontidão HTTPS, armazenamento e configuração dos provedores.

## 10. Manual do usuário — capítulo 6

Substituir as instruções ao aluno por um manual concluído.

1. Pré-requisitos de acesso, endereço e contas autorizadas. Credenciais privadas de teste devem ser entregues ao avaliador por canal controlado.
2. Login, perfil, visualizar senha, Google quando configurado, recuperação de senha e MFA.
3. Cadastro de usuário e convite.
4. Cadastro de obra, equipe e material.
5. Entrada/saída de estoque e consumo por OS.
6. Criação, execução e encerramento da OS.
7. RH com cadastro do funcionário, ponto, afastamento, rubricas manuais e demonstrativo.
8. Documentos privados de RH e diferença de permissões em relação aos documentos da obra.
9. Modelador com seleção de obra, criação de modelo, arquivo de referência, página, calibração, edição, salvamento e reabertura.
10. Revisões, comparação, timelapse e recuperação de referência.
11. Publicação de planta na unidade e consulta pelo cliente.
12. Configuração necessária e uso do assistente de IA.
13. Solicitação de suporte, exportação e logout.
14. Mensagens reais de validação, conflito, permissão, indisponibilidade e limite de uso.
15. FAQ com orientações aplicáveis à versão entregue.

Usar capturas da interface operacional atual, com proporção consistente e marcações legíveis. Cada fluxo deve apresentar pré-condição, passos, resultado esperado e erro comum. Não usar tela simulada como evidência de integração real.

## 11. Referências e apêndices — capítulos 7 e 8

- Substituir modelos de referências por entradas efetivamente utilizadas, correspondentes às citações do DDE.
- Conferir autor, título, ano, URL e data de acesso nas fontes originais. Identificar a norma bibliográfica exigida pela instituição.
- Incluir diagramas originais legíveis e seus arquivos-fonte quando exigidos.
- Organizar evidências de testes por data, comando, ambiente e versão.
- Identificar os dados de homologação e sua origem.
- Entregar fonte e migrations por versão do repositório. Credenciais, certificados, chaves, banco local e documentos privados devem ficar fora dos apêndices públicos.

## 12. Redações sugeridas para os pontos principais

### Arquitetura atual

O Obra360 utiliza frontend React com TypeScript e Vite e uma API Java 21 com Spring Boot. O acesso é autenticado por JWT assinado, com sessões revogáveis registradas no banco e autorização baseada no cadastro do usuário. Os dados de cada empresa são isolados por filtros e relacionamentos. O perfil local utiliza H2 persistente, e a configuração de produção utiliza PostgreSQL com migrações Flyway.

### Auditoria atual

As operações previstas nos serviços operacionais geram registros de auditoria em tabela relacional. A interface autorizada permite consultar esses registros. O histórico funcional de RH preserva os dados funcionais rastreados, seus valores anteriores e novos e o motivo da alteração. A cobertura e as proteções de cada evento são descritas na matriz de requisitos.

### Integração fiscal atual

A integração fiscal consulta a situação e o protocolo de uma NF-e por chave de acesso, utilizando certificado A1 e o autorizador configurado. A importação de itens e o recebimento integrado a pedidos de compra permanecem como evolução do fluxo fiscal.

### RH atual

O módulo de RH permite administrar funcionários, estrutura organizacional, alocação, ponto, afastamentos, benefícios, capacitações, recrutamento, documentos privados e histórico funcional. A folha registra rubricas informadas pelo responsável e calcula seus totais. Cálculos fiscais/trabalhistas e integração com sistemas especializados precisam de escopo próprio.

### Modelador atual

O editor permite criar plantas 2D e vistas 3D a partir de elementos arquitetônicos. O usuário pode usar PDF ou imagem como referência, calibrar uma medida conhecida e traçar os elementos. Cada revisão salva pode guardar o arquivo original, a página, o pavimento e a escala. A leitura IFC e o armazenamento de documentos são recursos distintos da autoria do modelo.

### Evidências de qualidade

A validação identifica o comando executado, a versão do código, o banco utilizado e o resultado observado. Testes funcionais, de permissões, de geometria e de restauração constituem evidências para seus respectivos cenários. Aceite de empresa, desempenho com carga contratada, disponibilidade e revisão de segurança têm procedimentos e evidências próprios.

## 13. Ordem sugerida de correção

1. Confirmar com o professor as obrigações de NoSQL, broker e arquitetura e manter as pendências explícitas.
2. Corrigir afirmações factualmente incompatíveis, incluindo offline, conciliação fiscal completa, JWT sem sessões, MongoDB, caminhos e rotas.
3. Fechar a matriz dos 25 RF, 14 RNF e 20 RN com evidência e pendência por critério.
4. Atualizar o dicionário de dados e os diagramas a partir do código e do schema.
5. Acrescentar RH e o modelador versionado à ERS e ao manual.
6. Concluir manual, referências e apêndices.
7. Fazer uma revisão cruzada final entre texto, telas, rotas, schema e testes da versão entregue.
