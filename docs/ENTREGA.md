# Entrega comercial do Obra360

## Apresentação de 8 minutos

Use a instalação de demonstração com uma base identificada como homologação. Obtenha as credenciais no seu terminal privado com `npm run acessos:homologacao` e consulte apenas a senha da conta que será usada. Ensaie em uma janela separada com o perfil Cliente.

| Tempo | O que mostrar | Como confirmar |
| --- | --- | --- |
| 1 min | Acesso e perfis | Explique o problema da empresa e abra Empreendimentos como administrador. |
| 2 min | Obra, material e ordem | Abra uma movimentação existente e mostre o saldo relacionado. |
| 3 min | Planta e revisão | Abra o modelo 2D/3D, mostre a comparação ou o timelapse e pré-visualize uma revisão. |
| 2 min | Entrega ao cliente | Entre com o perfil Cliente e abra a planta da unidade publicada. Mostre a revisão e a opção de PDF. |

Faça alterações ao vivo em uma obra de demonstração. Para ensaiar com a base local, use **Acessos externos** para conferir o vínculo da conta Cliente com a unidade e **Compartilhar planta com o cliente** para publicar uma revisão naquela unidade.

## Versão reproduzível

Execute `npm run release:package` com Git, Node, Java 21, Maven e tar disponíveis. O comando monta uma cópia do código, inclui arquivos novos da entrega ainda presentes na árvore de trabalho, instala as dependências do arquivo de lock e compila nessa cópia. Cada versão sai em `releases/` com `fonte.tar.gz`, `obra360.tar.gz` e `manifesto.json` com SHA-256 dos dois arquivos. O pacote binário contém `app.jar` e `public/`. A base local, os backups, os arquivos de credenciais e os ambientes privados ficam fora do pacote.

## Instalação para o piloto

Reserve um endereço de pré-produção e uma instalação separada da demonstração. O arquivo `deploy/compose.production.yml` define aplicação, PostgreSQL e proxy HTTPS. O banco e a porta da aplicação ficam na rede interna dos contêineres. O proxy precisa alcançar os serviços de certificado e receber conexões nas portas 80 e 443. Use `deploy/production.example.env` como modelo de um arquivo privado `.env.production` fora do pacote, com segredos próprios. Confirme antes se a rede `172.30.86.0/24` está livre no host. Ao trocar essa rede, ajuste também o IP do proxy e o endereço confiável do Tomcat.

1. Confira a configuração com `docker compose --env-file .env.production -f deploy/compose.production.yml config --quiet`.
2. Crie a imagem com `docker compose --env-file .env.production -f deploy/compose.production.yml build app`. Suba primeiro o banco com `docker compose --env-file .env.production -f deploy/compose.production.yml up -d --wait db`.
3. Provisione a empresa pelo perfil `operador`, com os campos da empresa fornecidos pelo responsável. Passe as variáveis `OP_*` privadas da sessão ao contêiner com `docker compose run -e NOME_DA_VARIAVEL` para cada uma delas e execute `app --spring.profiles.active=prod,operador --spring.main.web-application-type=none`. Use os nomes e limites do [procedimento de provisionamento](COMERCIALIZACAO.md).
4. Suba aplicação e proxy com `docker compose --env-file .env.production -f deploy/compose.production.yml up -d --wait`. Verifique o certificado, o login, o armazenamento, a recuperação real de senha e os conectores incluídos na oferta.
5. Agende a cópia e o teste de restauração descritos em [Operação de produção](OPERACAO-PRODUCAO.md). Configure alertas para indisponibilidade, erros, falhas de cópia e uso de armazenamento.

O pacote Java também pode ser iniciado sem Docker com `java -jar app.jar --spring.profiles.active=prod --spring.web.resources.static-locations=file:./public/`, a partir da pasta extraída e com PostgreSQL e demais variáveis de produção injetadas. Coloque o serviço atrás de HTTPS e restrinja a porta da aplicação ao proxy.

## Aceite e oferta inicial

Comece por uma empresa e uma obra. Preencha esta ficha em um local privado da empresa. Use links com acesso restrito para arquivos operacionais. Guarde credenciais no cofre do operador.

| Entrada | Informação a confirmar com o responsável |
| --- | --- |
| Empresa e obra | Razão social, CNPJ, nome da obra, datas e responsáveis pela obra e pelo aceite. |
| Cadastros e saldos | Fonte e data de corte, total esperado por cadastro e saldo por material e unidade. Cadastre pelos módulos autorizados e confronte os totais com a fonte. Registre divergências antes de seguir. |
| Usuários | E-mails corporativos, perfis e vínculos por obra ou unidade. Use convites e teste acesso permitido e bloqueado. |
| Planta | Um PDF ou imagem autorizada, pavimento e medida conhecida confirmada pelo responsável técnico. Confira a escala, edite o traçado, salve a revisão, publique na unidade e valide o PDF e a vista 3D no portal. |
| Ambiente | Host, responsáveis por suporte e alertas, integrações do piloto, volume simultâneo, janela de manutenção, tempo de recuperação e perda de dados tolerada. |

Execute a matriz de [aceite comercial](COMERCIALIZACAO.md), registrando responsável, data, evidência, resultado e correção por cenário. A avaliação técnica isolada usa dados sintéticos. Registre o aceite depois da conferência pelos usuários da empresa.

### Minuta da oferta piloto

| Item | Proposta para preencher com a empresa |
| --- | --- |
| Escopo | Uma obra. Gestão de equipes, ordens, estoque, documentos e entrega de uma planta ao cliente pelo portal. Registre os módulos adicionais e as integrações ativadas. |
| Implantação | Conferência dos cadastros, configuração dos perfis, treinamento inicial e acompanhamento dos cenários de aceite. Indique quem responde por cada etapa. |
| Prazo e preço | Registre datas de início e fim, valor de implantação, mensalidade, forma de cobrança e condições de renovação. |
| Atendimento | Defina canal, horários, responsáveis, critérios de urgência e prazos que a equipe consegue cumprir. |
| Encerramento | Combine como solicitar a exportação dos dados, quem recebe o arquivo e como serão tratadas retenção e exclusão. |

A contratação, a cobrança e o suporte inicial são conduzidos pelo responsável comercial. Submeta a oferta, os termos e a política de privacidade à revisão jurídica e valide os compromissos de segurança e operação antes de assinar.
