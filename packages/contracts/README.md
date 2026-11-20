# `@tgp/contracts`

DTO and contract types for the external Spring Boot API.

This package owns backend request and response shapes consumed by the frontend.
It should stay runtime-light and must not import React, Next.js, `apps/web`,
`@tgp/ui`, or `@tgp/api-client`.

Do not invent DTOs from frontend guesses. Generated OpenAPI types should live
here when generation is available. Manual DTOs are allowed only when they mirror
confirmed Spring Boot API contracts.

Future OpenAPI generation should update this package first, then feature
mappers can translate DTOs into frontend view models where that improves UI
clarity or safety.
