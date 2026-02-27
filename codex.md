# Contexto da Aplicação

**Visão Geral**
API em Node.js + TypeScript usando Express e Prisma, com Postgres. O escopo atual implementa criação de usuários e integração opcional com o gateway Asaas (sandbox). A arquitetura segue controller -> service -> repository, com acesso ao banco via Prisma.

**Stack e Runtime**
- Node.js (Docker usa `node:24-alpine`).
- Express para HTTP.
- Prisma com adapter `@prisma/adapter-pg` (Postgres).
- Zod para validação de entrada.
- Tsx no desenvolvimento e TsuP para build.

**Entrypoints e Estrutura**
- `src/server.ts`: sobe o servidor HTTP e chama `app`.
- `src/app.ts`: configura Express, JSON parser, rota de status e rotas da aplicação.
- `src/http/routes/user-route.ts`: define `POST /users`.
- `src/http/controllers/user-controller.ts`: valida payload, chama service e responde.
- `src/http/controllers/get-user-by-email-controller.ts`: busca usuário por e-mail.
- `src/services/user-service.ts`: orquestra criação de usuário e integração Asaas.
- `src/services/get-user-by-email-service.ts`: busca usuário por e-mail.
- `src/repositories/prisma/user-prisma-repository.ts`: persistência no banco.
- `src/lib/prisma.ts`: instancia Prisma Client com adapter Postgres.
- `src/lib/asaas-client.ts`: cliente HTTP para a API Asaas.
- `src/generated/prisma/*`: Prisma Client gerado.

**Rotas HTTP**
- `GET /health`: healthcheck simples que retorna `{ status: 'ok' }`.
- `GET /api`: status simples que retorna `{ msg: 'Server is up and running' }`.
- `POST /users`: cria usuário.
- `GET /users/by-email`: busca usuário por e-mail (query `email`).

**Fluxo de Criação de Usuário (`POST /users`)**
- Validação de payload com Zod (`name?`, `email?`, `whatsappId`, `cpfCnpj`, `asaasCustomerId?`, `balance?`).
- Se existir `AsaasClient` e `cpfCnpj` e não houver `asaasCustomerId`, o service busca/cria cliente no Asaas e usa o `id` retornado.
- O usuário é persistido via Prisma (`prisma.user.create`).
- Resposta `201` com o objeto criado; erros viram `500`.

**Banco de Dados (Prisma)**
- `User`: `id`, `email` (único, opcional), `whatsappId` (único), `cpfCnpj` (único, opcional), `asaasCustomerId` (único, opcional), `balance` (Decimal), timestamps.
- `Transaction`: histórico financeiro; enum `TransactionType` (DEPOSIT, CONSUMPTION, REFUND, BONUS).
- `ConsultationLog`: auditoria de chamadas externas (ex.: Neocredi).
- `Payment`: controle de cobranças; enum `PaymentStatus` (PENDING, PAID, FAILED, REFUNDED).
- Migrations em `prisma/migrations/*`.

**Integrações Externas**
- Asaas (sandbox): `https://api-sandbox.asaas.com/v3`.
- Cliente usa `fetch` com header `access_token` e tratamento de erro detalhado.

**Configuração e Variáveis de Ambiente**
- Validado em `src/env/index.ts` com Zod.
- Variáveis esperadas: `NODE_ENV`, `API_PORT`, `ASAAS_API_KEY`.
- Docker Compose usa também: `POSTGRES_*`, `DATABASE_URL`, `PGADMIN_*`, `PRISMA_STUDIO_PORT`, `POSTGRESDB_VOLUME_PATH`.
- Exemplo em `.env.exemple`.

**Scripts**
- `npm run dev`: `tsx watch src/server.ts`.
- `npm run build`: `tsup src --out-dir dist`.
- `npm start`: `node dist/server.js`.

**Docker**
- `dockerfile`: instala deps, gera Prisma Client, sobe `npm run dev`.
- `docker-compose.yml`: serviços `postgresdb`, `postgres-gui (pgadmin)`, `web`.
- Healthcheck do `web` aponta para `/health`.

**Observações Importantes**
- Sem inconsistências conhecidas no momento.
