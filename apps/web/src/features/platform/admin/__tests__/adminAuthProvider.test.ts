import { describe, expect, it, vi } from "vitest";

import { createAdminAuthProvider } from "../providers/adminAuthProvider";
import {
  clearAdminIdentity,
  getAdminIdentity,
  setAdminIdentity,
} from "../session/adminIdentityStore";
import type { AdminIdentity } from "../types/admin.types";

describe("adminAuthProvider", () => {
  it("logs in, loads identity, stores safe identity state, and redirects by locale", async () => {
    clearAdminIdentity();

    const authClient = fakeAuthClient({
      identity: identity({ roles: ["ADMIN"], permissions: ["admin:access"] }),
    });
    const provider = createAdminAuthProvider({ authClient, locale: "fr-CA" });

    await expect(
      provider.login?.({ usernameOrEmail: "admin", password: "secret" }),
    ).resolves.toEqual({
      success: true,
      redirectTo: "/fr-CA/admin",
    });

    expect(authClient.login).toHaveBeenCalledWith({
      usernameOrEmail: "admin",
      password: "secret",
    });
    expect(getAdminIdentity()).toMatchObject({
      username: "admin",
      roles: ["ADMIN"],
    });
  });

  it("returns a safe failed login result for invalid credentials", async () => {
    clearAdminIdentity();

    const authClient = fakeAuthClient({
      loginError: new Error("backend details"),
    });
    const provider = createAdminAuthProvider({ authClient, locale: "en-CA" });

    await expect(
      provider.login?.({ usernameOrEmail: "admin", password: "wrong" }),
    ).resolves.toMatchObject({
      success: false,
      error: {
        name: "AdminLoginError",
      },
    });

    expect(getAdminIdentity()).toBeNull();
  });

  it("reports admin API setup failures separately during login", async () => {
    clearAdminIdentity();

    const authClient = fakeAuthClient({
      loginError: Object.assign(new Error("network unavailable"), {
        code: "api_client.request.failed",
      }),
    });
    const provider = createAdminAuthProvider({ authClient, locale: "en-CA" });

    await expect(
      provider.login?.({ usernameOrEmail: "admin", password: "secret" }),
    ).resolves.toMatchObject({
      success: false,
      error: {
        name: "AdminApiUnavailableError",
      },
    });

    expect(getAdminIdentity()).toBeNull();
  });

  it("reports session verification failures separately after login succeeds", async () => {
    clearAdminIdentity();

    const authClient = fakeAuthClient({
      meError: new Error("session cookie missing"),
    });
    const provider = createAdminAuthProvider({ authClient, locale: "en-CA" });

    await expect(
      provider.login?.({ usernameOrEmail: "admin", password: "secret" }),
    ).resolves.toMatchObject({
      success: false,
      error: {
        name: "AdminSessionVerificationError",
      },
    });

    expect(authClient.login).toHaveBeenCalledWith({
      usernameOrEmail: "admin",
      password: "secret",
    });
    expect(getAdminIdentity()).toBeNull();
  });

  it("returns a safe forbidden result when the loaded identity lacks admin access", async () => {
    clearAdminIdentity();

    const authClient = fakeAuthClient({
      identity: identity(),
    });
    const provider = createAdminAuthProvider({ authClient, locale: "en-CA" });

    await expect(
      provider.login?.({ usernameOrEmail: "viewer", password: "secret" }),
    ).resolves.toMatchObject({
      success: false,
      redirectTo: "/en-CA/admin/login",
      error: {
        name: "AdminForbiddenError",
      },
    });

    expect(authClient.logout).toHaveBeenCalled();
    expect(getAdminIdentity()).toBeNull();
  });

  it("logs out and clears identity state", async () => {
    setAdminIdentity(identity({ roles: ["ADMIN"] }));

    const authClient = fakeAuthClient();
    const provider = createAdminAuthProvider({ authClient, locale: "en-US" });

    await expect(provider.logout?.({})).resolves.toEqual({
      success: true,
      redirectTo: "/en-US/admin/login",
    });
    expect(getAdminIdentity()).toBeNull();
  });

  it("redirects confirmed expired sessions and distinguishes denied identities", async () => {
    clearAdminIdentity();

    const staleProvider = createAdminAuthProvider({
      authClient: fakeAuthClient({
        meError: Object.assign(new Error("expired"), { status: 401 }),
      }),
      locale: "en-CA",
    });
    const nonAdminProvider = createAdminAuthProvider({
      authClient: fakeAuthClient({ identity: identity() }),
      locale: "en-CA",
    });

    await expect(staleProvider.check?.()).resolves.toMatchObject({
      authenticated: false,
      logout: true,
      redirectTo: "/en-CA/admin/login",
    });
    await expect(nonAdminProvider.check?.()).resolves.toMatchObject({
      authenticated: false,
      logout: false,
      error: { name: "AdminForbiddenError" },
    });
  });

  it("returns stored permissions and handles auth errors by clearing session state", async () => {
    setAdminIdentity(
      identity({ permissions: ["admin:catalogue-categories:read"] }),
    );

    const provider = createAdminAuthProvider({
      authClient: fakeAuthClient(),
      locale: "en-CA",
    });

    await expect(provider.getPermissions?.()).resolves.toEqual([
      "admin:catalogue-categories:read",
    ]);
    await expect(provider.onError?.({ status: 401 })).resolves.toMatchObject({
      logout: true,
      redirectTo: "/en-CA/admin/login",
    });
    expect(getAdminIdentity()).toBeNull();
  });

  it("keeps admin identity on forbidden resource errors", async () => {
    setAdminIdentity(identity({ permissions: ["admin:users:read"] }));

    const authClient = fakeAuthClient();
    const provider = createAdminAuthProvider({
      authClient,
      locale: "en-CA",
    });

    await expect(provider.onError?.({ status: 403 })).resolves.toEqual({});
    expect(getAdminIdentity()).toMatchObject({
      permissions: ["admin:users:read"],
    });
    expect(authClient.clearCsrfToken).toHaveBeenCalled();
    expect(authClient.logout).not.toHaveBeenCalled();
  });
});

function identity(overrides: Partial<AdminIdentity> = {}): AdminIdentity {
  return {
    id: "admin_1",
    username: "admin",
    roles: [],
    permissions: [],
    sessionScope: "admin",
    ...overrides,
  };
}

function fakeAuthClient(
  options: {
    identity?: AdminIdentity;
    loginError?: Error;
    meError?: Error;
  } = {},
) {
  return {
    getCsrfToken: vi.fn(),
    login: vi.fn(
      async (credentials: { usernameOrEmail: string; password: string }) => {
        if (options.loginError) {
          throw options.loginError;
        }

        return { authenticated: true, credentials };
      },
    ),
    logout: vi.fn(async () => ({ success: true })),
    me: vi.fn(async () => {
      if (options.meError) {
        throw options.meError;
      }

      return options.identity ?? identity({ roles: ["ADMIN"] });
    }),
    clearCsrfToken: vi.fn(),
  };
}

it.each([undefined, 500, 503, 403])(
  "does not log out or redirect on verification failure %s",
  async (status) => {
    setAdminIdentity(identity({ roles: ["ADMIN"] }));
    const authClient = fakeAuthClient({
      meError: Object.assign(new Error("private diagnostics"), { status }),
    });
    const provider = createAdminAuthProvider({ authClient, locale: "fr-CA" });
    const result = await provider.check();
    expect(result).toMatchObject({
      authenticated: false,
      logout: false,
      error: {
        name:
          status === 403
            ? "AdminForbiddenError"
            : "AdminServiceUnavailableError",
      },
    });
    expect(result.redirectTo).toBeUndefined();
    expect(result.error?.message).not.toContain("private diagnostics");
    expect(authClient.logout).not.toHaveBeenCalled();
    expect(getAdminIdentity()).toBeNull();
  },
);

it("does not let getIdentity bypass failed verification by fetching again", async () => {
  const authClient = fakeAuthClient({ meError: new Error("offline") });
  const provider = createAdminAuthProvider({ authClient, locale: "en-CA" });
  await provider.check();
  authClient.me.mockClear();
  await expect(provider.getIdentity?.()).resolves.toBeNull();
  expect(authClient.me).not.toHaveBeenCalled();
});

it("does not let an older check restore identity after a newer denial", async () => {
  const authClient = fakeAuthClient();
  let finish!: (value: AdminIdentity) => void;
  authClient.me.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const provider = createAdminAuthProvider({ authClient, locale: "en-CA" });
  const older = provider.check();
  const cancelled = expect(older).resolves.toEqual({
    authenticated: false,
    logout: false,
  });
  authClient.me.mockRejectedValueOnce(
    Object.assign(new Error("denied"), { status: 403 }),
  );
  await provider.check();
  finish(identity({ roles: ["ADMIN"] }));
  await cancelled;
  expect(getAdminIdentity()).toBeNull();
});

it.each([401, 403])(
  "ignores a late resource %s from an inactive provider",
  async (status) => {
    const authClient = fakeAuthClient();
    const onCheck = vi.fn();
    let active = true;
    const provider = createAdminAuthProvider({
      authClient,
      locale: "en-CA",
      onCheck,
      isActive: () => active,
    });
    await provider.check();
    onCheck.mockClear();
    active = false;
    setAdminIdentity(identity({ username: "new-session", roles: ["ADMIN"] }));

    await expect(provider.onError?.({ status })).resolves.toEqual({});
    expect(getAdminIdentity()?.username).toBe("new-session");
    expect(authClient.clearCsrfToken).not.toHaveBeenCalled();
    expect(onCheck).not.toHaveBeenCalled();
  },
);
