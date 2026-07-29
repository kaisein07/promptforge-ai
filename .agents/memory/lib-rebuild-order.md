---
name: Lib rebuild order before artifact typecheck
description: Must run typecheck:libs after changing any lib/* schema before leaf artifact typechecks
---

**Rule:** After editing any file in `lib/db/src/schema/` (or any other `lib/*` composite package), always run `pnpm run typecheck:libs` before running `pnpm --filter @workspace/api-server run typecheck`.

**Why:** The lib packages are composite TypeScript projects that emit declarations. Artifact packages (like api-server) import from `@workspace/db` — they consume the *emitted declarations*, not the source. If declarations are stale, the artifact typecheck sees "Module has no exported member 'X'" even though the source is correct. `typecheck:libs` runs `tsc --build` which rebuilds the declarations in the right order.

**How to apply:** Anytime you add a new table, schema, or export to a `lib/*` package, run `pnpm run typecheck:libs` first. The codegen script (`pnpm --filter @workspace/api-spec run codegen`) already runs this automatically after generating — no need to run it again after codegen.
