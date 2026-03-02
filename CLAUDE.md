# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start server with hot reload (tsx watch)
npm run build        # Compile TypeScript to dist/ via tsup
npm start            # Run compiled production build

# Tests
npm test             # Run vitest in watch mode
npm run test:run     # Run vitest once (CI)

# Database
npx prisma migrate dev --name <migration-name>   # Create and apply a migration
npx prisma migrate deploy                         # Apply pending migrations
npx prisma studio                                 # Open Prisma Studio (port 5555)
npx prisma generate                               # Regenerate Prisma client after schema changes

# Docker (full stack)
docker-compose up -d          # Start PostgreSQL, pgAdmin, and app
docker-compose down           # Stop all services
```

## Architecture

This is a **financial credit management API** (EvoCredit) built with Express + TypeScript + Prisma + PostgreSQL. It integrates with the Asaas payment gateway and is designed for WhatsApp-based user interactions.

### Layered Architecture

```
HTTP Layer      src/http/routes/       → Route definitions
                src/http/controllers/  → Zod validation + response handling
Service Layer   src/services/          → Business logic orchestration
Repository      src/repositories/      → Interface definitions
                src/repositories/prisma/ → Prisma implementations
Lib             src/lib/               → Prisma client, Asaas API client
Env             src/env/index.ts       → Zod-validated environment variables
```

### Key Domain Concepts

- **User**: Identified by `whatsappId` (`554799999999@s.whatsapp.net` format). Has a decimal `balance`, optional `email`, and optionally an `asaasCustomerId`.
- **Transaction**: Immutable ledger entries. Positive amounts = credits (DEPOSIT/BONUS), negative = debits (CONSUMPTION/REFUND).
- **ConsultationLog**: Audit log for external API calls (e.g., CPF/CNPJ lookups via Neocredi). Each call has a `cost` deducted via a linked Transaction.
- **Payment**: PIX payment records linked to Asaas. Stores `pixCode` and `qrCodeImage` for payment flows.

### External Integrations

- **Asaas** (`src/lib/asaas-client.ts`): Payment gateway. Uses sandbox endpoint (`https://api-sandbox.asaas.com/v3`). Switch to production by changing `ASAAS_API_KEY`. The client auto-creates customers when `cpfCnpj` is provided during user creation.
- Path alias `@/*` maps to `src/*` (configured in both `tsconfig.json` and `vitest.config.ts`).

### Tests

Tests use **Vitest** and live alongside source files as `*.spec.ts` or `*.test.ts`. The pattern is to mock repository and external client dependencies via `vi.fn()` and inject them directly into service constructors — no DI container, just constructor injection.

### Environment Setup

Copy `.env.exemple` to `.env`. Key variables:
- `DATABASE_URL`: PostgreSQL connection string (used by Prisma)
- `ASAAS_API_KEY`: Payment gateway key (sandbox keys start with `$teste`)
- `API_PORT`: Server port (default 3333)

The app runs containerized via Docker. The `web` service mounts source files as volumes, so `npm run dev` inside the container picks up live changes.
