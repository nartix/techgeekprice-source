import type { paths, components } from "./generated/spring";

type AssertPath<T extends keyof paths> = T;
type ValidPath = AssertPath<"/api/v1/admin/users">;
// @ts-expect-error An invented path must not enter the generated contract.
type InvalidPath = AssertPath<"/api/v1/admin/invented">;
const validBody: components["schemas"]["AdminCreateUserRequest"] = {
  username: "test",
  email: "test@example.invalid",
  password: "synthetic-password",
  active: true,
};
// @ts-expect-error The backend requires username, email, password and active.
const missingBody: components["schemas"]["AdminCreateUserRequest"] = {
  active: true,
};
const wrongBody: components["schemas"]["AdminCreateUserRequest"] = {
  ...validBody,
  // @ts-expect-error active must remain boolean.
  active: "yes",
};
const wrongId: paths["/api/v1/admin/users/{id}"]["get"]["parameters"]["path"] =
  {
    // @ts-expect-error Numeric path identifiers must not accept an arbitrary string.
    id: "abc",
  };
// Keep fixtures compile-only; no runtime exports or calls.
void validBody;
void missingBody;
void wrongBody;
void wrongId;
