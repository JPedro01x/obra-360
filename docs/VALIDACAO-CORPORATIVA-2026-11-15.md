# Atualização técnica para entrega corporativa — 15/11/2026

Esta atualização sucede a auditoria inicial do mesmo dia. Prepara a base técnica e a entrega; não aprova comercialização, aceite de cliente ou conformidade jurídica.

## Mudanças aplicadas

- Spring Boot 4.1.2, Spring Framework 7.0.10, Springdoc 3.2.0 e versões gerenciadas pelo novo BOM. LZ4 1.11.4 e Snappy 1.1.10.9 têm correções explícitas.
- Starters específicos de web, Kafka, Flyway e testes; imports adaptados aos módulos novos.
- Compatibilidade JSON preservada pelo módulo oficial Jackson 2 e pela seleção explícita do conversor. Isso mantém os DTOs/JsonNode atuais. É uma ponte de migração: o suporte Jackson 2 está depreciado e deverá ser removido antes de uma atualização que o retire. Referência: [documentação oficial de JSON](https://docs.spring.io/spring-boot/reference/features/json.html).
- Proxy JPA transacional explícito para os serviços que usam EntityManager diretamente. Uma falha de inicialização no servidor real foi detectada e corrigida; o novo teste HTTP evita depender somente de MockMvc.
- Encerramento local reconhece o classpath longo em arquivo temporário do Spring Boot no Windows, inclusive caminho com acentos em UTF-8 ou Windows-1252. Só aceita arquivo reconhecido, limitado em tamanho e no diretório temporário do usuário, confirma o caminho deste projeto e o processo principal antes de encerrar a árvore do inicializador.

## Segurança e entrega

A auditoria final do JAR principal identificou **121 bibliotecas, sem bibliotecas desconhecidas e sem avisos conhecidos na consulta OSV**. Os dois avisos restantes do Spring MVC da auditoria inicial foram eliminados pela migração. Fonte das versões: [migração oficial do Boot 4](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide) e [compatibilidade Springdoc](https://springdoc.org/).

Evidência da instalação compilada: `test-results/java-dependencies-1794782103825.json`. A consulta avalia coordenadas e versões, não demonstra ausência de falhas no código nem substitui pentest independente.

O CI agora verifica o JAR completo, consulta OSV e guarda o relatório; usa permissões de leitura e a branch main. A geração de pacote executa testes Java e auditorias Java/npm antes de concluir e inclui `dependency-audit.json` com hash no manifesto.

`verificar:producao` exige uma auditoria com até sete dias, sem avisos, inventário completo e hash correspondente ao binário exato. Os testes confirmam rejeição de relatório ausente, antigo, futuro, com avisos ou de outro JAR. Um aceite preenchido não dispensa esse requisito. A verificação estrutural não autentica a autoria de um relatório editado manualmente.

## Resultados

| Verificação | Resultado |
| --- | --- |
| Java/H2 final, incluindo servidor HTTP real | 114 executados, sem falhas; 87 PostgreSQL condicionais executados separadamente |
| PostgreSQL final | 87 executados, sem falhas e sem ignorados |
| Jornada real navegador/API/banco | 1 jornada extensa aprovada |
| Perfis e matriz de permissões | 17 aprovados, incluindo acesso de colaborador |
| Políticas de entrega, aceite e operação local | 10 testes aprovados |
| JAR principal | Compilado e auditado, zero avisos na consulta |
| Pacote reproduzível e restauração | Gerado e validado em HTTPS/PostgreSQL isolado |

Logs: `scratch/corporativo-final-java.log`, `scratch/corporativo-final-postgres.log`, `scratch/corporativo-integrado.log`, `scratch/corporativo-perfis.log`, `scratch/corporativo-politicas-final.log` e `scratch/corporativo-release.log`.

Na carga do pacote corrigido, **3.600 consultas**, até **200 requisições simultâneas**, terminaram sem falhas. No estágio de 200, p95 de **756,03 ms**, aproximadamente 399,21 requisições/s. A recuperação posterior passou em 25 consultas e preservou os saldos. Estoque concorrente, idempotência, baixa financeira e isolamento de empresas também passaram. Evidência: `scratch/corporativo/test-results/system-lab-lZMWyJ/resultado.json`, com hash do JAR ensaiado.

São medições sintéticas em loopback, com PostgreSQL isolado, oito CPUs lógicas, 16 GB de RAM, heap Java de 768 MB e pool de dez conexões. Não equivalem a 200 usuários humanos nem garantem capacidade em outra infraestrutura, volumes muito maiores ou semanas de uso contínuo.

## Preservação e operação local

Backup antes de aplicar a migração: `backups/2026-11-15T22-30-57.451Z`, 18 arquivos com integridade conferida. O H2 2.4.240 leu uma cópia em modo somente leitura: 55 tabelas e 2.816 registros. Evidência: `test-results/h2-upgrade-compatibilidade-boot4.json`.

A instalação local foi reiniciada e seu diagnóstico está saudável (`scratch/corporativo-diagnostico.log`). Continua disponível em `http://127.0.0.1:3000`, com banco H2 persistente de demonstração. Os testes mutáveis ocorreram em bancos isolados.

O binário anterior foi preservado com hash e referência ao backup compatível em `releases/rollback-pre-boot4-2026-11-15`. Ele ainda tem os dois avisos antigos de Spring MVC e serve somente como material de contingência, não como versão comercial aprovada. A reversão da instalação local não foi executada sobre os cadastros; o ensaio de recuperação descrito a seguir usa dados sintéticos separados.

## Pacote e recuperação ensaiada

Entrega técnica: `releases/obra360-2026-11-15T22-32-33-016Z`, com fonte, pacote executável, auditoria de dependências e manifesto de hashes. A evidência da auditoria confere com o SHA-256 do `bundle/app.jar`. A documentação e os relatórios posteriores ao build ficam como evidências adicionais da entrega; o aceite comercial continua falso.

O ensaio `test-results/preprod-ZAPlge/relatorio.json` executou o pacote por HTTPS com certificado confiado, provisionamento offline, rotas privadas, 29 migrações, persistência PostgreSQL e restauração física. Após recuperar, conferiu login, hashes de arquivos e escala da referência de planta. Recuperação medida: **34.848 ms** em laboratório. Foram concluídos **64 downloads**, com duas retentativas após 503 de limitação de transferências e **zero falhas finais**. A duração não é um SLA para o cliente.

A restauração lógica com pg_dump/pg_restore, os volumes do Compose e a recuperação em outra máquina/destino real continuam exigindo validação nesse destino. O workflow do GitHub foi atualizado, mas não foi executado remotamente nesta etapa; não houve commit, push ou publicação.

## O que continua dependendo da implantação

O teste do verificador com a auditoria correta aprovou a evidência de dependências, mas manteve **dez requisitos de configuração/aceite pendentes** para a instalação local (`test-results/corporativo-prontidao-configuracao.json`). Isso impede apresentá-la como produção aprovada apenas por passar nos testes.

Ainda é necessário executar o piloto com uma empresa real, definir infraestrutura e volumes contratados, comprovar a recuperação no destino, nomear responsáveis, revisar contrato/privacidade, realizar treinamento e contratar revisão independente de segurança. Provedores opcionais só podem ser apresentados como operacionais após homologação com contas autorizadas. RH trabalhista oficial e eSocial continuam fora da operação habilitada.

O roteiro concreto para essas etapas está em [ENTREGA-CORPORATIVA.md](ENTREGA-CORPORATIVA.md), com atualização, reversão, backup, suporte, parâmetros de auditoria e aceite. Os modelos de ficha e treinamento continuam sem aprovações humanas inventadas.
