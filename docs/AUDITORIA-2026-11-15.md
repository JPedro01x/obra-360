# Auditoria técnica — 15/11/2026

> Registro histórico da primeira auditoria do dia. A migração posterior para Boot 4 resolveu os avisos pendentes aqui descritos; consulte [a validação atualizada](VALIDACAO-CORPORATIVA-2026-11-15.md) para o estado posterior e suas limitações.

## Escopo e preservação

Regressão automatizada, regras de negócio, permissões, integridade transacional, carga HTTP e consulta de dependências vulneráveis. As mutações foram executadas em bancos e diretórios isolados com dados sintéticos. Não houve teste destrutivo nos cadastros locais.

Backup integral antes da atualização: `backups/2026-11-15T21-52-01.673Z`, 18 arquivos, verificação de integridade aprovada. O driver H2 2.3.232 leu uma cópia da base local em modo somente leitura: 55 tabelas e 2.816 registros. Isso comprova compatibilidade de leitura dessa cópia, não substitui a validação funcional.

## Correções realizadas

- Spring Boot 3.2.4 → 3.5.16 e Springdoc 2.5.0 → 2.8.17, com regressão em banco H2 e PostgreSQL.
- Atualizações de correção: Jackson 2.21.7, Tomcat 10.1.59, PostgreSQL JDBC 42.7.12, Commons Lang 3.18.0, Log4j 2.25.5, LZ4 1.11.4 e Snappy 1.1.10.9.
- Inclusão do módulo PostgreSQL do Flyway, necessário após a atualização.
- Laboratório ampliado com consulta a detalhes da obra e financeiro, concorrência financeira, tentativa de alterar empresa via corpo da requisição e verificação de recuperação após carga.
- Auditoria repetível das dependências contidas no JAR compilado, com hash e relatório OSV. A consulta envia somente coordenadas e versões das bibliotecas.

## Evidências

| Verificação | Resultado |
| --- | --- |
| Java/H2, pacote atualizado | 113 testes executados, sem falhas; os 87 condicionais de PostgreSQL são executados separadamente |
| PostgreSQL, pacote atualizado | 87 testes executados, sem falhas nem testes ignorados |
| Interface automatizada | 74 testes aprovados; esta suíte utiliza API simulada |
| Jornada operacional pelo navegador com API e banco reais | 1 teste extenso aprovado, incluindo orçamento, compras, estoque e financeiro |
| Perfis e permissões pelo navegador com API e banco reais | 17 testes aprovados: quinze perfis, matriz de gravação e acesso de colaborador |
| Scripts Node | 9 testes aprovados |
| TypeScript | Sem erros |
| Compilação do pacote atualizado | Aprovada |
| Auditoria npm consultada nesta execução | Nenhuma vulnerabilidade conhecida reportada |
| Auditoria Java inicial | 23 pacotes com avisos, 114 identificadores únicos de avisos |
| Auditoria Java após correções | 1 pacote com 2 avisos; pendências abaixo |

Logs locais: `scratch/auditoria-patches.log`, `scratch/auditoria-patches-postgres.log`, `scratch/auditoria-interface.log`, `scratch/auditoria-scripts.log`, `scratch/auditoria-types.log`, `scratch/auditoria-build-final.log` e `scratch/auditoria-npm.json`.

As jornadas finais constam em `scratch/auditoria-integrada-final.log` e `scratch/auditoria-perfis-final.log`. Somando as execuções efetivamente realizadas nas suítes acima, foram **301 testes aprovados**, além das requisições dos laboratórios. Os 87 testes PostgreSQL ignorados no comando Maven geral não foram contados como aprovação: entraram na soma somente após a execução separada no PostgreSQL.

## Negócio, integridade e segurança

As suítes verificam autenticação e JWT adulterado, bloqueio de usuários inativos, revogação de sessões, isolamento de empresas, permissões por perfil, dados de RH, arquivos privados, recuperação de senha, limites de plano e prevenção de promoção indevida de perfil.

Também verificam vínculos entre equipe/contrato/obra, datas inválidas, estoque insuficiente, consumo em OS, orçamento e revisão, compras com aprovações distintas, recebimento parcial, devoluções, contas a pagar/receber, baixas, estornos, conciliação, modelos e revisões, exclusões com vínculos e histórico de desligamento.

No laboratório concorrente:

- 40 saídas disputando 10 unidades: 10 aprovadas, 30 conflitos esperados e saldo final zero.
- Repetições de movimentação e baixa financeira não duplicaram efeitos.
- 30 baixas com a mesma chave produziram um único lançamento.
- 30 chaves distintas disputando a mesma versão produziram uma aprovação e 29 conflitos; os valores foram conferidos no banco.
- Uma chave já utilizada com valor diferente foi rejeitada.
- Consultas de outra empresa e tentativa de alteração de empresa pelo cliente foram bloqueadas.

Conflitos esperados nas escritas são resultado correto de proteção de integridade, não falhas da aplicação.

## Carga do pacote atualizado

PostgreSQL isolado, HTTP em loopback, host com 8 CPUs lógicas e 16 GB de memória, heap Java limitado a 768 MB, pool de 10 conexões e 50 threads HTTP. Base de estoque com 1.001 registros. O limitador de requisições foi elevado somente no laboratório para medir a aplicação.

Na repetição final do comando `npm run test:stress`, foram executadas **3.600 consultas** em seis estágios: 5, 15, 30, 60, 100 e 200 requisições simultâneas. Todos os estágios terminaram com zero falhas. No estágio de 200: p95 de **1.083,95 ms**, p99 de 1.166,77 ms e aproximadamente 310,18 requisições por segundo. Após a carga, 25 consultas passaram e os saldos financeiros permaneceram íntegros. Uma execução anterior do mesmo pacote também passou, com p95 de 815,96 ms no estágio de 200; a variação reforça que são medições locais.

Evidência final: `test-results/system-lab-cpny73/resultado.json`; execução anterior: `scratch/seguranca-upgrade/test-results/system-lab-rVGknK/resultado.json`. Os relatórios contêm o hash do JAR efetivamente testado. Havia outros processos de validação no host; os números descrevem essas execuções, não uma capacidade comercial contratada. O comando final só aprova se todos os estágios solicitados forem concluídos sem falhas e a carga nominal cumprir a meta de p95 de 2 segundos.

Requisições simultâneas não equivalem a usuários humanos conectados. O ensaio é curto e local: não mede semanas de operação, redes móveis, infraestrutura de produção, volumes muito maiores, provedores externos ou renderização de modelos 3D grandes.

O diagnóstico após reiniciar a instalação atualizada confirmou API, interface, instalação existente, bloqueio da consulta sem autenticação, disco e backup íntegro (`scratch/auditoria-diagnostico.log`). Requisições aos arquivos existentes de configuração do backend e ao manifesto de backup pelo servidor frontend retornaram 403, sem leitura do conteúdo.

Os testes de RH cobrem as regras administrativas implementadas. Não homologam cálculos legais de folha/rescisão, obrigações trabalhistas ou eSocial, mantidos desativados. Google, IA, e-mail e SEFAZ sem credenciais/provedor configurado não foram apresentados como integrações externas operacionais; o teste de e-mail usa servidor SMTP de captura local.

## Pendências de segurança — não considerar encerradas

A consulta final identificou 98 pacotes Maven e dois avisos para `org.springframework:spring-webmvc:6.2.19`:

- [GHSA-j9f9-w8pj-32f8](https://osv.dev/vulnerability/GHSA-j9f9-w8pj-32f8): corrupção de stream SSE ao renderizar fragmentos.
- [GHSA-pc63-qcmh-9cmg](https://osv.dev/vulnerability/GHSA-pc63-qcmh-9cmg): uso de XsltView em determinadas configurações pode permitir SSRF e execução de código.

Não foram encontradas referências a SseEmitter, text/event-stream, XsltView ou ViewResolver no código da aplicação. Isso reduz a indicação de aplicabilidade nesta configuração, mas não elimina os avisos da biblioteca. O utilitário de empacotamento `spring-boot-jarmode-tools-3.5.16.jar` não foi identificado pelo catálogo local e ficou explicitamente fora da consulta.

**A migração para uma linha Spring Boot 4/Spring Framework 7 com as correções indicadas deve ser concluída antes de considerar a atualização de segurança encerrada.** Não foi feita troca forçada de Spring Framework 7 dentro de Boot 3.5, pois é uma combinação sem validação de compatibilidade.

A linha Boot 3.5 chegou ao [fim do suporte OSS](https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/). A mudança aplicada é uma etapa intermediária de redução de risco, não a plataforma definitiva para comercialização. A [migração oficial para Boot 4](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide) envolve mudanças de módulos e serialização e exige nova regressão completa.

Relatório final das bibliotecas: `test-results/java-dependencies-1794779752225.json`. Identificadores de avisos não são contagem de ataques comprovados; ausência de aviso também não certifica ausência de vulnerabilidades.

## Repetir as verificações

```text
npm run typecheck
npm test
npm run test:postgres
npm run test:integrated
npm run test:roles
npm run test:stress
npm run audit:java
npm audit
```

`test:integrated` e `test:roles` compartilham portas e devem rodar sequencialmente. `audit:java` exige o JAR compilado e acesso à API pública OSV; termina com código 1 enquanto houver avisos. `test:stress` não aceita destino externo e cria seu próprio PostgreSQL. Os resultados não equivalem a pentest independente completo, aceite de usuários da empresa ou certificação de funcionamento perfeito.
