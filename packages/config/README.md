# `@tgp/config`

Shared repository configuration boundary.

This package exports `repositoryConfigPackages`, a provider map for shared
repository configuration package ownership. It records where reusable config
lives without merging focused packages prematurely:

- `@tgp/eslint-config` owns ESLint flat config presets.
- `@tgp/typescript-config` owns shared TypeScript config presets.

Future shared Prettier, Tailwind, or tool config can be added here when a real
consumer needs a central provider map entry.

Do not move those packages into this boundary unless a later task has a focused
migration reason.
