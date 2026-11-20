# TechGeekPrice

A Next.js administration frontend for the [Spring API](https://github.com/nartix/spring-api-source).
Explore the [live demo](https://categorylisting.ferozfaiz.com).

The current application manages users and catalog category hierarchies, with
permission-aware navigation, forms and actions; parent selection and tree views;
server-backed pagination, sorting and filtering; and session authentication with
CSRF protection. It supports English (Canada and US), French (Canada), and light,
dark and automatic themes. Public shopping, product comparison and Amazon
integration are future work.

## Stack and layout

Next.js App Router, React, TypeScript, Mantine, Tailwind CSS, next-intl and Refine,
organized as a pnpm/Turborepo workspace. `apps/web` contains the application;
`packages` contains shared UI, API clients, generated contracts and configuration.
Backend persistence belongs to the sibling Spring API.

## Local development

Use Node.js 24 or newer and pnpm 11.3.0 (the version in `packageManager`).

```sh
pnpm install --frozen-lockfile
cp .env.example apps/web/.env.local
pnpm dev
```

Start the sibling Spring API separately with your own database and credentials.
The defaults expect it at `http://127.0.0.1:8080`; the frontend runs at
`http://localhost:3000`. Set `SPRING_API_BASE_URL` to the backend URL. Set
`NEXT_PUBLIC_SPRING_API_BASE_URL` to the frontend origin so browser requests use
the Next.js admin API proxy. No private services or provisioning tools are required.

Authentication uses accounts and permissions configured in your backend. The
public demo's displayed accounts apply only to that demo; demo mode is disabled
by default in local configuration.

## Checks and production build

```sh
pnpm contracts:check
pnpm typecheck
pnpm lint
pnpm test
pnpm storybook:coverage
pnpm storybook:admin:coverage
pnpm build
```

Production builds use Webpack.

Production builds require `NEXT_PUBLIC_SPRING_API_BASE_URL` to be an explicit
HTTPS frontend origin, for example `https://admin.example.com`. Set this and the
backend URL in `apps/web/.env.local` or the process environment before building.
Next.js generates its API rewrites during the build; rebuild if either URL changes.
Serve production behind HTTPS, then run `pnpm --filter web start`.

For browser tests, start the frontend, install Chromium with
`pnpm --filter web exec playwright install chromium`, then run `pnpm --filter web test:e2e`.
Use `TGP_E2E_EXTERNAL_URL` to test a different frontend origin. Tests mock API
responses; they do not provision a backend. On Linux, Playwright may also require
its browser system dependencies.

The versioned OpenAPI snapshot and generated TypeScript are application build
inputs. `pnpm contracts:generate` regenerates them offline; see
[contract provenance and manual compatibility cases](packages/contracts/openapi/README.md).
[Category onboarding](docs/category-system-onboarding.md) describes the shared
category screen composition and current limitations.

## Third-party notices

Dependencies retain their respective licenses. Bundled Geist fonts are covered
by the [SIL Open Font License](apps/web/src/app/fonts/OFL.txt).
This source snapshot does not grant an additional open-source license for the
project's original code.
