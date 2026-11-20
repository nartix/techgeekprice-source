# `@tgp/validators`

Shared framework-agnostic validation schemas.

Put reusable Zod schemas here only when more than one app or package needs the
same validation contract. App-specific route, form, and search-param schemas
should stay in the owning feature domain until reuse is real.
