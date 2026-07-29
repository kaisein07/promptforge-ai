---
name: MongoDB migration
description: Project switched from PostgreSQL + Drizzle to MongoDB + Mongoose. Key decisions and gotchas.
---

## Rule
The database layer (`@workspace/db`) uses Mongoose, not Drizzle. Never re-introduce drizzle-orm, pg, or drizzle-zod.

## Connection
- Secret: `MONGODB_URI` (user's MongoDB Atlas cluster)
- DB name: `promptforge` (set in `connectDB()`)
- URI must have `@` characters in passwords percent-encoded as `%40`

## ID Strategy
- All models (User, Prompt, Payment) use a numeric auto-increment `id` field (integer) via a `Counter` collection — preserves existing API contract (frontend expects numeric IDs)
- Mongoose schema option `{ id: false }` disables the built-in `id` virtual so `doc.id` returns the numeric field
- Counter collection: `getNextId("users" | "prompts" | "payments")` — findByIdAndUpdate with $inc

## Seeding
- `seedDefaultConfig()` runs at server startup in `index.ts`, uses `$setOnInsert` to avoid overwriting admin changes to `premium_price` and `free_limit`

**Why:** User explicitly requested their own MongoDB database. PostgreSQL was Replit's managed DB (auto-provisioned). MongoDB Atlas is user-owned.
