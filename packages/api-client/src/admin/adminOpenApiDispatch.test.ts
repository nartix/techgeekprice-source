import { describe, expect, it, vi } from "vitest";
import { createAdminOpenApiClient } from "./adminOpenApiClient";
import { dispatchAdminOpenApi } from "./adminOpenApiDispatch";

import * as clientModule from "./adminOpenApiClient";
import { adminSpringDataProvider } from "../refine/adminSpringDataProvider";
import { createAdminAuthClient } from "./adminAuthClient";

const category = "/api/v1/admin/category-systems/catalogue/categories";
const createUser = {
  username: "test",
  email: "test@example.invalid",
  password: "synthetic",
  active: true,
};
const cases = [
  ["GET", "/api/v1/admin/auth/me"],
  ["GET", "/api/v1/admin/users?page=0&roles=ADMIN&roles=MODERATOR"],
  ["POST", "/api/v1/admin/users", createUser],
  ["GET", "/api/v1/admin/users/1"],
  ["PUT", "/api/v1/admin/users/1", createUser],
  ["DELETE", "/api/v1/admin/users/1"],
  ["PATCH", "/api/v1/admin/users/1/status", { active: false }],
  ["GET", "/api/v1/admin/roles?q=test"],
  ["GET", "/api/v1/admin/roles?q=why?now"],
  ["GET", "/api/v1/admin/permissions?active=true"],
  ["GET", `${category}?page=0&size=20&sort=name%2Casc&sort=id%2Casc`],
  ["POST", category, { name: "Test", slug: "test", active: true }],
  ["GET", `${category}/1`],
  ["PUT", `${category}/1`, { name: "Test", slug: "test", active: true }],
  ["DELETE", `${category}/1`],
  ["GET", `${category}/tree?page=0&size=20`],
  ["GET", `${category}/capabilities`],
  ["GET", `${category}/parent-options?includeIds=1&includeIds=2&limit=10`],
  ["GET", `${category}/1/breadcrumb`],
  ["POST", `${category}/1/move`, { newParentId: 2 }],
  ["POST", `${category}/1/reorder`, { beforeId: 2 }],
  ["POST", `${category}/1/activate`],
  ["POST", `${category}/1/deactivate`],
] as const;

describe("generated operation dispatch", () => {
  it.each(cases)(
    "routes %s %s through a generated literal operation",
    async (method, path, ...rest) => {
      const seen: string[] = [];
      const calls: { url: string; init?: RequestInit }[] = [];
      const client = createAdminOpenApiClient({
        baseUrl: "https://spring.test",
        fetcher: async (url, init) => {
          calls.push({ url: String(url), init });
          if (String(url).endsWith("/csrf"))
            return Response.json({
              token: "synthetic",
              headerName: "X-CSRF-TOKEN",
            });
          // Source-verified statuses differ from the snapshot's incomplete 200 declarations.
          if (
            method === "DELETE" ||
            /\/(move|activate|deactivate)$/.test(String(url))
          )
            return new Response(null, { status: 204 });
          if (String(url).endsWith("/reorder"))
            return Response.json({ id: 1, name: "Test", slug: "test" });
          return Response.json(
            { data: [], page: { totalElements: 0 } },
            { status: method === "POST" ? 201 : 200 },
          );
        },
      });
      client.use({
        onRequest({ schemaPath }) {
          seen.push(schemaPath);
        },
      });
      const result = dispatchAdminOpenApi(client, path, {
        method,
        body: rest[0],
      });
      expect(result).toBeDefined();
      const data = await result;
      if (method === "DELETE" || /\/(move|activate|deactivate)$/.test(path))
        expect(data).toBeNull();
      if (path.endsWith("/reorder"))
        expect(data).toEqual({ id: 1, name: "Test", slug: "test" });
      expect(seen).toHaveLength(1);
      expect(seen[0]).not.toContain("catalogue");
      const actual = calls.at(-1)!;
      expect(actual.init?.method).toBe(method);
      expect(new URL(actual.url).pathname).toBe(path.split("?")[0]);
      expect([...new URL(actual.url).searchParams.entries()]).toEqual([
        ...new URL(path, "https://spring.test").searchParams.entries(),
      ]);
      if (rest[0])
        expect(JSON.parse(String(actual.init?.body))).toEqual(rest[0]);
    },
  );

  it.each([
    ["POST", "/api/v1/admin/auth/login", { username: "test" }],
    ["GET", "/api/v1/admin/auth/csrf"],
    ["PATCH", `${category}/1`, { active: false }],
    ["POST", category, { name: "Test", slug: "test", parentId: null }],
    ["PUT", "/api/v1/admin/users/1", { ...createUser, firstName: null }],
    ["GET", `${category}/9007199254740993`],
    ["GET", "/api/v1/admin/users?unknown=preserve"],
    ["GET", "/api/v1/admin/users?search=why#fragment"],
    ["GET", "/api/v1/admin/users?constructor=preserve"],
    ["GET", "/api/v1/admin/users?__proto__=preserve"],
    ["GET", "/api/v1/admin/users?page=01"],
    ["GET", "/api/v1/admin/users?active=perhaps"],
    ["GET", "/api/v1/admin/extension"],
  ] as const)(
    "retains manual compatibility for %s %s",
    (method, path, ...rest) => {
      const client = createAdminOpenApiClient({
        baseUrl: "https://spring.test",
        fetcher: async () => {
          throw new Error("must not fetch");
        },
      });
      expect(
        dispatchAdminOpenApi(client, path, { method, body: rest[0] }),
      ).toBeUndefined();
    },
  );
});

it("uses generated operations from actual Refine and auth adapters without changing response envelopes", async () => {
  const schemas: string[] = [];
  const original = clientModule.createAdminOpenApiClient;
  const factory = vi
    .spyOn(clientModule, "createAdminOpenApiClient")
    .mockImplementation((options) => {
      const client = original(options);
      client.use({
        onRequest({ schemaPath }) {
          schemas.push(schemaPath);
        },
      });
      return client;
    });
  const page = {
    data: [{ id: "1", username: "test" }],
    page: { number: 0, size: 20, totalElements: 1 },
    links: { self: "/users" },
  };
  const fetcher: typeof fetch = async (url) => {
    if (String(url).endsWith("/csrf"))
      return Response.json({ token: "synthetic", headerName: "X-CSRF-TOKEN" });
    if (String(url).includes("?")) return Response.json(page);
    if (String(url).endsWith("/auth/me"))
      return Response.json({
        id: "1",
        username: "test",
        roles: ["ADMIN"],
        permissions: [],
        sessionScope: "admin",
      });
    return Response.json({ id: "1", username: "test" });
  };
  try {
    const provider = adminSpringDataProvider({
      baseUrl: "https://spring.test",
      fetcher,
      resources: [{ name: "users", apiPath: "/api/v1/admin/users" }],
    });
    expect(await provider.getList({ resource: "users" })).toEqual({
      data: page.data,
      total: 1,
      page: page.page,
      links: page.links,
    });
    await provider.getOne({ resource: "users", id: 1 });
    await provider.create({ resource: "users", variables: createUser });
    await provider.update({ resource: "users", id: 1, variables: createUser });
    await provider.deleteOne({ resource: "users", id: 1 });
    await provider.custom({ method: "get", url: `${category}/capabilities` });
    expect(
      await createAdminAuthClient({
        baseUrl: "https://spring.test",
        fetcher,
      }).me(),
    ).toMatchObject({ username: "test" });
    expect(schemas).toEqual([
      "/api/v1/admin/users",
      "/api/v1/admin/users/{id}",
      "/api/v1/admin/users",
      "/api/v1/admin/users/{id}",
      "/api/v1/admin/users/{id}",
      "/api/v1/admin/category-systems/{systemKey}/categories/capabilities",
      "/api/v1/admin/auth/me",
    ]);
  } finally {
    factory.mockRestore();
  }
});

it.each([
  new Blob(["synthetic bytes"]),
  new FormData(),
  new URLSearchParams({ name: "test" }),
])(
  "keeps native BodyInit payloads on the legacy compatibility path",
  async (body) => {
    const client = createAdminOpenApiClient({
      baseUrl: "https://spring.test",
      fetcher: async () =>
        Response.json({ token: "synthetic", headerName: "X-CSRF-TOKEN" }),
    });
    const pending = dispatchAdminOpenApi(client, category, {
      method: "POST",
      body,
    });
    if (pending) await pending.catch(() => undefined);
    expect(pending).toBeUndefined();
  },
);

it.each(["application/json", "application/x-www-form-urlencoded"])(
  "preserves legacy object body serialization with %s headers",
  async (contentType) => {
    const { adminFetch } = await import("./adminFetch");
    const { adminOpenApiRequest } = await import("./adminOpenApiDispatch");
    const captured: { body: unknown; contentType: string | null }[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      if (String(url).endsWith("/csrf"))
        return Response.json({
          token: "synthetic",
          headerName: "X-CSRF-TOKEN",
        });
      captured.push({
        body: init?.body,
        contentType: new Headers(init?.headers).get("content-type"),
      });
      return Response.json({ id: "1" });
    };
    const options = {
      baseUrl: "https://spring.test",
      fetcher,
      method: "POST",
      headers: { "content-type": contentType },
      body: createUser,
    };
    await adminFetch("/api/v1/admin/users", options);
    await adminOpenApiRequest("/api/v1/admin/users", options);
    expect(captured[0]).toEqual({
      body: JSON.stringify(createUser),
      contentType,
    });
    expect(captured[1]).toEqual(captured[0]);
  },
);

it("preserves pre-abort precedence over body serialization errors", async () => {
  const { adminFetch } = await import("./adminFetch");
  const { adminOpenApiRequest } = await import("./adminOpenApiDispatch");
  const controller = new AbortController();
  controller.abort();
  const body: Record<string, unknown> = { name: "Test" };
  body.extension = body;
  const fetcher = vi.fn<typeof fetch>();
  const options = {
    baseUrl: "https://spring.test",
    method: "POST",
    signal: controller.signal,
    body,
    fetcher,
  };
  await expect(adminFetch(category, options)).rejects.toMatchObject({
    name: "AbortError",
  });
  await expect(adminOpenApiRequest(category, options)).rejects.toMatchObject({
    name: "AbortError",
  });
  expect(fetcher).not.toHaveBeenCalled();
});
