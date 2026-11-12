# Base persistida de homologação

Atualização em 06/11/2026: os quinze perfis foram autenticados pela API antes e depois de reiniciar a aplicação; nenhuma conta foi duplicada. A leitura das credenciais cifradas foi validada também na interface. Backup de dados após a inclusão: `backups/2026-11-06T19-00-50.533Z`. O arquivo de credenciais não faz parte desse backup.

Em 06/11/2026, a instalação local estava sem empresa e sem usuários. Não foram encontrados arquivos de cadastros empresariais (CSV, planilhas ou dumps) na pasta do projeto ou no ZIP acadêmico. Após a solicitação para criar os registros, foi criada uma empresa de **HOMOLOGAÇÃO**, identificada na interface. Esses dados são fictícios, persistidos no banco real da aplicação; não representam uma empresa constituída, pessoas reais ou operações financeiras efetivas.

## Cadastros criados

- Empresa de homologação e quinze contas: administrador, engenheiro, RH, almoxarife, financeiro, auditor, cliente, corretor, fornecedor, investidor, incorporador, gerente de obras, arquiteto, mestre de obras e locador de máquinas.
- Uma obra, fornecedor, contrato, equipe, material, entrada de estoque, consumo por ordem e encerramento da ordem.
- Cronograma com progresso informado, ocorrência de qualidade, duas unidades e quatro vínculos externos.
- Chamado de cliente, reserva de corretor e proposta de fornecedor pelos próprios perfis.
- Departamento, cargo, funcionário fictício vinculado à obra/equipe, ponto aprovado, benefício, treinamento e férias de teste.
- Folha manual de teste com provento de 3.000, desconto de 150 e líquido de 2.850; pagamento registrado apenas para testar o fluxo, sem transferência.
- Modelo de planta de teste com quatro paredes conectadas, nós, cota e identificação de ambiente.

Documentos privados de RH não foram criados nessa base. A validação de upload/download/versionamento foi realizada separadamente na suíte integrada, com arquivos e banco isolados. Não foram importados cadastros de uma fonte empresarial real nem ativados serviços externos.

## Acesso

Abra `http://localhost:3000`. Os e-mails e senhas geradas estão em **ACESSO-HOMOLOGACAO.local**, agora cifrado com AES-256-GCM. A chave é derivada, com contexto próprio, da HOMOLOGATION_ENCRYPTION_KEY em obra360-backend/.env; ela não está dentro do arquivo de credenciais. Ambos são ignorados pelo Git e não devem ser compartilhados ou reutilizados em produção. Não existe senha padrão publicada. Nomes, e-mails e dados gerais do banco H2 não foram criptografados por esta alteração; o arquivo de banco e os backups existentes continuam exigindo proteção de acesso.

Liste os perfis e e-mails com `npm run acessos:homologacao`. Para consultar a senha de uma conta **no seu terminal privado**, use `npm run acessos:homologacao -- --perfil SUPER_ADMIN --mostrar-senhas`, substituindo o perfil quando necessário. Sem a opção explícita, o comando não exibe senhas. Quem possui acesso ao arquivo de credenciais e à chave privada consegue descriptografá-lo; mantenha as permissões do computador restritas.

Antes de criar uma base nova, execute `npm run configurar:seguranca-local`. Guarde credenciais cifradas e chave em cópias privadas separadas: o backup de dados da aplicação não inclui esses arquivos. Não troque a chave após cadastrar autenticadores ou proteger credenciais sem um procedimento de migração.

`node scripts/validar-acessos-homologacao.mjs` confere todas as quinze contas ativas por login real, empresa, perfil e encerramento da sessão, sem exibir senhas. As senhas do banco são hashes BCrypt custo 12; a criptografia reversível descrita acima é apenas para o arquivo auxiliar de acesso aos testes.

A identificação da base de homologação aparece em **Qualidade dos dados**, junto ao diagnóstico cadastral. Os identificadores de empresa, CPF, contratos e valores da base foram criados para teste.

## Evidências de validação

O manifesto privado está em `obra360-backend/data/homologacao-manifest.json`. Contém os identificadores dos cadastros e resultados das verificações, sem senhas. Foram verificados pela API:

1. Saldo 6 após entrada de 10 e consumo de 4.
2. RH autorizado e consulta de RH negada ao engenheiro.
3. Cliente vê somente a unidade vinculada.
4. Demonstrativo manual confere líquido de 2.850.
5. Modelo reabre com nós, cota e ambiente.

O comando `node scripts/validar-homologacao.mjs` acessa a interface com as credenciais locais, sem mocks, e verifica os perfis administrador, engenheiro, RH e cliente. O resultado fica em `obra360-backend/data/validacao-interface-homologacao.json`. Isso comprova comportamento técnico com contas de teste; não constitui aceite por funcionários reais.

`npm run dados:homologacao` reproduz/completa as etapas registradas no manifesto. A rotina acessa somente a API no loopback local, exige suporte explícito à homologação e recusa empresas marcadas como OPERACAO. Não remove dados e não troca o ambiente de uma empresa existente. Se houver falha no meio da execução, os passos já concluídos permanecem registrados; confira o manifesto antes de continuar. A criação não é uma transação única abrangendo todas as chamadas.

## Passagem para dados verdadeiros

Não troque apenas o nome da empresa de homologação para tratá-la como produção. Prepare uma instalação/banco de operação, cadastre a identidade verdadeira e importe cadastros de origem confirmada, revisando duplicidades, vínculos e campos obrigatórios. Preserve o ambiente de teste separadamente. As contas e identificadores gerados não devem ser migrados como se fossem pessoas ou empresas reais.

Para homologação humana, os responsáveis devem conferir seus documentos e executar cadastro, permissões, estoque, ordens, RH, portais e modelos com casos da operação. Esse aceite continua pendente porque não foram fornecidos dados e participantes reais.
