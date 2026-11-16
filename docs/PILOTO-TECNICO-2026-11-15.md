# Piloto técnico local — 15/11/2026

**Resultado: aprovado nos cenários automatizados descritos abaixo. Dados sintéticos em ambientes isolados; não é aceite comercial de uma empresa real.**

## Execução e correções

A jornada de navegador usa API, banco e arquivos de teste reais, sem simular respostas HTTP. Além do fluxo existente de obra, equipe, OS, estoque, documentos, RH, recuperação de senha, plantas, publicação e atendimento, foi acrescentado o piloto financeiro em `tests/integrated/financial-pilot.ts`.

Essa jornada cria um orçamento de R$ 25.000,00, um pedido de dois materiais de R$ 140,00, aprovação por duas pessoas, entrega parcial e integral, devolução com crédito de R$ 20,00, baixa de R$ 40,00, importação de extrato e conciliação. Conferência final por API: saldo a pagar R$ 100,00; a receber R$ 20,00; compromissos líquidos R$ 120,00; saldo do orçamento R$ 24.880,00. O estoque dos dois materiais é conferido separadamente.

Na primeira execução, o preenchimento do CSV falhou porque o rótulo de uma textarea preenchida não era identificado corretamente. O campo ganhou nome acessível explícito. A jornada inteira foi repetida e passou. Logs: `scratch/piloto-integrado.log` e `scratch/piloto-integrado-retest.log`.

Durante o empacotamento, o Vite monitorou uma pasta de entrega gerada, encontrou arquivo ocupado e encerrou a instância local. A configuração agora ignora entregas, backups, evidências, temporários e backend. Também bloqueia o acesso HTTP direto a arquivos privados. Três rotas de prova retornaram HTTP 403, e a instalação permaneceu saudável durante a geração da entrega final. Nenhum segredo foi incluído nos resultados dessas verificações.

## Resultados desta execução

| Verificação | Resultado |
| --- | --- |
| Jornada completa navegador/API/banco, com financeiro ampliado | Aprovada após correção; 1 jornada, sem mocks HTTP |
| Perfis, restrições, formulários e Colaborador | 17 testes aprovados |
| Modelo de aceite e proteção contra aceite técnico/escopo antigo | 5 testes aprovados |
| Utilitários de operação local | 2 testes aprovados |
| TypeScript e compilação da entrega | Aprovados |
| Integridade de estoque concorrente e idempotência | Conferida no laboratório PostgreSQL |
| Carga de consultas | 900 consultas, concorrências 5/15/30, nenhuma falha |
| Maior p95 de consultas observado | 212,66 ms; máximo observado 327,75 ms |
| Entrega final em HTTPS local/PostgreSQL | 29 migrações aplicadas, provisionamento e persistência conferidos |
| Restauração física da entrega final | 22.045 ms no laboratório; login, SHA-256 dos documentos e referência de planta/escala conferidos |
| Downloads após restauração | 64 concluídos, 8 clientes simultâneos, 4 transferências no servidor; uma retentativa 503 esperada, nenhuma falha final |
| Hashes dos dois pacotes de entrega | Conferidos após geração |
| Diagnóstico da instalação de visualização | API, interface, autenticação, disco e backup saudáveis |

A carga mediu leituras de estoque/resumo operacional com 1.001 materiais, Java com heap máximo de 768 MB e pool de dez conexões. Requisições simultâneas não equivalem a usuários humanos; os números não certificam capacidade em outra infraestrutura nem abrangem todas as combinações de operações. Os cenários não substituem auditoria independente.

## Entrega e evidências

Entrega final: `releases/obra360-2026-11-15T17-07-53-408Z`.

- `manifesto.json`: versão, commit base e hashes dos pacotes.
- `fonte.tar.gz`: fotografia dos fontes, com manifesto de hashes; pode incluir alterações ainda não commitadas, identificadas pela fotografia, não somente pelo commit base.
- `obra360.tar.gz`: aplicação e interface compiladas, com documentação.
- `validacao-tecnica.json`: resumo desta validação, com `aceiteHumano: false` e `aprovacaoComercial: false`.
- `evidencias/financeiro.json`, `capacidade.json` e `restauracao.json`: resultados sintéticos com hashes registrados.

As entregas intermediárias deste piloto foram preservadas e sinalizadas como substituídas. Nenhum banco local, arquivo privado de credenciais, senha ou certificado de laboratório integra os pacotes de entrega. Os relatórios e pacotes em `releases/`, `test-results/` e `scratch/` são ignorados pelo Git.

## Preparação para o piloto real

O modelo de aceite passa a exigir **16 cenários**, incluindo orçamento/financeiro, pedidos múltiplos e conciliação. Todos começam pendentes. Relatórios antigos sem esses cenários e relatórios técnicos sintéticos não aprovam o escopo ampliado. O validador confere estrutura, não autenticidade das declarações.

O roteiro [TREINAMENTO-E-ENTREGA.md](TREINAMENTO-E-ENTREGA.md) e a ficha [modelos/implantacao-cliente.json](modelos/implantacao-cliente.json) estão preparados para responsáveis, infraestrutura, volumes, suporte, treinamento e condições comerciais. Não foram inventados cliente, preço, contrato assinado, participação em treinamento ou aprovação profissional.

**Permanecem pendentes:** usuários e dados autorizados de uma empresa real; revisão independente de segurança; contrato e privacidade revisados pelos responsáveis; validação contábil/trabalhista; provedores próprios configurados e homologados; backup/recuperação e capacidade comprovados no destino definitivo.

A instalação de visualização continua com H2 persistente e integrações externas desativadas, conforme a escolha anterior. Os laboratórios PostgreSQL são separados. `npm run verificar:producao` continua apontando pendências reais da configuração local; nenhuma flag de aprovação foi ativada para contornar essa checagem. O RH permanece administrativo, sem cálculos legais ou transmissão ao eSocial.

## Repetir as verificações

Com Java 21, Maven e dependências instalados, usar `npm run test:integrated`, `npm run test:roles` e `npm run test:system`. Os dois testes de navegador usam a mesma porta de laboratório e devem rodar sequencialmente. Para entrega e restauração, gerar `npm run release:package` e executar `npm run test:preproduction -- <pasta-bundle-gerada>`. Nunca apontar ferramentas de teste para a base do cliente.
