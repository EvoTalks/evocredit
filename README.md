# EvoCredit API

API de gerenciamento de créditos financeiros integrada com gateway de pagamento Asaas (PIX) e consultas CPF/CNPJ via Neocredi. Projetada para interações via WhatsApp.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Modelos de Dados](#modelos-de-dados)
- [Regras de Negócio](#regras-de-negócio)
- [Endpoints da API](#endpoints-da-api)
- [Integrações Externas](#integrações-externas)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Como Rodar o Sistema](#como-rodar-o-sistema)
- [Testes](#testes)

---

## Visão Geral

O EvoCredit é uma API RESTful que permite:

- Criação e gerenciamento de usuários identificados por WhatsApp ID
- Recarga de saldo via PIX (integração Asaas)
- Consultas de CPF/CNPJ (integração Neocredi), com débito automático de créditos
- Notificações de pagamento via sistema de webhooks configurável

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 24 |
| Linguagem | TypeScript |
| Framework HTTP | Express 4 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Banco de Dados | PostgreSQL 16 |
| Validação | Zod |
| Dev server | tsx (watch mode) |
| Build | tsup |
| Testes | Vitest |
| Container | Docker + Docker Compose |

---

## Arquitetura

### Estrutura de Camadas

```
HTTP Layer      src/http/routes/          → Definição de rotas Express
                src/http/controllers/     → Validação Zod + envio de resposta HTTP
Service Layer   src/services/             → Orquestração de regras de negócio
Repository      src/repositories/         → Interfaces dos repositórios
                src/repositories/prisma/  → Implementações Prisma
Lib             src/lib/                  → Clientes externos (Asaas, Neocredi) e Prisma client
Env             src/env/index.ts          → Variáveis de ambiente validadas com Zod
```

### Fluxo de uma requisição

```
Request
  └─► Router
        └─► Controller (Zod validation)
              └─► Service (business logic)
                    ├─► Repository (database)
                    └─► External Client (Asaas / Neocredi)
```

### Estrutura de Arquivos

```
evocredit/
├── src/
│   ├── app.ts                                # Configuração do Express
│   ├── server.ts                             # Entry point HTTP
│   ├── env/
│   │   └── index.ts                          # Variáveis de ambiente (Zod)
│   ├── http/
│   │   ├── routes/
│   │   │   ├── user-route.ts
│   │   │   ├── consultation-route.ts
│   │   │   └── webhook-route.ts
│   │   └── controllers/
│   │       ├── user-controller.ts
│   │       ├── get-user-by-email-controller.ts
│   │       ├── get-users-controller.ts
│   │       ├── add-credits-controller.ts
│   │       ├── create-consultation-controller.ts
│   │       ├── list-consultations-controller.ts
│   │       ├── get-consultation-result-controller.ts
│   │       ├── webhook-controller.ts
│   │       └── webhook-config-controller.ts
│   ├── services/
│   │   ├── user-service.ts
│   │   ├── get-user-by-email-service.ts
│   │   ├── get-users-service.ts
│   │   ├── add-credits-service.ts
│   │   ├── create-consultation-service.ts
│   │   ├── list-consultations-service.ts
│   │   ├── get-consultation-result-service.ts
│   │   └── confirm-payment-service.ts
│   ├── repositories/
│   │   ├── user-repository.ts
│   │   ├── transaction-repository.ts
│   │   ├── consultation-log-repository.ts
│   │   ├── payment-repository.ts
│   │   ├── webhook-config-repository.ts
│   │   └── prisma/
│   │       ├── user-prisma-repository.ts
│   │       ├── transaction-prisma-repository.ts
│   │       ├── consultation-log-prisma-repository.ts
│   │       ├── payment-prisma-repository.ts
│   │       └── webhook-config-prisma-repository.ts
│   └── lib/
│       ├── prisma.ts
│       ├── asaas-client.ts
│       └── neocredi-client.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.exemple
├── docker-compose.yml
├── dockerfile
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Padrões de Projeto

**Repository Pattern**: Serviços dependem de interfaces (`UserRepository`, `PaymentRepository`, etc.), não de implementações concretas. Isso permite trocar a camada de persistência sem alterar a lógica de negócio.

**Constructor Injection**: Dependências (repositórios e clientes externos) são injetadas via construtor. Sem container de DI — simples, explícito e fácil de testar.

**Operações atômicas de saldo**: Atualização de saldo usa `increment()` e `decrement()` do Prisma diretamente no banco, evitando condições de corrida.

**Ledger imutável**: Toda movimentação financeira gera um registro de `Transaction`. Transactions nunca são deletadas — servem como trilha de auditoria completa.

---

## Modelos de Dados

### User

Representa um usuário do sistema, identificado pelo WhatsApp ID.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `name` | String? | Nome do usuário |
| `email` | String? (único) | E-mail (opcional, único) |
| `whatsappId` | String (único) | ID no formato `554799999999@s.whatsapp.net` |
| `cpfCnpj` | String? (único) | CPF ou CNPJ (opcional) |
| `asaasCustomerId` | String? (único) | ID do cliente no Asaas |
| `balance` | Decimal(10,2) | Saldo em créditos |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

### Transaction

Ledger imutável de todas as movimentações financeiras.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `userId` | UUID (FK) | Usuário associado |
| `amount` | Decimal(10,2) | Valor (positivo = entrada, negativo = saída) |
| `type` | Enum | `DEPOSIT`, `CONSUMPTION`, `REFUND`, `BONUS` |
| `description` | String? | Descrição livre |
| `paymentId` | UUID? (FK) | Payment vinculado (se originado de pagamento) |
| `consultationId` | UUID? (FK) | ConsultationLog vinculado (se originado de consulta) |
| `createdAt` | DateTime | Data de criação (imutável) |

### ConsultationLog

Auditoria de chamadas à API Neocredi para consultas de CPF/CNPJ.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `userId` | UUID (FK) | Usuário que solicitou |
| `provider` | String | Provedor da consulta (padrão: `"NEOCREDI"`) |
| `endpoint` | String | Endpoint chamado (ex: `/cpf`, `/cnpj`) |
| `inputData` | JSON | Payload enviado à API |
| `outputData` | JSON | Resposta completa da API |
| `cost` | Decimal(10,2) | Custo debitado do saldo |
| `status` | String | `PENDING`, `SUCCESS`, `ERROR` |
| `errorMessage` | String? | Mensagem de erro, se houver |
| `createdAt` | DateTime | Data de criação |

### Payment

Registros de cobranças PIX via Asaas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `userId` | UUID (FK) | Usuário associado |
| `externalId` | String (único) | ID do pagamento no Asaas (ex: `pay_abc123`) |
| `amount` | Decimal(10,2) | Valor em reais |
| `status` | Enum | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `pixCode` | String? | Código PIX "Copia e Cola" |
| `qrCodeImage` | String? | Imagem do QR Code (base64 ou URL) |
| `paidAt` | DateTime? | Data/hora do pagamento |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

### WebhookConfig

Configuração de destinos para webhooks de saída.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Chave primária |
| `url` | String | URL de destino |
| `isActive` | Boolean | Se está ativo (padrão: `true`) |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

---

## Regras de Negócio

### Usuários

- O identificador principal de um usuário é o `whatsappId` (formato: `554799999999@s.whatsapp.net`).
- `email` e `cpfCnpj` são únicos no sistema, mas opcionais.
- Se `cpfCnpj` for fornecido na criação e não houver `asaasCustomerId`, o sistema busca ou cria automaticamente um cliente no Asaas.
- Para criar um cliente no Asaas, o campo `name` é obrigatório.
- O saldo (`balance`) nunca deve ser representado como `Float` — sempre `Decimal(10,2)` para evitar erros de arredondamento.

### Saldo e Créditos

- Toda movimentação de saldo gera um registro imutável de `Transaction`.
- Entradas têm `amount` positivo (tipos: `DEPOSIT`, `BONUS`).
- Saídas têm `amount` negativo (tipos: `CONSUMPTION`, `REFUND`).
- Atualizações de saldo são feitas atomicamente via `increment`/`decrement` do Prisma.

### Recarga via PIX

1. O usuário precisa ter um `asaasCustomerId` cadastrado.
2. A API cria uma cobrança PIX no Asaas com `billingType=PIX` e vencimento no dia atual.
3. O QR Code e o código "Copia e Cola" são retornados imediatamente.
4. O pagamento inicia com status `PENDING`.
5. Após confirmação do Asaas via webhook:
   - Os webhooks de saída configurados são disparados **antes** de qualquer persistência (tudo ou nada).
   - Se todos os webhooks tiverem sucesso: o status muda para `PAID`, o saldo do usuário é incrementado e uma `Transaction` do tipo `DEPOSIT` é criada.
   - Se qualquer webhook falhar: a operação inteira é abortada com erro `502`.
6. O processamento do webhook é **idempotente**: se o pagamento já estiver `PAID`, retorna sem reprocessar.

### Consultas CPF/CNPJ (Neocredi)

1. O usuário deve ter saldo suficiente (>= `CONSULTATION_COST`).
   - Se insuficiente: retorna `422 Unprocessable Entity`.
2. O custo é debitado **no momento da solicitação** (mesmo que a consulta falhe).
3. Um `ConsultationLog` com `status=PENDING` e uma `Transaction` do tipo `CONSUMPTION` são criados.
4. A Neocredi trabalha de forma **assíncrona**: a resposta inicial retorna um `solicitacaoId`.
5. Para obter o resultado, é necessário fazer polling via `GET /consultations/:id/result`:
   - Se já resolvida (`SUCCESS` ou `ERROR`): retorna o log sem nova chamada.
   - Se `PENDING`: consulta a Neocredi e atualiza o status:
     - `status` contém `CONCLUI` → `SUCCESS`
     - `status` contém `ERR` → `ERROR`
     - Caso contrário → permanece `PENDING`

### Webhooks de Saída

- Qualquer URL pode ser registrada como destino de webhook.
- Ao confirmar um pagamento, **todas** as URLs ativas recebem um `POST` com o payload do evento.
- Se uma URL falhar, toda a confirmação de pagamento é abortada (proteção contra estados inconsistentes).

---

## Endpoints da API

### Health

| Método | Rota | Descrição | Resposta |
|--------|------|-----------|----------|
| `GET` | `/health` | Health check | `200 { status: 'ok' }` |
| `GET` | `/api` | Status do servidor | `200 { msg: 'Server is up and running' }` |

### Usuários

#### `POST /users` — Criar usuário

**Body:**
```json
{
  "whatsappId": "554799999999@s.whatsapp.net",
  "cpfCnpj": "12345678900",
  "name": "João Silva",
  "email": "joao@example.com",
  "asaasCustomerId": "cus_abc123",
  "balance": 0
}
```

> `whatsappId` e `cpfCnpj` são obrigatórios. `name` é obrigatório se houver integração com Asaas e `cpfCnpj` for fornecido sem `asaasCustomerId`.

**Respostas:** `201` (usuário criado) | `500` (erro interno)

---

#### `GET /users` — Listar usuários

**Respostas:** `200` (array de usuários) | `500`

---

#### `GET /users/by-email?email=` — Buscar por e-mail

**Query params:** `email` (obrigatório, formato e-mail válido)

**Respostas:** `200` (usuário) | `404` (não encontrado) | `500`

---

#### `POST /users/credits` — Gerar cobrança PIX

**Body:**
```json
{
  "asaasCustomerId": "cus_abc123",
  "value": 50.00
}
```

**Resposta `201`:**
```json
{
  "payment": {
    "id": "...",
    "externalId": "pay_abc123",
    "amount": 50.00,
    "status": "PENDING",
    "pixCode": "00020101...",
    "qrCodeImage": "data:image/png;base64,..."
  }
}
```

**Respostas:** `201` | `404` (usuário não encontrado) | `500`

---

### Consultas

#### `POST /consultations` — Iniciar consulta CPF/CNPJ

**Body:**
```json
{
  "whatsappId": "554799999999@s.whatsapp.net",
  "type": "cpf",
  "document": "12345678900",
  "emailSolicitante": "solicitante@example.com"
}
```

**Respostas:** `201` (consultationLog) | `404` (usuário não encontrado) | `422` (saldo insuficiente) | `500`

---

#### `GET /consultations?userId=` — Listar consultas

**Query params:** `userId` (obrigatório)

**Respostas:** `200` (`{ consultationLogs: [...] }`) | `500`

---

#### `GET /consultations/:id/result` — Obter resultado

Consulta o status na Neocredi se ainda não resolvida.

**Respostas:** `200` (`{ consultationLog }`) | `404` | `500`

---

### Webhooks

#### `POST /webhooks/asaas` — Receber confirmação de pagamento (Asaas)

**Headers:** `asaas-access-token: <ASAAS_WEBHOOK_TOKEN>`

**Body (exemplo Asaas):**
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_abc123",
    "paymentDate": "2026-03-02"
  }
}
```

> Eventos processados: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`. Demais eventos retornam `{ ignored: true }`.

**Respostas:** `200` | `401` (token inválido) | `404` (pagamento não encontrado) | `502` (falha no webhook de saída) | `500`

---

#### `POST /webhooks/configs` — Registrar webhook de saída

**Body:**
```json
{
  "url": "https://minha-api.com/webhook"
}
```

**Respostas:** `201` (`{ webhookConfig }`) | `500`

---

#### `GET /webhooks/configs` — Listar webhooks configurados

**Respostas:** `200` (`{ webhookConfigs: [...] }`) | `500`

---

## Integrações Externas

### Asaas (Gateway de Pagamento)

- **Base URL (sandbox):** `https://api-sandbox.asaas.com/v3`
- **Autenticação:** header `access_token: <ASAAS_API_KEY>` (chaves sandbox iniciam com `$aact_`)
- **Endpoints utilizados:**
  - `GET /customers?cpfCnpj={cpfCnpj}` — buscar cliente
  - `POST /customers` — criar cliente
  - `POST /payments` — criar cobrança PIX
  - `GET /payments/{id}/pixQrCode` — obter QR Code

> Para usar em produção, basta alterar a `ASAAS_API_KEY` para uma chave de produção.

### Neocredi (Consultas CPF/CNPJ)

- **Base URL:** `https://app-api.neocredit.com.br`
- **Autenticação:** header `Authorization: Bearer <NEOCREDI_TOKEN>`
- **Endpoints utilizados:**
  - `POST /empresa-esteira-solicitacao/{analiseMotorId}/integracao` — iniciar consulta
  - `GET /empresa-esteira-solicitacao/{solicitacaoId}/simplificada` — buscar resultado

---

## Variáveis de Ambiente

Copie `.env.exemple` para `.env` e preencha os valores:

```bash
cp .env.exemple .env
```

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `NODE_ENV` | Sim | `development` ou `production` |
| `API_PORT` | Sim | Porta HTTP (padrão: `3333`) |
| `DATABASE_URL` | Sim | String de conexão PostgreSQL |
| `ASAAS_API_KEY` | Sim | Chave da API Asaas (sandbox: `$aact_...`) |
| `ASAAS_WEBHOOK_TOKEN` | Sim | Token para validar webhooks recebidos do Asaas |
| `NEOCREDI_TOKEN` | Sim | Bearer token da API Neocredi |
| `NEOCREDI_ANALISE_MOTOR_ID` | Sim | ID do motor de análise no Neocredi (ex: `2851`) |
| `CONSULTATION_COST` | Sim | Custo em créditos por consulta |

---

## Como Rodar o Sistema

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/)
- Node.js 20+ e npm (para desenvolvimento local sem Docker)

---

### Opção 1: Docker Compose (Recomendado)

Sobe PostgreSQL, pgAdmin e a aplicação com um único comando:

```bash
# 1. Copie e configure as variáveis de ambiente
cp .env.exemple .env
# edite o .env com seus valores

# 2. Suba todos os serviços
docker-compose up -d

# 3. Aplique as migrations do banco
docker-compose exec web npx prisma migrate deploy

# 4. Verifique se está rodando
curl http://localhost:3333/health
```

**Serviços disponíveis:**

| Serviço | URL | Descrição |
|---------|-----|-----------|
| API | `http://localhost:3333` | Aplicação principal |
| Prisma Studio | `http://localhost:5555` | Interface visual do banco |
| pgAdmin | `http://localhost:8082` | Gerenciador PostgreSQL |

**Parar os serviços:**

```bash
docker-compose down
```

---

### Opção 2: Desenvolvimento Local (sem Docker)

Requer PostgreSQL rodando localmente ou via Docker separado.

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.exemple .env
# edite o .env com DATABASE_URL apontando para seu PostgreSQL

# 3. Gere o Prisma Client
npx prisma generate

# 4. Aplique as migrations
npx prisma migrate deploy

# 5. Inicie o servidor com hot reload
npm run dev
```

---

### Comandos Úteis

```bash
# Banco de dados
npx prisma migrate dev --name <nome-da-migration>  # Criar e aplicar nova migration
npx prisma migrate deploy                           # Aplicar migrations pendentes
npx prisma studio                                   # Abrir Prisma Studio (porta 5555)
npx prisma generate                                 # Regenerar Prisma Client após mudar o schema

# Build para produção
npm run build    # Compila TypeScript → dist/
npm start        # Executa o build compilado

# Docker
docker-compose up -d      # Subir todos os serviços em background
docker-compose down       # Parar todos os serviços
docker-compose logs -f web  # Ver logs da aplicação em tempo real
```

---

## Testes

Os testes usam **Vitest** e ficam junto aos arquivos de código como `*.spec.ts` ou `*.test.ts`.

O padrão é injetar dependências (repositórios e clientes externos) via construtor, usando `vi.fn()` para mockar — sem container de DI.

```bash
npm test          # Modo watch (desenvolvimento)
npm run test:run  # Execução única (CI)
```
