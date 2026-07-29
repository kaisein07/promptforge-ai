---
name: Zod v3 OpenAPI codegen constraint
description: format: email in OpenAPI spec generates zod.email() which is Zod v4 syntax — breaks typecheck on v3
---

**Rule:** Never use `format: email` on string fields in `lib/api-spec/openapi.yaml`.

**Why:** Orval generates `zod.email()` for fields with `format: email`. That is Zod v4 API. This workspace pins `zod: ^3.25.76` (v3), where `email()` does not exist as a top-level method — it's `z.string().email()`. The build fails at `pnpm run typecheck:libs` with `Property 'email' does not exist on type 'typeof import(".../zod/index")'`.

**How to apply:** Just omit `format: email` from any string field. Email format validation can be done in route handlers with a manual regex or a library if needed.
