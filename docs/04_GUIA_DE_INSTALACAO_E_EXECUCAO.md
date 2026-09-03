# 04. GUIA DE INSTALAÇÃO, EXECUÇÃO E DEPLOY

---

## 1. Pré-Requisitos do Ambiente

Antes de iniciar a execução do Obra360, certifique-se de ter instalado em sua máquina:

- **Node.js**: Versão `20.x` ou superior (`node -v`)
- **Java Development Kit (JDK)**: Versão `17` ou `21` (`java -version`)
- **Apache Maven**: Versão `3.8+` (`mvn -v`)
- **Docker & Docker Compose**: Opcional para executar Kafka, RabbitMQ, Postgres e Mongo (`docker -v`)

---

## 2. Como Rodar o Frontend (React 18 / Vite)

1. Navegue até a raiz do repositório:
   ```bash
   cd c:\Users\João Pedro\Downloads\claude
   ```

2. Instale as dependências Node:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
   - O aplicativo estará acessível em: **`http://localhost:3000/`**

---

## 3. Como Rodar o Backend (Java 17 / Spring Boot 3)

1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```

2. Compile e verifique a suíte de testes unitários com Maven:
   ```bash
   mvn clean test
   ```

3. Execute o servidor Spring Boot:
   ```bash
   mvn spring-boot:run
   ```
   - A API REST estará online em: **`http://localhost:8080/api/v1/`**
   - O console visual do banco H2 estará acessível em: **`http://localhost:8080/api/v1/h2-console`**
   - A documentação interativa Swagger UI estará acessível em: **`http://localhost:8080/api/v1/swagger-ui.html`**

---

## 4. Como Rodar a Infraestrutura Completa via Docker Compose

Para subir todo o ecossistema corporativo (PostgreSQL, MongoDB, RabbitMQ, Zookeeper e Apache Kafka):

```bash
docker compose up -d
```

### Portas Mapeadas nos Containers:
- **Frontend App:** `3000`
- **Backend Spring Boot:** `8080`
- **PostgreSQL 16:** `5432`
- **MongoDB 7.0:** `27017`
- **RabbitMQ Management UI:** `15672` (Usuário: `guest` | Senha: `guest`)
- **Apache Kafka:** `9092`

---

## 5. Pipeline de CI/CD (GitHub Actions)

A cada commit enviado para a branch `main` no GitHub, o arquivo `.github/workflows/ci.yml` compila e valida automaticamente tanto o frontend quanto o backend:

- **Etapa 1 (Frontend)**: `npm ci` ➔ `npm run build`
- **Etapa 2 (Backend)**: `mvn clean compile` ➔ `mvn test`
