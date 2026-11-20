# Category-System Onboarding

Use this guide only after the external Spring Boot API already exposes a
standard numeric-v1 category system. This frontend never discovers systems from
the backend and must not add a Route Handler, Server Action, database change,
or a second production registration as part of verification.

## Register one system

1. Add one immutable definition in
   `apps/web/src/features/catalog/admin/categories/category-system/`. Give it an
   exact lowercase `systemKey`, its matching system-keyed API path, the
   `NUMERIC_LONG_V1` identifier adapter, `IMPLICIT_NULL_PARENT` roots, bounded
   limits, declared and visible operation subsets, exact permissions, enabled
   screens, presentation, navigation, and translation ownership.
2. Register that definition in the production `categorySystemRegistry` only
   when it is intended to have a visible resource and navigation entry. The
   registry rejects duplicate system, resource, generic route, and alias route
   ownership; do not introduce fallbacks or arbitrary metadata strings.
3. The generic family is always
   `/admin/category-systems/{systemKey}/categories`, plus `/tree`, `/create`,
   `/{id}`, and `/{id}/edit`; children use `?parentId={id}`. Reuse
   `CategoryScreenComposition` and a frozen route family—do not copy category
   pages, forms, tables, actions, picker, tree, runtime, or error handling.
4. Add an optional retained alias only when a stable existing URL requires it.
   Alias wrappers select their alias family and must never redirect to generic
   URLs. The definition owns copy and policy; the selected family owns links
   and mutation redirects.
5. Add matching user-facing messages in en-CA, en-US, and fr-CA. Keep generic
   shell messages under `Admin.CategoryShell`; system workflow copy stays in
   its definition-owned namespace.

## Verification

Add registry, route-family, route-resolution, runtime-isolation, component,
sidebar/resource-projection, locale-parity, and generic/alias Playwright tests.
Run focused tests and the removed-route guard when editing shared symbols or
deleting a compatibility seam. Review light,
dark, and auto modes; 360px through 1536px; and keyboard-only flows.

## Current limits

Supported frontend composition is standard numeric-v1 only. Do not add opaque
IDs, arbitrary writable fields, custom lifecycle actions, categorized-entity
workflows, backend-driven configuration, automatic backend discovery, or
visible reorder UI.
