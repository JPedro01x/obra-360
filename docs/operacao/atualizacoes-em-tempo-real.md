# Atualizações em tempo real

## Como funciona

O navegador autenticado abre `GET /api/v1/workspace/eventos` com o token Bearer no cabeçalho. O backend valida a sessão e usa a empresa do contexto autenticado para inscrever a conexão. Depois de uma gravação `POST`, `PUT`, `PATCH` ou `DELETE` bem-sucedida em uma API autenticada da empresa, o servidor envia um evento SSE pequeno (`workspace-change`) aos navegadores conectados à mesma empresa. O evento contém somente identificador, chave genérica `workspace` e horário. A tela busca os dados atualizados pelos endpoints REST existentes, que continuam aplicando as permissões e o isolamento por empresa.

O cliente tenta reconectar com espera progressiva quando perde a conexão. Ao reconectar, solicita uma atualização das telas abertas. Se a sessão expirar, remove o token local e encerra a conexão. A conexão é encerrada ao sair da sessão ou desmontar a área de trabalho.

## Edições em andamento

Telas com rascunho local não devem descartar o que ainda não foi salvo. O modelador conserva seu controle de revisão e conflito. Medições e rascunhos BIM guardam a atualização pendente e permitem carregá-la depois que a pessoa salvar ou descartar sua edição. Outras telas que não mantêm formulários editáveis recarregam os dados ao receber o sinal.

## Limite de implantação atual

O fan-out é local ao processo Java. Assim, o comportamento está coberto para uma instância de backend e todos os navegadores conectados a ela. Antes de executar múltiplas réplicas atrás de balanceador, implemente e valide um transporte compartilhado de eventos (por exemplo, Kafka) entre as réplicas. Sem isso, uma escrita recebida por uma réplica não avisará os navegadores conectados às outras.

O stream limita conexões a 500 por empresa e 10.000 no processo; novas conexões acima do limite recebem HTTP 503. Ao desconectar, finalizar, expirar ou falhar o envio, a inscrição é removida. Heartbeat SSE é enviado a cada 20 segundos.

## Proxy reverso

Para a rota `/api/v1/workspace/eventos`, permita respostas `text/event-stream`, desative buffering/compressão que retenha os eventos, e configure o timeout de leitura acima de 60 segundos. O backend envia `X-Accel-Buffering: no` e comentários de heartbeat; o proxy ainda precisa encaminhar a resposta em streaming. O balanceador deve manter a conexão aberta e encaminhá-la a uma instância durante sua duração.

Exemplo Nginx para adaptar à configuração real:

```nginx
location = /api/v1/workspace/eventos {
    proxy_pass http://obra360_api;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;
    proxy_cache off;
    gzip off;
    proxy_read_timeout 75s;
}
```

## Diagnóstico

- DevTools → Network deve mostrar a requisição como `text/event-stream` e permanecer aberta.
- HTTP 401 indica sessão expirada ou token ausente; entre novamente.
- HTTP 403 indica que a conta não pode acessar a área autenticada.
- HTTP 503 indica limite de conexões; confira conexões abandonadas, balanceador e contagem por instância.
- Se a conexão permanece aberta mas os dados não mudam, confira a resposta REST da tela, o isolamento de empresa e buffering do proxy.
- Para várias instâncias, confirme o fan-out compartilhado antes de aceitar o piloto.
