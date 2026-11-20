import { describe, expect, it, vi } from "vitest";

import { AdminApiClientError, JsonParseError } from "../api-client-error";
import {
  adminFetch,
  clearAdminCsrfCache,
  getAdminCsrfToken,
} from "./adminFetch";

const baseUrl = "https://spring.test";

describe("adminFetch", () => {
  it("includes credentials and omits CSRF for GET requests", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({ ok: true }),
    ) as unknown as typeof fetch;

    const result = await adminFetch<{ ok: boolean }>("/api/v1/admin/users", {
      baseUrl,
      fetcher,
    });

    expect(result).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledWith(
      new URL("https://spring.test/api/v1/admin/users"),
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      }),
    );

    const headers = vi.mocked(fetcher).mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.has("x-csrf-token")).toBe(false);
  });

  it("allows nested admin API paths under the admin API boundary", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({ ok: true }),
    ) as unknown as typeof fetch;

    await adminFetch("/api/v1/admin/category-systems/catalogue/categories", {
      baseUrl,
      fetcher,
    });

    expect(vi.mocked(fetcher).mock.calls[0]?.[0]).toEqual(
      new URL(
        "https://spring.test/api/v1/admin/category-systems/catalogue/categories",
      ),
    );
  });

  it("rejects paths outside configured admin API boundaries", async () => {
    await expect(
      adminFetch("/api/v1/public/categories", {
        baseUrl,
        fetcher: vi.fn() as unknown as typeof fetch,
      }),
    ).rejects.toMatchObject({
      code: "api_client.admin.path_forbidden",
    });
  });

  it("rejects caller-supplied authorization headers", async () => {
    await expect(
      adminFetch("/api/v1/admin/users", {
        baseUrl,
        fetcher: vi.fn() as unknown as typeof fetch,
        headers: {
          authorization: "Bearer secret",
        },
      }),
    ).rejects.toMatchObject({
      code: "api_client.admin.authorization_forbidden",
    });
  });

  it("retrieves and injects CSRF for mutations", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf-1", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: "user_1" }),
      ) as unknown as typeof fetch;

    await adminFetch("/api/v1/admin/users", {
      baseUrl,
      fetcher,
      method: "POST",
      body: { username: "admin" },
    });

    const mutationInit = vi.mocked(fetcher).mock.calls[1]?.[1];
    const headers = mutationInit?.headers as Headers;

    expect(headers.get("x-csrf-token")).toBe("csrf-1");
    expect(headers.get("content-type")).toBe("application/json");
    expect(mutationInit?.credentials).toBe("include");
    expect(mutationInit?.body).toBe(JSON.stringify({ username: "admin" }));
  });

  it("refreshes CSRF before mutations instead of trusting a cached header", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf-cached", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf-fresh", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: "user_1" }),
      ) as unknown as typeof fetch;

    await getAdminCsrfToken(baseUrl, fetcher);
    await adminFetch("/api/v1/admin/users/user_1", {
      baseUrl,
      fetcher,
      method: "PUT",
      body: { username: "admin" },
    });

    const mutationInit = vi.mocked(fetcher).mock.calls[2]?.[1];
    const headers = mutationInit?.headers as Headers;

    expect(vi.mocked(fetcher).mock.calls[0]?.[0]).toEqual(
      new URL("https://spring.test/api/v1/admin/auth/csrf"),
    );
    expect(vi.mocked(fetcher).mock.calls[1]?.[0]).toEqual(
      new URL("https://spring.test/api/v1/admin/auth/csrf"),
    );
    expect(headers.get("x-csrf-token")).toBe("csrf-fresh");
  });

  it("clears cached CSRF after unauthorized and forbidden responses", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf-1", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "unauthorized" } }, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf-2", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "forbidden" } }, 403),
      ) as unknown as typeof fetch;

    await expect(
      adminFetch("/api/v1/admin/users", { baseUrl, fetcher, method: "POST" }),
    ).rejects.toMatchObject({ code: "api_client.admin.unauthorized" });

    await expect(
      adminFetch("/api/v1/admin/users", { baseUrl, fetcher, method: "POST" }),
    ).rejects.toMatchObject({ code: "api_client.admin.forbidden" });

    expect(vi.mocked(fetcher).mock.calls[0]?.[0]).toEqual(
      new URL("https://spring.test/api/v1/admin/auth/csrf"),
    );
    expect(vi.mocked(fetcher).mock.calls[2]?.[0]).toEqual(
      new URL("https://spring.test/api/v1/admin/auth/csrf"),
    );
  });

  it("maps conflict responses to a stable admin error code", async () => {
    const flatError = {
      code: "DUPLICATE_CATEGORY_SLUG",
      fieldErrors: [{ field: "slug", message: "Slug already exists" }],
      message: "Category slug already exists",
      path: "/api/v1/admin/category-systems/catalogue/categories",
      timestamp: "2026-06-04T00:00:00Z",
    };
    const fetcher = vi.fn(async () =>
      jsonResponse(flatError, 409),
    ) as unknown as typeof fetch;

    await expect(
      adminFetch("/api/v1/admin/category-systems/catalogue/categories/1", {
        baseUrl,
        fetcher,
      }),
    ).rejects.toMatchObject({
      code: "api_client.admin.conflict",
      details: flatError,
      status: 409,
    });
  });

  it("throws a JSON parse error for invalid JSON responses", async () => {
    const fetcher = vi.fn(
      async () => new Response("{", { status: 200 }),
    ) as unknown as typeof fetch;

    await expect(
      adminFetch("/api/v1/admin/users", { baseUrl, fetcher }),
    ).rejects.toBeInstanceOf(JsonParseError);
  });

  it("uses a safe error type when CSRF payload is incomplete", async () => {
    clearAdminCsrfCache();

    const fetcher = vi.fn(async () =>
      jsonResponse({ token: "" }),
    ) as unknown as typeof fetch;

    await expect(
      adminFetch("/api/v1/admin/users", { baseUrl, fetcher, method: "POST" }),
    ).rejects.toBeInstanceOf(AdminApiClientError);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

it("preserves deliberate AbortError instead of a request failure", async () => {
  const abort = new DOMException("Cancelled", "AbortError");
  await expect(
    adminFetch("/api/v1/admin/users", {
      baseUrl,
      fetcher: async () => {
        throw abort;
      },
    }),
  ).rejects.toBe(abort);
});

it("forwards cancellation through fresh CSRF and never sends an aborted write", async () => {
  clearAdminCsrfCache();
  const controller = new AbortController();
  const calls: RequestInit[] = [];
  const fetcher: typeof fetch = async (_url, init) => {
    calls.push(init!);
    controller.abort();
    return jsonResponse({ token: "fresh", headerName: "X-CSRF-TOKEN" });
  };
  await expect(
    adminFetch("/api/v1/admin/users", {
      baseUrl,
      method: "POST",
      fetcher,
      signal: controller.signal,
    }),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(calls).toHaveLength(1);
  expect(calls[0]?.signal).toBe(controller.signal);
});

it("does not retry a cancelled write that may already have reached the server", async () => {
  clearAdminCsrfCache();
  const controller = new AbortController();
  let writes = 0;
  const fetcher: typeof fetch = async (url) => {
    if (String(url).endsWith("/csrf"))
      return jsonResponse({ token: "fresh", headerName: "X-CSRF-TOKEN" });
    writes++;
    controller.abort();
    return jsonResponse({ id: 1 });
  };
  await expect(
    adminFetch("/api/v1/admin/users", {
      baseUrl,
      method: "POST",
      signal: controller.signal,
      fetcher,
    }),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(writes).toBe(1);
});
