# Preparação e liberação de uma entrega corporativa

Este procedimento prepara uma instalação e registra pendências. Não representa aceite de cliente, contrato, certificação de segurança ou aprovação jurídica.

## Escopo a combinar antes da entrega

Preencher uma ficha privada a partir de `docs/modelos/implantacao-cliente.json`: empresa, módulos contratados, equipamento, usuários, simultaneidade, armazenamento, responsáveis e suporte. Não versionar a ficha preenchida com dados pessoais ou segredos.

A versão cobre gestão de obras, equipes, OS, compras, estoque, documentos, RH administrativo, orçamento/financeiro e plantas. RH usa lançamentos manuais; obrigações trabalhistas e integrações opcionais sem homologação permanecem desativadas. Conversão de planta exige revisão e calibração; não é garantia de conversão automática de qualquer arquivo nem substitui validação profissional.

Preço, pagamento, limites de uso, manutenção, suporte, cancelamento e destino dos dados precisam constar no acordo com o cliente. Encaminhar contrato e política de privacidade para revisão dos responsáveis. Não prometer número de usuários ou prazo de recuperação usando somente os ensaios locais.

## Preparar o pacote

1. Executar a regressão Java/H2, PostgreSQL, interface e jornadas integradas. As suítes `test:integrated` e `test:roles` usam as mesmas portas: executar sequencialmente.
2. Executar `npm run release:package`. O comando agora compila e testa o snapshot Java, audita dependências Java e npm, inclui `dependency-audit.json` e gera o manifesto com hashes. Falha de consulta de dependências impede concluir a entrega. A suíte PostgreSQL é uma etapa separada obrigatória; não é considerada aprovada quando seus testes condicionais são ignorados no Maven.
3. Executar `npm run test:preproduction -- "releases/<id>/bundle"` e guardar a evidência. O laboratório usa PostgreSQL/TLS descartáveis e testa restauração física. A restauração lógica com `pg_dump`/`pg_restore` e os volumes reais ainda deve ser comprovada no ambiente de destino, conforme `OPERACAO-PRODUCAO.md`.
4. Conferir o hash do JAR e dos arquivos a instalar. Arquivos de configuração, banco, credenciais e backups não devem integrar a distribuição pública.

## Validar a configuração da instalação

`npm run verificar:producao` exige configuração de produção, PostgreSQL, segredos persistentes, origem HTTPS explícita, armazenamento, recuperação por e-mail, restauração declarada pelo operador e aceite humano completo. É verificação local de configuração e evidências, não teste de conexão com todos os serviços.

Também informar:

```text
PRODUCTION_RELEASE_JAR=releases/<id>/bundle/app.jar
PRODUCTION_DEPENDENCY_REPORT=releases/<id>/dependency-audit.json
PRODUCTION_PILOT_REPORT=<caminho privado do aceite preenchido>
```

A auditoria deve corresponder ao SHA-256 do JAR, ter até sete dias, não conter avisos conhecidos e identificar as bibliotecas da aplicação. Ausência de relatório, data futura/antiga, JAR diferente e inventário incompleto não aprovam a entrega. O relatório é evidência local; este mecanismo não autentica declarações humanas nem substitui uma auditoria independente. Refazer a consulta se a entrega ficar aguardando instalação por mais de sete dias.

## Atualização e reversão

Agendar a manutenção, terminar operações em andamento e preservar o pacote anterior, banco e arquivos. Parar a instância identificada, criar e verificar o backup, ensaiar a nova versão em cópia isolada e só então atualizar a instalação. Nunca testar migrações destrutivas no banco do cliente.

Se houver falha, manter a instalação indisponível e recuperar a versão anterior com o backup compatível em ambiente separado. Não executar uma versão antiga contra um esquema que ela não suporta. Registrar versão, motivo, hashes, duração e conferências antes de restabelecer os acessos.

## Rotina e responsabilidades

| Responsável a nomear | Rotina a executar e registrar |
| --- | --- |
| Operador e substituto | Conferir saúde, espaço livre e cópia verificada; acompanhar falhas e atualizações |
| Responsável pelo backup | Guardar cópia em local privado separado do equipamento e ensaiar a recuperação |
| Gestor da empresa | Conferir cadastros, saldos, vínculos, acessos e desligamentos |
| Atendimento | Monitorar solicitações internas e manter canal externo para indisponibilidade |
| Responsáveis de cada área | Executar os 16 cenários de `PILOTO-COMERCIAL.md`, registrar evidências e repetir cenários corrigidos |

Metas de recuperação, frequência/retenção de backup e horários/prazos de atendimento são definidos com o cliente. Use `TREINAMENTO-E-ENTREGA.md` para a sessão prática. Um resultado técnico aprovado não autoriza preencher o aceite humano automaticamente.
