import { createAdminOpenApiClient } from "./adminOpenApiClient";

// Compile-only scenarios: unused expected-error directives fail typecheck if
// generated client signatures become permissive. This function is never called.
function verifyRequests(client: ReturnType<typeof createAdminOpenApiClient>) {
  client.GET("/api/v1/admin/users/{id}", { params: { path: { id: 1 } } });
  // @ts-expect-error Invented paths must be rejected.
  client.GET("/api/v1/admin/invented");
  // @ts-expect-error Required path parameters cannot be omitted.
  client.GET("/api/v1/admin/users/{id}");
  // @ts-expect-error Numeric path parameters reject strings.
  client.GET("/api/v1/admin/users/{id}", { params: { path: { id: "abc" } } });
  // @ts-expect-error Query flags are booleans.
  client.GET("/api/v1/admin/users", { params: { query: { active: "true" } } });
  // @ts-expect-error Create requires the generated request body fields.
  client.POST("/api/v1/admin/users", { body: { username: "test" } });
}
void verifyRequests;
