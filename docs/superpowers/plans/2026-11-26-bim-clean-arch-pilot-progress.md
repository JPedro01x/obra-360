# Progresso — BIM Real, Clean Architecture e Piloto

## Rodada 1 de correções do pacote de prontidão — 27/11/2026

- Ajustado o aceite humano: fica `PENDENTE` por padrão. `--confirm-human-acceptance` só registra a declaração do operador se `PRODUCTION_PILOT_REPORT` apontar para um JSON estruturalmente completo; o manifesto declara que a autenticidade das evidências não foi verificada independentemente.
- Corrigida a proveniência do artefato: `caminhoConfiguradoParaCompose` descreve a receita de produção e `construidoNesteSnapshot` vale `true` somente após build bem-sucedido e retorno de ID; é `false` quando build tentado não conclui com ID e `null` quando não verificado. Mantida a distinção entre imagem Compose e pacote `release:package`.
- Adicionado `relatorioRelativo` ao JSON. O relatório mantém também versão do pacote, hash do snapshot, commit quando disponível, hash Dockerfile/Compose e estado dos serviços.
- Timeout agora solicita encerramento da árvore de processos: `taskkill /T /F` no Windows e sinalização do grupo de processos em sistemas POSIX (TERM seguido de KILL após 2,5 s). A validação expirada permanece `FALHOU`.
- Documentação atualizada em `ENTREGA-PILOTO.md` e `OPERACAO-PRODUCAO.md`; o comportamento do modo observabilidade não mudou.

### Verificação desta rodada

- Testes primeiro: `node --test scripts/pilot-readiness.test.mjs` falhou como esperado antes da implementação porque os novos helpers não existiam.
- Após as alterações: `node --test scripts/pilot-readiness.test.mjs` — **6/6 aprovados**.
- `node --check scripts/pilot-readiness.mjs` — aprovado.
- `node --check scripts/pilot-readiness-lib.mjs` — aprovado.
- `npm run piloto:validar -- --no-validation` — produziu `test-results/pilot-readiness-2026-11-27T13-27-42.258Z.json`, status `INCOMPLETO`; validações de código, commit Git, Docker Compose/serviços, aceite e restauração constam pendentes. Confirma o campo `relatorioRelativo`, `construidoNesteSnapshot: null` e aceite não declarado.
- Não houve publicação nem alteração de fluxo de deploy. O build Compose real continua sem validação nesta máquina.

## Revisão focada — cobertura BIM Task 1 — 27/11/2026

- `tests/e2e/ifc-geometry.spec.ts`: título passou a declarar que a validação é local (parser/schema/serialização JSON), sem chamar isso de salvamento/reabertura de backend.
- `tests/integrated/operational-flow.spec.ts`: a jornada existente agora exporta o documento antes e depois de erros de IFC inválido e acima de 20 MiB e compara os snapshots completos; importa `geometry-mm.ifc` pelo input do ModelEditor; verifica a seleção da projeção com `data-element-id`, a presença do canvas 3D, e GUID/tipo/buffers/schema 3 no payload PUT e no GET após recarregar.
- A seleção por clique central no viewport 3D foi deixada fora: a jornada contém elementos nativos potencialmente sobrepostos, tornando ambíguo qual objeto o raycast selecionaria. A cobertura verifica seleção 2D e renderização disponível em 3D; não afirma seleção 3D.
- `playwright.bim.config.ts` havia sido alterado na tentativa anterior para servir módulos do parser pelo Vite local.

### Verificação desta revisão

- `npm run test:integrated -- --grep "complete operation through browser, API and database"` foi iniciado duas vezes; em ambas o runner imprimiu apenas avisos `NO_COLOR` dos WebServers e não chegou a apresentar o teste. A tentativa mais recente foi interrompida após ~45 s sem progresso (exit 1). Não há resultado de teste nem aprovação a registrar.
- A chamada anterior do `npm run test:bim` com import direto do parser no runner Node falhou antes de descobrir testes, pois Node não resolve `web-ifc.wasm?url`; tentativa subsequente de adaptação browser/Vite também ficou sem status e foi interrompida. O caso parser-only segue sem verificação nesta sessão.
- Não foram executados Maven, build nem typecheck nesta revisão.

## Rodada 2 — seleção BIM 2D/3D — 27/11/2026

- `tests/integrated/operational-flow.spec.ts`: ao fim do trecho de modelador, cria `IFC seleção isolada E2E`, importa a fixture única, seleciona pelo polígono da planta e verifica o inspector; Shift-click limpa a seleção anterior; em 3D enquadra a única malha e clica o centro do canvas, verificando que o inspector seleciona o mesmo nome. Salva o modelo isolado como revisão 2.
- Verificação: `npm run test:integrated -- --grep "complete operation through browser, API and database"` mostrou apenas os avisos NO_COLOR dos dois WebServers; não chegou a iniciar o teste em ~45 s e foi interrompido (exit 1). Não há resultado para afirmar seleção 3D aprovada.
- Nenhum processo adicional foi iniciado após a tentativa. Sem Maven, build ou typecheck.

## Rodada 4 — composição Spring do catálogo de obras — 27/11/2026

- O teste `cleanSliceHasOnlyInwardDependencies` identificou que `ObraCatalogoConfiguration` importava `ListObrasPorEmpresa` dentro do pacote `infrastructure.persistence.adapter`. A configuração agora fica em `br.com.obra360.infrastructure.configuration`, sob o pacote escaneado por `Obra360Application`. O bean continua recebendo `ObraCatalogoReadPort`.
- Em `obra360-backend`, `mvn -q '-Dtest=ObraCatalogoArchitectureBoundaryTest,ModeloDocumentoIfcTest' test` terminou com código 0. O Surefire registrou 2 testes de arquitetura e 4 de documentos IFC aprovados, com zero falhas, erros ou testes ignorados.

## Revisão de execução BIM e integração — 27/11/2026

- A suíte Playwright isolada confirmou 3/3 cenários: unidade/ orientação da malha IFC, parser e validação JSON local, e rejeição de arquivo inválido/acima de 20 MB. As expectativas de tipo agora preservam o nome convencional retornado pelo `web-ifc` (`IfcWall`), sem converter a origem para uma grafia diferente.
- A jornada integrada requer porta de API isolada. O harness passa agora `PORT` e `SERVER_PORT` explicitamente e o timeout de inicialização Playwright foi ampliado para 300 s. A porta padrão 8081 estava ocupada por serviço externo ao teste; a jornada foi repetida em 8181.
- No ambiente isolado, a instalação inicial foi persistida e `GET /api/v1/instalacao` passou a responder `necessaria=false`. A jornada não terminou: o `POST /api/v1/auth/login` após o setup excedeu o timeout de request de 15 s. Ainda não foi demonstrada a persistência e reabertura IFC por API/banco.
- Depois da sincronização do cadastro, outras tentativas anteriores avançaram e revelaram os rótulos atualizados da UI (`Projetos`) e o assistente automático de configuração de obra. O teste foi alinhado a essas alterações e fecha o assistente antes de seguir para outros módulos.
- Atualizado `docs/VALIDACAO-TECNICA-PILOTO-2026-11-27.md`: status permanece `INCOMPLETO`, com evidência de testes focados aprovados, jornada integrada não aprovada, Docker Compose ausente, sem Git local, restauração ou aceite humano.
