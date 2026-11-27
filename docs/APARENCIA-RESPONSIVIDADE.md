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

## Desempenho em dispositivos modestos

Em 24/11/2026, duas execuções consecutivas do Workspace no Microsoft Edge Chromium 158.0.4370.33, no Windows x64 build 26300, usaram viewport de **360 × 800 px** com toque, desaceleração de CPU de **4×** e rede emulada com **300 ms de latência**, **1,6 Mbps de download** e **750 Kbps de upload**. Cada amostra abriu um contexto sem cache e carregou o bundle de produção com `VITE_USE_MOCK=false`. A amplitude mostra a diferença entre os dois resultados.

| Métrica em ms | Amostra 1 | Amostra 2 | Mediana | Amplitude |
| --- | ---: | ---: | ---: | ---: |
| Navegação até início da resposta HTML | 363,8 | 1.285,8 | 824,80 | 922,0 |
| Navegação até fim do `DOMContentLoaded` | 1.953,5 | 2.799,7 | 2.376,60 | 846,2 |
| Navegação até fim do `load` | 1.954,5 | 2.801,0 | 2.377,75 | 846,5 |
| Navegação até interface autenticada utilizável | 2.114,7 | 3.012,0 | 2.563,35 | 897,3 |
| Navegação até primeiro toque | 2.930,1 | 3.755,3 | 3.342,70 | 825,2 |
| Primeiro toque até abertura do menu | 74,4 | 190,0 | 132,20 | 115,6 |

O teste marca a interface utilizável no primeiro quadro após o título **Empreendimentos** e o botão **Menu** estarem visíveis e o botão estar habilitado. A resposta ao toque vai do `pointerdown` ao primeiro quadro após a abertura do menu. Cada amostra solicitou dois chunks de JavaScript, com 152.748 bytes transferidos no total e zero requisições a chunks do modelador, do IFC ou do Three.js até a confirmação do menu e do empreendimento. As amostras e os arquivos JSON estão referenciados no [relatório local da linha de base](../test-results/low-end-baseline.md).

Em uma execução local adicional de 25/11/2026, Chrome 153 no Windows x64, o shell autenticado ficou utilizável em **4.228 ms**, o primeiro toque ocorreu em **4.883 ms** e o menu abriu **84 ms** depois do toque. Foram transferidos 125.777 bytes nos dois chunks iniciais e nenhum arquivo BIM/IFC/Three foi solicitado. Foi uma única amostra, sem API real e sem aparelho físico; compare como medição pontual, não como mediana da linha de base anterior.

O Playwright simulou configuração de autenticação, sessão e registros de empreendimentos. O cenário exclui login com senha, tempo de uma API real e validação em aparelho físico. O tempo até o primeiro toque inclui o agendamento do Playwright. A variação de 922,0 ms antes do início da resposta HTML e o número de amostras limitam a identificação de gargalos. A confirmação para o piloto requer novas medições com volume representativo de dados e um aparelho da classe usada pelo cliente.

Em dispositivos modestos, comece pela **vista 2D** para consultar ou editar plantas. Abra o modelador e selecione **3D** quando a tarefa exigir inspeção espacial. Abra o **Leitor IFC** quando precisar consultar as propriedades ou os quantitativos declarados em um arquivo IFC.

O bundle local indica o custo quando esses módulos são abertos: worker IFC de aproximadamente **3,49 MB**, WebAssembly do IFC de **1,60 MB** e fornecedor Three.js de **476 KB** sem compressão de transporte. São recursos carregados sob demanda, e seus tamanhos não foram medidos na execução do shell acima. O teste low-end ainda não mede o tempo para abrir o modelador 3D ou interpretar um IFC grande; valide esses fluxos no aparelho e no volume de arquivo do piloto.

No build local de **26/11/2026**, o arquivo inicial `index` ficou em **216,28 KB** sem compressão (**69,63 KB gzip**). O arquivo do worker IFC ficou em **3.491,14 KB**, o WASM em **1.595,27 KB** e o fornecedor Three.js em **476,43 KB**, antes da compressão de transporte. O build confirmou a separação dos recursos; não mediu sua transferência nem execução em dispositivo fraco. A leitura IFC continua limitada a **20 MB** e **10 mil elementos** e é executada em worker para não bloquear a thread da interface.

Para repetir o perfil com Edge instalado no Windows, use o comando abaixo. Com o Chromium do Playwright instalado, a variável de seleção do Edge é opcional.

```powershell
$env:OBRA360_PERFORMANCE_BROWSER_CHANNEL = 'msedge'
npm.cmd run test:performance -- --repeat-each=2
```

As duas amostras passaram no perfil dedicado. O `npm.cmd run build` com `VITE_USE_MOCK=false` concluiu com código 0 e 1.979 módulos transformados.

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
