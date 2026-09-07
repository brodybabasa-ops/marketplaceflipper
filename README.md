# Pocket Mechanic

Trusted marketplace connecting vehicle owners with qualified, independent automotive mechanics.

**Find a mechanic you can trust.**

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- PostgreSQL + Prisma
- Credential authentication with signed HTTP-only session cookies (Clerk/Supabase-ready via env)
- Zod validation, server actions, modular services
- Payment, email, and SMS adapters (mock until Stripe/Resend/Twilio keys are set)

## Local development

PostgreSQL must be running. Default connection is in `.env.example`.

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

Password for all demo users: `Demo1234!`

| Role | Email |
| --- | --- |
| Customer | `customer@demo.pocketmechanic.app` |
| Mechanic | `mechanic@demo.pocketmechanic.app` |
| Admin | `admin@demo.pocketmechanic.app` |

## Architecture

- `app/` routes and server actions
- `components/` reusable UI
- `lib/` session, validation, constants
- `services/` ranking, matching, jobs, estimates, payments, notifications
- `db/` Prisma client
- `prisma/schema.prisma` marketplace data model

Ranking uses a configurable `mechanicScore`. Mechanics cannot pay for a higher organic rank. Sponsored placement, if added later, must be labeled.

## Legal

Public legal pages are placeholders and require counsel review before launch. Pocket Mechanic does not diagnose vehicles and is not currently offering insured financial coverage via Pocket Protect.
