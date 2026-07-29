---
name: bcryptjs over bcrypt for Replit
description: Use bcryptjs (pure JS) not bcrypt (native addon) to avoid pnpm build approval issues
---

**Rule:** Use `bcryptjs` + `@types/bcryptjs` instead of `bcrypt` + `@types/bcrypt`.

**Why:** `bcrypt` is a native Node.js addon that requires compiling C++ during `pnpm install`. Replit's pnpm blocks native build scripts by default with "Ignored build scripts: bcrypt". The package installs but the binary is missing, causing runtime crashes. `bcryptjs` is a pure-JS port with the same API and no native build step.

**How to apply:** `pnpm --filter @workspace/api-server add bcryptjs` and `pnpm --filter @workspace/api-server add -D @types/bcryptjs`. Import as `import bcrypt from "bcryptjs"` — identical API to the native package.
