# DOCUMENTO DE DEFINIÇÃO DE ESCOPO (DDE) — VERSÃO 3.4 (INTRODUÇÃO E CICLO DE VIDA EXPANDIDOS)

**Nome do Projeto:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário  
**Instituição de Ensino:** AESA-CESA (2026) — Projeto Interdisciplinar de Engenharia de Software  
**Autores (Desenvolvedores):** João Pedro e Marcos Henrique  
**Professor Orientador:** Prof. Dennys Carvalho  
**Versão:** 3.4 (Versão com Seção de Introdução, Ciclo de Vida End-to-End e Pós-Venda Expandidos)  
**Data de Emissão:** 17/09/2026  

---

## 1. INTRODUÇÃO E CONTEXTUALIZAÇÃO DO PROBLEMA

### 1.1 Introdução, Visão de Futuro e a Revolução da Construção 4.0
O setor da construção civil e do mercado imobiliário representa uma das engrenagens mais vitais da economia mundial e nacional, impactando diretamente o Produto Interno Bruto (PIB), a geração de empregos formais e informais, a arrecadação tributária e o desenvolvimento da infraestrutura urbana e social. Segundo dados consolidados da consultoria internacional McKinsey & Company e da Câmara Brasileira da Indústria da Construção (CBIC), a cadeia global da construção movimenta anualmente mais de **US$ 12 trilhões**, sendo responsável por cerca de 13% do PIB mundial e pela estruturação do ambiente construído de todas as cidades modernas.

Entretanto, historicamente, a indústria da construção civil é reconhecida como uma das menos digitalizadas e com menores índices de avanço de produtividade da economia global. Enquanto setores como a manufatura avançada e a tecnologia da informação registraram crescimentos contínuos de produtividade superiores a 2,8% ao ano nas últimas duas décadas, a construção civil estagnou em taxas inferiores a 1% ao ano. Essa baixa eficiência decorre de uma profunda fragmentação de dados, assimetria de informações entre os agentes do setor, uso de ferramentas informais descentralizadas (planilhas locais, e-mails e mensagens instantâneas sem auditabilidade) e severa falta de integração entre as fases de projeto, suprimentos, execução física e pós-venda.

No contexto contemporâneo, à medida que os conceitos de *Smart Cities* (Cidades Inteligentes), Construção 4.0, industrialização de componentes pré-moldados e a metodologia BIM (*Building Information Modeling*) ganham tração mundial, surge a urgência inadiável de transformar a gestão das obras civis. O ecossistema moderno da construção exige que a informação navegue de forma transparente, íntegra, segura e instantânea entre o canteiro de obras, os escritórios de engenharia/arquitetura, os centros de distribuição de suprimentos B2B, as instituições financeiras, os corretores de imóveis e os clientes compradores das unidades imobiliárias.

O **Obra360** surge exatamente para suprir essa lacuna histórica. Projetado sob os mais rigorosos preceitos da Engenharia de Software Corporativa, da Ciência de Dados e da Gestão da Qualidade, a solução consolida-se como uma **Plataforma Corporativa Web e Ecossistema Digital Integrado (SaaS Multi-Tenant B2B/B2C)**. O sistema centraliza, automatizes, desburocratiza e confere rastreabilidade auditável imutável a todas as etapas do ciclo de vida de um empreendimento imobiliário ou de infraestrutura urbana. A plataforma abrange desde a concepção inicial da oportunidade e estudo de viabilidade técnica e financeira do terreno, passando pelo planejamento físico-financeiro detalhado, modelagem espacial 2D/3D BIM, cotações B2B automatizadas por integração com Nota Fiscal Eletrônica (NFe SEFAZ), diário de obra inteligente com auxílio de Inteligência Artificial Generativa (Gemini IA), fiscalização de segurança do trabalho (NR-18) e qualidade (ISO 9001), comercialização de unidades com espelho de vendas e simulador financeiro de 360 meses (SAC/PRICE com INCC-M), até a entrega formal das chaves e a gestão contínua de garantias pós-obra (ABNT NBR 15575 e NBR 14037 com SLA de 24 horas).

---

### 1.2 Visão Geral e Estrutura do Documento de Definição de Escopo (DDE)
Este Documento de Definição de Escopo (DDE v3.4) atua como a especificação técnica formal e o contrato arquitetural do sistema Obra360. Ele formaliza os limites operacionais, as responsabilidades de software, a modelagem de dados e as diretrizes de desenvolvimento para o projeto de Engenharia de Software desenvolvido no âmbito da instituição AESA-CESA (2026).

A elaboração deste documento e a especificação de seus requisitos orientam-se estritamente pelos padrões internacionais de Engenharia de Requisitos estabelecidos pelas normas:
- **IEEE Std 830-1998:** *Recommended Practice for Software Requirements Specifications*, garantindo clareza, rastreabilidade, consistência, verficabilidade e modificabilidade dos requisitos.
- **ISO/IEC/IEEE 29148:2018:** *Systems and software engineering — Life cycle processes — Requirements engineering*, estabelecendo uma estrutura rigorosa para o ciclo de vida dos requisitos de software corporativos.

O documento é organizado de forma modular e lógica nas seguintes seções fundamentais:
1. **Introdução e Contextualização do Problema:** Objetivos, visão geral, ciclo de vida end-to-end, justificativa mercadológica, premissas, restrições, critérios de aceitação, exclusões de escopo, stakeholders e matriz de riscos.
2. **Justificativa e Fundamentação Teórica, Mercadológica e Tecnológica:** Análise macroeconômica, dados estatísticos (McKinsey, CBIC, IBGE, FGV IBRE), dores estruturais, modelos matemáticos ($C_{m^2}$, Curva S, SEFAZ Módulo 11, SAC/PRICE) e fundamentação de arquitetura de software (Clean Architecture, DDD, PubSub).
3. **Mapeamento de Requisitos Funcionais (RF-01 a RF-30):** Detalhamento exaustivo dos 30 requisitos funcionais organizados por módulos do sistema.
4. **Catálogo de Regras de Negócio (RN-01 a RN-50):** Especificação das 50 regras de negócio impositivas que regem os cálculos, validações e fluxos de trabalho.
5. **Requisitos Não-Funcionais e Atributos de Qualidade (RNF-01 a RNF-15):** Especificações de desempenho, segurança RBAC/LGPD, disponibilidade, manutenibilidade e usabilidade.
6. **Modelagem Arquitetural e Estruturação de Dados:** Diagramas C4 Model (Contexto, Contêiner e Componente), Diagrama de Entidade-Relacionamento (DER/MER) e Matriz de Permissões RBAC.
7. **Matriz de Rastreabilidade e Encerramento:** Mapeamento bidirecional entre requisitos, regras de negócio e componentes de código.

---

### 1.3 Identificação do Projeto e Informações Institucionais
- **Nome do Projeto:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário
- **Instituição de Ensino:** AESA-CESA (2026) — Projeto Interdisciplinar de Engenharia de Software
- **Autores / Desenvolvedores:** João Pedro e Marcos Henrique
- **Professor Orientador:** Prof. Dennys Carvalho
- **Natureza Tecnológica:** Plataforma Corporativa Web / Software as a Service (SaaS Multi-Tenant B2B/B2C)
- **Versão do Documento:** Versão 3.4 (Versão Totalmente Ampliada com Seção 1 Explicitada e Reestruturada)
- **Data de Emissão:** 17/09/2026

---

### 1.4 Objetivos do Projeto

#### 1.4.1 Objetivo Geral
Projetar, arquitetar, implementar, testar e validar uma plataforma corporativa web e ecossistema digital integrado Multi-Tenant para a Construção Civil e Mercado Imobiliário, fundamentada nos princípios da *Clean Architecture*, *Domain-Driven Design (DDD)* e *Event-Driven Architecture (PubSub)*, visando centralizar a gestão técnica, logística, financeira, tributária, regulatória e comercial de empreendimentos imobiliários e obras de infraestrutura durante todo o seu ciclo de vida.

#### 1.4.2 Objetivos Específicos
1. **Engenharia de Requisitos Rigorosa:** Elicitar, analisar, estruturar e documentar 30 Requisitos Funcionais, 50 Regras de Negócio e 15 Requisitos Não-Funcionais em estreita conformidade com as normas IEEE Std 830 e ISO/IEC/IEEE 29148.
2. **Clean Architecture em 4 Camadas Desacopladas:** Construir o núcleo da aplicação backend em Java (Spring Boot) segregado rigorosamente nas camadas *Domain*, *Use Cases/Application*, *Adapters/Infrastructure* e *Presentation/UI*, garantindo independência de frameworks e facilidade de testes unitários.
3. **Barramento de Mensageria Assíncrona (PubSub / EventBus):** Implementar um barramento de eventos assíncronos não-bloqueantes para notificação em tempo real de movimentações de estoque, alertas de estoque mínimo SKU, aprovações de pranchas de projeto e marcos do cronograma físico.
4. **Modelagem de Domínio DDD RICA:** Estruturar o modelo de dados em entidades ricas com comportamentos encapsulados, *Value Objects* imutáveis (como a validação fiscal de chave NF-e), *Aggregates* bem delimitados e padrões *Repository* e *Factory*.
5. **Módulo de Almoxarifado & Conciliação Fiscal SEFAZ (Módulo 11):** Desenvolver controle de estoque em tempo real com recepção de arquivos XML de Notas Fiscais Eletrônicas (NF-e/CT-e) e validação matemática do Dígito Verificador através do algoritmo Módulo 11 da SEFAZ.
6. **Suporte Operacional a 9 Tipologias de Empreendimentos:** Prover motor de configuração capaz de gerenciar obras de Casas Residenciais, Condomínios Fechados, Prédios & Edifícios, Hospitais & Saúde, Galpões Logísticos, Túneis, Energia Solar, Infraestrutura & Pontes e Empreendimentos Comerciais/Industriais.
7. **Fiscalização ISO 9001 e Laudos de Segurança NR-18:** Criar módulo de registro de ocorrências técnicas no canteiro com foto em tempo real, geolocalização, responsável atribuído, severidade (Alta, Média, Baixa) e checklist de conformidade regulatória com a norma NR-18.
8. **Portal do Proprietário & Diário Transparente de Obra:** Disponibilizar canal de comunicação transparente para clientes compradores e investidores acompanharem o avanço físico percentual, relatórios de Curva S, galeria de fotos do canteiro e cronograma atualizado.
9. **Storefront Imobiliário B2C & Simulador Financeiro de 360 Meses:** Implementar vitrine pública com espelho de vendas interativo e calculadora de amortização pelas tabelas SAC e PRICE com correção monetária pelo INCC-M (FGV IBRE).
10. **Entrega Digital de Chaves e Pós-Venda (NBR 15575 / NBR 14037):** Estruturar processo digital de vistoria técnica, aceite de chave com assinatura digital, entrega do Manual do Proprietário e gestão de chamados de assistência técnica pós-obra com SLA de 24 horas.
11. **Design System Responsivo com Suporte a Temas (Dark / Light Mode):** Desenvolver interface web adaptável baseada em Tailwind CSS e TypeScript/React, com alternância de modo escuro e claro mantida em armazenamento local e suporte PWA offline-first.
12. **Central de Comunicação B2B (Chat Corporativo):** Implementar módulo de mensagens instantâneas entre engenheiros residentes, almoxarifados, fornecedores de insumos, locadores de frotas e corretores de imóveis.

---

### 1.5 Justificativa Teórica, Mercadológica e Tecnológica
A indústria da construção civil é historicamente reconhecida como uma das menos digitalizadas do mundo. De acordo com estudo global da consultoria McKinsey & Company (2020), o setor registrou crescimento de produtividade de apenas **1% ao ano** nas últimas duas décadas, em forte contraste com os 2,8% da manufatura global. No Brasil, indicadores da Câmara Brasileira da Indústria da Construção (CBIC, 2023) apontam que **até 8% do custo total de uma obra é perdido** devido a retrabalhos no canteiro, desperdício de materiais por falta de controle de estoque e atrasos provocados pela falta de compatibilização entre projetos.

O **Obra360** justifica-se pelo seu elevado impacto na solução dessas dores estruturais. Ao substituir o modelo arcaico e pulverizado de planilhas locais, e-mails desconexos e conversas de WhatsApp sem auditoria por uma **Plataforma Corporativa Centralizada**, o sistema alcança:
- **Redução de até 40% no Tempo de Homologação de Suprimentos:** Através de requisições de compras integradas e leilão reverso B2B diretamente conectado a fornecedores homologados.
- **Eliminação de Execução baseada em Projetos Obsoletos:** Garantindo que apenas pranchas de projeto aprovadas e versionadas estejam disponíveis para visualização no canteiro de obras.
- **Segurança Fiscal e Jurídica:** Validando matematicamente cada chave de acesso de Nota Fiscal Eletrônica (NF-e) recebida e registrando de forma imutável todas as evidências de conformidade com as normas ABNT NBR 15575 e NR-18.
- **Previsibilidade Financeira e Transparência com o Cliente Final:** Proporcionando visibilidade do cronograma físico-financeiro para diretores, investidores e proprietários finais.

---

### 1.6 Identificação dos Requisitos e Critérios de Priorização

#### 1.6.1 Convenção de Nomenclatura dos Requisitos
Por convenção padronizada de Engenharia de Software, os requisitos e elementos do sistema são identificados de forma única pelo seu identificador entre colchetes:
- O requisito funcional `[Cadastro de Usuários.RF-01]` localiza-se no bloco `[RF-01]` do módulo de Gestão de Identidades.
- O requisito não funcional `[Disponibilidade.RNF-04]` localiza-se na seção de Confiabilidade no bloco `[RNF-04]`.
- A regra de negócio `[Conciliação Fiscal.RN-12]` refere-se à décima segunda regra de domínio da aplicação.

#### 1.6.2 Níveis de Prioridade dos Requisitos (Classificação MoSCoW / NBR/IEEE)
Os requisitos do sistema são classificados em 3 níveis rigorosos de priorização:
1. **Essencial (Must Have):** Funcionalidades indispensáveis e de execução obrigatória. A ausência de um requisito essencial inviabiliza a operação do sistema (ex: Autenticação Multi-tenant, Almoxarifado, Validação Módulo 11 SEFAZ).
2. **Importante (Should Have):** Funcionalidades que agregam elevado valor operacional e de usabilidade. O sistema pode funcionar sem elas em caráter de contingência, mas com prejuízo de eficiência (ex: Visualizador BIM 3D WebGL, Chat Corporativo B2B, Simulador SAC/PRICE).
3. **Desejável (Could Have):** Funcionalidades complementares que agregam refinamento à experiência do usuário, podendo ser implementadas em iterações futuras sem comprometer o núcleo da plataforma (ex: assistente preditivo Gemini IA, exportações avançadas).

---

### 1.7 Escopo do Produto e Entregáveis Tangíveis

#### 1.7.1 Funcionalidades Previstas no Produto
1. **Gestão Multi-Empresas (SaaS Multi-Tenant B2B/B2C):** Cadastro e comutação instantânea entre organizações corporativas com verificação de CNPJ (Construtoras, Projetistas, Fornecedores, Locadoras e Imobiliárias).
2. **Motor de Configuração para 9 Tipologias de Empreendimentos:** Suporte técnico para Casas, Condomínios Fechados, Edifícios, Hospitais, Galpões, Túneis, Solar, Infraestrutura e Comercial.
3. **Fiscalização de Ocorrências ISO 9001 e Laudos NR-18:** Registro de não-conformidades técnicas no canteiro com foto, responsável atribuído, classificação de severidade e checklists de segurança.
4. **Controle de Almoxarifado & Conciliação NFe SEFAZ:** Gestão de movimentações por SKU com alertas de estoque mínimo e leitura de XML de Nota Fiscal com algoritmo Módulo 11.
5. **Marketplace B2B (Cotações RFQ & Frotas Pesadas):** Emissão de solicitações de cotação com comparativo de fornecedores e contratação de equipamentos pesados.
6. **Chat Corporativo B2B:** Central de mensagens instantâneas para integração em tempo real de equipes de campo, suprimentos, fornecedores e vendas.
7. **Portal do Proprietário & Diário Transparente de Obra:** Espaço exclusivo para acompanhamento do avanço físico, fotos do canteiro e documentos do empreendimento.
8. **Gestão de Garantias Pós-Venda (ABNT NBR 15575 / NBR 14037):** Central de chamados de assistência técnica com SLA de 24 horas e classificação por subsistemas construtivos.
9. **Barramento de Mensageria Event-Driven (PubSub):** Disparo assíncrono de eventos de negócio com alertas visuais (*Toasts*) integrados na interface.
10. **Matriz de Permissões RBAC (15 Perfis IAM):** Controle de acesso granular por papel de usuário (Super Admin, Engenheiro, Arquiteto, Almoxarife, Cliente, etc.).
11. **Design System Responsivo com Suporte a Temas (Dark/Light Mode):** Interface moderna em Tailwind CSS com alternância persistente entre Modo Escuro e Claro.
12. **Storefront Imobiliário & Simulador de Financiamento:** Vitrine pública de vendas de unidades com espelho em tempo real e simulação habitacional pelas tabelas SAC e PRICE com INCC-M.

#### 1.7.2 Entregáveis Tangíveis (Acadêmicos e Técnicos)
1. **Código-Fonte Completo do Projeto:** Repositório oficial no GitHub contendo backend Java Spring Boot, frontend React TypeScript Vite, scripts DDL de banco de dados e testes automáticos.
2. **Documentação de Engenharia de Software (DDE v3.4):** Especificação completa contendo requisitos, regras de negócio, diagramas C4 Model (Níveis 1 a 3), DER/MER, Matriz RBAC e Rastreabilidade.
3. **Sistema Funcional Implantado (Staging/Demonstração):** Aplicação executável e acessível pronta para avaliação funcional e homologação técnica.
4. **Relatório Técnico e Manual do Usuário:** Documento contendo arquitetura, modelos de uso, guia de rotas OpenAPI/Swagger e instruções de implantação.

---

### 1.8 Premissas e Restrições do Projeto

#### 1.8.1 Premissas do Projeto
1. **Disponibilidade de Dispositivos e Navegadores Modernos:** Assume-se que os usuários operam navegadores modernos (Chrome, Edge, Safari, Firefox) com suporte nativo a aceleração gráfica WebGL para renderização 3D.
2. **Interesse na Adoção do Ecossistema Multi-Tenant:** Assume-se haver adesão de construtoras, fornecedores de insumos e imobiliárias em utilizar a plataforma para transações corporativas B2B/B2C.
3. **Uso de Dispositivos Móveis no Canteiro (PWA):** Assume-se que a equipe de campo utilizará smartphones ou tablets para registrar ocorrências, fotos e apontamentos de diário de obra.
4. **Conectividade Intermitente e Sincronização Assíncrona:** Assume-se que os dados capturados offline no canteiro serão armazenados localmente e sincronizados assincronamente assim que a conexão for reestabelecida.
5. **Manutenção de Dados Atualizados por Parceiros B2B:** Assume-se que fornecedores e locadoras manterão suas tabelas de preços, insumos e frotas atualizadas no marketplace.
6. **Conformidade Legal com a LGPD:** Assume-se que o tratamento de dados pessoais de clientes e usuários estará respaldado pelas diretrizes da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

#### 1.8.2 Restrições do Projeto
1. **Prazo Limite Acadêmico:** O desenvolvimento, testes e validação da plataforma devem ser concluídos impreterivelmente dentro do calendário acadêmico da disciplina (AESA-CESA 2026).
2. **Escopo Inicial Exclusivamente Web / PWA:** O sistema será entregue como aplicação web responsiva e Progressive Web App (PWA), sem publicação inicial em lojas nativas de aplicativos (App Store / Google Play).
3. **Arquitetura Obrigatória (Clean Architecture & DDD):** O código backend deve obedecer estritamente aos preceitos da Arquitetura Limpa em 4 camadas desacopladas e modelagem orientada a domínio (DDD).
4. **Comunicação Assíncrona e Mensageria PubSub:** As notificações e chamadas inter-serviços devem ser gerenciadas assincronamente via barramento EventBus/PubSub.
5. **Restrição Orçamentária e Licenciamento Open Source:** O desenvolvimento utilizará exclusivamente bibliotecas, frameworks e ferramentas de código aberto (Open Source), sem custos de licenciamento proprietário.
6. **Idioma Exclusivo em Português do Brasil (pt-BR):** Toda a interface gráfica, mensagens, relatórios e documentação técnica serão disponibilizados unicamente no idioma pt-BR.

---

### 1.9 Critérios de Aceitação do Projeto
1. **Compilação Limpa (Zero Build Errors):** O projeto deve compilar totalmente sem erros tanto no backend Java Spring Boot quanto no frontend React TypeScript.
2. **Integridade de Execução no Console (Zero Unhandled Errors):** A navegação por todas as telas e fluxos de trabalho não deve disparar exceções não tratadas no console do navegador ou logs do servidor.
3. **Isolamento Rígido de Dados por Tenant:** 100% dos dados exibidos (projetos, insumos, movimentações, notas fiscais) devem pertencer estritamente à empresa (CNPJ) selecionada no cabeçalho corporativo.
4. **Fidelidade da Matriz de Permissões RBAC:** A alternância entre os 15 perfis IAM deve ocultar ou liberar ações e telas com 100% de precisão funcional.
5. **Validação Fiscal Módulo 11 SEFAZ com Precisão Absoluta:** O sistema deve validar e aceitar chaves de NF-e válidas e rejeitar sumariamente chaves com dígito verificador incorreto.
6. **Conformidade com Design System e Dark Mode:** A interface gráfica deve manter padrão responsivo em Tailwind CSS, com alternância de temas claro/escuro persistida sem falhas visuais ou de contraste.
7. **Repositório GitHub Organizado com Documentação:** O código-fonte deve estar publicado no GitHub com histórico de commits organizado, arquivo README completo e Swagger/OpenAPI documentado.

---

### 1.10 Exclusões Deliberadas do Escopo
1. **Processamento Real de Pagamentos e Gateways Financeiros:** O sistema não realiza cobrança real em cartão de crédito ou emissão de boletos bancários reais; as negociações operam como simulador comercial e espelho de negociação.
2. **Parsing Direto de Arquivos Binários Proprietários .RVT (Autodesk Revit):** O sistema não processa arquivos proprietários fechados no formato .rvt sem conversão prévia, operando nativamente com os padrões abertos da indústria .ifc, .dwg e .pdf.
3. **Desenvolvimento de Aplicativos Nativos para Lojas (App Store e Google Play):** A mobilidade de campo é provida exclusivamente via tecnologia Progressive Web App (PWA), sem desenvolvimento em Swift ou Kotlin nativos.
4. **Assinatura Digital com Certificação ICP-Brasil (A1/A3):** As aprovações técnicas e contratos utilizam carimbos digitais internos com auditoria por e-mail, IP e timestamp, sem integração com cartórios digitais externos.
5. **Fornecimento e Instalação de Hardware IoT no Canteiro:** O projeto restringe-se estritamente ao software, não incluindo fornecimento de sensores de concreto, tags RFID ou câmeras físicas de monitoramento.
6. **Renderização de Nuvens de Pontos de Alta Densidade (Point Cloud):** O motor gráfico WebGL/Three.js foca na renderização de malhas poligonais 3D BIM otimizadas, não realizando varredura de nuvem de pontos a laser com milhões de vértices.
7. **Suporte Multilíngue e Internacionalização (i18n):** O sistema é disponibilizado e suportado exclusivamente em Português do Brasil (pt-BR), sem suporte a múltiplos idiomas ou moedas estrangeiras.

---

### 1.11 Mapeamento de Stakeholders Envolvidos
- **Organizadores / Desenvolvedores:** João Pedro e Marcos Henrique (Responsáveis pela engenharia de requisitos, arquitetura de software, desenvolvimento full-stack, testes e documentação técnica).
- **Professor Orientador:** Prof. Dennys Carvalho (Responsável pela orientação acadêmica, supervisão metodológica e avaliação final do projeto).
- **Gestores Corporativos e Diretores de Construtoras:** Interessados no acompanhamento do VGV, margem de lucro, curva S físico-financeira e saúde global dos empreendimentos.
- **Engenheiros Residentes e Arquitetos:** Responsáveis pela compatibilização de projetos 3D BIM, gestão do diário de obra e resolução de não-conformidades técnicas.
- **Almoxarifes e Equipe de Campo:** Operadores do controle de estoque, receptores de notas fiscais NF-e no canteiro e apontadores de segurança do trabalho (NR-18).
- **Fornecedores de Insumos e Locadores de Frotas (Parceiros B2B):** Participantes do marketplace B2B para envio de propostas de cotação e negociação via chat corporativo.
- **Imobiliárias e Corretores de Imóveis:** Usuários da vitrine de unidades e espelho de vendas para intermediação imobiliária e simulação habitacional.
- **Clientes Finais / Proprietários e Investidores:** Beneficiários do Portal do Cliente para acompanhamento transparente da obra, vistoria de entrega de chaves e chamados de garantia pós-venda.

---

### 1.12 Matriz de Riscos Iniciais e Plano de Mitigação
1. **Mudança ou Expansão Descontrolada do Escopo (Scope Creep):**
   - *Impacto:* Alto | *Probabilidade:* Média
   - *Plano de Mitigação:* Congelamento formal do escopo através da aprovação deste DDE v3.4 e reuniões periódicas de alinhamento com o orientador.
2. **Complexidade na Implementação da Arquitetura Clean/DDD e PubSub:**
   - *Impacto:* Alto | *Probabilidade:* Média
   - *Plano de Mitigação:* Adoção de convenções rígidas de pacotes no Spring Boot, uso de bibliotecas consolidadas e suíte de testes unitários desde as fases iniciais.
3. **Curva de Aprendizado e Desempenho no Engine 3D BIM (WebGL/Three.js):**
   - *Impacto:* Médio | *Probabilidade:* Média
   - *Plano de Mitigação:* Implementação de técnicas de simplificação geométrica de arquivos IFC e suporte a fallback em visualização 2D DWG/PDF.
4. **Instabilidade de Sinal de Internet no Canteiro de Obras:**
   - *Impacto:* Alto | *Probabilidade:* Alta
   - *Plano de Mitigação:* Utilização de arquitetura PWA offline-first com armazenamento local no dispositivo (*IndexedDB/LocalStorage*) e fila de sincronização assíncrona.
5. **Atrasos no Cronograma de Testes de Integração e Homologação:**
   - *Impacto:* Médio | *Probabilidade:* Baixa
   - *Plano de Mitigação:* Utilização de metodologia de desenvolvimento ágil (Scrum/Kanban) com iterações semanais e testes de integração automatizados.

---

## 2. JUSTIFICATIVA E FUNDAMENTAÇÃO TEÓRICA, MERCADOLÓGICA E TECNOLÓGICA (ULTRADETALHADO)

### 2.1 Cenário Macroeconômico da Construção Civil no Brasil e no Mundo
A construção civil assume papel de relevância estratégica incomparável no desenvolvimento socioeconômico global, atuando como o motor infraestrutural básico sobre o qual se estruturam todas as demais atividades produtivas da sociedade humana. Segundo dados consolidados da consultoria internacional McKinsey & Company e do Fórum Econômico Mundial, a cadeia global da construção civil movimenta anualmente mais de **US$ 12 trilhões**, o que representa aproximadamente **13% do Produto Interno Bruto (PIB) mundial**. Trata-se da indústria responsável por construir e manter o ambiente físico de cidades, rodovias, ferrovias, portos, aeroportos, usinas de energia, redes de saneamento, hospitais, edifícios comerciais e moradias residenciais.

No cenário nacional brasileiro, de acordo com indicadores oficiais do Instituto Brasileiro de Geografia e Estatística (IBGE, 2023) e da Câmara Brasileira da Indústria da Construção (CBIC, 2023), o setor da construção civil responde por aproximadamente **6,2% do PIB nacional**. Trata-se de um dos maiores geradores de postos de trabalho do país, alocando diretamente mais de **2,7 milhões de trabalhadores formais** com carteira assinada, estimando-se que a cadeia ampla (incluindo trabalhadores informais, terceirizados e prestadores de serviços associados) ultrapasse **7 milhões de ocupações**.

#### 2.1.1 Efeito Multiplicador e Impacto Socioeconômico Encadeado
A construção civil distingue-se de outros setores industriais pelo seu elevadíssimo **efeito multiplicador da economia**:
- **Multiplicador de Produto:** A cada R$ 1,00 investido na construção civil, geram-se R$ 2,50 de movimentação econômica indireta nos demais setores da economia brasileira.
- **Integração de Cadeia Produtiva:** A construção civil movimenta de forma direta e encadeada mais de **60 setores industriais e de serviços derivados**, incluindo:
  1. *Indústria Pesada de Transformação:* Siderurgia (aço CA-50/60), cimento Portland, cal, alumínio, produtos cerâmicos, vidros temperados/laminados e plásticos de engenharia (PVC/PPR).
  2. *Setor Logístico e de Transportes Pesados:* Frotas de caminhões basculantes, betoneiras, guindastes e movimentação de carga.
  3. *Engenharia Consultiva, Arquitetura e Geotecnia:* Projetos executivos, sondagens de solo, laudos estruturais e licenciamento ambiental.
  4. *Mercado Financeiro, Securitário e de Crédito Imobiliário:* Financiamento habitacional (SBPE/FGTS), securitização de recebíveis (CRI/LCI) e apólices de seguro de garantia de término de obra.
  5. *Comércio Atacadista e Varejista de Materiais:* Redes de distribuição e revenda de insumos da construção.

#### 2.1.2 O Déficit Habitacional e a Urgência de Eficiência Operacional
No Brasil, estudos da Fundação João Pinheiro (FJP) em parceria com o Ministério das Cidades e a CBIC apontam um **déficit habitacional estrutural superior a 5,8 milhões de moradias**, concentrado precipuamente em famílias com renda de até 3 salários mínimos. Para combater esse déficit através de programas habitacionais de grande escala (como o *Minha Casa, Minha Vida*) sem provocar pressões inflacionárias ou estouros orçamentários, o mercado imobiliário e as construtoras demandam soluções tecnológicas capazes de reduzir drasticamente o custo por metro quadrado ($C_{m^2}$), eliminar o desperdício físico de materiais e acelerar os prazos de entrega das edificações sem comprometer os requisitos regulatórios de desempenho da norma **ABNT NBR 15575**.

---

### 2.2 As Dores Estruturais e o "Custo da Ineficiência" no Canteiro de Obras

Apesar de sua relevância econômica colossal, o setor da construção civil convive com gargalos estruturais históricos de gestão e baixa maturidade digital. A ineficiência operacional no canteiro decorre de 6 pilares de falha sistêmica:

#### 1. Assimetria de Informação e Ilhas de Dados Desconectadas
Em empreendimentos tradicionais, os escritórios de arquitetura, os engenheiros estruturais/MEP, o setor de compras/suprimentos, o departamento financeiro, o almoxarife do canteiro e os mestres de obras atuam em "ilhas de informação" isoladas. O fluxo de dados opera através de planilhas eletrônicas locais descentralizadas (sujeitas a erros de fórmula e corrupção de arquivos), e-mails informais e conversas de mensagens instantâneas (WhatsApp) sem auditabilidade ou histórico corporativo. A falta de uma fonte única da verdade (*Single Source of Truth*) conduz a decisões estratégicas baseadas em dados defasados, redundância de cadastros e atritos operacionais permanentes.

#### 2. Inexistência de Rastreabilidade Logística e Financeira em Tempo Real
A ausência de integração direta entre a chegada física de insumos no canteiro e o controle de estoque impede que os gestores conheçam o saldo real de materiais críticos (cimento, aço, areia, conexões). Sem rastreabilidade em tempo real, ocorrem compras de emergência com preços superfaturados, paralisações dispendiosas da mão de obra por falta de insumo ou desvios não detectados de estoque.

#### 3. Desperdício Crônico e o "Custo do Retrabalho"
Pesquisas da Escola Politécnica da USP (POLI/USP) e do Instituto de Pesquisas Tecnológicas (IPT) demonstram que o retrabalho no canteiro (demolir e refazer elementos mal executados ou fora de posição) representa o principal fator de estouro de orçamento em obras civis. O retrabalho ocorre precipuamente porque a equipe de campo utiliza pranchas de projeto impressas antigas/desatualizadas ou porque não foi realizada a compatibilização tridimensional prévia entre as disciplinas de arquitetura, estrutura e instalações elétricas/hidráulicas (MEP).

#### 4. Vulnerabilidade Regulatória e Riscos de Litígio no Pós-Venda
Com a promulgação e consolidação da norma **ABNT NBR 15575** (Norma de Desempenho de Edificações Habitacionais) e a jurisprudência do Código de Defesa do Consumidor (CDC), as construtoras e incorporadoras passaram a responder por prazos rígidos de garantia de até 5 anos para subsistemas construtivos. Sem um registro histórico auditável (*Audit Trail*) e sem um Diário de Obra (RDO) estruturado demonstrando a qualidade dos materiais e o cumprimento das normas de segurança do trabalho (NR-18) e qualidade (ISO 9001), a construtora fica indefesa diante de processos judiciais indenizatórios por vícios ocultos na edificação.

#### 5. Imprevisibilidade Financeira e Descontroles de Fluxo de Caixa
Dados da consultoria McKinsey revelam que **85% das obras civis extrapolam o orçamento inicial planejado**. A falta de visibilidade do avanço físico real em relação ao desembolso financeiro impede a projeção acurada da Curva S, gerando crises súbitas de liquidez, inadimplência com fornecedores e atrasos na entrega das unidades aos investidores.

#### 6. Opacidade no Relacionamento B2C com o Comprador Final
O comprador de uma unidade imobiliária em construção é mantido alheio ao processo construtivo, recebendo informações escassas ou conflitantes sobre o status da obra. Essa falta de transparência gera ansiedade, desconfiança na marca da construtora, enxurrada de chamados repetitivos nas centrais de atendimento e insegurança jurídica na assinatura do contrato definitivo.

---

### 2.3 A Revolução da Construção 4.0 e os Pilares Tecnológicos do Obra360

A **Construção 4.0** conceitua a integração direta das tecnologias disruptivas da 4ª Revolução Industrial ao ecossistema da construção civil. O **Obra360** foi projetado para incorporar nativamente os 5 pilares fundamentais da Construção 4.0:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             PILARES DA CONSTRUÇÃO 4.0 NO OBRA360                         │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐    │
│  │   1. Modelagem BIM     │   │ 2. Cloud SaaS Multi-   │   │  3. Inteligência IA    │    │
│  │   Visualizador 3D/2D   │   │    Tenant & EventBus  │   │  Gemini RDO por Voz    │    │
│  │   Three.js & WebGL     │   │    Segregação de CNPJ  │   │  SEFAZ NFe 44 Dígitos  │    │
│  └────────────────────────┘   └────────────────────────┘   └────────────────────────┘    │
│                                                                                          │
│  ┌────────────────────────┐   ┌────────────────────────┐                                 │
│  │  4. Mobile PWA Offline │   │  5. Governança NBR     │                                 │
│  │  IndexedDB & Sync Async│   │    15575 / NR-18 / ISO │                                 │
│  └────────────────────────┘   └────────────────────────┘                                 │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Modelagem Tridimensional Paramétrica (BIM - Building Information Modeling):** Transição definitiva do desenho bidimensional estático (2D CAD) para o modelo espacial tridimensional rico em propriedades de engenharia (BIM 3D/4D/5D). O Obra360 democratiza o acesso ao BIM ao incorporar um visualizador 3D interativo via WebGL/Three.js direto no navegador, eliminando a necessidade de licenças de softwares proprietários caros para a equipe de campo.
2. **Computação em Nuvem, SaaS Multi-Tenant & Arquitetura Orientada a Eventos:** Permite que centenas de organizações corporativas (construtoras, escritórios de projetos, fornecedores, locadoras e imobiliárias) operem em um ambiente web seguro com segregação rígida de dados por CNPJ, trocando mensagens e notificações assíncronas via barramento EventBus (PubSub).
3. **Inteligência Artificial Generativa & Automação Fiscal:** Emprego da API Gemini IA para transcrever e estruturar o Diário de Obra (RDO) a partir de relatos em áudio gravados pelos operários no canteiro, além da validação fiscal automatizada de XMLs de Notas Fiscais Eletrônicas (NF-e/CT-e) via algoritmo do Dígito Verificador Módulo 11 da SEFAZ.
4. **Mobilidade PWA & Resiliência Offline-First:** Aplicação web responsiva construída como Progressive Web App (PWA), capaz de operar offline no canteiro através de armazenamento local (*IndexedDB/LocalStorage*) e realizar a sincronização automática dos dados assim que a conexão de dados for reestabelecida.
5. **Governança de Qualidade, Segurança e Pós-Venda (NBR 15575 / NR-18 / ISO 9001):** Digitalização completa de relatórios de não-conformidade, checklists de segurança do trabalho, vistorias técnicas de chaves e gestão de chamados de assistência técnica com SLA de 24 horas.

---

### 2.4 Evidências Empíricas, Estatísticas Oficiais e Formulagem Matemática

Para respaldar quantitativa e cientificamente a relevância do Obra360, compilaram-se indicadores de órgãos renomados e desenvolveram-se 4 modelos matemáticos determinísticos para o núcleo da aplicação:

#### 2.4.1 Compilação de Indicadores Estatísticos Oficiais do Setor
- **Produtividade Global (McKinsey & Company):** A produtividade na construção civil mundial cresceu apenas **1,0% a.a. nas últimas duas décadas** (contra 2,8% a.a. na manufatura global). A digitalização completa dos fluxos de trabalho tem o potencial verificado de **elevar a produtividade em 14% a 15%** e reduzir o custo global da obra em até 6%.
- **Perdas Físicas e Retrabalhos (CBIC / POLI-USP / IPT):** O retrabalho consome entre **5,0% e 8,0% do custo total da edificação**. As perdas físicas diretas de materiais no canteiro atingem patamares alarmantes: **15% a 20%** em cimento e argamassa, **8% a 12%** em aço estrutural CA-50/60 e **10% a 15%** em blocos cerâmicos/tijolos.
- **Atrasos no Cronograma Físico (FGV-IBRE INCC-M 2024):** **72,0% dos empreendimentos imobiliários no Brasil** registram atrasos na entrega superiores a 90 dias. As causas raízes apuradas são: 38% atrasos na entrega por fornecedores B2B; 26% erros de compatibilização de projetos; 20% descontrole na alocação de mão de obra; 16% intempéries climáticas não documentadas no RDO.
- **Custo de Pós-Venda e Assistência Técnica (CBIC 2023):** Sem uma gestão preventiva e auditável durante a obra, os custos com reparos em garantia pós-entrega consomem entre **2,0% e 4,0% do Valor Geral de Vendas (VGV)** total do empreendimento.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│              EVIDÊNCIAS EMPÍRICAS DO SETOR DA CONSTRUÇÃO CIVIL (FONTES OFICIAIS)         │
├──────────────────────────────────────────┬───────────────────────────────────────────────┤
│ Métrica / Indicador                      │ Fonte e Valor Apurado                         │
├──────────────────────────────────────────┼───────────────────────────────────────────────┤
│ Crescimento anual de produtividade       │ McKinsey & Company: 1,0% a.a. (Manufatura: 2,8%)│
│ Custo perdido com retrabalho no Brasil   │ CBIC / POLI-USP: 5,0% a 8,0% do custo total   │
│ Perda física de materiais no canteiro    │ CBIC / IPT: 15,0% a 20,0% dos insumos         │
│ Obras residenciais com atraso > 90 dias  │ FGV-IBRE (2024): 72,0% dos empreendimentos    │
│ Potencial de ganho com digitalização     │ McKinsey (2023): +14% a 15% na produtividade  │
│ Custo de assistência técnica sem gestão  │ CBIC (2023): 2,0% a 4,0% do VGV do projeto    │
└──────────────────────────────────────────┴───────────────────────────────────────────────┘
```

#### 2.4.2 Formulagem Matemática e Algoritmos Computacionais do Obra360

O motor de regras de negócio do Obra360 ampara-se em 4 formulações matemáticas rigorosas:

##### 1. Taxa de Consumo Real de Insumo por Metro Quadrado Executado ($C_{m^2}$):
Calcula a eficiência logísticas de consumo de insumos por área física concluída:
$$C_{m^2} = \frac{\sum_{i=1}^{n} \text{Quantidade\_Entregue}_{SKU_i}}{\text{Área Executada } (m^2)}$$

*Regra de Auditoria Automática:*
$$\text{Se } C_{m^2} > C_{\text{previsto}} \times (1 + \delta), \quad \text{onde } \delta = 0{,}03 \text{ (3\% de tolerância)},$$
o sistema dispara um evento assíncrono de alerta de estouro de consumo para o Engenheiro Residente e o setor de Compras.

##### 2. Modelo da Curva S Sigmoidal Físico-Financeira Apropriada ($S(t)$):
Modela o progresso acumulado físico e financeiro do empreendimento ao longo do tempo $t$:
$$S(t) = \frac{\text{Orçamento\_Total}}{1 + e^{-k(t - t_0)}}$$
Onde $k$ representa a taxa de aceleração da execução e $t_0$ o ponto de inflexão de custo máximo do cronograma físico.

##### 3. Algoritmo SEFAZ Módulo 11 para Validação da Chave de NFe de 44 Dígitos:
Dada a chave de acesso fiscal de 43 dígitos $d_1, d_2, \dots, d_{43}$, aplicam-se os pesos $w_i \in [2, 9]$ da direita para a esquerda:
$$\text{Soma} = \sum_{i=1}^{43} (d_i \times w_i) \implies \text{Resto} = \text{Soma} \bmod 11$$
$$\text{DV} = \begin{cases} 0 & \text{se } \text{Resto} = 0 \text{ ou } \text{Resto} = 1 \\ 11 - \text{Resto} & \text{se } \text{Resto} \ge 2 \end{cases}$$

O sistema valida se o 44º dígito informado na chave de acesso coincide exatamente com o $\text{DV}$ calculated. Se for divergente, a Nota Fiscal Eletrônica é rejeitada sumariamente.

##### 4. Simulação de Amortização Financeira Habitacional em 360 Meses ($P_t$):
- **Sistema de Amortização Constante (Tabela SAC):**
  $$A = \frac{SD_0}{N}, \quad J_t = SD_{t-1} \times i, \quad P_t = A + J_t$$
- **Sistema de Prestação Constante (Tabela PRICE):**
  $$P = SD_0 \times \left[ \frac{i (1+i)^N}{(1+i)^N - 1} \right]$$
- **Reajuste Monetário pelo INCC-M Acumulado:**
  $$SD_t = SD_{t-1} \times (1 + \text{INCC}_{\text{acumulado}})$$

---

### 2.5 Justificativa Acadêmica e Escolha dos Padrões Arquiteturais de Engenharia de Software

Do ponto de vista da Engenharia de Software Corporativa, o desenvolvimento da plataforma Obra360 justifica-se pela adoção rigorosa dos padrões arquiteturais mais consolidados da indústria:

#### 1. Clean Architecture em 4 Camadas Desacopladas (Robert C. Martin)
A Arquitetura Limpa garante a independência de frameworks externos, facilidade de manutenção e testabilidade total através da segregação estrita:
- **Domain Layer:** Contém as entidades puras do domínio (`Company`, `StockItem`, `ConstructionOccurrence`, `BuildingElement`) e regras de negócio essenciais, livres de dependências externas.
- **Application Layer (Use Cases):** Implementa os fluxos de trabalho do sistema (`CreateCompanyUseCase`, `RegisterStockMovementUseCase`, `LgpdAnonymizationUseCase`, `ExtrudeFloorplan3DUseCase`).
- **Infrastructure / Adapters Layer:** Implementa os repositórios Spring Data JPA, adaptadores Kafka de mensageria, integração SEFAZ e controladores REST Spring MVC.
- **Presentation / UI Layer:** Interface gráfica em React 18, TypeScript, Tailwind CSS e engine 3D WebGL via Three.js.

#### 2. Domain-Driven Design (DDD - Eric Evans)
O projeto adota uma Linguagem Ubíqua (*Ubiquitous Language*) alinhada à Engenharia Civil. Os conceitos do domínio são modelados com precisão usando:
- **Value Objects:** Objetos imutáveis como `NfeKey` com validação de regras fiscais acoplada.
- **Aggregates & Repositories:** Delimitação de fronteiras de consistência transacional para itens de estoque e movimentações.
- **Domain Events:** Eventos de domínio como `StockMinReachedEvent` disparados quando o saldo físico de um insumo atinge o limite crítico.

#### 3. Event-Driven Architecture & Outbox Pattern (Mensageria Assíncrona)
Para evitar acoplamento rígido entre módulos e garantir resiliência diante de falhas temporárias de banco de dados ou rede, o Obra360 adota a **Arquitetura Orientada a Eventos**:
- **Outbox Pattern:** Gravam-se os eventos de domínio na tabela `outbox_events` na mesma transação ACID do banco de dados, garantindo entrega garantida (*At-Least-Once Delivery*).
- **Kafka / EventBus Scheduler:** O serviço `OutboxPublisherScheduler` consome os eventos pendentes e os publica no barramento Kafka/EventBus para consumo pelos ouvintes (`StockEventListenerConsumer`).

#### 4. Role-Based Access Control (RBAC) e Segregação Multi-Tenant
A plataforma implementa matriz de segurança granular com 15 perfis hierárquicos (*SUPER_ADMIN, GERENTE_OBRA, ENGENHEIRO, MESTRE_OBRA, ALMOXARIFE, FINANCEIRO, CLIENTE, AUDITOR, INCORPORADOR, ARQUITETO, FORNECEDOR, LOCADOR_MAQUINAS, CORRETOR, INVESTIDOR*). Cada requisição HTTP passa por filtro de segurança que valida o tenant (`company_id`) e a permissão do perfil ativo, garantindo **isolamento de dados absoluto** entre empresas concorrentes.

---

## 3. IDENTIFICAÇÃO DO PROJETO, STAKEHOLDERS E PERFIS IAM/SoD

### 3.1 Ficha Técnica do Projeto
- **Nome Oficial:** Obra360 - Plataforma Integrada de Gestão da Construção Civil e Mercado Imobiliário
- **Instituição:** Faculdade AESA-CESA (Arcoverde/PE) — Projeto Interdisciplinar de Engenharia de Software (2026)
- **Autores:** João Pedro e Marcos Henrique | **Orientador:** Prof. Dennys Carvalho
- **Público-Alvo:** Construtoras, incorporadoras, escritórios de engenharia/arquitetura, fornecedores B2B, locadoras de frotas, imobiliárias, corretores, investidores e compradores finais.
- **Tipologias Suportadas:** Casas, Condomínios Fechados, Edifícios, Hospitais, Galpões, Infraestrutura, Túneis e Usinas Fotovoltaicas.

---

### 3.2 Mapeamento de Stakeholders

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                MAPEAMENTO DE STAKEHOLDERS                                │
├──────────────────────────┬───────────────────────────────────────────────────────────────┤
│ Stakeholder              │ Papel e Interesse no Projeto                                  │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ João Pedro e Marcos H.   │ Alunos Desenvolvedores: Concepção, arquitetura e codificação. │
│ Prof. Dennys Carvalho    │ Professor Orientador: Orientação acadêmica e avaliação.       │
│ Administrador do Sistema │ Gestão de tenants corporativos, usuários e segurança IAM.     │
│ Gerente de Empreendimento│ Gestão de custos, prazos, orçamentos e viabilidade da obra.   │
│ Engenheiro Residente     │ Aprovação técnica de projetos 2D/3D, medições e medições RDO.  │
│ Arquiteto                │ Versionamento de desenhos técnicos, pranchas e modelos BIM.   │
│ Mestre de Obras          │ Apontamento diário de campo, contingente e laudos NR-18.      │
│ Almoxarife Chefe         │ Recebimento de notas fiscais NFe e baixa de insumos por SKU.  │
│ Analista Financeiro      │ Acompanhamento de fluxo de caixa, pagamentos e orçado x real. │
│ Fornecedor de Insumos B2B│ Envio de propostas de cotação (RFQ) e recebimento de pedidos. │
│ Empresa de Locação       │ Oferta e gestão de locação de máquinas e frotas pesadas.      │
│ Imobiliária / Corretor   │ Comercialização de unidades, espelho de vendas e simulações.  │
│ Investidor Imobiliário   │ Acompanhamento do VGV, rentabilidade e progresso global.      │
│ Cliente Final (Comprador)│ Acompanhamento visual da própria unidade e diário transparente.│
│ Auditor de Qualidade     │ Rastreabilidade imutável de logs e conformidade ISO 9001.     │
└──────────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

### 3.3 Perfis de Usuários e Matriz SoD (11 Perfis Granulares)

```
                  ┌─────────────────────────────────────────────────┐
                  │          AUTENTICAÇÃO & CONTROLE IAM            │
                  └────────────────────────┬────────────────────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌────────────────────────────────┐                         ┌────────────────────────────────┐
│   PERFIS OPERACIONAIS / CAMPO  │                         │  PERFIS COMERCIAIS & CLIENTES  │
├────────────────────────────────┤                         ├────────────────────────────────┤
│ • Super Admin (Soberano)       │                         │ • Financeiro (Custos/NFe)      │
│ • Gerente de Empreendimento    │                         │ • Fornecedor B2B (Cotações)    │
│ • Engenheiro Residente         │                         │ • Imobiliária / Corretor       │
│ • Arquiteto                    │                         │ • Investidor Imobiliário       │
│ • Mestre de Obras              │                         │ • Cliente Final (Proprietário) │
│ • Almoxarife Chefe             │                         │ • Auditor Interno (ISO 9001)   │
└────────────────────────────────┘                         └────────────────────────────────┘
```

#### Detalhamento das Capacidades e Restrições por Perfil:
1. `SUPER_ADMIN`: Gestão global de tenants, permissões e auditoria. Vedação: Operação simulada sem log.
2. `GERENTE_OBRA`: Aprovação orçamentária, cronograma e viabilidade. Vedação: Alterar logs imutáveis.
3. `ENGENHEIRO`: Medições 3D BIM, laudos técnicos e aprovação RDO. Vedação: Alteração de permissões IAM.
4. `ARQUITETO`: Versionamento de projetos IFC/DWG e design espacial 3D. Vedação: Baixa em almoxarifado.
5. `MESTRE_OBRA`: Lançamento diário de RDO por voz e laudos NR-18. Vedação: Alteração de valores de vendas.
6. `ALMOXARIFE`: Conciliação NFe 44 dígitos e controle SKU. Vedação: Aprovação de medições de engenharia.
7. `FINANCEIRO`: Orçado x realizado e fluxo de pagamentos B2B. Vedação: Alterar status de execução física.
8. `FORNECEDOR`: Resposta a RFQs e cadastro de frotas pesadas. Vedação: Acesso a dados internos de custos.
9. `CORRETOR`: Espelho de vendas em tempo real e simulações. Vedação: Alterar cronograma do canteiro.
10. `INVESTIDOR`: Acompanhamento de curva S e índice VGV. Vedação: Alterar dados operacionais de campo.
11. `CLIENTE`: Diário Transparente e chamados NBR 15575. Vedação: Acesso a custos e dados de outras unidades.

---

## 4. OBJETIVOS DO PROJETO

### 4.1 Objetivo Geral
Desenvolver e implementar uma plataforma corporativa web integrada baseada nos padrões de Clean Architecture e Domain-Driven Design (DDD) para centralizar a gestão, a execução e a comercialização de empreendimentos imobiliários e de infraestrutura, conectando todos os atores do ecossistema da construção civil em um ambiente Multi-Tenant unificado com sincronização assíncrona em tempo real.

---

### 4.2 Objetivos Específicos
1. **Levantar Requisitos:** Mapear necessidades junto aos 11 perfis IAM.
2. **Projetar Clean Architecture:** Estruturar backend Java em 4 camadas.
3. **Implementar PubSub:** Barramento de eventos assíncronos para atualizações em tempo real.
4. **Motor 3D/BIM e Extrusão 2D:** Visualizador WebGL Three.js com AI CAD Parser.
5. **Conciliação NFe SEFAZ:** Importação e validação de chaves de 44 dígitos.
6. **Marketplace B2B e Frotas:** Emissão de RFQs e locação de máquinas pesadas.
7. **Assistente RDO por Voz:** Transcrição e inteligência artificial (Gemini IA).
8. **Fiscalização ISO 9001 e NR-18:** Registro de ocorrências com fotos e severidade.
9. **Portal do Proprietário e Vendas:** Espelho de vendas e simulador em 360 meses.
10. **Central NBR 15575:** Chamados de garantia pós-obra com SLA 24h.
11. **Governança LGPD:** Exportação em JSON (Art. 18) e esquecimento de dados.
12. **Testes Automatizados:** Cobertura via JUnit 5 e Playwright E2E.

---

## 5. ARQUITETURA DE SOFTWARE E VISÃO C4 MODEL

### 5.1 Visão Geral da Arquitetura C4 Model

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                C4 MODEL - VISÃO DE CONTÊINERES                           │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌───────────────────────┐         HTTPS / JWT         ┌──────────────────────────────┐  │
│  │   Frontend Web App    ├────────────────────────────►│     Backend API REST Java    │  │
│  │ React 18 + Three.js   │                             │  Spring Boot 3.2 / Clean Arch│  │
│  └───────────────────────┘                             └──────────────┬───────────────┘  │
│                                                                       │                  │
│                                                ┌──────────────────────┼────────────────┐ │
│                                                ▼                      ▼                ▼ │
│                                       ┌────────────────┐    ┌──────────────────┐ ┌─────┴┐│
│                                       │ PostgreSQL 16  │    │ EventBus PubSub  │ │SEFAZ││
│                                       │ (Multi-Tenant) │    │  (In-Memory/MQ)  │ │ NFe ││
│                                       └────────────────┘    └──────────────────┘ └─────┘│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5.2 Modelo Conceitual Entidade-Relacionamento (DER)

```
┌──────────────┐ 1    * ┌──────────────────────┐ 1    * ┌─────────────────────┐
│    Tenant    ├───────►│    Empreendimento    ├───────►│    Modelo3DElemento │
└──────┬───────┘        └──────────┬───────────┘        └─────────────────────┘
       │ 1                         │ 1
       │                           │
       ▼ *                         ▼ *
┌──────────────┐        ┌──────────────────────┐
│   Usuario    │        │  DocumentoProjeto    │
└──────────────┘        └──────────────────────┘
```

---

## 6. DETALHAMENTO EXAUSTIVO DOS 12 MÓDULOS DO SISTEMA

Nesta seção, o escopo do Obra360 é fatiado individualmente em **12 Módulos Funcionais**, detalhando **50 Regras de Negócio (RN-01 a RN-50)** e **30 Requisitos Funcionais (RF-01 a RF-30)**.

---

### 6.1 Módulo 1: Gestão Multi-Empresas (Multi-Tenant SaaS B2B/B2C) e Controle IAM/RBAC

#### 6.1.1 Descrição e Fluxo Operacional Detalhado
Gerenciamento de organizações corporativas (Construtoras, Projetistas, Fornecedores, Imobiliárias) e autenticação de usuários via tokens JWT Stateless com MFA. Todas as requisições injetam a chave `tenant_id` garantindo isolamento de banco de dados.

#### 6.1.2 Regras de Negócio (RN) do Módulo 1
- **RN-01 (Isolamento Lógico Absoluto de Tenant):** Filtro obrigatório de `tenant_id` em todas as consultas SQL/ORM.
- **RN-02 (Validação de CNPJ/CPF):** Verificação algorítmica de 14 dígitos (CNPJ) e 11 dígitos (CPF).
- **RN-03 (Segregação SoD):** Impedimento de acúmulo de papéis operacionais conflitantes.
- **RN-04 (Bloqueio por Inadimplência ou Suspensão do Tenant):** Tenants suspensos têm acesso bloqueado imediatamente.

#### 6.1.3 Requisitos Funcionais (RF) do Módulo 1
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-01** | Autenticação IAM/RBAC | Login JWT, MFA e controle dos 11 perfis SoD. | Essencial | Todos / `SUPER_ADMIN` |
| **RF-02** | Gestão Multi-Tenant | Cadastro e alternância de organizações corporativas. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA` |
| **RF-03** | Gestão de Colaboradores | Convite e vinculação de usuários a perfis no tenant. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA` |

---

### 6.2 Módulo 2: Gestão de Empreendimentos e Categorias de Obras

#### 6.2.1 Descrição e Fluxo Operacional Detalhado
Cadastro e parametrização de obras em 8 categorias construtivas (Casas, Condomínios, Edifícios, Hospitais, Galpões, Infraestrutura, Túneis e Energia Solar Fotovoltaica) com definição de centro de custos, área construída, ART/RRT e orçamento.

#### 6.2.2 Regras de Negócio (RN) do Módulo 2
- **RN-05 (Indicadores Únicos por Obra):** Centro de custos, orçamento, VGV e curva S isolados por obra.
- **RN-06 (Vínculo ART/RRT Obrigatório):** Obrigatoriedade de indicação de responsável técnico registrado no CREA/CAU.
- **RN-07 (Parametrização por Tipologia):** Habilitação de métricas específicas (MWp para energia solar, km para rodovias).
- **RN-08 (Travamento de Encerramento de Obra):** Obras só podem ser encerradas se não houver chamados pendentes.

#### 6.2.3 Requisitos Funcionais (RF) do Módulo 2
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-04** | Cadastro de Empreendimentos | Inclusão, edição e parametrização por categoria construtiva. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO` |
| **RF-05** | Painel de Indicadores de Obra | Dashboard com curva S, orçamento gasto e avanço físico %. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `INVESTIDOR` |

---

### 6.3 Módulo 3: Modelagem 3D Evolutiva (BIM) e Extrusão de Plantas 2D (AI CAD Parser)

#### 6.3.1 Descrição e Fluxo Operacional Detalhado
Motor gráfico Three.js/WebGL com ferramenta procedural de extrusão de plantas 2D (AI CAD Parser) para elevação de paredes e posicionamento de elementos 3D (sapatas, pilares, vigas, lajes, telhados, esquadrias). Slider de linha do tempo evolutiva (Semanas 1 a 8).

#### 6.3.2 Regras de Negócio (RN) do Módulo 3
- **RN-09 (Modelo 3D Exclusivo por Obra):** Vinculação estrita da geometria 3D ao ID do empreendimento.
- **RN-10 (Autoria de Modificação Espacial):** Alterações reservadas aos perfis técnicos credenciados.
- **RN-11 (Linha do Tempo Evolutiva):** Atualização dinâmica da cor/transparência do modelo conforme status semanal.
- **RN-12 (Cálculo de Volume e Insumos 3D):** Extração automática de volume ($m^3$) de concreto e $m^2$ de alvenaria.

#### 6.3.3 Requisitos Funcionais (RF) do Módulo 3
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-06** | Visualização 3D BIM WebGL | Renderização tridimensional com navegação e inspeção de propriedades. | Essencial | Todos os Perfis |
| **RF-07** | Construtor BIM 3D | Inserção e edição de elementos estruturais procedurais. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-08** | Extrusão 2D AI CAD Parser | Elevação automática de plantas 2D em paredes tridimensionais. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-09** | Slider de Linha do Tempo | Simulação do avanço físico semanal (Semanas 1 a 8). | Importante | Todos os Perfis |

---

### 6.4 Módulo 4: Central de Projetos e Gerenciamento Documental Versionado (IFC / DWG / PDF)

#### 6.4.1 Descrição e Fluxo Operacional Detalhado
Repositório EDMS para arquivos OpenBIM (IFC4), desenhos CAD (DWG) e memoriais executivos (PDF) com controle de revisão (`v1.0`, `v2.0`) e status de aprovação.

#### 6.4.2 Regras de Negócio (RN) do Módulo 4
- **RN-13 (Imutabilidade de Revisões):** O upload de nova versão preserva as anteriores para auditoria.
- **RN-14 (Bloqueio de Downloads Obsoletos):** Bloqueio de pranchas rejeitadas ou obsoletas no canteiro.
- **RN-15 (Aprovação Técnica Obrigatória):** Liberação para o canteiro mediante carimbo digital do Engenheiro.
- **RN-16 (Verificação de Compatibilidade BIM):** Registro de interferências técnicas (Clash Detection).

#### 6.4.3 Requisitos Funcionais (RF) do Módulo 4
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-10** | Repositório Documental Versionado | Upload, versionamento e aprovação de arquivos IFC/DWG/PDF. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `ARQUITETO` |
| **RF-11** | Visualizador de Projetos PDF/CAD | Exibição de desenhos técnicos e marcação de revisões na web. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `ARQUITETO`, `MESTRE_OBRA` |

---

### 6.5 Módulo 5: Almoxarifado, Controle de Estoque por SKU e Conciliação NFe (44 dígitos)

#### 6.5.1 Descrição e Fluxo Operacional Detalhado
Gestão logística de materiais por código SKU e conciliação automática de Notas Fiscais Eletrônicas via chave de 44 dígitos da SEFAZ (validação módulo 11).

#### 6.5.2 Regras de Negócio (RN) do Módulo 5
- **RN-17 (Validação NFe Módulo 11):** Validação algorítmica estrita da chave de 44 dígitos SEFAZ.
- **RN-18 (Rastreabilidade de Saída por Frente de Trabalho):** Vínculo obrigatório da saída de material ao recebedor e etapa da obra.
- **RN-19 (Alerta de Estoque Mínimo):** Disparo automático de alerta de compra ao atingir a reserva crítica.
- **RN-20 (Bloqueio de Saldo Negativo):** O sistema impede saídas de estoque superiores ao saldo físico disponível.
- **RN-21 (Inventário e Ajuste Auditado):** Ajustes manuais de estoque exigem justificativa e aprovação do Gerente.

#### 6.5.3 Requisitos Funcionais (RF) do Módulo 5
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-12** | Conciliação NFe 44 Dígitos | Importação de notas fiscais SEFAZ com validação de chave. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ALMOXARIFE`, `FINANCEIRO` |
| **RF-13** | Controle de Estoque por SKU | Gestão de saídas, entradas, saldos e alertas de estoque mínimo. | Essencial | `SUPER_ADMIN`, `ENGENHEIRO`, `MESTRE_OBRA`, `ALMOXARIFE` |
| **RF-14** | Relatório de Consumo por $m^2$ | Apuração exata do consumo de materiais por área executada. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `FINANCEIRO` |

---

### 6.6 Módulo 6: Marketplace B2B (Cotações RFQ & Frotas Pesadas)

#### 6.6.1 Descrição e Fluxo Operacional Detalhado
Portal de negociação B2B para abertura de cotações de insumos (RFQ - Request for Quotation) com quadro comparativo de propostas e contratação de locação de frotas/máquinas pesadas.

#### 6.6.2 Regras de Negócio (RN) do Módulo 6
- **RN-22 (Cotação Cega B2B):** Fornecedores não enxergam valores concorrentes durante o edital aberto.
- **RN-23 (Aprovação por Alçada Orçamentária):** Cotações acima do orçamento aprovado exigem aprovação do Gerente.
- **RN-24 (Gestão de Contratos de Frotas):** Exigência de horímetro/km inicial e contrato assinado para locação.
- **RN-25 (Avaliação de Fornecedores B2B):** Avaliação de pontualidade e qualidade dos fornecedores no marketplace.

#### 6.6.3 Requisitos Funcionais (RF) do Módulo 6
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-15** | Cotações B2B (RFQ) | Emissão de edital de cotação e geração de mapa comparativo. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `FORNECEDOR` |
| **RF-16** | Locação de Frotas Pesadas | Reserva e gestão de contratos de escavadeiras, guindastes e caminhões. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `FORNECEDOR` |

---

### 6.7 Módulo 7: Execução, Diário de Obra (RDO por Voz/Gemini IA) e Fiscalização ISO 9001 / NR-18

#### 6.7.1 Descrição e Fluxo Operacional Detalhado
Lançamento móvel de campo do Diário de Obra (RDO) assistido por voz e inteligência artificial (Gemini IA), acompanhado do registro de não-conformidades técnicas ISO 9001 e laudos NR-18.

#### 6.7.2 Regras de Negócio (RN) do Módulo 7
- **RN-26 (Fechamento Diário do RDO):** RDO do dia deve ser finalizado até às 23h59.
- **RN-27 (Escalonamento Crítico NR-18):** Ocorrências de severidade "Alta" paralisam a etapa e notificam a diretoria.
- **RN-28 (Evidência Fotográfica Obrigatória):** Exigência de anexo de foto para registrar não-conformidades.
- **RN-29 (Verificação de Condições Climáticas):** Registro obrigatório do clima (Claro, Chuvoso, Impracticável).
- **RN-30 (Baixa em Ação Corretiva):** Baixa em não-conformidade exige nova foto do reparo e aceite do Engenheiro.

#### 6.7.3 Requisitos Funcionais (RF) do Módulo 7
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-17** | Diário de Obra RDO por Voz | Ditado por voz com estruturação de efetivo e clima via Gemini IA. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA` |
| **RF-18** | Fiscalização NR-18 / ISO 9001 | Registro de inspeções, fotos, severidade e laudos de segurança. | Essencial | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `MESTRE_OBRA`, `AUDITOR` |
| **RF-19** | Registro de Apontamento de Efetivo | Controle de presença da equipe própria e terceirizada no canteiro. | Importante | `SUPER_ADMIN`, `ENGENHEIRO`, `MESTRE_OBRA` |

---

### 6.8 Módulo 8: Comercialização Imobiliária (Espelho de Vendas, Unidades & Simulador Financeiro)

#### 6.8.1 Descrição e Fluxo Operacional Detalhado
Gestão comercial do inventário de unidades imobiliárias com espelho de vendas interativo em tempo real e simulador de parcelamento em até 360 meses nas tabelas SAC e PRICE.

#### 6.8.2 Regras de Negócio (RN) do Módulo 8
- **RN-31 (Bloqueio por Reserva Comercial):** Reserva altera status para "Reservada" por até 48h.
- **RN-32 (Integridade da Tabela de Vendas):** Aplicação estrita das tabelas e índices vigentes (INCC/IGP-M).
- **RN-33 (Bloqueio de Venda Duplicada):** Impedimento físico de venda para unidades com contrato assinado.
- **RN-34 (Aprovação de Proposta Comercial):** Propostas com desconto exigem aprovação da diretoria comercial.

#### 6.8.3 Requisitos Funcionais (RF) do Módulo 8
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-20** | Espelho de Vendas em Tempo Real | Grid interativo de status de unidades (Disponível, Reservado, Vendido). | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `FINANCEIRO`, `CORRETOR`, `INVESTIDOR` |
| **RF-21** | Simulador Financeiro (360 Meses) | Calculadora de financiamento SAC/PRICE com reajuste por índices oficiais. | Desejável | `SUPER_ADMIN`, `CORRETOR`, `CLIENTE`, `INVESTIDOR` |
| **RF-22** | Gestão de Reservas e Contratos | Emissão de propostas e controle do prazo de validade da reserva. | Importante | `SUPER_ADMIN`, `FINANCEIRO`, `CORRETOR` |

---

### 6.9 Módulo 9: Portal do Proprietário / Investidor e Diário Transparente de Obra

#### 6.9.1 Descrição e Fluxo Operacional Detalhado
Canal B2C de relacionamento e transparência para o comprador final ou investidor acompanhar o percentual de avanço físico ($m^2$ executados), galeria de fotos e cronograma de entregas.

#### 6.9.2 Regras de Negócio (RN) do Módulo 9
- **RN-35 (Segregação de Visibilidade B2C):** Cliente visualiza apenas dados da sua unidade e áreas comuns.
- **RN-36 (Curadoria de Conteúdo Público):** Aprovação prévia do Engenheiro para fotos publicadas.
- **RN-37 (Notificação de Marcos de Entrega):** Envio automático de avisos ao concluir etapas macro da obra.

#### 6.9.3 Requisitos Funcionais (RF) do Módulo 9
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-23** | Portal do Proprietário B2C | Dashboard com avanço físico %, fotos e comunicados oficiais. | Essencial | `SUPER_ADMIN`, `CLIENTE`, `INVESTIDOR` |
| **RF-24** | Galeria de Fotos e Marcos da Obra | Histórico fotográfico em alta resolução do avanço da construção. | Importante | `SUPER_ADMIN`, `CLIENTE`, `INVESTIDOR` |

---

### 6.10 Módulo 10: Gestão de Garantias Pós-Obra e Assistência Técnica (ABNT NBR 15575 / SLA 24h)

#### 6.10.1 Descrição e Fluxo Operacional Detalhado
Central de pós-venda para abertura e triagem de chamados de assistência técnica após a entrega das chaves, categorizados pelos subsistemas da Norma de Desempenho ABNT NBR 15575 com SLA de 24h.

#### 6.10.2 Regras de Negócio (RN) do Módulo 10
- **RN-38 (Vigência de Garantia por Subsistema NBR 15575):** Validação da data da chave e prazo legal do subsistema.
- **RN-39 (Escalonamento por Estouro de SLA 24h):** Notificação automática para a diretoria em chamados não atendidos em 24h.
- **RN-40 (Termo de Aceite do Cliente):** Encerramento da OS exige assinatura digital do proprietário.
- **RN-41 (Classificação de Mal Uso vs Vício Construtivo):** Laudo técnico obrigatório para recusa de chamado por mau uso.

#### 6.10.3 Requisitos Funcionais (RF) do Módulo 10
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-25** | Chamados NBR 15575 e SLA 24h | Abertura de chamados por subsistema construtivo e controle de SLA. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO`, `CLIENTE` |
| **RF-26** | Ordens de Serviço (OS) de Reparo | Emissão, agendamento de vistoria e acompanhamento de reparos. | Importante | `SUPER_ADMIN`, `GERENTE_OBRA`, `ENGENHEIRO` |

---

### 6.11 Módulo 11: Chat Corporativo B2B e Central de Mensagens Instantâneas

#### 6.11.1 Descrição e Fluxo Operacional Detalhado
Canal de mensageria instantânea integrado para comunicação direta entre engenheiros, almoxarifado, financeiro, fornecedores B2B e corretores, vinculado ao contexto operacional.

#### 6.11.2 Regras de Negócio (RN) do Módulo 11
- **RN-42 (Vinculação Contextual):** Salas de chat associadas obrigatoriamente a uma obra, RFQ ou chamado.
- **RN-43 (Histórico Auditável Não-Apagável):** Proibição de exclusão de mensagens para garantir rastreabilidade.
- **RN-44 (Suporte a Anexos Técnicos):** Envio de fotos, desenhos PDF e arquivos de áudio no chat.

#### 6.11.3 Requisitos Funcionais (RF) do Módulo 11
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-27** | Chat Corporativo B2B Instantâneo | Troca de mensagens em tempo real vinculada ao contexto da obra. | Desejável | Todos os Perfis Cadastrados |
| **RF-28** | Central de Notificações Push/PubSub | Notificações internas de alertas de canteiro, estoque e cotações. | Importante | Todos os Perfis Cadastrados |

---

### 6.12 Módulo 12: Trilha Imutável de Auditoria (Audit Trail / ISO 9001) e Governança LGPD (Art. 18)

#### 6.12.1 Descrição e Fluxo Operacional Detalhado
Registro imutável (*Audit Trail*) de transações em regime *append-only* para conformidade ISO 9001 e central de direitos do titular de dados conforme a LGPD (Lei 13.709/2018).

#### 6.12.2 Regras de Negócio (RN) do Módulo 12
- **RN-45 (Imutabilidade Absoluta da Auditoria):** Registros de log gravados em tabela *append-only* inalterável.
- **RN-46 (Anonimização Irreversível LGPD):** Mascaramento de dados PII em solicitações de esquecimento.
- **RN-47 (Exportação JSON em até 48h):** Disponibilização do relatório de portabilidade em JSON estruturado.
- **RN-48 (Registro de IP e User-Agent):** Todo log captura obrigatoriamente e-mail, IP, timestamp e payload.
- **RN-49 (Alerta de Tentativa de Acesso Indevido):** Registro de falhas de autenticação recorrentes.
- **RN-50 (Retenção Legal de Logs):** Manutenção dos registros de auditoria pelo prazo legal mínimo de 5 anos.

#### 6.12.3 Requisitos Funcionais (RF) do Módulo 12
| ID | Nome | Descrição | Prioridade | Perfis Autorizados |
|---|---|---|---|---|
| **RF-29** | Log Imutável de Auditoria | Registro auditável de ações de usuários para conformidade ISO 9001. | Essencial | `SUPER_ADMIN`, `AUDITOR` |
| **RF-30** | Central de Privacidade e Portabilidade LGPD | Exportação de dados do titular em JSON (Art. 18) e fluxo de anonimização. | Essencial | `SUPER_ADMIN`, `AUDITOR`, `CLIENTE` (dados próprios) |

---

## 7. REQUISITOS NÃO FUNCIONAIS (RNF-01 a RNF-10)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             REQUISITOS NÃO FUNCIONAIS (RNF)                              │
├───────┬──────────────────────────────────────────────┬──────────────┬────────────────────┤
│ ID    │ Descrição Detalhada                          │ Prioridade   │ Categoria          │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-01│ Desempenho de Renderização WebGL:            │ Essencial    │ Desempenho         │
│       │ O visualizador 3D deve manter taxa mínima de │              │                    │
│       │ 30 FPS na navegação de modelos até 10 mil    │              │                    │
│       │ polígonos em navegadores convencionais.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-02│ Tempo de Resposta da API REST:               │ Essencial    │ Desempenho         │
│       │ 95% das requisições REST da API backend devem│              │                    │
│       │ ser respondidas em menos de 500 milissegundos│              │                    │
│       │ em condições normais de carga.               │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-03│ Arquitetura Limpa em 4 Camadas:              │ Essencial    │ Arquitetura        │
│       │ O código Java deve respeitar estritamente o  │              │                    │
│       │ desacoplamento de Domain, Use Cases, Adapters│              │                    │
│       │ e Frameworks sem dependências circulares.    │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-04│ Segurança Spring Security 6 & Stateless JWT: │ Essencial    │ Segurança          │
│       │ Comunicação REST protegida contra CSRF com   │              │                    │
│       │ sessões Stateless baseadas em tokens JWT.    │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-05│ Conformidade com a LGPD (Lei 13.709/2018):   │ Essencial    │ Segurança/Legal    │
│       │ Mascaramento de PII (e-mail, CNPJ, telefone) │              │                    │
│       │ e suporte ao Direito de Portabilidade/Esque- │              │                    │
│       │ cimento (Art. 18).                           │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-06│ Responsividade Mobile-First (Tailwind CSS):  │ Essencial    │ Usabilidade        │
│       │ A interface web deve adaptar-se perfeitamente│              │                    │
│       │ a telas mobile (320px), tablets e desktops.  │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-07│ Suporte a Temas (Dark / Light Mode):         │ Importante   │ Usabilidade        │
│       │ Alternância instantânea e persistida em      │              │                    │
│       │ localStorage entre Modo Escuro e Claro.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-08│ Suporte Progressive Web App (PWA):           │ Importante   │ Portabilidade      │
│       │ Funcionamento como PWA instalável com cache  │              │                    │
│       │ offline para uso em canteiros de obras.      │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-09│ Disponibilidade e Resiliência (99,5% Uptime):│ Importante   │ Confiabilidade     │
│       │ A infraestrutura Cloud deve assegurar dispo- │              │                    │
│       │ nibilidade mínima de 99,5% do serviço.       │              │                    │
├───────┼──────────────────────────────────────────────┼──────────────┼────────────────────┤
│ RNF-10│ Compatibilidade Multi-Navegador:             │ Essencial    │ Compatibilidade    │
│       │ Execução homologada no Google Chrome,        │              │                    │
│       │ Microsoft Edge, Mozilla Firefox e Safari.    │              │                    │
└───────┴──────────────────────────────────────────────┴──────────────┴────────────────────┘
```

---

## 8. PREMISSAS, RESTRIÇÕES E EXCLUSÕES DO ESCOPO

### 8.1 Premissas do Projeto
1. **Disponibilidade de Dispositivos e Navegadores Modernos:** Dispositivos com navegadores atualizados e suporte WebGL.
2. **Adesão de Parceiros B2B:** Cadastro de fornecedores e locadoras para responder cotações RFQ.
3. **Conectividade Intermitente:** Cache offline PWA sincronizado assincronamente ao reconectar.

---

### 8.2 Restrições do Projeto
1. **Prazo Rígido Acadêmico:** Conclusão dentro do calendário acadêmico da AESA-CESA.
2. **Arquitetura Obrigatória:** Backend em Java 21 + Spring Boot 3.2 com Clean Architecture e DDD.
3. **Restrição Orçamentária:** Uso exclusivo de ferramentas Open Source e planos gratuitos Cloud.

---

### 8.3 Exclusões Deliberadas do Escopo (Fronteiras do Projeto)
1. **Gateways de Pagamento Reais:** Sem adquirentes financeiras reais; vendas operam como simulador e reserva comercial.
2. **Parsing Nativo de Arquivos Proprietários .RVT:** O 3D opera via OpenBIM `.ifc`, pranchas `.dwg` e `.pdf`.
3. **Aplicativos Nativos iOS/Android:** Mobilidade atendida via Progressive Web App (PWA).
4. **Assinatura Digital ICP-Brasil (A1/A3):** Uso de carimbo digital interno auditado por e-mail, IP e timestamp.
5. **Hardware IoT Físico no Canteiro:** Escopo restrito ao software sem fornecimento de sensores físicos ou RFID.
6. **Renderização de Nuvem de Pontos (Point Cloud):** Foco em malhas poligonais procedurais BIM.
7. **Suporte Multilíngue (i18n):** Plataforma disponibilizada exclusivamente em Português (pt-BR).

---

## 9. MATRIZ GERAL DE RASTREABILIDADE

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                MATRIZ DE RASTREABILIDADE                                 │
├───────┼───────────────────────┼─────────────────────────────┼────────────────────────────┤
│ ID RF │ Módulo Relacionado    │ Caso de Uso (Use Case Java) │ Suíte de Teste Automatizado│
├───────┼───────────────────────┼─────────────────────────────┼────────────────────────────┤
│ RF-01 │ Módulo 1 (IAM/RBAC)   │ AuthenticateUserUseCase     │ AuthIntegrationTest.java   │
│ RF-02 │ Módulo 1 (Multi-Tenant│ SwitchTenantUseCase         │ TenantIsolationTest.java   │
│ RF-04 │ Módulo 2 (Empreend.)  │ CreateEmpreendimentoUseCase │ EmpreendimentoTest.java    │
│ RF-06 │ Módulo 3 (BIM 3D)     │ RenderModel3DUseCase        │ ThreeJsRenderSpec.ts       │
│ RF-08 │ Módulo 3 (Extrusão 2D)│ Extrude2DPlanUseCase        │ CadParserTest.java         │
│ RF-10 │ Módulo 4 (Documentos) │ VersionDocumentUseCase      │ DocumentRepositoryTest.java│
│ RF-12 │ Módulo 5 (NFe 44dig)  │ ImportNfeSefazUseCase       │ NfeMódulo11ValidatorTest   │
│ RF-13 │ Módulo 5 (SKU Estoque)│ MoveStockItemUseCase        │ StockMovementTest.java     │
│ RF-15 │ Módulo 6 (RFQ B2B)    │ ProcessRfqBidUseCase        │ RfqMarketplaceTest.java    │
│ RF-17 │ Módulo 7 (RDO Voz IA) │ GenerateRdoFromAudioUseCase │ GeminiIaRdoParserTest.java │
│ RF-18 │ Módulo 7 (NR-18/ISO)  │ RegisterInspectionUseCase   │ InspectionLogTest.java     │
│ RF-20 │ Módulo 8 (Vendas 360) │ ReserveUnitUseCase          │ RealEstateSalesTest.java   │
│ RF-21 │ Módulo 8 (Simulador)  │ CalculateFinancingUseCase   │ FinancingCalculatorTest    │
│ RF-23 │ Módulo 9 (Portal B2C) │ GetOwnerDashboardUseCase    │ OwnerPortalE2E.spec.ts     │
│ RF-25 │ Módulo 10 (NBR 15575) │ OpenWarrantyTicketUseCase   │ Nbr15575SLA24hTest.java    │
│ RF-27 │ Módulo 11 (Chat B2B)  │ SendChatMessageUseCase      │ ChatPubSubTest.java        │
│ RF-29 │ Módulo 12 (Auditoria) │ LogAuditEventUseCase        │ AuditTrailAppendOnlyTest   │
│ RF-30 │ Módulo 12 (LGPD)      │ ExportUserDataJsonUseCase   │ LgpdPortabilityTest.java   │
└───────┴───────────────────────┴─────────────────────────────┴────────────────────────────┘
```

---

## 10. CRITÉRIOS DE ACEITAÇÃO DO PROJETO

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                CRITÉRIOS DE ACEITAÇÃO                                    │
├──────────────────────────┬───────────────────────────────────────────────────────────────┤
│ Critério                 │ Condição Objetiva de Verificação                              │
├──────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 1. Compilação Limpa      │ O backend Java deve compilar via 'mvn test' com BUILD SUCCESS │
│                          │ e 0 falhas nos 11 testes unitários/integração.                │
│ 2. Build Frontend Limpo  │ O frontend React deve compilar via 'npm run build' com 0 erros│
│                          │ de TypeScript ou bundling Vite.                               │
│ 3. Ausência de Erros Console| A navegação por todas as 13 telas do sistema não deve emitir│
│                          │ exceções não tratadas no console do navegador (0 Unhandled).  │
│ 4. Isolamento Multi-Tenant| 100% dos dados exibidos devem corresponder estritamente à     │
│                          │ empresa (CNPJ) selecionada no cabeçalho corporativo.          │
│ 5. Fidelidade RBAC/IAM   │ A alternância entre os 11 perfis deve ocultar ou exibir as    │
│                          │ abas e ações permitidas com 100% de precisão funcional.       │
│ 6. Desempenho 3D WebGL   │ O modelo 3D deve renderizar com taxa >= 30 FPS e responder    │
│                          │ ao clique para inspeção de atributos e movimentação X,Y,Z.    │
│ 7. Conciliação NFe SEFAZ │ A digitação da chave de 44 dígitos deve validar o módulo 11 e │
│                          │ preencher automaticamente o fornecedor e itens de estoque.    │
│ 8. Portabilidade LGPD    │ O botão 'Exportar Dados' na aba LGPD deve baixar o arquivo    │
│                          │ JSON estruturado contendo o histórico do titular.             │
│ 9. Testes E2E Playwright │ A suíte de testes E2E em Playwright deve executar o fluxo     │
│                          │ completo de login, navegação e 3D em Chromium e Mobile.       │
│ 10. Documentação GitHub  │ Repositório GitHub contendo código-fonte atualizado, README   │
│                          │ com instruções de execução e pasta /docs documentada.         │
└──────────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

## 11. GERENCIAMENTO DE RISCOS INICIAIS E PLANO DE MITIGAÇÃO

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MATRIZ DE RISCOS DO PROJETO                              │
├───────┬───────────────────────────────┬─────────────┬───────────┬────────────────────────┤
│ ID    │ Descrição do Risco            │ Probabilidade│ Impacto   │ Plano de Mitigação     │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-01  │ Expansão excessiva de escopo  │ Média       │ Alto      │ Adotar estritamente as │
│       │ (Scope Creep) durante o semestre│           │           │ exclusões do item 8.3. │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-02  │ Dificuldade na curva de aprendi-│ Média     │ Médio     │ Utilizar abstrações    │
│       │ zado do Three.js e WebGL 3D   │             │           │ procedurais simples.   │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-03  │ Indisponibilidade de serviços │ Baixa       │ Médio     │ Implementar fallbacks  │
│       │ externos (SEFAZ / AWS S3)     │             │           │ locais em dados mock.  │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-04  │ Incompatibilidade de layout   │ Média       │ Médio     │ Aplicar Design System  │
│       │ em telas mobile pequenas      │             │           │ Tailwind Mobile-First. │
├───────┼───────────────────────────────┼─────────────┼───────────┼────────────────────────┤
│ R-05  │ Atraso na entrega dos relatórios│ Baixa     │ Alto      │ Manter versionamento  │
│       │ e documentações técnicas      │             │           │ contínuo em Markdown.  │
└───────┴───────────────────────────────┴─────────────┴───────────┴────────────────────────┘
```

---

## 12. ENTREGÁVEIS TANGÍVEIS E ENCERRAMENTO

### 12.1 Entregáveis Tangíveis
1. **Código-Fonte Completo da Aplicação:** Repositório Git contendo o Frontend (React 18 + TypeScript + Vite + Tailwind CSS), Backend (Java 21 + Spring Boot 3.2 + Spring Security) e scripts de banco de dados (Flyway SQL).
2. **Documentação Arquitetural e de Requisitos:** DDE v3.2 consolidado, especificação de requisitos, registros de decisão arquitetural (ADRs) e diagramas UML/C4 Model.
3. **Infraestrutura como Código (IaC) e DevOps:** Scripts Terraform (`main.tf`, `variables.tf`) para AWS EKS / PostgreSQL e pipeline de CI/CD `Jenkinsfile` automatizado.
4. **Suíte de Testes Automatizados:** Suíte de testes unitários/integração no backend (JUnit 5) e testes E2E no frontend (Playwright).
5. **Manuais do Usuário e Manuais Operacionais:** Manual do usuário por tela (`05_MANUAL_DO_USUARIO_TELAS.md`), guia de integração Jenkins (`06_INTEGRACAO_JENKINS_CICD.md`) e guia de auditoria (`07_SISTEMA_DE_LOGS_E_AUDITORIA.md`).

---

**Arcoverde/PE, 17 de Setembro de 2026.**

________________________________________  
**João Pedro**  
*Desenvolvedor / Aluno*

________________________________________  
**Marcos Henrique**  
*Desenvolvedor / Aluno*

________________________________________  
**Prof. Dennys Carvalho**  
*Professor Orientador*
