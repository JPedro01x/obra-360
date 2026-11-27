# Assistente de configuração inicial da obra

## Intenção

Ao cadastrar uma nova obra, orientar o responsável a completar seus vínculos operacionais — equipe, pessoas, materiais, cronograma, planta 2D e cliente — sem transformar o cadastro em uma única transação frágil. A obra deve continuar acessível enquanto sua configuração é concluída.

## Abordagem escolhida

Usar um assistente em etapas após salvar os dados básicos da obra. Cada etapa grava pelo fluxo e endpoint do módulo correspondente. O usuário pode pausar e retomar; a tela mostra etapas concluídas, pendentes ou não aplicáveis com base em registros persistidos, sem criar dados de demonstração.

Esta abordagem mantém os limites de autorização e validação de RH, estoque, cronograma, modelador e portal externo. Um formulário único exigiria misturar regras e uploads numa transação difícil de reverter. Manter tudo para depois preservaria o cadastro curto, mas não daria a visão guiada que o usuário pediu.

## Escopo funcional

- **Dados básicos:** preservar nome, engenheiro responsável, área, VGV, data de início e entrega prevista atuais. O engenheiro e o período permanecem obrigatórios.
- **Equipe e pessoas:** permitir selecionar ou cadastrar uma equipe vinculada à obra e selecionar funcionários ativos já cadastrados no RH. A equipe precisa ter um líder permitido; vínculos de funcionários usam somente pessoas da empresa atual.
- **Materiais:** permitir registrar materiais do estoque vinculados à nova obra. Criar um item começa com saldo zero. Só uma entrada de estoque explícita registra material realmente recebido; quantidade planejada não vira saldo.
- **Tempo de trabalho:** preservar o período geral da obra e permitir planejar etapas ordenadas com datas dentro desse período. Nenhuma etapa ou duração é inventada automaticamente.
- **Planta 2D:** permitir criar um modelo para a obra e abrir o Modelador para desenhar ou traçar uma referência. A etapa só aparece concluída após salvar uma revisão com conteúdo; um modelo vazio ou rascunho local fica pendente.
- **Cliente:** vincular um usuário com perfil de cliente a uma unidade da obra. Se ainda não houver unidade, o assistente permite cadastrá-la antes do vínculo. A autorização continua limitada à unidade concedida.
- **Continuação:** guardar a obra mesmo se o usuário sair do assistente. Ao reabrir a obra, apresentar o estado das etapas e permitir concluir as pendentes conforme as permissões da conta.

## Regras e limites

- A empresa e o usuário responsável são derivados da sessão no servidor; todo ID recebido deve ser validado no tenant atual e na obra indicada.
- A etapa de uma lista só aparece como disponível quando o perfil possui permissão no módulo correspondente. Usuário sem permissão não recebe o formulário ou a ação.
- Materiais, clientes, funcionários, equipes, unidades, cronograma e modelos não podem ser vinculados a outra empresa ou obra.
- Cada etapa salva no seu próprio fluxo. Falha numa etapa mantém a obra e as etapas anteriormente salvas, mostra o erro e permite tentar novamente.
- O assistente não cria pessoas, equipes, estoque, cronograma, clientes, unidades ou plantas fictícias. Não faz pedido externo nem publica a planta ao cliente automaticamente.
- Etapas podem ser marcadas como não aplicáveis quando o tipo de obra não exigir cliente, estoque ou planta, com justificativa curta persistida no registro de configuração da obra ou derivada por regra acordada na implementação.

## Fora de escopo

- Alterar cadastro/provisionamento de empresas ou a licença multiempresa.
- Criar dados automáticos de orçamento, compras, estoque recebido, etapas-modelo ou geometria de planta.
- Conceder acesso ao cliente sem confirmação de usuário, unidade e permissão apropriados.
- Tornar obrigatório que todas as obras tenham cliente/unidade, estoque ou planta antes de poderem ser salvas.

## Critérios de aceite

1. Uma obra pode ser criada com os campos básicos atuais e abre o assistente identificando claramente o que falta.
2. Cada etapa salva vínculos reais na API e no banco, valida tenant, obra e permissão e pode ser retomada depois.
3. Funcionários, líder e equipe ficam vinculados à mesma obra; plano e datas ficam dentro do período; materiais não recebidos mantêm saldo zero.
4. O acesso do cliente é concedido apenas para unidade vinculada à obra, depois da ação explícita de um administrador autorizado.
5. Uma planta só aparece como concluída após revisão persistida com conteúdo no modelador.
6. Falhas de gravação preservam o que já foi salvo e indicam a etapa que precisa de nova tentativa.

## Revisão necessária

O usuário escolheu o assistente em etapas. Confirmar este desenho antes de criar o plano de implementação e alterar o produto.
