# Melhorias e validação de segurança, capacidade e integridade

Data: 11/11/2026. Alterações na pasta de trabalho sobre a base Git 639d4fc. Este relatório descreve o bloco de qualidade, garantia, notificações e proteção de recursos, preservando as entregas anteriores de RH, OS, contratos e compras. Não declara concluído todo o roteiro corporativo.

## Funcionalidades adicionadas

### Qualidade

- Ocorrências ALTA e CRITICA exigem foto já no cadastro.
- A tela aceita metadados e foto na mesma operação; ocorrências antigas graves também precisam de foto para serem resolvidas.
- Há anexação posterior, consulta e download de evidências, com limite de 20 fotos por ocorrência.
- Fotos aceitas: PNG/JPEG, até 5 MB enviados, até 12 megapixels e 8192 pixels por lado. O servidor identifica o formato pelo conteúdo, compara o MIME, ignora metadados opcionais e recodifica a imagem, sem preservar seus metadados originais. A evidência armazenada é a imagem normalizada, com hash próprio.
- Arquivos normalizados ficam limitados a 10 MB. SVG, conteúdo inválido e MIME incompatível são rejeitados.
- A imagem e os metadados persistem de forma coordenada; um rollback aciona a remoção do arquivo recém-gravado. A rotina registra falhas de limpeza para acompanhamento.
- Acesso a fotos restrito a gestores/engenharia e auditoria; apenas gestores/engenharia podem anexar.
- Ocorrências resolvidas não aceitam novas fotos ou reabertura por esse fluxo.

### Garantias

- Cadastro de condições, categoria e intervalo de datas por unidade.
- Novos chamados classificam o prazo automaticamente como DENTRO_PRAZO, FORA_PRAZO ou NAO_CONFIGURADA, conforme o cadastro existente na abertura.
- Essa classificação administrativa não substitui a avaliação técnica. Um responsável registra COBERTA ou NAO_COBERTA com motivo.
- O titular precisa ser um cliente ativo com acesso concedido à unidade e obra correspondentes. A validação ocorre também no backend e no portal.
- Agendamento de vistoria com responsável e data futura.
- Geração de OS após aprovação da cobertura, respeitando obra, equipe, vigência contratual e SLA. A repetição da conversão retorna o vínculo existente.
- O chamado com OS somente é concluído após concluir a OS. Um chamado sem OS pode ser encerrado após avaliação negativa registrada.
- Chamados concluídos não retornam à abertura por essa operação.

O cadastro atual de cobertura é único por categoria/unidade e não inclui edição ou versionamento de políticas. Chamados antigos não recebem classificação retroativa automática. Essas limitações devem ser consideradas antes de migrar uma operação de pós-venda com políticas históricas.

### Notificações internas

Há avisos persistidos para atribuição de ocorrência, abertura de garantia ao responsável da obra, avaliação ao cliente, agendamento ao cliente e responsável e mudança de situação do chamado. O sino abre consulta paginada e permite marcar a própria notificação como lida. A autorização usa empresa e destinatário no servidor.

As notificações são internas e consultadas pela interface. Não foi implementado envio automático de e-mail, push, WhatsApp ou WebSocket neste bloco.

## Revisão do código e correções

| Ponto | Alteração |
| --- | --- |
| Downloads do GED | Comparação do conteúdo com SHA-256 armazenado. Conteúdo divergente retorna conflito, em vez de ser entregue silenciosamente. |
| Evidências de qualidade | Conteúdo validado e normalizado, chave interna omitida da API e hash conferido no download. |
| Limitador por IP | Contador de janela atualizado atomicamente, expiração de entradas, limite de admissão para novos IPs e Retry-After. Não utiliza X-Forwarded-For fornecido pelo cliente como autoridade. |
| Imagens | Até dois processamentos simultâneos por instância. Excesso recebe 503, sem decodificar outra imagem. |
| Transferências | Até quatro respostas de arquivo/exportação simultâneas por instância, com liberação em finally e Retry-After quando ocupadas. Consultas comuns continuam disponíveis. |
| Cadastro de usuários | DTO explícito, limites dos campos e construção da entidade no servidor; IDs, empresa e metadados de identidade enviados pelo cliente não controlam a nova conta. |
| Recebimento de compras | Valor da entrada informado diretamente pelo total da proposta, antes da validação e persistência, preservando a atualização do custo médio. |
| Controladores | Regras novas de qualidade e garantia concentradas em serviços transacionais. |
| CSP | Acrescentadas restrições de objetos, base de URL, ancestrais de frame e destino de formulários, preservando as permissões anteriores necessárias às funcionalidades existentes. |
| Exportação privada | Inclui os registros novos e as evidências, conferindo sua integridade. |

Os limites de requisições e de recursos são locais a uma instância. Várias réplicas e proxies exigem configuração e validação específicas. A CSP mantém exceções anteriores de scripts/estilos; este trabalho não representa conformidade integral com uma política CSP estrita.

## Testes executados

| Comando/cenário | Resultado |
| --- | --- |
| Maven verify | 87 executados sem falhas; 67 casos condicionais de PostgreSQL ignorados nessa execução |
| Maven: concorrência, arquivos e limitador | 5 aprovados, com sobreposição de quatro testes da suíte anterior e um cenário novo de concorrência de fotos |
| npm run test:postgres | 67 aprovados em PostgreSQL; 27 migrações aplicadas |
| npm test | 55 cenários Chromium aprovados |
| npm run test:integrated | Uma jornada sem mocks HTTP aprovada, incluindo cobertura → vistoria → OS → encerramento, foto/download, RH, compras e modelador |
| npm run build | TypeScript e build Vite aprovados |

Exemplos de verificações: JWT adulterado, troca indevida de empresa pelo cabeçalho, leitura entre empresas, usuário sem perfil administrativo tentando criar conta, campos de identidade excedentes no cadastro, nome acima do limite, foto falsa, evidência de outra empresa, acesso indevido de colaborador, adulteração de arquivo, notificações de outro destinatário e transições de negócio inválidas.

Os testes adicionais de recursos demonstraram duas fotos processadas com uma terceira rejeitada enquanto o processamento estava ocupado; quatro downloads em andamento com a quinta tentativa rejeitada temporariamente; liberação posterior das vagas; e três requisições permitidas em uma janela configurada para três, com nove rejeições em doze tentativas simultâneas.

## Laboratório HTTP de capacidade e integridade

O comando npm run test:system inicia sua própria aplicação e um PostgreSQL descartável em portas aleatórias de loopback. Não aceita endereço externo nem carrega o .env da instalação. Os dados são fixtures identificadas de teste, sem alteração da base da aplicação.

Configuração: 8 CPUs lógicas disponíveis no host, 16 GB de RAM do host, heap Java limitado a 768 MB, pool de até 10 conexões, até 50 threads HTTP e 1001 materiais. O limitador foi ajustado para 100000 requisições/minuto apenas no laboratório; seu comportamento de bloqueio foi verificado separadamente.

Carga: 900 leituras HTTP medidas, alternando resumo e consulta paginada de estoque, após aquecimento. Concorrência significa requisições em voo, não quantidade de pessoas ou capacidade contratada de produção. Percentis e vazão estão no resultado JSON gerado pelo laboratório.

Resultado final do laboratório system-lab-R1Lkb1:

| Requisições em voo | Leituras | Falhas de leitura | p50 | p95 | p99 | Vazão |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | 150 | 0 | 35,21 ms | 74,28 ms | 107,25 ms | 123,13 req/s |
| 15 | 300 | 0 | 60,58 ms | 231,10 ms | 342,63 ms | 180,08 req/s |
| 30 | 450 | 0 | 112,04 ms | 370,90 ms | 506,93 ms | 200,04 req/s |

Foram aplicadas 27 migrações e observadas dez conexões da aplicação após a carga, dentro do pool configurado. O JAR testado possui SHA-256 c7a9b4c0f026b5bb8baf7f90a42481ce3541141dc592fe95d0dd5a3a5d947b16. O resultado final foi aprovado nos critérios do laboratório, incluindo a conferência monetária adicional.

Integridade conferida diretamente no PostgreSQL:

1. Quarenta saídas concorrentes disputando dez unidades: dez aceitas, trinta conflitos esperados e saldo final zero.
2. Repetição de uma entrada com a mesma chave: mesmo registro, sem duplicar saldo.
3. Doze recebimentos simultâneos do mesmo pedido: uma entrada de compra, saldo final dez e custo médio nove no cenário.
4. Conferência do valor do livro de movimentações contra o valor do estoque nesse cenário, ambos noventa.

Os conflitos 409 esperados nos testes de integridade não são erros de leitura da carga. O critério do laboratório é zero erros nas leituras e p95 de até dois segundos nos três níveis medidos. Esse resultado não constitui teste de longa duração, capacidade máxima, SLA, disponibilidade de 99,9% ou homologação do ambiente de produção.

## Evidências e reprodução

Logs locais em test-results: melhorias-backend.log, melhorias-recursos.log, melhorias-postgres.log, melhorias-ui.log, melhorias-integrated.log, melhorias-frontend-build.log e melhorias-capacidade.log. Cada laboratório gera sua pasta system-lab-* com resultado.json e app.log. O JSON identifica o hash SHA-256 do JAR testado.

Para reproduzir, com Java 21, Maven, Node e dependências disponíveis:

```powershell
mvn -f obra360-backend/pom.xml verify
npm run build
npm test
npm run test:postgres
npm run test:integrated
npm run test:system
```

Execute o laboratório de capacidade após os demais testes, evitando concorrer com builds e testes pesados. Os arquivos de testes e relatórios temporários permanecem ignorados pelo Git.

## Limites e próximas etapas

Não foi feita uma auditoria independente de segurança, varredura atualizada de CVEs dos fornecedores ou validação de serviços externos reais. Os resultados cobrem os cenários e volumes descritos. Uso comercial ainda requer aceite operacional e verificação do ambiente real.

Continuam pendentes os demais itens do roteiro: financeiro completo e medições/Curva S, compras com vários materiais/recebimentos parciais/devoluções, agenda individual por OS, transferências entre almoxarifados, máquinas/manutenção, chat e diário fotográfico, folha trabalhista/eSocial, conversão automática completa de PDF/imagem e ativação/validação dos provedores externos. Esses recursos não foram apresentados como concluídos nesta entrega.
