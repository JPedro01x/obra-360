# Rodar a demonstração Obra360 pelo VS Code

Este roteiro inicia a demonstração com dados fictícios persistidos. Ela usa a API na porta `8081`, a interface na `3001` e um banco H2 separado. A empresa operacional da porta `3000` não é usada.

Neste roteiro, `start:demo` usa a interface operacional `Workspace` (`VITE_USE_MOCK=false`) e grava no H2 isolado. O comando diferente `npm run dev:demo` carrega `.env.demo` com `VITE_USE_MOCK=true`: abre o `App.tsx` histórico com estado simulado e faixa avisando que as operações são fictícias. Não use `dev:demo` para conferir persistência no banco.

## Requisitos

- VS Code e a pasta raiz `obra-360-main` aberta nele.
- Node.js `20.19+` na linha 20 ou `22.12+` (Node 21 e Node 22.0–22.11 não são compatíveis).
- JDK 21.
- Maven 3.9 ou superior.

O inicializador local procura o JDK em `JAVA_HOME`, no `PATH` e, no Windows, em `%LOCALAPPDATA%\Programs\Obra360Tools\jdk-21` e nas pastas comuns do sistema.

## Primeira execução

1. No VS Code, abra **Terminal → Novo Terminal**. Confira que o terminal está na raiz do projeto.
2. Instale as dependências do frontend:

   ```powershell
   npm ci
   ```

3. Gere o pacote da API (não executa a suíte de testes):

   ```powershell
   mvn -f obra360-backend/pom.xml -DskipTests package
   ```

4. Inicie a demonstração:

   ```powershell
   npm run start:demo
   ```

5. Aguarde a mensagem `Demonstração isolada pronta` e abra [http://127.0.0.1:3001](http://127.0.0.1:3001).

## Execuções seguintes

Com dependências e pacote já instalados, basta abrir um terminal do VS Code na raiz e executar:

```powershell
npm run start:demo
```

Para consultar as credenciais fictícias desta máquina, abra outro terminal e execute `node scripts/acessos-demonstracao.mjs`. Mantenha a saída privada. Use a conta administrativa da demonstração, não a conta da empresa operacional.

## Encerrar e resolver portas ocupadas

- Para encerrar a demonstração, volte ao terminal que está rodando `start:demo` e pressione `Ctrl+C`. O processo encerra a API e a interface iniciadas por ele.
- Se as portas `3001` ou `8081` já estiverem ocupadas, feche a demonstração anterior antes de iniciar outra. Não encerre processos desconhecidos nem altere a instância operacional em `3000`/`8080`.
- Os dados ficam em `obra360-backend/data/demonstracao/`; não apague essa pasta se quiser manter a demonstração.

## O que está incluído

O perfil local usa H2 persistido em arquivo. Kafka e serviços externos (Google, e-mail, IA e SEFAZ) só funcionam quando configurados; indicadores de configuração não comprovam conectividade. Os dados de demonstração são fictícios e não têm validade empresarial, fiscal, trabalhista ou executiva.
