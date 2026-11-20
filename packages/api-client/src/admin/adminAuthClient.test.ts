import { describe, expect, it, vi } from "vitest";

import { createAdminAuthClient } from "./adminAuthClient";
import { clearAdminCsrfCache } from "./adminFetch";

const baseUrl = "https://spring.test";

describe("adminAuthClient", () => {
  it("retrieves CSRF and submits login as backend-compatible form data", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-xsrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ authenticated: true }),
      ) as unknown as typeof fetch;

    const client = createAdminAuthClient({ baseUrl, fetcher });

    await expect(
      client.login({
        usernameOrEmail: "admin@example.com",
        password: "secret",
      }),
    ).resolves.toEqual({ authenticated: true });

    const loginCall = vi.mocked(fetcher).mock.calls[1];
    const loginInit = loginCall?.[1];
    const headers = loginInit?.headers as Headers;

    expect(loginCall?.[0]).toEqual(
      new URL("https://spring.test/api/v1/admin/auth/login"),
    );
    expect(headers.get("content-type")).toBe(
      "application/x-www-form-urlencoded",
    );
    expect(headers.get("x-xsrf-token")).toBe("csrf");
    expect(String(loginInit?.body)).toBe(
      "username=admin%40example.com&password=secret",
    );
  });

  it("loads the admin identity", async () => {
    const identity = {
      id: "admin_1",
      username: "admin",
      roles: ["ADMIN"],
      permissions: ["admin:access"],
      sessionScope: "admin",
    };
    const fetcher = vi.fn(async () =>
      jsonResponse(identity),
    ) as unknown as typeof fetch;
    const client = createAdminAuthClient({ baseUrl, fetcher });

    await expect(client.me()).resolves.toEqual(identity);
  });

  it("clears cached CSRF on logout", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf-1", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(jsonResponse({ success: true }))
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf-2", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ authenticated: true }),
      ) as unknown as typeof fetch;

    const client = createAdminAuthClient({ baseUrl, fetcher });

    await client.logout();
    await client.login({ usernameOrEmail: "admin", password: "secret" });

    expect(vi.mocked(fetcher).mock.calls[0]?.[0]).toEqual(
      new URL("https://spring.test/api/v1/admin/auth/csrf"),
    );
    expect(vi.mocked(fetcher).mock.calls[2]?.[0]).toEqual(
      new URL("https://spring.test/api/v1/admin/auth/csrf"),
    );
  });

  it("maps conflicts to safe admin errors", async () => {
    clearAdminCsrfCache();

    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ token: "csrf", headerName: "x-csrf-token" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "stale" } }, 409),
      ) as unknown as typeof fetch;

    const client = createAdminAuthClient({ baseUrl, fetcher });

    await expect(
      client.login({ usernameOrEmail: "admin", password: "secret" }),
    ).rejects.toMatchObject({
      code: "api_client.admin.conflict",
    });
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
