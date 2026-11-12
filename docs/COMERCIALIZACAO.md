# Preparação para operação comercial

Validação em 06/11/2026: 64 testes do backend sem falhas; 47 cenários adicionais executados em PostgreSQL isolado com V1–V19; 21 testes de interface e uma jornada integrada sem mocks aprovados. Os quatro perfis da instalação local foram conferidos. Backup local atualizado em `backups/2026-11-06T18-43-02.614Z`. Essas evidências são de testes, não de aceite comercial do cliente.

## Escopo desta versão

Gestão de obras, estoque, equipes, documentos, acompanhamento, relacionamento externo, RH administrativo e modelador 2D/3D. O RH registra folha manual; não calcula tributos nem transmite eSocial. O modelador não substitui um sistema completo de autoria BIM nem valida responsabilidade técnica. A integração SEFAZ consulta protocolo; não emite documentos fiscais. As limitações detalhadas continuam em RH.md, MODELADOR.md e INTEGRACOES.md.

Contratação, pagamento e suporte do fornecedor do software são administrados por uma pessoa. Não há checkout, cobrança recorrente, nota fiscal de serviço, conciliação de pagamentos ou suspensão automática por inadimplência. A tela não representa um plano como pago sem evidência externa. Um usuário pertence a uma empresa por conta; não há alternância entre empresas na mesma conta.

## Recursos acrescentados

- **Sessões no banco:** JWT com identificador de sessão, expiração e revogação. Sair invalida o token no servidor; cada usuário pode listar e encerrar suas sessões. Troca de senha/perfil e desativação continuam revogando acessos pela versão de credencial. Tokens emitidos antes desta atualização exigem novo login.
- **Convites:** perfil e empresa definidos no servidor pelo administrador, senha definida pelo convidado, token aleatório de 256 bits, hash no banco, validade de 48 horas, uso único e revogação. O link aparece uma vez e deve ser compartilhado por canal privado. O sistema não envia convites por e-mail nesta versão. Ter o link permite ativar o acesso; confirme o destinatário antes de compartilhar.
- **Limites:** usuários ativos mais convites válidos reservados, obras cadastradas e modelos, incluindo arquivados. As verificações são feitas no backend sob bloqueio da empresa. Fallback PILOTO: 50 usuários, 50 obras, 500 modelos. O operador pode definir limites específicos; o administrador da empresa não pode se promover de plano. Esses limites não representam capacidade de carga certificada. Ainda não há quota comercial de armazenamento ou consumo de IA.
- **Atendimento:** solicitações por usuário e empresa, categorias suporte, privacidade, exportação, exclusão e cancelamento. Administrador da própria empresa acompanha e responde com controle de versão. Não existe encaminhamento automático à equipe do fornecedor, SLA automático ou exclusão/cancelamento automático. Solicitações pendentes são limitadas a 20 por usuário; a tela lista as 200 mais recentes.
- **Exportação:** administrador confirma senha para baixar ZIP com dados operacionais, RH, modelos/revisões e arquivos. Inclui manifesto e verifica SHA-256 dos arquivos. Não inclui hashes de senha, vínculo Google, sessões, tokens. Até 25 MB descompactados e 10 mil registros; acima disso, requer procedimento assistido. É portabilidade de dados, não backup restaurável do servidor. Proteja o ZIP por conter dados pessoais. Mensagens legadas só são incluídas quando ambos os participantes pertencem à empresa.
- **Verificação de configuração:** `npm run verificar:producao` aponta pendências sem mostrar segredos e retorna código diferente de zero se faltar configuração. Não é auditoria nem teste dos provedores.

## Configuração de segurança local

`npm run configurar:seguranca-local` gera JWT_SECRET e HOMOLOGATION_ENCRYPTION_KEY somente quando ausentes, em `obra360-backend/.env`, ignorado pelo Git. Reinicie com `npm run dev`. Não substitui chaves existentes. Preserve uma cópia privada dessas configurações fora do banco; o backup local de dados não inclui o arquivo .env. A chave de homologação protege somente o arquivo privado de credenciais de teste. A chave deve conter exatamente 32 bytes em Base64. Nunca publique esses valores.

Para outra instalação, crie chaves próprias. Não use as chaves dos testes. O banco de homologação permanece marcado como HOMOLOGACAO e não comprova dados de uma operação real.

## Provisionar uma empresa ou ajustar limites

O provisionamento é uma operação do responsável pelo servidor. Não há endpoint HTTP de administração global, nem acesso de uma empresa às demais. Faça backup antes de intervenções e informe dados autorizados pelo cliente; o comando não comprova sua veracidade.

Execute o backend no perfil `operador`, com `spring.main.web-application-type=none`, configurando o PostgreSQL e JWT pelas variáveis normais. O comando encerra o contexto ao terminar e não abre servidor HTTP. Não use `local`/`dev` em produção. Maven direto não carrega arquivos .env automaticamente; injete as variáveis pelo ambiente do processo ou pelo gerenciador de segredos.

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=operador -Dspring-boot.run.arguments=--spring.main.web-application-type=none
```

Variáveis para `OP_ACTION=criar-empresa`:

| Variável                                             | Conteúdo                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| OP_COMPANY_NAME / OP_LEGAL_NAME / OP_CNPJ            | Identificação informada pelo cliente                              |
| OP_ADMIN_NAME / OP_ADMIN_EMAIL / OP_ADMIN_PASSWORD   | Administrador inicial e senha privada de pelo menos 12 caracteres |
| OP_DATA_ENVIRONMENT                                  | OPERACAO ou HOMOLOGACAO explicitamente                            |
| OP_LIMIT_USERS / OP_LIMIT_PROJECTS / OP_LIMIT_MODELS | Inteiros positivos                                                |

Para `OP_ACTION=ajustar-limites`, informe OP_COMPANY_ID, OP_PLAN e os três limites. Reduzir um limite não apaga dados nem encerra acessos existentes: impede novas inclusões acima da quota. Revise contratos antes de alterar limites. Registre a intervenção no controle operacional do fornecedor.

## Aceite com cliente real — pendente

Não há aceite de uma empresa real neste repositório. Preencha um registro por cenário com responsável, empresa, data, evidência, resultado e correção. Não marque como aprovado por passar um teste automatizado.

| Cenário                                | Evidência necessária                                                                            | Situação                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| Cadastros e saldos iniciais            | Conferência pelo responsável contra a fonte da empresa                                          | Pendente                        |
| Convite, perfis, revogação        | Usuários reais confirmam seus acessos e recuperação                                             | Pendente                        |
| Obra, equipe, ordem, consumo e estoque | Responsáveis confrontam entradas/saídas e saldo físico                                          | Pendente                        |
| Contratos, unidades e portais          | Responsáveis validam visibilidade e regras comerciais                                           | Pendente                        |
| RH e documentos privados               | RH confere dados, permissões e lançamentos manuais                                              | Pendente                        |
| Modelo, medidas e impressão            | Profissional confere geometria e escala física                                                  | Pendente                        |
| Exportação, suporte e privacidade      | Responsável confere conteúdo e atendimento dos pedidos                                          | Pendente                        |
| Backup e desastre                      | Restaurar PostgreSQL, arquivos e chaves em ambiente separado e registrar tempo/perda admissível | Pendente em ambiente do cliente |
| Carga e simultaneidade                 | Medir com volume e concorrência contratados, recursos equivalentes à operação                   | Pendente                        |
| Provedores externos                    | Homologar contas próprias, credenciais, indisponibilidade e custos                              | Pendente                        |

## Pendências externas e técnicas antes de afirmar prontidão comercial

Definir cliente-alvo, escopo contratado, preço, suporte e responsabilidades. Submeter contratos, termos de uso, política de privacidade, retenção e procedimento de atendimento ao responsável jurídico. Solicitações no sistema não comprovam conformidade legal. Contratar revisão independente de segurança e corrigir seus achados. Executar o piloto acima, validar capacidade e restaurar backup na infraestrutura de destino. Configurar/homologar provedores necessários.

Para SaaS com contratação automática, implementar o gateway escolhido, assinatura, webhooks autenticados e idempotentes, conciliação, política de inadimplência e emissão fiscal aplicável; ainda não implementado. Para volumes maiores, acrescentar exportações assíncronas, quotas de armazenamento/IA, paginação completa do atendimento e política de retenção/limpeza de sessões e tokens. A exclusão definitiva exige tratamento das relações e das obrigações de retenção antes de qualquer execução destrutiva. O sistema atual registra o pedido e a resposta humana.

O operador só deve definir PRODUCTION_BACKUP_VERIFIED=true após restaurar e conferir a cópia. Para aceite, informe PRODUCTION_PILOT_REPORT com o caminho privado do relatório validado por `npm run validar:piloto`. A antiga flag PRODUCTION_PILOT_ACCEPTED não aprova mais esse requisito. A validação estrutural não comprova a autenticidade das evidências. Consulte [PILOTO-COMERCIAL.md](PILOTO-COMERCIAL.md).
