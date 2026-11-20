import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;
const tempDirs: string[] = [];

describe("env", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.resetModules();

    for (const tempDir of tempDirs.splice(0)) {
      rmSync(tempDir, { force: true, recursive: true });
    }
  });

  it.each([
    [undefined, "https://categorylisting.ferozfaiz.com", false],
    ["false", "https://categorylisting.ferozfaiz.com", false],
    ["true", "https://other.example.test", false],
    ["true", "https://categorylisting.ferozfaiz.com.evil.test", false],
    ["true", "https://categorylisting.ferozfaiz.com", true],
  ])(
    "limits demo mode to explicit opt-in at the approved origin",
    async (flag, origin, expected) => {
      process.env = { ...originalEnv, NEXT_PUBLIC_SPRING_API_BASE_URL: origin };
      delete process.env.CONFIG_PATH;
      delete process.env.NEXT_PUBLIC_PORTFOLIO_DEMO;
      if (flag !== undefined) process.env.NEXT_PUBLIC_PORTFOLIO_DEMO = flag;
      vi.stubGlobal("window", undefined);
      const env = await import("./env");
      expect(env.getPortfolioDemoEnabled()).toBe(expected);
    },
  );

  it("uses env vars before mounted runtime config", async () => {
    const configPath = createRuntimeConfig({
      next_public_spring_api_base_url: "https://runtime.spring.example.test",
      spring_api_base_url: "https://runtime.spring.example.test",
    });

    process.env = {
      ...originalEnv,
      CONFIG_PATH: configPath,
      NEXT_PUBLIC_SPRING_API_BASE_URL: "https://public.spring.example.test",
      SPRING_API_BASE_URL: "https://server.spring.example.test",
    };
    vi.stubGlobal("window", undefined);

    const { getPublicSpringApiBaseUrl, getSpringApiBaseUrl } =
      await import("./env");

    expect(getSpringApiBaseUrl()).toBe("https://server.spring.example.test");
    expect(getPublicSpringApiBaseUrl()).toBe(
      "https://public.spring.example.test",
    );
  });

  it("uses mounted runtime config when env vars are not set", async () => {
    const configPath = createRuntimeConfig({
      next_public_spring_api_base_url: "https://runtime-public.spring.test",
      spring_api_base_url: "https://runtime-server.spring.test",
    });

    process.env = {
      ...originalEnv,
      CONFIG_PATH: configPath,
    };
    delete process.env.NEXT_PUBLIC_SPRING_API_BASE_URL;
    delete process.env.SPRING_API_BASE_URL;
    vi.stubGlobal("window", undefined);

    const { getPublicSpringApiBaseUrl, getSpringApiBaseUrl } =
      await import("./env");

    expect(getSpringApiBaseUrl()).toBe("https://runtime-server.spring.test");
    expect(getPublicSpringApiBaseUrl()).toBe(
      "https://runtime-public.spring.test",
    );
  });
  it("does not use the private server address as the browser URL", async () => {
    process.env = {
      ...originalEnv,
      SPRING_API_BASE_URL: "http://private-backend:8080",
    };
    delete process.env.CONFIG_PATH;
    delete process.env.NEXT_PUBLIC_SPRING_API_BASE_URL;
    vi.stubGlobal("window", undefined);
    const env = await import("./env");
    expect(env.getPublicSpringApiBaseUrl()).toBe("http://localhost:3000");
  });

  it("keeps a frozen loaded snapshot until the process/module is restarted", async () => {
    const configPath = createRuntimeConfig({
      spring_api_base_url: "http://first:8080",
      next_public_spring_api_base_url: "http://localhost:3000",
    });
    process.env = { ...originalEnv, CONFIG_PATH: configPath };
    delete process.env.SPRING_API_BASE_URL;
    vi.stubGlobal("window", undefined);
    const env = await import("./env");
    expect(Object.isFrozen(env.getServerEnv())).toBe(true);
    writeFileSync(
      configPath,
      JSON.stringify({ spring_api_base_url: "http://second:8080" }),
    );
    expect(env.getSpringApiBaseUrl()).toBe("http://first:8080");
  });

  it("fails closed when the required server setting is absent", async () => {
    process.env = { ...originalEnv };
    delete process.env.CONFIG_PATH;
    delete process.env.SPRING_API_BASE_URL;
    vi.stubGlobal("window", undefined);
    const env = await import("./env");
    expect(() => env.getSpringApiBaseUrl()).toThrow();
  });

  it.each([
    undefined,
    "http://admin.example.test",
    "https://localhost:3000",
    "https://127.0.0.1",
    "https://user:private-sentinel@admin.example.test",
    "https://admin.example.test/admin",
    "https://admin.example.test?token=private-sentinel",
    "https://admin.example.test#fragment",
  ])("rejects missing or unsafe production browser origins", async (origin) => {
    process.env = { ...originalEnv, NODE_ENV: "production" };
    delete process.env.CONFIG_PATH;
    delete process.env.NEXT_PUBLIC_SPRING_API_BASE_URL;
    if (origin !== undefined)
      process.env.NEXT_PUBLIC_SPRING_API_BASE_URL = origin;
    vi.stubGlobal("window", undefined);
    const env = await import("./env");
    expect(() => env.getPublicSpringApiBaseUrl()).toThrow();
  });

  it("accepts the explicit HTTPS admin origin in production", async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      NEXT_PUBLIC_SPRING_API_BASE_URL: "https://admin.example.test",
    };
    delete process.env.CONFIG_PATH;
    vi.stubGlobal("window", undefined);
    const env = await import("./env");
    expect(env.getPublicSpringApiBaseUrl()).toBe("https://admin.example.test");
  });
});

function createRuntimeConfig(config: Record<string, unknown>): string {
  const tempDir = mkdtempSync(join(tmpdir(), "tgp-env-"));
  const configPath = join(tempDir, "config.json");

  tempDirs.push(tempDir);
  writeFileSync(configPath, JSON.stringify(config), "utf8");

  return configPath;
}
