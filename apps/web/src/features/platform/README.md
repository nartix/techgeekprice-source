# Platform

Owns app shell concerns, metadata, SEO helpers, analytics adapters, feature
flags, monitoring helpers, and other cross-cutting frontend infrastructure.

Current app-specific component ownership:

- `components/AppProviders.tsx`: app-level Client Component provider wrapper for
  Mantine theme and color-scheme state.
