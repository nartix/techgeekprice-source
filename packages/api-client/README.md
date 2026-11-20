# `@tgp/api-client`

Framework-light HTTP access for the external Spring Boot API.

This package owns shared request behavior, validated base URL input, response
parsing, and typed API errors for `nartix/spring-api-source`. It must not import
from `apps/web`, React, Next.js route code, or any frontend database layer.

Endpoint-specific functions should be added only when a real Spring Boot
capability exists and a feature API module needs it.

Expected data flow:

```text
apps/web/src/app route or page
-> apps/web/src/features/<domain>/services/*.service.ts
-> apps/web/src/features/<domain>/api/*.api.ts
-> @tgp/api-client
-> nartix/spring-api-source
```

`apps/web/src/env.ts` validates `SPRING_API_BASE_URL` and passes the value to
`createSpringApiClient`. This package must never read `process.env` directly.

## Cancellation and session verification

Refine adapters accept cancellation through `meta.signal`. Feature option loaders
and the category-tree adapter forward their `signal` there. The same signal reaches
reads, writes and the fresh CSRF request before every write. Deliberate cancellation
rejects as `AbortError`; consuming UI must ignore aborted or replaced results and
must not show a failure notification or retry prompt for them.

Cancelling a write does not mean the server rolled it back. It may already have
committed. Read authoritative state before deciding whether to repeat it; the
client does not automatically retry mutations.

Unsuccessful HTTP responses retain their status and existing typed admin errors,
even with empty, non-JSON, malformed or unreadable bodies. Raw response text and
status diagnostics are not user messages. Successful malformed JSON remains an
invalid-JSON error; empty successful responses continue to return `null`.

The admin session boundary performs fresh verification before rendering protected
content. Only a confirmed 401 redirects to sign in; 403 or missing dashboard access
shows denial. Network/server failures and a 30-second verification deadline show a
localized retry state without logging out. Cached identity cannot bypass this gate.

## Generated OpenAPI client

`createAdminOpenApiClient` uses the versioned Spring schema from `@tgp/contracts` with `openapi-fetch`. It checks literal methods, paths, parameters and bodies at compile time:

```ts
import { createAdminOpenApiClient } from "@tgp/api-client";

const client = createAdminOpenApiClient({ baseUrl: window.location.origin });
const { data } = await client.GET("/api/v1/admin/users", {
  params: { query: { page: 0, size: 20, sort: ["username,asc", "id,asc"] } },
  signal: controller.signal,
});
```

The actual admin auth `me` request and Refine list/detail/create/update/delete/custom operations now dispatch through generated literal operations when their inputs fit the schema. The generated client shares the existing raw transport: included credentials, forbidden caller authorization, fresh CSRF before each write, injectable URL/init fetch, cancellation and typed safe errors remain in force. It throws the existing typed errors; there are no automatic retries. Response status is preserved, and successful JSON reading retains cancellation/invalid-JSON checks. Empty successes map to null at the existing compatibility boundary (the direct generated library can return undefined for no-content statuses).

Generated types do **not** validate live responses. Keep existing runtime validation and DTO-to-view-model mapping. Raw generated `paths`, `operations` and `components` are public type exports from `@tgp/contracts`; legacy DTO names derive generated fields with documented compatibility refinements. The generic Refine response boundary remains caller-owned and makes no endpoint-specific static guarantees for arbitrary resource strings.

Schema-covered object bodies retain JSON serialization even with caller-supplied content-type headers. Native `BodyInit` inputs stay on the legacy compatibility path. Already-aborted adapter requests reject before inspecting or serializing the body.

Run `pnpm contracts:generate` and `pnpm contracts:check` from the repository root. Freshness also runs during contracts/root typecheck. Generation is deterministic, offline, timestamp-free and rejects external schema references. Do not hand-edit generated files.

See [schema provenance, full endpoint inventory and manual exceptions](../contracts/openapi/README.md). Login/logout security filters and incorrectly documented CSRF inputs remain manual. Nullable category mutations, weak merge-patch schemas and unsupported generic extension inputs retain compatible transport without stripping values or inventing schema declarations. Backend source and authentication architecture are unchanged.
