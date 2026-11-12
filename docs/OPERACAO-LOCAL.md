# Instalação e operação local

Preparação de 12/11/2026 para o computador do responsável. O sistema e a empresa fictícia continuam na pasta do projeto. Esta modalidade usa H2 persistente e arquivos locais; não configura servidor de produção, nuvem ou acesso de outros computadores.

## Iniciar e encerrar

São necessários Node compatível com `package.json`, Maven no PATH e JDK 21. Em uma instalação nova, execute `npm ci` na raiz do projeto. `npm run dev` procura o Java 21 configurado ou instalado nos diretórios usuais do Windows; não instala programas nem altera as variáveis permanentes do computador.

```powershell
cd "C:/Users/João Pedro/Downloads/claude"
npm run dev
```

Acesse `http://127.0.0.1:3000`. A API fica em `127.0.0.1:8080`. Mantenha o terminal aberto. Se já houver uma execução, não abra outra sobre as mesmas portas.

Para encerrar, finalize as operações e use Ctrl+C no terminal que iniciou o projeto. No Windows, quando o inicializador estiver em segundo plano:

```powershell
npm run parar:local
npm run parar:local -- --confirmar
```

Sem `--confirmar`, a rotina apenas identifica a execução. Para encerrar, ela exige que a API pertença à pasta atual e identifica seu inicializador antes de finalizar a árvore de processos. Um serviço desconhecido na porta 8080 é recusado. O encerramento interrompe as requisições em andamento; use-o quando as operações estiverem concluídas. Se a execução não for identificada, use seu terminal original; não encerre processos Java de outros programas.

## Diagnóstico e observação

```powershell
npm run diagnostico:local
npm run monitorar:local
```

O diagnóstico executa uma rodada e retorna código 0 quando saudável ou 1 quando requer atenção. O monitor repete a rodada a cada 60 segundos, no terminal, até Ctrl+C. Não instala tarefa automática nem envia mensagens a terceiros.

São conferidos:

- API pronta e interface respondendo;
- instalação inicial concluída;
- consulta administrativa sem autenticação retornando HTTP 401;
- pelo menos 2 GB disponíveis no volume dos dados;
- última cópia completa com manifesto, até 48 horas, com lista de arquivos e SHA-256 conferidos.

Backups feitos apenas copiando o arquivo do banco, sem manifesto, não satisfazem esse diagnóstico. O comando não apaga cópias antigas, não repara dados automaticamente e não equivale a auditoria independente. O espaço e a idade da cópia são limites operacionais iniciais; o tamanho e a política de retenção devem acompanhar o uso. Cada rodada lê os arquivos da última cópia para conferir os hashes.

Para conferir a tela de login e sua largura móvel:

```powershell
npm run validar:local
```

## Cópia completa e conferência

O banco fica em `obra360-backend/data/obra360.mv.db`; documentos, arquivos de RH e manifestos locais ficam no mesmo diretório de dados. Não apague essa pasta para reiniciar o programa.

Com a aplicação encerrada e sem outras ferramentas usando esse banco:

```powershell
npm run backup
```

A cópia recebe um identificador em `backups/`, com banco, documentos e manifesto de hashes. O comando recusa execução enquanto a API local estiver ativa. Anote o identificador exibido e reinicie com `npm run dev`.

É possível conferir uma cópia sem parar a aplicação:

```powershell
npm run backup:verificar -- IDENTIFICADOR_DA_COPIA
```

Mantenha uma cópia protegida em mídia separada: uma cópia somente no mesmo disco não cobre a perda do computador. O backup de dados não inclui `.env` nem os arquivos `ACESSO-*.local`; preserve as configurações e credenciais cifradas em uma cópia privada separada. Não publique esses arquivos no Git ou nos pacotes de entrega.

## Recuperar a instalação

Antes de recuperar, encerre a aplicação, confira a cópia e preserve uma cópia do estado atual. Para restaurar uma cópia local conhecida:

```powershell
npm run backup:verificar -- IDENTIFICADOR_DA_COPIA
npm run backup:restore -- IDENTIFICADOR_DA_COPIA --confirm
npm run dev
npm run diagnostico:local
```

Execute diagnóstico em outro terminal depois de a API e a interface estarem prontas. A restauração confere os arquivos antes de trocar o diretório e preserva a instalação anterior em `data-before-restore-*`. Depois, entre e confira obras, funcionários, plantas e o download de um documento. Não restaure automaticamente por causa de um alerta: primeiro identifique o problema e a cópia correta.

## Treinamento com a demonstração

1. Consulte o acesso do administrador com `npm run acessos:demonstracao -- --perfil SUPER_ADMIN --mostrar-senhas`, em terminal privado, e entre na Construtora Horizonte.
2. Percorra uma obra, seus contratos e equipes. Na OS, confirme que a equipe é filtrada pelo contrato.
3. Abra compras e confira exemplos em aprovação, com pedido emitido e recebidos. Confronte as entradas com o estoque.
4. Consulte os funcionários e seus vínculos; use uma conta de Colaborador para experimentar o primeiro acesso e a consulta pessoal.
5. Abra uma planta, alterne 2D/3D e consulte as revisões. Para experimentar edição sem alterar o exemplo publicado, duplique o modelo salvo.
6. Consulte documentos, unidades e os portais com os usuários correspondentes. Confira os limites de cada perfil.

Os dados continuam fictícios. O roteiro detalhado e os acessos estão em [DEMONSTRACAO-EMPRESARIAL.md](DEMONSTRACAO-EMPRESARIAL.md). Aceite de empresa real, instalação definitiva, revisão independente e preparação contratual seguem etapas próprias em [PILOTO-COMERCIAL.md](PILOTO-COMERCIAL.md).

## Verificação desta preparação

- Oito testes de scripts passaram, incluindo diagnóstico, hashes de backup, aceite e seleção da versão Java.
- A aplicação foi encerrada e reaberta pelo fluxo local; a seleção automática do Java 21 foi observada.
- A rotina de encerramento recusou um processo desconhecido criado para esse teste, sem finalizá-lo.
- Foi criada uma cópia completa de 18 arquivos e restaurada em pasta isolada, sem substituir o banco ativo.
- A cópia restaurada foi aberta por outra API em porta própria: login, seis obras, 48 funcionários, planta com portas e download de PDF passaram.
- A interface desktop/móvel foi verificada após a inicialização, e o diagnóstico local retornou saudável.

Os registros locais estão em `test-results/local-operations-*.log` e `test-results/local-operations-recovery.json`, ignorados pelo Git. Essas verificações cobrem a instalação local e não certificam uma implantação futura em outro ambiente.
