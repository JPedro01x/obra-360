# Preparação do piloto — entrega técnica

Data: 12/11/2026. Escopo aprovado: gestão de obras, OS, compras, estoque, documentos, RH administrativo e plantas. Alterações executadas na pasta de trabalho; este relatório não constitui aprovação de cliente nem publicação comercial.

## Melhorias entregues

- Contratos, equipes, materiais, unidades e ordens exibem a obra associada nos seletores operacionais.
- Uma OS lista equipes da obra do contrato escolhido. Mudar o contrato limpa a seleção de equipe e cancela a consulta anterior.
- O consumo por OS lista materiais da obra correspondente; acessos externos listam unidades do empreendimento selecionado.
- No RH, cargos são filtrados pelo departamento e equipes pela obra de alocação. Mudar o vínculo principal limpa o dependente.
- Os filtros também são aplicados no backend. Referências de outra empresa são rejeitadas; enviar IDs diretamente não remove as validações dos processos.
- Seletores dependentes orientam a seleção do registro principal e ficam bloqueados enquanto aguardam contexto ou carregamento.
- Documentação de RH e portais alinhada ao comportamento atual, incluindo criação de acesso, senha inicial, troca obrigatória e desativação no desligamento.
- Roteiro da primeira oferta em [PILOTO-COMERCIAL.md](PILOTO-COMERCIAL.md), com escopo, exclusões, preparação e treze cenários de aceite.
- Modelo de aceite inicialmente pendente em [modelos/aceite-piloto.json](modelos/aceite-piloto.json). Não contém cadastros ou aprovações inventados.
- `npm run validar:piloto -- <arquivo>` confere a estrutura das declarações, versão, responsáveis, evidências e datas. Não comprova autenticidade nem substitui o aceite humano.
- O verificador de produção exige `PRODUCTION_PILOT_REPORT`. A antiga flag booleana de aceite não satisfaz mais essa verificação. O teste automatizado cobre essa proteção.
- CI inclui os testes do validador. A suíte de perfis passou a incluir também o cenário do Colaborador.

O armazenamento permanece exclusivamente local e não há autenticação em duas etapas nos fluxos atuais. A senha continua protegida por hash BCrypt, com autorização por perfil, sessões revogáveis e invalidação de acessos após troca de senha.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| Compilação Java 21 | Aprovada |
| TypeScript e compilação Vite de produção | Aprovados |
| Interface em Chromium | 58 testes aprovados |
| PostgreSQL isolado | 72 cenários aprovados; migrações aplicadas e esquema validado |
| Jornada navegador/API/banco, sem mocks HTTP | 1 jornada completa aprovada |
| Perfis existentes e matriz de permissões | 16 testes aprovados, cobrindo 15 perfis |
| Colaborador: primeiro acesso, senha pessoal, portal, restrições e saída | 1 teste aprovado |
| Modelo/validador de aceite, proteção do verificador e credenciais privadas de teste | 5 testes aprovados |
| Backup e restauração local em fixture isolada | 1 teste aprovado |

As escritas dos testes usaram bancos e diretórios isolados. A instalação persistida não foi usada como massa de teste. A referência antiga ao autenticador na jornada integrada e no verificador de homologação foi atualizada para o escopo sem duas etapas.

Os logs locais estão em `test-results/pilot-*.log`, ignorados pelo Git. O laboratório de capacidade descrito em [MELHORIAS-E-VALIDACAO.md](MELHORIAS-E-VALIDACAO.md) pertence à etapa anterior; não foi repetido neste bloco e não certifica o volume de um cliente.

## Situação da liberação

`npm run verificar:producao` foi executado no ambiente local e retornou `configuracaoApta: false`, conforme esperado. A instalação local usa H2 persistente, não a configuração definitiva de produção.

Permanecem pendentes no ambiente de destino: PostgreSQL e perfil de produção explícitos, configuração explícita do modo real e encerramento da instalação inicial, HTTPS/origens permitidas, SMTP, diretório persistente de documentos, comprovação da restauração e relatório de aceite real. A chave JWT foi reconhecida como configurada pelo verificador. Esse comando avalia configuração; não realiza testes dos provedores nem atesta segurança.

Antes de contratar operação regular: executar o piloto com dados autorizados, homologar os serviços contratados, revisar segurança de forma independente, conferir backups/capacidade/alertas no destino e definir contrato, suporte, treinamento e responsabilidades com os profissionais responsáveis. Consultar [COMERCIALIZACAO.md](COMERCIALIZACAO.md) e [OPERACAO-PRODUCAO.md](OPERACAO-PRODUCAO.md).

Uma base preenchida ou uma suíte aprovada não substitui essas evidências. A entrega prepara uma versão para avaliação controlada; não declara funcionamento perfeito ou prontidão comercial integral.
