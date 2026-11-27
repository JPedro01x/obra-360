# Validação técnica do pacote de piloto — 27/11/2026

## Resultado desta cópia

**Status: INCOMPLETO.** Esta evidência registra verificações desta rodada. Não declara prontidão de produção, implantação, restauração ou aceite de cliente.

| Verificação | Resultado | Evidência/limite |
| --- | --- | --- |
| Testes do agregador de prontidão | Aprovado, 6/6 | `node --test scripts/pilot-readiness.test.mjs` |
| BIM IFC no navegador | Aprovado, 3/3 | `npm run test:bim`: geometria IFC4 em milímetros convertida para metros, parser e schema 3 no JSON local, e rejeição segura de IFC inválido/maior que 20 MB. A persistência no backend não é coberta por esta suíte isolada. |
| TypeScript e build frontend | Aprovado | `npm run typecheck` e `node node_modules/vite/bin/vite.js build` concluíram com código 0. O IFC WASM permanece um artefato grande carregado sob demanda; o build não é evidência de desempenho em máquinas fracas. |
| Maven — limite Clean Architecture e IFC | Aprovado, 6/6 | `mvn -q '-Dtest=ObraCatalogoArchitectureBoundaryTest,ModeloDocumentoIfcTest' test`: 2 testes de fronteira e 4 testes de documento IFC. |
| Jornada integrada navegador/API/banco | Não aprovada | A versão anterior consultou um serviço na porta padrão 8081; o harness foi isolado na porta 8181 e o primeiro cadastro persistiu. A execução parou porque `POST /api/v1/auth/login` excedeu o timeout de 15 s após o cadastro. A jornada não chegou aos testes IFC com persistência, então salvamento e reabertura no backend permanecem sem prova ponta a ponta. |
| `npm run piloto:validar` | Manifesto incompleto | A última execução `--no-validation` gerou `test-results/pilot-readiness-2026-11-27T14-55-23.110Z.json`, com hash de snapshot `e6585d17640efd2db93c60254ae1bc91b3c20663a058a68ce9f01ac7705d8469`. O manifesto mantém validações de código pendentes por opção explícita. |
| Docker Compose e imagem de produção | Pendente | Docker Compose não está disponível neste computador; nenhum serviço ou imagem foi validado. |
| Vínculo com commit | Pendente | Esta cópia de trabalho não possui metadados Git. |
| Aceite humano e ensaio real de restauração | Pendente | Não foram fornecidas evidências do operador/cliente nesta rodada. |

O manifesto usa `--no-validation` somente para conferir a coleta do estado. O resultado `INCOMPLETO` é esperado e não valida código. O pacote já tem validações focadas aprovadas, mas a jornada integrada ainda falha e o manifesto completo não foi gerado.

## Identidade e implantação

- Versão declarada em `package.json`: **1.0.0**.
- Hash SHA-256 determinístico do snapshot no manifesto mais recente: **`e6585d17640efd2db93c60254ae1bc91b3c20663a058a68ce9f01ac7705d8469`**. O hash não inclui este relatório técnico datado, para evitar autorreferência; inclui arquivos de fonte, scripts e documentação operacional.
- Commit Git: indisponível nesta cópia.
- Artefato de produção: imagem Docker construída pelo `Dockerfile` e `deploy/compose.production.yml` do snapshot. O pacote `release:package` é um artefato Java alternativo e não comprova a imagem usada pelo Compose.

## Pendências antes de revisão do piloto

1. Investigar o timeout de autenticação no backend de teste e concluir a jornada integrada até a persistência e reabertura do documento IFC.
2. Reexecutar o comando completo até o término, guardando o manifesto e logs sem dados privados.
3. Executar as verificações de backend, PostgreSQL, jornadas do produto e build Compose em ambiente com dependências suportadas.
4. Conferir configuração privada, saúde dos serviços, TLS, perfis de banco e imagem no destino de pré-produção.
5. Realizar e registrar restauração em ambiente isolado e obter aceite humano com evidências reais.

Nenhuma publicação foi feita. O relatório, manifesto e logs não devem conter credenciais ou dados reais de cliente.
