# web

Main customer-facing Next.js app.

## Commands

Run from the repository root:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web test
pnpm --filter web test:e2e
pnpm --filter web typecheck
```

## Notes

- This app uses the Next.js App Router.
- Application source lives under `apps/web/src`.
- Keep route composition under `apps/web/src/app`.
- Place business implementation under `apps/web/src/features` using the
  `catalog`, `content`, `engagement`, `identity`, and `platform` domains.
- Keep pages and layouts as Server Components by default.
- Put browser-only behavior in small Client Components.
- Import shared UI from categorized `@tgp/ui/*` exports when reusable components exist, and framework-agnostic utilities from `@tgp/utils/*`.
- Read server-only environment values through `apps/web/src/env.ts`.
- Vitest setup lives in `vitest.config.mts` and `vitest.setup.ts`; MSW test
  handlers live under `apps/web/tests`.
- Playwright E2E specs live under `apps/web/e2e`. Install the browser with
  `pnpm --filter web exec playwright install chromium`, start `pnpm dev`, then
  run `pnpm --filter web test:e2e`. On Linux, browser system dependencies may
  also be needed. See the root README for environment settings.
