# Primeira versão comercial: gestão de obras

Escopo escolhido pelo responsável: projetos, equipes, ordens de serviço, compras, estoque, documentos, RH administrativo e plantas. A aprovação comercial exige um piloto com dados autorizados e usuários de uma empresa real. Este documento prepara o piloto; não registra um aceite já realizado.

## O que a versão oferece

| Área | Escopo da primeira versão |
| --- | --- |
| Projetos | Cadastro, edição, responsáveis, datas e isolamento por empresa |
| Equipes e OS | Vínculo à obra, contrato, prioridade, prazo, andamento, consumo e encerramento controlado |
| Compras | Um material por requisição, propostas, aprovação, pedido e recebimento integral |
| Estoque | Entradas, saídas, consumo por OS e custo médio de recebimento |
| Documentos | Arquivos privados locais, versões, downloads autorizados e verificação de integridade |
| RH administrativo | Cadastros, acesso de Colaborador, ponto administrativo, ausências, benefícios, treinamentos e lançamentos manuais de folha |
| Plantas | Referência PDF/imagem, calibração e traçado, edição 2D/3D, revisões, publicação por unidade e impressão em escala |
| Administração | Perfis, sessões revogáveis, convites, auditoria, exportação e solicitações internas de atendimento |

Armazenamento exclusivamente local no servidor; login sem autenticação em duas etapas. Google permanece opcional e depende de configuração e vínculo autorizado. IA e SEFAZ só integram a oferta se forem contratadas e homologadas explicitamente. A recuperação por e-mail requer SMTP configurado e entrega real conferida.

Não vender como disponíveis nesta versão: financeiro contábil completo, contas a pagar/receber integradas, vários materiais por pedido, recebimento parcial, devoluções, folha trabalhista automatizada/eSocial ou conversão automática completa de PDF/imagem. O RH não substitui um sistema especializado de folha e o modelador não certifica projetos técnicos. A contratação e a cobrança podem ser administradas manualmente.

## Preparar a empresa piloto

1. Definir a versão entregue, os módulos contratados, os responsáveis, o volume esperado e o período de avaliação.
2. Provisionar uma base separada em PostgreSQL, com documentos locais em volume persistente. Não usar o banco de homologação como cadastro comprovado de cliente.
3. Importar ou cadastrar dados autorizados da empresa. Conferir origem, duplicidades, vínculos e saldos com seus responsáveis; estar no banco não comprova veracidade.
4. Configurar HTTPS, segredos privados, permissões do sistema operacional e SMTP. Desabilitar instalação inicial e modo demonstrativo no ambiente de operação.
5. Treinar pelo menos um responsável de cada processo e preparar o canal de suporte. O atendimento do sistema é acompanhado pelo administrador da própria empresa.

## Roteiro de aceite

Registrar evidência, responsável e resultado por cenário. Uma falha deve conter o problema, sua correção e o novo teste; não substituir o histórico por uma aprovação sem evidência.

| ID | Execução e resultado esperado |
| --- | --- |
| cadastros | Conferir empresa, usuários, fornecedores, materiais e saldos contra as fontes autorizadas |
| perfis | Entrar com cada perfil contratado, conferir suas ações permitidas e negar acesso às áreas restritas; verificar saída e troca de senha |
| projetos | Criar e editar uma obra; rejeitar novos prazos passados e término anterior ao início; preservar datas históricas inalteradas na edição |
| equipes_os | Escolher contrato; listar somente equipes da mesma obra; mudar contrato e limpar equipe; executar e concluir OS conforme prazo, consumo e aprovações |
| compras_estoque | Requisitar, cotar, aprovar com responsáveis distintos, receber e conferir saldo/custo; repetir recebimento sem duplicar entrada; negar saldo insuficiente |
| documentos | Enviar, versionar e baixar documento; conferir integridade e negar download sem permissão |
| rh_administrativo | Cadastrar funcionário e entregar acesso inicial em canal privado; exigir troca de senha; conferir ponto/ausências/lançamentos e desativação da conta no desligamento |
| plantas | Calibrar uma referência, traçar e editar em 2D/3D, salvar, reabrir, consultar revisões e publicar somente para a unidade autorizada; conferir impressão fisicamente |
| isolamento_empresas | Usar duas empresas e tentar acessar registros, seletores e arquivos da outra; não deve haver exposição nem alteração |
| recuperacao_senha | Receber mensagem real, usar token uma vez e rejeitar reutilização/expiração; conferir invalidação das sessões anteriores |
| backup_restauracao | Restaurar banco, documentos e configurações em ambiente separado; conferir registros e arquivos e medir tempo de recuperação e perda admissível |
| capacidade | Executar consultas, cadastros, consumo, uploads e downloads com o volume simultâneo acordado; registrar recursos, falhas e latências e comparar com a meta |
| atendimento | Abrir e responder uma solicitação, conferir visibilidade por empresa e exportação autorizada; confirmar responsáveis e canal de suporte |

## Registrar e conferir o aceite

Copie `docs/modelos/aceite-piloto.json` para um local privado, fora dos arquivos versionados. O modelo começa inteiramente pendente. Preencha empresa, versão e cada cenário com `APROVADO` ou `REPROVADO`, responsável, data ISO com fuso e referência à evidência. Guarde dados pessoais e evidências com acesso restrito.

```powershell
npm run validar:piloto -- "C:/pasta-privada/aceite-piloto.json"
```

Código 0 significa apenas que todas as declarações exigidas estão preenchidas; 1 indica pendências ou reprovações; 2 indica arquivo ausente ou inválido. A ferramenta não verifica autenticidade, assinatura nem conteúdo das evidências. Não cria usuários, não altera o banco e não concede licença comercial.

Para a verificação de produção, configure `PRODUCTION_PILOT_REPORT` com esse caminho privado e execute `npm run verificar:producao`. Uma flag de ambiente isolada não substitui mais o relatório de piloto. Nenhum desses comandos deve ser usado para inventar ou antecipar um aceite.

## Condições de liberação

- Corrigir as falhas encontradas e executar os testes da versão exata que será entregue. A CI existente inclui build, navegador, perfis, jornada integrada, PostgreSQL e ensaio de produção/backup; conferir os resultados da execução, não somente a existência do workflow.
- Obter o aceite operacional registrado pelo cliente e a revisão independente de segurança, tratando seus achados.
- Conferir restauração no ambiente de destino e definir responsáveis por monitoramento, atualizações, capacidade de disco e incidentes. O armazenamento local exige backups em mídia/servidor separado, com proteção e recuperação testada; nuvem não é exigida.
- Definir preço, suporte, implantação, treinamento, limites e responsabilidades. Submeter os documentos comerciais e de privacidade aos profissionais responsáveis antes da contratação.
- Gerar uma versão reproduzível, identificar o pacote entregue e preservar a versão anterior para recuperação. Consulte [OPERACAO-PRODUCAO.md](OPERACAO-PRODUCAO.md) e [COMERCIALIZACAO.md](COMERCIALIZACAO.md).

Piloto real, serviços externos, revisão independente e assinatura de documentos dependem das pessoas responsáveis e do ambiente de destino. Permanecem pendentes até existirem evidências; testes locais não encerram essas etapas.
