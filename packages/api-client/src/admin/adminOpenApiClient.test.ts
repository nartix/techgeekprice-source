import { describe, expect, it } from "vitest";
import { createAdminOpenApiClient } from "./adminOpenApiClient";
import { clearAdminCsrfCache } from "./adminFetch";

const baseUrl = "https://spring.test/prefix";
describe("generated admin client", () => {
  it("serializes generated parameters, includes cookies and obtains fresh CSRF for every write", async () => {
    clearAdminCsrfCache();
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json(
        String(url).endsWith("/csrf")
          ? { token: "synthetic", headerName: "X-CSRF-TOKEN" }
          : { id: "1" },
      );
    };
    const client = createAdminOpenApiClient({ baseUrl, fetcher });
    await client.GET("/api/v1/admin/users", {
      params: {
        query: {
          page: 0,
          size: 20,
          sort: ["username,asc", "id,asc"],
          roles: ["ADMIN", "MODERATOR"],
        },
      },
    });
    for (let n = 0; n < 2; n++)
      await client.POST("/api/v1/admin/users", {
        body: {
          username: "test",
          email: "test@example.invalid",
          password: "synthetic",
          active: true,
        },
      });
    expect(calls).toHaveLength(5);
    expect(new URL(calls[0]!.url).pathname).toBe("/prefix/api/v1/admin/users");
    expect(new URL(calls[0]!.url).searchParams.getAll("sort")).toEqual([
      "username,asc",
      "id,asc",
    ]);
    expect(new URL(calls[0]!.url).searchParams.getAll("roles")).toEqual([
      "ADMIN",
      "MODERATOR",
    ]);
    expect(calls.every((c) => c.init?.credentials === "include")).toBe(true);
    expect(new Headers(calls[2]!.init?.headers).get("X-CSRF-TOKEN")).toBe(
      "synthetic",
    );
    expect(JSON.parse(String(calls[2]!.init?.body))).toMatchObject({
      username: "test",
      active: true,
    });
  });

  it.each([401, 403, 500, 503])(
    "preserves %s despite malformed or unreadable error bodies",
    async (status) => {
      for (const content of [
        "",
        "<html>private</html>",
        "{broken",
        "unreadable",
      ]) {
        const fetcher: typeof fetch = async () => {
          const response = new Response(content, { status });
          if (content === "unreadable")
            response.text = async () => {
              throw new Error("stream failure");
            };
          return response;
        };
        await expect(
          createAdminOpenApiClient({ baseUrl, fetcher }).GET(
            "/api/v1/admin/auth/me",
          ),
        ).rejects.toMatchObject({ status });
      }
    },
  );

  it.each([204, 205])(
    "accepts browser no-content status %s with an exposed empty stream",
    async (status) => {
      // Chromium's real network responses can expose an empty stream for 204.
      // The Response constructor nevertheless rejects any non-null body for it.
      const fetcher: typeof fetch = async (url) => {
        if (String(url).endsWith("/csrf"))
          return Response.json({
            token: "synthetic",
            headerName: "X-CSRF-TOKEN",
          });
        const response = new Response(null, {
          status,
          headers: { "x-request-id": "synthetic-request" },
        });
        Object.defineProperty(response, "body", {
          value: new ReadableStream({
            start(controller) {
              controller.close();
            },
          }),
        });
        return response;
      };
      const result = await createAdminOpenApiClient({
        baseUrl,
        fetcher,
      }).DELETE("/api/v1/admin/users/{id}", {
        params: { path: { id: 1 } },
      });
      expect(result.data ?? null).toBeNull();
      expect(result.response.status).toBe(status);
      expect(result.response.headers.get("x-request-id")).toBe(
        "synthetic-request",
      );
    },
  );

  it("preserves successful empty and malformed JSON semantics", async () => {
    for (const status of [200, 204]) {
      const result = await createAdminOpenApiClient({
        baseUrl,
        fetcher: async () => new Response(null, { status }),
      }).GET("/api/v1/admin/auth/me");
      expect(result.data ?? null).toBeNull();
      expect(result.response.status).toBe(status);
    }
    await expect(
      createAdminOpenApiClient({
        baseUrl,
        fetcher: async () => new Response("{broken"),
      }).GET("/api/v1/admin/auth/me"),
    ).rejects.toMatchObject({ code: "api_client.response.invalid_json" });
  });

  it("propagates caller signal through CSRF, aborts before write and never retries", async () => {
    const controller = new AbortController();
    let calls = 0;
    const fetcher: typeof fetch = async (_url, init) => {
      calls++;
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      return Response.json({ token: "synthetic", headerName: "X-CSRF-TOKEN" });
    };
    await expect(
      createAdminOpenApiClient({ baseUrl, fetcher }).POST(
        "/api/v1/admin/users",
        {
          signal: controller.signal,
          body: {
            username: "test",
            email: "test@example.invalid",
            password: "synthetic",
            active: true,
          },
        },
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(calls).toBe(1);
  });

  it("suppresses late responses and cancellation during body reading", async () => {
    for (const phase of ["fetch", "body"]) {
      const controller = new AbortController();
      const fetcher: typeof fetch = async () => {
        const response = Response.json({ id: 1 });
        if (phase === "fetch") controller.abort();
        else
          response.text = async () => {
            controller.abort();
            return '{"id":1}';
          };
        return response;
      };
      await expect(
        createAdminOpenApiClient({ baseUrl, fetcher }).GET(
          "/api/v1/admin/auth/me",
          { signal: controller.signal },
        ),
      ).rejects.toMatchObject({ name: "AbortError" });
    }
  });
});

it("consumes inconsistent zero-length headers and preserves successful read failures", async () => {
  const client = createAdminOpenApiClient({
    baseUrl,
    fetcher: async () =>
      new Response('{"id":1}', { headers: { "content-length": "0" } }),
  });
  expect((await client.GET("/api/v1/admin/auth/me")).data).toEqual({ id: 1 });
  const unreadable: typeof fetch = async () => {
    const response = Response.json({ id: 1 });
    response.text = async () => {
      throw new Error("synthetic stream failure");
    };
    return response;
  };
  await expect(
    createAdminOpenApiClient({ baseUrl, fetcher: unreadable }).GET(
      "/api/v1/admin/auth/me",
    ),
  ).rejects.toThrow("synthetic stream failure");
});

it("rejects authorization before sending and does not retry a failed mutation", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (url) => {
    calls++;
    return String(url).endsWith("/csrf")
      ? Response.json({ token: "synthetic", headerName: "X-CSRF-TOKEN" })
      : new Response("unavailable", { status: 503 });
  };
  const client = createAdminOpenApiClient({ baseUrl, fetcher });
  const body = {
    username: "test",
    email: "test@example.invalid",
    password: "synthetic",
    active: true,
  };
  await expect(
    client.POST("/api/v1/admin/users", {
      body,
      headers: { authorization: "Bearer synthetic" },
    }),
  ).rejects.toMatchObject({ code: "api_client.admin.authorization_forbidden" });
  expect(calls).toBe(0);
  await expect(
    client.POST("/api/v1/admin/users", { body }),
  ).rejects.toMatchObject({ status: 503 });
  expect(calls).toBe(2);
});
