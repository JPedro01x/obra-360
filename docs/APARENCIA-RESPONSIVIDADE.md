# Aparência e responsividade

Na tela de acesso e no cabeçalho, um toque no sol ativa o tema **Claro** e um toque na lua ativa o **Escuro**. O padrão inicial é Escuro. Quem já tinha a preferência Sistema salva continua acompanhando a aparência do dispositivo até tocar no botão.

A escolha fica salva neste navegador na chave `obra360_appearance`, permanece ao recarregar e é sincronizada entre abas. Nenhum dado de autenticação é armazenado nessa preferência. Se o navegador bloquear o armazenamento, a troca continua funcionando durante o uso, mas não pode ser lembrada após fechar a página.

## Cobertura visual

Login e escolha de perfis, configuração inicial, recuperação de senha, aceitação de convite, páginas internas, formulários, diálogos, tabelas, RH, documentos privados, portais, integrações, conta, tela de recuperação de erro e modelador usam a paleta escolhida. O botão oficial Google recebe o tema e a largura disponíveis quando o serviço está configurado; seu contrato de apresentação foi testado com um SDK controlado, sem autenticação real no provedor.

Na troca de tema, o modelador mantém a edição, o canvas e a posição de visualização. A planta e a grade 3D acompanham a paleta. Folhas de impressão e PDFs continuam com fundo claro para impressão e preservam a escala física.

## Layout adaptável

- Cabeçalho e controles reorganizam-se em telas estreitas.
- Os módulos ficam agrupados por área e aparecem conforme o perfil. Em telas de até 900 px, o botão **Menu** abre a navegação e o nome da página atual aparece logo abaixo. O painel fecha ao selecionar um módulo ou pressionar Esc.
- Formulários e painéis passam para uma coluna quando necessário.
- Tabelas largas rolam dentro da própria área e podem receber foco pelo teclado.
- Diálogos respeitam a altura disponível e permitem rolagem interna.
- O modelador adapta barras, inspetor e vistas 2D/3D à largura e à altura disponíveis. A planta oferece botões de zoom e o visualizador permite alternar entre 2D, 3D e vista dividida.
- Dispositivos por toque recebem controles maiores e campos com fonte de 16 px para evitar o zoom automático de foco em navegadores móveis.
- O conteúdo se expande para monitores grandes sem manter largura rígida de celular.

## Validação

Os quinze perfis foram percorridos nos dois temas, verificando suas páginas e seções disponíveis em **320, 390, 768, 1024, 1440 e 1920 px**. A matriz de 315 verificações de métodos e permissões da API também passou.

A suíte de interface em Chromium aprovou **44 testes**, incluindo menu por teclado, troca de tema por toque, visualização das plantas no portal, zoom e formulários em **280×650, 320×740, 360×800, 414×896, 768×1024, 844×390, 667×320, 1024×768, 1440×900 e 2560×1440**. Nesses cenários, a página ficou dentro da largura disponível e as tabelas mantiveram sua rolagem própria.

Firefox e WebKit passaram em **28 cenários adicionais** de login, menu, formulários, portal e planta. O menu em 320 px e o formulário em paisagem também foram conferidos na instalação local com emulação de toque. As dimensões representam classes de aparelhos emuladas.

O fluxo operacional integrado com navegador, API e banco isolado também passou, incluindo RH, documentos e modelador. Os cenários de teste usam datas de calendário locais, evitando registrar ponto no dia UTC seguinte após as 21h no Brasil. O teste específico do botão Google foi repetido após o ajuste final do componente e passou.

Reproduzir: `npm test`, `npm run test:roles`, `npm run test:integrated` e `npm run build`. As capturas e rastros ficam em `test-results`; a validação operacional anterior está em [VALIDACAO-FUNCIONAL.md](VALIDACAO-FUNCIONAL.md).

Para repetir a rodada em Firefox e WebKit, instale os motores com `npx playwright install firefox webkit`, defina `OBRA360_CROSS_BROWSER=true` e execute:

```sh
npm test -- --project=firefox --project=webkit --grep 'compact navigation|themes and project dialog|customer portal|model viewer|real mode requires login'
```
