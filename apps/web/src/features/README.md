# Feature Domains

`apps/web/src/features` groups app-local implementation by business domain.
Routes in `apps/web/src/app` should stay thin and compose feature services,
feature components, and shared packages.

Allowed top-level domains:

- `catalog`: product, merchant, offer, price, search, and comparison behavior.
- `content`: blog, editorial, author, tag, guide, and SEO content behavior.
- `engagement`: comments, reviews, ratings, reactions, reports, and moderation.
- `identity`: account, profile, preferences, saved items, and user-specific UI.
- `platform`: app shell, metadata, analytics, feature flags, and observability adapters.

Do not add isolated top-level `products`, `blog`, `comments`, or `reviews`
folders. Keep code app-local until reuse outside `apps/web` is real.
