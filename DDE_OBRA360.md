1 DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE)


1.1 INTRODUÇÃO

O setor da construção civil e do mercado imobiliário representa um dos principais motores econômicos globais, sendo responsável por parcelas expressivas do Produto Interno Bruto (PIB), pela geração maciça de empregos formais e pela estruturação da infraestrutura urbana. Contudo, historicamente, a indústria da construção civil enfrenta graves desafios decorrentes da fragmentação de dados, baixos índices de produtividade, assimetria de informações e falhas crônicas de comunicação entre os diversos agentes da cadeia produtiva, incluindo incorporadoras, construtoras, escritórios de engenharia e arquitetura, fornecedores de insumos, locadores de frotas pesadas, corretores de imóveis, investidores e clientes compradores das unidades.

A complexidade dessa gestão amplia-se consideravelmente no contexto de empresas que administram simultaneamente múltiplos empreendimentos, contratos, canteiros de obra, equipes operacionais e fornecedores. Em razão dessa diversidade contratual e logística, o acompanhamento do negócio exige não apenas a execução das rotinas de campo, mas também a coordenação rigorosa de informações sobre cronograma físico-financeiro, cálculo automatizado de insumos por metro quadrado ($C_{m^2}$), homologação de fornecedores B2B, conciliação fiscal de Notas Fiscais Eletrônicas (NFe), laudos regulatórios de segurança (NR-18) e qualidade (ISO 9001), espelhos de vendas imobiliárias e acompanhamento pós-obra. Todavia, quando esses fluxos são geridos de forma descentralizada por meio de planilhas locais, sistemas isolados e canais informais de mensagens, surgem gargalos como duplicidade de dados, falhas de comunicação, perda de histórico e baixa visibilidade gerencial.

A literatura científica e de mercado recente ratifica a importância da centralização da informação e da tecnologia nesse domínio. Conforme destacam a McKinsey & Company (2020) e a CBIC (2023), o setor enfrenta perdas históricas resultantes de baixa produtividade e falta de controle digital nos canteiros. Estudos de Lee, Irisboev e Ryu (2021) e Congiu et al. (2024) apontam que a gestão integrada de empreendimentos e instalações caracteriza-se por sua natureza complexa e estratégica, demandando volumes expressivos de dados integrados de origens heterogêneas para garantir que os projetos deem suporte contínuo às operações do negócio. Ademais, pesquisas recentes de Acampa e Pino (2023), Merino et al. (2023), Li et al. (2024), Barbosa et al. (2025) e Oliveira et al. (2026) enfatizam que a digitalização, a interoperabilidade de sistemas e o uso de inteligência artificial são fatores críticos para superar a formação de silos de dados e otimizar a eficiência no setor.

Diante desse cenário, o presente trabalho propõe o desenvolvimento do **Obra360 — Plataforma Corporativa Integrada da Construção Civil e Mercado Imobiliário**, uma aplicação web corporativa e ecossistema digital integrado (SaaS Multi-Tenant B2B/B2C) destinado a centralizar e integrar todo o ciclo de vida de um empreendimento imobiliário ou de infraestrutura. A solução engloba a viabilidade de terrenos, planejamento físico-financeiro, modelagem 2D/3D BIM, compras B2B por chave de acesso de Nota Fiscal Eletrônica (NFe de 44 dígitos), diário de obra com inteligência artificial, fiscalização de segurança e qualidade, comercialização de unidades, entrega formal de chaves e gestão de garantias pós-obra, promovendo maior rastreabilidade, eficiência e controle gerencial.


1.2 VISÃO GERAL DO DOCUMENTO

Este documento apresenta a definição de escopo do projeto Obra360, reunindo os objetivos, funcionalidades, requisitos, entregáveis, premissas, restrições, critérios de aceitação, exclusões e riscos relacionados ao projeto.

Sua finalidade é estabelecer os limites do sistema e orientar as etapas de modelagem de domínio (DDD), arquitetura de software (Clean Architecture e Hexagonal), desenvolvimento backend em Java Spring Boot, interface frontend em React/TypeScript, testes automatizados e implantação, mantendo as definições do projeto organizadas e alinhadas ao escopo proposto.


1.3 IDENTIFICAÇÃO DO PROJETO

Nome do Projeto: Obra360 - Plataforma Corporativa Integrada da Construção Civil e Mercado Imobiliário  
Autor(es): João Pedro e Marcos Henrique  
Instituição / Disciplina: Projeto Interdisciplinar de Engenharia de Software  
Professor Orientador: Prof. Dennys Cavalcanti Carvalho  


1.4 OBJETIVOS DO PROJETO

Objetivo Geral: Desenvolver uma solução web-based corporativa destinada a centralizar e integrar os processos relacionados à gestão de empreendimentos, planejamento físico-financeiro, modelagem espacial 2D/3D BIM, almoxarifado, cotações B2B com conciliação fiscal NFe, diário de obra, qualidade ISO 9001, segurança NR-18, vendas imobiliárias, atendimento ao proprietário, pós-venda e indicadores gerenciais da construção civil.

Objetivos Específicos:

● Identificar e modelar todos os processos de negócio relacionados à prestação de serviços e gestão de obras na construção civil.  
● Definir a linguagem ubíqua utilizada no domínio, estabelecendo termos comuns para representar os conceitos utilizados pelas construtoras, fornecedores e clientes pelo sistema.  
● Modelar entidades, objetos de valor (Value Objects imutáveis, como a validação da chave NFe de 44 dígitos), agregados, regras de negócio e eventos relevantes do domínio utilizando os princípios de Domain-Driven Design (DDD).  
● Projetar uma arquitetura baseada em Arquitetura Hexagonal e Clean Architecture, mantendo o domínio desacoplado de mecanismos externos de infraestrutura.  
● Desenvolver o gerenciamento de empresas multi-tenant, contratos, empreendimentos, vigências e níveis de serviço.  
● Implementar mecanismos de autenticação e autorização de usuários baseados em Tokens JWT.  
● Implementar controle de acesso baseado em perfis e permissões (RBAC).  
● Implementar comunicação e processamento assíncrono de eventos utilizando mecanismo de mensageria (EventBus / Apache Kafka).  
● Adotar um banco de dados relacional para os dados transacionais e estruturados do domínio.  
● Adotar um banco de dados não-relacional (NoSQL) para logs de auditoria e informações semiestruturadas.  
● Desenvolver visualizador de modelos 2D/3D BIM com extrusão espacial de plantas baixas.  
● Desenvolver módulo de almoxarifado com cálculo de insumos por metro quadrado ($C_{m^2}$) e controle de estoque mínimo.  
● Desenvolver módulo de cotações B2B e conciliação fiscal por chave NFe de 44 dígitos (Módulo 11 SEFAZ).  
● Desenvolver módulo de simulação financeira de vendas imobiliárias com amortização pelas tabelas SAC e PRICE corrigidas pelo INCC-M.  
● Desenvolver dashboard executivo com indicadores operacionais, financeiros, de estoque e curva S.  
● Desenvolver relatórios e mecanismos de consulta que auxiliem gestores no acompanhamento das operações.  
● Implementar mecanismos de monitoramento, health checks e resiliência.  
● Implementar testes automatizados para as regras de negócio e integrações do sistema.  
● Realizar a documentação técnica do sistema e a elaboração do manual do usuário.  


1.5 JUSTIFICATIVA

A gestão na construção civil envolve a coordenação contínua de serviços, recursos, pessoas e informações necessários ao funcionamento dos ambientes organizacionais e canteiros de obras. À medida que uma empresa passa a administrar diferentes clientes, contratos, unidades físicas e equipes, aumenta também a quantidade de informações que precisam ser registradas, atualizadas e compartilhadas entre os setores envolvidos. Nesse contexto, a qualidade da gestão depende não apenas da execução dos serviços, mas também da disponibilidade de informações que permitam acompanhar as operações e apoiar as decisões da organização. Conforme destacam Lee, Irisboev e Ryu (2021), o gerenciamento de instalações e projetos possui como propósito fundamental apoiar continuamente as necessidades da organização relacionadas aos recursos físicos e aos serviços de suporte, estando seu sucesso associado à capacidade das instalações e sistemas de apoiar as operações do negócio.

Entretanto, o gerenciamento dessas atividades pode ser prejudicado quando as informações necessárias aos processos encontram-se fragmentadas ou distribuídas entre diferentes fontes. Acampa e Pino (2023) apontam que o setor enfrenta problemas relacionados à incompletude e à heterogeneidade na transferência de informações entre os diferentes participantes envolvidos. Os autores também relacionam a indisponibilidade ou a estruturação inadequada dos dados a dificuldades na realização de escolhas adequadas sobre as intervenções necessárias nas obras. Esse cenário evidencia a importância da organização e da centralização das informações para que os responsáveis pelas operações tenham acesso a dados consistentes durante o gerenciamento dos serviços.

A fragmentação torna-se ainda mais relevante em ambientes nos quais diferentes funções e responsabilidades são distribuídas entre setores ou empresas terceirizadas. Merino et al. (2023) identificam que a terceirização de diferentes funções relacionadas às instalações e obras pode resultar na formação de silos de dados, nos quais as informações permanecem isoladas sob responsabilidade de diferentes prestadores. Segundo os autores, o acesso às informações pode ocorrer por meio de relatórios, portais, e-mails ou processos burocráticos, dificultando uma visão integrada das operações. Essa situação apresenta relação direta com o problema abordado pelo projeto, uma vez que construtoras e incorporadoras precisam administrar simultaneamente informações provenientes de clientes, contratos, unidades, solicitações, ordens de serviço, equipes, materiais, fornecedores, compras, custos e vendas.

Além da fragmentação, a própria natureza das informações utilizadas na gestão da construção representa um desafio. Congiu et al. (2024) caracterizam o gerenciamento de obras como uma disciplina estratégica e complexa que requer grande quantidade de dados e informações integrados e estruturados, provenientes de origens e naturezas heterogêneas. De maneira semelhante, estudos recentes continuam identificando problemas de integração nesse domínio. Li et al. (2024), Barbosa et al. (2025) e Oliveira et al. (2026) destacam, no contexto da gestão corporativa e de engenharia, problemas persistentes relacionados a silos de dados, interoperabilidade ineficiente das informações e falta de coordenação dos fluxos de trabalho, propondo uma plataforma integrada de gestão como forma de enfrentar essas limitações.

Nesse contexto, a centralização e a integração das informações podem contribuir não apenas para reduzir a dispersão dos dados entre diferentes processos, mas também para estruturar informações necessárias ao acompanhamento gerencial das operações. Os dados originados durante a execução dos serviços poderão contribuir para o acompanhamento de indicadores relacionados, por exemplo, ao andamento das ordens de serviço, ao cumprimento dos níveis de serviço estabelecidos em contrato, à utilização de recursos, às movimentações de estoque, às vendas imobiliárias e aos custos operacionais. Dessa forma, informações produzidas pelos diferentes processos podem ser utilizadas de maneira consolidada para ampliar a visibilidade sobre as operações realizadas.

Diante desse cenário, justifica-se o desenvolvimento do **Obra360 — Plataforma Corporativa Integrada da Construção Civil e Mercado Imobiliário** como uma solução corporativa destinada à centralização e à integração dos principais processos envolvidos na prestação de serviços e gestão da construção. O sistema pretende reunir, em um ambiente único, informações relacionadas a clientes, unidades, contratos, serviços, solicitações, ordens de serviço, equipes e profissionais, materiais e equipamentos, estoque, fornecedores, compras, vendas e custos operacionais. Ao mesmo tempo, a solução preservará as responsabilidades específicas de cada setor (RBAC), permitindo que os processos sejam integrados quando houver dependências de negócio. Dessa forma, a proposta do Obra360 está diretamente relacionada aos problemas de fragmentação, heterogeneidade e isolamento das informações apontados pela literatura recente sobre gestão de instalações e engenharia de software.


1.6 IDENTIFICAÇÃO DOS REQUISITOS

Por convenção, os requisitos são referenciados pelo nome da subseção onde estão descritos, seguido do seu identificador, conforme o esquema abaixo:

● O requisito funcional [Cadastro de Usuários.RF-01] está localizado na subseção “Requisitos Funcionais”, dentro do bloco identificado como [RF-01].  
● O requisito não funcional [Disponibilidade.NF-04] encontra-se na seção “Requisitos Não Funcionais de Confiabilidade”, no bloco identificado como [NF-04].  

1.6.1 Prioridades dos Requisitos
Os requisitos do sistema são classificados em três níveis de prioridade:

● Essencial: indispensável para o funcionamento do sistema. Sem ele, o sistema não opera. Deve ser obrigatoriamente implementado.  
● Importante: afeta a qualidade do funcionamento. O sistema pode ser utilizado sem esse requisito, mas de forma insatisfatória. Sua implementação é recomendada.  
● Desejável: não interfere nas funcionalidades básicas. O sistema funciona bem sem ele. Pode ser incluído em versões futuras, caso não haja tempo para implementá-lo na versão atual.  


1.7 ESCOPO DO PRODUTO E ENTREGÁVEIS

1.7.1 Funcionalidades Previstas

Gestão de Identidade e Acesso
● Cadastro e gerenciamento de usuários.  
● Autenticação de usuários via Tokens JWT.  
● Recuperação de acesso.  
● Gerenciamento de perfis.  
● Gerenciamento de permissões.  
● Controle de acesso baseado em funções (RBAC).  
● Registro de atividades relevantes dos usuários.  
● Auditoria de operações críticas.  

Gestão de Clientes e Unidades (Multi-Tenant)
● Cadastro de empresas clientes e construtoras.  
● Gestão multi-tenant com isolamento lógico de dados.  
● Alteração de dados cadastrais.  
● Consulta de clientes e empresas.  
● Inativação de clientes.  
● Cadastro de unidades físicas e empreendimentos.  
● Associação de unidades às empresas clientes.  
● Consulta das informações relacionadas a cada unidade.  

Gestão de Contratos e Serviços
● Cadastro de contratos.  
● Associação de contratos aos clientes.  
● Associação de contratos às unidades.  
● Definição do período de vigência.  
● Registro de valores contratuais.  
● Cadastro e associação de serviços contratados.  
● Definição de níveis de atendimento.  
● Controle de informações relacionadas ao SLA.  
● Acompanhamento da situação dos contratos.  
● Identificação de contratos próximos ao vencimento.  

Gestão de Solicitações e Ocorrências
● Registro de solicitações.  
● Registro de ocorrências (ISO 9001 e NR-18).  
● Associação das solicitações ao cliente e à unidade.  
● Classificação por prioridade e severidade.  
● Registro da data de abertura.  
● Acompanhamento do status.  
● Associação da solicitação ao contrato e serviço aplicável.  
● Controle dos prazos relacionados ao SLA.  

Gestão de Ordens de Serviço e Cronograma
● Criação de ordens de serviço.  
● Associação das ordens às solicitações.  
● Definição de prioridade.  
● Associação a clientes e unidades.  
● Associação a serviços.  
● Distribuição para equipes.  
● Atribuição de profissionais.  
● Registro do início da execução.  
● Registro das atividades realizadas.  
● Registro de materiais utilizados.  
● Alteração de status.  
● Encerramento da ordem de serviço.  
● Registro do histórico de alterações.  
● Identificação de ordens atrasadas.  
● Controle do cumprimento dos prazos estabelecidos (Curva S).  

Gestão de Pessoas e Equipes
● Cadastro de funcionários e colaboradores.  
● Cadastro de cargos.  
● Cadastro de especialidades.  
● Cadastro de equipes.  
● Associação de profissionais às equipes.  
● Controle de alocações.  
● Registro de informações necessárias à execução das operações.  
● Consulta de profissionais e equipes disponíveis.  

Gestão de Estoque e Ativos
● Cadastro de materiais e insumos por código SKU.  
● Cadastro de equipamentos e frotas.  
● Controle de estoque.  
● Registro de entradas.  
● Registro de saídas.  
● Registro de transferências entre almoxarifados.  
● Controle de estoque mínimo.  
● Identificação de itens com estoque baixo.  
● Associação de materiais utilizados às operações ($C_{m^2}$).  
● Registro de movimentações.  
● Histórico das movimentações de estoque.  

Gestão de Compras e Fornecedores B2B
● Cadastro de fornecedores.  
● Consulta de fornecedores.  
● Registro de solicitações de compra.  
● Registro de necessidades de materiais.  
● Registro de cotações B2B.  
● Comparação de cotações (leilão reverso).  
● Recepção e validação de chaves de acesso NFe de 44 dígitos (Módulo 11 SEFAZ).  
● Registro de pedidos de compra.  
● Acompanhamento da situação dos pedidos.  
● Associação dos pedidos aos fornecedores.  
● Integração com o processo de estoque após recebimento.  

Gestão de Custos e Vendas Imobiliárias
● Registro de custos associados às operações.  
● Registro de despesas relacionadas aos serviços.  
● Consulta de informações de custos.  
● Relacionamento entre custos, operações e contratos.  
● Gestão do espelho de vendas e simulação de amortização SAC/PRICE (360 meses) com INCC-M.  
● Disponibilização de informações de custos para indicadores gerenciais.  

Comunicação e Eventos
● Geração de notificações.  
● Registro de eventos relevantes do sistema.  
● Comunicação entre componentes da aplicação por meio de mensageria (EventBus / Kafka).  
● Processamento assíncrono de determinados eventos.  
● Notificações relacionadas a operações importantes.  
● Notificações relacionadas a prazos e situações críticas.  
● Chat B2B corporativo e assistente preditivo com IA Generativa (Gemini IA).  

Auditoria
● Registro de operações críticas.  
● Identificação do usuário responsável pela alteração.  
● Registro da data e hora da operação.  
● Identificação da entidade modificada.  
● Registro do valor anterior quando aplicável.  
● Registro do novo valor quando aplicável.  
● Consulta do histórico de alterações.  

Dashboard e Inteligência de Dados
● Dashboard executivo.  
● Indicadores de operações.  
● Indicadores de contratos.  
● Indicadores de SLA.  
● Indicadores de estoque.  
● Indicadores de equipes.  
● Indicadores de custos quando aplicável.  
● Consulta consolidada de informações.  
● Geração de relatórios gerenciais.  
● Visualização gráfica dos principais indicadores.  

Monitoramento e Resiliência
● Disponibilização de health checks.  
● Monitoramento da disponibilidade de componentes relevantes.  
● Tratamento de falhas de dependências externas.  
● Implementação de estratégias de circuit breaker.  
● Registro e monitoramento de erros relevantes.  
● Suporte PWA offline-first para operação em canteiro de obras.  

Integração
● Exposição de serviços por APIs REST.  
● Consumo de serviços externos quando necessário (SEFAZ, S3, IBGE/FGV).  
● Comunicação assíncrona por meio de broker de mensagens.  
● Possibilidade de interoperabilidade com sistemas legados por meio de protocolos padronizados.  

1.7.2 Entregáveis

● Código-fonte completo do Obra360.  
● Repositório versionado com link de acesso e histórico de commits.  
● Backend desenvolvido em Java utilizando o framework Spring Boot.  
● Frontend desenvolvido utilizando tecnologia web baseada em TypeScript e React.  
● Banco de dados relacional configurado e modelado (PostgreSQL com Flyway).  
● Banco de dados NoSQL integrado para armazenamento complementar (Auditoria).  
● Configuração de mensageria para comunicação entre serviços.  
● Configuração de autenticação e autorização utilizando segurança robusta baseada em Tokens JWT.  
● Configuração de auditoria para rastreamento de ações e segurança.  
● Testes automatizados acompanhados dos logs para auditagem.  
● Diagramas UML com toda a modelagem do projeto (Casos de Uso, DER e C4 Model).  
● Documentação de domínio e DDD demonstrando todas as regras.  
● Documentação da Arquitetura Hexagonal detalhando a macroestrutura.  
● Scripts de banco de dados e/ou migrações organizados.  
● Configurações de execução utilizando Docker para portabilidade de ambiente.  
● Manual do usuário sequencial, didático e sem termos técnicos complexos.  
● Documentação dos requisitos funcionais e não funcionais detalhados.  
● Versão implantada em ambiente de homologação para validação e testes.  


1.8 PREMISSAS E RESTRIÇÕES

1.8.1 Premissas
● Os usuários possuirão credenciais adequadas para acesso ao sistema.  
● Os usuários serão associados a perfis e permissões de acordo com suas responsabilidades (RBAC).  
● Os dados cadastrados pelos usuários representarão informações válidas do contexto empresarial.  
● Os clientes possuirão contratos que definirão os serviços e condições de atendimento aplicáveis.  
● As operações serão executadas de acordo com as regras estabelecidas nos contratos.  
● Os serviços poderão possuir diferentes níveis de prioridade e atendimento.  
● Os dados necessários ao funcionamento dos módulos estarão disponíveis para cadastro ou integração.  
● O sistema será inicialmente disponibilizado como aplicação web com suporte PWA.  
● O sistema será desenvolvido considerando utilização em computadores e dispositivos móveis via navegador.  
● Os serviços de infraestrutura utilizados durante o desenvolvimento e homologação estarão disponíveis conforme suas respectivas configurações.  
● O sistema utilizará mecanismos externos de identidade quando definido na arquitetura final.  
● Os componentes de mensageria, bancos de dados e serviços necessários estarão disponíveis no ambiente de execução.  

1.8.2 Restrições
● O projeto deverá ser desenvolvido dentro do período estabelecido pela disciplina.  
● O projeto deverá atender aos requisitos obrigatórios definidos pela disciplina.  
● O backend será desenvolvido utilizando Java e Spring Boot.  
● A solução deverá utilizar Arquitetura Hexagonal e Clean Architecture.  
● A modelagem do domínio deverá considerar os princípios de Domain-Driven Design (DDD).  
● O sistema deverá utilizar banco de dados relacional e banco de dados NoSQL.  
● O sistema deverá utilizar mecanismo de mensageria por broker.  
● O sistema deverá possuir autenticação e autorização stateless por JWT.  
● O sistema deverá possuir mecanismos de auditoria imutável.  
● O sistema deverá possuir testes automatizados.  
● O sistema deverá possuir mecanismos de health check e resiliência.  
● O sistema será inicialmente desenvolvido como aplicação web.  
● A infraestrutura de produção definitiva poderá ser limitada pelos recursos disponíveis para o projeto.  
● A implementação de integrações externas dependerá da disponibilidade e das especificações das APIs ou serviços utilizados.  


1.9 CRITÉRIOS DE ACEITAÇÃO DO PROJETO

● O sistema deverá executar suas funcionalidades principais sem apresentar falhas críticas que impeçam sua utilização.  
● O sistema deverá possuir Front-End e Back-End integrados.  
● O sistema deverá permitir a execução dos CRUDs definidos nos requisitos.  
● O sistema deverá possuir autenticação e autorização funcionando.  
● O sistema deverá possuir controle de acesso baseado em perfis e permissões.  
● O sistema deverá possuir mecanismos de auditoria para operações relevantes.  
● O sistema deverá utilizar banco de dados relacional.  
● O sistema deverá utilizar banco de dados NoSQL.  
● O sistema deverá possuir mecanismo de mensageria baseado em broker.  
● O sistema deverá possuir integração entre os principais contextos de negócio.  
● O sistema deverá possuir dashboard executivo com indicadores relevantes.  
● O sistema deverá possuir health check.  
● O sistema deverá possuir estratégia de circuit breaker para os cenários definidos na arquitetura.  
● O sistema deverá possuir testes automatizados.  
● O sistema deverá possuir documentação técnica.  
● O sistema deverá possuir manual do usuário.  
● O código-fonte deverá estar organizado e versionado em repositório.  
● Os requisitos obrigatórios estabelecidos pela disciplina deverão estar implementados ou demonstrados conforme os critérios de avaliação definidos pelo professor.  


1.10 EXCLUSÕES DO ESCOPO

● Não será desenvolvido aplicativo mobile nativo para Android ou iOS.  
● Funcionamento completo do sistema sem conexão com a internet por prazos prolongados.  
● Controle físico de acesso às instalações (catracas/hardware).  
● Desenvolvimento de equipamentos IoT próprios.  
● Recrutamento e seleção de funcionários.  
● Contabilidade empresarial completa e apuração fiscal tributária de impostos federais.  
● Emissão direta de documentos fiscais perante a SEFAZ.  
● Sistema bancário ou processamento de pagamentos diretamente na plataforma.  
● Gestão jurídica completa de contratos.  
● Desenvolvimento de um ERP completo de escopo geral.  
● Marketplace genérico de fornecedores não relacionados à construção civil.  
● Desenvolvimento de um sistema completo de compras para empresas externas.  
● Funcionalidades não relacionadas ao domínio da construção civil, incorporação imobiliária e gestão de obras.  


1.11 STAKEHOLDERS ENVOLVIDOS

Desenvolvedores: João Pedro e Marcos Henrique  
Professor orientador: Prof. Dennys Cavalcanti Carvalho  
Testers: Equipe de testes e avaliação acadêmica  
Usuários: Diretores, gestores, supervisores, engenheiros residentes, mestres de obra, almoxarifes, profissionais de compras, profissionais financeiros, corretores de imóveis e representantes das empresas clientes.  


1.12 RISCOS INICIAIS

● Mudanças ou expansão do escopo durante o desenvolvimento.  
● Alto volume de dados gerados pela auditoria.  
● Limitações de desempenho com o crescimento da quantidade de dados e usuários.  
● Dependência de serviços e ferramentas externas.  
● Limitações relacionadas ao armazenamento e processamento de arquivos grandes.  
● Limitações de recursos na infraestrutura de homologação.  
● Limitações do prazo acadêmico para desenvolvimento de todas funcionalidades.  
