# Shared App Code

`apps/web/src/shared` is for app-local code reused across multiple feature
domains but not suitable for a shared `@tgp/*` package.

Examples include app-only layout helpers, hooks, styles, and components. Create
subfolders only when real code needs them.
