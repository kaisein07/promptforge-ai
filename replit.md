# PromptForge AI

Plateforme web française qui guide les utilisateurs pas-à-pas pour générer des prompts professionnels pour les IA génératives d'images (ChatGPT, Gemini, Grok, Midjourney, etc.).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/promptforge run dev` — run the frontend (port 23239)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite lib declarations (run before artifact typechecks after schema changes)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `GROK_API_KEY` — xAI Grok API key (falls back to built-in generator if absent)
- Required env: `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, Framer Motion, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- AI: xAI Grok API (OpenAI-compatible SDK), with intelligent fallback
- Auth: JWT (jsonwebtoken + bcryptjs)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB schema (users, prompts, payments, config)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/grok.ts` — AI prompt generation with Grok
- `artifacts/api-server/src/lib/auth.ts` — JWT + bcrypt helpers
- `artifacts/api-server/src/middlewares/authenticate.ts` — JWT auth middleware
- `artifacts/promptforge/src/` — React frontend

## Architecture decisions

- JWT auth stored in localStorage; AuthContext provides user/token to whole app
- Grok API is optional: if GROK_API_KEY is absent, a rule-based fallback generates prompts
- Admin role assigned at registration based on email (babioabdoul93@gmail.com)
- Free limit (5 prompts) and premium price configurable via admin panel → DB config table
- bcryptjs (pure JS) used instead of bcrypt (native) to avoid build issues in Replit
- All UI text is in French; generated prompts are in English (better AI results)

## Product

PromptForge AI guides users through a 9-step wizard to generate professional AI image prompts. Features: auth, wizard, history, favorites, premium upgrade, user feedback on prompts, admin dashboard (stats, users, config, payments).

## User preferences

- UI entirely in French
- Admin account: babioabdoul93@gmail.com / @#Babio93#@
- Generated prompts are in English for better AI results
- Premium: configurable price (default 10 000 FCFA, à vie)

## Gotchas

- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck`
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`
- Don't use `format: email` in OpenAPI spec (generates `zod.email()` = Zod v4 syntax, breaks v3)
- `pnpm run typecheck:libs` must run before leaf artifact typechecks when lib schemas change

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
