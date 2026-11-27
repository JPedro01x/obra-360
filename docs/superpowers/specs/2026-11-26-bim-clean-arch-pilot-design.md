# Design: BIM real, fronteiras de arquitetura e piloto de produção

## Intenção

Entregar um caminho de modelagem que use a geometria real recebida em IFC, preserve a correspondência entre a planta 2D e a vista 3D, aproxime o backend de Clean Architecture sem uma reescrita ampla e gere evidências reproduzíveis para uma liberação de piloto.

## Estado observado

- A aplicação de demonstração contém importação IFC e geração 2D/3D simuladas.
- O editor da aplicação corporativa possui geometria paramétrica persistida, mas a importação no editor aceita apenas o JSON próprio; IFC é lido separadamente para quantidades.
- O backend já separa pacotes `domain`, `application` e `infrastructure`, mas entidades do domínio dependem de JPA/Spring Data e alguns controllers consultam `EntityManager` diretamente.
- A entrega tem Compose de produção, scripts de release, pré-produção e operação. Falta uma evidência única atual, ligada ao commit e ao artefato final; o relatório de auditoria histórico não corresponde à versão Boot declarada hoje no Maven.
- A pasta aberta não possui `.git`; a branch `main` e o commit base foram conferidos pelo conector do GitHub. A sincronização final deve preservar o commit pai atual do remoto.

## Abordagens consideradas

### BIM

1. Converter cada elemento IFC em caixa ou dimensão aproximada: simples e leve, mas perde a forma real do modelo.
2. Ler as malhas trianguladas do IFC, preservá-las no documento persistido e renderizá-las tanto na vista 3D quanto como projeção superior 2D: mantém a geometria recebida e permite seleção/revisão; exige limites explícitos para arquivo, elementos e tamanho serializado. **Escolhida.**

### Clean Architecture

1. Reescrever todos os módulos e entidades em uma única etapa: cria alto risco de regressão e mistura a entrega com mudanças fora do piloto.
2. Criar uma fronteira completa em um fluxo vertical, adicionar teste automatizado de dependências e migrar os próximos módulos de forma rastreável: menor risco e prova executável da regra. **Escolhida.**

### Piloto

1. Manter apenas instruções manuais: baixo custo inicial, mas não prova que o pacote validado é o que será instalado.
2. Criar comando de prontidão que execute validações locais, produza um relatório com commit, versões e hashes e reutilize o Compose/runbook existentes: reproduzível sem alegar que configurações privadas ou serviços externos foram homologados. **Escolhida.**

## Comportamento esperado

- A importação IFC no editor real deve ler a geometria do arquivo, mostrar erros explicativos para IFC inválido ou acima dos limites e criar elementos selecionáveis na planta e no 3D. Não deve inserir elementos genéricos quando a leitura falhar.
- A geometria importada fica no documento do modelo, portanto segue as revisões, rascunhos, exportação JSON, publicação e controle de empresa existentes.
- Elementos desenhados nativamente em 2D continuam sendo a fonte geométrica comum das vistas 2D e 3D; o editor não promete reconstrução perfeita de qualquer imagem raster.
- O novo fluxo vertical de Clean Architecture usa caso de uso em `application`, portas independentes de framework em `domain`, adaptador JPA em `infrastructure` e controller HTTP sem acesso ao ORM.
- O teste de arquitetura verifica que os namespaces novos de modelo, porta e caso de uso não importam Jakarta Persistence/Spring Data nem dependem de infrastructure. Os módulos legados serão listados como dívida; a regra não alegará que foram migrados.
- A prontidão do piloto termina com aprovação explícita das etapas no ambiente de destino. Um relatório local verde não equivale a publicação, aceite comercial, pentest ou homologação dos fornecedores.

## Limites

- Sem host, domínio e segredos do operador, preparar e validar o pacote, mas não publicar na internet.
- Sem credenciais de provedor, validar apenas comportamento de indisponibilidade e contratos locais das integrações.
- Não migrar todas as entidades e controllers no mesmo lote; o relatório lista os módulos ainda fora da fronteira.
- Para proveniência local sem `.git`, o comando registra hash determinístico da árvore-fonte e deixa `commit` ausente; o aceite final exige rodar novamente em checkout Git do commit liberado.
- Não afirmar que qualquer CAD/BIM, cálculo estrutural, quantitativo inferido ou conformidade normativa é suportado.

## Decisões do implementador

- Manter formatos, limites e compatibilidade de versões anteriores explícitos e testados.
- Não substituir fontes e dados locais sem comparar com o repositório GitHub informado pelo usuário.
- Atualizar a documentação técnica para refletir somente o que estiver demonstrado pelo código e pelo relatório de validação.
